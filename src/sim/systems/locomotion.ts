// Locomotion — integrate movement along a path (simulation-runtime.md "Movement
// resolution"). Sub-stepped at ≤ 0.5 m to prevent tunnelling; on a blocked step, try the
// x-only then z-only projection (slide), else stop. Clearance uses the same cell radius as
// pathing so a path cell always fits. Updates the sim-owned AnimState.

import type { Entity } from "../entity.ts";
import { atan2 } from "../fixedmath.ts";
import { CELL_M } from "../worldgen/heightfield.ts";
import { WALK, type WalkGrid } from "../worldgen/walkability.ts";

const SUBSTEP_M = 0.5;
const WAYPOINT_EPS = 0.12; // metres
export const RUN_FRAMES = 8;

/** Does the mover (clearance `rc` cells) fit centred at world (x,z)? */
function fits(grid: WalkGrid, x: number, z: number, rc: number): boolean {
  const ci = Math.floor(x / CELL_M);
  const cj = Math.floor(z / CELL_M);
  for (let dj = -rc; dj <= rc; dj++) {
    for (let di = -rc; di <= rc; di++) {
      if (!grid.has(ci + di, cj + dj, WALK)) return false;
    }
  }
  return true;
}

function setAnim(e: Entity, moving: boolean): void {
  if (e.anim === undefined) return;
  if (moving) {
    e.anim.state = "run";
    e.anim.totalFrames = RUN_FRAMES;
    e.anim.frame = (e.anim.frame + 1) % RUN_FRAMES;
  } else {
    e.anim.state = "idle";
    e.anim.totalFrames = 1;
    e.anim.frame = 0;
  }
}

/** Advance one entity along its path for a single tick. */
export function stepLocomotion(grid: WalkGrid, e: Entity, rc: number): void {
  const loco = e.locomotion;
  if (loco === undefined) return;
  let budget = loco.speed;
  let moved = false;

  while (budget > 1e-6 && loco.pathIndex < loco.path.length) {
    const wp = loco.path[loco.pathIndex];
    if (wp === undefined) break;
    const dx = wp.x - e.transform.x;
    const dz = wp.z - e.transform.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= WAYPOINT_EPS) {
      loco.pathIndex += 1;
      continue;
    }
    const step = Math.min(budget, SUBSTEP_M, dist);
    const ux = dx / dist;
    const uz = dz / dist;
    const nx = e.transform.x + ux * step;
    const nz = e.transform.z + uz * step;
    e.transform.facing = atan2(dz, dx);

    if (fits(grid, nx, nz, rc)) {
      e.transform.x = nx;
      e.transform.z = nz;
      budget -= step;
      moved = true;
    } else if (fits(grid, nx, e.transform.z, rc)) {
      e.transform.x = nx; // slide along x
      budget -= step;
      moved = true;
    } else if (fits(grid, e.transform.x, nz, rc)) {
      e.transform.z = nz; // slide along z
      budget -= step;
      moved = true;
    } else {
      break; // fully blocked
    }
  }

  if (loco.pathIndex >= loco.path.length) {
    loco.path = [];
    loco.pathIndex = 0;
  }
  setAnim(e, moved);
}
