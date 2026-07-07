# Quests & NPCs

> Quest system, reward types, NPC service patterns, hirelings, vendors.
> Sources canonicalized from `doc/research/r4-world-progression.md`.

## Quest structure

Each act: 6 quests (act IV: 3). Quest state machine:

```
unavailable → available (triggered by reaching zone/level/clvl)
  → in_progress (accepted from quest NPC)
    → complete (kill target / fetch item / rescue NPC / use item on object)
      → reward_granted
```

States persist per-character per-difficulty (Normal/Nightmare/Hell tracked independently).

### Quest type taxonomy

| Type | Completion trigger | Example role |
|---|---|---|
| Kill target | Monster death (specific superunique or boss) | Most "free the town" type quests |
| Fetch item | Player picks up a quest item (non-tradable) | "Bring me X", often multi-part |
| Use item on target | Player activates quest item on object/NPC | "Use the artifact on the seal" |
| Rescue NPC | NPC in zone becomes interactable after clearing area | "Free the prisoners" |
| Unlock service | Opens a new vendor / hireling / waypoint | Per-act unlock gating |
| Boss gate | All previous quests done → boss portal activates | Act progression gate |

### Reward type map by act/slot

| Act | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 | Slot 6 |
|---|---|---|---|---|---|---|
| I | Skill point | Stat points | Resist boost (all) + free-ID sage rescue | Quest skill (imbue) | Hireling unlock | — |
| II | Skill point | Socket-add quest | Stat points | EXP reward | Skill point | Act pass |
| III | Skill point | Merc equip unlock | Stat points | Resist boost (fire) | Skill point | Act pass |
| IV | Skill point | Stat points | Skill point | — | — | — |
| V | Skill point | Personalize | Resist boost (all) | Stat points | Skill point | Act completion |

**Cumulative permanent rewards:** +12 skill points, +15 stat points, +60 life, +30 all-res,
+1 imbue, +1 socket-add, +1 personalize, +3 respec charges (used rather than permanent).

## NPC roles

### Vendors
Per act: armor/weapons/misc categories. Generate stock from vendor inventory generator params:
- Always-available stock: basic items (potions, scrolls, keys, identified cheap items)
- Rotating stock: RNG pool per seed per difficulty (restock on re-enter game)
- Repair service: repair all equipped. Canonical cost formula (defined in `economy.md`):
  `repairCost = ceil(buyPrice × missingDurability / maxDurability / 4)` per item; jewelry
  never degrades; ethereal items cannot be repaired
- Buyback: last N items sold (5-10) available at original price

### Gambling NPC
Always available in town. Stock = random list of unidentified base items for the current
level range; one ring and one amulet are always present. **Refresh button rerolls the
stock for free** (no gold cost, matching D2R); purchased entries do not sell out.

- ilvl = clvl − 5 + rng[10] (uniform in clvl−5 .. clvl+4, floor 5)
- Quality, checked in order at purchase time:
  **unique 1/2000 → set 1/1000 → rare 1/10 → else magic**
- Base tier upgrade rolled after quality (elite check only if exceptional succeeds):
  `P(exceptional) = 1% + (ilvl − qlvl_exceptionalBase) × 0.9%`
  `P(elite | exceptional) = 1% + (ilvl − qlvl_eliteBase) × 0.33%` (each clamped ≥ 0)
- MF does not apply to gambling. Charms, jewels, and throwables cannot be gambled;
  gambled items are never ethereal or socketed.
- Price: fixed per-base-type gamble cost column (jewelry at a premium; ring/amulet
  prices do not scale with clvl).[^gamble]

[^gamble]: Odds, ilvl window, and upgrade formulas verified in
`doc/research/r2-items-loot.md` §12 (diablowiki/PureDiablo gambling references); free
refresh + no-sell-out behavior verified against D2R-era guides (Fextralife/community).

### Identification
- Scroll of identification: 80 gold from any misc vendor; a tome holds 20 scrolls.
- The rescued sage NPC (act I rescue quest, slot 3) identifies all carried items for
  free, in every town, forever after. Characters that skipped the rescue for the
  difficulty pay 100 gold per item for the sage-equivalent service.

### Healer
Heal HP + remove cold/poison/freeze (cost = small gold). Resurrect hireling
(gold cost = `min(floor(hireLevel² / 2) × 15, 50000)`; formula under Hireling pool below).

### Stash
See `inventory-and-panels.md`. Same all phases.

### Quest NPCs
Per-act quest givers and progress-report NPCs. Quest state determines dialogue options.
Quest complete → reward window appears.

### Hireling pool
4 variants available per act (some acts restrict):

| Variant | Available in | Weapon | Aura (at hire difficulty) | Slots |
|---|---|---|---|---|
| Rogue-like (ranged) | Act I | Bow | Cold/Fire arrows | Helm, body, weapon |
| Guardian (defense) | Act II | Polearm, spear | Holy freeze / defiance / prayer / might equivalents | Helm, body, weapon |
| Caster (elemental) | Act III | Sword, shield | Fire / cold / lightning enchant equivalent | Helm, body, weapon, shield |
| Soldier (melee) | Act V | Sword, mace | Might / battle orders / bash | Helm, body, weapon |

Hire cost: `level^1.5 * 10`. Resurrect cost: `min(floor(hireLevel² / 2) × 15, 50000)`
gold (e.g. level 57 → 24,360; the 50k cap bites at level 82+).[^rez]

Hireling XP = `playerExpPerKill * 0.5` (hireling earns from its own kills too). Hirelings
cannot out-level the character. Hireling can equip gear on its listed slots; gear stats
visible in hireling panel. Ethereal gear equipped on a hireling never loses durability.

[^rez]: Resurrect formula verified in `doc/research/r4-world-progression.md` §6.2
(Maxroll mercenary reference). The hire-cost formula is original (D2's exact hire price
formula is not documented in primary sources).

### Hireling stat growth (per level)

Base stats and per-level growth per variant, from the hire-level baseline bracket.
Str/dex/damage/resist growth is stored in 8ths (value ÷ 8 per level, accumulated as
integers):

| Variant | Base lvl | Life (+/lvl) | Def (+/lvl) | AR (+/lvl) | Dmg (+8ths/lvl) | Str (+8ths/lvl) | Dex (+8ths/lvl) | All res (+8ths/lvl) |
|---|---|---|---|---|---|---|---|---|
| Rogue-like (act I) | 3 | 45 (+9) | 15 (+8) | 10 (+12) | 1-3 (+2) | 35 (+10) | 45 (+16) | 0 (+8) |
| Guardian (act II) | 9 | 120 (+15) | 45 (+11) | 20 (+12) | 7-14 (+4) | 57 (+14) | 40 (+12) | 18 (+8) |
| Caster (act III) | 15 | 160 (+9) | 80 (+5) | 15 (+12) | 1-7 (+4) | 49 (+10) | 40 (+8) | 25 (+7) |
| Soldier (act V) | 28 | 288 (+18) | 180 (+10) | 150 (+20) | 16-20 (+6) | 101 (+15) | 63 (+10) | 56 (+7) |

- The data table defines additional growth brackets at higher hireling levels (growth
  rates step up per bracket) and separate rows per hire difficulty.
- Hireling skill/aura levels step up on fixed thresholds:
  `skillLvl = baseSkillLvl + floor((hireLvl − bracketLvl) × perLvlRate / 32)`.
- Hireling resistances cap at 75, as for players.[^hgrowth]

[^hgrowth]: Growth values verified against the raw game data dump (`Hireling.txt`,
expansion rows, v1.13 — github.com/fabd/diablo2); skill-step formula per Phrozen Keep
`hireling.txt` documentation.

## NPC interaction flow

Click NPC → open dialogue panel (left half, forced). Options list. Select:
- "Trade" → open vendor split view (item-catalog + inventory)
- "Gamble" → open gamble split view
- "Hire" → open hireling pool picker
- "Heal me" → immediate heal transaction (gold cost, no panel)
- Quest dialogue → quest state updates → possible reward panel
