// Prop layer (G0) — one InstancedMesh per archetype.
//
// Renderer-side only: placements come through the seam (`world.zone().props`); heights come from
// `world.terrainHeight`. Each archetype is a parametric geometry (tree = trunk+canopy merged,
// rock = low-poly icosahedron, ruin = a few boxes merged) drawn once as an `InstancedMesh`
// (rendering.md "InstancedMesh everywhere"). Per-instance luminance jitter via `instanceColor`
// keeps a scattered set from reading as clones while staying in the low-chroma band (pillar 2).

import * as THREE from "three";
import type { DeepReadonly, IWorld, ZonePropView } from "../world_api.ts";
import type { Materials } from "./materials.ts";

type PropView = DeepReadonly<ZonePropView>;

/** Stable render-only value hash in [0,1) — cosmetic jitter only, never a sim RNG stream. */
function hash2(x: number, z: number): number {
  const s = Math.sin(x * 269.5 + z * 183.3) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Concatenate the position attributes of several geometries into one non-indexed geometry and
 * recompute flat normals. Replaces BufferGeometryUtils.mergeGeometries (an examples/jsm addon,
 * banned at G0 — core three only).
 */
function mergePositions(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const arrays: Float32Array[] = [];
  let total = 0;
  for (const part of parts) {
    const flat = part.toNonIndexed();
    const arr = (flat.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    arrays.push(arr);
    total += arr.length;
    flat.dispose();
    part.dispose();
  }
  const positions = new Float32Array(total);
  let offset = 0;
  for (const arr of arrays) {
    positions.set(arr, offset);
    offset += arr.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Parametric geometry per archetype; base sits at y = 0 so it drops onto the terrain height. */
function buildGeometry(kind: string): THREE.BufferGeometry {
  switch (kind) {
    case "tree": {
      const trunk = new THREE.CylinderGeometry(0.12, 0.2, 1.2, 6).translate(0, 0.6, 0);
      const canopy = new THREE.ConeGeometry(0.75, 1.7, 7).translate(0, 1.85, 0);
      return mergePositions([trunk, canopy]);
    }
    case "rock":
      return new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.35, 0);
    case "ruin": {
      const left = new THREE.BoxGeometry(0.45, 1.5, 0.45).translate(-0.55, 0.75, 0);
      const right = new THREE.BoxGeometry(0.45, 0.95, 0.45).translate(0.55, 0.48, 0.1);
      const lintel = new THREE.BoxGeometry(1.55, 0.35, 0.4).translate(0, 1.55, 0.05);
      return mergePositions([left, right, lintel]);
    }
    default:
      return new THREE.BoxGeometry(0.6, 0.6, 0.6).translate(0, 0.3, 0);
  }
}

export class Props {
  readonly group: THREE.Group;
  private readonly materials: Materials;

  constructor(materials: Materials) {
    this.group = new THREE.Group();
    this.group.name = "PropLayer";
    this.materials = materials;
  }

  build(world: IWorld): void {
    this.dispose();

    // Group placements by archetype so each archetype becomes a single instanced draw.
    const byKind = new Map<string, PropView[]>();
    for (const prop of world.zone().props) {
      const list = byKind.get(prop.archetype);
      if (list === undefined) byKind.set(prop.archetype, [prop]);
      else list.push(prop);
    }

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();

    for (const [kind, placements] of byKind) {
      if (placements.length === 0) continue;
      const geo = buildGeometry(kind);
      const mat = this.materials.prop(kind);
      const mesh = new THREE.InstancedMesh(geo, mat, placements.length);
      mesh.name = `props_${kind}`;

      for (let i = 0; i < placements.length; i++) {
        const p = placements[i];
        if (p === undefined) continue;
        position.set(p.x, world.terrainHeight(p.x, p.z), p.z);
        quat.setFromAxisAngle(up, p.facing);
        scale.setScalar(p.scale);
        matrix.compose(position, quat, scale);
        mesh.setMatrixAt(i, matrix);

        // Luminance-only jitter multiplies the material colour → varies brightness, keeps hue.
        const j = 0.82 + hash2(p.x, p.z) * 0.32;
        color.setRGB(j, j, j);
        mesh.setColorAt(i, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor !== null) mesh.instanceColor.needsUpdate = true;
      this.group.add(mesh);
    }
  }

  dispose(): void {
    for (const child of this.group.children) {
      if (child instanceof THREE.InstancedMesh) {
        child.geometry.dispose();
        child.dispose();
      }
    }
    this.group.clear();
  }
}
