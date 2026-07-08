import { describe, expect, it } from "vitest";
import { EntityPool } from "../../src/sim/entity.ts";
import { Sim } from "../../src/sim/sim.ts";
import { AOI_RADIUS_M, projectSnapshot, SnapshotBuffer } from "../../src/sim/views.ts";
import type {
  AnimState,
  EntityView,
  Intent,
  ItemLoc,
  NpcAction,
  PlayerView,
  SimEvent,
  WorldSnapshot,
  ZoneView,
} from "../../src/world_api.ts";

const roundTrips = (x: unknown) => expect(JSON.parse(JSON.stringify(x))).toEqual(x);

describe("world seam — JSON serializability (Phase-6 wire format)", () => {
  it("round-trips every Intent variant", () => {
    const intents: Intent[] = [
      { t: "move", x: 1.5, z: -2.25 },
      { t: "skill", slot: "L", targetId: 7, x: 3, z: 4 },
      { t: "skill", slot: "R" },
      { t: "pickup", itemId: 42 },
      { t: "belt", index: 2 },
      { t: "invMove", from: { kind: "inv", x: 0, y: 0 }, to: { kind: "equip", slot: "weapon" } },
      { t: "npc", npcId: 9, action: { kind: "trade" } },
      { t: "waypoint", zoneId: "zone_dev" },
    ];
    for (const i of intents) roundTrips(i);
  });

  it("round-trips ItemLoc and NpcAction variants", () => {
    const locs: ItemLoc[] = [
      { kind: "inv", x: 3, y: 1 },
      { kind: "equip", slot: "ring1" },
      { kind: "belt", index: 0 },
      { kind: "stash", x: 2, y: 2 },
      { kind: "cursor" },
      { kind: "ground" },
    ];
    for (const l of locs) roundTrips(l);
    const acts: NpcAction[] = [
      { kind: "talk" },
      { kind: "trade" },
      { kind: "gamble" },
      { kind: "heal" },
      { kind: "hire" },
    ];
    for (const a of acts) roundTrips(a);
  });

  it("round-trips EntityView / AnimState / WorldSnapshot", () => {
    const anim: AnimState = { state: "attack", frame: 3, totalFrames: 13 };
    const ev: EntityView = {
      id: 1,
      kind: "monster",
      archetype: "dev_dummy",
      x: 1,
      z: 2,
      facing: 0.5,
      anim,
      hpPct: 0.75,
      modifiers: ["champion"],
      labels: { name: "Worn Blade", rarity: "magic" },
    };
    roundTrips(ev);
    const snap: WorldSnapshot = { tick: 10, entities: [ev] };
    roundTrips(snap);
  });

  it("round-trips PlayerView and ZoneView", () => {
    const pv: PlayerView = {
      id: 0,
      entityId: 1,
      name: "dev",
      clvl: 1,
      x: 0,
      z: 0,
      hp: 50,
      hpMax: 50,
      mana: 20,
      manaMax: 20,
      zoneId: "zone_dev",
    };
    roundTrips(pv);
    const zv: ZoneView = {
      id: "zone_dev",
      theme: "wilderness",
      seed: 123,
      widthM: 160,
      depthM: 160,
      props: [{ archetype: "tree", x: 5, z: 6, facing: 0, scale: 1.2 }],
      automapWidth: 4,
      automapDepth: 1,
      automap: [0b1010],
    };
    roundTrips(zv);
  });

  it("round-trips every SimEvent variant", () => {
    const events: SimEvent[] = [
      { t: "damage", target: 3, amount: 12, kind: "fire", crit: true },
      { t: "death", entity: 3 },
      { t: "drop", item: 5, rarity: "rare" },
      { t: "levelUp", player: 0 },
      { t: "questState", quest: "q_intro", state: "active" },
      { t: "zoneEnter", zone: "zone_dev" },
      { t: "spawn", entity: 7, kind: "monster" },
    ];
    for (const e of events) roundTrips(e);
  });
});

describe("snapshot projection — AoI + pooling", () => {
  it("filters entities beyond the 40 m interest radius", () => {
    const pool = new EntityPool(16);
    pool.spawn({ kind: "monster", archetype: "near", x: 0, z: 0, tick: 0 });
    pool.spawn({ kind: "monster", archetype: "edge", x: AOI_RADIUS_M - 1, z: 0, tick: 0 });
    pool.spawn({ kind: "monster", archetype: "far", x: AOI_RADIUS_M + 5, z: 0, tick: 0 });
    const snap = projectSnapshot(new SnapshotBuffer(), 5, pool.live(), 0, 0);
    expect(snap.tick).toBe(5);
    expect(snap.entities.map((e) => e.archetype)).toEqual(["near", "edge"]);
  });

  it("reuses pooled view objects across fills (no per-tick allocation)", () => {
    const pool = new EntityPool(16);
    pool.spawn({ kind: "monster", archetype: "a", x: 0, z: 0, tick: 0 });
    pool.spawn({ kind: "monster", archetype: "b", x: 1, z: 0, tick: 0 });
    const buf = new SnapshotBuffer();
    const s1 = projectSnapshot(buf, 1, pool.live(), 0, 0);
    const ref0 = s1.entities[0];
    const s2 = projectSnapshot(buf, 2, pool.live(), 0, 0);
    expect(s2.entities[0]).toBe(ref0); // same object, refilled in place
  });

  it("does not leak stale optional fields when a view is reused", () => {
    const pool = new EntityPool(16);
    const e = pool.spawn({ kind: "monster", archetype: "a", x: 0, z: 0, tick: 0 });
    const buf = new SnapshotBuffer();
    const s1 = projectSnapshot(buf, 1, pool.live(), 0, 0);
    // scribble an optional field as a consumer never should — then refill must clear it
    (s1.entities[0] as { hpPct?: number }).hpPct = 0.3;
    const s2 = projectSnapshot(buf, 2, pool.live(), 0, 0);
    expect(s2.entities[0]?.hpPct).toBeUndefined();
    expect(e.id).toBe(1);
  });
});

describe("Sim snapshot double-buffer", () => {
  it("keeps prev and cur as distinct, correctly-ticked buffers", () => {
    const sim = new Sim(3);
    expect(sim.snapshot().tick).toBe(0);
    sim.advance();
    expect(sim.snapshot().tick).toBe(1);
    expect(sim.prevSnapshot().tick).toBe(0);
    expect(sim.snapshot()).not.toBe(sim.prevSnapshot());
    sim.advance();
    expect(sim.snapshot().tick).toBe(2);
    expect(sim.prevSnapshot().tick).toBe(1);
    expect(sim.snapshot()).not.toBe(sim.prevSnapshot());
  });
});
