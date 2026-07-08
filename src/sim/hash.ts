// Structural state hash — FNV-1a 32-bit over a canonical byte stream
// (doc/01-architecture/determinism.md, "Replay & golden tests").
//
// Determinism requirements this satisfies:
//   • Fixed byte order for every scalar (big-endian here; the choice is arbitrary but fixed).
//   • Floats hashed by their IEEE-754 bits (via DataView), so 1.0 and 1 hash identically only
//     because both are the same double — no locale/format ambiguity.
//   • −0 is normalized to +0 before hashing (they compare equal but have different bit
//     patterns), so a sign-of-zero difference can never split a replay hash.
//   • No transcendentals, no wall clock — DataView/ArrayBuffer are deterministic.
//
// The Sim serializes entities in id order with a fixed field order and feeds them here.

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export class Hasher {
  private h = FNV_OFFSET;
  private readonly buf = new ArrayBuffer(8);
  private readonly dv = new DataView(this.buf);

  private byte(b: number): void {
    this.h = Math.imul(this.h ^ (b & 0xff), FNV_PRIME) >>> 0;
  }

  /** Mix a uint32 (4 bytes, fixed big-endian order). */
  u32(x: number): this {
    const v = x >>> 0;
    this.byte(v >>> 24);
    this.byte(v >>> 16);
    this.byte(v >>> 8);
    this.byte(v);
    return this;
  }

  /** Mix a signed 32-bit integer. */
  i32(x: number): this {
    return this.u32(x | 0);
  }

  /** Mix an IEEE-754 double by its bits, normalizing −0 → +0. */
  f64(x: number): this {
    // `x + 0` turns -0 into +0 and leaves every other value (incl. NaN, ±Inf) unchanged.
    this.dv.setFloat64(0, x + 0, false);
    for (let i = 0; i < 8; i++) this.byte(this.dv.getUint8(i));
    return this;
  }

  /** Mix a boolean as a single byte. */
  bool(b: boolean): this {
    this.byte(b ? 1 : 0);
    return this;
  }

  /** Mix a string's UTF-16 code units (length-prefixed to avoid concatenation collisions). */
  str(s: string): this {
    this.u32(s.length);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      this.byte(c & 0xff);
      this.byte((c >>> 8) & 0xff);
    }
    return this;
  }

  /** Current 32-bit digest. */
  digest(): number {
    return this.h >>> 0;
  }
}

/** Convenience: FNV-1a 32-bit of a byte array. */
export function fnv1aBytes(bytes: ArrayLike<number>): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    h = Math.imul(h ^ (b & 0xff), FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}
