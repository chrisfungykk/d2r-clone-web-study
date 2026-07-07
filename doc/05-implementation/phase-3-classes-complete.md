# Phase 3 — Classes Complete

> Goal: all 7 class archetypes × 3 trees each, with synergies, +skills item interactions,
> respec system, and hireling v1. Each class playable through vertical-slice content.
> Runs parallel with Phase 2; both complete before Phase 4 (world complete).

Implements: `02-game-design/classes-and-skills.md`, relevant sections of
`combat-resolution.md` (skill-targeting rules), `items-and-affixes.md` (+skills, o-skills),
`stats-and-formulas.md` (class coefficients). Content: per `04-content-bible/class-identities.md`.

## Tasks

### 3.1 Skill engine — final form
Expand from Phase 1's 2-tree subset to full mechanic key set: projectile (+pierce, +split),
summon (cap rules, stat scaling, corpse-summon variant), curse (single-override rule,
duration per hard point), aura (radius per level, one-active rule, party-share in co-op),
warcry/shout (drum-buff model), shapeshift (form state, skill-lockout model, stat swap),
trap (proximity arming, health), charge-up + finisher (stack-release model), teleport
(range-gated movement skill), corpse-consumer (corpse explosion damage formula), passive
stacking (critical strike, dodge/avoid/evade counter).
**Accept:** each mechanic key has a scripted scenario test proving correct behavior;
mechanic-specific edge cases documented and tested (e.g., pierce off-wall ricochet bounds,
aura overlap in party, curse override order, trap budget cap, shapeshift gear stat freeze).

### 3.2 Seven classes
7 classes built from the `charStart` and `skills` tables:

| # | Archetype | Trees | Identity (original names in 04-content-bible) |
|---|---|---|---|
| 1 | Warrior analogue | melee + shouts + passive mastery | Heavy armor, weapon swapping, leap attack |
| 2 | Rogue analogue | traps + shadow magic + martial arts | Agility, cloak, poison/cold traps, charge tech |
| 3 | Brute analogue | combat + combat masteries + war cries | Dual wield, bleeds, frenzy-style ramp, warcry buffs |
| 4 | Shapeshifter analogue | summon + elemental + shapeshift | Were-form, rabies-style DoT, volcano chaos |
| 5 | Summoner analogue | summon + curses + projectile bone magic | Raise army, corpse explosion, curses |
| 6 | Paladin analogue | auras + holy melee + combat skills | Aura bot, smite-style stun, holy-element strike |
| 7 | Elementalist analogue | 3 element trees | Mastery passives, high-damage caster |

Each: 30 skills (6 tiers × ~5 skills), prereq chains, synergy web, 3 tree-passives paths.
**Accept:** each class has golden replay test (scripted sequence of skill uses); skill point
spend from lv1→99 totals correct; synergy contributions verified per hard-point rule.

### 3.3 +Skills item interaction
All +skill affixes wired to skill engine: +all, +class, +tree, +single, o-skills (item-granted
active skills with charges). Soft vs hard point distinction enforced for synergy/synergy-prereq
computation. Skill level cap: base 20 + gear (no hard cap on total).
**Accept:** synergy contribution depends only on hard points; soft points count for effect but
not synergy; o-skills work as active abilities; level cap test — item reaching level 40+ skill.

### 3.4 Respec system
3 free respecs per character (from quest reward analogue) + a crafted respec token recipe
(essences from act bosses → respec token). A respec is **combined**: it fully refunds both
skill points and stat points in one action (deliberate simplification over separate refunds;
matches D2R's combined respec).
**Accept:** respec fully refunds all skill + stat points; respec counter decrements; token
crafting recipe works; after 3 free, token-only; no negative-points or over-99 exploit.

### 3.5 Hireling v1
Hireling system per research (4 archetype variants from NPC hire, gear slots 3 or 4,
level/XP scaling, revive cost formula). Synergies with class skills (e.g., aura hireling
stacks with player auras via highest-wins rule).
**Accept:** Hire purchase → level → equip → revive loop works; stats scale per level data;
hireling dies → XP earned stays.

## Test plan
Class golden replays (one per class × 3 builds = 21 tests), synergy contribution golden,
+skills edge-case tests (o-skills, soft/hard, level cap), respec E2E, hireling E2E, perf
scene updated with full party + summons (entity budget check vs `performance-budget.md`).

## Exit criteria
- All 7 classes playable and distinct; each has at least 2 viable builds within slice content.
- Synergy math matches research docs exactly.
- Entity budget holds with player + hireling + 8 summoned minions in AoI (≤ 220 active entities).
- No mechanical gap between implementation and `02-game-design/classes-and-skills.md`.
