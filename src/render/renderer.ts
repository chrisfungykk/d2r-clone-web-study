// Renderer v0 (G0) — the app-side view of `IWorld`.
//
// Renderer-side only: imports `three` and `../world_api.ts` and NOTHING from `src/sim`. Holds no
// gameplay state and computes no mechanics (rendering.md "what the renderer may never do"). One
// WebGLRenderer, one Scene, explicit layer Groups (Terrain / Prop / Sky / Entity). G0 scope per
// graphics-plan §8: Lambert materials, vertex-colour terrain, NO composer / post / IBL / shadows.

import * as THREE from "three";
import type { IWorld } from "../world_api.ts";
import { CameraRig } from "./camera.ts";
import { Entities } from "./entities.ts";
import { Materials } from "./materials.ts";
import { Props } from "./props.ts";
import { Sky } from "./sky.ts";
import { Terrain } from "./terrain.ts";

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class Renderer {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly rig: CameraRig;

  private readonly materials: Materials;
  private readonly terrain: Terrain;
  private readonly props: Props;
  private readonly sky: Sky;
  private readonly entities = new Entities();

  private readonly terrainLayer = new THREE.Group();
  private readonly propLayer = new THREE.Group();
  private readonly skyLayer = new THREE.Group();

  private readonly key: THREE.DirectionalLight;

  private lastT = 0;
  private playerX = 0;
  private playerY = 0;
  private playerZ = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(this.width(), this.height());
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.rig = new CameraRig(this.width() / this.height());

    this.terrainLayer.name = "TerrainLayer";
    this.propLayer.name = "PropLayer";
    this.skyLayer.name = "SkyLayer";
    this.scene.add(this.terrainLayer, this.propLayer, this.skyLayer, this.entities.group);

    this.materials = new Materials();
    this.terrain = new Terrain(this.materials);
    this.props = new Props(this.materials);
    this.sky = new Sky();
    this.terrainLayer.add(this.terrain.group);
    this.propLayer.add(this.props.group);
    this.skyLayer.add(this.sky.group);

    this.key = new THREE.DirectionalLight(0xffe8c0, 2.2);
    const hemi = new THREE.HemisphereLight(0x6b7a8f, 0x2a2622, 0.55);
    this.scene.add(this.key, this.key.target, hemi);
  }

  /** Build terrain + props + sky for the current zone. Camera then follows the player. */
  buildZone(world: IWorld): void {
    const zone = world.zone();
    this.terrain.build(world);
    this.props.build(world);
    this.sky.apply(this.scene);

    const cx = zone.widthM / 2;
    const cz = zone.depthM / 2;
    this.sky.group.position.set(cx, 0, cz);
    this.key.position.set(cx - 60, 90, cz - 40);
    this.key.target.position.set(cx, 0, cz);
    this.key.target.updateMatrixWorld();

    const p = world.player(0);
    this.playerX = p.x;
    this.playerY = world.terrainHeight(p.x, p.z);
    this.playerZ = p.z;
  }

  render(world: IWorld, alpha: number): void {
    const now = performance.now() * 0.001;
    const dt = this.lastT > 0 ? Math.min(0.1, now - this.lastT) : 1 / 60;
    this.lastT = now;

    this.entities.update(world, alpha);
    this.trackPlayer(world, alpha);
    this.rig.update(this.playerX, this.playerY + 1.0, this.playerZ, dt);
    this.renderer.render(this.scene, this.rig.camera);
  }

  private trackPlayer(world: IWorld, alpha: number): void {
    const cur = world.snapshot();
    const prev = world.prevSnapshot();
    let px = this.playerX;
    let pz = this.playerZ;
    for (const e of cur.entities) {
      if (e.kind !== "player") continue;
      let prevE: { x: number; z: number } | undefined;
      for (const q of prev.entities) {
        if (q.id === e.id) {
          prevE = { x: q.x, z: q.z };
          break;
        }
      }
      px = prevE ? lerp(prevE.x, e.x, alpha) : e.x;
      pz = prevE ? lerp(prevE.z, e.z, alpha) : e.z;
      break;
    }
    this.playerX = px;
    this.playerZ = pz;
    this.playerY = world.terrainHeight(px, pz);
  }

  // ── input passthroughs (used by src/game/input.ts) ──────────────────────────────────────
  /** Convert a client point to a ground-plane world (x,z) at the player's height. */
  pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    return this.rig.pickGround(ndcX, ndcY, this.playerY);
  }

  zoomByDetents(detents: number): void {
    this.rig.zoomByDetents(detents);
  }

  orbitBy(dYaw: number): void {
    this.rig.orbitBy(dYaw);
  }

  resetZoom(): void {
    this.rig.resetZoom();
  }

  resetYaw(): void {
    this.rig.resetYaw();
  }

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /** Draw calls + triangles from the last render (perf overlay / harness). */
  info(): { draws: number; tris: number } {
    const r = this.renderer.info.render;
    return { draws: r.calls, tris: r.triangles };
  }

  resize(): void {
    const w = this.width();
    const h = this.height();
    this.rig.setAspect(w / h);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    this.terrain.dispose();
    this.props.dispose();
    this.sky.dispose();
    this.entities.dispose();
    this.materials.dispose();
    this.renderer.dispose();
    this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
  }

  private width(): number {
    return this.container.clientWidth || 1;
  }

  private height(): number {
    return this.container.clientHeight || 1;
  }
}
