# The World Seam — `IWorld`

> `src/world_api.ts` is the only file both sides of the architecture may import.
> Renderer, UI, and game controller see the world exclusively through `IWorld`.
> `Sim` (offline) and `ClientWorld` (Phase 6, server mirror) both implement it.

## Contract shape

```ts
// src/world_api.ts — the entire seam (representative excerpt)

export interface IWorld {
  // ── time ─────────────────────────────────────────────
  readonly tick: number;                 // sim frame counter (25 Hz)

  // ── advancing (host-called) ──────────────────────────
  submit(playerId: PlayerId, intent: Intent): void;
  advance(): void;                       // run exactly one 40 ms tick, consuming queued
                                         // intents. Host calls it N times per rAF per its
                                         // accumulator. ClientWorld implements it by
                                         // applying the next server snapshot delta instead.

  // ── queries (renderer/UI read path) ──────────────────
  snapshot(): WorldSnapshot;             // current interest-scoped view
  prevSnapshot(): WorldSnapshot;         // previous tick (for interpolation)
  player(id: PlayerId): PlayerView;      // full own-character view (stats, inventory, skills)
  terrainHeight(x: number, z: number): number;
  zone(): ZoneView;                      // current zone metadata + revealed automap cells

  // ── events since last drain (render/audio/UI feedback) ──
  drainEvents(): SimEvent[];
}
```

Key sub-types (all plain JSON-serializable data — they double as the Phase 6 wire format).
`Intent` is canonical here; `determinism.md` shows the same union as an excerpt:

```ts
export type Intent =
  | { t: "move"; x: number; z: number }
  | { t: "skill"; slot: "L" | "R"; targetId?: EntityId; x?: number; z?: number }
  | { t: "pickup"; itemId: EntityId }
  | { t: "belt"; index: 0 | 1 | 2 | 3 }
  | { t: "invMove"; from: ItemLoc; to: ItemLoc }
  | { t: "npc"; npcId: EntityId; action: NpcAction }
  | { t: "waypoint"; zoneId: ZoneId }
  // …

export interface WorldSnapshot {
  tick: number;
  entities: EntityView[];        // interest-scoped: ~40m radius around player
}

export interface EntityView {
  id: EntityId;
  kind: "player" | "monster" | "npc" | "missile" | "groundItem" | "portal" | "shrine" | "corpse";
  archetype: string;             // key into content data (monster family, item base…)
  x: number; z: number; facing: number;
  anim: AnimState;               // logical animation state + frame (sim-owned)
  hpPct?: number;                // display-only precision
  modifiers?: MonsterModId[];    // champion/unique visual affixes
  labels?: GroundItemLabel;      // rarity tier, display name for ground items
}

export type SimEvent =
  | { t: "damage"; target: EntityId; amount: number; kind: DamageKind; crit: boolean }
  | { t: "death"; entity: EntityId }
  | { t: "drop"; item: EntityId; rarity: Rarity }
  | { t: "levelUp"; player: PlayerId }
  | { t: "questState"; quest: QuestId; state: QuestState }
  | { t: "zoneEnter"; zone: ZoneId }
  // …
```

## Rules

1. **Read-only views.** Everything returned across the seam is a deep-readonly DTO. The
   renderer can never mutate sim state; the only write path is `submit(intent)`.
2. **Interest scoping.** `snapshot()` returns only entities near the player (the eventual
   network AoI). The renderer must not assume global knowledge — this keeps offline and
   online behavior identical.
3. **Sim owns animation state.** Attack/cast/hit-recovery animations are *mechanics*
   (frame counts, breakpoints), so `anim` is computed in the sim; the renderer just plays it.
   Purely cosmetic motion (idle sway, particles) belongs to the renderer.
4. **Events are drained, not polled.** `drainEvents()` empties the queue; the game layer
   fans events out to renderer (hit flashes), audio (drop sounds by rarity), and UI (quest
   toasts). Events are fire-and-forget; no consumer may feed them back into the sim.
5. **Two snapshots, not timestamps.** Interpolation uses `prevSnapshot()`/`snapshot()` plus
   the host's accumulator alpha. The seam exposes no wall-clock time.
6. **`PlayerView` is the UI's whole world.** Inventory grid, equipped items, stats page
   numbers (already fully computed by the sim — the UI never re-derives a formula), skill
   tree state, belt, gold, quest log, mercenary. If the UI needs a number, the sim computes
   it and puts it on a view. **Formulas exist in exactly one place: the sim.**

## Implementations

| | `Sim` (src/sim) | `ClientWorld` (src/net, Phase 6) |
|---|---|---|
| `tick` | advanced by host loop calling `advance()` | `advance()` applies next server snapshot delta |
| `submit` | validates + queues intent for next `advance()` | sends intent to server (also queued for prediction later) |
| `snapshot` | computed from live state | last received server state, same DTO types |
| `drainEvents` | generated during `advance()` | decoded from server event stream |

The game controller is constructed with an `IWorld` and must work with either — this is
tested by running the same scripted session against `Sim` directly and against
`Sim`-behind-a-loopback-`ClientWorld` in Phase 6.

## Anti-patterns (rejected in review)

- Importing anything from `src/sim/**` in render/ui/game code (lint-blocked; only
  `world_api.ts` is allowed).
- Adding a "just this once" mutable field to a view DTO.
- Computing gameplay math (hit chance, DPS, resist caps) in UI code for display — ask the
  sim for the computed number instead.
- Widening `snapshot()` to "all entities in zone" because a feature found AoI inconvenient.
