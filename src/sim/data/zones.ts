// Zone content table (data-model.md). Systems interpret rows; they never special-case ids.
// Phase 0 ships exactly one dev-zone row (content-as-data live from day 0). Later phases add
// rows/parameter sets, never new generators (world-generation.md: 3 families).

import type { ZoneId } from "../../world_api.ts";
import type { HeightParams } from "../worldgen/heightfield.ts";
import type { OutdoorParams } from "../worldgen/outdoor.ts";

export type GeneratorFamily = "outdoor_scatter" | "room_graph" | "cellular";
export type ZoneSize = "small" | "medium" | "large";

export interface ZoneRow {
  id: ZoneId;
  theme: string;
  family: GeneratorFamily;
  generatorKey: string; // parameterization key, e.g. "wilderness_open"
  size: ZoneSize;
  height: HeightParams;
  outdoor: OutdoorParams;
}

/** Footprint in metres by size class (world-generation.md "Footprints & grids"). */
export const SIZE_M: Record<ZoneSize, number> = { small: 96, medium: 160, large: 256 };

const devZone: ZoneRow = {
  id: "dev_wilderness",
  theme: "wilderness",
  family: "outdoor_scatter",
  generatorKey: "wilderness_open",
  size: "medium",
  height: { amplitudeM: 3, baseFreq: 1 / 22, octaves: 3, persistence: 0.5 },
  outdoor: {
    borderM: 4,
    cliffDeltaM: 0.5,
    spineWidthM: 3.5,
    scatter: { tree: 70, rock: 34, ruin: 8 },
    minSpacingM: 3,
  },
};

export const ZONES = [devZone] as const satisfies readonly ZoneRow[];

export function zoneById(id: ZoneId): ZoneRow | undefined {
  return ZONES.find((z) => z.id === id);
}

export const DEV_ZONE_ID: ZoneId = devZone.id;
