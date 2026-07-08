// Camera rig — isometric + zoom rail + limited orbit (camera.md). Render-side only: consumes
// interpolated player position, zero sim coupling. `railSample` is a pure function of the zoom
// scalar (unit-tested against the camera.md keyframe table).

import * as THREE from "three";

export interface RailSample {
  dist: number; // metres
  pitch: number; // degrees below horizontal
  fov: number; // degrees
}

// The zoom-rail keyframes (camera.md). Framing stays composed at every stop.
const KEYS: readonly (RailSample & { z: number })[] = [
  { z: 0.0, dist: 4, pitch: 18, fov: 50 },
  { z: 0.35, dist: 10, pitch: 38, fov: 45 },
  { z: 0.7, dist: 18, pitch: 52, fov: 40 },
  { z: 1.0, dist: 28, pitch: 58, fov: 36 },
];

const DETENTS = 14;
export const DEFAULT_ZOOM = 0.7;
const MAX_ORBIT = Math.PI / 4; // ±45°

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/** Sample (dist, pitch, fov) for zoom scalar z∈[0,1]; passes exactly through the keyframes. */
export function railSample(z: number): RailSample {
  const zc = clamp(z, 0, 1);
  let seg = 0;
  while (seg < KEYS.length - 2 && zc > (KEYS[seg + 1] as { z: number }).z) seg += 1;
  const k1 = KEYS[seg] as RailSample & { z: number };
  const k2 = KEYS[seg + 1] as RailSample & { z: number };
  const k0 = (KEYS[seg - 1] ?? k1) as RailSample & { z: number };
  const k3 = (KEYS[seg + 2] ?? k2) as RailSample & { z: number };
  const t = k2.z === k1.z ? 0 : (zc - k1.z) / (k2.z - k1.z);
  return {
    dist: catmullRom(k0.dist, k1.dist, k2.dist, k3.dist, t),
    pitch: catmullRom(k0.pitch, k1.pitch, k2.pitch, k3.pitch, t),
    fov: catmullRom(k0.fov, k1.fov, k2.fov, k3.fov, t),
  };
}

/** Critically-damped-ish exponential smoothing (no overshoot). */
function smooth(cur: number, target: number, dt: number, smoothTime: number): number {
  if (smoothTime <= 0 || dt <= 0) return target;
  return cur + (target - cur) * (1 - Math.exp(-dt / smoothTime));
}

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private z = DEFAULT_ZOOM;
  private yaw = 0;
  private yawTarget = 0;
  private readonly target = new THREE.Vector3();
  private dist: number;
  private pitchRad: number;
  private fov: number;
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();

  constructor(aspect: number) {
    const s = railSample(this.z);
    this.dist = s.dist;
    this.pitchRad = THREE.MathUtils.degToRad(s.pitch);
    this.fov = s.fov;
    this.camera = new THREE.PerspectiveCamera(s.fov, aspect, 0.1, 2000);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Wheel zoom: move `detents` steps along the 14-detent rail. */
  zoomByDetents(detents: number): void {
    this.z = clamp(this.z + detents / (DETENTS - 1), 0, 1);
  }

  resetZoom(): void {
    this.z = DEFAULT_ZOOM;
  }

  /** Orbit within ±45° of home. */
  orbitBy(dYaw: number): void {
    this.yawTarget = clamp(this.yawTarget + dYaw, -MAX_ORBIT, MAX_ORBIT);
  }

  resetYaw(): void {
    this.yawTarget = 0;
  }

  get zoom(): number {
    return this.z;
  }

  /** Follow the (already interpolated) target each render frame. */
  update(tx: number, ty: number, tz: number, dt: number): void {
    // target follow (a touch of look-ahead could be added later)
    this.target.x = smooth(this.target.x, tx, dt, 0.12);
    this.target.y = smooth(this.target.y, ty, dt, 0.12);
    this.target.z = smooth(this.target.z, tz, dt, 0.12);
    this.yaw = smooth(this.yaw, this.yawTarget, dt, 0.2);

    const rail = railSample(this.z);
    this.dist = smooth(this.dist, rail.dist, dt, 0.2);
    this.fov = smooth(this.fov, rail.fov, dt, 0.2);
    this.pitchRad = smooth(this.pitchRad, THREE.MathUtils.degToRad(rail.pitch), dt, 0.2);

    const cp = Math.cos(this.pitchRad);
    const sp = Math.sin(this.pitchRad);
    const bx = cp * Math.sin(this.yaw) * this.dist;
    const by = sp * this.dist;
    const bz = cp * Math.cos(this.yaw) * this.dist;
    this.camera.position.set(this.target.x + bx, this.target.y + by, this.target.z + bz);
    this.camera.lookAt(this.target);
    if (Math.abs(this.camera.fov - this.fov) > 1e-4) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Ground-plane pick: NDC (−1..1) → world (x,z) on the plane y=groundY (camera.md fairness). */
  pickGround(ndcX: number, ndcY: number, groundY: number): { x: number; z: number } | null {
    this.ndc.set(ndcX, ndcY);
    this.ray.setFromCamera(this.ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    const hit = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(plane, hit) === null) return null;
    return { x: hit.x, z: hit.z };
  }
}
