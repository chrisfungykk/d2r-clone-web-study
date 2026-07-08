# Documentation Gap Analysis — 2026-07-08

> Deep review of all 59 docs across 6 directories (55 markdown across 01–05 + research, plus
> 4 interactive HTML). Verdict: **production-grade documentation suite; every cross-cutting
> doc gap flagged in the prior pass is now closed. The one remaining gap is content-authoring
> depth, tracked as the content lane in `../05-implementation/roadmap.md` §2.**
>
> Supersedes the 2026-07-07 review — the four "missing docs" it flagged all now exist and the
> PvP inconsistency it noted is now canon. See **Resolved in Stage A** below.
> **Next review due: Phase 1 exit.**

## Scorecard

Counts verified by `ls doc/<section>` on 2026-07-08. (Note: the plan's target line "13/14/5/11"
groups 01/02/03/05; 04-content-bible actually holds **6** docs. Real per-section counts below.)

| Section | Docs | Lines | Quality | Verdict |
|---|---|---|---|---|
| 01-architecture | 13 | ~1,675 | Exceptional | Ship-ready. Exact specs, code examples, invariants. +`graphics-plan.md` (visual-quality tiers, render-side, layered on rendering.md) |
| 02-game-design | 14 | ~2,520 | Exceptional | Exact integer formulas, breakpoint tables, verified footnotes, worked examples. +`pvp.md` (×0.17 penalty now canon) |
| 03-ui-ux | 5 | ~600 | Solid | ASCII mockups, key bindings, panel state machine. `automap` + `settings-and-menus` now authored (prior gap closed) |
| 04-content-bible | 6 | ~1,210 | Good, backlog gaps | Framework excellent. 5/7 classes still missing numeric skill data; Acts II–V zone tables incomplete — tracked in roadmap §2 |
| 05-implementation | 11 | ~1,077 | Solid | Phase 0–1 detailed; Phases 2–7 have tasks + acceptance criteria. +`roadmap.md` (M0–M7 master index over the phase docs) |
| research | 6 | ~4,205 | Excellent | Raw D2 mechanics with exact formulas. Canonicalized into 02-game-design |
| interactive | 4 HTML | ~1,234 | Functional | Mermaid arch diagrams, HUD mockup, drop simulator, skill tree explorer |
| **Total** | **55 + 4 HTML** | **~11,300** | | |

## Resolved in Stage A (2026-07-08)

Stage A closed every cross-cutting doc gap from the 2026-07-07 review and added two master
index docs:

- **Graphics plan** — `01-architecture/graphics-plan.md`: visual-quality tiers + `G0–G11`
  render-side step roadmap, layered on `rendering.md` (which stays the canonical pipeline);
  `performance-budget.md` remains CI-gated canon on any number conflict.
- **PvP canon** — `02-game-design/pvp.md`: the ×0.17 player-vs-player damage penalty plus the
  two do-not-conflate PvP factors, wired into `phase-6-multiplayer.md` and
  `combat-resolution.md`. Resolves the prior PvP-consolidation / penalty-inconsistency gap.
- **Master roadmap** — `05-implementation/roadmap.md`: M0–M7 milestones, three parallel lanes
  (engine / content / graphics), acceptance-gate index, dependency graph. Now the entry point
  over the per-phase docs.
- **Low-quality item tier** — `items-and-affixes.md`: exact low-quality rules
  (`max(floor((base−1)/3), 1)` durability, the cube-upgrade fix, word-eligibility open question).
- **NM immunity wording** — `difficulty-progression.md` + `04-content-bible/monster-roster.md`:
  Nightmare immunity language clarified and made consistent.
- **Stamina-per-vit cleanup** — `04-content-bible/class-identities.md`: removed the stray
  stamina-per-vitality block (canon lives in `stats-and-formulas.md`).

Also confirmed live (closed before this pass but still listed as missing in the stale review):
`03-ui-ux/automap.md`, `03-ui-ux/settings-and-menus.md`, `01-architecture/audio-synthesis.md`,
and the durability sections in `items-and-affixes.md`.

## What's Excellent (no action needed)

1. **Determinism model** — 25 Hz tick, named RNG streams, replay system, banned-API lint
   gates. Best-in-class for a game project.
2. **World seam contract** — `IWorld` interface clean, JSON-serializable views, no sim
   leakage. Phase 6 multiplayer is genuinely additive.
3. **Stats & formulas** — every formula has integer arithmetic, rounding steps documented,
   breakpoint tables verified against multiple sources with footnotes.
4. **Combat resolution** — full pipeline with exact order, CB/OW/leech/absorb formulas,
   block-before-dodge order verified; now includes the PvP damage-penalty hook.
5. **Loot system** — TC engine, NoDrop player-count formula, 128ths quality system, MF
   diminishing returns, rune chain with exponential rarity — all with worked examples.
6. **Monster system** — 15 original families, 11 AI archetypes, champion/unique modifier
   tables with per-difficulty scaling, 5 act bosses with frame-accurate ability tables.
7. **Implementation phases** — clean dependency graph, concrete acceptance criteria,
   testing strategy with golden replays + statistical gates + IP audit, now indexed by the
   milestone-gated master roadmap.
8. **IP policy** — clear clone-vs-original boundary, blocked-names grep gate, content bible
   authoring rules. Legally sound for a study project.

## Gaps Found — Prioritized

### P0: Missing before Phase 0 can start

| Gap | Impact | Action |
|---|---|---|
| **No `package.json` or source code** | Phase 0.1 creates this | Expected. Phase 0 task 0.1 covers scaffold |
| **No config files** (tsconfig, vite, biome, vitest) | Same | Same — Phase 0.1 |

No doc gaps block Phase 0. The architecture docs are complete enough to start coding.

### P1: Missing cross-cutting docs — RESOLVED

All four docs flagged in the prior pass now exist:

| Prior gap | Resolution |
|---|---|
| Automap UI doc | `03-ui-ux/automap.md` ✓ |
| Settings & menus doc | `03-ui-ux/settings-and-menus.md` ✓ |
| Durability mechanics | `items-and-affixes.md` → "Durability baselines" + "Durability & degradation" sections ✓ |
| Audio system arch doc | `01-architecture/audio-synthesis.md` ✓ |

No open P1 gaps.

### P2: Content-authoring backlog (still open — the main gap)

The content tables are the one genuinely-open area. Per-phase sizing is **not restated here**;
it is tracked as the **Content-authoring lane** in `../05-implementation/roadmap.md` §2 (backlog
totals per phase, per generator/family). Current authored percentages live in the Content Bible
Completeness Matrix below — roadmap §2 cites this matrix as its authored-% source, so the two
stay in sync.

Headline: ~20–25% of content rows authored. Consuming phases: **Phase 2** (items/affixes/sets/
words/gems), **Phase 3** (5/7 classes' skill numbers), **Phase 4** (Acts II–V tables, quests,
superuniques). This is deferred by design, not a blocker for Phase 0–1.

### P3: Nice-to-have supplements

| Gap | Value |
|---|---|
| Accessibility guidelines doc | Now slotted as graphics step `G11` + roadmap P7; a standalone intent doc is still nice-to-have |
| Mercenary combat doc (dedicated) | Hireling info scattered; a focused doc would help Phase 3–4 |
| Performance profiling playbook | How to use the `?perf=1` overlay, interpret results, file a perf issue |

(The previously-listed "PvP rules consolidated doc" is now authored as `02-game-design/pvp.md`
and removed from this list.)

## Content Bible Completeness Matrix

Authored-% source of truth (referenced by roadmap §2). Still the primary open backlog.

| Content type | Authored | Target | % | Needed by |
|---|---|---|---|---|
| Base items (chains) | ~18 chains shown | ~40 chains | 45% | Phase 1 (subset), Phase 2 (full) |
| Affixes | Design rules only | ~200 rows | 0% | Phase 1 (v1 ~30), Phase 2 (full) |
| Unique items | 30 representative | ~150 | 20% | Phase 2 (subset), Phase 4 (full) |
| Set items | Design rules only | ~15 sets (~60 items) | 0% | Phase 2 |
| Words | 12 named | ~50 | 24% | Phase 2 |
| Gems (stat tables) | 1 example column | 6 families × 6 tiers | ~3% | Phase 2 |
| Runes (stat tables) | 13 tiers named | 13 × 3 contexts | ~10% | Phase 2 |
| Monster families | 15 families, ~60 variants | 15 families, ~80 variants | 75% | Phase 1 (4), Phase 4 (full) |
| Zones (names) | All 5 acts named | All 5 acts | 100% | — |
| Zones (mechanical tables) | Act I complete | All 5 acts | 20% | Phase 4 |
| Skills (numeric data) | 2/7 classes (49 skills) | 7 classes (~210 skills) | 23% | Phase 1 (2 classes), Phase 3 (full) |
| Quest details | Reward table complete | Full quest descriptions | 30% | Phase 4 |
| Act boss kits | All 5 complete | All 5 | 100% | Phase 4 |
| Superuniques | Act I roster done | All acts | 20% | Phase 4 |

## Interactive HTML Assessment

| File | Lines | Functional | Notes |
|---|---|---|---|
| architecture.html | 211 | Yes (Mermaid CDN) | 4 clickable architecture diagrams |
| hud-mockup.html | 447 | Yes (pure CSS) | Pixel-level D2R-layout HUD with animated globes |
| drop-simulator.html | 261 | Yes (JS) | TC walk + MF math interactive |
| skill-tree-explorer.html | 315 | Yes (JS) | 2-class tree browser with tooltips |

All standalone, dark-themed, no build step needed. Good reference artifacts.

## Research Doc Assessment

| File | Lines | Coverage |
|---|---|---|
| r1-character-math.md | 877 | Stats, breakpoints, XP, speed — fully canonicalized into 02-game-design |
| r2-items-loot.md | 767 | Affixes, TC, MF, drops, crafting — fully canonicalized |
| r3-combat-monsters.md | 777 | Hit resolution, damage, CB/OW/leech, monster stats — fully canonicalized |
| r4-world-progression.md | 541 | Acts, quests, difficulty, endgame — fully canonicalized |
| r5-classes-skills.md | 702 | Skill trees, synergies, scaling — fully canonicalized |
| r6-ui-ux.md | 541 | HUD, panels, controls — fully canonicalized |

Research → canonicalized pipeline is clean. Research docs serve as appendices/citations.

## Verdict

**The documentation suite is ready for Phase 0–1 implementation.** No architectural or
game-design gaps block the engine scaffold or the vertical slice. Every cross-cutting doc gap
from the prior review is closed, and `roadmap.md` is now the single milestone-gated index over
the phase docs.

The remaining open area is **content-authoring depth** (~20–25% of rows authored) — expected
and correctly deferred to the phases that need it (Phase 2 items, Phase 3 skills, Phase 4
world). It is tracked as the content lane in `roadmap.md` §2 and quantified in the Completeness
Matrix above.

**Strongest aspects:** determinism model, formula fidelity, world seam contract, testing
strategy, IP policy, and the new milestone-gated master roadmap.

**Weakest aspect:** content authoring depth. This is the main bottleneck for Phases 2-4 and
will require dedicated content sessions.

**Next review due: Phase 1 exit.**
