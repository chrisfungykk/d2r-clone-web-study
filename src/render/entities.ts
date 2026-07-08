// Entity layer (G0/B6) — procedural capsule rigs, pooled, interpolated between the two most
// recent sim snapshots. Render-side only: imports three + the seam, never src/sim. Logical
// anim state comes from the sim (world-seam.md rule 3); the bob/lean here is cosmetic.

import * as THREE from "three";
import type { IWorld } from "../world_api.ts";

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export class Entities {
  readonly group = new THREE.Group();
  private readonly pool = new Map<number, THREE.Mesh>();
  private readonly geo = new THREE.CapsuleGeometry(0.35, 0.9, 4, 8);
  private readonly playerMat = new THREE.MeshLambertMaterial({ color: 0xb8a67a });
  private readonly monsterMat = new THREE.MeshLambertMaterial({ color: 0x6a4b4b });

  constructor() {
    this.group.name = "EntityLayer";
  }

  private meshFor(id: number, isPlayer: boolean): THREE.Mesh {
    let m = this.pool.get(id);
    if (m === undefined) {
      m = new THREE.Mesh(this.geo, isPlayer ? this.playerMat : this.monsterMat);
      m.castShadow = false;
      this.pool.set(id, m);
      this.group.add(m);
    }
    return m;
  }

  /** Place each in-AoI entity, interpolating position between prev and cur by alpha. */
  update(world: IWorld, alpha: number): void {
    const cur = world.snapshot();
    const prev = world.prevSnapshot();
    const prevById = new Map<number, { x: number; z: number }>();
    for (const e of prev.entities) prevById.set(e.id, { x: e.x, z: e.z });

    const seen = new Set<number>();
    for (const e of cur.entities) {
      seen.add(e.id);
      const p = prevById.get(e.id);
      const x = p ? lerp(p.x, e.x, alpha) : e.x;
      const z = p ? lerp(p.z, e.z, alpha) : e.z;
      const y = world.terrainHeight(x, z);
      const mesh = this.meshFor(e.id, e.kind === "player");
      // cosmetic run bob from the sim-owned anim frame
      const bob =
        e.anim.state === "run"
          ? Math.abs(Math.sin((e.anim.frame / Math.max(1, e.anim.totalFrames)) * Math.PI)) * 0.1
          : 0;
      mesh.position.set(x, y + 0.9 + bob, z);
      mesh.rotation.y = -e.facing;
      mesh.visible = true;
    }
    for (const [id, mesh] of this.pool) if (!seen.has(id)) mesh.visible = false;
  }

  dispose(): void {
    this.geo.dispose();
    this.playerMat.dispose();
    this.monsterMat.dispose();
    for (const m of this.pool.values()) this.group.remove(m);
    this.pool.clear();
  }
}
