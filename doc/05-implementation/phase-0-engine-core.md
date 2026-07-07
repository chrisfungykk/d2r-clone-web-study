# Phase 0 — Engine Core

> Goal: the skeleton every later phase hangs off. No game content beyond a test zone.
> Exit state: walk a character around a procedurally generated zone at 60 fps, with the
> determinism/perf/test harnesses all live.

Implements: `01-architecture/*` (all docs). Content: none (dev-zone only).

## Tasks

### 0.1 Repo scaffold
Vite + TypeScript strict + Vitest + Biome; directory layout per `overview.md`; CI pipeline
(lint, test, build, size check); `npm run` commands wired and recorded in `CLAUDE.md`.
**Accept:** fresh clone → `npm i && npm test && npm run dev` green in < 2 min.

### 0.2 Sim kernel
`src/sim/sim.ts`: fixed-tick `advance()` (the `IWorld` advance method), tick counter, entity
store (sequential ids, pooled),
intent queue with validation stubs; `src/sim/rng.ts` named streams per `determinism.md`;
`src/sim/fixedmath.ts` (table sin/cos/atan2).
**Accept:** unit tests — same seed ⇒ identical 10k-tick state hash; stream isolation test
(consuming `loot` doesn't shift `ai`); no banned APIs (lint rule + grep gate live).

### 0.3 World seam
`src/world_api.ts` full v1 contract per `world-seam.md` (Intent union, WorldSnapshot,
EntityView, PlayerView, SimEvent); `Sim implements IWorld`; snapshot double-buffering + AoI
filter; import-boundary lint rule (render/ui/game may import only `world_api`).
**Accept:** seam types JSON-serializable (round-trip test); boundary lint fails on a
deliberate bad import in test fixture.

### 0.4 Host loop + interpolation
`src/game/loop.ts`: rAF accumulator (40 ms ticks, 250 ms clamp), alpha interpolation;
pause/resume on tab blur (sim time freezes — no catch-up spiral).
**Accept:** headless test — 1000 rAF frames at jittered dt produce exactly `⌊elapsed/40⌋` ticks.

### 0.5 Zone generation v0 + terrain render
Seeded zone generator in sim (`map` stream): heightfield + walkability grid + prop
placements for one wilderness theme; renderer terrain chunks + instanced props + sky/fog
per `rendering.md`.
**Accept:** same seed ⇒ identical walkability grid hash; 60 fps on reference hardware;
regenerating with new seed visibly rerolls layout.

### 0.6 Character + click-to-move
Player entity; ground-plane raycast click → `move` intent; sim pathing v0 (grid A* on
walkability, string-pulling); locomotion at stat-derived speed; procedural humanoid rig
with idle/walk/run cycles; camera rig per `camera.md` (zoom rail + orbit + occlusion fade).
**Accept:** golden replay — recorded 60 s walk session replays to identical end position/
hash; camera zoom/orbit matches spec table; click-through-UI is impossible (input layering).

### 0.7 Test + perf harnesses
`headless/replay.ts` (record/replay CLI), golden replay fixture #1; `headless/perf-scene.ts`
v0 (500 static + 50 walking dummies); `?perf=1` overlay; perf CI job with budget asserts
(subset: fps proxy, draw calls, heap).
**Accept:** CI runs replays + perf scene; budgets green; breaking determinism on purpose
(temporary `Math.random`) fails CI.

## Test plan
Unit (rng, math, pathing), golden replay #1, perf scene, lint gates. All wired into `npm test`.

## Exit criteria
- All accepts above green in CI.
- A newcomer can read `CLAUDE.md` + `01-architecture/overview.md`, clone, and add a
  trivial sim system with a passing test in one session.
- No content, combat, or UI beyond the dev HUD — scope discipline is part of the exit.
