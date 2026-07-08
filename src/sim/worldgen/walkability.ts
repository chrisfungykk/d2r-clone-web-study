// Walkability grid — the 0.5 m cell bitfield the sim consumes (world-generation.md
// "Walkability derivation"). Flat Uint8Array, row-major. Bit hashing is the golden test.

import { fnv1aBytes } from "../hash.ts";

export const WALK = 1 << 0; // units may occupy
export const LOS = 1 << 1; // blocks sight
export const FLY = 1 << 2; // blocks missiles
export const SPAWN = 1 << 3; // monster packs may seed here

export class WalkGrid {
  readonly cells: number;
  readonly bits: Uint8Array;

  constructor(cells: number, fill = 0) {
    this.cells = cells;
    this.bits = new Uint8Array(cells * cells);
    if (fill !== 0) this.bits.fill(fill);
  }

  idx(i: number, j: number): number {
    return j * this.cells + i;
  }

  inBounds(i: number, j: number): boolean {
    return i >= 0 && j >= 0 && i < this.cells && j < this.cells;
  }

  get(i: number, j: number): number {
    return this.bits[j * this.cells + i] ?? 0;
  }

  has(i: number, j: number, bit: number): boolean {
    return (this.get(i, j) & bit) !== 0;
  }

  setBit(i: number, j: number, bit: number): void {
    const k = j * this.cells + i;
    this.bits[k] = (this.bits[k] ?? 0) | bit;
  }

  clearBit(i: number, j: number, bit: number): void {
    const k = j * this.cells + i;
    this.bits[k] = (this.bits[k] ?? 0) & ~bit;
  }

  /** FNV-1a 32 of the raw bytes — the deterministic golden hash for zone generation. */
  hash(): number {
    return fnv1aBytes(this.bits);
  }
}

export interface FloodResult {
  visited: Uint8Array; // 1 where reachable from the start via WALK cells
  count: number; // number of reachable WALK cells
}

/** 8-connected flood fill over WALK cells from (si, sj). */
export function floodFill(grid: WalkGrid, si: number, sj: number): FloodResult {
  const n = grid.cells;
  const visited = new Uint8Array(n * n);
  let count = 0;
  if (!grid.has(si, sj, WALK)) return { visited, count };
  // Explicit stack (avoids recursion depth on large zones).
  const stack: number[] = [sj * n + si];
  visited[sj * n + si] = 1;
  while (stack.length > 0) {
    const k = stack.pop() as number;
    count += 1;
    const i = k % n;
    const j = (k - i) / n;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= n || nj >= n) continue;
        const nk = nj * n + ni;
        if (visited[nk] === 1) continue;
        if (!grid.has(ni, nj, WALK)) continue;
        visited[nk] = 1;
        stack.push(nk);
      }
    }
  }
  return { visited, count };
}

/** Count WALK cells in the grid. */
export function countWalkable(grid: WalkGrid): number {
  let c = 0;
  for (let k = 0; k < grid.bits.length; k++) if (((grid.bits[k] ?? 0) & WALK) !== 0) c += 1;
  return c;
}
