# R1 — Character Math: D2/D2R Mechanics Reference

**Audience:** Engineers implementing a deterministic 25 Hz sim  
**Precision:** Integer math, frame-level accuracy, no floating point where D2 uses integer  
**Version:** Diablo II: Lord of Destruction / Diablo II: Resurrected (Patch 2.4+)

---

## Table of Contents

1. [Attributes](#1-attributes)
2. [Life, Mana, Stamina per Level and per Stat Point](#2-life-mana-stamina-per-level-and-per-stat-point)
3. [Attack Rating & Chance to Hit](#3-attack-rating--chance-to-hit)
4. [Blocking](#4-blocking)
5. [Defense & Chance to Be Hit](#5-defense--chance-to-be-hit)
6. [Resistances](#6-resistances)
7. [Experience](#7-experience)
8. [Death Penalties](#8-death-penalties)
9. [Speed Math](#9-speed-math)
10. [Stamina](#10-stamina)
11. [Uncertainties](#11-uncertainties)

---

## 1. Attributes

### 1.1 Starting Stats (Level 1)

| Class       | Str | Dex | Vit | Eng | Base Life | Base Mana | Base Stamina |
|-------------|:---:|:---:|:---:|:---:|:---------:|:---------:|:------------:|
| Amazon      | 20  | 25  | 20  | 15  | 50        | 15        | 84           |
| Assassin    | 20  | 20  | 20  | 25  | 50        | 25        | 95           |
| Barbarian   | 30  | 20  | 25  | 10  | 55        | 10        | 92           |
| Druid       | 15  | 20  | 25  | 20  | 55        | 20        | 84           |
| Necromancer | 15  | 25  | 15  | 25  | 45        | 25        | 79           |
| Paladin     | 25  | 20  | 25  | 15  | 55        | 15        | 89           |
| Sorceress   | 10  | 25  | 10  | 35  | 40        | 35        | 74           |

- **Stat points per level:** 5  
- **Skill points per level:** 1

### 1.2 Per-Point Bonuses

**Strength:**
- +1% melee damage per point (all classes, additive with other %ED)
- Two-handed hammers: `+1.10%` per point (i.e., `Str * 1.1 / 100` as damage multiplier)
- Bow/crossbow: `+0%` (Dexterity gives bow damage instead)

**Dexterity:**
- +5 Attack Rating per point
- Defense: `floor(Dex / 4)` added to base defense before % modifiers
- Bow/crossbow damage: `+Dex / 100` as % ED (additive with other %ED)
- Blocking: used in chance-to-block formula (see section 4)

**Vitality -> Life & Stamina:**

| Class       | Life / Vit | Stamina / Vit |
|-------------|:----------:|:-------------:|
| Amazon      | 3          | 1             |
| Assassin    | 3          | 1.25          |
| Barbarian   | 4          | 1             |
| Druid       | 2          | 1             |
| Necromancer | 2          | 1             |
| Paladin     | 3          | 1             |
| Sorceress   | 2          | 1             |

**Energy -> Mana:**

| Class       | Mana / Energy |
|-------------|:-------------:|
| Amazon      | 1.5           |
| Assassin    | 1.75          |
| Barbarian   | 1             |
| Druid       | 2             |
| Necromancer | 2             |
| Paladin     | 1.5           |
| Sorceress   | 2             |

### 1.3 Base Attack Rating Constant

```
Base AR = ((Dexterity - 7) * 5) + ClassConstant
```

| Class       | ClassConstant | Example: starting Dex = Base AR |
|-------------|:-------------:|:-------------------------------:|
| Amazon      | 5             | 95                              |
| Assassin    | 15            | 80                              |
| Barbarian   | 20            | 85                              |
| Druid       | 5             | 70                              |
| Necromancer | -10           | 80                              |
| Paladin     | 20            | 85                              |
| Sorceress   | -15           | 75                              |

Each point of Dexterity adds **+5 AR** on top of this formula.

---

## 2. Life, Mana, Stamina per Level and per Stat Point

### 2.1 Per-Level Bonuses

| Class       | Life / Level | Mana / Level | Stamina / Level |
|-------------|:------------:|:------------:|:---------------:|
| Amazon      | 2            | 1.5          | 1               |
| Assassin    | 2            | 1.5          | 1.25            |
| Barbarian   | 2            | 1            | 1               |
| Druid       | 1.5          | 2            | 1               |
| Necromancer | 1.5          | 2            | 1               |
| Paladin     | 2            | 1.5          | 1               |
| Sorceress   | 1            | 2            | 1               |

### 2.2 Total Life / Mana Formulas

```
TotalLife = floor( BaseLife
    + (Level - 1) * LifePerLevel
    + (HardVitPoints + QuestVitBonuses) * LifePerVit
    + SumOfItemLifeBonuses
    + (VitalityFromItems + AttrFromItems) * LifePerVit
)
```

Then apply `+x% Life` modifiers:

```
FinalLife = floor( TotalLife * (100 + SumPercentLifeModifiers) / 100 )
```

**IMPORTANT:** `+x% Life` (and `+x% Mana`) multipliers apply to:
- Base Life + level-gain Life + hard-Vit Life + item +Life flat bonuses
- They do **NOT** apply to Life from `+All Attributes`, `+Vitality`, or `Life Based on Character Level`

Same structure applies to Mana (substitute Energy for Vitality, Mana per Energy for Life per Vit).

### 2.3 Life Replenish Formula

```
LifeRegenPerSecond = ReplenishLife * 25 / 256
```

(Rough approximation: divide `ReplenishLife` by 10.)

### 2.4 Mana Regeneration Formula

```
MaxManaRatio = floor(256 * MaxMana / (25 * 120))  -- per-frame base
ManaRegenPerSecond = 25 * floor(MaxManaRatio * (100 + SumRegenMana%) / 100) / 256
```

Base regen cycle fills in 2 minutes regardless of pool size.

### 2.5 Potion Critical Strike (Double Heal Chance)

Vitality-based double-heal chance for healing potions:

```
if Vit <= 200:
    if Vit is even:  chance = (Vit - 2) / 4               (as %)
    if Vit is odd:   chance = (Vit - 1)^2 / (Vit * 4)     (as %)
if Vit > 200:
    chance = 100 * (Vit - 101) / Vit                       (as %)
```

Same formula structure applies for Energy with mana potions.

### 2.6 Potion Healing Rates (Over Time)

**Healing potions** (duration varies by class):

| Potion         | Amazon/Assn/Pal | Barb | Druid/Nec/Sorc | Duration  |
|----------------|:---------------:|:----:|:--------------:|:---------:|
| Minor Healing  | 45              | 60   | 30             | 7.68 s    |
| Light Healing  | 90              | 120  | 60             | 6.4 s     |
| Healing        | 150             | 200  | 100            | 6.84 s    |
| Greater Healing| 270             | 360  | 180            | 7.68 s    |
| Super Healing  | 480             | 640  | 320            | 10.24 s   |

**Mana potions** (fixed 5.12 s duration):

| Potion      | Amazon/Assn/Pal | Barb | Druid/Nec/Sorc |
|-------------|:---------------:|:----:|:--------------:|
| Minor Mana  | 30              | 20   | 40             |
| Light Mana  | 60              | 40   | 80             |
| Mana        | 120             | 80   | 160            |
| Greater Mana| 225             | 150  | 300            |
| Super Mana  | 375             | 250  | 500            |

**Rejuvenation potions:** Instant; Regular = 35% of total Life+Mana, Full = 100%.

**Life/Mana stolen per hit** — difficulty penalties:
- Nightmare: 1/2 effectiveness
- Hell: 1/3 effectiveness
- If calculated steal < 1%, rounds down to 0
- 0% Drain Effectiveness (most Undead) returns nothing

---

## 3. Attack Rating & Chance to Hit

### 3.1 Total Attack Rating

```
TotalAR = floor( (
    BaseARFromDexterity
    + SummedFlatARFromGear
    + ARFromWeaponOnCurrentWeapon
) * (100 + SummedPercentARBonus) / 100 )
```

Where:
- BaseARFromDexterity = `(Dexterity - 7) * 5 + ClassConstant`
- SummedPercentARBonus includes all `+x% Attack Rating` from skills, auras, gear, etc.
- Combat Shrine `+200%` applies last as an additional multiplier

### 3.2 Chance to Hit Formula

```
ChanceToHit = floor(200 * AR / (AR + Dr) * ALVL / (ALVL + TLVL))
-- as a percentage, then clamped
ChanceToHit% = clamp(ChanceToHit, 5, 95)
```

**Variables:**
- `AR` = Attacker's total Attack Rating
- `Dr` = Defender's total Defense
- `ALVL` = Attacker's level
- `TLVL` = Defender's level

**Clamps:**
- Minimum: **5%**
- Maximum: **95%**
- The level term alone sets a ceiling: even with infinite AR, `max = 200 * ALVL / (ALVL + TLVL)`

**Running exception:** If the target is **running**, the hit cannot fail — effective 100% chance to hit. Block/dodge/evade still apply normally.

**Same-level rule of thumb:** To reach 95% cap against a same-level opponent, need roughly `AR >= 20 * Defense`.

**Ignore Target's Defense:** Sets `Dr = 0`, so formula becomes `200 * ALVL / (ALVL + TLVL)` (capped 95%). Does NOT apply vs characters, mercs, champions, uniques, super uniques, or bosses.

### 3.3 -% Target Defense

- Applied after all +% Defense modifiers
- 1/2 effectiveness against: players, mercenaries, super uniques, bosses
- Full effectiveness against normal monsters

### 3.4 Skills Without Hit Check

These always hit (no AR vs Defense check): Guided Arrow, Lightning Bolt, Lightning Fury, Smite, charge attacks from certain monster types.

These apply skill effect even on "miss" (weapon damage doesn't apply): Exploding Arrow, Freezing Arrow, Immolation Arrow, Plague Javelin, Poison Javelin.

---

## 4. Blocking

### 4.1 Total Block Chance

```
TotalBlock% = floor( ShieldBlock% * (Dexterity - 15) / (CharacterLevel * 2) )
```

Or equivalently:

```
TotalBlock% = floor( ShieldBlock% * (Dexterity - 15) / (clvl * 2) )
```

**Where ShieldBlock% is:**
```
ShieldBlock% = BaseShieldBlock + ClassBlockFactor + SummedFlatBlockBonuses
```

### 4.2 Class Block Factor

| Class       | BlockFactor |
|-------------|:-----------:|
| Paladin     | 30%         |
| Amazon      | 25%         |
| Assassin    | 25%         |
| Barbarian   | 25%         |
| Druid       | 20%         |
| Necromancer | 20%         |
| Sorceress   | 20%         |

### 4.3 Caps and Modifiers

| Condition         | Max Block | Notes                         |
|-------------------|:---------:|-------------------------------|
| Standing/Walking  | 75%       | Global hard cap               |
| Running           | 25%       | = `floor(TotalBlock / 3)`, then cap 25% |
| Minimum           | 5%        | Floor                         |

**Dexterity needed for 75% block at level:**

```
DexRequired = ceil( (150 * CharacterLevel) / ShieldBlock% ) + 15
```

### 4.4 Blocking Speed (Faster Block Rate)

Blocking animation uses frame calculation similar to attack speed. Base block frames differ per class.

**Base blocking frames (0% FBR):**

| Class          | Base Frames | Notes                      |
|----------------|:-----------:|----------------------------|
| Amazon (1H)    | 17          | Swinging weapons           |
| Amazon (other) | 5           |                            |
| Assassin       | 5           |                            |
| Barbarian      | 7           |                            |
| Druid (human)  | 11          |                            |
| Druid (bear)   | 12          |                            |
| Druid (wolf)   | 9           |                            |
| Necromancer    | 11          |                            |
| Paladin        | 5           | Without Holy Shield        |
| Paladin (Holy) | 2           | With Holy Shield active    |
| Sorceress      | 9           |                            |

**FBR breakpoints** (thresholds to reduce frames, using `EFBR = 120 * FBR / (120 + FBR)`):

| Class         | Base | ->6 | ->5  | ->4  | ->3   | ->2   |
|---------------|:---:|:---:|:----:|:----:|:-----:|:-----:|
| Barbarian     | 7   | 9%  | 20%  | 42%  | 86%   | 280%  |
| Paladin (no HS)| 5  | -   | -    | 13%  | 32%   | 86%   |
| Paladin (HS)  | 2   | -   | -    | -    | -     | 0% ->1@86% |
| Sorceress     | 9   | -   | 48%? | 86%  | 200%  | -     |
| Assassin      | 5   | -   | -    | 13%  | 32%   | 86%   |

(Full FBR tables are large — see sources.)

---

## 5. Defense & Chance to Be Hit

### 5.1 Total Defense

```
BaseDefense = floor(Dexterity / 4) + SumFlatDefenseFromItems + SumFlatDefenseFromCharms
-- then apply skill-based +x% enhanced defense:
TotalDefense = floor( BaseDefense * (100 + SumPercentDefenseMods) / 100 )
-- then apply defense-vs-melee/missile (flat additions after %):
TotalDefenseWithType = TotalDefense + DefenseVsMelee  -- or + DefenseVsMissile
```

Note: `Defense vs. Missile` and `Defense vs. Melee` add after all % modifiers.

### 5.2 Defense While Running

When **running**, the attacker's chance-to-hit formula is **completely bypassed** — all attacks auto-hit (subject only to block/dodge/evade). Defense is effectively ignored; this is distinct from "defense = 0" since a 0-defense character can still be missed by very low-level monsters via the level term in the hit formula, while a running character cannot be missed at all.

While **standing, walking, attacking, or casting**, full defense applies.

### 5.3 -% Target Defense

```
FinalDefense = floor( TotalDefense * (100 - TargetDefenseReductionPercent) / 100 )
```

- 1/2 effectiveness against players, mercs, super uniques, bosses
- Skills: Cloak of Shadows (`min(3*sLVL+12, 95)`%), Battle Cry (`28+2*sLVL`%), Conviction (`min(40+f(110*sLVL/(sLVL+6)), 100)`%)
- Monster defense curses: -50% to -95% depending on monster type/difficulty

### 5.4 Berserk Defense Zero

Barbarian's Berserk sets Defense to **0** after all other modifiers but before Defense-vs-Type additions. Lasts ~1 second at max level.

---

## 6. Resistances

### 6.1 Difficulty Penalties

| Difficulty | Base Resistance | Notes |
|------------|:--------------:|-------|
| Normal     | 0%             |       |
| Nightmare  | -40%           |       |
| Hell       | -100%          | Was -50% in original D2 before LoD |

Permanent bonus: Malah's quest in Act V grants +30 All Resistance (additive).

```
EffectiveBaseInHell = 0 (starting) - 100 (hell) + 30 (malah quest) = -70%
```

### 6.2 Total Resistance Formula

```
TotalRes = BaseRes + GearBonuses + SkillBonuses + QuestBonuses + TempEffects + DifficultyPenalty
```

EffectiveRes is then clamped:

```
EffectiveRes = clamp(TotalRes, -100, MaxCap)
```

| Property                | Value   |
|-------------------------|:-------:|
| Default cap (all resists) | 75%   |
| Hard maximum cap         | 95%     |
| Absolute floor           | -100%   |
| Physical Resistance cap  | 50%     |
| Magic Resistance cap     | 75% (default), min 0% — unaffected by difficulty |

### 6.3 Elemental Damage Calculation

```
FinalDamage = floor( BaseDamage * (100 - EffectiveRes) / 100 )
```

**Full damage order:**
1. Flat DR/MDR (Damage Reduced By / Magic Damage Reduced By) — subtract from incoming damage first
2. Resistance % — applied after flat reduction
3. % Absorb — capped at 40%; restores HP equal to absorbed amount before damage
4. +X Absorb — no cap; subtracts from damage and heals for same amount

### 6.4 -% Enemy Resistance

- Increases damage substantially against resistant targets (e.g., -10% enemy fire resistance vs a 90% resistant target doubles damage)
- Pierces immunity when Cold Mastery or similar are involved; Conviction and Lower Resist break immunities at 1/5 effectiveness for immune monsters

### 6.5 Cold Resistance and Duration

Cold Resistance also reduces chill / freeze duration proportionally:

```
ChillDuration = BaseChillDuration * (100 - ColdRes%) / 100
```

---

## 7. Experience

### 7.1 XP Required to Level

```
XPToNextLevel(L) = floor( (L + 1) * (5 * (L + 1) + 505) - 500 )
-- where L = current level
```

Simplified formula, level N to N+1:

```
XP_for_next(N) = 5*(N+1)^2 + 505*(N+1) - 500
```

**Cumulative total, level 1 to 99: 3,520,485,254 XP**

### 7.2 Level Difference Penalty (clvl >= 25)

Applied first, before the high-level penalty.

**When clvl >= mlvl (character same or higher than monster):**

| clvl - mlvl | XP % |
|:-----------:|:----:|
| 0 to 5      | 100% |
| 6           | 81%  |
| 7           | 62%  |
| 8           | 43%  |
| 9           | 24%  |
| 10+         | 5%   |

**When clvl < mlvl (monster higher than character):**
- If clvl >= 25: `Penalty = clvl / mlvl` (no penalty, simple ratio)
- If clvl < 25: uses a separate fixed table (2% to 100% depending on difference magnitude)

### 7.3 ExpRatio Penalty (Level 70+)

Starting at level 70, a second multiplicative penalty applies. Values from `Experience.txt` in units of 1/1024:

| Level | ExpRatio | % of XP |     | Level | ExpRatio | % of XP |
|:-----:|:--------:|:-------:|:---:|:-----:|:--------:|:-------:|
| 1-69  | 1024     | 100.00% |     | 85    | 256      | 25.00%  |
| 70    | 976      | 95.31%  |     | 86    | 192      | 18.75%  |
| 71    | 928      | 90.63%  |     | 87    | 144      | 14.06%  |
| 72    | 880      | 85.94%  |     | 88    | 108      | 10.55%  |
| 73    | 832      | 81.25%  |     | 89    | 81       | 7.91%   |
| 74    | 784      | 76.56%  |     | 90    | 61       | 5.96%   |
| 75    | 736      | 71.88%  |     | 91    | 46       | 4.49%   |
| 76    | 688      | 67.19%  |     | 92    | 35       | 3.42%   |
| 77    | 640      | 62.50%  |     | 93    | 26       | 2.54%   |
| 78    | 592      | 57.81%  |     | 94    | 20       | 1.95%   |
| 79    | 544      | 53.13%  |     | 95    | 15       | 1.46%   |
| 80    | 496      | 48.44%  |     | 96    | 11       | 1.07%   |
| 81    | 448      | 43.75%  |     | 97    | 8        | 0.78%   |
| 82    | 400      | 39.06%  |     | 98    | 6        | 0.59%   |
| 83    | 352      | 34.38%  |     | 99    | 5        | 0.49%   |
| 84    | 304      | 29.69%  |     |       |          |         |

**Application (integer math):**

```
if exp < 0x200000:
    expAfterRatio = floor(expAfterLevelDiff * ExpRatio / 1024)
else:
    expAfterRatio = floor(expAfterLevelDiff / 1024) * ExpRatio
```

### 7.4 Multiplayer & Party XP

**Player count bonus (monster XP):**

| Players | Solo XP | Party XP | Monster HP multiplier |
|:-------:|:-------:|:--------:|:---------------------:|
| 1       | 100%    | —        | 100%                  |
| 2       | 150%    | 175%     | 200%                  |
| 3       | 200%    | 250%     | 300%                  |
| 4       | 250%    | 325%     | 400%                  |
| 5       | 300%    | 375%     | 500%                  |
| 6       | 350%    | 400%     | 600%                  |
| 7       | 400%    | 425%     | 700%                  |
| 8       | 450%    | 450%     | 800%                  |

**Party split formula:**
```
PartyMemberXP = floor(MonsterXP * PartyBonus / 100 * clvl / SumPartyLevels)
```

Where `PartyBonus` = `(n + 1) / 2 * 100` for party size n (see table above party column).

### 7.5 Key XP Rules

- **Ancients quest reward** (40M XP in Hell) is **not** subject to ExpRatio penalty — save for high levels
- **Terror Zones** (D2R) scale monsters up to clvl+2 (or clvl+5 depending on zone), making them viable past level 95
- Baal (Hell) is always level 99
- Monsters within ±5 levels give 100% of base XP before ExpRatio

---

## 8. Death Penalties

### 8.1 Gold Loss

```
GoldLost = floor(TotalCarriedGold * CharacterLevel / 100)
-- capped at 20% of total gold
-- If carried gold insufficient, remainder deducted from stash
-- Single player: no stash gold lost, first 500 gold per level exempt
```

### 8.2 Experience Loss

| Difficulty | XP Lost                                     | Corpse Recovery |
|------------|---------------------------------------------|:---------------:|
| Normal     | None                                        | N/A             |
| Nightmare  | 5% of XP needed for next level              | 75% recovered   |
| Hell       | 10% of XP needed for next level             | 75% recovered   |

- XP loss is based on **XP remaining to next level**, not total XP
- **Cannot de-level** — XP loss cannot drop you below the start of current level
- Corpse recovery on-site restores 75% of lost XP (net loss: 25% of the initial loss)
- Save & Exit without recovering corpse forfeits the 75% recovery — loss is permanent

### 8.3 Corpse Mechanics

- Up to 16 corpses can exist simultaneously
- Only the corpse with the highest gold value in items is saved on game exit
- If 16 corpses exist and another death occurs, items fall to ground (anyone can loot)
- When re-equipping from corpse, stat requirements may cause failure — manual re-equip may be needed

---

## 9. Speed Math

### 9.1 Frame System Foundation

D2 runs at **25 frames per second**. One tick = one frame (40 ms). All animation speeds are measured in frames (integers). The engine cannot display partial frames, so **breakpoints** occur at thresholds where the computed frame count drops by exactly 1.

### 9.2 Core Animation Duration Formula

```
AnimDuration = ceil( floor(AnimLength * 256) / floor(AnimSpeed * (AnimRate + SIAS + EIAS - WSM) / 100) ) - 1
```

In integer-friendly notation:

```
speedFactor = AnimRate + SIAS + EIAS - WSM
num = AnimLength * 256
den = floor(AnimSpeed * speedFactor / 100)
animFrames = ceil(num / den) - 1
```

**Variables:**

| Variable   | Type      | Description                                              |
|------------|-----------|----------------------------------------------------------|
| AnimLength | constant  | Base frame count of the animation (varies per action)    |
| AnimSpeed  | static    | Always **256** (used to reduce rounding error)           |
| AnimRate   | static    | Always **100** (100%) in standard formula                |
| SIAS       | variable  | Skill-based IAS (Fanaticism, BoS, Werewolf, etc.), can be negative from slows |
| EIAS       | calculated| Effective IAS from items via diminishing returns         |
| WSM        | weapon    | Weapon Speed Modifier (negative = faster)                |

### 9.3 EIAS Formula (Item IAS Diminishing Returns)

```
EIAS = floor(120 * IASItem / (120 + IASItem))
```

Where `IASItem` = sum of all IAS from items (weapon + gloves + armor etc.). Only the **primary weapon's IAS** counts when dual-wielding.

**Sample EIAS values:**

| IASItem | EIAS |   | IASItem | EIAS |
|:-------:|:----:|---|:-------:|:----:|
| 10      | 9    |   | 80      | 48   |
| 20      | 17   |   | 100     | 54   |
| 40      | 30   |   | 120     | 60   |
| 60      | 40   |   | 200     | 75   |

**EIAS cap:** 75 (classic D2); D2R removed the cap.

### 9.4 WSM Table (Weapon Speed Modifier)

Negative = faster. Range: +20 to -60.

| Weapon Class  | WSM Values (base speeds)          |
|---------------|-----------------------------------|
| Axe (1H)      | -10, 0, 10                        |
| Axe (2H)      | -15, -10, 0, 10                   |
| Bow           | -10, 0, 5, 10                     |
| Amazon Bow    | -10, 0, 10                        |
| Claw          | -30, -20, -10, 0, 10              |
| Club          | -10, 0                            |
| Crossbow      | -60, -40, -10, 0, 10              |
| Dagger        | -20, -10, 0                       |
| Hammer (1H)   | 0, 20                             |
| Hammer (2H)   | 10, 20                            |
| Javelin       | -10, 0, 10, 20                    |
| Mace (1H)     | -10, 0, 10                        |
| Orb           | -10, 0, 10                        |
| Polearm       | -10, 0, 10                        |
| Scepter       | -10, 0, 10                        |
| Spear         | -20, -10, 0, 20                   |
| Amazon Spear  | 0, 10, 20                         |
| Staff         | -10, 0, 10, 20                    |
| Sword (1H)    | -30, -20, -10, 0, 10, 20          |
| Sword (2H)    | -15, -10, -5, 0, 5, 10            |
| Throwing Axe  | -10, 10                           |
| Throwing Knife| -20, 0                            |
| Wand          | -20, 0, 10                        |

### 9.5 Dual-Wielding Formulas

**Primary weapon** = left slot in inventory screen.

```
if primary is left:
    EffectiveWSM = (LeftWSM + RightWSM) / 2
if primary is right:
    EffectiveWSM = (LeftWSM + RightWSM) / 2 - LeftWSM + RightWSM
```

**Double Swing (Barb):**
```
FPA = ceil(256 * 17 / floor(Vinc * 256 / 100)) / 2
Vinc = 120 + (WSM1 + WSM2) / 2 + SIAS + EIAS
```

**Double Throw (Barb):**
```
FPA = ceil(256 * 12 / floor(Vinc * 256 / 100)) / 2
Vinc = 70 + (WSM1 + WSM2) / 2 + SIAS + EIAS
```

Vinc is clamped between 15 and 175.

### 9.6 Sequence Animation Formula

Used by Jab, Charge, Impale, elemental claw attacks, etc.:

```
AnimDuration = ceil(floor(AnimLength * 256) / floor(AnimSpeed * (AnimRate + SIAS + EIAS - (WSM + 30)) / 100))
```

Note: No `-1` at end, and a static `+30` penalty is added to WSM. Charge and Leap Attack do not use WSM.

### 9.7 Druid Shapeshifted Formula

Different AnimSpeed derivation:

```
Delay = floor(256 * FramesChar / ((100 + WIAS - WSM) * CharSpeed / 100))
AnimSpeed = floor(256 * FramesNeutral / Delay)
```

- Werewolf: FramesNeutral = 13, base frames = 9 (blocking) or per-attack
- Werebear: FramesNeutral = 12, base frames = 12 (blocking)
- FramesChar = 15 (unshifted Druid)
- CharSpeed = 256 (unshifted Druid)
- **WIAS is added directly to WSM** without diminishing returns
- D2R Patch 2.4: uses min(standard formula result, shapeshifted formula result)

### 9.8 Faster Cast Rate (FCR)

**EFCR formula (same diminishing curve as IAS):**

```
EFCR = floor(120 * FCR / (120 + FCR))
```

**Standard FCR breakpoints (classic animation group):**

| Frames | Sorc   | Pal/Nec | Barb    | Amazon  | Druid   | Assn    |
|:------:|:------:|:-------:|:-------:|:-------:|:-------:|:-------:|
| 15     | —      | 0       | —       | —       | —       | —       |
| 14     | —      | 9       | —       | —       | —       | —       |
| 13     | 0      | 18      | —       | —       | —       | —       |
| 12     | 9      | 30      | —       | —       | —       | —       |
| 11     | 20     | 48      | —       | —       | —       | —       |
| 10     | 37     | 75      | —       | —       | —       | —       |
| 9      | 63     | 125     | —       | —       | —       | —       |
| 8      | 105    | —       | —       | —       | —       | —       |
| 7      | 200    | —       | —       | —       | —       | —       |

**Sorc Lightning / Chain Lightning:**

| Frames | FCR  |
|:------:|:----:|
| 19     | 0    |
| 18     | 7    |
| 17     | 15   |
| 16     | 23   |
| 15     | 35   |
| 14     | 52   |
| 13     | 78   |
| 12     | 117  |
| 11     | 194  |

### 9.9 Faster Hit Recovery (FHR)

**Trigger condition:** A hit dealing more than 1/12 of max HP stuns the character.

**EFHR formula:**
```
EFHR = floor(120 * FHR / (120 + FHR))
```

**FHR breakpoints (classic classes):**

| Frames | Pal/Barb/Assn | Sorc    | Necro/Dru(h) | Amazon  |
|:------:|:-------------:|:-------:|:------------:|:-------:|
| 15     | —             | 0       | —            | —       |
| 14     | —             | 5       | —            | —       |
| 13     | —             | 9       | 0            | —       |
| 12     | —             | 14      | 5            | —       |
| 11     | —             | 20      | 10           | 6       |
| 10     | —             | 30      | 16           | 13      |
| 9      | 7             | 42      | 26           | 20      |
| 8      | 15            | 60      | 39           | 32      |
| 7      | 27            | 86      | 56           | 52      |
| 6      | 48            | 142     | 86           | 86      |
| 5      | 86            | 280     | 152          | 174     |
| 4      | 200           | —       | 377          | 600     |
| 3      | —             | —       | —            | —       |

Barbarian and Assassin share the same FHR table as Paladin. Druid human and Necromancer share the same table.

### 9.10 Run/Walk Speed

**Base speeds:**

| Mode        | Base Speed (y/s) |
|-------------|:----------------:|
| Walk        | 4                |
| Run         | 6                |
| Charge      | 9                |

**Effective FRW (item-based diminishing):**

```
EffItemFRW = floor(150 * ItemFRW / (150 + ItemFRW))
```

**Walk speed:**
```
WalkSpeed = BaseWalkSpeed + BaseWalkSpeed * (SkillFRW + EffItemFRW + ArmorPenalty) / 100
```

**Run speed:**
```
RunSpeed = WalkSpeed + 2
-- equivalently:
RunSpeed = BaseRunSpeed + BaseWalkSpeed * (SkillFRW + EffItemFRW + ArmorPenalty) / 100
```

Minimum cap for both: 1 yard/s.

**Armor speed penalties:**

| Armor Type | Walk Penalty | Run Penalty | Stamina Drain |
|------------|:-----------:|:-----------:|:-------------:|
| Light      | 0           | 0           | 0%            |
| Medium     | 0.20 y/s    | 0.45 y/s    | +5%           |
| Heavy      | 0.40 y/s    | 0.90 y/s    | +10%          |

Armor + shield penalties stack.

### 9.11 Faster Block Rate (FBR) — Quick Reference

See section 4.4 for base frames. FBR frames follow the same structure as FHR/FCR.

---

## 10. Stamina

### 10.1 Stamina Drain

```
StaminaLossPerSecond = floor(25 * RunDrain * (100 + ArmorDrainPenalty) * (100 - SlowerDrain%) / 100 / 256)
```

- `RunDrain`: 30 for Assassin, **40 for all other classes**
- `ArmorDrainPenalty`: 0 (light), +5 (medium), +10 (heavy) — from body armor only
- `SlowerDrain%`: from "Slower Stamina Drain" items

### 10.2 Stamina Drain Notes

- Stamina drains per **second**, not per distance — faster movement = less stamina per yard
- Walking drains no stamina
- Running in town costs no stamina
- When stamina reaches 0: auto-switch to walk, stamina stops regenerating until you stop moving briefly
- Standing still regenerates faster than slow-walking

### 10.3 Stamina Regeneration

Exact per-frame regen formula is not well-documented in public sources. Regenerates while walking or standing; rate scales with max stamina pool.

---

## 11. Uncertainties

| Topic | Issue |
|-------|-------|
| **Potion critical strike formula** | The Vitality/Energy double-heal chance formula is widely cited but not confirmed against decompiled D2Game.dll. Edge cases at low VIT (<2) unspecified. |
| **Stamina regeneration exact formula** | Multiple sources describe it as "proportional to max stamina" but no exact per-frame integer formula found. |
| **Walk/Run base speeds** | Conflicting values: some sources say 4/6 y/s, others 6/9 y/s. The diminishing returns formula structure is the same regardless. Need to determine which yields correct in-game behavior. |
| **Defense while running** | Consensus says hit check is bypassed (auto-hit), but the exact mechanism (defense set to 0 vs. skip to-hit roll vs. always-hit flag) is debated in old forum posts. The practical effect is identical for implementation. |
| **Dual-wield WSM averaging** | The "right weapon primary" formula `(L+R)/2 - L + R` is from one source and may simplify to `(R - L)/2 + R`. Confirm with in-game testing. |
| **FBR frames for some class/weapon combos** | Amazon 1-hand swinging has 17 base frames; "other" has 5. The exact weapon classification boundaries need verification. |
| **Druid shapeshift attack AnimLength** | Per-skill AnimLength values (Fury vs. normal attack vs. Maul) differ but exact constants are not fully documented in accessible sources. |
| **ExpRatio at level 99** | Listed as 5 (0.49%). If this applies after other penalties, level 99 characters can gain XP from level 94+ monsters at extremely reduced rates. But some sources say level 99 can gain 0 XP from non-TZ content. Need exact D2R behavior. |
| **Multiplayer XP party bonus** | The "+35% per party member" is a rough figure. The exact formula may be `floor(monsterXP * (n + 1) / 2)` for solo-per-area (not party) and a different formula for party bonus. |
| **FHR stun threshold** | "More than 1/12 of max HP" is the trigger. If damage = exactly 1/12, does it stun? Sources disagree on strict inequality vs. >=. |
| **Mana regen base cycle** | The "2 minutes to fill from empty" is widely stated but the exact per-frame formula uses `120` as a divisor: `256 * MaxMana / (25 * 120)`. This gives `MaxMana / 11.71875` per second. Need to confirm this yields exactly 120 seconds for a full fill. |
| **Potion duration variability** | Healing potion duration differs by class (Barbarian gets longer duration). Mana potion duration is fixed. Need to verify exact frame counts per tick. |

---

## Sources

### Primary Sources

1. Maxroll.gg D2R Guides: [Hit Chance Mechanics](https://maxroll.gg/d2/resources/hit-chance-mechanics), [Attack Speed](https://maxroll.gg/d2/resources/attack-speed), [Damage Reductions](https://maxroll.gg/d2/resources/damage-reductions), [Life & Mana Mechanics](https://maxroll.gg/d2/resources/life-mana-mechanics)
2. PureDiablo Wiki: [Breakpoints](https://www.purediablo.com/d2wiki/index.php?title=Breakpoints), [Faster Run Walk](https://www.purediablo.com/d2wiki/index.php?title=Faster_Run_Walk), [Weapon Speed](https://www.purediablo.com/d2wiki/index.php?title=Weapon_Speed), [Blocking](https://purediablo.com/d2wiki/Blocking), [Experience](https://www.purediablo.com/d2wiki/index.php?title=Experience)
3. Diablo Fandom Wiki: [Faster Cast Rate](https://diablo.fandom.com/wiki/Faster_Cast_Rate), [Faster Hit Recovery](https://diablo.fandom.com/wiki/Faster_Hit_Recovery), [Faster Block Rate](https://diablo.fandom.com/wiki/Faster_Block_Rate), [Movement Speed](https://diablo.fandom.com/wiki/Movement_Speed), [Stamina](https://diablo.fandom.com/wiki/Stamina)
4. DiabloWiki.net: [Diablo Characters](https://diablo2.diablowiki.net/Diablo_Characters), [Blocking](https://diablo2.diablowiki.net/Blocking), [Resistance](https://diablo2.diablowiki.net/Resistance), [Armor](https://diablo2.diablowiki.net/Armor)
5. D2Runewizard: [Breakpoint Tables](https://d2runewizard.com/breakpoints)
6. The Amazon Basin (archived): Various class attack speed and stat pages
7. Wowhead: [FCR Guide](https://www.wowhead.com/diablo-2/ko/guide/fcr-faster-cast-rate-best-gear), [IAS Guide](https://www.wowhead.com/diablo-2/tw/guide/ias-increased-attack-speed-best-gear)
8. D2Mods.info: [ExpRatio / Experience forum thread](https://d2mods.info/forum/viewtopic.php?t=16356)
9. Blizzard D2R Forums: Various mechanical discussions
10. Gamer Guides: [Stats & Attributes](https://www.gamerguides.com/diablo-ii-resurrected/guide/characters/builds/stat-points), [Experience](https://www.gamerguides.com/diablo-ii-resurrected/guide/characters/builds)

### Key Community Researchers

- Tommi Gustafsson — original D2 speed formula research
- The Amazon Basin community — comprehensive class-specific attack speed tables
- Warren1001 / TitanSeal — IAS/breakpoint calculator
- d2mods.info community — Experience.txt reverse engineering

---

*Document compiled 2026-07-07. Cross-referenced against at least 2 sources per formula where available. Discrepancies noted in Uncertainties section.*
