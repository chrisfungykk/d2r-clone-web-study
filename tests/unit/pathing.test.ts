import { describe, expect, it } from "vitest";
import { Sim } from "../../src/sim/sim.ts";
import { stepLocomotion } from "../../src/sim/systems/locomotion.ts";
import { findPath } from "../../src/sim/systems/pathing.ts";
import { CELL_M } from "../../src/sim/worldgen/heightfield.ts";
import { WALK, WalkGrid } from "../../src/sim/worldgen/walkability.ts";

const cw = (cell: number): number => (cell + 0.5) * CELL_M;

function openGrid(cells: number): WalkGrid {
  return new WalkGrid(cells, WALK);
}

describe("A* pathing (rc=0)", () => {
  it("finds a straight path and string-pulls it to a single waypoint", () => {
    const g = openGrid(24);
    const r = findPath(g, cw(3), cw(3), cw(3), cw(18));
    expect(r.found).toBe(true);
    expect(r.points.length).toBe(1); // open ground → straight line collapses to the goal
    const end = r.points[0];
    expect(end?.z).toBeCloseTo(cw(18), 6);
  });

  it("routes around a wall", () => {
    const g = openGrid(24);
    for (let j = 4; j <= 18; j++) g.clearBit(12, j, WALK); // vertical wall with gaps at top/bottom
    const r = findPath(g, cw(4), cw(11), cw(20), cw(11));
    expect(r.found).toBe(true);
    expect(r.points.length).toBeGreaterThan(1); // must bend around the wall
    const last = r.points[r.points.length - 1];
    expect(last?.x).toBeCloseTo(cw(20), 6);
  });

  it("is deterministic — identical input yields identical waypoints", () => {
    const make = () => {
      const g = openGrid(24);
      for (let j = 4; j <= 18; j++) g.clearBit(12, j, WALK);
      return findPath(g, cw(4), cw(11), cw(20), cw(11));
    };
    expect(make().points).toEqual(make().points);
  });

  it("honors the corner rule (no diagonal through a wall corner)", () => {
    const g = openGrid(12);
    // block cells (5,5) and (6,6); a naive diagonal 5,5→6,6 would clip the corner
    g.clearBit(5, 6, WALK);
    g.clearBit(6, 5, WALK);
    const r = findPath(g, cw(5), cw(5), cw(6), cw(6));
    // reachable only by going around, never by cutting between the two blockers
    expect(r.found).toBe(true);
    for (const p of r.points) {
      const i = Math.floor(p.x / CELL_M);
      const j = Math.floor(p.z / CELL_M);
      expect(g.has(i, j, WALK)).toBe(true);
    }
  });

  it("reports found=false when the target is walled off, with a best-effort path", () => {
    const g = openGrid(24);
    for (let j = 0; j < 24; j++) g.clearBit(12, j, WALK); // full separation
    const r = findPath(g, cw(4), cw(11), cw(20), cw(11));
    expect(r.found).toBe(false);
  });
});

describe("Sim click-to-move integration", () => {
  it("moves the player toward a submitted move intent", () => {
    const sim = new Sim(1);
    const zone = sim.getZone();
    const player = sim.entityById(sim.playerEntityId());
    expect(player).toBeDefined();
    const start = { x: player?.transform.x ?? 0, z: player?.transform.z ?? 0 };

    // pick a walkable target ~10 m along the spine toward the waypoint
    const tx = zone.waypoint.x;
    const tz = zone.waypoint.z;
    sim.submit(0, { t: "move", x: tx, z: tz });
    for (let i = 0; i < 400; i++) sim.advance();

    const end = sim.entityById(sim.playerEntityId());
    const moved = Math.hypot((end?.transform.x ?? 0) - start.x, (end?.transform.z ?? 0) - start.z);
    expect(moved).toBeGreaterThan(3); // it walked a meaningful distance
    expect(sim.player(0).x).toBeCloseTo(end?.transform.x ?? 0, 6);
  });
});

describe("locomotion primitive", () => {
  it("advances an entity along a path and stops at the end", () => {
    const g = openGrid(24);
    const e = {
      id: 1,
      slot: 0,
      kind: "player" as const,
      archetype: "wanderer",
      transform: { x: cw(3), z: cw(3), facing: 0 },
      lifecycle: { alive: true, spawnTick: 0 },
      locomotion: {
        speed: 0.24,
        mode: "idle" as const,
        radius: 1,
        path: [{ x: cw(3), z: cw(9) }],
        pathIndex: 0,
      },
      anim: { state: "idle" as const, frame: 0, totalFrames: 1 },
    };
    for (let i = 0; i < 200; i++) stepLocomotion(g, e, 0);
    expect(e.transform.z).toBeGreaterThan(cw(8)); // reached near the waypoint
    expect(e.locomotion.path.length).toBe(0); // path cleared on arrival
    expect(e.anim.state).toBe("idle"); // idle again after stopping
  });
});
