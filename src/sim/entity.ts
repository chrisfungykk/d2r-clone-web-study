// Entity store — fixed-capacity pool, free-list recycled (simulation-runtime.md).
//
// Determinism-critical rules:
//   • Ids are monotonic uint32, never reused within a session; slots recycle immediately.
//   • Iteration order is ID order (never slot order), so free-list slot reuse can never
//     perturb replay hashes. `live()` returns the id-ordered live list; the id→entity Map is
//     used only for O(1) lookups (never iterated order-sensitively).
//   • Components are plain objects, created at spawn and mutated in place — no steady-state
//     allocation once spawned.

import type { AnimState, EntityId, EntityKind } from "../world_api.ts";

export interface Transform {
  x: number; // metres (float)
  z: number;
  facing: number; // radians (fixedmath angle)
}

export interface Lifecycle {
  alive: boolean;
  spawnTick: number;
  despawnTick?: number;
}

export type MoveMode = "idle" | "walk" | "run";

export interface Locomotion {
  speed: number; // metres per tick
  mode: MoveMode;
  radius: number; // collision radius class in metres (S=0.5, M=1.0, L=1.5)
  /** Target waypoint queue (world coords); consumed by the locomotion system. */
  path: { x: number; z: number }[];
  pathIndex: number;
}

export interface Entity {
  id: EntityId;
  slot: number; // pool index — internal, never leaks across the seam
  kind: EntityKind;
  archetype: string;
  transform: Transform;
  lifecycle: Lifecycle;
  locomotion?: Locomotion;
  anim?: AnimState; // sim-owned logical animation (world-seam.md rule 3)
  // combatant / ai / missile / … components are added in later tasks.
}

export const POOL_CAPACITY = 1024;

export interface SpawnParams {
  kind: EntityKind;
  archetype: string;
  x: number;
  z: number;
  facing?: number;
  tick: number;
}

export class EntityPool {
  private readonly slots: (Entity | null)[];
  private readonly freeSlots: number[] = [];
  private readonly liveList: Entity[] = []; // id-ordered
  private readonly byId = new Map<EntityId, Entity>();
  private nextId = 1;
  readonly capacity: number;

  constructor(capacity = POOL_CAPACITY) {
    this.capacity = capacity;
    this.slots = new Array<Entity | null>(capacity).fill(null);
    for (let i = capacity - 1; i >= 0; i--) this.freeSlots.push(i);
  }

  get liveCount(): number {
    return this.liveList.length;
  }

  spawn(p: SpawnParams): Entity {
    const slot = this.freeSlots.pop();
    if (slot === undefined) throw new Error("EntityPool exhausted (capacity reached)");
    const e: Entity = {
      id: this.nextId++,
      slot,
      kind: p.kind,
      archetype: p.archetype,
      transform: { x: p.x, z: p.z, facing: p.facing ?? 0 },
      lifecycle: { alive: true, spawnTick: p.tick },
    };
    this.slots[slot] = e;
    this.liveList.push(e);
    this.byId.set(e.id, e);
    return e;
  }

  despawn(e: Entity): void {
    if (!e.lifecycle.alive) return;
    e.lifecycle.alive = false;
    this.slots[e.slot] = null;
    this.freeSlots.push(e.slot);
    this.byId.delete(e.id);
    const idx = this.liveList.indexOf(e);
    if (idx >= 0) this.liveList.splice(idx, 1);
  }

  /** Stale ids return undefined — event/view consumers must tolerate them. */
  get(id: EntityId): Entity | undefined {
    return this.byId.get(id);
  }

  /** Live entities in id order — the canonical iteration order for systems + hashing. */
  live(): readonly Entity[] {
    return this.liveList;
  }
}
