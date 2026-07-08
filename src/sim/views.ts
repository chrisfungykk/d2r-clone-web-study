// Sim → seam DTO projection with pooled, double-buffered snapshots + AoI filtering
// (world-seam.md rules 1–2). The renderer/UI read these; the only write path is submit().
//
// Pooling: EntityView objects are reused across ticks (no steady-state allocation, per the
// performance budget). `SnapshotBuffer` keeps a persistent object pool plus a stable exposed
// array; the Sim double-buffers two of these so prevSnapshot()/snapshot() stay valid for
// interpolation while the older buffer is refilled in place.
//
// AoI: only entities within AOI_RADIUS_M of the focus (the player) are projected — the
// renderer must never assume global knowledge, so offline and Phase-6 online behaviour match.

import type { EntityView, WorldSnapshot } from "../world_api.ts";
import type { Entity } from "./entity.ts";

/** Interest radius in metres — must be ≥ max-zoom visible area + margin (camera.md). */
export const AOI_RADIUS_M = 40;

/** Internal mutable twin of EntityView (exposed as deep-readonly across the seam). */
export interface MutableEntityView {
  id: number;
  kind: EntityView["kind"];
  archetype: string;
  x: number;
  z: number;
  facing: number;
  anim: { state: EntityView["anim"]["state"]; frame: number; totalFrames: number };
  hpPct?: number;
  modifiers?: EntityView["modifiers"];
  labels?: EntityView["labels"];
}

function blankView(): MutableEntityView {
  return {
    id: 0,
    kind: "monster",
    archetype: "",
    x: 0,
    z: 0,
    facing: 0,
    anim: { state: "idle", frame: 0, totalFrames: 1 },
  };
}

/** Fill a pooled view from an entity, resetting optional fields so stale data never leaks. */
export function fillView(v: MutableEntityView, e: Entity): void {
  v.id = e.id;
  v.kind = e.kind;
  v.archetype = e.archetype;
  v.x = e.transform.x;
  v.z = e.transform.z;
  v.facing = e.transform.facing;
  if (e.anim !== undefined) {
    v.anim.state = e.anim.state;
    v.anim.frame = e.anim.frame;
    v.anim.totalFrames = e.anim.totalFrames;
  } else {
    v.anim.state = e.lifecycle.alive ? "idle" : "dead";
    v.anim.frame = 0;
    v.anim.totalFrames = 1;
  }
  v.hpPct = undefined;
  v.modifiers = undefined;
  v.labels = undefined;
}

export class SnapshotBuffer {
  private readonly pool: MutableEntityView[] = [];
  private readonly entities: MutableEntityView[] = [];
  private readonly snap: { tick: number; entities: MutableEntityView[] } = {
    tick: 0,
    entities: this.entities,
  };
  private n = 0;
  private tickNo = 0;

  /** Begin a new fill for `tick`. */
  begin(tick: number): void {
    this.tickNo = tick;
    this.n = 0;
  }

  /** Get the next pooled view to fill (grows the pool on demand). */
  next(): MutableEntityView {
    let v = this.pool[this.n];
    if (v === undefined) {
      v = blankView();
      this.pool[this.n] = v;
    }
    this.n += 1;
    return v;
  }

  /** Finish the fill and return the (reused) snapshot. */
  end(): WorldSnapshot {
    this.entities.length = this.n;
    for (let i = 0; i < this.n; i++) this.entities[i] = this.pool[i] as MutableEntityView;
    this.snap.tick = this.tickNo;
    this.snap.entities = this.entities;
    return this.snap;
  }
}

/** Project the AoI-filtered live entities into `buf`, returning the snapshot. */
export function projectSnapshot(
  buf: SnapshotBuffer,
  tick: number,
  live: readonly Entity[],
  focusX: number,
  focusZ: number,
): WorldSnapshot {
  const r2 = AOI_RADIUS_M * AOI_RADIUS_M;
  buf.begin(tick);
  for (const e of live) {
    const dx = e.transform.x - focusX;
    const dz = e.transform.z - focusZ;
    if (dx * dx + dz * dz > r2) continue;
    fillView(buf.next(), e);
  }
  return buf.end();
}
