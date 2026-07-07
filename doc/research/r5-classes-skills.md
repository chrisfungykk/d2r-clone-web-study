# D2/D2R Class & Skill Systems -- Engineering Reference

> **Audience:** Engineers + designers authoring 7 original classes with mechanically identical systems.
> **Policy:** Systems, math, and structure are factual. Tree organization and mechanical roles are described;
> original class/skill names are authored against these specs. A handful of well-known example skill names
> are provided per class for grounding only -- never as a template for naming.
> **Game version reference:** D2 Lord of Destruction v1.14+ / D2R v2.7+ (Patch 2.4-2.7 changes noted).

---

## Table of Contents

1. [The 7 Class Archetypes](#1-the-7-class-archetypes)
2. [Skill Mechanics Taxonomy](#2-skill-mechanics-taxonomy)
3. [Scaling Math](#3-scaling-math)
4. [Synergy System](#4-synergy-system)
5. [+Skills Mechanics](#5-skills-mechanics)
6. [Skill Point Economy](#6-skill-point-economy)
7. [Casting / Attack Interaction](#7-casting--attack-interaction)
8. [Charges / Procs on Items](#8-charges--procs-on-items)
9. [Energy Shield / Defensive-Conversion Mechanics](#9-energy-shield--defensive-conversion-mechanics)
10. [Class-Specific Item Interactions](#10-class-specific-item-interactions)
11. [Uncertainties & Conflicts](#11-uncertainties--conflicts)
12. [Sources](#12-sources)

---

## 1. The 7 Class Archetypes

### 1.1 Structural Constant

Every class has exactly **3 skill trees**, each containing **10 skills** (30 skills per class). Skills unlock in **6 tiers** by character level:

| Tier | Unlock Level | Slots in Tier |
|------|-------------|---------------|
| 1    | 1           | 1-2           |
| 2    | 6           | 2-3           |
| 3    | 12          | 1-2           |
| 4    | 18          | 1-2           |
| 5    | 24          | 2-3           |
| 6    | 30          | 1-2           |

**Prereq edge pattern:** Skills are connected by directed prerequisite arrows. Putting 1 point in a prerequisite unlocks the downstream skills. Some high-tier skills require multiple prerequisites (e.g., Valkyrie needed 6 earlier points). The graph is a directed acyclic graph (DAG) -- no loops, no skill unlocks itself.

### 1.2 Amazon (Bow / Javelin & Spear / Passive & Magic)

**Three trees:**
- **Bow & Crossbow Skills** -- 10 skills ranging from single-target arrows (Magic Arrow) to multi-target (Multiple Shot, Strafe), elemental conversions (Fire/Cold/Freezing Arrow), and guided projectiles. Mechanical role: ranged physical+elemental hybrid DPS.
- **Javelin & Spear Skills** -- 10 skills: melee thrusts (Jab, Impale), elemental javelin throws (Poison/Plague/Lightning Fury), and hybrid charge attacks (Charged Strike, Lightning Strike). All skills require javelin or spear equipped. Mechanical role: melee-range-to-medium hybrid physical+elemental DPS.
- **Passive & Magic Skills** -- 10 skills: critical strike chance (Critical Strike), defense passives (Dodge/Avoid/Evade), attack rating (Penetrate), pierce chance, decoy summon, summon valkyrie, and utility (Inner Sight, Slow Missiles). Mechanical role: passive survivability + utility, no active damage skills.

**Tree structure graph (common pattern, minor per-tree variation):**
- Tier 1: 2 skills, Tier 2: 2, Tier 3: 2, Tier 4: 1, Tier 5: 2, Tier 6: 1
- Prereqs: linear chains within each tree (e.g., Magic Arrow -> Cold Arrow -> Ice Arrow -> Freezing Arrow)
- Valkyrie prereqs: 1 point in all passives (Dodge/Avoid/Evade/Inner Sight/Slow Missiles/Penetrate)

**Core identity:** Weapon-flexible hybrid -- can transition from bow to javelin+shield. Passive survivability framework makes her tanky. Elemental arrows give coverage vs immunities.

### 1.3 Assassin (Martial Arts / Shadow Disciplines / Traps)

**Three trees:**
- **Martial Arts** -- 10 skills: charge-up skills (Tiger Strike, Fists of Fire, Cobra Strike, Claws of Thunder, Blades of Ice, Phoenix Strike) + finishing moves (Dragon Talon/Claw/Tail/Flight). Mechanical role: builder-spender combo system, accumulate charges through attacks then discharge via finisher.
- **Shadow Disciplines** -- 10 skills: passive claw mastery, weapon block, burst of speed, fade (resists+DR), cloaking, mind blast (stun), shadow clone summons (Shadow Warrior/Master), venom (poison weapon coating), psychic hammer. Mechanical role: utility + survivability + summon.
- **Traps** -- 10 skills: fire blast (direct throw), shock web (direct throw), sentry-type traps (Charged Bolt Sentry, Wake of Fire, Lightning Sentry, Wake of Inferno, Death Sentry) which are minion-entity-based, plus blade skills (Blade Sentinel, Blade Fury, Blade Shield). Mechanical role: area denial via placed traps; traps are minion entities and do NOT benefit from +% elemental damage or -% enemy resistance from gear (except Conviction via merc).

**Tree structure graph:**
- Martial Arts: linear chain (Tiger Strike -> Fists of Fire -> Cobra Strike -> Claws of Thunder -> Blades of Ice -> Phoenix Strike) with finishers at tier gaps
- Shadow: tree-like, multiple entry points (Claw Mastery + Psychic Hammer at tier 1)
- Traps: linear chain from Fire Blast -> Shock Web -> Charged Bolt Sentry -> Lightning Sentry -> Death Sentry, with Wake of Fire/Wake of Inferno as parallel branch

**Core identity:** Hybrid physical+caster. Charge-up + finisher system unique in D2. Traps provide persistent AoE. Shadow utilities make her highly survivable.

### 1.4 Barbarian (Combat Skills / Masteries / Warcries)

**Three trees:**
- **Combat Skills** -- 10 skills: melee attacks (Bash, Double Swing, Stun, Concentrate, Frenzy, Whirlwind, Berserk), leaping attacks (Leap, Leap Attack), and throwing (Double Throw). Mechanical role: primary melee damage engine.
- **Masteries** -- 10 skills: weapon-specific masteries (Sword/Axe/Mace/Polearm/Throwing/Spear), passive defense passives (Iron Skin, Natural Resistance, Increased Stamina/Speed). Mechanical role: passive stat multipliers.
- **Warcries** -- 10 skills: party buffs (Shout, Battle Orders, Battle Command), fear effects (Howl), taunt, debuff (Battle Cry), stun+damage (War Cry), corpse hork (Find Potion, Find Item), grim ward. Mechanical role: party support + self-buff + utility.

**Tree structure graph:**
- Combat: linear chain (Bash -> Double Swing -> Concentrate -> Frenzy -> Whirlwind/Berserk), Leap/Leap Attack as parallel branch
- Masteries: flat -- 6 weapon masteries at tier 1-2, then passives at tiers 3-6, no prerequisites among them (only class level gates)
- Warcries: linear chain (Howl -> Shout -> Battle Orders -> Battle Command), with branch for Taunt -> Battle Cry -> War Cry

**Core identity:** Pure physical melee with party support. Highest life per level. Can dual-wield any 1H weapons. Warcries provide massive party-wide survivability (Battle Orders: +35-92% life/mana/stamina).

### 1.5 Druid (Elemental / Shape Shifting / Summoning)

**Three trees:**
- **Elemental** -- 10 skills: fire (Firestorm, Molten Boulder, Fissure, Volcano, Armageddon), cold (Arctic Blast, Hurricane), wind (Twister, Tornado), and defensive (Cyclone Armor). Mechanical role: caster DPS with two damage types (fire + wind/cold).
- **Shape Shifting** -- 10 skills: Werewolf form + skills (Feral Rage, Rabies, Fury), Werebear form + skills (Maul, Shock Wave), shared (Fire Claws, Hunger), and passive (Lycanthropy). Mechanical role: wereform transformations lock out elemental skills -- switching forms costs a 1s casting delay. Werewolf = fast attack speed + leech; Werebear = high defense + stun + interrupt immunity.
- **Summoning** -- 10 skills: spirit wolves, dire wolves, grizzly bear; spirit buffs (Oak Sage +life, Heart of Wolverine +dmg+AR, Carrion Vine/Solar Creeper utility); ravens; poison creeper. Mechanical role: pet army + party buff totems.

**Tree structure graph:**
- Elemental: fire chain (Firestorm -> Molten Boulder -> Fissure -> Volcano -> Armageddon) + wind chain (Arctic Blast -> Twister -> Tornado -> Hurricane)
- Shape Shifting: Werewolf branch + Werebear branch, with shared skills at mid tiers. Lycanthropy = passive prereq for both forms.
- Summoning: ravens/creeper at tier 1, spirit wolves at tier 2, dire wolves at tier 3, grizzly at tier 5. Spirits are separate chains.

**Core identity:** Hybrid shapeshifter/caster/summoner. Must choose a form (human=elemental spells, werewolf/werebear=melee). Werewolf attacks use IAS (attack rate), werebear is slower but tankier.

### 1.6 Necromancer (Curses / Poison & Bone / Summoning)

**Three trees:**
- **Curses** -- 10 skills: amplify damage, weaken, iron maiden, terror, confuse, life tap, attract, decrepify, lower resist, dim vision. Mechanical role: only one curse active per target at a time. Override rules exist (Attract cannot be overwritten). Exclusive debuff framework.
- **Poison & Bone** -- 10 skills: bone spear, bone spirit, bone armor, bone wall/prison, corpse explosion (CE), poison dagger/explosion/nova, teeth. Mechanical role: direct magic and poison damage, plus corpse consumption (CE scales from corpse HP, 50% fire + 50% physical).
- **Summoning** -- 10 skills: raise skeleton, skeletal mage, skeleton mastery, golems (clay/blood/iron/fire with golem mastery), summon resist, revive. Mechanical role: undead army, golem tank, revive temporary army. Skeleton cap increases with skill level (diminishing returns beyond ~slvl 20-30).

**Tree structure graph:**
- Curses: branch -- amplify damage + dim vision at tier 1, then two chains of debuffs (curse types differentiate by effect class)
- P&B: bone chain (Teeth -> Bone Armor -> Bone Wall -> Bone Spear -> Bone Prison -> Bone Spirit) + poison chain (Poison Dagger -> Poison Explosion -> Poison Nova), with Corpse Explosion at tier 2
- Summoning: skeleton chain (Raise Skeleton + Mastery -> Skeletal Mage), golem chain (Clay -> golem mastery -> Blood -> Iron -> Fire), revives at tier 6

**Core identity:** Minion army commander. Corpse management mechanic (many skills consume corpses). Curse framework (single active curse). CE provides screen-wide scaling damage.

### 1.7 Paladin (Combat Skills / Offensive Auras / Defensive Auras)

**Three trees:**
- **Combat Skills** -- 10 skills: melee (Sacrifice, Smite, Zeal, Charge, Vengeance, Blessed Hammer, Holy Shield, Fist of the Heavens), holy bolt. Mechanical role: active melee and spell damage.
- **Offensive Auras** -- 10 skills: Might, Holy Fire, Thorns, Blessed Aim, Concentration, Holy Freeze, Holy Shock, Sanctuary, Fanaticism, Conviction. Mechanical role: party damage multiplier auras + enemy debuff.
- **Defensive Auras** -- 10 skills: Prayer, Resist Fire/Cold/Lightning, Defiance, Cleansing, Vigor, Meditation, Redemption, Salvation. Mechanical role: party survivability + resource management.

**Tree structure graph:**
- Combat: linear chain (Sacrifice -> Smite -> Holy Bolt -> Zeal -> Charge -> Vengeance -> Blessed Hammer -> Holy Shield -> Fist of Heavens)
- Offensive Auras: two branches (might+fire/thorns+freeze+shock+fanaticism / blessed aim+concentration+sanctuary+conviction)
- Defensive Auras: two branches (prayer+cleansing+meditation+redemption / resist fire+cold+lightning+salvation+defiance+vigor)

**Core identity:** One active aura at a time (right-mouse slot). Aura radius increases with skill level (~10.6yd at slvl1 to ~36yd at slvl20). Auras granted by items stack *with* the active skill aura (e.g., Dream helm's Holy Shock + Paladin's own Fanaticism). Resist auras provide half their max-resistance bonus as passive even when not active.

### 1.8 Sorceress (Fire / Cold / Lightning)

**Three trees:**
- **Fire Spells** -- 10 skills: fire bolt, warmth (mana regen passive), inferno, blaze (fire trail), fire ball, fire wall, enchant (fire weapon buff), meteor, fire mastery, hydra. Mechanical role: varied fire damage delivery (projectile, AoE, DoT ground, wall, turret). Fire mastery = +% fire damage (7% per level).
- **Cold Spells** -- 10 skills: ice bolt, frozen armor, frost nova, ice blast, shiver armor, glacial spike, blizzard, chilling armor, cold mastery, frozen orb. Mechanical role: cold damage + chill/freeze CC. Cold Mastery = -% enemy cold resistance (5% per level) -- works differently from fire/lightning mastery.
- **Lightning Spells** -- 10 skills: charged bolt, static field (% enemy HP reduction), telekinesis, nova, lightning, chain lightning, teleport, energy shield, lightning mastery, thunder storm. Mechanical role: lightning damage (high variance), utility (teleport, static field, ES). Lightning Mastery = +% lightning damage (12% per level).

**Tree structure graph:** Each tree follows a linear chain with branching at tiers:
- Fire: Fire Bolt -> Fire Ball -> Meteor -> Fire Mastery, with Warmth/Inferno/Blaze/Fire Wall/Enchant/Hydra as branches
- Cold: Ice Bolt -> Ice Blast -> Glacial Spike -> Blizzard -> Cold Mastery/Frozen Orb, with Frost Nova/Armors as branches
- Lightning: Charged Bolt -> Lightning -> Chain Lightning -> Lightning Mastery, with Static/Telekinesis/Nova/Teleport/ES/TS as branches

**Core identity:** Pure caster. Lowest life per level (1/lvl). Highest mana per level (2/lvl). Teleport mobility defines D2's endgame. Must invest in at least two elements to handle immunities in Hell. Energy Shield + Telekinesis synergy provides mana-as-life defensive conversion.

---

## 2. Skill Mechanics Taxonomy

### 2.1 Classification By Engine Treatment

| Category | Examples | Key Engine Behavior |
|----------|----------|-------------------|
| **Direct Spell** | Fire Bolt, Ice Blast, Lightning | Projectile or beam originates from caster; spell damage types only |
| **Projectile (pierce/split)** | Multiple Shot, Strafe, Lightning Fury | Fires multiple projectiles; can pierce through targets; next-hit-delay (NHD) applies |
| **AoE (nova/wall/rain)** | Nova, Frost Nova, Poison Nova, Fire Wall, Blizzard, Fissure | Instant area effect or ground-targeted persistent area; NHD on nova-type |
| **Channeled** | Inferno, Arctic Blast | Continuous stream; costs mana per frame; damage per frame |
| **Charge-up + Finisher** | Assassin Martial Arts: Tiger Strike -> Dragon Talon | Build charges 1-3 per successive hit (15s expiry); finisher releases all charges at once. Post-2.4: finisher consumes only 1 charge/skill per attack |
| **Summon (pet)** | Raise Skeleton, Summon Grizzly, Valkyrie, Shadow Master | Minion entity with its own AI, stats, HP. Cap per skill increases at certain slvls |
| **Curse** | Amplify Damage, Decrepify, Lower Resist, Dim Vision | One active per target. Special override exceptions (Attract unoverridable, Grim Ward only overwritten by Confuse/Attract) |
| **Aura** | Might, Fanaticism, Holy Freeze, Meditation | Persistent toggle in RMB slot; party radius; one active at a time from skill (item auras stack) |
| **Warcry (buff)** | Battle Orders, Shout, Battle Command | Instant-cast party-wide buffs with duration; cast order matters (Battle Command first) |
| **Shapeshift** | Werewolf, Werebear | Form change; locks out all other skill trees except shapeshift skills; 1s casting delay to revert |
| **Trap (sentry)** | Lightning Sentry, Death Sentry | Deployed minion entity that attacks independently. **Crucial:** sentry traps treat damage as minion damage, so +% ele damage and -% enemy resist from gear do NOT apply |
| **Passive/Mastery** | Critical Strike, Dodge, Skeleton Mastery, Fire Mastery | Always-on passive bonuses; no cast, no mana |
| **Corpse-Consumer** | Corpse Explosion, Raise Skeleton, Corpse Lance variants | Requires or consumes a corpse as resource; CE deals 50% fire + 50% physical at 70-120% of base monster life |
| **Teleport/Movement** | Teleport, Leap, Leap Attack, Dragon Flight | Instant positional movement (Teleport is mana-cost-distance based); Leap has knockback radius |

### 2.2 Detailed Mechanics Per Category

#### Charge-up + Finisher (Martial Arts)
- **Charge mechanics:** Each charge-up attack that hits adds 1 charge (max 3). Charges last 15s. Charges accumulate across multiple charge-up skills simultaneously.
- **Per charge level variation:** Each skill has 3 levels of effect (e.g., Tiger Strike charge 1 = +% physically damage, charge 2 = 2x, charge 3 = 3x). Some skills change damage TYPE per charge (Phoenix Strike: charge 1 = meteor, charge 2 = chain lightning, charge 3 = chaos ice bolts).
- **Finisher release:** Dragon Talon, Dragon Claw, Dragon Tail, Dragon Flight trigger the released effects. Post-Patch 2.4: only 1 charge per skill consumed per finisher attack.
- **NHD interaction:** Charge 2/3 of Claws of Thunder (nova/charged bolts) and Phoenix Strike (chaos lightning/ice bolts) have 4-frame NHD. Pre-2.7 NHD was global per-player (same-skill casts only in 2.7+).

#### Trap (Sentry Entity)
- Traps are minion entities. This is a critical engine-level distinction.
- Damage from sentry traps is NOT boosted by:
  - +% Elemental Skill Damage (e.g., facets, Griffon's Eye, Ormus' Robes)
  - -% Enemy Elemental Resistance from gear
- Only Fire Blast and Shock Web are direct-throw (not sentry) and DO benefit from these.
- **Skill level** remains the primary damage scalar for sentry traps (via +Trap Skills or +All Skills).
- Conviction aura from mercenary Infinity pierces resistances for traps because it's a debuff on the monster, not a bonus on the character.

#### Summon Cap Rules
| Summon | Cap Formula (slvl ranges) |
|--------|-------------------------|
| Raise Skeleton | 1 skeleton at slvl 1, +1 at slvls 3, 5, 7, 10, 13, 17, 21, 25, 30, 35, 40, 45, 50... (diminishing marginal returns above slvl 20) |
| Skeletal Mage | Slower cap progression, similar pattern |
| Summon Grizzly | 1 at all levels (singular summon) |
| Spirit Wolves / Dire Wolves | Cap increases at low levels, total limited |
| Revive | Cap increases regularly with level |
| Valkyrie | 1 at all levels, power scales with skill |
| Shadow Master/Warrior | 1 at all levels |

- Diminishing returns formula for summon caps: typically the gap between cap increments widens at higher levels (e.g., +1 skeleton every 2-3 levels early, every 5+ levels after slvl 30).

#### Curse Override Rules
- Standard: new curse overwrites old.
- **Cannot overwrite themselves until expired:** Attract, Confuse, Cloak of Shadows, Howl.
- **Attract:** Cannot be overwritten by ANYTHING including itself.
- **Confuse:** Cannot overwrite or be overwritten by Attract, Dim Vision, Grim Ward, Hit Blinds Target, Taunt, Terror.
- **Fleeing hierarchy** (higher cannot be overwritten by lower): Grim Ward > Terror > Hit Blinds Target (item) > Howl.

#### Aura Mechanics
- Exactly **1 active arua** at a time from skill selection (RMB slot).
- **Item-granted auras** are always active and stack with the skill aura (e.g., Dream + Paladin Holy Shock = combined Holy Shock level).
- **Radius** = `(26 + 6 * lvl) / 3` yards for Vigor-style scaling; other auras use similar piecewise linear scaling.
- Aura **persistence**: none. Aura drops immediately on switch or leaving radius. No linger duration in D2.
- Passive half-benefit: Resist auras give 50% of their max-res bonus even when not active (hard points only).

#### Warcry Buffs
- Party-wide (including minions) instant-cast buffs with duration.
- All three major buffs (Shout, Battle Orders, Battle Command) are in a mutual synergy group granting +5s duration per hard point to each other.
- **Required cast order:** Battle Command (+1 all skills) -> Battle Orders (+life/mana/stamina%) -> Shout (+defense%).
- Stacks: only highest-level version affects a character; casting a lower-level version overwrites and can kill the recipient.

---

## 3. Scaling Math

### 3.1 Damage Per Level -- The Tiered Bonus System

Skills use a **5-segment piecewise linear** scaling model defined in `skills.txt`.

#### Damage Fields
- `MinDam` / `MaxDam` -- base damage (level 1)
- `MinLevDam1` / `MaxLevDam1` -- per-level bonus for levels 2-8
- `MinLevDam2` / `MaxLevDam2` -- per-level bonus for levels 9-16
- `MinLevDam3` / `MaxLevDam3` -- per-level bonus for levels 17-22
- `MinLevDam4` / `MaxLevDam4` -- per-level bonus for levels 23-28
- `MinLevDam5` / `MaxLevDam5` -- per-level bonus for levels 29+

#### Piecewise Formula (MinDam, same structure for MaxDam)

```
slvl 1:     MinDam
slvl 2-8:   MinDam + (slvl - 1) * LevDam1
slvl 9-16:  MinDam + 7*LevDam1 + (slvl - 8) * LevDam2
slvl 17-22: MinDam + 7*LevDam1 + 8*LevDam2 + (slvl - 16) * LevDam3
slvl 23-28: MinDam + 7*LevDam1 + 8*LevDam2 + 6*LevDam3 + (slvl - 22) * LevDam4
slvl 29+:   MinDam + 7*LevDam1 + 8*LevDam2 + 6*LevDam3 + 6*LevDam4 + (slvl - 28) * LevDam5
```

The multipliers (7, 8, 6, 6) equal the number of levels in each preceding segment.

#### Hitshift Divisor

Base values are stored as integers with a hitshift divisor:

```
FinalDamage = StoredValue * 2^hitshift / 256
```

Common hitshift: 8 (full precision, divisor = 1). Lower hitshift = fractional values:
- hitshift 8 -> *1
- hitshift 7 -> *0.5
- hitshift 6 -> *0.25
- hitshift 5 -> *0.125
- hitshift 1 -> *1/128

#### Elemental Damage

Same piecewise structure using `EMin, EMax, EMinLev1-5, EMaxLev1-5`.

### 3.2 Mana Cost Scaling

Each skill has `ManaCost` (base), `ManaDelta` (first-level scaling), and `ManaLevels` fields.

```
ManaCost(slvl) = ManaCost + (slvl - 1) * ManaDelta
```

The result runs through a `ManaLevels` divisor (usually 8):

```
ManaCost at slvl = ceil(ManaCost + floor((slvl - 1) * ManaDelta * 256 / ManaLevels) / 256)
```

Most skills have `ManaDelta = 0` (fixed mana cost). Some have small positive delta (mana cost rises slowly with level). Some have negative delta (cost decreases at higher levels, e.g., Energy Shield).

Some skills cap mana cost or have a `ManaShifts` field.

### 3.3 Attack Rating (AR) Scaling on Attack Skills

Attack skills that require attack rating have AR% bonuses that scale with skill level:

```
AR%_Bonus = base% + per_level% * (slvl - 1)
```

The AR% is applied as a multiplier to the character's total AR (from dexterity, gear, etc.). Typical scaling:
- Base +% AR per level varies widely: 10-25% on charge skills, 10-20% on melee attacks.
- Blessed Aim aura: provides flat AR, not %, which is distinctive.

### 3.4 Radius / Duration Scaling

#### Radius

Most auras and AoE skills use one of two radius scaling functions:

**Linear (ln12):** `radius = base + slope * lvl`
- Vigor: `(26 + 6 * lvl) / 3` yards
- Sanctuary: `(8 + 2 * lvl) / 3` yards

**Diminishing Returns (dm12):** `radius = base + cap * min(1, 110*lvl/(lvl+6) / 100)`
- Leap radius: caps at 20 yards.

**Corpse Explosion:**
- Physical radius = `floor((7 + lvl) / 2) * 2/3` yards
- Fire radius = `floor((8 + lvl) / 2) * 2/3` yards

**Fixed (no scaling):** Fire Ball (2.67 yd), Meteor (4 yd), Decrepify (4 yd), Conviction (13.33 yd), Cloak of Shadows (20 yd).

#### Duration (buffs, curses, stuns)

Use the same piecewise linear system (columns `EMinLev1-5` correspond to duration in D2 standard frames at 25 Hz):

```
DurationFrames = base + 7*Lvl1 + 8*Lvl2 + 6*Lvl3 + 6*Lvl4 + (slvl-28)*Lvl5   [for 29+]
```

Synergies can add duration for mutual buff groups (e.g., Shout/BO/BC each give +5s per hard point to the others).

### 3.5 Diminishing Returns on Summon Caps

Summon caps are stored in `skills.txt` using `Param1-8` / `ParamShift` / `ParamValue` fields. The formula for # of skeletons at a given level:

```
#Skeletons = base + floor((slvl * Param1 + Param2) / Param3 + ... )
```

For Raise Skeleton, the effective table:
- slvl 1: 1 skeleton
- slvl 3: 2
- slvl 5: 3
- slvl 7: 4
- Each additional skeleton requires progressively more levels (gap widens from 2 to 5+ levels per skeleton beyond slvl 20).

Skeleton Mastery and Summon Resist provide % bonuses to minion stats that also have piecewise linear scaling (but no hard diminishing cap).

---

## 4. Synergy System

### 4.1 Core Rules

Introduced in D2 v1.10. Designed to set a target for endgame skill point distribution (~80-100 points spent).

- **Synergies count HARD points only.** Gear-granted (+skills) levels do NOT contribute.
- Flat % per hard point from listed donor skill(s).
- Bonus applied as a **multiplicative damage factor**: `FinalDamage = BaseDamage * (1 + SumOfSynergyBonuses)`.
- This multiplier **stacks multiplicatively** with +% Elemental Skill Damage from gear (separate multiplier, not additive).
- A donor skill can synergize multiple recipient skills (and vice versa -- mutual synergies exist).

### 4.2 Typical Synergy Magnitudes

| Magnitude Range | Examples |
|----------------|----------|
| **+2-6%** per hard point | Ice Bolt -> Blizzard (+2%), Warmth -> all Fire (+3%), Howl/Taunt/Battle Cry -> War Cry (+6%) |
| **+7-10%** per hard point | Teeth/Bone Spirit -> Bone Spear (+7%), Volcano -> Fissure (+10%), Charged Strike -> Lightning Fury (+8%) |
| **+12-16%** per hard point | Fire Bolt -> Fire Ball (+14%), Fire Ball -> Fire Bolt (+16%) |
| **Duration / utility** | +5 seconds per hard point (Shout/BO/BC mutual), +1% Find Item chance per hard point (Find Potion -> Find Item) |

### 4.3 Design Intent and Implications

- **1.10 synergy rework** -- Before synergies, maxing a single skill and applying 1 point spread was optimal. Synergies incentivized committing to a theme (e.g., all fire skills, all bone skills).
- **Build pigeonhole:** Synergies made specialized builds stronger but hybrid builds harder. A Fire Ball sorceress who also wants Frozen Orb loses the opportunity cost of 40+ points in fire synergies.
- **Endgame target:** 80-100 of the available 110 points are consumed by one maxed skill (20) + 2-4 synergy skills (40-80) + prerequisites + 1-point-wonder utility skills.
- **No gear effect on synergies** is intentional: prevents BiS gear from disproportionately scaling damage.

### 4.4 Special Case: Druid Summon Masteries

Skeleton Mastery and Druid spirit passives (Oak Sage, Heart of Wolverine) receive bonuses from BOTH hard and soft points -- the only exception to the hard-points-only rule in standard D2.

---

## 5. +Skills Mechanics

### 5.1 Bonus Types

| Bonus Type | Effect | Interacts with? |
|-----------|--------|-----------------|
| **+All Skills** | +1 to all skills of all classes | All categories |
| **+Class Skills** (e.g., +Sorceress Skills) | +1 to all 30 skills of that class | All categories |
| **+Tree Skills** (e.g., +Fire Skills) | +1 to all 10 skills in that tree | All categories |
| **+Single Skill** (e.g., +3 Fire Ball on staff) | +specific skill only | All categories |
| **Oskill** (item-granted off-class skill) | Grants a skill to any class using the item | Synergies: YES from hard points. Synergy: NO (doesn't act as synergy). Native class cap: +3 hard cap. |

### 5.2 Soft vs Hard Points

| Property | Hard Points | Soft Points |
|----------|------------|-------------|
| **Definition** | Permanently assigned via level-up or quest | Granted by gear, Battle Command, shrines |
| **Count toward synergies** | YES | NO |
| **Count toward prerequisites** | YES | NO |
| **Affect skill's own effect** | YES | YES |
| **Max per skill** | 20 | No hard cap on total slvl with gear |

### 5.3 Skill Level Caps

- **Hard point cap:** 20 per skill (cannot assign more than 20).
- **Total level cap (hard + soft):** No formal hard cap. Slvls of 40+ are achievable with high-end gear (e.g., +all skills, +class skills, +tree skills, +single skill on two weapons, amulet, helm, etc.).
- **Practical maximum:** ~40-50 for a Sorceress main skill with BiS gear.
- The tiered bonus system means bonuses at slvl 29+ continue with the `LevDam5` slope indefinitely.

### 5.4 Oskill (+3 Cap for Native Class)

- When a skill is granted by an item AND the wielder's class natively has that skill, the oskill bonus is **hard-capped at +3** total.
- Example: Enigma grants Teleport. Sorceress wearing Enigma: only +3 Teleport from the oskill (the rest is wasted). Paladin wearing Enigma: full +1 Teleport level.
- This is hardcoded in the game DLL and applies per character, not per item.
- The +single skill (`item_singleskill`) property does NOT have this cap.

---

## 6. Skill Point Economy

### 6.1 Total Available Points

| Source | Points |
|--------|--------|
| Levels (1-99) | 98 |
| Den of Evil (Normal) | 1 |
| Den of Evil (Nightmare) | 1 |
| Den of Evil (Hell) | 1 |
| Radament's Lair (N) | 1 |
| Radament's Lair (NM) | 1 |
| Radament's Lair (H) | 1 |
| The Fallen Angel (Izual, N) | 2 |
| The Fallen Angel (Izual, NM) | 2 |
| The Fallen Angel (Izual, H) | 2 |
| **Total** | **110** |

*Note: 4 skill points per difficulty (Den of Evil: 1, Radament: 1, Izual: 2) = 12 quest points.*

### 6.2 Respec System (D2R)

- **3 free respecs** (1 per difficulty, via completing Den of Evil and talking to Akara).
- **Token of Absolution:** Combine 4 boss essences in Horadric Cube (Hell difficulty only):
  - Twisted Essence of Suffering (Andariel/Duriel)
  - Charged Essence of Hatred (Mephisto)
  - Burning Essence of Terror (Diablo)
  - Festering Essence of Destruction (Baal)
- Tokens are tradeable (~Pul-Ist rune value).
- In offline single-player, the `-enablerespec` flag enables unlimited free respecs from the character screen.

### 6.3 Prerequisite Refund Rules

- **No cascade refund:** If a skill has 1 point as a prerequisite for another skill, removing that point (via respec) does NOT automatically refund points from the dependent skill. Respecs are all-or-nothing for the entire character.
- Prerequisites only gate **access** -- once spent, you keep the skill. On respec you must re-satisfy all prereqs to access higher-tier skills.

---

## 7. Casting / Attack Interaction

### 7.1 FCR vs IAS

| Property | Faster Cast Rate (FCR) | Increased Attack Speed (IAS) |
|----------|----------------------|----------------------------|
| **Used by** | Spellcasting (Sorceress Fire Ball, Hammerdin, etc.) | Physical attacks (melee, bow, shapeshift melee) |
| **Breakpoints** | Fixed per class. Sorc: 9/20/37/63/105/200%. Pal/Nec: 9/18/30/48/75/125%. | Depends on class, weapon base speed, skills (Fanaticism, Werewolf, Frenzy), off-hand. Use external calculators. |
| **Weapon dependent?** | No (except Sorc Lightning/Chain Lightning have slower table) | Fully dependent on weapon type and base speed |
| **Affected by skills?** | No | Yes (Fanaticism, Burst of Speed, Werewolf, Frenzy all modify IAS) |
| **Assassin Traps** | NOT used for trap laying (uses IAS instead) | Used for trap laying speed |
| **Assassin Kicks** | NOT used (uses IAS) | Used for kick speed |

Frames per class (unmodified base, 1H weapon):
- Amazon: 16
- Assassin: 15
- Barbarian: 19
- Druid: 19
- Necromancer: 19
- Paladin: 15
- Sorceress: 20

### 7.2 Next-Hit-Delay (NHD)

NHD prevents a monster from being hit by certain AoE/multi-projectile skills too frequently. When an NHD skill hits a target, an **internal timer** prevents any OTHER NHD skill from hitting that target until the timer expires.

**Standard NHD: 4 frames** (0.16s at 25Hz). Hit at frame 0, immune frames 0-3, available again at frame 4.

| Skills with 4-frame NHD | Class |
|------------------------|-------|
| Multiple Shot, Strafe, Lightning Strike | Amazon |
| Chain Lightning, Nova, Frost Nova | Sorceress |
| Poison Nova, Teeth | Necromancer |
| Shock Wave | Druid |
| Wake of Fire | Assassin |
| Claws of Thunder (charges 2-3), Phoenix Strike (charges 2-3) | Assassin |
| Battle Cry, Battle Command, Battle Orders | Barbarian |

| Other NHD timings | Frames |
|------------------|--------|
| Fissure, Volcano (fireballs) | 5 |
| War Cry | 6 |
| Volcano (initial eruption) | 10 |
| Shock Web, Blade Sentinel, Twister, Tornado | 25 |

**Critical NHD implications:**
- Strafe on single targets: roughly 1 in 2-3 arrows deals damage due to NHD.
- Pre-2.7: NHD was global per player (any NHD skill blocked all others). Post-2.7: NHD is per skill execution (only same skill cast's missiles share timer).
- Mosaic Assassins: Post-2.7, each charge-up's triggered effects count as separate casts, avoiding self-blocking.
- Dragon Talon kicks faster than 4f can cause charge effects to miss due to overlapping NHD.

### 7.3 Weapon Requirement Classes

Some skills require specific weapon types:

| Skill/Tree | Weapon Required |
|-----------|----------------|
| All Amazon Javelin & Spear skills | Javelin or spear. Throwing skills (Poison Javelin, Lightning Fury) need throwing javelins specifically |
| Assassin Fists of Fire, Claws of Thunder, Blades of Ice | Claw-class weapons |
| Assassin Dragon Claw | Dual claws required |
| Shapeshift (Werewolf/Werebear) | Ranged weapons cannot fire in wereform (become melee). Skills locked to form |
| Paladin Smite | Shield required (uses shield damage, not weapon damage) |
| Barbarian weapon masteries | Weapon type must match mastery |

### 7.4 Dual-Wield Mechanics

**Only Barbarians and Assassins** can dual-wield.

| Class | Normal Attack | Skill Behavior |
|-------|--------------|----------------|
| Barbarian | Right-hand weapon only | Double Swing/Frenzy: both weapons per click. Whirlwind: right-hand first, then both. Off-hand provides stats always. |
| Assassin | Alternates claws | Finishers/kick skills: average base weapon speeds of both, use right-hand IAS only for breakpoints. Trap laying: same (average base speed, right-hand IAS). |

**Key optimization rule:** Put higher-IAS weapon in right-hand slot (above glove) for dual-wield speed calculations.

---

## 8. Charges / Procs on Items

### 8.1 Procurement Categories

| Proc Type | Triggers When | Requires Hit? | Spells Count? |
|-----------|--------------|---------------|---------------|
| **On Attack** | You swing/attack | No (procs on miss) | No (weapon attacks only) |
| **On Striking** | You hit with weapon | Yes (must connect, not blocked) | No (weapon attacks only) |
| **When Struck** | You are hit | Yes (you must be hit) | N/A (defensive) |
| **On Kill** | You kill an enemy | Yes (kill event) | YES (spells count) |

**Rule of thumb:** If a skill deals physical damage that can leech and requires AR, it can proc striking effects. Pure spell damage cannot.

### 8.2 Affix Group Competition

"On Attack," "When Struck," and Charged-suffix items are in the **same affix group** -- they cannot spawn together on a single magic/rare/crafted item.

Pierce effects: each target hit by a piercing attack rolls independently for procs.
Multiple procs on same item: only one can trigger per swing.

### 8.3 Item Charges

Charged items allow casting a fixed-level skill using charges. Rechargeable at vendors for gold. Not the same as procs (charges require manual activation).

### 8.4 Proc Scaling

Proc chance does NOT scale with skill level. The skill level of the proc is fixed by the item. However, the damage from the proc'd skill scales with that fixed level normally (including synergies from the character's hard points).

---

## 9. Energy Shield / Defensive-Conversion Mechanics

### 9.1 Core Mechanic

Energy Shield (Sorceress, Lightning tree tier 5) converts incoming damage to mana drain instead of life damage.

- **Base ratio:** 2 mana per 1 HP of damage absorbed (200%).
- **Absorb %:** Starts at 20% (slvl 1), caps at 95% (slvl 40).
- **Telekinesis synergy:** Each HARD point in Telekinesis reduces the mana cost multiplier by 0.0625.

```
ManaCost = 2 - 0.0625 * TK_hard_points

At TK = 0:  2.00 mana per damage absorbed
At TK = 8:  1.50
At TK = 16: 1.00
At TK = 20: 0.75 (best possible)
```

### 9.2 Damage Application Order

1. **PvP Penalty** (0.17 in PvP, 1.0 in PvM) -- applied FIRST
2. **Energy Shield** absorbs its % of remaining
3. **Resistances / %DR** -- applied ONLY to the portion reaching life
4. **Block** (physical/blockable only)

**Critical implication:** ES comes BEFORE resistances. The mana pool takes unmitigated absorbed damage. Only the life portion benefits from resists. This makes TK synergy essential.

### 9.3 The Full Formula

```
LifeDamage  = Incoming * PvPPenalty * (1 - Res/100) * (1 - Block/100) * (1 - ES%/100)
ManaDamage  = Incoming * (2 - 0.0625 * TK_Hard) * PvPPenalty
```

### 9.4 Pattern for Other Defensive-Conversion Systems

The ES/TK model is the canonical D2 pattern for resource-based damage soak:
1. A primary skill that converts damage type (life -> mana drain).
2. A secondary synergy skill that improves the conversion efficiency (TK reduces mana cost).
3. The synergy uses only hard points.
4. The conversion applies early in the damage order (before resists), making it most effective when paired with max resistances.

---

## 10. Class-Specific Item Interactions

### 10.1 Staffmods (Automods)

Class-specific items can spawn with +1 to +3 to individual skills. This is the primary way class items differ from generic items.

**Which items get staffmods:**
| Class | Item Bases | Automod Type |
|-------|-----------|-------------|
| Amazon | Bows, Javelins, Spears | +Tree skills, not individual |
| Assassin | Claws (h2h2 type) | Individual skills (+1-3) |
| Barbarian | Primal Helms | Individual skills (+1-3) |
| Druid | Pelts | Individual skills (+1-3) |
| Necromancer | Wands, Voodoo Heads | Individual skills (+1-3), poison damage on heads |
| Paladin | Scepters, Shields | Individual skills on scepters; resist/ED/AR on shields |
| Sorceress | Staves, Orbs | Individual skills (+1-3), life/mana on orbs |

**Skill tier selection by item ilvl:**
| ilvl | T1 | T2 | T3 | T4 | T5 | T6 |
|------|----|----|----|----|----|----|
| <=11 | 80% | 20% | -- | -- | -- | -- |
| 12-18 | 30% | 50% | 20% | -- | -- | -- |
| 19-24 | 10% | 20% | 50% | 20% | -- | -- |
| 25-36 | -- | 10% | 20% | 50% | 20% | -- |
| 37-99 | -- | -- | 10% | 20% | 50% | 20% |

**Number of skills on item:** 0 (30% chance), 1 (40%), 2 (20%), 3 (10%).

**+value distribution:** +1 (60%), +2 (30%), +3 (10%). Charsi Imbue adds half ilvl to the roll, biasing toward +3.

### 10.2 Class Weapon Speed Considerations

- **Claw base speeds** vary (from -30 for War Fist to -10 for Cestus or +0 for Battle Cestus). For dual-wield Assassins, base speed averaging matters.
- **Barbarian 2H sword in 1H:** Barb can wield two-handed swords in one hand, enabling dual 2H swords.
- **Amazon bows/spears** have varying base speeds affecting strafe/lightning fury attack speed breakpoints.
- **Paladin scepters** tend to have slower base speeds, relevant for Zeal/Fanatical breakpoints.

---

## 11. Uncertainties & Conflicts

### 11.1 Damage Scaling Segment Boundary Exceptions

The canonical 5-segment model (lvls 1, 2-8, 9-16, 17-22, 23-28, 29+) is well-documented for D2 but some sources show slightly different boundary points. It is possible that certain skills deviate, or that some modding references use 4-segment models for LoD-era vs the full 5-segment in v1.13+. The exact segment boundaries should be verified against D2R's actual `skills.txt` (which is not published).

### 11.2 Hitshift Values per Skill

Hitshift values are not well-documented per skill. The community has reverse-engineered many, but a comprehensive verified list does not exist publicly. Our implementation would need to define hitshift per skill.

### 11.3 Summon Cap Exact Formula

The exact Raise Skeleton cap table beyond slvl 30 is poorly documented. Community sources show skeleton count breakpoints at slvls 1, 3, 5, 7, 10, 13, 17, 21, 25, 30, 35, 40, 45, 50 -- but some sources disagree on whether the pattern continues at the same increment (gap of 5 levels each time) or widens further.

### 11.4 Post-2.4 NHD Changes

- Pre-2.7: NHD was per-player (global to all skills the player casts). Post-2.7: "per skill execution" means only the same cast's missiles share a timer. There is some debate in the community whether this means same-skill-from-different-casts or truly only missiles from the same single cast. The Blizzard forum post suggests the latter.

### 11.5 Oskill +NativeClass Cap Behavior

The +3 cap for oskills on native classes is confirmed to exist in the game DLL but edge cases (multiple oskill sources of the same skill, interaction with +all skills, interaction with class skill tree charms) have conflicting player reports.

### 11.6 Druid Summoning Tree Skill Count

There is confusion in some references: the Druid Summoning tree appears to have 9 or 10 skills depending on patch version (Solar Creeper was added later). For D2R, it should have 10.

### 11.7 Synergy Magnitudes

The exact per-hard-point values for synergies vary by source. Two different community wikis occasionally report different values for the same synergy pair (e.g., Fire Bolt -> Fire Ball is consistently +14% in well-audited sources, but some show +16%). Cross-reference against multiple high-credibility sources is needed.

---

## 12. Sources

### Primary Mechanics References

- The Amazon Basin (http://www.theamazonbasin.com/wiki/) -- Radius calculations, curse override rules, class pages, skill details
- Diablo Wiki / Fandom (https://diablo.fandom.com/wiki/) -- Skill trees, curse mechanics, synergy overview, energy shield mechanics
- D2Mods.info forum (http://d2mods.info/forum/) -- Skill damage calculation, piecewise formula knowledge base, staffmod technical details
- PureDiablo D2 Wiki (https://www.purediablo.com/d2wiki/) -- Synergies database, class-specific items, shapeshift mechanics

### Build / Strategy References

- Maxroll.gg (https://maxroll.gg/d2/) -- Next hit delay guide, staffmods guide, equipment-granted skills
- IGN D2 Character Class Guides (https://www.ign.com/wikis/diablo-2/) -- Tree structures per class
- StrategyWiki (https://strategywiki.org/wiki/Diablo_II/) -- Shapeshifting, martial arts, trap mechanics

### Official / Forums

- Blizzard D2R Forums (https://us.forums.blizzard.com/en/d2r/) -- NHD thread, synergy rules clarifications, oskill behavior reports
- Wowhead Skill Calculators (https://www.wowhead.com/diablo-2/skill-calc/) -- Interactive tree maps for Paladin, Druid, Assassin

### Cross-Reference Notes

Where sources conflicted, priority was given in this order:
1. The Amazon Basin (most technically rigorous community wiki)
2. Blizzard forum posts from developers/CMs (for D2R changes)
3. PureDiablo D2 Wiki (well-maintained)
4. Diablo Fandom Wiki (good breadth, occasionally outdated)
5. Fextralife / Fextralife D2 Wiki (lower priority, verified against higher-tier sources)
