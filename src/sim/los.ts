// Line of sight + walkable rays — integer DDA over the 0.5 m grid (simulation-runtime.md
// "Line of sight"). Amanatides–Woo voxel traversal, no transcendentals, so results are
// deterministic and independent of camera zoom (camera.md fairness rule).

import { CELL_M } from "./worldgen/heightfield.ts";
import { LOS, WALK, type WalkGrid } from "./worldgen/walkability.ts";

/** Walk grid cells along (x0,z0)→(x1,z1); return false as soon as `blocks(i,j)` is true. */
function traverse(
  grid: WalkGrid,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  blocks: (i: number, j: number) => boolean,
): boolean {
  let ix = Math.floor(x0 / CELL_M);
  let iz = Math.floor(z0 / CELL_M);
  const ex = Math.floor(x1 / CELL_M);
  const ez = Math.floor(z1 / CELL_M);

  const dx = x1 - x0;
  const dz = z1 - z0;
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

  const tDeltaX = dx !== 0 ? CELL_M / Math.abs(dx) : Number.POSITIVE_INFINITY;
  const tDeltaZ = dz !== 0 ? CELL_M / Math.abs(dz) : Number.POSITIVE_INFINITY;
  let tMaxX =
    dx !== 0 ? ((stepX > 0 ? (ix + 1) * CELL_M : ix * CELL_M) - x0) / dx : Number.POSITIVE_INFINITY;
  let tMaxZ =
    dz !== 0 ? ((stepZ > 0 ? (iz + 1) * CELL_M : iz * CELL_M) - z0) / dz : Number.POSITIVE_INFINITY;

  const maxSteps = grid.cells * 2 + 4;
  for (let guard = 0; guard < maxSteps; guard++) {
    if (blocks(ix, iz)) return false;
    if (ix === ex && iz === ez) return true;
    if (tMaxX <= tMaxZ) {
      ix += stepX;
      tMaxX += tDeltaX;
    } else {
      iz += stepZ;
      tMaxZ += tDeltaZ;
    }
    if (!grid.inBounds(ix, iz)) return false;
  }
  return true;
}

/** Sight is clear (no LOS-blocking cell) between two world points. */
export function hasLineOfSight(grid: WalkGrid, x0: number, z0: number, x1: number, z1: number): boolean {
  return traverse(grid, x0, z0, x1, z1, (i, j) => grid.has(i, j, LOS));
}

/** The straight segment stays on walkable cells (used for path string-pulling). */
export function walkableRay(grid: WalkGrid, x0: number, z0: number, x1: number, z1: number): boolean {
  return traverse(grid, x0, z0, x1, z1, (i, j) => !grid.has(i, j, WALK));
}
