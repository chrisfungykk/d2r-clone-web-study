// Zone assembly — a pure function of (worldSeed, zoneRow) (world-generation.md "Determinism").
// Owns the runtime grids (heightfield, walkability), bilinear terrainHeight, and the ZoneView
// projection the renderer samples at chunk-build time (no heightfield DTO crosses the seam).

import type { ZoneView } from "../world_api.ts";
import { SIZE_M, ZONES, type ZoneRow } from "./data/zones.ts";
import { Rng } from "./rng.ts";
import { CELL_M, generateHeightfield } from "./worldgen/heightfield.ts";
import { generateOutdoor, type Point, type PropPlacement } from "./worldgen/outdoor.ts";
import { WALK, type WalkGrid } from "./worldgen/walkability.ts";

const clampInt = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

export class Zone {
  readonly id: string;
  readonly theme: string;
  readonly seed: number;
  readonly sizeM: number;
  readonly cells: number;
  readonly heightfield: Float32Array;
  readonly grid: WalkGrid;
  readonly props: readonly PropPlacement[];
  readonly entrance: Point;
  readonly exit: Point;
  readonly waypoint: Point;
  readonly reachableFraction: number;

  constructor(worldSeed: number, row: ZoneRow) {
    this.id = row.id;
    this.theme = row.theme;
    this.seed = worldSeed | 0;
    this.sizeM = SIZE_M[row.size];
    this.cells = Math.round(this.sizeM / CELL_M);

    // Independent worldgen sub-streams (never touch gameplay streams).
    const wr = new Rng(worldSeed).child(`worldgen/${row.id}`);
    const heightSeed = wr.child("height").u32("seed");
    this.heightfield = generateHeightfield(heightSeed, this.cells, row.height);

    const outdoor = generateOutdoor(wr.child("layout"), this.cells, this.heightfield, row.outdoor);
    this.grid = outdoor.grid;
    this.props = outdoor.props;
    this.entrance = outdoor.entrance;
    this.exit = outdoor.exit;
    this.waypoint = outdoor.waypoint;
    this.reachableFraction = outdoor.reachableFraction;
  }

  /** Bilinear terrain height at world (x, z); clamps to the edge outside the footprint. */
  terrainHeight(x: number, z: number): number {
    const n = this.cells;
    const fx = x / CELL_M - 0.5; // fractional cell-centre index
    const fz = z / CELL_M - 0.5;
    const i0f = Math.floor(fx);
    const j0f = Math.floor(fz);
    const tx = fx - i0f;
    const tz = fz - j0f;
    const i0 = clampInt(i0f, 0, n - 1);
    const i1 = clampInt(i0f + 1, 0, n - 1);
    const j0 = clampInt(j0f, 0, n - 1);
    const j1 = clampInt(j0f + 1, 0, n - 1);
    const hf = this.heightfield;
    const h00 = hf[j0 * n + i0] ?? 0;
    const h10 = hf[j0 * n + i1] ?? 0;
    const h01 = hf[j1 * n + i0] ?? 0;
    const h11 = hf[j1 * n + i1] ?? 0;
    const a = h00 + (h10 - h00) * tx;
    const b = h01 + (h11 - h01) * tx;
    return a + (b - a) * tz;
  }

  /** Is world (x, z) on a walkable cell? */
  walkAt(x: number, z: number): boolean {
    const i = Math.floor(x / CELL_M);
    const j = Math.floor(z / CELL_M);
    return this.grid.inBounds(i, j) && this.grid.has(i, j, WALK);
  }

  /** Golden hash of the walkability grid — the zone-generation determinism test. */
  walkabilityHash(): number {
    return this.grid.hash();
  }

  /** Project the seam ZoneView (props + metadata; automap reveal lands with the automap system). */
  view(): ZoneView {
    return {
      id: this.id,
      theme: this.theme,
      seed: this.seed,
      widthM: this.sizeM,
      depthM: this.sizeM,
      props: this.props.map((p) => ({
        archetype: p.archetype,
        x: p.x,
        z: p.z,
        facing: p.facing,
        scale: p.scale,
      })),
      automapWidth: 0,
      automapDepth: 0,
      automap: [],
    };
  }
}

/** Generate the (bit-identical) zone for a worldSeed + zone id. */
export function generateZone(worldSeed: number, zoneId: string): Zone {
  const row = ZONES.find((z) => z.id === zoneId);
  if (row === undefined) throw new Error(`generateZone: unknown zone '${zoneId}'`);
  return new Zone(worldSeed, row);
}
