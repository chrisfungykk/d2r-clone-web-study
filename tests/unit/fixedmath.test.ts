import { describe, expect, it } from "vitest";
import { atan2, cos, len, PI, sin, TWO_PI, wrapAngle } from "../../src/sim/fixedmath.ts";
import { ATAN_TABLE, SIN_TABLE, TABLES_HASH } from "../../src/sim/fixedmath-tables.ts";
import { Hasher } from "../../src/sim/hash.ts";

describe("fixedmath — table trig", () => {
  it("sin matches Math.sin within table-interpolation epsilon", () => {
    for (let i = 0; i < 2000; i++) {
      const a = (i / 2000) * (TWO_PI * 3) - TWO_PI; // spans a few periods incl. negatives
      expect(sin(a)).toBeCloseTo(Math.sin(a), 4);
    }
  });

  it("cos matches Math.cos", () => {
    for (let i = 0; i < 2000; i++) {
      const a = (i / 2000) * (TWO_PI * 3) - TWO_PI;
      expect(cos(a)).toBeCloseTo(Math.cos(a), 4);
    }
  });

  it("atan2 matches Math.atan2 across all quadrants", () => {
    const pts = [-3, -1.5, -0.3, 0, 0.3, 1.5, 3];
    for (const y of pts) {
      for (const x of pts) {
        if (x === 0 && y === 0) continue;
        expect(atan2(y, x)).toBeCloseTo(Math.atan2(y, x), 3);
      }
    }
  });

  it("atan2(0,0) is 0 and results stay in (−π, π]", () => {
    expect(atan2(0, 0)).toBe(0);
    for (let i = 0; i < 500; i++) {
      const ang = (i / 500) * TWO_PI - PI;
      const r = atan2(Math.sin(ang), Math.cos(ang));
      expect(r).toBeGreaterThan(-PI - 1e-6);
      expect(r).toBeLessThanOrEqual(PI + 1e-6);
    }
  });

  it("len is Euclidean and wrapAngle folds into [−π, π)", () => {
    expect(len(3, 4)).toBeCloseTo(5, 12);
    expect(wrapAngle(TWO_PI + 0.5)).toBeCloseTo(0.5, 12);
    expect(wrapAngle(-TWO_PI - 0.5)).toBeCloseTo(-0.5, 12);
    expect(wrapAngle(PI)).toBeCloseTo(-PI, 12);
  });

  it("committed tables match the corruption-guard hash", () => {
    expect(SIN_TABLE.length).toBe(4096);
    expect(ATAN_TABLE.length).toBe(1025);
    const h = new Hasher();
    h.u32(SIN_TABLE.length);
    for (const x of SIN_TABLE) h.f64(x);
    h.u32(ATAN_TABLE.length);
    for (const x of ATAN_TABLE) h.f64(x);
    expect(h.digest()).toBe(TABLES_HASH);
  });
});
