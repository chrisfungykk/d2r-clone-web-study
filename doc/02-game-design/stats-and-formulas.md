# Stats & Formulas

> Canonical integer arithmetic for every core character stat. Code follows these formulas
> precisely; golden tests assert them. All sources in `doc/research/r1-character-math.md`;
> contested values re-verified against live references (footnotes per section).

## Attributes

4 attributes, each per-class coefficient from `charStart` table:

| Attribute | Grants |
|---|---|
| Strength (Str) | +1% melee weapon damage (round down). Meets equip requirements |
| Dexterity (Dex) | +1% per 4 points to max damage (melee/ranged). +1 AR per 1 point (varies by class — use class BaseAR). +1 defense per 1 point. Block formula input |
| Vitality (Vit) | Class-dependent life per point and stamina per point (see table) |
| Energy (Ene) | Class-dependent mana per point (see table) |

**Class coefficients:**

| Class | Life/Vit | Mana/Ene | Start HP | Start MP | Life/Lvl | Mana/Lvl | Stam/Lvl | Stam/Vit |
|---|---|---|---|---|---|---|---|---|
| Warden | 3 | 1.5 | 55 | 10 | 1.5 | 1 | 1 | 1 |
| Shadow | 2 | 2 | 45 | 20 | 1 | 1.5 | 1 | 1 |
| Berserker | 4 | 1 | 65 | 5 | 2 | 0.75 | 1.25 | 1.25 |
| Skin-Shifter | 2.5 (3.5 Bear / 2 Raptor) | 1.5 | 50 | 15 | 1.5 | 1 | 1 | 1 |
| Reaper | 1.5 | 2.5 | 40 | 25 | 1 | 1.5 | 1 | 1 |
| Eternal | 3 | 1.5 | 55 | 15 | 1.5 | 1 | 1 | 1 |
| Arcanist | 1 | 3 | 35 | 35 | 0.75 | 2 | 1 | 1 |

Stamina per vit equals stamina per level for every class (the D2 rule). **This table is
canonical** for all per-class derived-stat coefficients; `04-content-bible/class-identities.md`
points here for numbers and carries identity/flavor only.

All coefficients implemented as integer arithmetic: `totalLife = (base + perLevel * (clvl-1) + perVit * vit) * (100 + lifePercentBonus) / 100`.

Life/manaPercentBonus from gear does NOT apply to +Vit/+Ene from gear — this is the canonical D2 rule.

## Attack Rating & Chance to Hit

```
cthBase = AR / (AR + defense)  -- fraction
cthLevel = alvl / (alvl + dlvl)  -- fraction
chanceToHit = floor(200_00 * cthBase * cthLevel)  -- in 1/100ths of a percent
clamp chanceToHit to [500, 9500]  -- 5% to 95%
```

All values are integers. Multiply before divide to preserve precision:
```
cth = (20000 * AR / (AR + defense)) * alvl / (alvl + dlvl)
```

**Notes:**
- AR includes +AR from items, +AR per dex (class-specific baseAR), +AR from skills
- defense = total defense (base + perDex + skill)
- alvl = attacker's level, dlvl = defender's level
- Running defender: defense = 0 (auto-hit from attackers, except vs missiles — confirmed by r1 research)
- -% Target Defense mod: applied to defense before formula (1/2 effective vs players/bosses)

## Blocking

```
totalBlock = min(
  shieldBlock * (dex - 15) / (clvl * 2),
  75  -- hard cap standing/walking/attacking
)
running: effectiveBlock = totalBlock / 3   -- effective cap 25%
minimum: 5%
```

Where `shieldBlock` is the block% of the equipped shield plus the class block factor and
+% Increased Chance of Blocking bonuses (0 if no shield or class can't block without one).

## Defense

```
defenseNoShield = 4 * dex + gearDefenseSuffix
totalDefense = (defenseNoShield * (100 + defensePercentBonuses) / 100 + shoutBonus)
```

DefensePercentBonuses come from skills and items. Running sets defense to 0 (auto-hit).

## Resistances

| Difficulty | Penalty | Cap | Max cap | Floor |
|---|---|---|---|---|
| Normal | 0% | 75% | 95% | -100% |
| Nightmare | -40% | 75% | 95% | -100% |
| Hell | -100% | 75% | 95% | -100% |

```
finalRes = baseRes + itemsRes - difficultyPenalty + skillResistAura
clamp finalRes to [-100, maxCap]
```

% DR cap: 50% on all characters. Flat MDR (magic damage reduction) is applied before
resistance in damage order (see `combat-resolution.md → Damage reduction`).

## Experience

### Level curve (1–99)

The canonical curve is the cumulative-XP-per-level table `experience` in `src/sim/data/`
(levels 2–99), imported verbatim from the verified D2 table. The curve has **no closed
form**: levels 2–12 are a hand-set ramp, after which the cumulative total grows by a
per-level ratio that decays smoothly from ×1.25 (levels ~11–25) down to ×1.09 (by the
mid-90s). The quadratic generator proposed in r1 §7.1 was checked against verified anchors
and rejected (it under-predicts the 98→99 delta by three orders of magnitude); the data
table is the source of truth.

Anchor values (the golden fixture asserts these rows):

| Level | Total XP | Level | Total XP |
|---|---|---|---|
| 2 | 500 | 60 | 117,772,849 |
| 5 | 7,875 | 70 | 285,041,630 |
| 11 | 72,144 | 80 | 681,027,665 |
| 21 | 671,891 | 90 | 1,618,470,619 |
| 31 | 5,493,363 | 95 | 2,492,671,933 |
| 41 | 19,235,252 | 98 | 3,229,426,756 |
| 50 | 47,116,709 | 99 | 3,520,485,254 |

The 98→99 step alone is 291,058,498 XP.

### Level-difference modifier

Applied per kill, before the 70+ penalty. Two regimes:

**clvl < 25:** a fixed symmetric gap table applies in both directions (data table
`xpGapUnder25`, in 1/256 units): gap 0–5 → 256 (100%), 6 → 225 (87.9%), sliding down to
9 → 38 (14.8%), ≥10 → 5 (2.0%).

**clvl ≥ 25:**

- Character above monster (clvl − mlvl):

| clvl − mlvl | ×/256 | % XP |
|:---:|:---:|:---:|
| 0–5 | 256 | 100% |
| 6 | 207 | 81% |
| 7 | 159 | 62% |
| 8 | 110 | 43% |
| 9 | 61 | 24% |
| 10+ | 13 | 5% (floor) |

- Monster above character (mlvl > clvl): `xp = xp * clvl / mlvl` (simple ratio; if
  xp > 1,048,576, divide by mlvl first, then multiply by clvl — integer-overflow order).

Monsters within ±5 levels always award 100% (before the 70+ penalty).

### High-level penalty (clvl 70+)

Second multiplicative penalty, in exact 1/1024 (ExpRatio) units:

| clvl | /1024 | clvl | /1024 | clvl | /1024 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1–69 | 1024 | 80 | 496 | 90 | 61 |
| 70 | 976 | 81 | 448 | 91 | 46 |
| 71 | 928 | 82 | 400 | 92 | 35 |
| 72 | 880 | 83 | 352 | 93 | 26 |
| 73 | 832 | 84 | 304 | 94 | 20 |
| 74 | 784 | 85 | 256 | 95 | 15 |
| 75 | 736 | 86 | 192 | 96 | 11 |
| 76 | 688 | 87 | 144 | 97 | 8 |
| 77 | 640 | 88 | 108 | 98 | 6 |
| 78 | 592 | 89 | 81 | 99 | 5 |
| 79 | 544 | | | | |

Integer application: `if xp < 0x200000: floor(xp * ratio / 1024) else floor(xp / 1024) * ratio`.

### Multiplayer & party XP

```
pot        = baseXP(mlvl) * tierMult * (playersInGame + 1) / 2   -- snapshot at spawn
partyBonus = floor(pot * 87 * (k - 1) / 256)                     -- k = partied members
                                                                 --   within ~53 yards (≈2 screens)
share_i    = floor((pot + partyBonus) * clvl_i / sum(clvl_j))    -- split ∝ level over the
                                                                 --   k in-range partied members
```

Each member's share is then scaled by that member's own level-difference modifier and 70+
penalty (prevents pure leeching across large level gaps). Unpartied kills award the full
pot to the killer with no split. A single kill's award is capped at 8,388,697 XP.

*Experience rules and anchors verified against maxroll.gg experience guide + the
Experience.txt mirror (github.com/fabd/diablo2), 2026-07.*

## Life & mana regeneration

**Life:** players have no passive life regen. The Replenish Life item stat restores:

```
lifeRegenPerTick   = replenishLife / 256          -- HP per frame (1 HP = 256 bits)
lifeRegenPerSecond = replenishLife * 25 / 256     -- ≈ replenishLife / 10.24
```

**Mana:** the pool refills naturally in a fixed 120 s regardless of size:

```
manaPerFrameBase   = floor(256 * maxMana / (25 * 120))   -- in 1/256 mana units
manaRegenPerSecond = 25 * floor(manaPerFrameBase * (100 + regenMana%) / 100) / 256
```

`+X% Regenerate Mana` (skills, gear) multiplies the base rate — +100% halves the fill
time to 60 s.

*Verified against maxroll.gg life-mana-mechanics, 2026-07.*

## Death penalties

| Difficulty | Gold loss | XP loss | Recoverable XP |
|---|---|---|---|
| Normal | `clvl%` of gold (cap 20%) | 0% | — |
| Nightmare | `clvl%` (cap 20%) | 5% | 75% |
| Hell | `clvl%` (cap 20%) | 10% | 75% |

Cannot de-level. Corpse recovery restores 75% of lost XP on click.

## Speed Math — 25 Hz Frame System

This is the most critical section. All speeds are frame counts at 25 ticks/second.

### Effective IAS (EIAS)

```
EIAS = floor(120 * IAS / (120 + IAS))
```

Where IAS = sum of item IAS sources (not skill IAS). Skill IAS adds directly to SIAS.

### Animation Frame Formula

```
animFrames = baseAnimFrames * 256 / floor(animSpeed * (100 + SIAS + EIAS - WSM) / 100)
totalFrames = ceil(animFrames / 256) - 1
```

Where:
- `baseAnimFrames`: base animation length in frames (from class×weapon `speeds` table)
- `animSpeed`: base speed of that animation (from `speeds` table, typically 256 for most)
- `SIAS`: skill-provided IAS (attack-speed auras, self-haste skills)
- `EIAS`: effective IAS from items (diminishing)
- `WSM`: weapon speed modifier (negative = faster)

### Sequence Penalty

Multi-strike chain skills use the sequence animation formula for every strike after the
first: a static **+30 is added to WSM** and the trailing `- 1` frame subtraction is
dropped. This effectively cancels the speed advantage of fast weapons inside chains.

## Breakpoints (FCR / FHR / FBR)

Every class maps to a D2 mechanical archetype (per the "D2 archetype" line of each class
in `04-content-bible/class-identities.md`); frame data follows the archetype. Effective
rate for all three stats uses the diminishing curve `EFxR = floor(120 * X / (120 + X))`.
Frame counts below are per-class constants in the `speeds` table; the tables list the
minimum stat % needed to reach each frame count.

**Archetype mapping (base frames at 0%):**

| Class | Archetype | Cast | Hit recovery | Block |
|---|---|:---:|:---:|:---:|
| Warden | paladin-archetype | 15 | 9 | 5 |
| Shadow | assassin-archetype | 16 | 9 | 5 |
| Berserker | barbarian-archetype | 13 | 9 | 7 |
| Skin-Shifter | druid-archetype (human form) | 18 | 13 | 11 |
| Reaper | necromancer-archetype | 15 | 13 | 11 |
| Eternal | paladin-archetype (secondary) | 15 | 9 | 5 |
| Arcanist | sorceress-archetype | 13 (19 for Galvanic beam anims) | 15 | 9 |

### FCR breakpoints (cast frames)

| Frames | Berserker, Arcanist | Warden, Eternal, Reaper | Shadow | Skin-Shifter (human) |
|:---:|:---:|:---:|:---:|:---:|
| 18 | — | — | — | 0 |
| 17 | — | — | — | 4 |
| 16 | — | — | 0 | 10 |
| 15 | — | 0 | 8 | 19 |
| 14 | — | 9 | 16 | 30 |
| 13 | 0 | 18 | 27 | 46 |
| 12 | 9 | 30 | 42 | 68 |
| 11 | 20 | 48 | 65 | 99 |
| 10 | 37 | 75 | 102 | 163 |
| 9 | 63 | 125 | 174 | — |
| 8 | 105 | — | — | — |
| 7 | 200 | — | — | — |

**Arcanist Galvanic beam animations** (19-frame cast group, used by the chain-surge /
beam skills): 0 → 19, 7 → 18, 15 → 17, 23 → 16, 35 → 15, 52 → 14, 78 → 13, 117 → 12,
194 → 11.

**Skin-Shifter forms** (16-frame cast base): Raptor — 7 → 15, 15 → 14, 26 → 13, 40 → 12,
63 → 11, 99 → 10, 163 → 9. Bear — 6 → 15, 14 → 14, 26 → 13, 40 → 12, 60 → 11, 95 → 10,
157 → 9.

### FHR breakpoints (hit-recovery frames)

Trigger: a single hit dealing more than `maxHP / 12` (8.33% of max HP) forces the
hit-recovery animation. FHR reduces its frame count:

| Frames | Warden, Shadow, Berserker, Eternal | Skin-Shifter (human), Reaper | Arcanist |
|:---:|:---:|:---:|:---:|
| 15 | — | — | 0 |
| 14 | — | — | 5 |
| 13 | — | 0 | 9 |
| 12 | — | 5 | 14 |
| 11 | — | 10 | 20 |
| 10 | — | 16 | 30 |
| 9 | 0 | 26 | 42 |
| 8 | 7 | 39 | 60 |
| 7 | 15 | 56 | 86 |
| 6 | 27 | 86 | 142 |
| 5 | 48 | 152 | 280 |
| 4 | 86 | 377 | — |
| 3 | 200 | — | — |

Shifted forms use the shapeshift animation formula (r1 §9.7); their per-form
hit-recovery rows live in the `speeds` table.

### FBR breakpoints (block frames)

| Frames | Warden, Shadow, Eternal | Berserker | Arcanist | Skin-Shifter (human), Reaper |
|:---:|:---:|:---:|:---:|:---:|
| 11 | — | — | — | 0 |
| 10 | — | — | — | 6 |
| 9 | — | — | 0 | 13 |
| 8 | — | — | 7 | 20 |
| 7 | — | 0 | 15 | 32 |
| 6 | — | 9 | 27 | 52 |
| 5 | 0 | 20 | 48 | 86 |
| 4 | 13 | 42 | 86 | 174 |
| 3 | 32 | 86 | 200 | 600 |
| 2 | 86 | 280 | — | — |
| 1 | 600 | — | — | — |

Skin-Shifter form block bases: Bear 12 frames, Raptor 9 frames; their threshold rows are
computed with the standard formula at build time and stored in `speeds`. A
paladin-archetype shield-buff skill state may override the block animation to a fixed 2
frames; if a Warden/Eternal skill adopts this pattern, the override lives in that skill's
data row.

*All breakpoint tables verified against d2runewizard.com/breakpoints, 2026-07.*

### Run/Walk Speed

Run/walk is measured in yards (continuous) — **no breakpoints**. Item FRW has diminishing
returns; skill FRW does not; slows (chill, slow-target mods) count as negative skill FRW.

```
effItemFRW = floor(150 * itemFRW / (150 + itemFRW))
frwTotal   = skillFRW + effItemFRW - armorSpeedPenalty
walkSpeed  = baseWalk * (100 + frwTotal) / 100     -- baseWalk = 4 y/s (0.16 y/tick)
runSpeed   = walkSpeed + 2                         -- baseRun = 6 y/s; floor 1 y/s
```

`armorSpeedPenalty`: 0 light / 5 medium / 10 heavy, from body armor and shield each
(penalties stack). Stamina depletes per tick while running (see Stamina).

**Worked example:** 65% item FRW, 15% skill FRW, medium body armor, light shield:
`effItemFRW = floor(150*65/215) = 45`; `frwTotal = 15 + 45 - 5 = 55`;
`walk = 4 * 155/100 = 6.2 y/s` (0.248 y/tick); `run = 8.2 y/s` (0.328 y/tick).

*Formula (base 4/6 y/s, run = walk + 2) verified against
diablo2.diablowiki.net/Faster_Run_Walk (Tommi Gustafsson's formulas), 2026-07.*

## Stamina

Depletion per tick while running:

```
staminaDrain = (classDrain * (100 + armorWeightPenalty) / 100) - staminaReduction
```

Where `classDrain` is 40 for most classes (Shadow = 30), `armorWeightPenalty` = 0 (light)
/ +5 (medium) / +10 (heavy) — from body armor only. `staminaReduction` = Slower Stamina
Drain items. Drain is per tick, not per distance (faster movement = less stamina per
yard); walking drains none; running in town is free; at 0 stamina the character is forced
to walk. Regen starts 3 ticks after stopping run; regen rate =
`maxStamina / (120 * (100 + staminaRegenBonus) / 100)` per tick.

## Formula golden tests

Every formula above has corresponding golden test entries in `tests/unit/golden/` that cover:
- Each rounding step (floor/ceil at each intermediate where D2 mechanics do)
- Edge cases (min/max AR, 5%/95% clamp, negative resist, level 99 XP penalty)
- All 7 classes × speed coefficient variants
- Breakpoint thresholds (every row of the FCR/FHR/FBR tables above)
- Experience anchor rows (level 2 through 99)
