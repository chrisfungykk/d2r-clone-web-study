# Phase 1 — Vertical Slice

> Goal: the core ARPG loop, fun in miniature. One town, a 3-zone wilderness→dungeon chain,
> a mini-boss, two classes (one tree each), real combat, loot v1, inventory, vendor, death.
> Everything built here is the *real* system — later phases add content and depth, not rewrites.

Implements (partially): `02-game-design/` combat-resolution, stats-and-formulas,
items-and-affixes (v1 subset), loot-and-drops (v1), monsters (v1), world-and-zones (slice),
quests (1 template), `03-ui-ux/` hud + inventory + controls. Content: per
`04-content-bible/` slice appendix.

## Tasks (dependency order; `[P]` = parallelizable)

### 1.1 Stats engine
Attribute system with per-class coefficients (charStart table), derived stats (life, mana,
stamina, AR, defense, block), the canonical integer formulas from
`02-game-design/stats-and-formulas.md`; PlayerView exposes computed character-sheet numbers.
**Accept:** golden formula tests — table of (inputs → expected AR/CTH/EHP…) cases from
research docs pass exactly.

### 1.2 Combat core
Hit resolution order (AR roll → block → damage pipeline), damage types (phys + 4 elements,
poison as frame-DoT, cold chill), hit recovery/FHR + block/FBR + attack/cast animation frame
system driven by the speeds table — 25 Hz native breakpoints; death, corpses, XP award with
mlvl/clvl scaling.
**Accept:** breakpoint golden tests (IAS/FCR/FHR inputs → exact frame counts per researched
tables); poison/chill duration tests in frames; replay-stable brawls.

### 1.3 Skills v1 — two classes, one tree each `[P after 1.2]`
Skill engine: mechanic keys needed by the two slice trees (melee strike, charged strike,
projectile, nova, self-buff, passive), levels/prereqs/tiers, mana costs, per-level scaling
bands, L/R skill binding + skill-select flyout.
Classes: the content-bible's warrior archetype (melee tree) + elementalist archetype
(one element tree) — 6 skills each.
**Accept:** each skill's damage/mana/AR progression matches its design table rows 1–20;
skill point spend/refund-at-respec-NPC works; replay-stable.

### 1.4 Monsters v1 + AI `[P after 1.2]`
Monster engine from monsters/monsterMods tables: 4 original families for the slice
(melee rusher, ranged kiter, caster, swarm), AI archetype state machines (aggro radius,
leash, flee-on-low-HP variant), champion/unique modifier system v1 (3 modifiers), minion
packs, mini-boss with 2 telegraphed abilities.
**Accept:** spawn density/pack composition deterministic per seed; AI behaves per archetype
spec in scripted scenario tests; champion mods visibly and mechanically applied.

### 1.5 Loot v1
Treasure-class engine (picks, NoDrop, gold), item generation for: normal/superior/magic/rare
qualities, v1 affix table (≈30 affixes), potions (heal/mana tiers), gold; ground drops with
labels, pickup, rarity-colored names per UI spec.
**Accept:** drop-simulator headless test — 100k kills match expected quality/affix
distributions within tolerance; ilvl/alvl math golden tests pass.

### 1.6 Inventory, equipment, belt
Grid inventory (10×4), paper-doll slots with requirements checking, belt (4 slots + potion
consumption), gold, Tetris drag/drop + ctrl-click shortcuts, equip stat integration, item
tooltips per UI spec (compare on hover).
**Accept:** every drag/drop edge case in the checklist (swap, invalid slot, full inventory,
2-handed rules) passes E2E script; stats update correctly on equip (golden cases).

### 1.7 Town + NPCs + quest template
Town zone (safe, no spawns): healer, vendor (buy/sell/repair, generated stock), stash v0
(single tab), quest NPC running one "kill the boss" quest via the quest state machine,
gold sink pricing per design doc.
**Accept:** vendor stock deterministic per game seed + restock rules; quest completes,
rewards, persists across save/load.

### 1.8 Death, save/load, session flow
Death → town respawn + corpse recovery (v1 rules), save-on-triggers to IndexedDB, load/
character-select menu, new-game reroll (new world seed, same character).
**Accept:** kill-die-recover E2E; save/load round-trip preserves full character hash;
corpse survives save-quit.

### 1.9 HUD + panels v1
HUD per `03-ui-ux/hud.md`: orbs, L/R skill buttons, belt, XP bar, mini-panel; panels:
inventory, character sheet, skill tree (slice trees), automap overlay v1 (Tab).
**Accept:** layout matches wireframes at 16:9/16:10/ultrawide; all hotkeys per controls doc;
UI state never desyncs from PlayerView (event-driven updates only).

### 1.10 Slice content + tuning pass
Zone chain per content bible slice: wilderness (alvl 1-3) → deep wilderness (4-6) →
dungeon 2 floors (7-9) + mini-boss; monster/zone/drop tuning to the design doc's pacing
targets (time-to-level, drops-per-minute).
**Accept:** blind playtest checklist — slice completable in 45–90 min by a new player;
mini-boss drop moment feels rewarding (rare+ guaranteed first kill).

## Test plan
Golden formula/breakpoint tests (the fidelity heart — failures block merge), drop
distribution stats, E2E bot script (spawn→clear zone 1→buy potion→die→recover→kill boss),
golden replays ×3 (walk, brawl, full-slice speedrun), perf scene updated with combat load.

## Exit criteria
- Full loop demo: create character → clear slice → mini-boss kill → loot upgrade equipped.
- All golden mechanics tests green; drop stats within tolerance; 60 fps in worst slice brawl.
- **The fun gate:** three consecutive playtesters voluntarily replay the dungeon. If not,
  tune (1.10) before calling the phase.
