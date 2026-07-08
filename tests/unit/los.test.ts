import { describe, expect, it } from "vitest";
import { hasLineOfSight, walkableRay } from "../../src/sim/los.ts";
import { CELL_M } from "../../src/sim/worldgen/heightfield.ts";
import { LOS, WALK, WalkGrid } from "../../src/sim/worldgen/walkability.ts";

const cw = (cell: number): number => (cell + 0.5) * CELL_M;

function openGrid(cells: number): WalkGrid {
  return new WalkGrid(cells, WALK);
}

describe("line of sight — integer DDA", () => {
  it("is clear across open ground", () => {
    const g = openGrid(20);
    expect(hasLineOfSight(g, cw(2), cw(10), cw(17), cw(10))).toBe(true);
    expect(hasLineOfSight(g, cw(3), cw(3), cw(15), cw(16))).toBe(true);
  });

  it("is blocked by an LOS cell on the segment", () => {
    const g = openGrid(20);
    g.setBit(10, 10, LOS); // a wall/canopy cell
    expect(hasLineOfSight(g, cw(2), cw(10), cw(17), cw(10))).toBe(false);
    // a ray that misses the blocked cell still sees
    expect(hasLineOfSight(g, cw(2), cw(2), cw(17), cw(2))).toBe(true);
  });

  it("walkableRay follows WALK cells and stops at a hole", () => {
    const g = openGrid(20);
    expect(walkableRay(g, cw(2), cw(5), cw(17), cw(5))).toBe(true);
    g.clearBit(9, 5, WALK);
    expect(walkableRay(g, cw(2), cw(5), cw(17), cw(5))).toBe(false);
  });
});
