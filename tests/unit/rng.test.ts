import { describe, expect, it } from "vitest";
import { fnv1a32, Rng } from "../../src/sim/rng.ts";

describe("Rng — splitmix32 named streams", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 100 }, () => a.u32("map"));
    const seqB = Array.from({ length: 100 }, () => b.u32("map"));
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = Array.from({ length: 50 }, () => new Rng(1).u32("map"));
    const b = Array.from({ length: 50 }, () => new Rng(2).u32("map"));
    expect(a).not.toEqual(b);
  });

  it("keeps streams isolated — draining one stream does not shift another", () => {
    // Reference "ai" sequence from a fresh generator.
    const ref = new Rng(999);
    const aiRef = Array.from({ length: 20 }, () => ref.u32("ai"));

    // Same seed, but hammer "loot" 1000× first, then read "ai".
    const g = new Rng(999);
    for (let i = 0; i < 1000; i++) g.u32("loot");
    const aiAfter = Array.from({ length: 20 }, () => g.u32("ai"));

    expect(aiAfter).toEqual(aiRef);
  });

  it("all six named streams are mutually distinct", () => {
    const g = new Rng(7);
    const first = ["map", "loot", "combat", "ai", "monsterSpawn", "fx"].map((s) => g.u32(s));
    expect(new Set(first).size).toBe(first.length);
  });

  it("roll(n) stays in [0, n) and is single-draw deterministic", () => {
    const g = new Rng(42);
    for (let i = 0; i < 10000; i++) {
      const r = g.roll("combat", 6);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(6);
    }
    // one u32 per roll: an independent generator advanced the same number of steps agrees.
    const a = new Rng(3);
    const b = new Rng(3);
    for (let i = 0; i < 100; i++) a.roll("loot", 37);
    const nextA = a.u32("loot");
    for (let i = 0; i < 100; i++) b.u32("loot");
    const nextB = b.u32("loot");
    expect(nextA).toBe(nextB);
  });

  it("float(stream) is in [0, 1)", () => {
    const g = new Rng(5);
    for (let i = 0; i < 1000; i++) {
      const f = g.float("fx");
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it("pick returns a member and throws on empty", () => {
    const g = new Rng(8);
    expect(["a", "b", "c"]).toContain(g.pick("loot", ["a", "b", "c"]));
    expect(() => g.pick("loot", [])).toThrow();
  });

  it("child(path) is deterministic and independent of the parent's own streams", () => {
    const p1 = new Rng(100);
    const c1 = p1.child("worldgen/dev-zone");
    const p2 = new Rng(100);
    const c2 = p2.child("worldgen/dev-zone");
    const s1 = Array.from({ length: 10 }, () => c1.u32("layout"));
    const s2 = Array.from({ length: 10 }, () => c2.u32("layout"));
    expect(s1).toEqual(s2);

    // Different paths give different sub-streams.
    const other = new Rng(100).child("worldgen/other-zone");
    expect(Array.from({ length: 10 }, () => other.u32("layout"))).not.toEqual(s1);
  });

  it("fnv1a32 is stable and order-sensitive", () => {
    expect(fnv1a32("map")).toBe(fnv1a32("map"));
    expect(fnv1a32("ab")).not.toBe(fnv1a32("ba"));
  });
});
