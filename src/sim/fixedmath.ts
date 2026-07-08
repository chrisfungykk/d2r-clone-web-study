// Deterministic trigonometry via committed lookup tables (determinism.md).
//
// The sim never calls Math.sin/cos/atan (cross-engine transcendental risk + sim-purity gate).
// Instead it reads the literal tables in fixedmath-tables.ts and linearly interpolates.
// Math.sqrt / abs / floor / min / max ARE allowed — IEEE-754 exact / deterministic across
// engines.
//
// Tables are copied into Float64Array once at module load: the values are bit-identical to
// the committed literals, and typed-array indexing is `number` (clean under
// noUncheckedIndexedAccess).

import { ATAN_N, ATAN_TABLE, SIN_N, SIN_TABLE } from "./fixedmath-tables.ts";

export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

const SIN = Float64Array.from(SIN_TABLE);
const ATAN = Float64Array.from(ATAN_TABLE);
const SIN_SCALE = SIN_N / TWO_PI;

/** sin(a) — linear interpolation over the 4096-entry table. */
export function sin(a: number): number {
  const pos = a * SIN_SCALE;
  const i = Math.floor(pos);
  const f = pos - i;
  let i0 = i % SIN_N;
  if (i0 < 0) i0 += SIN_N;
  const i1 = i0 + 1 === SIN_N ? 0 : i0 + 1;
  // i0, i1 are provably in [0, SIN_N) and SIN has SIN_N entries.
  const s0 = SIN[i0] as number;
  return s0 + ((SIN[i1] as number) - s0) * f;
}

/** cos(a) = sin(a + π/2). */
export function cos(a: number): number {
  return sin(a + HALF_PI);
}

/** atan(r) for r in [0, 1] — table lookup with linear interpolation. */
function atanUnit(r: number): number {
  const pos = r * ATAN_N;
  const i = Math.floor(pos);
  const i0 = i >= ATAN_N ? ATAN_N : i;
  const i1 = i0 >= ATAN_N ? ATAN_N : i0 + 1;
  const a0 = ATAN[i0] as number;
  return a0 + ((ATAN[i1] as number) - a0) * (pos - i0);
}

/** atan2(y, x) in (−π, π], via octant reduction over the atan table. */
export function atan2(y: number, x: number): number {
  if (x === 0 && y === 0) return 0;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  let a = ax >= ay ? atanUnit(ay / ax) : HALF_PI - atanUnit(ax / ay);
  if (x < 0) a = PI - a;
  if (y < 0) a = -a;
  return a;
}

/** Euclidean length (uses IEEE-exact sqrt, not the transcendental hypot). */
export function len(dx: number, dz: number): number {
  return Math.sqrt(dx * dx + dz * dz);
}

/** Wrap an angle into [−π, π). */
export function wrapAngle(a: number): number {
  let r = a % TWO_PI;
  if (r < -PI) r += TWO_PI;
  else if (r >= PI) r -= TWO_PI;
  return r;
}
