// Terrain layer (G0) — chunked vertex-coloured heightfield.
//
// Renderer-side only: terrain shape comes exclusively through the seam (`world.zone()` for the
// extent, `world.terrainHeight(x, z)` per vertex) — never from `src/sim`. Ground is split into
// 32 m chunks (graphics-plan §6 / performance-budget chunk size) so each chunk frustum-culls on
// its own. Baked vertex AO (a cheap concavity darkening) is written into the `color` attribute
// so it survives with no post pass (graphics-plan §6 "baked vertex AO").

import * as THREE from "three";
import type { IWorld } from "../world_api.ts";
import type { Materials } from "./materials.ts";

const CHUNK = 32; // metres per terrain chunk edge

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Stable render-only value hash in [0,1) — cosmetic tint variation, never a sim RNG stream. */
function hash2(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class Terrain {
  readonly group: THREE.Group;
  private readonly materials: Materials;

  constructor(materials: Materials) {
    this.group = new THREE.Group();
    this.group.name = "TerrainLayer";
    this.materials = materials;
  }

  build(world: IWorld): void {
    this.dispose();
    const zone = world.zone();
    const { widthM, depthM } = zone;
    const mat = this.materials.terrain();
    const chunksX = Math.max(1, Math.ceil(widthM / CHUNK));
    const chunksZ = Math.max(1, Math.ceil(depthM / CHUNK));

    for (let cz = 0; cz < chunksZ; cz++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const x0 = cx * CHUNK;
        const z0 = cz * CHUNK;
        const w = Math.min(CHUNK, widthM - x0);
        const d = Math.min(CHUNK, depthM - z0);
        if (w <= 0 || d <= 0) continue;
        this.group.add(this.buildChunk(world, x0, z0, w, d, mat));
      }
    }
  }

  /** One chunk mesh subdivided at ~1 m resolution, displaced + vertex-coloured. */
  private buildChunk(
    world: IWorld,
    x0: number,
    z0: number,
    w: number,
    d: number,
    mat: THREE.Material,
  ): THREE.Mesh {
    const segX = Math.max(1, Math.round(w));
    const segZ = Math.max(1, Math.round(d));
    const geo = new THREE.PlaneGeometry(w, d, segX, segZ);
    geo.rotateX(-Math.PI / 2); // lie flat on the X/Z plane, Y up

    const centreX = x0 + w / 2;
    const centreZ = z0 + d / 2;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const nx = segX + 1;
    const nz = segZ + 1;
    const heights = new Float32Array(nx * nz);

    for (let i = 0; i < pos.count; i++) {
      const wx = centreX + pos.getX(i);
      const wz = centreZ + pos.getZ(i);
      const h = world.terrainHeight(wx, wz);
      pos.setY(i, h);
      heights[i] = h;
    }
    pos.needsUpdate = true;

    const colors = new Float32Array(pos.count * 3);
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const i = iz * nx + ix;
        const hC = heights[i] ?? 0;
        const hL = heights[iz * nx + Math.max(ix - 1, 0)] ?? hC;
        const hR = heights[iz * nx + Math.min(ix + 1, nx - 1)] ?? hC;
        const hU = heights[Math.max(iz - 1, 0) * nx + ix] ?? hC;
        const hD = heights[Math.min(iz + 1, nz - 1) * nx + ix] ?? hC;

        // Concavity (discrete Laplacian): valleys darken, ridges lift — a cheap baked AO.
        const lap = hC - (hL + hR + hU + hD) * 0.25;
        const ao = clamp(0.8 + lap * 0.5, 0.55, 1.05);

        const wx = centreX + pos.getX(i);
        const wz = centreZ + pos.getZ(i);
        const n = hash2(Math.floor(wx * 0.6), Math.floor(wz * 0.6));
        colors[i * 3] = clamp((0.29 + (1 - n) * 0.05) * ao, 0, 1);
        colors[i * 3 + 1] = clamp((0.31 + n * 0.06) * ao, 0, 1);
        colors[i * 3 + 2] = clamp((0.22 + n * 0.03) * ao, 0, 1);
      }
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `chunk_${x0}_${z0}`;
    mesh.position.set(centreX, 0, centreZ);
    // frustumCulled defaults true — leave it so off-screen chunks skip (performance-budget).
    return mesh;
  }

  dispose(): void {
    for (const child of this.group.children) {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    }
    this.group.clear();
  }
}
