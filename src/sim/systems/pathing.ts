// Player / scripted-NPC pathfinding — A* on the 0.5 m grid (simulation-runtime.md
// "Pathfinding"). Octile heuristic, M-radius clearance, corner rule (no wall-corner
// clipping), ≤ 8000 expanded nodes, then string-pulling. Tie-break is explicit — equal f
// resolves to the lower cell index — so the search is bit-deterministic across engines.

import { walkableRay } from "../los.ts";
import { CELL_M } from "../worldgen/heightfield.ts";
import { WALK, type WalkGrid } from "../worldgen/walkability.ts";

const SQRT2 = Math.SQRT2; // spec-mandated IEEE-754 constant (deterministic across engines)
const SQRT2_M2 = SQRT2 - 2;
export const NODE_BUDGET = 8000;

export interface PathPoint {
  x: number;
  z: number;
}

export interface PathResult {
  points: PathPoint[]; // world-space waypoints after the start (empty if already there)
  found: boolean;
  expanded: number;
}

const center = (cell: number): number => (cell + 0.5) * CELL_M;

/** A cell is passable if every cell within the mover's clearance radius is WALK. */
function passable(grid: WalkGrid, i: number, j: number, rc: number): boolean {
  for (let dj = -rc; dj <= rc; dj++) {
    for (let di = -rc; di <= rc; di++) {
      if (!grid.has(i + di, j + dj, WALK)) return false;
    }
  }
  return true;
}

/** Nearest passable cell to (ti,tj) within a small ring search; returns its index or -1. */
function snapToPassable(grid: WalkGrid, ti: number, tj: number, rc: number): number {
  if (grid.inBounds(ti, tj) && passable(grid, ti, tj, rc)) return tj * grid.cells + ti;
  for (let r = 1; r <= 8; r++) {
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ti + di;
        const j = tj + dj;
        if (grid.inBounds(i, j) && passable(grid, i, j, rc)) return j * grid.cells + i;
      }
    }
  }
  return -1;
}

// Binary min-heap of cell indices keyed by (f, idx) — deterministic ordering.
class OpenSet {
  private readonly heap: number[] = [];
  private readonly f: Float64Array;
  constructor(size: number) {
    this.f = new Float64Array(size);
  }
  get size(): number {
    return this.heap.length;
  }
  private less(a: number, b: number): boolean {
    const fa = this.f[a] as number;
    const fb = this.f[b] as number;
    return fa < fb || (fa === fb && a < b); // tie-break: lower cell index first
  }
  push(idx: number, f: number): void {
    this.f[idx] = f;
    const h = this.heap;
    h.push(idx);
    let c = h.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (this.less(h[c] as number, h[p] as number)) {
        [h[c], h[p]] = [h[p] as number, h[c] as number];
        c = p;
      } else break;
    }
  }
  pop(): number {
    const h = this.heap;
    const top = h[0] as number;
    const last = h.pop() as number;
    if (h.length > 0) {
      h[0] = last;
      let c = 0;
      for (;;) {
        const l = 2 * c + 1;
        const r = l + 1;
        let m = c;
        if (l < h.length && this.less(h[l] as number, h[m] as number)) m = l;
        if (r < h.length && this.less(h[r] as number, h[m] as number)) m = r;
        if (m === c) break;
        [h[c], h[m]] = [h[m] as number, h[c] as number];
        c = m;
      }
    }
    return top;
  }
}

function octile(dx: number, dz: number): number {
  const ax = Math.abs(dx);
  const az = Math.abs(dz);
  return ax + az + SQRT2_M2 * Math.min(ax, az);
}

const NEIGHBORS: readonly [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
];

/** A* from world (sx,sz) to (tx,tz). radiusCells = mover clearance (M = 2). */
export function findPath(
  grid: WalkGrid,
  sx: number,
  sz: number,
  tx: number,
  tz: number,
  radiusCells = 0,
): PathResult {
  const n = grid.cells;
  const si = Math.floor(sx / CELL_M);
  const sj = Math.floor(sz / CELL_M);
  const ti0 = Math.floor(tx / CELL_M);
  const tj0 = Math.floor(tz / CELL_M);

  if (!grid.inBounds(si, sj)) return { points: [], found: false, expanded: 0 };
  const goalIdx = snapToPassable(grid, ti0, tj0, radiusCells);
  if (goalIdx < 0) return { points: [], found: false, expanded: 0 };
  const gi = goalIdx % n;
  const gj = (goalIdx - gi) / n;
  const startIdx = sj * n + si;
  if (startIdx === goalIdx) return { points: [], found: true, expanded: 0 };

  const gScore = new Float64Array(n * n).fill(Number.POSITIVE_INFINITY);
  const came = new Int32Array(n * n).fill(-1);
  const closed = new Uint8Array(n * n);
  const open = new OpenSet(n * n);

  gScore[startIdx] = 0;
  open.push(startIdx, octile(gi - si, gj - sj));
  let expanded = 0;
  let bestIdx = startIdx;
  let bestH = octile(gi - si, gj - sj);

  while (open.size > 0) {
    const cur = open.pop();
    if (closed[cur] === 1) continue;
    closed[cur] = 1;
    expanded += 1;

    if (cur === goalIdx) return { points: buildPath(grid, came, startIdx, goalIdx), found: true, expanded };
    if (expanded >= NODE_BUDGET) break;

    const ci = cur % n;
    const cj = (cur - ci) / n;
    const h = octile(gi - ci, gj - cj);
    if (h < bestH) {
      bestH = h;
      bestIdx = cur;
    }

    for (const [di, dj, cost] of NEIGHBORS) {
      const ni = ci + di;
      const nj = cj + dj;
      if (!grid.inBounds(ni, nj) || !passable(grid, ni, nj, radiusCells)) continue;
      if (di !== 0 && dj !== 0) {
        // corner rule: both orthogonal neighbours must be passable
        if (!passable(grid, ci + di, cj, radiusCells) || !passable(grid, ci, cj + dj, radiusCells))
          continue;
      }
      const nIdx = nj * n + ni;
      if (closed[nIdx] === 1) continue;
      const tentative = (gScore[cur] as number) + cost;
      if (tentative < (gScore[nIdx] as number)) {
        gScore[nIdx] = tentative;
        came[nIdx] = cur;
        open.push(nIdx, tentative + octile(gi - ni, gj - nj));
      }
    }
  }

  // No path within budget — best effort toward the closest explored cell.
  if (bestIdx === startIdx) return { points: [], found: false, expanded };
  return { points: buildPath(grid, came, startIdx, bestIdx), found: false, expanded };
}

function buildPath(grid: WalkGrid, came: Int32Array, startIdx: number, endIdx: number): PathPoint[] {
  const n = grid.cells;
  const chain: number[] = [];
  let cur = endIdx;
  while (cur !== startIdx && cur >= 0) {
    chain.push(cur);
    cur = came[cur] as number;
  }
  chain.reverse();
  // String-pull: drop waypoints reachable from the previous kept point by a walkable ray.
  const rawPts: PathPoint[] = chain.map((idx) => {
    const i = idx % n;
    return { x: center(i), z: center((idx - i) / n) };
  });
  const si = startIdx % n;
  const startPt: PathPoint = { x: center(si), z: center((startIdx - si) / n) };
  const out: PathPoint[] = [];
  let anchor = startPt;
  for (let k = 0; k < rawPts.length; k++) {
    const nextExists = k + 1 < rawPts.length;
    const cand = rawPts[k] as PathPoint;
    const after = nextExists ? (rawPts[k + 1] as PathPoint) : null;
    // keep this point if we cannot see straight past it to the next one
    if (!after || !walkableRay(grid, anchor.x, anchor.z, after.x, after.z)) {
      out.push(cand);
      anchor = cand;
    }
  }
  return out;
}
