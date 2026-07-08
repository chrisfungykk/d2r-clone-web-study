import { describe, expect, it } from "vitest";
import { SIZE_M, ZONES, zoneById } from "../../src/sim/data/zones.ts";

describe("zones data table", () => {
  it("has unique ids", () => {
    const ids = ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every row is well-formed", () => {
    for (const z of ZONES) {
      expect(z.id.length).toBeGreaterThan(0);
      expect(z.generatorKey.length).toBeGreaterThan(0);
      expect(SIZE_M[z.size]).toBeGreaterThan(0);
      expect(z.height.octaves).toBeGreaterThanOrEqual(1);
      expect(z.height.amplitudeM).toBeGreaterThan(0);
      expect(z.height.baseFreq).toBeGreaterThan(0);
      expect(z.outdoor.spineWidthM).toBeGreaterThan(0);
      expect(z.outdoor.borderM).toBeGreaterThan(0);
      expect(z.outdoor.scatter.tree).toBeGreaterThanOrEqual(0);
      expect(z.outdoor.scatter.rock).toBeGreaterThanOrEqual(0);
      expect(z.outdoor.scatter.ruin).toBeGreaterThanOrEqual(0);
    }
  });

  it("zoneById resolves known rows and rejects unknown", () => {
    expect(zoneById("dev_wilderness")?.theme).toBe("wilderness");
    expect(zoneById("nope")).toBeUndefined();
  });
});
