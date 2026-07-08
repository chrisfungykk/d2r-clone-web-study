// Animation / movement speed table (data-model.md `speeds`). All speeds are in metres per
// 25 Hz tick (frames-native, per determinism.md) — never milliseconds. Phase 0 ships the one
// dev archetype; weapon-class breakpoint inputs arrive with the combat phase.

export interface MoveProfile {
  walk: number; // m/tick
  run: number; // m/tick
}

export const MOVE_PROFILES: Record<string, MoveProfile> = {
  // ~4 m/s walk, ~6 m/s run at 25 Hz.
  player: { walk: 0.16, run: 0.24 },
};

export function moveProfile(key: string): MoveProfile {
  return MOVE_PROFILES[key] ?? { walk: 0.16, run: 0.24 };
}
