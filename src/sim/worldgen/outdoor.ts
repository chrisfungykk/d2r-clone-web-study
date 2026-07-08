// Outdoor scatter generator (world-generation.md "Outdoor scatter"). Constructive
// connectivity: the entrance→waypoint→exit spine is carved walkable first, features are
// dart-thrown around it, then a flood fill fills any unreachable pockets so the guarantee is
// exact. Draws only from the passed zone Rng's named sub-streams — deterministic, order-free.

import type { Rng } from "../rng.ts";
import { CELL_M } from "./heightfield.ts";
import { countWalkable, FLY, floodFill, LOS, SPAWN, WALK, WalkGrid } from "./walkability.ts";

export interface PropPlacement {
  archetype: string;
  x: number;
  z: number;
  facing: number;
  scale: number;
}

export interface Point {
  x: number;
  z: number;
}

export interface OutdoorParams {
  borderM: number;
  cliffDeltaM: number;
  spineWidthM: number;
  scatter: { tree: number; rock: number; ruin: number };
  minSpacingM: number;
}

export interface OutdoorResult {
  grid: WalkGrid;
  props: PropPlacement[];
  entrance: Point;
  exit: Point;
  waypoint: Point;
  reachableFraction: number;
}

const cellOf = (world: number): number => Math.floor(world / CELL_M);
const worldCenter = (cell: number): number => (cell + 0.5) * CELL_M;

/** Stamp a walkable disc (spine carving) — forces WALK|SPAWN, clears LOS|FLY. */
function stampWalkable(grid: WalkGrid, spine: Uint8Array, cx: number, cz: number, radiusM: number): void {
  const r = Math.ceil(radiusM / CELL_M);
  const ci = cellOf(cx);
  const cj = cellOf(cz);
  const r2 = radiusM * radiusM;
  for (let dj = -r; dj <= r; dj++) {
    for (let di = -r; di <= r; di++) {
      const i = ci + di;
      const j = cj + dj;
      if (!grid.inBounds(i, j)) continue;
      const dx = worldCenter(i) - cx;
      const dz = worldCenter(j) - cz;
      if (dx * dx + dz * dz > r2) continue;
      grid.setBit(i, j, WALK | SPAWN);
      grid.clearBit(i, j, LOS | FLY);
      spine[j * grid.cells + i] = 1;
    }
  }
}

function carveSegment(grid: WalkGrid, spine: Uint8Array, a: Point, b: Point, widthM: number): void {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.max(1, Math.ceil(len / (CELL_M * 0.5)));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    stampWalkable(grid, spine, a.x + dx * t, a.z + dz * t, widthM / 2);
  }
}

export function generateOutdoor(
  rng: Rng,
  cells: number,
  heightfield: Float32Array,
  p: OutdoorParams,
): OutdoorResult {
  const grid = new WalkGrid(cells, WALK | SPAWN);
  const spine = new Uint8Array(cells * cells);
  const sizeM = cells * CELL_M;
  const border = Math.round(p.borderM / CELL_M);

  // 1. Border ring — impassable, blocks sight + missiles (dressed with edge props).
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      if (i < border || j < border || i >= cells - border || j >= cells - border) {
        grid.clearBit(i, j, WALK | SPAWN);
        grid.setBit(i, j, LOS | FLY);
      }
    }
  }

  // 2. Cliffs — adjacent-cell height delta > threshold ⇒ unwalkable.
  const h = (i: number, j: number): number => heightfield[j * cells + i] ?? 0;
  for (let j = 1; j < cells - 1; j++) {
    for (let i = 1; i < cells - 1; i++) {
      const c = h(i, j);
      const d = Math.max(
        Math.abs(h(i + 1, j) - c),
        Math.abs(h(i - 1, j) - c),
        Math.abs(h(i, j + 1) - c),
        Math.abs(h(i, j - 1) - c),
      );
      if (d > p.cliffDeltaM) grid.clearBit(i, j, WALK | SPAWN);
    }
  }

  // 3. Entrance / waypoint / exit (waypoint ≥ 20 m from entrance, world-generation.md).
  const jitter = (stream: string, span: number) => (rng.float(stream) - 0.5) * span;
  const midZ = sizeM / 2;
  const entrance: Point = { x: p.borderM + 2, z: midZ + jitter("entranceZ", sizeM * 0.4) };
  const exit: Point = { x: sizeM - p.borderM - 2, z: midZ + jitter("exitZ", sizeM * 0.4) };
  const waypoint: Point = {
    x: sizeM / 2 + jitter("wpX", sizeM * 0.2),
    z: midZ + jitter("wpZ", sizeM * 0.3),
  };

  // 4. Spine carve — forced walkable, connectivity is constructive.
  carveSegment(grid, spine, entrance, waypoint, p.spineWidthM);
  carveSegment(grid, spine, waypoint, exit, p.spineWidthM);

  // 5. Feature scatter — dart-throwing with min-spacing (30 attempts per feature).
  const props: PropPlacement[] = [];
  const scatterKinds: { kind: string; count: number; footprintM: number; blocksLos: boolean }[] = [
    { kind: "tree", count: p.scatter.tree, footprintM: 0.8, blocksLos: true },
    { kind: "ruin", count: p.scatter.ruin, footprintM: 1.6, blocksLos: true },
    { kind: "rock", count: p.scatter.rock, footprintM: 1.0, blocksLos: false },
  ];
  const minSpace2 = p.minSpacingM * p.minSpacingM;
  for (const spec of scatterKinds) {
    for (let placed = 0; placed < spec.count; placed++) {
      let ok = false;
      for (let attempt = 0; attempt < 30 && !ok; attempt++) {
        const wx = worldCenter(rng.roll("scatterX", cells));
        const wz = worldCenter(rng.roll("scatterZ", cells));
        const ci = cellOf(wx);
        const cj = cellOf(wz);
        if (!grid.has(ci, cj, WALK)) continue;
        // spacing against already-placed features
        let clear = true;
        for (const pr of props) {
          const ddx = pr.x - wx;
          const ddz = pr.z - wz;
          if (ddx * ddx + ddz * ddz < minSpace2) {
            clear = false;
            break;
          }
        }
        if (!clear) continue;
        // footprint must not touch the spine
        const fr = Math.ceil(spec.footprintM / CELL_M);
        let hitsSpine = false;
        for (let dj = -fr; dj <= fr && !hitsSpine; dj++) {
          for (let di = -fr; di <= fr; di++) {
            const i = ci + di;
            const j = cj + dj;
            if (grid.inBounds(i, j) && spine[j * cells + i] === 1) {
              hitsSpine = true;
              break;
            }
          }
        }
        if (hitsSpine) continue;
        // place: clear footprint walkability, optionally block LOS
        for (let dj = -fr; dj <= fr; dj++) {
          for (let di = -fr; di <= fr; di++) {
            const i = ci + di;
            const j = cj + dj;
            if (!grid.inBounds(i, j)) continue;
            grid.clearBit(i, j, WALK | SPAWN);
            if (spec.blocksLos) grid.setBit(i, j, LOS | FLY);
          }
        }
        props.push({
          archetype: spec.kind,
          x: wx,
          z: wz,
          facing: rng.float("scatterFacing") * Math.PI * 2,
          scale: 0.8 + rng.float("scatterScale") * 0.6,
        });
        ok = true;
      }
    }
  }

  // 6. Flood-fill repair — fill unreachable WALK pockets so the main component is 100%.
  const entI = cellOf(entrance.x);
  const entJ = cellOf(entrance.z);
  const totalWalkBefore = countWalkable(grid);
  const flood = floodFill(grid, entI, entJ);
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      if (grid.has(i, j, WALK) && flood.visited[j * cells + i] !== 1) {
        grid.clearBit(i, j, WALK | SPAWN);
      }
    }
  }
  const reachableFraction = totalWalkBefore > 0 ? flood.count / totalWalkBefore : 1;

  return { grid, props, entrance, exit, waypoint, reachableFraction };
}
