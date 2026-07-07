 ~\.claude\plans\based-on-the-design-mossy-piglet.md

 # D2R-Exact Web ARPG — Design Consolidation + Roadmap + Phase 0 Engine Core

## Context

The repo is a fully-authored design corpus (55 markdown docs, ~15k lines) for a browser ARPG that is **mechanically exact to D2R** (integer formulas, 25 Hz frame system, FCR/FHR breakpoints, TC drop engine) with **fully original content** (per CLAUDE.md IP invariants — mechanics cloned, expression original, no Blizzard names). There is **zero code**: no `package.json`, `src/`, `tests/`, or CI. `doc/06-review/gap-analysis.md` verdict: "ready for Phase 0."

User request: solidify the exact-clone design (referencing world-of-claudecraft's `graphics-plan.md` for graphics), propose the master implementation roadmap, then **begin implementation** (user confirmed scope: docs + Phase 0 engine core).

Known doc gaps found in exploration: (a) graphics plan thin (`rendering.md` = 80 lines vs WoC's tiered/step plan); (b) PvP rules scattered and inconsistent (research says ×0.17 damage penalty; `phase-6-multiplayer.md:70` says 40%; `combat-resolution.md:151` has a distinct ×0.5 *leech* factor); (c) low-quality item tier not itemized; (d) `monster-roster.md` NM immunities contradict `difficulty-progression.md` "physical-only" wording; (e) `class-identities.md` stamina-per-vit superseded by `stats-and-formulas.md`; (f) `gap-analysis.md` stale (its 4 "missing docs" now exist).

Workflow rule (CLAUDE.md): docs are canon; code follows docs — so Stage A lands before Stage B.

---

## Stage A — Design consolidation + roadmap (7 doc items, order: A1 → A2–A4 any order → A5 → A6 → A7)

### A1. Author `doc/01-architecture/graphics-plan.md` (~400 lines)
WoC-modeled visual-quality plan adapted to isometric dark-gothic ARPG. `rendering.md` stays the pipeline/seam contract; this doc adds:
1. Visual pillars: readability at 18 m default detent; desaturated base + saturated rarity/element accents; heavy fog. Exclusions vs WoC: no day/night, no DOF, orbit only ±45°.
2. Quality tiers `src/render/gfx.ts` (low/high/ultra): pixel-ratio caps 1.0/1.5/min(2,device); shadows blob-only/1024²/2048²; Lambert/Standard materials; particle & scatter budgets; point-light pool 0/4/8; `?lowgfx=1` + auto-downgrade fps probe. Names align with `settings-and-menus.md` options. No gfx setting touches sim.
3. Lighting/IBL: PMREMGenerator from procedural sky; outdoor env ≈0.4/hemi 0.45/sun 2.2 (WoC 2.8 dialed down for gothic); dungeon env 0.15/sun 0.3. Sun azimuth fixed relative to camera home yaw.
4. Post stack: EffectComposer RenderPass → [GTAO ultra-only] → UnrealBloom (0.85 threshold) → OutputPass → custom GradeShader (lift/gamma/gain, vignette, grain, Phase-7 colorblind-LUT hook). **MSAA 4× on HalfFloat HDR target, not FXAA** (low-poly edge crispness at far zoom).
5. Procedural texture kit: canvas painters at boot (≤1.5 s), height-to-normal converter, 256² atlases, 4-layer terrain splat via `onBeforeCompile`, `themeAt(x,z)` hook driven by ZoneView theme (never per-frame sim queries).
6. Terrain (32 m chunks, 2 LOD rings + edge skirts, baked vertex AO), props (InstancedMesh >3×, static `mergeGeometries` per chunk, wind sway + per-instance HSL jitter), entities (pose-curve rigs, material factory ≤40 shader programs, champion tint via instance attributes), HDR VFX (cores ×2.5).
7. **Budget reconciliation table (normative): `performance-budget.md` always wins** (CI-gated canon). 350 draws = ceiling (WoC <300 recorded as target); 1.5 M tris ceiling (1.2 M target). New GPU sub-budgets added: bloom ≤1.2 ms, GTAO ≤3 ms, grade ≤0.3 ms, shadows ≤1.5 ms.
8. Step roadmap G0–G11, each independently landable + screenshot-verifiable, with phase slots: G0 renderer v0 (P0.5/0.6, Lambert/vertex-color/no composer) · G1 gfx.ts tiers + `?perf=1` (P0.7) · G2 texture kit + splat (P1) · G3 post stack (P1) · G4 IBL (P1) · G5 entity rigs + material factory (P1) · G6 rarity ground-item beams (P2) · G7 prop merge + wind (P3–P4) · G8 water + act themes + weather (P4) · G9 occlusion/roof system (P4) · G10 GTAO + endgame perf (P5) · G11 juice/accessibility/final hardening (P7).

Companion edits: pointer header in `rendering.md`; one line in `phases.md`; reading-order entry in `overview.md`.

### A2. Author `doc/02-game-design/pvp.md` (~150 lines) + fix penalty inconsistency
Canon: research-faithful **×0.17 (1/6) PvP damage penalty applied first**, then resists/block; leech vs players ×0.5 (separate factor). Sections: status banner (documented, unscheduled; Phase 6 duels first consumer), hostility/duel model, damage pipeline order, FHR/knockback notes, scope table.
Edits: `phase-6-multiplayer.md:70-71` 40% → 17% with pointer; `combat-resolution.md:151` annotate `PvPPenalty` as leech-only factor with pointer.

### A3. Low-quality item tier → `doc/02-game-design/items-and-affixes.md`
Extend quality ladder (lines 40-47) to `6. Normal? (fail → 7) / 7. Low quality`. New "Low-quality items (exact)" section mirroring existing "Superior items (exact)": exact integer stat penalty (canonicalized from `research/r2-items-loot.md:99-113`), original prefix names (Worn/Cracked/Frail style), cross-links to cube upgrade recipe (ilvl := 1, `crafting-cube.md:52`), runeword-eligibility uncertainty carried as listed uncertainty.

### A4. Two consistency fixes
- (d) `difficulty-progression.md:17,:36` — reword NM immunity to "very rare — physical or a single element at exactly 100%"; clean `monster-roster.md:225-229` sync note.
- (e) `class-identities.md` — delete superseded stamina-per-vit block (lines 10-13) and 7 per-class bullets; leave one pointer sentence to `stats-and-formulas.md`.

### A5. Author `doc/05-implementation/roadmap.md` (~250 lines) — master roadmap
1. One-screen milestone table M0–M7 (M0 Engine core → M1 Fun gate → M2 Item system → M3 All 7 classes → M4 Normal clear → M5 Hell/endgame → M6 Co-op → M7 Ship): delivers / playable state / gate one-liner / enforcing CI jobs / doc link.
2. **Three workstream lanes per phase**: Engine/systems (from phase docs) · Content authoring backlog with sizes (P1: ~30 affixes + 4 monster families + Act-I slice; P2: ~300 affixes, 150 uniques, 15 sets, ~50 words, gem tables; P3: 5 classes × ~25 skills numeric; P4: Acts II–V tables + 27 quests + superuniques) · Graphics steps G0–G11.
3. Mermaid dependency graph (P0→P1→{P2∥P3}→P4→P5→{P6∥P7} + lanes).
4. Acceptance-gate index (golden replays, perf scene, data validation, IP audit per milestone).
5. Dated "status cursor" section (starts: "Stage A complete, Phase 0 in progress").

### A6. Update `doc/README.md` index — add graphics-plan.md, pvp.md, roadmap.md (roadmap first in 05 as entry point); update Quick-start + reading-order rows.

### A7. Refresh `doc/06-review/gap-analysis.md` — re-date, recount scorecard (13/14/5/11 docs), drop resolved P1 rows + P3 PvP row, point content backlog at roadmap.md lane, note resolved items, "next review due: Phase 1 exit."

**Stage A verification:** IP audit clean over doc/ (word-boundary scan with `scripts/blocked-content-names.txt`, excluding `doc/research/`); greps: one consistent PvP value, no "physical-only", "stamina per vit" only in stats-and-formulas.md; README links resolve; one commit per item.

---

## Stage B — Phase 0 engine core (tasks 0.1–0.7 of `doc/05-implementation/phase-0-engine-core.md`)

Build order B1→B7; each task + its tests in same commit. Scope discipline: no combat, no real HUD, no texture splat/post stack (G2+/Phase 1), one generator family, one dev class row.

### B1 (0.1) Scaffold + gates
- `package.json`: deps `three`; dev `typescript vite vitest @biomejs/biome @types/three playwright`. Scripts: `dev build preview test lint perf replay check`.
- `tsconfig.json` (strict, `noUncheckedIndexedAccess`, ES2022, bundler resolution, **no path aliases**), `vite.config.ts` (with vitest `test` block, node env), `biome.json` with **`src/sim/**` override**: ban `Date`, `performance`, timers, `window`, `document`, `crypto` globals + `three` imports.
- `scripts/check-sim-purity.mjs` (Node, Windows-portable — no ripgrep): scan `src/sim/**` + `world_api.ts` for `Math.random`, transcendental `Math.*`, `Date.`, `performance.`, three imports; **boundary rule**: `src/render|ui|game` may import `world_api` but never `src/sim/`. Exit 1 with file:line.
- `scripts/ip-audit.mjs` (word-boundary scan, blocklist + optional allowlist), `scripts/check-size.mjs` (gzip dist ≤1.2 MB).
- `index.html`, `src/main.ts` stub, `.gitignore`, **`.gitattributes` (`* text=auto eol=lf`) — must land before any golden fixture** (CRLF churn breaks hashes).
- `.github/workflows/ci.yml` (see B7). Update CLAUDE.md Commands section.
- Accept: fresh clone → `npm i && npm test && npm run dev` green <2 min.

### B2 (0.2) Sim kernel — order: `world_api.ts` type skeleton → rng → fixedmath → hash → entity pool → sim
- `src/sim/rng.ts`: splitmix32; named streams (`map/loot/combat/ai/monsterSpawn/fx`) seeded `mix(worldSeed ^ fnv1a(name))`; `u32/roll/pick` + `child(path)` sub-streams; document modulo-bias decision.
- `src/sim/fixedmath.ts`: 4096-entry sin table **committed as literal constants** (engine-independent), sin/cos/atan2 lookups; `Math.sqrt` allowed (IEEE-exact).
- `src/sim/hash.ts`: FNV-1a 32-bit over canonical byte stream — entities in id order, fixed field order, float **bits** via DataView, −0 normalized to +0.
- `src/sim/entity.ts` (1024-slot pool, free list, monotonic ids, id-order iteration), `src/sim/intents.ts`, `src/sim/sim.ts` (`Sim implements IWorld`, stage order `[intents, pathing, locomotion, events]`, tick counter, state-hash method).
- Tests: rng (identical sequence + 10k-tick hash; **stream isolation**: 1000 draws from `loot` don't shift `ai`), fixedmath (epsilon + table-hash constant), hash (float bits, −0), entity pool (recycling doesn't perturb iteration).

### B3 (0.3) World seam v1 — complete `src/world_api.ts` per `world-seam.md` contract: full `Intent` union (`move/skill/pickup/belt/invMove/npc/waypoint`), `IWorld` (`tick submit advance snapshot prevSnapshot player terrainHeight zone drainEvents`), `EntityView` with sim-owned `AnimState`, `ZoneView` (props + packed automap bitfield), `SimEvent` union. Snapshot double-buffering (two pooled DTO arrays swapped) + 40 m AoI filter. Renderer samples `terrainHeight` at chunk-build time (no heightfield DTO).
- Tests: JSON round-trip deep-equal on every seam type; boundary-checker flags fixture `tests/fixtures/lint/bad-import.txt`.

### B4 (0.4) Host loop — `src/game/loop.ts` (accumulator TICK_MS=40, 250 ms clamp, alpha out, injectable `now()`, blur-freeze no catch-up), `src/game/session.ts` (`Sim` from `?seed=`, event fan-out), wire `src/main.ts`.
- Test: 1000 jittered fake-rAF frames ⇒ exactly `⌊elapsed/40⌋` ticks; clamp; blur-freeze.

### B5 (0.5) Zone gen v0 + terrain render (graphics step G0 only)
- Sim (`rng.child("worldgen/dev-zone/<pass>")`): `src/sim/worldgen/heightfield.ts` (value noise via fixedmath), `outdoor.ts` (world-generation.md outdoor-scatter: border, cliffs Δh>0.5 m, spine carve, dart-throw scatter, flood-fill repair ≥90% reachable), `walkability.ts` (Uint8Array 0.5 m cells, WALK/LOS/FLY/SPAWN bits, FNV hash), `src/sim/zone.ts` (bilinear `terrainHeight`, ZoneView assembly), `src/sim/data/zones.ts` (one dev-zone row — content-as-data live from day 0) + `tests/data/zones.test.ts`.
- Render: `src/render/renderer.ts` (layer Groups per rendering.md), `terrain.ts` (32 m chunks, vertex AO v0, frustum culling), `props.ts` (parametric tree/rock/ruin → InstancedMesh per archetype), `sky.ts` (gradient dome + fog), `materials.ts` (factory stub). Lambert only, no composer.
- Tests: committed walkability-hash constant; connectivity; generate-twice bit-identity. Manual: seed reroll, 60 fps.

### B6 (0.6) Character + click-to-move + camera
- Sim: `src/sim/los.ts` (DDA), `src/sim/systems/pathing.ts` (A* 0.5 m grid, octile, string-pulling, ≤8000-node budget, **deterministic tie-break (f, then cell index)**), `locomotion.ts` (0.5 m sub-steps, slide projection), player spawn with sim-owned AnimState, minimal `charStart.ts` + `speeds.ts` rows.
- Render/game/ui: `src/render/camera.ts` (14-detent zoom rail 4 m/18°/50° → 28 m/58°/36°, orbit ±45°, critically-damped follow, `pickGround` raycast, prop dither-fade v0), `entities.ts` (capsule humanoid, pose curves from view `anim`, prev/curr interpolation), `lod.ts` stub, `src/game/input.ts` (pointer → pickGround → `submit(move)`; DOM layering blocks click-through), `src/ui/devhud.ts` (seed readout, reroll, perf mount).
- **Replay core lands here** (0.6 accept needs it): `headless/replay.ts` — `run(seed, intentLog) → {checkpoints per 100 ticks, finalHash}`; `--record` runs scripted bot session (~1500 ticks walking) and writes fixture.
- Tests: pathing goldens on hand-authored grid, camera-rail reproduces camera.md table rows exactly, golden replay green.

### B7 (0.7) Harnesses + CI
- `tests/replays/walk-around.v0.1.0.json` fixture #1; `tests/unit/replay.test.ts` — all fixtures, full checkpoint chain + final hash; **determinism gate**: same fixture twice via two independent `Sim` instances, compare every checkpoint.
- `headless/perf-scene.ts` (500 static props + 50 walking dummies; headless host exempt from boundary rule) + `src/render/perf-overlay.ts` (`?perf=1`: fps, p50/p95/p99, draws/tris, heap, tick-ms, exported on `window.__perf`).
- `scripts/run-perf.mjs`: Playwright Chromium vs `vite preview`; CI-gate stable subset only (draws ≤350, heap ≤350 MB, sim tick ≤4 ms avg/8 ms max); fps report-only in CI (SwiftShader variance), gated locally.
- `ci.yml` jobs: `lint` (biome + purity/boundary), `test` (**matrix ubuntu + windows — cross-OS is itself a determinism gate**), `build-size`, `ip-audit`, `perf` (ubuntu). Node 22.
- Accept 0.7 deliberate-breakage check: scratch branch adds `Math.random()` in locomotion → both `lint` and `test` (replay hash) must go red; record outcome.

---

## Verification (end-to-end)

- **Stage A:** IP audit clean; consistency greps (A2–A4) return expected; README links resolve; roadmap lanes match phase docs + gap-analysis totals.
- **Stage B:** clean clone `npm i && npm test && npm run dev` <2 min; walk generated zone at 60 fps with `?perf=1` showing budgets; seed reroll changes layout; zoom detents + ±45° orbit match camera.md; dev-HUD clicks never move character; CI green both OSes; deliberate-breakage branch red on two independent gates; golden replay #1 green; CLAUDE.md commands match reality.

## Key risks

- **Windows:** npm scripts run under cmd.exe — all logic in Node `scripts/*.mjs`, no POSIX syntax; `.gitattributes` LF normalization **before** first fixture; no ripgrep dependency in scripts/CI.
- **Determinism traps:** transcendentals only via committed literal tables; id-order iteration only (never Map/object-key order); A* tie-break explicit; hash float bits with −0 normalization; deep-readonly seam types.
- **Three.js/Vite:** `three` core only in Phase 0 (no addons until composer at G3/Phase 1); watch 1.2 MB gzip gate from first build.
- **Scope creep = Phase 0 killer:** G0 boundary in graphics-plan.md makes "renderer v0 done" checkable; phase-0 exit criteria include scope discipline.

## Critical files

- `doc/05-implementation/phase-0-engine-core.md` — Stage B contract (tasks 0.1–0.7 + accepts)
- `doc/01-architecture/world-seam.md` — canonical IWorld/Intent/DTO shapes
- `doc/01-architecture/determinism.md` — RNG streams, fixedmath, hash/replay rules
- `doc/01-architecture/performance-budget.md` — CI-gated ceilings graphics-plan.md reconciles against
- `doc/01-architecture/rendering.md`, `camera.md`, `world-generation.md` — G0 renderer + zone-gen v0 specs
- `scripts/blocked-content-names.txt` — IP audit source list
