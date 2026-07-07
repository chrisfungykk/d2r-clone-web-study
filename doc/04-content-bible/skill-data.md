# Skill Data — Content Bible

> **Authoring source for `src/sim/data/skills.ts`.** Per-skill numeric data: level gates,
> prerequisites, mana costs, 5-segment scaling constants, synergies, frame notes, and
> worked values. Skill names, tree layouts, prereqs, and synergy links match
> `doc/interactive/skill-tree-explorer.html`; the scaling framework and mana formula are
> defined in `02-game-design/classes-and-skills.md`. Class fantasy per `class-identities.md`.
>
> **Coverage: 2 of 7 classes** (Warden — 26 skills, Arcanist — 23 skills). Remaining 5
> classes are backlog (see table at the end of this file).

## How to read this file

**5-segment scaling.** Scaled stats grow piecewise per skill level (slvl):

| Segment | slvl 1 | slvl 2–8 | slvl 9–16 | slvl 17–22 | slvl 23+ |
|---|---|---|---|---|---|
| Constant | `base` | `perLevel` | `softMid` | `softHigh` | `softMax` |

The scaling-constant tables below list these five values per scaled stat. Damage skills
list min–max pairs (each end scales independently with its own constants). Worked values
at slvl 1/10/20/30 are precomputed for golden tests:

```
slvl 10 = base + 7·perLevel + 2·softMid
slvl 20 = base + 7·perLevel + 8·softMid + 4·softHigh
slvl 30 = base + 7·perLevel + 8·softMid + 6·softHigh + 8·softMax
```

Utility stats marked *(linear)* use simple `base + step·(slvl−1)` scaling and are listed
in the "Secondary effects" column.

**Mana.** `mana = baseMana + floor(perLevelMana · (slvl − 1) / manaDivisor)`. Notation in
the tables: `5 +1/2` means baseMana 5, perLevelMana 1, manaDivisor 2. `flat` means no
growth. Negative growth (mana gets cheaper) is noted with a floor.

**Row.** The tree row is also the character-level gate (1/6/12/18/24/30) and the
points-in-tree requirement per `classes-and-skills.md`.

**Synergies.** Percent per **hard** point in the donor skill (soft points from gear never
count). Synergy bonus applies after 5-segment scaling.

**Frames.** All timings in 25 Hz mechanics frames. Cast-animation base frames are the
0%-FCR entry of the `speeds` table (breakpoints per `stats-and-formulas.md` §FCR):
Warden 15 frames, Arcanist 14 frames. Melee skills use the weapon attack-frame formula;
they add no animation penalty unless noted.

---

## Warden (26 skills)

Melee-aura archetype: weapon-driven combat skills, party auras, defensive passives.
Damage skills are weapon-multipliers (ED% = enhanced damage on weapon damage) plus flat
elemental riders; the raw numbers below are deliberately lower than Arcanist spell damage
because weapon damage and attack rate multiply them.

### Tree 1 — Oath-Keeper (11 skills)

#### Structure and costs

| Skill | Row | Prereq | Category | Mana | Frame notes |
|---|---|---|---|---|---|
| Holy Spark | 1 | — | Direct-melee | 2 flat | Weapon attack frames |
| Keeper's Mark | 1 | — | Passive | — | Always on |
| Radiant Aura | 6 | Holy Spark | Aura | Free (toggle) | 1-tick activation; one aura active |
| Smiting Bolt | 6 | Keeper's Mark | Projectile (magic) | 3 +1/4 | Cast, 15 frames base |
| Zeal's Focus | 12 | Radiant Aura | Direct-melee (multi-strike) | 2 flat | Locks into strike sequence; whole sequence = one attack roll per strike |
| Glorious Charge | 12 | Smiting Bolt | Direct-melee (movement) | 6 flat | Travel 2× run speed; hit ends charge |
| Strength of Oath | 12 | Keeper's Mark | Passive | — | Always on |
| Blessed Ground | 18 | Radiant Aura | AoE wall (heal field) | 8 +1/2 | Cast, 15 frames; field ticks every 25 frames for 250 frames |
| Beacon of Hope | 18 | Zeal's Focus | Aura | Free (toggle) | One aura active |
| Wings of the Keeper | 24 | Blessed Ground | Teleport (party) | 20 −1/2 (floor 10) | Cast, 15 frames; 30-frame cooldown |
| Last Stand | 30 | Wings of the Keeper | Timed buff (self) | 25 flat | Instant; 375-frame cooldown |

#### Scaling constants

| Skill | Scaled stat | base | 2–8 | 9–16 | 17–22 | 23+ | Secondary effects (linear) |
|---|---|---|---|---|---|---|---|
| Holy Spark | Added lightning min | 2 | +2 | +3 | +4 | +5 | +AR: 10% + 8%/lvl |
| Holy Spark | Added lightning max | 8 | +6 | +9 | +12 | +15 | |
| Keeper's Mark | — | — | — | — | — | — | +5% defense per hard point |
| Radiant Aura | — | — | — | — | — | — | Party +dmg%: 10 + 8/lvl; radius 7.5 y + 0.6 y/lvl |
| Smiting Bolt | Magic dmg min | 6 | +4 | +6 | +8 | +10 | Missile speed fast; damages one target |
| Smiting Bolt | Magic dmg max | 14 | +8 | +12 | +16 | +20 | |
| Zeal's Focus | ED% | 10 | +6 | +8 | +10 | +12 | Strikes = min(5, 2 + floor(slvl/5)); +AR 8%/lvl |
| Glorious Charge | ED% | 50 | +15 | +20 | +25 | +30 | Stun 50 frames (fixed) |
| Strength of Oath | — | — | — | — | — | — | +2% Vitality per hard point |
| Blessed Ground | Heal over 10 s | 20 | +8 | +12 | +16 | +20 | Radius 4 y + 0.3 y/lvl |
| Beacon of Hope | — | — | — | — | — | — | Party +all res: 15 + 1/lvl, cap +30 (slvl 16) |
| Wings of the Keeper | — | — | — | — | — | — | Range 15 y + 1 y/lvl, cap 30 y; teleports party members in 10 y |
| Last Stand | — | — | — | — | — | — | Invulnerable 75 frames (fixed); end-stun 25 frames + 2/lvl, 6 y radius |

#### Worked values and synergies

| Skill | slvl 1 | slvl 10 | slvl 20 | slvl 30 | Synergies |
|---|---|---|---|---|---|
| Holy Spark | 2–8 ltng | 22–68 | 56–170 | 104–314 | — |
| Smiting Bolt | 6–14 magic | 46–94 | 114–230 | 210–422 | — |
| Zeal's Focus | +10% ED, 2 strikes | +68%, 4 | +156%, 5 | +272%, 5 | Smiting Bolt: +8% dmg per hard point |
| Glorious Charge | +50% ED | +195% | +415% | +705% | — |
| Blessed Ground | 20 heal | 100 | 236 | 428 | Strength of Oath: +5% heal per hard point |
| Last Stand | 75-frame invuln | 75 | 75 | 75 | Beacon of Hope: +3% duration per hard point (max +60% = 120 frames) |

### Tree 2 — Iron Vow (8 skills)

#### Structure and costs

| Skill | Row | Prereq | Category | Mana | Frame notes |
|---|---|---|---|---|---|
| Iron Strike | 1 | — | Direct-melee | 1 flat | Weapon attack frames |
| Holy Fire | 6 | Iron Strike | Direct-melee (conversion) | 2 flat | Weapon attack frames |
| Sanctuary Wall | 6 | Iron Strike | Passive | — | Always on |
| Hammer of Virtue | 12 | Holy Fire | Projectile (spiral, magic) | 5 +1/4 | Cast, 15 frames; hammer orbits outward, hits each target once per pass |
| Vengeance | 12 | Holy Fire | Direct-melee (tri-element) | 4 flat | Weapon attack frames |
| Conviction | 18 | Hammer of Virtue | Aura (offensive) | Free (toggle) | One aura active; radius 10 y |
| Sacred Shield | 24 | Conviction | Timed buff | 15 flat | Cast, 15 frames |
| Final Judgment | 30 | Sacred Shield | Direct-melee (nuke) | 12 +1/2 | Weapon attack frames; 25-frame cooldown |

#### Scaling constants

| Skill | Scaled stat | base | 2–8 | 9–16 | 17–22 | 23+ | Secondary effects (linear) |
|---|---|---|---|---|---|---|---|
| Iron Strike | ED% | 20 | +8 | +10 | +12 | +14 | +AR: 20% + 9%/lvl |
| Holy Fire | — | — | — | — | — | — | Converts 50% phys→fire; fire portion ED%: 30 + 2.5/lvl |
| Sanctuary Wall | — | — | — | — | — | — | +block: 4% + 1%/lvl (total block cap 75%) |
| Hammer of Virtue | Magic dmg min | 10 | +5 | +8 | +11 | +14 | Spiral speed fixed; magic damage — reduced only by magic res, ignores physical DR |
| Hammer of Virtue | Magic dmg max | 14 | +7 | +10 | +14 | +18 | |
| Vengeance | — | — | — | — | — | — | Each of fire/cold/ltng: 35% + 5%/lvl of physical dealt; +AR 10%/lvl |
| Conviction | — | — | — | — | — | — | Enemy −all res: 20 + 3/lvl, cap −85; enemy −def 30% fixed; 1/5 effect vs broken immunities |
| Sacred Shield | Flat phys DR | 4 | +1 | +2 | +2 | +3 | +def: 50% + 10%/lvl; duration 3000 frames + 300/lvl |
| Final Judgment | Added magic min | 60 | +25 | +35 | +45 | +55 | Deals 100% weapon dmg + added magic |
| Final Judgment | Added magic max | 110 | +40 | +55 | +70 | +85 | |

#### Worked values and synergies

| Skill | slvl 1 | slvl 10 | slvl 20 | slvl 30 | Synergies |
|---|---|---|---|---|---|
| Iron Strike | +20% ED | +96% | +204% | +340% | — |
| Hammer of Virtue | 10–14 magic | 61–83 | 153–199 | 287–361 | Sanctuary Wall: +5% magic dmg per hard point |
| Sacred Shield | DR 4 | 15 | 35 | 63 | Vengeance: +3% defense per hard point |
| Final Judgment | 60–110 magic | 305–500 | 695–1110 | 1225–1930 | Conviction: +10% dmg per hard point |

### Tree 3 — Last Bastion (7 skills)

#### Structure and costs

| Skill | Row | Prereq | Category | Mana | Frame notes |
|---|---|---|---|---|---|
| Toughness | 1 | — | Passive | — | Always on |
| Shield Mastery | 1 | — | Passive | — | Always on; requires shield equipped |
| Thorns | 6 | Toughness | Passive (damage return) | — | Returns on melee hits taken |
| Defiance | 6 | Shield Mastery | Aura | Free (toggle) | One aura active |
| Resist Aura | 12 | Defiance | Aura | Free (toggle) | One aura active |
| Holy Armor | 18 | Resist Aura | Timed buff | 12 flat | Cast, 15 frames |
| Elemental Barrier | 24 | Holy Armor | Passive | — | Always on |

#### Scaling constants

| Skill | Scaled stat | base | 2–8 | 9–16 | 17–22 | 23+ | Secondary effects (linear) |
|---|---|---|---|---|---|---|---|
| Toughness | — | — | — | — | — | — | +5% defense per hard point |
| Shield Mastery | — | — | — | — | — | — | +block: 4% + 1%/lvl; shield def: +15% + 10%/lvl |
| Thorns | — | — | — | — | — | — | Return: 50% + 15%/lvl of received melee physical |
| Defiance | — | — | — | — | — | — | Party +def%: 60 + 10/lvl; radius 7.5 y + 0.6 y/lvl |
| Resist Aura | — | — | — | — | — | — | Party +all res: 18 + 2/lvl; radius 7.5 y + 0.6 y/lvl |
| Holy Armor | Flat defense | 80 | +30 | +40 | +50 | +60 | DR: 8% + 0.5%/lvl, cap 20%; duration 3600 frames + 300/lvl |
| Elemental Barrier | — | — | — | — | — | — | +1% max all res per 4 hard points, cap +5% (slvl 20) |

#### Worked values and synergies

| Skill | slvl 1 | slvl 10 | slvl 20 | slvl 30 | Synergies |
|---|---|---|---|---|---|
| Thorns | 50% return | 185% | 335% | 485% | — |
| Resist Aura | +18% res | +36% | +56% | +76% | Shield Mastery: +2% res per hard point (max +40) |
| Holy Armor | 80 def | 370 | 810 | 1390 | — |

(Thorns and Resist Aura are linear — `50 + 15·(slvl−1)` and `18 + 2·(slvl−1)` respectively.)

---

## Arcanist (23 skills)

Elemental-caster archetype: pure spell damage, no weapon dependency. Numbers are absolute
spell damage — the highest raw values in the game, balanced by 1 life/vit and base AR 95
(see `class-identities.md`). Base cast animation 14 frames at 0% FCR.

### Tree 1 — Thermal (10 skills)

#### Structure and costs

| Skill | Row | Prereq | Category | Mana | Frame notes |
|---|---|---|---|---|---|
| Fire Bolt | 1 | — | Projectile (fire) | 2 flat | Cast, 14 frames |
| Ice Bolt | 1 | — | Projectile (cold, pierces) | 2 flat | Cast, 14 frames |
| Fireball | 6 | Fire Bolt | Projectile (fire, AoE burst 2 y) | 5 +1/2 | Cast, 14 frames |
| Frost Nova | 6 | Ice Bolt | AoE nova (cold) | 9 +1/2 | Cast, 14 frames; radius 6.6 y fixed |
| Flame Wall | 12 | Fireball | AoE wall (fire) | 12 +1/1 | Cast, 14 frames; NHD 4 frames |
| Fire Mastery | 18 | Flame Wall | Passive | — | Always on |
| Blizzard | 18 | Frost Nova | AoE storm (cold) | 20 +1/1 | Cast, 14 frames; one bolt per 4 frames in 6 y radius; NHD 4 |
| Cold Mastery | 24 | Blizzard | Passive | — | Always on; 1/5 effect vs broken immunities |
| Meteor | 24 | Fire Mastery | AoE (fire, delayed) | 15 +1/1 | Cast, 14 frames; 30-frame impact delay; brief stun on impact |
| Immolation | 30 | Meteor | Channeled (fire beam) | 10/s +1/2 per s | 12-frame channel start, then per-tick; NHD 4; breaks on move |

#### Scaling constants

| Skill | Scaled stat | base | 2–8 | 9–16 | 17–22 | 23+ | Secondary effects (linear) |
|---|---|---|---|---|---|---|---|
| Fire Bolt | Fire dmg min | 3 | +2 | +3 | +4 | +5 | |
| Fire Bolt | Fire dmg max | 7 | +3 | +5 | +7 | +9 | |
| Ice Bolt | Cold dmg min | 2 | +2 | +3 | +4 | +5 | Chill: 100 frames + 12/lvl |
| Ice Bolt | Cold dmg max | 5 | +3 | +4 | +6 | +8 | |
| Fireball | Fire dmg min | 8 | +5 | +8 | +11 | +14 | Burst radius 2 y fixed |
| Fireball | Fire dmg max | 16 | +8 | +12 | +16 | +20 | |
| Frost Nova | Cold dmg min | 6 | +3 | +5 | +7 | +9 | Chill: 100 frames + 8/lvl |
| Frost Nova | Cold dmg max | 12 | +5 | +8 | +11 | +14 | |
| Flame Wall | Fire dmg/s | 30 | +12 | +20 | +28 | +36 | Duration 100 frames + 5/lvl; wall length 6 y |
| Fire Mastery | — | — | — | — | — | — | +fire dmg%: 28 + 7/lvl (multiplies all Thermal fire skills) |
| Blizzard | Cold dmg/bolt min | 40 | +12 | +20 | +28 | +36 | Duration 100 frames fixed |
| Blizzard | Cold dmg/bolt max | 65 | +20 | +32 | +44 | +56 | |
| Cold Mastery | — | — | — | — | — | — | Enemy −cold res: 18 + 4/lvl |
| Meteor | Impact fire min | 70 | +20 | +32 | +44 | +56 | Burn: 25/s + 8/lvl over 75 frames |
| Meteor | Impact fire max | 95 | +28 | +44 | +60 | +76 | |
| Immolation | Fire dmg/s | 90 | +30 | +48 | +66 | +84 | Beam range 12 y |

#### Worked values and synergies

| Skill | slvl 1 | slvl 10 | slvl 20 | slvl 30 | Synergies |
|---|---|---|---|---|---|
| Fire Bolt | 3–7 | 23–38 | 57–96 | 105–182 | — |
| Ice Bolt | 2–5 | 22–34 | 56–82 | 104–158 | — |
| Fireball | 8–16 | 59–96 | 151–232 | 285–424 | Fire Bolt: +10% dmg per hard point |
| Frost Nova | 6–12 | 37–63 | 95–155 | 181–289 | Ice Bolt: +7% dmg per hard point |
| Flame Wall | 30/s | 154/s | 386/s | 730/s | — |
| Blizzard | 40–65/bolt | 164–269 | 396–637 | 740–1173 | Fire Mastery: +2% duration per hard point |
| Meteor | 70–95 impact | 274–379 | 642–883 | 1178–1611 | Cold Mastery: +5% dmg per hard point |
| Immolation | 90/s | 396/s | 948/s | 1752/s | Fire Mastery: +7% dmg per hard point |

### Tree 2 — Galvanic (7 skills)

#### Structure and costs

| Skill | Row | Prereq | Category | Mana | Frame notes |
|---|---|---|---|---|---|
| Spark | 1 | — | Projectile (lightning) | 2 flat | Cast, 14 frames |
| Chain Bolt | 6 | Spark | Projectile (chains) | 4 +1/1 | Cast, 14 frames; 5 targets, −10% dmg per jump |
| Nova | 12 | Chain Bolt | AoE nova (lightning) | 15 +1/1 | Cast, 14 frames; radius 8 y fixed; single pulse |
| Static Field | 12 | Chain Bolt | AoE (percent-HP) | 9 flat | Cast, 14 frames |
| Lightning Mastery | 18 | Nova | Passive | — | Always on |
| Thunder Storm | 24 | Lightning Mastery | Timed buff (periodic bolt) | 19 flat | Cast once; bolts auto-target in 12 y |
| Arc Beam | 30 | Thunder Storm | Channeled (pierces) | 12/s +1/2 per s | 12-frame channel start; beam pierces along 15 y line; NHD 4 |

#### Scaling constants

| Skill | Scaled stat | base | 2–8 | 9–16 | 17–22 | 23+ | Secondary effects (linear) |
|---|---|---|---|---|---|---|---|
| Spark | Ltng dmg max | 9 | +5 | +8 | +11 | +14 | Min fixed at 1 (lightning convention) |
| Chain Bolt | Ltng dmg max | 20 | +8 | +12 | +16 | +20 | Min fixed at 1 |
| Nova | Ltng dmg min | 1 | +3 | +5 | +7 | +9 | |
| Nova | Ltng dmg max | 32 | +9 | +14 | +19 | +24 | |
| Static Field | — | — | — | — | — | — | Fixed 25% of current HP (lightning type; **no** damage scaling, **no** synergies). Radius 3.3 y + 0.3 y/lvl. HP floor: none (Normal), 33% (NM), 50% (Hell) |
| Lightning Mastery | — | — | — | — | — | — | +ltng dmg%: 25 + 7/lvl; +1% FCR per 2 hard points, cap +10 |
| Thunder Storm | Bolt ltng min | 20 | +8 | +12 | +16 | +20 | Interval 88 frames − 2/lvl (floor 44); duration 800 frames + 200/lvl |
| Thunder Storm | Bolt ltng max | 100 | +28 | +44 | +60 | +76 | |
| Arc Beam | Ltng dmg/s | 100 | +32 | +52 | +72 | +92 | |

#### Worked values and synergies

| Skill | slvl 1 | slvl 10 | slvl 20 | slvl 30 | Synergies |
|---|---|---|---|---|---|
| Spark | 1–9 | 1–60 | 1–152 | 1–286 | — |
| Chain Bolt | 1–20 | 1–100 | 1–236 | 1–428 | Spark: +8% dmg per hard point |
| Nova | 1–32 | 32–123 | 90–283 | 176–513 | — |
| Thunder Storm | 20–100/bolt | 100–384 | 236–888 | 428–1616 | Static Field: +5% dmg per hard point |
| Arc Beam | 100/s | 428/s | 1028/s | 1908/s | Lightning Mastery: +8% dmg per hard point |

### Tree 3 — Entropic (6 skills)

#### Structure and costs

| Skill | Row | Prereq | Category | Mana | Frame notes |
|---|---|---|---|---|---|
| Toxic Cloud | 1 | — | AoE wall (poison DoT) | 4 flat | Cast, 14 frames; cloud lingers 75 frames |
| Curse Bolt | 6 | Toxic Cloud | Projectile (magic + debuff) | 4 +1/2 | Cast, 14 frames |
| Entropy Wave | 12 | Curse Bolt | Curse (cone debuff) | 8 flat | Cast, 14 frames; cone 60°, 8 y; one curse active per target |
| Poison Mastery | 18 | Entropy Wave | Passive | — | Always on |
| Necro Blast | 24 | Poison Mastery | Corpse-consumer | 15 +1/2 | Cast, 14 frames; requires corpse in 8 y |
| Void Storm | 30 | Necro Blast | AoE storm (poison + magic) | 30 flat | Cast once; pulse every 12 frames for 200 frames; radius 10 y; NHD 4 |

#### Scaling constants

| Skill | Scaled stat | base | 2–8 | 9–16 | 17–22 | 23+ | Secondary effects (linear) |
|---|---|---|---|---|---|---|---|
| Toxic Cloud | Poison total | 12 | +8 | +14 | +20 | +26 | Delivered over 75 frames + 5/lvl (poison rate rules per `combat-resolution.md`) |
| Curse Bolt | Magic dmg min | 8 | +4 | +7 | +10 | +13 | Debuff: −10% all res for 100 frames (fixed) |
| Curse Bolt | Magic dmg max | 14 | +7 | +11 | +15 | +19 | |
| Entropy Wave | — | — | — | — | — | — | Enemy −AR: 15% + 2%/lvl, cap −60; enemy −all res: 8% + 1%/lvl, cap −30; duration 150 frames + 10/lvl |
| Poison Mastery | — | — | — | — | — | — | +poison and magic dmg%: 20 + 6/lvl; +5% poison duration/lvl |
| Necro Blast | — | — | — | — | — | — | 60–100% of corpse max HP as fire (fixed %; no 5-segment scaling — scales with monster HP). Radius 2.6 y + 0.13 y/lvl, cap 6 y |
| Void Storm | Magic dmg/pulse min | 25 | +10 | +16 | +22 | +28 | Adds poison: 40 + 15/lvl total over 50 frames |
| Void Storm | Magic dmg/pulse max | 40 | +16 | +26 | +36 | +46 | |

#### Worked values and synergies

| Skill | slvl 1 | slvl 10 | slvl 20 | slvl 30 | Synergies |
|---|---|---|---|---|---|
| Toxic Cloud | 12 psn | 96 | 260 | 508 | — |
| Curse Bolt | 8–14 magic | 50–85 | 132–211 | 256–393 | Toxic Cloud: +5% dmg per hard point |
| Necro Blast | 60–100% corpse HP | — | — | — | Entropy Wave: +3% radius per hard point |
| Void Storm | 25–40/pulse | 127–204 | 311–504 | 579–904 | Poison Mastery: +10% dmg per hard point |

---

## Balance notes

- **Warden vs. Arcanist curves.** Warden ED% values (Zeal's Focus +272%, Glorious Charge
  +705% at slvl 30) multiply weapon damage; with endgame weapons this tracks the
  Arcanist's flat spell numbers. Final Judgment's 1225–1930 added magic is cooldown-gated
  (25 frames) as the melee "ultimate" counterweight to Immolation/Arc Beam sustained DPS.
- **Mastery passives** (Fire/Lightning/Cold/Poison) are the Arcanist's late multiplier;
  worked values above do **not** include mastery or synergy contributions.
- **Static Field** is intentionally outside the scaling framework (fixed 25% current HP,
  difficulty floors) — see `class-identities.md` note; do not add synergies to it.
- All worked values become golden-test fixtures when `src/sim/data/skills.ts` lands
  (Phase 3 per `05-implementation/phase-3-classes-complete.md`).

## Backlog — remaining 5 classes

Skill lists for these classes exist as tree outlines in `class-identities.md`; node-level
data (and `skill-tree-explorer.html` entries) are authored when each class enters Phase 3.

| Class | Trees | Planned nodes |
|---|---|---|
| Shadow | Machinist / Veil-Weaver / Iron Dance | ~26 (10/8/8) |
| Berserker | War-Maker / War Cry / Iron Grip | ~27 (10/8/9) |
| Skin-Shifter | Primal Form / Bleed-Touched / Pack-Tender | ~25 (8/9/8) |
| Reaper | Soul-Caller / Fading Word / Bone-Chill | ~26 (8/9/9) |
| Eternal | Glyph-Forge / Blessed Edge / Eternal Body | ~24 (8/9/7) |
