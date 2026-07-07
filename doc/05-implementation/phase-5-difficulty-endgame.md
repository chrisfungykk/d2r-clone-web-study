# Phase 5 — Difficulty + Endgame

> Goal: the 500-hour loop. Nightmare/Hell difficulty with full penalty/immunity mechanics,
> TC upgrades, XP curve to 99, endgame farming zones, boss-key event chain, balance pass.
> What people actually *play* for years.

Implements: `02-game-design/difficulty-progression.md`, `endgame.md`, `economy.md`.

## Tasks

### 5.1 Difficulty system
Three tiers per research: Normal (0 resist penalty), Nightmare (−40), Hell (−100). XP death
loss (5%/10% recoverable), gold loss formula, leech penalty (1/2, 1/3). Immunity threshold
(monster res ≥ 100%), 1/5 breaking (Conviction/Lower-Resist analogues effective 1/5 vs
immunes). Floor −100 on monster res after breaks.
Nightmare: elite item drops unlocked (TC upgrade); regular monster mlvl = alvl
(champions +2, uniques +3 — see `02-game-design/monsters.md`).
Hell: resist penalty applies, immunities present (spread ~4 element immunities across
monster families, never trivially avoidable), same mlvl = alvl rule, all TC upgrades applied.
**Accept:** act-3 boss cold-immunity test — breaks at correct Conviction-analogue level
per expected pierce threshold; resistance penalty applied correctly per difficulty; elite
items drop in Hell only from TC upgrade; immunity distribution prevents any single-element
build from completing Hell (skin/punish balanced — synergies make fire+lightning possible).

### 5.2 XP curve to 99
Full 1–99 XP curve implementation with high-level penalty bands (post-lv70), mlvl/clvl XP
modifier per research, party XP split + level-gap penalty, area-level XP bonus/penalty.
**Accept:** golden tests — known (xp, clvl, mlvl, party) tuples produce exact expected gains;
lv 70+ penalty rates match research table; simulated 1→99 XP progression curve matches
reference shape.

### 5.3 alvl85 farming zones
~8 original zones with area level 85 (or act-5-equivalent where max-stat rolls are
achievable). Place in Acts 3–5 to require completion to unlock. Open layout, dense spawns,
route-friendly (open final-approach gauntlet structure). Drop everything
(any unique, any affix up to max alvl).
**Accept:** can replicate all top-tier loot from these zones (verified by drop-simulator
statistical target).

### 5.4 Boss-key event chain
Pandemonium-equivalent mechanic: 3 keys dropped by 3 superuniques in Hell → 3 portals
(summon bosses) → 3 organs → mini-uber area → final boss → largesse charm / unique ring
/ class-specific charm analogue reward. Structured per research doc.
**Accept:** full chain completable; reward-item stat profiles within designed range.

### 5.5 Sundered charm analogue
Charm that breaks an immunity (res→95%) per D2R mechanic. Hell-only drop from final event
boss (or rare chance from act bosses in Hell). One per element-type.
**Accept:** sunder charm correctly sets monster res from immunity to 95%; cold mastery and
similar skills apply at 1/5 vs sundered; trading implications considered but deferred
to Phase 6.

### 5.6 Terror Zone analogue
Zone-rotation system: each 15–20 minutes, one zone is "seething" — its mlvl = min(clvl + 2,
act-5 cap), granting bonus XP and sunder-charm drop chance. All zones eligible. Visual
indicator (theme-enhanced rendering, particles on minimap). D2R model: mechanic.
**Accept:** terror zone mlvl formula matches research; XP boost correct; rotation schedule
deterministic per server but varies enough to keep farming fresh.

### 5.7 Balance pass
Systematic pass: each class build's time-to-clear Hell alvl85 zone measured headless →
balance outliers adjusted (skill scaling curves, unique/set stat budgets, TC weights).
Difficulty scaling curve checked — Normal→NM→Hell difficulty ramp should feel like the
reference (no spikes, no plateaus).
**Accept:** at least 3 builds per class clear Hell content at comparable speed (±30% of
class-average); no builds trivially outperformed (all feel viable in dedicated groups).

## Test plan
Headless speedrun benchmarks (3 builds per class, 3 zones per difficulty) tracked;
immunity-breaking golden tests; XP curve golden tests; alvl85 drop-simulator statistical
tests; full key-event-chain E2E script; terror-zone rotation test.

## Exit criteria
- Hell act 5 boss-kill possible with at least 10 distinct builds (covering all 7 classes).
- XP curve to 99 follows researched shape; lv 85+ progression is slow but achievable.
- Endgame loop identifiable: alvl85 farm → key hunt → event → chase item.
- Every durable (non-percentile) performance budget green under max-endgame load.
