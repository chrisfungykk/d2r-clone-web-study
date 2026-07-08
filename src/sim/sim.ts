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
  EntityId,
  Intent,
  IWorld,
  PlayerId,
  PlayerView,
  SimEvent,
  WorldSnapshot,
  ZoneView,
} from "../world_api.ts";
import type { Entity } from "./entity.ts";
import { EntityPool } from "./entity.ts";
import { Hasher } from "./hash.ts";
import { IntentQueue } from "./intents.ts";
import { Rng } from "./rng.ts";
import { toEntityView } from "./views.ts";

const EMPTY_SNAPSHOT: WorldSnapshot = { tick: 0, entities: [] };

export class Sim implements IWorld {
  readonly worldSeed: number;
  private readonly rng: Rng;
  private readonly kernelRng: Rng;
  private readonly pool = new EntityPool();
  private readonly intents = new IntentQueue();
  private readonly events: SimEvent[] = [];
  private _tick = 0;
  private prev: WorldSnapshot = EMPTY_SNAPSHOT;
  private cur: WorldSnapshot = EMPTY_SNAPSHOT;

  constructor(worldSeed: number) {
    this.worldSeed = worldSeed | 0;
    this.rng = new Rng(this.worldSeed);
    this.kernelRng = this.rng.child("kernel");
    this.spawnDevEntities();
    this.cur = this.buildSnapshot();
    this.prev = this.cur;
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
    // Swap the snapshot double-buffer (B3 makes these pooled + AoI-filtered).
    this.prev = this.cur;
    this.cur = this.buildSnapshot();
  }

  // ── queries ──────────────────────────────────────────────────────────────────────────
  snapshot(): WorldSnapshot {
    return this.cur;
  }

  prevSnapshot(): WorldSnapshot {
    return this.prev;
  }

  player(_id: PlayerId): PlayerView {
    throw new Error("Sim.player: no player entity until B6 (character task)");
  }

  terrainHeight(_x: number, _z: number): number {
    return 0; // flat until B5 (zone generation)
  }

  zone(): ZoneView {
    return {
      id: "dev",
      theme: "wilderness",
      seed: this.worldSeed,
      widthM: 0,
      depthM: 0,
      props: [],
      automapWidth: 0,
      automapDepth: 0,
      automap: [],
    };
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
  private buildSnapshot(): WorldSnapshot {
    const entities = this.pool.live().map(toEntityView);
    return { tick: this._tick, entities };
  }

  /** Phase-0 kernel placeholder: seeded dummy entities so advance() has state to evolve. */
  private spawnDevEntities(): void {
    const zr = this.rng.child("kernel/dev-spawn");
    for (let i = 0; i < 8; i++) {
      this.pool.spawn({
        kind: "monster",
        archetype: "dev_dummy",
        x: (zr.float("x") - 0.5) * 20,
        z: (zr.float("z") - 0.5) * 20,
        facing: zr.float("facing") * Math.PI * 2,
        tick: 0,
      });
    }
  }
}
