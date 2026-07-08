// Seeded RNG — splitmix32 with named streams (doc/01-architecture/determinism.md).
//
// One PRNG construction (the 32-bit splitmix), wrapped in named streams so systems can't
// perturb each other's sequences: adding a consumer to one stream never shifts another
// stream's output, which keeps old replays valid across unrelated feature work.
//
// Determinism notes:
//   • splitmix32 is uint32-native (no BigInt); state is a single uint32 counter.
//   • Streams are keyed by string; each stream's seed is `fnv1a32(name) ^ worldSeed`, so the
//     `map`/`loot`/`ai`/… streams are mutually independent and reproducible.
//   • child(path) derives an independent sub-Rng (used by world-gen: `worldgen/<zoneId>`),
//     so generating or re-tuning one zone never shifts a gameplay stream.
//   • roll(n) maps one u32 through `floor(u32 / 2^32 * n)` — a single draw per roll (not
//     rejection sampling), chosen so adding a roll consumes exactly one u32 (predictable
//     stream advancement for replay reasoning). This is NOT raw `u32 % n`: the multiplicative
//     map spreads the ≤ 2^-32·n bias uniformly across the range rather than concentrating it
//     on the low values the way modulo does. For game-scale `n` the bias is unobservable.

/** The top-level gameplay/generation streams (determinism.md). Child paths extend this. */
export type StreamName = "map" | "loot" | "combat" | "ai" | "monsterSpawn" | "fx";

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const GOLDEN = 0x9e3779b9; // 2^32 / golden ratio — splitmix32 increment
const TWO32 = 4294967296; // 2^32

/** FNV-1a 32-bit over a string's UTF-16 code units (stable, engine-independent). */
export function fnv1a32(s: string): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i) & 0xff;
    h = Math.imul(h, FNV_PRIME);
    h ^= (s.charCodeAt(i) >>> 8) & 0xff;
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** One splitmix32 step: given counter `a`, return the next counter and the output uint32. */
function splitmix32(a: number): { next: number; out: number } {
  const next = (a + GOLDEN) | 0;
  let t = next ^ (next >>> 16);
  t = Math.imul(t, 0x21f0aaad);
  t = t ^ (t >>> 15);
  t = Math.imul(t, 0x735a2d97);
  t = t ^ (t >>> 15);
  return { next, out: t >>> 0 };
}

export class Rng {
  readonly worldSeed: number;
  private readonly state = new Map<string, number>();

  constructor(worldSeed: number) {
    this.worldSeed = worldSeed | 0;
  }

  private seedFor(key: string): number {
    return (fnv1a32(key) ^ this.worldSeed) >>> 0;
  }

  /** Uniform uint32 from a stream. */
  u32(stream: string): number {
    const cur = this.state.get(stream) ?? this.seedFor(stream);
    const { next, out } = splitmix32(cur | 0);
    this.state.set(stream, next);
    return out;
  }

  /** Integer in [0, n). See the module header for the single-draw / bias rationale. */
  roll(stream: string, n: number): number {
    if (n <= 1) return 0;
    return Math.floor((this.u32(stream) / TWO32) * n);
  }

  /** Uniform float in [0, 1). */
  float(stream: string): number {
    return this.u32(stream) / TWO32;
  }

  /** Uniform element of a non-empty array. */
  pick<T>(stream: string, xs: readonly T[]): T {
    if (xs.length === 0) throw new Error("Rng.pick: empty array");
    const v = xs[this.roll(stream, xs.length)];
    if (v === undefined) throw new Error("Rng.pick: undefined element");
    return v;
  }

  /** An independent sub-Rng keyed by `path` (e.g. `worldgen/<zoneId>`). */
  child(path: string): Rng {
    return new Rng(this.seedFor(`child:${path}`));
  }
}
