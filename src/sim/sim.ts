// The deterministic core — `Sim implements IWorld` (world-seam.md, simulation-runtime.md).
//
// `advance()` runs one 40 ms tick as a fixed sequence of systems. Reordering systems changes
// replay hashes and is a mechanics change (golden re-record). Stage order:
//   [intents → pathing → locomotion → events]
// B6 wires the player: move intents are turned into A* paths (intents stage) and integrated
// with slide collision (locomotion stage). Combat/ai/missiles arrive in later phases.

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
import { type CharStartRow, charStartById, DEV_CLASS_ID } from "./data/charStart.ts";
import { moveProfile } from "./data/speeds.ts";
import { DEV_ZONE_ID } from "./data/zones.ts";
import type { Entity } from "./entity.ts";
import { EntityPool } from "./entity.ts";
import { Hasher } from "./hash.ts";
import { IntentQueue } from "./intents.ts";
import { Rng } from "./rng.ts";
import { stepLocomotion } from "./systems/locomotion.ts";
import { findPath } from "./systems/pathing.ts";
import { projectSnapshot, SnapshotBuffer } from "./views.ts";
import { generateZone, type Zone } from "./zone.ts";

export class Sim implements IWorld {
  readonly worldSeed: number;
  private readonly rng: Rng;
  private readonly pool = new EntityPool();
  private readonly intents = new IntentQueue();
  private readonly events: SimEvent[] = [];
  private readonly zoneState: Zone;
  private readonly charStart: CharStartRow;
  private readonly clearance: number;
  private readonly runSpeed: number;
  private _tick = 0;

  // Pooled double-buffer (world-seam.md rule 5).
  private readonly bufA = new SnapshotBuffer();
  private readonly bufB = new SnapshotBuffer();
  private curIsA = true;
  private prev: WorldSnapshot;
  private cur: WorldSnapshot;

  // The local player.
  private readonly playerId: PlayerId = 0;
  private readonly playerEntity: Entity;

  constructor(worldSeed: number) {
    this.worldSeed = worldSeed | 0;
    this.rng = new Rng(this.worldSeed);
    this.zoneState = generateZone(this.worldSeed, DEV_ZONE_ID);
    this.charStart = charStartById(DEV_CLASS_ID) ?? {
      classId: DEV_CLASS_ID,
      name: "Wanderer",
      baseLife: 50,
      baseMana: 20,
      moveKey: "player",
      radiusM: 1,
      clearanceCells: 1,
    };
    this.clearance = this.charStart.clearanceCells;
    this.runSpeed = moveProfile(this.charStart.moveKey).run;

    this.playerEntity = this.spawnPlayer();
    this.spawnStaticDummies();

    this.cur = projectSnapshot(
      this.bufA,
      0,
      this.pool.live(),
      this.playerEntity.transform.x,
      this.playerEntity.transform.z,
    );
    this.prev = this.cur;
    this.curIsA = true;
  }

  getZone(): Zone {
    return this.zoneState;
  }

  get tick(): number {
    return this._tick;
  }

  playerEntityId(): EntityId {
    return this.playerEntity.id;
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
    this.stageEvents();
  }

  private stageIntents(): void {
    for (const { playerId, intent } of this.intents.drainMovement()) {
      if (playerId !== this.playerId || intent.t !== "move") continue;
      // click-to-move: A* from the player's position, then hand the path to locomotion.
      const p = this.playerEntity;
      const result = findPath(
        this.zoneState.grid,
        p.transform.x,
        p.transform.z,
        intent.x,
        intent.z,
        this.clearance,
      );
      if (p.locomotion !== undefined) {
        p.locomotion.path = result.points;
        p.locomotion.pathIndex = 0;
      }
    }
    // discrete intents (skills, pickup, …) are validated/applied in later phases
    this.intents.drainDiscrete();
  }

  private stagePathing(): void {
    // Monster flow-fields + player repath triggers arrive with the AI phase.
  }

  private stageLocomotion(): void {
    for (const e of this.pool.live()) {
      if (e.locomotion !== undefined) stepLocomotion(this.zoneState.grid, e, this.clearance);
    }
  }

  private stageEvents(): void {
    const writeBuf = this.curIsA ? this.bufB : this.bufA;
    this.prev = this.cur;
    this.cur = projectSnapshot(
      writeBuf,
      this._tick,
      this.pool.live(),
      this.playerEntity.transform.x, // AoI follows the player
      this.playerEntity.transform.z,
    );
    this.curIsA = !this.curIsA;
  }

  // ── queries ──────────────────────────────────────────────────────────────────────────
  snapshot(): DeepReadonly<WorldSnapshot> {
    return this.cur;
  }

  prevSnapshot(): DeepReadonly<WorldSnapshot> {
    return this.prev;
  }

  player(id: PlayerId): DeepReadonly<PlayerView> {
    if (id !== this.playerId) throw new Error(`Sim.player: unknown player ${id}`);
    const p = this.playerEntity;
    return {
      id: this.playerId,
      entityId: p.id,
      name: this.charStart.name,
      clvl: 1,
      x: p.transform.x,
      z: p.transform.z,
      hp: this.charStart.baseLife,
      hpMax: this.charStart.baseLife,
      mana: this.charStart.baseMana,
      manaMax: this.charStart.baseMana,
      zoneId: this.zoneState.id,
    };
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
      if (e.anim !== undefined) h.str(e.anim.state).u32(e.anim.frame);
      if (e.locomotion !== undefined) h.u32(e.locomotion.pathIndex).u32(e.locomotion.path.length);
    }
    return h.digest();
  }

  liveCount(): number {
    return this.pool.liveCount;
  }

  entityById(id: EntityId): Entity | undefined {
    return this.pool.get(id);
  }

  // ── internal ─────────────────────────────────────────────────────────────────────────
  private spawnPlayer(): Entity {
    const { x, z } = this.zoneState.entrance;
    const e = this.pool.spawn({ kind: "player", archetype: this.charStart.classId, x, z, tick: 0 });
    e.locomotion = {
      speed: this.runSpeed,
      mode: "idle",
      radius: this.charStart.radiusM,
      path: [],
      pathIndex: 0,
    };
    e.anim = { state: "idle", frame: 0, totalFrames: 1 };
    return e;
  }

  /** A few static monsters near the entrance for AoI/render exercising (no locomotion). */
  private spawnStaticDummies(): void {
    const zr = this.rng.child("dev-dummies");
    const { x: ex, z: ez } = this.zoneState.entrance;
    for (let i = 0; i < 6; i++) {
      let x = ex + 6;
      let z = ez;
      for (let attempt = 0; attempt < 16; attempt++) {
        const cx = ex + (zr.float("x") - 0.5) * 30;
        const cz = ez + (zr.float("z") - 0.5) * 30;
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
