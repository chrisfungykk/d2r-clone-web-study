# Determinism

> The sim is a pure function: `state(n+1) = tick(state(n), intents(n))`.
> Same seed + same intent log ⇒ bit-identical state on every machine, every run.

## Why determinism is the foundation

1. **Testing** — golden replay tests catch any behavioral regression in any system.
2. **Loot integrity** — drop rates are verified statistically in headless runs.
3. **Multiplayer (Phase 6)** — the server runs the same sim; desync detection is trivial.
4. **Debugging** — every bug report is a (seed, intent log) pair that reproduces exactly.

## The 25 Hz tick

The sim advances in fixed ticks of **40 ms (25 Hz)**. This is deliberate and load-bearing:
D2's mechanics layer is defined in 25 fps frames — attack speed, cast rate, hit recovery,
block speed, poison damage-per-frame, open-wounds bleed, and every breakpoint table are frame
counts at 25 fps. With a 25 Hz tick, **one sim tick = one mechanics frame** and every
researched breakpoint table (see `doc/research/r1-character-math.md`) is used natively —
no rescaling, no rounding drift.

Rules:

- Tick duration is a constant `TICK_MS = 40`. Never derived from wall clock.
- The host (browser loop, server loop, test runner) owns real time and calls
  `world.advance()` the right number of times. The sim never reads time.
- All durations in sim state are stored in **ticks (frames)**, never milliseconds.
- Rendering interpolates between tick states at display rate; interpolation lives entirely
  in `src/render` and never feeds back into the sim.

## RNG discipline

Single seeded PRNG implementation (**splitmix32** — the 32-bit splitmix construction; small,
fast, statistically adequate for a game, and uint32-native so it needs no BigInt), wrapped in
**named streams** so systems can't perturb each other's sequences:

```ts
// src/sim/rng.ts
export type StreamName = "map" | "loot" | "combat" | "ai" | "monsterSpawn" | "fx";
// Streams may spawn deterministic child streams keyed by content id — e.g. world
// generation derives "worldgen/<zoneId>/<pass>" sub-seeds from "map" so zone layouts
// are independent of generation order (see world-generation.md).

export class Rng {
  constructor(worldSeed: number) { /* derive one sub-seed per stream */ }
  u32(stream: StreamName): number;          // uniform uint32
  roll(stream: StreamName, n: number): number; // integer in [0, n)
  pick<T>(stream: StreamName, xs: readonly T[]): T;
}
```

- Adding a new consumer to one stream must not shift another stream's sequence — this keeps
  old replays valid across unrelated feature work.
- `"fx"` exists so purely-cosmetic randomness (used by the renderer via snapshot fields)
  never touches gameplay streams.
- **Banned inside `src/sim`:** `Math.random`, `Date`, `performance`, `crypto.getRandomValues`,
  `setTimeout/setInterval`, any DOM/Three import. Enforced by a Biome/ESLint rule and a CI
  grep gate (see `testing-strategy.md`).

## Numeric determinism

- **Integer math for mechanics.** Damage, AR, defense, resistances, affix rolls, treasure
  class picks are integer arithmetic — matching the source mechanics, which are integer-based.
  Where research gives fractional formulas, we fix an explicit integer form (documented in
  `02-game-design/stats-and-formulas.md`) and treat it as canon.
- **Floats only for space.** Positions/velocities are floats. IEEE-754 double ops
  (`+ - * /`, comparisons) are deterministic across JS engines; we additionally:
  - ban `Math.sin/cos/atan2/pow/exp/log` in sim hot paths in favor of table/polynomial
    versions in `src/sim/fixedmath.ts` (transcendentals are the only cross-engine risk);
  - never iterate `Map`/`Set`/object keys in an order-sensitive way unless insertion order
    is itself deterministic (it is in JS — but sorting by entity id before iteration is the
    house style for anything that applies effects).
- Entity ids are sequential integers issued by the sim, never random.

## Intents

The only way anything outside the sim influences it:

```ts
// world_api.ts (excerpt — full contract in world-seam.md)
export type Intent =
  | { t: "move"; x: number; z: number }
  | { t: "skill"; slot: "L" | "R"; targetId?: EntityId; x?: number; z?: number }
  | { t: "pickup"; itemId: EntityId }
  | { t: "belt"; index: 0 | 1 | 2 | 3 }
  | { t: "invMove"; from: ItemLoc; to: ItemLoc }
  | { t: "npc"; npcId: EntityId; action: NpcAction }
  | { t: "waypoint"; zoneId: ZoneId }
  // …
```

- Intents are plain JSON-serializable data — they ARE the replay log and, in Phase 6,
  the wire protocol.
- Per tick, each player contributes at most one movement intent and a bounded queue of
  discrete intents; the sim validates everything (range, cost, ownership) — intents are
  requests, not commands.

## Replay & golden tests

- `headless/replay.ts` runs `(seed, intentLog)` → final state hash (fast structural hash of
  sim state, e.g. FNV-1a over a canonical serialization).
- **Golden replays** in `tests/replays/*.json` — recorded sessions with expected end-state
  hash + per-100-tick checkpoint hashes (checkpoints localize a divergence to a 4-second
  window when a test breaks).
- CI rule: a PR that intentionally changes mechanics must re-record goldens in the same PR
  and say why; an unintentional hash change is a build failure.
- **Statistical gates:** headless mass-runs assert loot distributions (e.g., 100k kills of a
  given treasure class produce quality-tier frequencies within tolerance) — see
  `testing-strategy.md`.

## Save/seed model

- A **game session** (in D2 terms, "a game") is `(worldSeed, character saves, difficulty, playerCount)`.
  Zone layouts, monster spawns, shrines reroll each session from `worldSeed` — matching D2's
  "maps reroll each game" model.
- The character save is durable state extracted from the sim (see `save-persistence.md`);
  it contains no RNG state. RNG state is never persisted — a new session derives fresh
  streams from the new seed.

## What is NOT deterministic

Renderer particle jitter, UI animations, audio scheduling — anything outside `src/sim`.
These may use `Math.random` freely. The lint boundary is the `src/sim` directory.
