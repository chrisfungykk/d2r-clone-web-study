# D2R-Clone Web — Documentation Suite

> A browser-native ARPG: mechanics-exact to Diablo II: Resurrected's systems, with fully
> original content and 3D zoomable presentation. Architecture adapted from
> world-of-claudecraft.

## Quick start

1. `doc/05-implementation/` covers implementation order, phases, and testing strategy.
2. `doc/01-architecture/` explains the engine design (determinism, seam, data model).
3. `doc/02-game-design/` specifies every game system in mechanics-exact detail.
4. `doc/03-ui-ux/` documents the D2R-inspired HUD, panels, and controls.
5. `doc/04-content-bible/` is the authoring guide for all original content.
6. `doc/research/` contains raw researched mechanics (appendices — canonicalized in 02).

## Directory index

```
doc/
  README.md                           ← you are here
  00-vision.md                        — project goals, IP policy, success criteria
  01-architecture/
    overview.md                       — module map, tech stack, frame loop
    determinism.md                    — 25 Hz tick, seeded RNG, replay model
    world-seam.md                     — IWorld interface contract
    rendering.md                      — Three.js pipeline, procedural assets
    camera.md                         — isometric + zoom + limited orbit
    data-model.md                     — content-as-data table schemas
    save-persistence.md               — save format, versioning, migration
    simulation-runtime.md             — entity store, collision, pathfinding, AI, missiles
    performance-budget.md             — 60 fps ceilings, measurement rig
    networking-future.md              — Phase 6 authoritative server design
    world-generation.md               — procgen algorithms, automap, placement rules
  02-game-design/
    stats-and-formulas.md
    classes-and-skills.md
    combat-resolution.md
    items-and-affixes.md
    loot-and-drops.md
    sockets-gems-words.md
    crafting-cube.md
    difficulty-progression.md
    world-and-zones.md
    monsters.md
    quests-and-npcs.md
    endgame.md
    economy.md
  03-ui-ux/
    hud.md
    inventory-and-panels.md
    controls.md
  04-content-bible/
    naming-and-lore.md
    zones.md
    monster-roster.md
    item-catalog.md
    class-identities.md
  05-implementation/
    phases.md                         — phase dependency graph + summary table
    phase-0-engine-core.md            — scaffold, sim, seam, camera, locomotion
    phase-1-vertical-slice.md         — core loop with 2 classes, 1 zone chain
    phase-2-item-system.md            — full affixes, sets, sockets, crafting, MF
    phase-3-classes-complete.md       — 7 classes × 3 trees, synergies
    phase-4-world-complete.md         — 5 acts, quests, waypoints, act bosses
    phase-5-difficulty-endgame.md     — NM/Hell, immunities, endgame meta
    phase-6-multiplayer.md            — co-op server, lobbies, trade
    phase-7-polish.md                 — audio, fx, accessibility, performant
    testing-strategy.md               — golden replays, statistical tests, E2E
  research/
    r1-character-math.md              — formulas, breakpoints, scaling
    r2-items-loot.md                  — affix system, TCs, drop mechanics
    r3-combat-monsters.md             — hit resolution, damage, monster modifiers
    r4-world-progression.md           — acts, quests, difficulty, endgame
    r5-classes-skills.md              — skill trees, synergies, mechanics taxonomy
    r6-ui-ux.md                       — HUD anatomy, panel layout, controls
  interactive/                        [live, open in browser]
    hud-mockup.html                   — pixel-level D2R-layout HUD mockup
    skill-tree-explorer.html          — interactive 2-class skill tree browser
    drop-simulator.html               — treasure-class drop simulation + MF math
    architecture.html                 — clickable mermaid architecture diagrams
```

## Reading order by role

| Role | Order |
|---|---|
| **Architect** | `01-architecture/*` → `05-implementation/phases.md` |
| **Systems engineer** | `01-architecture/determinism.md` → `01-architecture/data-model.md` → `02-game-design/*` for system being implemented |
| **Content designer** | `00-vision.md` → `04-content-bible/` → `02-game-design/*` for constraints |
| **UI engineer** | `03-ui-ux/*` → `01-architecture/world-seam.md` (for view DTOs) |
| **First session (Phase 0)** | `01-architecture/overview.md` → `05-implementation/testing-strategy.md` → `05-implementation/phase-0-engine-core.md` |
