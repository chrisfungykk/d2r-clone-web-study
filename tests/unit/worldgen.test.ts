import { describe, expect, it } from "vitest";
import { CELL_M, generateHeightfield } from "../../src/sim/worldgen/heightfield.ts";
import { floodFill } from "../../src/sim/worldgen/walkability.ts";
import { generateZone } from "../../src/sim/zone.ts";

// Golden walkability hash of the dev zone at seed 1 — an unintentional change to zone
// generation (or the cell bit layout) is a build failure (world-generation.md 0.5 test).
const DEV_ZONE_HASH_SEED1 = 0x7f5cca66;

describe("world generation — determinism", () => {
  it("walkability grid hash matches the committed golden", () => {
    expect(generateZone(1, "dev_wilderness").walkabilityHash()).toBe(DEV_ZONE_HASH_SEED1);
  });

  it("same (seed, zone) generates a bit-identical zone", () => {
    const a = generateZone(7, "dev_wilderness");
    const b = generateZone(7, "dev_wilderness");
    expect(a.walkabilityHash()).toBe(b.walkabilityHash());
    expect(Array.from(a.heightfield)).toEqual(Array.from(b.heightfield));
  });

  it("different seeds reroll the layout", () => {
    expect(generateZone(1, "dev_wilderness").walkabilityHash()).not.toBe(
      generateZone(2, "dev_wilderness").walkabilityHash(),
    );
  });

  it("heightfield is deterministic and bounded by amplitude", () => {
    const h1 = generateHeightfield(123, 64, {
      amplitudeM: 3,
      baseFreq: 1 / 22,
      octaves: 3,
      persistence: 0.5,
    });
    const h2 = generateHeightfield(123, 64, {
      amplitudeM: 3,
      baseFreq: 1 / 22,
      octaves: 3,
      persistence: 0.5,
    });
    expect(Array.from(h1)).toEqual(Array.from(h2));
    for (const v of h1) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
    }
  });
});

describe("world generation — connectivity", () => {
  it("entrance, exit, and waypoint are walkable and mutually reachable; ≥90% reachable", () => {
    const z = generateZone(1, "dev_wilderness");
    expect(z.walkAt(z.entrance.x, z.entrance.z)).toBe(true);
    expect(z.walkAt(z.exit.x, z.exit.z)).toBe(true);
    expect(z.walkAt(z.waypoint.x, z.waypoint.z)).toBe(true);
    expect(z.reachableFraction).toBeGreaterThanOrEqual(0.9);

    const ei = Math.floor(z.entrance.x / CELL_M);
    const ej = Math.floor(z.entrance.z / CELL_M);
    const flood = floodFill(z.grid, ei, ej);
    const cellIndex = (px: number, pz: number) =>
      Math.floor(pz / CELL_M) * z.cells + Math.floor(px / CELL_M);
    expect(flood.visited[cellIndex(z.exit.x, z.exit.z)]).toBe(1);
    expect(flood.visited[cellIndex(z.waypoint.x, z.waypoint.z)]).toBe(1);
  });

  it("scatters props (fewer than requested is fine — dart-throwing may give up)", () => {
    const z = generateZone(1, "dev_wilderness");
    expect(z.props.length).toBeGreaterThan(0);
    for (const p of z.props) {
      expect(["tree", "rock", "ruin"]).toContain(p.archetype);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(z.sizeM);
    }
  });
});

describe("terrainHeight — bilinear sampling", () => {
  it("is deterministic and continuous", () => {
    const z = generateZone(1, "dev_wilderness");
    const mid = z.sizeM / 2;
    expect(z.terrainHeight(mid, mid)).toBe(z.terrainHeight(mid, mid));
    // continuity: a 1 cm step changes height by well under the amplitude
    const a = z.terrainHeight(mid, mid);
    const b = z.terrainHeight(mid + 0.01, mid);
    expect(Math.abs(a - b)).toBeLessThan(0.1);
    // bounded by amplitude
    expect(z.terrainHeight(mid, mid)).toBeGreaterThanOrEqual(0);
    expect(z.terrainHeight(mid, mid)).toBeLessThanOrEqual(3);
  });
});
