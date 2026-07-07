# Vision

## What this project is

A research/study project: build a **browser-native action RPG** that reproduces the
*systems depth* that made Diablo II: Resurrected the genre benchmark — and present it in
real 3D with a zoomable isometric camera, in the spirit of world-of-claudecraft's
"complete game in a browser tab, procedural everything, deterministic core" ethos.

Three goals, in priority order:

1. **Mechanical fidelity.** The loot generator, skill/synergy math, frame-based speed
   system, difficulty structure, and economy behave *exactly* like the researched D2
   mechanics (documented in `research/` and canonicalized in `02-game-design/`). A player
   who knows how affix levels, treasure classes, or cast-rate breakpoints work should find
   their knowledge transfers 1:1.
2. **Engineering quality.** Deterministic 25 Hz sim, replay-tested, 60 fps with hundreds of
   entities, one clean seam between simulation and presentation, multiplayer-ready without
   rewrites. The codebase is itself a study artifact.
3. **Original world.** All expression — names, story, zones, monsters, item identities,
   art, audio — is ours, authored in `04-content-bible/`. The game must feel *familiar in
   structure* while being *original in content*.

## IP policy (project law)

- **Cloned:** systems, formulas, data-table *schemas*, structural patterns (act flow, quest
  reward cadence, difficulty tiers), UI *layout* conventions, control scheme, game feel.
  Game mechanics and rules are not copyrightable expression; they are documented publicly
  and reimplemented here from mechanics research.
- **Original:** every proper noun, all text, map layouts, visual/audio assets (procedural),
  lore. No Blizzard trademarks anywhere, including project name and marketing copy.
- **Never:** ripped assets, bulk-copied content databases, reproduced game text, map
  reproductions, or "renamed-but-recognizable" content (a unique bow with a one-letter-off
  name fails review).
- Rationale and enforcement checklist: `05-implementation/testing-strategy.md` (IP audit).

## Success criteria

| Axis | Bar |
|---|---|
| Fidelity | Breakpoint tables, affix-level math, TC/NoDrop math match research docs; drop-simulator statistical tests pass |
| Feel | Click-to-move + skill combat indistinguishable in responsiveness from the reference at 25 Hz mechanics / 60 fps presentation |
| Depth | 7 classes × 3 trees with synergies; full affix economy; 3 difficulties; endgame farming loop |
| Performance | Budgets in `01-architecture/performance-budget.md` green on mid-range hardware |
| Determinism | Golden replays stable across machines; loot distribution tests within tolerance |
| Multiplayer-ready | Phase 6 lands without touching render/ui code (seam holds) |

## Non-goals

- Not a commercial product; a study of ARPG systems engineering and AI-agent-driven development.
- No asset-extraction/mod-loader path for Blizzard data — this is not an engine reimplementation
  for original game files (that's OpenDiablo2's lane, not ours).
- No PvP before the co-op core is proven (PvP math documented but unscheduled).
- No mobile-native builds until Phase 7+ (responsive layout is in scope; touch controls are not, initially).
- Not an MMO — lobby-based sessions, max 8 players, like the source model.

## Product shape

- **Instant play:** URL → menu ≤ 3 s → character create → in-game. No install, no account
  (offline mode).
- **The loop:** kill → loot explosion → identify/socket/craft decisions → build tuning →
  harder difficulty → repeat. Endgame = efficient-farming mastery (area-level knowledge,
  MF/speed tradeoffs, boss keys event chain).
- **Sessions respect the player:** save-anywhere semantics via persistent character doc;
  maps reroll per session keeping farming fresh.

## Names

Working title and all content names are decided in `04-content-bible/naming-and-lore.md`.
The repo name `d2r-clone-web` is a development codename only and must not ship user-facing.
