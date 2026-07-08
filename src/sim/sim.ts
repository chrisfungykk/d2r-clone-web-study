// The deterministic core — `Sim implements IWorld` (world-seam.md, simulation-runtime.md).
//
// `advance()` runs one 40 ms tick as a fixed sequence of systems. Reordering systems changes
// replay hashes and is a mechanics change (golden re-record). B2 wires the kernel skeleton:
//   [intents → pathing → locomotion → events]
// pathing is a no-op until B6; locomotion runs a small seeded "dev wander" over placeholder
// entities so the kernel has evolving, hashable, seed-dependent state to test determinism
// against. Those placeholders (spawnDevEntities / wander) are superseded by real zone spawns
// and click-to-move locomotion in B5/B6 — before any golden replay fixture is recorded.

import type {
  DeepReadonly,
  EntityId,
  Intent,
  IWorld,
  PlayerId,
  PlayerView,
  SimEvent,
  WorldSnapshot,
  ZoneView,
} from "../world_api.ts";
import { DEV_ZONE_ID } from "./data/zones.ts";
import type { Entity } from "./entity.ts";
import { EntityPool } from "./entity.ts";
import { Hasher } from "./hash.ts";
import { IntentQueue } from "./intents.ts";
import { Rng } from "./rng.ts";
import { projectSnapshot, SnapshotBuffer } from "./views.ts";
import { generateZone, type Zone } from "./zone.ts";

export class Sim implements IWorld {
  readonly worldSeed: number;
  private readonly rng: Rng;
  private readonly kernelRng: Rng;
  private readonly pool = new EntityPool();
  private readonly intents = new IntentQueue();
  private readonly events: SimEvent[] = [];
  private readonly zoneState: Zone;
  private _tick = 0;
  // Pooled double-buffer: two SnapshotBuffers reused across ticks so prev/cur stay valid for
  // interpolation while the older one is refilled in place (world-seam.md rule 5).
  private readonly bufA = new SnapshotBuffer();
  private readonly bufB = new SnapshotBuffer();
  private curIsA = true;
  private prev: WorldSnapshot;
  private cur: WorldSnapshot;
  // AoI focus (the player). Centred on the zone entrance until a real player spawns in B6.
  private focusX = 0;
  private focusZ = 0;

  constructor(worldSeed: number) {
    this.worldSeed = worldSeed | 0;
    this.rng = new Rng(this.worldSeed);
    this.kernelRng = this.rng.child("kernel");
    this.zoneState = generateZone(this.worldSeed, DEV_ZONE_ID);
    this.focusX = this.zoneState.entrance.x;
    this.focusZ = this.zoneState.entrance.z;
    this.spawnDevEntities();
    this.cur = projectSnapshot(this.bufA, 0, this.pool.live(), this.focusX, this.focusZ);
    this.prev = this.cur;
    this.curIsA = true;
  }

  /** The current zone's runtime state (used by systems + B6 player spawn). */
  getZone(): Zone {
    return this.zoneState;
  }

  get tick(): number {
    return this._tick;
  }

  // ── advancing ──────────────────────────────────────────────────────────────────────────
  submit(playerId: PlayerId, intent: Intent): void {
    this.intents.submit(playerId, intent);
  }

  advance(): void {
    this._tick += 1;
    this.stageIntents();
    this.stagePathing();
    this.stageLocomotion();
    this.stageEvents(); // builds the snapshot for the tick just computed
  }

  private stageIntents(): void {
    // Validation + application land in B6 (locomotion targets, skill orders). For now we
    // drain so the queue can't grow unbounded across ticks.
    this.intents.drainMovement();
    this.intents.drainDiscrete();
  }

  private stagePathing(): void {
    // Flow-field refresh + player A* requests — B6.
  }

  private stageLocomotion(): void {
    // Placeholder dev-wander (superseded by B6). Draw in id order for determinism.
    for (const e of this.pool.live()) {
      const dx = (this.kernelRng.float("wander") - 0.5) * 0.08;
      const dz = (this.kernelRng.float("wander") - 0.5) * 0.08;
      e.transform.x += dx;
      e.transform.z += dz;
    }
  }

  private stageEvents(): void {
    // Swap the pooled snapshot double-buffer: fill the buffer NOT currently exposed as `cur`
    // (so `prev` — which becomes the old `cur` — is never overwritten mid-interpolation).
    const writeBuf = this.curIsA ? this.bufB : this.bufA;
    this.prev = this.cur;
    this.cur = projectSnapshot(writeBuf, this._tick, this.pool.live(), this.focusX, this.focusZ);
    this.curIsA = !this.curIsA;
  }

  // ── queries ──────────────────────────────────────────────────────────────────────────
  snapshot(): DeepReadonly<WorldSnapshot> {
    return this.cur;
  }

  prevSnapshot(): DeepReadonly<WorldSnapshot> {
    return this.prev;
  }

  player(_id: PlayerId): DeepReadonly<PlayerView> {
    throw new Error("Sim.player: no player entity until B6 (character task)");
  }

  terrainHeight(x: number, z: number): number {
    return this.zoneState.terrainHeight(x, z);
  }

  zone(): DeepReadonly<ZoneView> {
    return this.zoneState.view();
  }

  drainEvents(): SimEvent[] {
    return this.events.splice(0, this.events.length);
  }

  // ── determinism ────────────────────────────────────────────────────────────────────────
  /** Fast structural hash of sim state — entities in id order, fixed field order. */
  stateHash(): number {
    const h = new Hasher();
    h.u32(this._tick);
    h.u32(this.pool.liveCount);
    for (const e of this.pool.live()) {
      h.u32(e.id).str(e.kind).str(e.archetype);
      h.f64(e.transform.x).f64(e.transform.z).f64(e.transform.facing);
      h.bool(e.lifecycle.alive).u32(e.lifecycle.spawnTick);
    }
    return h.digest();
  }

  // Exposed for kernel tests / future systems.
  liveCount(): number {
    return this.pool.liveCount;
  }

  entityById(id: EntityId): Entity | undefined {
    return this.pool.get(id);
  }

  // ── internal ─────────────────────────────────────────────────────────────────────────
  /** Phase-0 kernel placeholder: seeded dummy entities on walkable ground near the entrance,
   * so advance() has state to evolve. Superseded by real spawns/player in B6. */
  private spawnDevEntities(): void {
    const zr = this.rng.child("kernel/dev-spawn");
    const { x: ex, z: ez } = this.zoneState.entrance;
    for (let i = 0; i < 8; i++) {
      let x = ex;
      let z = ez;
      for (let attempt = 0; attempt < 12; attempt++) {
        const cx = ex + (zr.float("x") - 0.5) * 24;
        const cz = ez + (zr.float("z") - 0.5) * 24;
        if (this.zoneState.walkAt(cx, cz)) {
          x = cx;
          z = cz;
          break;
        }
      }
      this.pool.spawn({
        kind: "monster",
        archetype: "dev_dummy",
        x,
        z,
        facing: zr.float("facing") * Math.PI * 2,
        tick: 0,
      });
    }
  }
}
