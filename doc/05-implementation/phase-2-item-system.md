# Phase 2 — Item System Complete

> Goal: full loot endgame. Every system from the source mechanics — affixes, uniques, sets,
> sockets, gems, rune-analog, word-analog (runeword-equivalent), cube recipes, crafting,
> gambling, stash, MF math — all implemented against original content tables.
> Phase drops in parallel with Phase 3; both feed into Phase 4.

Implements: `02-game-design/items-and-affixes.md`, `loot-and-drops.md`,
`sockets-gems-words.md`, `crafting-cube.md`. Content: per `04-content-bible/item-catalog.md`.

## Tasks

### 2.1 Full affix engine
Affix table (~300 rows), quality-roll pipeline (unique→set→rare→magic→superior→normal with
128th math per research), frequency-weighted affix selection with group exclusion, ilvl/alvl
gating, magic (1p+1s) and rare (up to 3p+3s) slot fills, staffmods/automods per item type.
**Accept:** drop-simulator — 1M rolls produce affix-distribution histogram within tolerance
of research specs; alvl formula golden tests pass for every (ilvl, qlvl, magic_lvl) combination.

### 2.2 Unique items
Unique table (~150 entries — stat budgets matching D2-equivalent tier slots per content
bible), guaranteed drop from their assigned monsters or TC, quest-boss first-kill unique
drop bonus mechanic.
**Accept:** each unique's stat budget matches its tier envelope (±5%) in automated check;
unique drop odds from target boss within statistical tolerance.

### 2.3 Set items
Set table (~100 entries) with partial-completion level thresholds and bonuses, full-set
bonus, stat budget per set tier.
**Accept:** set-completion bonuses apply per tier rules; partial-completion bonuses stack
correctly (golden tests at 2/3/5 pieces).

### 2.4 Sockets
Max-socket rules per base + ilvl, socket roll probabilities on drop, socket-adding quest
(drop on normal-difficulty boss kill analogue), socket-granting quest NPC.
**Accept:** socket count distribution per base/ilvl matches research tables (golden stats).

### 2.5 Gems
6-tier gem ladder (chipped→perfect), 3 slot-context effects (weapon/shield/helm-armor),
upgrade recipe (3:1), stat contributions in each tier.
**Accept:** socketed gem bonuses apply correctly to char sheet; 3:1 upgrade works.

### 2.6 Rune system (original)
A rune-analog system: ~12-tier resource-socketable ladder (not 33 runes — a manageable
count), each tier combines a fixed effect slot (weapon/shield/body) + cumulative power
progression. Drop rarity curve exponential per tier. Upgrade recipes: 3:1 low, 2:1+
resource-token high.
**Accept:** drop tiers distributed to match the designed rarity curve (statistical test);
upgrade recipes produce correct tier.

### 2.7 Word system (original runeword-analog)
Word table (~50 entries): exact base-type + socket-count + sequence, grants combined
stat pool. Mechanically mirrors runeword power-to-rarity curve (from mid-runner to
best-in-slot). 
**Accept:** word-assignment rules match spec; stat pool matches manifest (golden tests);
each word is plausible as a target (review).

### 2.8 Cube recipes
Recipe engine parsing the `recipes` table: input matchers (type, quality, count, flag)
→ output constructor (item + mods). Include: reroll (Pg+rare, chipped+rare, 6Pskull+rare),
upgrade (normal→exceptional→elite via cube), socketing (weapon/armor/helm base + socketables),
crafting recipe (blood/caster/hitpower/safety analogues), token-of-absolution-respec recipe.
**Accept:** each recipe category has golden tests (input → expected output); recipe rule
duplicate/conflict detection in data validation.

### 2.9 Crafting
4 crafting recipe families matching the fixed-affix + 1-4 random mechanic: caster (FCR/mana),
blood (LL/OW), hitpower (FHR), safety (block/DR). Craft ilvl formula per research: `floor(clvl/2) + floor(ilvl/2)`.
**Accept:** crafted items have correct fixed mods + random count within range; ilvl
computation golden.

### 2.10 Gambling
Gamble UI per `03-ui-ux/inventory-and-panels.md`: base-item pick → price (per research
formula) → roll (ilvl = clvl-5..+4; quality odds rare 1/10, set 1/1000, unique 1/2000;
exceptional/elite tier-upgrade odds as pinned in `02-game-design/quests-and-npcs.md`).
**Accept:** gambled item quality distribution matches the pinned odds within tolerance.

### 2.11 Stash
Stash tabs per D2R-layout (personal + 3 shared, 10×10 grid), gold storage, persistent
per-account (online) or per-save-file (offline).
**Accept:** stash survives save/load with full fidelity; gold moves between player and stash.

### 2.12 Magic Find
MF pipeline integrating with TC engine: no MF → quality pick weights use base rates; MF
diminishing returns per research formula (unique/set/rare coefficients), MF-before-roll
multiplication.
**Accept:** drop simulator — N kills at varying MF values produce quality histograms that
match research-predicted curves within tolerance.

## Test plan
Drop-simulator statistical tests (1M+ rolls per configuration), unique/set/craft/word golden
manifest tests, recipe golden tests, stash save/load round-trips, gambler statistical tests.

## Exit criteria
- Full loot ecosystem playable: a player can find bases → socket/craft → equip → optimize MF
  setup → target-farm → clear endgame prep.
- Drop-simulator statistical tests at 0.99 confidence vs research target curves.
- Every unique/set/crafted/word item's stat profile is within ±5% of its designed-envelope budget.
- No gameplay blockers (crashes/desync/unreachable items) in full-ecosystem E2E.
