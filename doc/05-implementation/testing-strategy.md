# Testing Strategy

> The game is a deterministic machine fed by content tables. Testing follows from that:

1. **Every formula is a golden test** — put numbers in, assert exact numbers out.
2. **Every content table is validated** — no dangling refs, no cycles, no budget outliers.
3. **Every session can be recorded and replayed** — live determinism check across PRs.
4. **Every bottleneck is measured** — perf scene budget asserts.

## Test types

### Unit tests (`tests/unit/`)
Standard vitest tests for systems, math, pure functions. Coverage target: > 90% on
`src/sim/fixedmath.ts`, `src/sim/rng.ts`, `src/sim/systems/*` (formula-heavy paths).

**Golden formula tests** — the load-bearing fidelity gate:

```ts
// tests/unit/golden/chance-to-hit.test.ts
test.each([
  // CTH in basis points: 200_00 * AR/(AR+Def) * alvl/(alvl+dlvl), clamped to [500, 9500]
  { ar: 1000, def: 500, alvl: 50, dlvl: 50, expected: 6667 }, // 20000 * 1000/1500 * 50/100
  { ar: 50, def: 2000, alvl: 10, dlvl: 85, expected: 500 }, // raw 51 → clamped at 5%
  { ar: 5000, def: 100, alvl: 99, dlvl: 1, expected: 9500 }, // raw 19412 → clamped at 95%
])("CTH($ar, $def, $alvl, $dlvl) = $expected", ({ ar, def, alvl, dlvl, expected }) => {
  expect(calcChanceToHit(ar, def, alvl, dlvl)).toBeCloseToInt(expected);
});
```

Each formula gets its own golden case file. Sources: research docs, cross-checked with
at least two independent references. A formula change requires updating both the
`02-game-design/` doc AND the golden test — and the PR description justifies why the new
formula is more faithful to the source.

### Data validation tests (`tests/data/`)
Run at CI on every content-table change. Checks:
- `itemBases`: qlvl monotonic in normal→exceptional→elite chains, slot validity, class
  restrictions reference existing class ids, no base referenced by zero affixes (orphans).
- `affixes`: alvl ≥ 0, group exclusion no conflicts (no two prefixes in same group can
  appear on same base type), all referenced ItemTypeId exist in `itemBases`.
- `treasureClasses`: graph is acyclic (no TC→TC→self cycles), every leaf is `"gold"` or
  an `ItemClassId`, every TC referenced by at least one parent or a monster.
- `skills`: prereq graph acyclic and tier-monotonic (no lv30 skill requiring lv30 skill
  as only prereq), synergies reference existing skills, mechanic key implemented.
- `monsters`: family→TC reference valid, base stats per difficulty non-negative,
  drain flags boolean, ai archetype key implemented.
- `zones`: every zone reachable from its act's town, connectivity graph acyclic/unidirectional
  (no cross-act back-edges), alvl non-decreasing across act zone chain.
- `quests`: reward key implemented, quest id unique per act-slot, next-quest id chain
  valid.
- `difficulty`: resistance penalty ≤ 0, XP penalties ≤ 1.0.
- `charStart`: per-class stat total matches invariant, coefficient fields positive.
- `speeds`: animation frames > 0, breakpoint formula inputs produce non-negative outputs.

### Golden replay tests (`tests/replays/`)
**The most important test type.** A recorded session = (seed, intentLog, expected end-state
hash, checkpoint hashes every 100 ticks). CI runs every replay and asserts hashes match.

- Recorded via `headless/replay.ts --record` — produces a JSON fixture.
- Replay via `npm test` — asserts hash chain.
- Multiple fixtures per Phase:
  - Phase 0: `walk-around.json` — 10,000 ticks of click-to-move.
  - Phase 1: `slice-brawl.json` — combat through vertical slice.
  - Phase 2: `loot-scenario.json` — precise affix/drop rolls verified by seed.
  - Phase 3: `class-skills.json` — one per class × 2 builds.
  - Phase 4: `act-complete.json` — full act 1 clear.
  - Phase 5: `hell-endgame.json` — endgame brawl scenario.
  - Phase 6: `multiplayer.json` — two players (simulated) co-op run.

**CI rule:** replay hash change in a non-mechanics PR = test failure. Intentional mechanics
change must re-record in same PR with justification.

### Statistical tests (`tests/stats/`)
Headless mass-runs to verify loot/quality distributions. Not pass/fail by single run;
fails if N runs at confidence 0.99 deviate from expected distribution:

```ts
// Example structure — actual implementation uses chi-squared or binomial CI
test("100,000 Fallen kills produce unique drops at expected rate", () => {
  const counts = simulate(seed=42, kills=100_000, tc="fallen");
  // Expected: ~0.033% unique from fallen (example) — needs to be within 2σ
  expect(counts.unique).toBeWithin(25, 50); // example
});
```

Tests marked with `[slow]` — run nightly, not on every commit.

### E2E bot scripts (`tests/e2e/`)
Automated browser gameplay via headless Chrome + the `__game` controller interface
(matching WoC's bot pattern). Scripted sequences simulating a player: move, kill, loot,
level, equip. Run against the built app.

- Phase 1: `fill-slice.ts` — full vertical slice clear with recorded metrics (time,
  deaths, drops found).
- Phase 2: `loot-farm.ts` — target-farm a specific boss for N runs.
- Phase 3: `class-e2e.ts` — one per class, level to 30.
- Phase 4: `act-e2e.ts` — per-act full clear.
- Phase 5: `hell-clear.ts` — endgame clear.
- Phase 6: `co-op-e2e.ts` — two headless clients in loopback.

### Perf tests (`tests/perf/`)
Headless Chrome perf scene (`headless/perf-scene.ts`): worst-case entity/particle load.
Measures frame-time percentiles, draw calls, heap. Asserts `performance-budget.md` ceilings.
Run in CI on the same machine class.

### IP audit
Lightweight CI check — grep for terms from a blocked-names list loaded from
`scripts/blocked-content-names.txt` (maintained per
`doc/04-content-bible/naming-and-lore.md` — contains Blizzard trademarks and well-known
proper names that should never appear in-game, including variant spellings).
Fails if any match in `src/sim/data/`, `src/game/`, `src/ui/` (mechanics terms like
"sorceress", "paladin" as archetype descriptors in comments/docs are allowed; actual
content rows bearing those names are not). False positives get added to an allowlist
in the same script.

## What happens when a test fails

| Test type | Failure = |
|---|---|
| Golden formula | Mechanics drift — fix or intentionally update. PR blocked. |
| Data validation | Content table bug — fix row. PR blocked. |
| Golden replay (unexpected) | Sprite behavior change crept in — bisect to the tick. |
| Golden replay (intentional) | Update doc first, re-record in PR. PR allowed. |
| Statistical | Nightly report — investigate, adjust drop rates or TC weights as needed. |
| E2E | Game logic regression — fix or update script. |
| Perf budget | Performance regression — optimize or document reason. PR blocked. |
| IP audit | Blocked name found — fix or add to allowlist. PR blocked. |

## Versioning golden fixtures

Store in `tests/replays/`, `tests/saves/` (historical save migration fixtures). Each
fixture filename includes the semver of the game version that produced it.
