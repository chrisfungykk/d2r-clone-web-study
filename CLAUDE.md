# CLAUDE.md — Project Invariants

Browser ARPG: **mechanically exact** to Diablo II: Resurrected's *systems*, with **fully
original content** (names, story, maps, art, audio). Architecture modeled on
world-of-claudecraft. Full documentation lives in `doc/` — start at `doc/README.md`.

## Invariants (never break, regardless of task)

1. **IP policy.** Mechanics, formulas, and UI-layout conventions are cloned; expression is
   original. Never introduce Blizzard names (items, uniques, sets, runewords, NPCs, zones,
   bosses, skills), quest/lore text, map reproductions, or ripped assets. Generic archetype
   words (barbarian, zombie, waypoint, gamble) and mechanics jargon (FCR, ilvl, treasure
   class) are fine. When authoring content, follow `doc/04-content-bible/`.
2. **Determinism.** Everything in `src/sim` is deterministic: fixed 25 Hz tick, named-stream
   seeded RNG only. Banned in `src/sim`: `Math.random`, `Date`, `performance`, timers, DOM,
   Three.js imports. Same seed + same intent log ⇒ bit-identical state. See
   `doc/01-architecture/determinism.md`.
3. **25 Hz = mechanics frames.** One tick is one D2-style frame. All speeds/durations are
   stored in frames. Never convert mechanics to milliseconds inside the sim.
4. **The seam.** `src/world_api.ts` is the only import allowed from render/ui/game into the
   world. Renderer and UI never import `src/sim/**`, never mutate views, never compute
   gameplay formulas (ask the sim for computed numbers). See `doc/01-architecture/world-seam.md`.
5. **Content is data.** Game content lives in typed tables in `src/sim/data/`; systems
   interpret tables and never special-case content ids. See `doc/01-architecture/data-model.md`.
6. **Assets are procedural.** No binary model/texture/audio files in the repo.
7. **View DTOs stay JSON-serializable** (future wire format). No classes/functions/Maps in
   `world_api.ts` types.
8. **Saves are versioned.** Any `CharacterDoc` shape or content-id meaning change bumps `v`
   and ships a migration + golden fixture. See `doc/01-architecture/save-persistence.md`.

## Workflow rules

- Mechanics changes: update the matching `doc/02-game-design/*.md` first (docs are canon;
  code follows docs), re-record golden replays in the same PR with justification.
- New content rows: validate via `tests/data/`; balance outliers need a note in the PR.
- Performance: budgets in `doc/01-architecture/performance-budget.md` are CI-gated; don't
  merge red.
- Phases: implementation order and acceptance criteria live in `doc/05-implementation/`.
  Don't pull later-phase features forward without updating the phase docs.

## Commands

(Established in Phase 0 — keep this section updated.)

```
npm run dev        # Vite dev server
npm run build      # Production build (Vite)
npm run preview    # Serve the production build (used by the perf harness)
npm test           # Vitest: unit + data validation + golden replays
npm run check      # tsc --noEmit (strict type-check)
npm run lint       # Biome + sim-purity + import-boundary gates
npm run ip-audit   # No Blizzard proper nouns in src/ or doc/ (excl. doc/research)
npm run size       # Bundle-size gate (≤ 1.2 MB gzip; run after build)
npm run perf       # Headless worst-case perf scene (Playwright vs preview)
npm run replay     # Golden-replay record/replay CLI (node headless/replay.ts)
```

Toolchain (Phase 0): Node ≥ 22 (dev on 25; CI on 24), TypeScript strict with
`noUncheckedIndexedAccess`, Vite + Vitest, Biome. Relative imports use explicit `.ts`
extensions (`allowImportingTsExtensions`) so the same source runs under tsc, Vite, Vitest,
and `node` native type-stripping.
