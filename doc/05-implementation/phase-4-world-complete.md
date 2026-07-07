# Phase 4 — World Complete

> Goal: all 5 acts completable in Normal difficulty, with original zones per content bible,
> full quest engine, act bosses, superuniques, waypoints, shrines, and hirelings complete.
> The game is playable start→finish.

Implements: `02-game-design/world-and-zones.md`, `monsters.md`, `quests-and-npcs.md`.
Content: per `04-content-bible/zones.md`, `monster-roster.md`.

## Tasks

### 4.1 Zone generation — full
Extend Phase 1's single-zone generator to all zone types. Generators per zone record in the
`zones` table: wilderness (open, varied-density), forest (blocked LOS, winding paths), desert
(open, visual distance), jungle (dense LOS, labyrinths), cathedral/gothic dungeon (room-hall
grid), caves/tunnels (corridor-based), fortress (courtyard + interior), hell (organic
chaotic shapes). Algorithms and parameters per `01-architecture/world-generation.md`.
Key: terrain heightfield, walkability grid, prop placements, spawn-bounds,
spawn-density-per-cell.
**Accept:** each zone type uses the generator family specified for its `generatorKey` in
`01-architecture/world-generation.md`, with a per-generator layout golden (walkability-grid
hash + placement manifest at a fixed seed); same seed → identical walkability grid hash;
zones pass cycle-check (every zone reachable from town without dead-ends).

### 4.2 Acts 1–5 zone graphs
Per act: town (safe) → zone chain with connectivity edges per `zones` table. Size constants
per act (zone count, transition-depths). Original-IP zone names, themes, and connectivity
from `04-content-bible/zones.md`. Sprinkled: superunique anchors, shrine placement loci,
waypoint positions, quest trigger boundaries.
**Accept:** acts load without error; zone graph is traversable start→boss→act-transition;
waypoint count per act matches spec (9/9/9/3/9).

### 4.3 Quest engine — full
Full quest state machine from `quests` table: 6 quests per act (Act 4: 3), per-slot reward
type map. States: unavailable → available → in-progress → complete. Triggers: kill
target entity, enter zone, fetch item, speak to NPC, pop-inventory (use quest item on
target). Rewards: skill point, stat points, resist boost, socket add, imbue, hireling,
respec, shard-of-absolution token.
**Accept:** full quest-logic E2E — 27 quests completable; rewards persist across save/load;
per-difficulty quest state tracked independently (NM/Hell reuse same quests).

### 4.4 Act bosses
5 act bosses per `quests-and-npcs.md` mech profiles:
- **Act 1** — fast poison melee rusher w/ charging attack and poison cloud AoE
- **Act 2** — large bruiser, charge/knockback, freeze aura, confined arena
- **Act 3** — caster council-style with minion waves, high-elemental damage, teleport
- **Act 4** — mixed boss, seal-gated phase transitions, firestorm + bone-cage + lightning
- **Act 5** — wave-arena (5 waves of minions) → final boss clone with debuff-cleanse phase

Quest-drop bonus (guaranteed rare+ from first kill in that difficulty). Act 4/5 quest drop
includes special reward (rune/unique analogue).
**Accept:** each boss fight ~2–5 min on a fresh Normal-difficulty character; boss-kill
completes quest → grants award → waypoint to next act unlocks.

### 4.5 Monsters — full roster
~80 original monster entries in `monsters` table, 12–15 families with 3–5 tier-variants
each (e.g., same family, new capability/size at higher levels), spanning all 5 acts.
Balance: zone-appropriate mlvl/alvl per difficulty. Each has assigned AI archetype from
the ai-behavior library (Phase 1).
**Accept:** every zone has spawnable-content; monster balance curve per act (time-to-kill,
pack density, XP/hour rate relative to level range) within targets.

### 4.6 Superuniques
~25 superunique placed encounters with fixed name (original), set modifiers from `monsterMods`
table, anchored zones, TC overrides for key-drops. Notable drops: key analogues (boss-key
event chain, Phase 5 unlock), quest-specific items.
**Accept:** each superunique spawns at its anchor location with correct modifiers; farm route
discoverable (map knowledge matters); drops respect TC override.

### 4.7 Shrines
15 shrine types per `02-game-design/` spec wired into zone generator spawn points. Buff
durations, effect categories (recharge, XP, resist, skill, gem shrine analogue, combat shrines).
**Accept:** every shrine type works on activation; effect expires at correct tick; replacing
duration rule matches spec.

### 4.8 Hirelings — complete
All 4 hireling variants from Phase 3 expanded to full stat tables and equippable gear
(slot counts per archetype: 3 or 4). Level-tracking persistence, revive-cost scaling.
**Accept:** any hireling can survive through Normal difficulty with player equipment investment;
both melee and aura hirelings contribute meaningfully in combat stat checks.

### 4.9 NPCs — full act set
Per-act town: vendor, gambling NPC, healer, stash, waypoint, quest NPCs (6 per act),
act-transition NPC, hireling pool. Distinct original NPC identities (names, short
personality descriptors per 04-content-bible).

## Test plan
Zone-gen determinism test per zone, act traversal E2E (start→boss→credits in ~90 min with
debug-skip RNG), boss mechanical tests (each ability fires in scripted scenario), quest
completion E2E × 27, shrines test, hireling E2E, full perf scene with all zone types.

## Exit criteria
- Normal difficulty beatable start→finish with at least 2 class archetypes (~30 h play).
- All 27 quests completable with correct rewards; act boss fights feel distinct.
- Zone generation produces no dead-ends or impassable spawns.
- Entity budget holds in final-act hell zones (expected peak density).
