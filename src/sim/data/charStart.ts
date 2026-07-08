// Per-class starting data (data-model.md `charStart`). Phase 0 ships one dev class row so the
// engine exercises content-as-data from day 0; the full 7-class roster arrives in Phase 3.

export interface CharStartRow {
  classId: string;
  name: string;
  baseLife: number;
  baseMana: number;
  moveKey: string; // → speeds.ts MOVE_PROFILES
  radiusM: number; // collision size class (M = 1.0)
  clearanceCells: number; // pathing/locomotion clearance radius in 0.5 m cells
}

const dev: CharStartRow = {
  classId: "wanderer",
  name: "Wanderer",
  baseLife: 50,
  baseMana: 20,
  moveKey: "player",
  radiusM: 1.0,
  clearanceCells: 1,
};

export const CHAR_START = [dev] as const satisfies readonly CharStartRow[];

export const DEV_CLASS_ID = dev.classId;

export function charStartById(id: string): CharStartRow | undefined {
  return CHAR_START.find((c) => c.classId === id);
}
