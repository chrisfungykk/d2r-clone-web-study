// Value-noise heightfield (world-generation.md "Heightfield").
//
// Deterministic fractal value noise: lattice values come from an integer hash of (gx, gz,
// octave, seed) — no stored lattice, no transcendentals, no Math.random. Smoothstep
// interpolation and octave summation are plain arithmetic, so the field is bit-identical for
// the same seed on every engine. Heights are sampled at 0.5 m cell centres so the walkability
// pass can detect cliffs from adjacent-cell deltas.

export const CELL_M = 0.5;

export interface HeightParams {
  amplitudeM: number; // peak-to-trough scale
  baseFreq: number; // cycles per metre for octave 0
  octaves: number;
  persistence: number; // amplitude falloff per octave
}

/** Integer hash of a lattice point → [0, 1). */
function latticeValue(seed: number, gx: number, gz: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ gx, 0x27d4eb2d);
  h = Math.imul(h ^ gz, 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Single-octave value noise at lattice-space coords. */
function valueNoise(seed: number, x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = smooth(x - x0);
  const tz = smooth(z - z0);
  const v00 = latticeValue(seed, x0, z0);
  const v10 = latticeValue(seed, x0 + 1, z0);
  const v01 = latticeValue(seed, x0, z0 + 1);
  const v11 = latticeValue(seed, x0 + 1, z0 + 1);
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * tz;
}

/** Fractal Brownian motion in [0, 1). */
export function fbm(seed: number, wx: number, wz: number, p: HeightParams): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = p.baseFreq;
  for (let o = 0; o < p.octaves; o++) {
    const oseed = (seed ^ Math.imul(o + 1, 0x9e3779b9)) | 0;
    sum += amp * valueNoise(oseed, wx * freq, wz * freq);
    norm += amp;
    amp *= p.persistence;
    freq *= 2;
  }
  return norm > 0 ? sum / norm : 0;
}

/** Row-major (cells × cells) height grid sampled at 0.5 m cell centres. */
export function generateHeightfield(seed: number, cells: number, p: HeightParams): Float32Array {
  const hf = new Float32Array(cells * cells);
  for (let j = 0; j < cells; j++) {
    const wz = (j + 0.5) * CELL_M;
    for (let i = 0; i < cells; i++) {
      const wx = (i + 0.5) * CELL_M;
      hf[j * cells + i] = fbm(seed, wx, wz, p) * p.amplitudeM;
    }
  }
  return hf;
}
