import { describe, expect, it } from "vitest";
import { fnv1aBytes, Hasher } from "../../src/sim/hash.ts";

const digestF64 = (x: number) => new Hasher().f64(x).digest();

describe("Hasher — canonical structural hash", () => {
  it("is deterministic for the same input", () => {
    const a = new Hasher().u32(7).str("dev").f64(1.5).bool(true).digest();
    const b = new Hasher().u32(7).str("dev").f64(1.5).bool(true).digest();
    expect(a).toBe(b);
  });

  it("normalizes −0 to +0 (they must hash identically)", () => {
    expect(digestF64(-0)).toBe(digestF64(0));
    // sanity: a genuinely different value hashes differently
    expect(digestF64(-0)).not.toBe(digestF64(1e-300));
  });

  it("hashes floats by IEEE bits — 1 and 1.0 are the same double", () => {
    expect(digestF64(1)).toBe(digestF64(1.0));
    expect(digestF64(0.1 + 0.2)).toBe(digestF64(0.30000000000000004));
    expect(digestF64(0.1 + 0.2)).not.toBe(digestF64(0.3));
  });

  it("is order-sensitive across fields", () => {
    const ab = new Hasher().u32(1).u32(2).digest();
    const ba = new Hasher().u32(2).u32(1).digest();
    expect(ab).not.toBe(ba);
  });

  it("length-prefixes strings so concatenations don't collide", () => {
    const a = new Hasher().str("ab").str("c").digest();
    const b = new Hasher().str("a").str("bc").digest();
    expect(a).not.toBe(b);
  });

  it("distinguishes NaN and Infinity from finite values", () => {
    expect(digestF64(Number.NaN)).not.toBe(digestF64(0));
    expect(digestF64(Number.POSITIVE_INFINITY)).not.toBe(digestF64(Number.NEGATIVE_INFINITY));
  });

  it("fnv1aBytes is a stable 32-bit digest", () => {
    expect(fnv1aBytes([1, 2, 3])).toBe(fnv1aBytes([1, 2, 3]));
    expect(fnv1aBytes([1, 2, 3])).not.toBe(fnv1aBytes([3, 2, 1]));
    expect(fnv1aBytes([])).toBe(0x811c9dc5);
  });
});
