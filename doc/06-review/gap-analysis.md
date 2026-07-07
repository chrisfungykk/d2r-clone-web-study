# Documentation Gap Analysis — 2026-07-07

> Deep review of all 56 docs across 6 directories. Verdict: **production-grade documentation
> suite with specific backlog gaps in content authoring and a few missing cross-cutting docs.**

## Scorecard

| Section | Docs | Lines | Quality | Verdict |
|---|---|---|---|---|
| 01-architecture | 10 | ~1,550 | Exceptional | Ship-ready. Every doc has exact specs, code examples, invariants |
| 02-game-design | 13 | ~2,800 | Exceptional | Exact integer formulas, breakpoint tables, verified footnotes, worked examples |
| 03-ui-ux | 3 | ~290 | Solid | ASCII mockups, key bindings, panel state machine. Missing 2 docs (below) |
| 04-content-bible | 6 | ~1,220 | Good, backlog gaps | Framework excellent. 5/7 classes missing skill data. Acts II-V zone tables incomplete |
| 05-implementation | 10 | ~850 | Solid | Phase 0-1 detailed. Phases 2-7 have tasks + acceptance criteria |
| research | 6 | ~4,205 | Excellent | Raw D2 mechanics with exact formulas. Canonicalized into 02-game-design |
| interactive | 4 HTML | ~1,234 | Functional | Mermaid arch diagrams, HUD mockup, drop simulator, skill tree explorer |
| **Total** | **52 + 4 HTML** | **~12,150** | | |

## What's Excellent (no action needed)

1. **Determinism model** — 25 Hz tick, named RNG streams, replay system, banned-API lint
   gates. Best-in-class for a game project.
2. **World seam contract** — `IWorld` interface clean, JSON-serializable views, no sim
   leakage. Phase 6 multiplayer is genuinely additive.
3. **Stats & formulas** — every formula has integer arithmetic, rounding steps documented,
   breakpoint tables verified against multiple sources with footnotes.
4. **Combat resolution** — full pipeline with exact order, CB/OW/leech/absorb formulas,
   block-before-dodge order verified.
5. **Loot system** — TC engine, NoDrop player-count formula, 128ths quality system, MF
   diminishing returns, rune chain with exponential rarity — all with worked examples.
6. **Monster system** — 15 original families, 11 AI archetypes, champion/unique modifier
   tables with per-difficulty scaling, 5 act bosses with frame-accurate ability tables.
7. **Implementation phases** — clean dependency graph, concrete acceptance criteria,
   testing strategy with golden replays + statistical gates + IP audit.
8. **IP policy** — clear clone-vs-original boundary, blocked-names grep gate, content bible
   authoring rules. Legally sound for a study project.

## Gaps Found — Prioritized

### P0: Missing before Phase 0 can start

| Gap | Impact | Action |
|---|---|---|
| **No `package.json` or source code** | Phase 0.1 creates this | Expected. Phase 0 task 0.1 covers scaffold |
| **No config files** (tsconfig, vite, biome, vitest) | Same | Same — Phase 0.1 |

No doc gaps block Phase 0. The architecture docs are complete enough to start coding.

### P1: Missing docs (should exist for completeness)

| Gap | Where it matters | Recommendation |
|---|---|---|
| **Automap UI doc** | Automap mentioned in 5 docs but no dedicated UI spec (overlay modes, colors, icon legend, minimap vs fullscreen) | Create `doc/03-ui-ux/automap.md` |
| **Settings & menus doc** | Character creation flow, difficulty selection, game menu, settings screen, graphics options — none documented | Create `doc/03-ui-ux/settings-and-menus.md` |
| **Durability mechanics** | When items lose durability, how much per hit/death, repair formula — scattered across 3 docs | Add "Durability" section to `items-and-affixes.md` |
| **Audio system arch doc** | WebAudio synthesis approach mentioned in rendering.md + Phase 7 but deserves its own arch doc | Create `doc/01-architecture/audio-synthesis.md` |

### P2: Content bible backlog (needed before their respective phases)

| Gap | Needed by | Scale |
|---|---|---|
| **5/7 classes missing numeric skill data** in skill-data.md | Phase 3 | ~500 lines (5 classes × ~25 skills × 4 lines each) |
| **~120/150 uniques not authored** in item-catalog.md | Phase 2 (subset), Phase 4 (full) | ~600 lines |
| **Acts II-V zone mechanical data tables** (alvl/WP/TC/monster-set columns) | Phase 4 | ~200 lines (Act I template exists; replicate for II-V) |
| **Set items** — only design rules exist, no concrete sets authored | Phase 2 | ~150 lines for ~15 sets |
| **Words** — only 12 concrete words named, need ~50 | Phase 2 | ~200 lines |
| **Gem/rune per-slot stat tables** — only tier 1 fire example shown | Phase 2 | ~100 lines (6 gem families × 6 tiers × 3 contexts) |

### P3: Nice-to-have supplements

| Gap | Value |
|---|---|
| Accessibility guidelines doc | Phase 7 scope but good to document intent early |
| PvP rules consolidated doc | Non-goal per vision but mechanics mention PvP penalties |
| Mercenary combat doc (dedicated) | Hireling info scattered; a focused doc would help Phase 3-4 |
| Performance profiling playbook | How to use the `?perf=1` overlay, interpret results, file a perf issue |

## Content Bible Completeness Matrix

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

**The documentation suite is ready for Phase 0 implementation.** No architectural or
game-design gaps block the engine scaffold. Content bible backlog is expected and
correctly deferred to the phases that need it (Phase 2 for items, Phase 3 for skills,
Phase 4 for world).

The 4 missing UI/architecture docs (automap, settings/menus, durability, audio) should be
written before their respective phase tasks but are not blockers for Phase 0-1.

**Strongest aspects:** determinism model, formula fidelity, world seam contract, testing
strategy, IP policy.

**Weakest aspect:** content authoring depth (only 20-25% of rows authored). This is the
main bottleneck for Phases 2-4 and will require dedicated content sessions.
