# R3 — Combat Resolution & Monster Systems (D2/D2R Mechanics Reference)

Engineering reference for a deterministic 25 Hz combat simulation. All mechanics documented
as facts about the Diablo II / D2:R engine (patch 1.10+ / D2R 2.4–2.6 unless noted).
The engine's logic tick is **25 frames per second**; every duration below is expressed in
frames (1 frame = 40 ms) or seconds (× 25 for frames). Damage-over-time is internally
tracked in **bits**: `1 hit point = 256 bits` (fixed-point 1/256 resolution).

IP note: only mechanics/formulas are documented. Names appearing below are archetype labels
or 1–2 grounding examples per concept, not a content database.

---

## 1. Hit Resolution Order (Melee / Ranged Attacks)

### 1.1 Sequence per attack event

```
1. Attacker performs attack animation; on the action frame:
2. HIT CHECK  — roll chance-to-hit (AR vs Defense + level factor)      [skipped by "always hits" skills]
3. BLOCK CHECK — defender rolls chance-to-block (if attack is blockable)
4. DODGE/AVOID/EVADE CHECK — class-specific passive avoidance rolls
5. DAMAGE RESOLUTION:
   a. Crushing Blow (fraction of CURRENT life, applied first — see §3)
   b. Physical damage (after target physical resist / DR% / flat DR)
   c. Elemental adds (after target resists / flat MDR)
   d. On-hit procs: Open Wounds roll, knockback, hit-blinds, hit-causes-flee,
      chill/freeze application, mana burn, leech accrual, CtC-on-striking skills
6. Target reaction: hit recovery / stun / knockback animation checks (§15)
```

Order of block vs dodge: block is checked **after** the hit check succeeds but **before**
Dodge/Avoid/Evade (Maxroll block mechanics). A blocked or dodged attack deals no damage and
triggers no on-hit effects.

### 1.2 Chance to hit

```
ChanceToHit = 200% * ( AR / (AR + DEF) ) * ( alvl / (alvl + dlvl) )
ChanceToHit = clamp(ChanceToHit, 5%, 95%)      // truncated, then clamped
```

- `AR` = attacker's attack rating, `DEF` = defender's effective defense.
- `alvl`/`dlvl` = attacker/defender **level** (character level or mlvl). Same formula for
  PvM, MvP, PvP. Both factors asymptote below 1.0, so the level term dominates when AR is
  large — level gaps are harder to overcome than defense.
- **Running defender ⇒ hit check auto-succeeds (100%)**; defense is effectively 0 while
  running. Block and dodge checks still run. Walking keeps full defense and full block.
- Base AR (players): `(DEX - 7) * 5 + class_constant` (constants ≈ −15 … +20). +flat AR
  applies before +%AR multipliers.

### 1.3 Defense pipeline (order of operations)

```
DEF = floor( (base_item_def [+ED% etc.] + flat_def + DEX/4) * (1 + Σ ±def%) )
      + defense_vs_melee / defense_vs_missile (flat, applied after everything)
```

- `-% target defense` (on attacker's gear) applies **last** and at **half effect** vs
  players, hirelings, super uniques, and act bosses.
- `Ignore Target's Defense` sets DEF = 0 for the hit check, but **does not work** vs
  players, hirelings, champions, uniques, super uniques, act bosses (only normal
  monsters and minions).
- Self-buffs that zero own defense (berserk-type skill) reduce the check to the pure
  level-ratio term.

### 1.4 Spells vs attack-rating skills

- **Spells never roll the hit check** — they hit on collision/geometry (missile must
  physically intersect the target; nova/AoE hits anything in the area). Defense has no
  effect on elemental/magic/poison spells.
- **Weapon-delivered skills** (almost all melee skills, bow/javelin physical skills) DO
  roll the AR check.
- **"Always hits" attacks** (no AR check even though weapon-based): homing-missile bow
  skill (Guided Arrow archetype), shield-bash skill (Smite archetype), javelin
  lightning-release skills. These still require missile collision.
- **Partial hit-check skills**: some hybrid arrows/javelins land the *skill* (elemental)
  effect without a hit check but need a successful roll for the *weapon* damage portion
  (exploding/freezing arrow archetype, poison javelin archetype).
- Blockability is a separate flag from "always hits": e.g. the homing arrow can be
  blocked; the shield-bash cannot be blocked.

### 1.5 Blocking

```
CtB = min( floor( total_block% * (DEX - 15) / (clvl * 2) ), 75% )     // players
running: CtB' = CtB / 3   (effective cap 25%)
```

- `total_block%` = shield base block + class block factor (+20/+25/+30 by class) +
  "Increased Chance of Blocking" bonuses.
- Cap **75%** standing/walking/attacking; running divides by 3.
- **Blockable**: melee attacks, physical missiles (arrows/bolts/thrown), missiles with a
  physical component, death explosions of exploder-type monsters, fire-enchanted death
  explosion, monster charge attacks.
- **Not blockable**: pure elemental/magic spells (with a handful of listed exceptions),
  corpse-explosion-type damage, radial spell damage.
- **Block lock**: a successful block plays a block animation during which no other action
  is possible; frames set by Faster Block Rate breakpoints
  (`EFBR = floor(FBR*120/(FBR+120))`, diminishing-returns table). Chained blocks can
  animation-lock the defender.
- **Monsters block too**: per-difficulty `%block` in monster stats; used only if the
  monster has a shield/block animation (or a special flag). Typical values 9–55%; act
  bosses have per-difficulty block (e.g. 40/45/55). Structural rule: monsters generally
  cannot block while in their own attack animation.

**Sources:** https://maxroll.gg/d2/resources/hit-chance-mechanics ·
https://maxroll.gg/d2/resources/block-mechanics ·
https://www.purediablo.com/strategy/diablo-2-guide-facts-and-formulae-archive ·
https://diablo2.diablowiki.net/Blocking

---

## 2. Damage Pipeline (Physical Weapon Damage)

Exact order — each step's output feeds the next:

```
W0   = base weapon min/max                       // ethereal: base *= 1.5 (floor)
W1   = floor( W0 * (100 + ED_on_weapon%) / 100 ) // "local"/on-weapon enhanced damage
W2   = W1 + flat_adds                            // "+X-Y damage" from jewels/charms/gear
                                                 //   added AFTER local ED, BEFORE off-weapon %
OFF% = STR/DEX damage bonus + skill ED% + aura ED% + off-weapon item ED%
       + %damage-to-demons/undead (always counts as off-weapon, even if on the weapon)
W3   = floor( W2 * (100 + OFF%) / 100 )          // single additive off-weapon bucket
CRIT : if crit roll succeeds → W4 = W3 * 2       // physical only, once, never ×4 (see below)
CONV : skill converts a % of physical → element   // AFTER crit; converted part keeps the doubling,
                                                 //   is not boosted by +%skill damage/synergies
ELEM : + flat elemental/poison adds from gear/skills/charms  // NOT doubled by crit
TARGET SIDE: physical part *= (1 - phys_resist%) then -flat DR;
             each element *= (1 - resist%) then -flat MDR (see §9)
```

Key rules:

- **Stat damage bonus**: generally `1% per point` of the governing stat; the governing
  stat and ratio are **per weapon class** (melee = STR 100%; bows = DEX 100%; some
  hybrids use 75% STR + 75% DEX; some weapons use STR+DEX mixes). This is data-driven
  per weapon type.
- Because flat `+damage` enters *before* the off-weapon multiplier, big flat-damage
  weapon mods are multiplied by the whole STR/skill/aura bucket (the well-known
  "flat damage on weapon scales with everything" effect).
- **Critical/Deadly Strike** (§2.1) doubles **physical damage only** — flat elemental
  adds and pure-element skill damage are unaffected.
- Off-weapon flat elemental damage from items applies to attacks (and, per source type,
  to some skills), each element resolved independently against its resist.

### 2.1 Critical doubling — stacking rule (verified)

- Sources of "double physical damage": item **Deadly Strike**, class passive
  **Critical Strike** (bow class passive), claw-mastery-type passives, weapon-mastery
  passives.
- **They never stack to ×4.** Each source rolls independently, but subsequent sources
  only roll if the previous one failed; at most one doubling per attack.
- Combined effective chance (multiplicative complement):

```
P(double) = 1 - Π_i (1 - p_i)
// two sources: 100 - (100-DS)*(100-CS)/100
```

- DS% from items is additive across equipped items (dual-wield: only striking-weapon DS
  plus non-weapon DS counts for that swing).
- Exception (engine quirk): certain AI units (barbarian-type hireling, valkyrie, iron
  golem) have a separate innate 5% crit that rolls *regardless*, so ×4 is possible for
  those units only.
- Crit applies to skills that convert physical→element (conversion after doubling); a
  short list of skills is excluded (shield bash, kick skills, impale-type).

**Sources:** https://maxroll.gg/d2/resources/damage-calculation ·
https://d2runewizard.com/articles/mechanics/damage-calculation ·
https://diablo2.diablowiki.net/Deadly_Strike ·
https://maxroll.gg/d2/resources/attack-modifiers

---

## 3. Crushing Blow

Chance-on-hit (additive across items, cap 100%) to remove a fraction of the target's
**current** life, applied **before** the attack's regular damage (since 1.10).

| Target | Melee | Ranged |
|---|---|---|
| Normal monster / minion | 1/4 | 1/8 |
| Champion / Unique / Super Unique / Act boss | 1/8 | 1/16 |
| Player / hireling | 1/10 | 1/20 |

- **Player-count scaling**: CB damage is divided by the same multiplier that scales
  monster HP: `CB = fraction * currentHP / (0.5 + 0.5 * N)` (N = players in game). Net
  effect: CB removes a constant fraction of the monster's *base-HP-equivalent*.
- **Physical resistance applies only if positive.** Negative physical resist (amp-type
  curses) does **not** amplify CB beyond bringing resist up to 0.
- **Flat "Damage Reduced by X" does not reduce CB** (percent DR / phys resist does).
- Critical/Deadly Strike does not double CB.
- Because it is fraction-of-current-HP, CB has geometric decay: it can never kill by
  itself (regular damage kills), and successive CBs remove less absolute HP.
- Applied before regular damage ⇒ the same swing's weapon damage hits the already-reduced
  HP pool.

**Sources:** https://maxroll.gg/d2/resources/attack-modifiers ·
https://diablo2.diablowiki.net/Crushing_blow ·
https://www.theamazonbasin.com/wiki/index.php/Crushing_Blow

---

## 4. Open Wounds

Chance-on-hit (additive across items; dual-wield: striking weapon + non-weapon items) to
apply an 8-second bleed = **200 frames** (no drain on the first frame ⇒ 199 draining
frames). While active, the bleed also **zeroes the target's HP regeneration**.

### 4.1 Damage per frame (attacker clvl piecewise, in 1/256 HP units)

```
bits_per_frame(clvl):
  1  ≤ clvl ≤ 15 :  9*clvl +   31
  16 ≤ clvl ≤ 30 : 18*clvl -  104
  31 ≤ clvl ≤ 45 : 27*clvl -  374
  46 ≤ clvl ≤ 60 : 36*clvl -  779
  61 ≤ clvl ≤ 99 : 45*clvl - 1319

HP_per_frame  = bits_per_frame / 256        // rounded DOWN to nearest bit
HP_per_second = HP_per_frame * 25
Total ≈ HP_per_frame * 200
```

Example: clvl 50 → (36·50−779)/256 = 3.98 HP/frame ≈ 99.7 HP/s ≈ 797.6 total.

### 4.2 Target multipliers

| Target | Multiplier |
|---|---|
| Normal monster / minion | ×1 |
| Champion / Unique / Super Unique / Act boss | ×1/2 |
| Player, melee trigger | ×1/4 |
| Player, ranged trigger | ×1/8 |

### 4.3 Rules

- **No stacking.** Re-application **replaces** the current bleed entirely (timer reset to
  200 frames, new attacker's values used — even if lower).
- The drain is negative-regen, **not damage**: it bypasses all damage reduction and
  resists; duration cannot be shortened (cleansing-type effects don't help); flat
  life-replenish counteracts it directly.
- Vs monsters it only applies if the hit dealt damage (or the target regenerates); vs
  players it applies on any successful hit.
- Does not apply through certain indirect skill missiles (e.g. the *extra* arrows of a
  multi-shot skill, trap-blade skills).
- **D2R 2.4**: no formula change — patch clarified tooltips to show that OW/CB/DS chances
  from multiple items are **cumulative** (additive). Later D2R patches (through 2.6) left
  the legacy 1.10 formula intact.

**Sources:** https://maxroll.gg/d2/resources/attack-modifiers ·
https://www.purediablo.com/diablo-2/open-wounds ·
https://diablo2.diablowiki.net/Open_Wounds ·
https://maxroll.gg/d2/news/d2r-patch-2-4-final-patch-notes

---

## 5. Poison

### 5.1 Rate-over-frames model

Poison is stored as `(rate_in_bits_per_frame, length_in_frames)`.

```
1 HP = 256 bits;  1 second = 25 frames
display: "X poison damage over Y seconds"  ⇔  rate = X*256/(Y*25), length = Y*25
bits/frame → HP/s : rate * 25 / 256
```

All conversions round **down** to whole bits and whole frames (display values therefore
contain rounding error; the engine works only in bits/frames).

### 5.2 Building the applied poison (multiple sources on the attacker)

- **Multiple equipped items**: rates **add**, lengths are **averaged**.
- **Prefix+suffix on the same item**: rates add AND lengths add (single-source rule).
- Socketables (gems/jewels/runes) each count as separate items for the average.
- Skill poisons: skill-specific; a poison-weapon buff skill (venom archetype) adds its
  rate to item rates but **overrides length** to its own short fixed length (10 frames),
  except versus specific poison skills whose lengths it does not override.

### 5.3 Application / stacking on the target (override rule)

- One poison instance per source-class on a target; **poison does not stack** from
  repeated hits.
- On poisoning an already-poisoned target: new poison applies for 1 frame; then
  - if `new_rate ≥ current_rate` → new poison **replaces** (rate and remaining length),
  - else → current poison continues.
  ⇒ Fast low-rate hits can clobber nothing; slow high-rate applications dominate.
- Target's **poison resist reduces the rate** (not the length): `rate *= (1 - PR)`.
  PR ≥ 100 ⇒ immune; PR floor −100% (doubles rate).
- Poison **stops monster HP regeneration** while ≥ 1 bit/frame is applied.
- Poison reduces players only to 1 HP (cannot deliver the killing blow to a player);
  it can kill monsters/hirelings/pets.

### 5.4 Poison Length Reduction (PLR)

- "Poison Length Reduced by X%" stacks **additively** across items/auras
  (cleansing-aura and fade-type skills add), **cap 75%**.
- PR% does not affect duration; PLR does not affect rate.
- Difficulty penalty exists on received poison length (see Uncertainties — commonly
  modeled as an effective PLR penalty in NM/Hell, making up to 175% nominal PLR useful
  in Hell).

**Sources:** https://maxroll.gg/d2/resources/poison-damage ·
https://diablo2.diablowiki.net/Guide:Calculating_Poison_Damage_v1.10,_by_onderduiker ·
https://www.purediablo.com/forums/threads/stacking-poison-length-reduction.78594/

---

## 6. Cold: Chill, Freeze, Cold Length

### 6.1 Chill (cold length)

- Any cold damage applies **Cold Length** (source-defined, 1–10 s typical) which applies
  the Chilled state = **50% slow** (attack rate −50, velocity −50) for the duration.
- Re-application replaces the current length only if the new length is **≥** the current.
  Cold lengths from multiple *equipped items* add together on the attacker side.
- **Difficulty penalty (dealt by players/hirelings/pets):** cold length is
  **50% in Nightmare, 25% in Hell**.
- **Chill Effectiveness** (per-monster stat) caps the slow% actually applied:
  a monster at −10 CE receives max 10% slow from cold/holy-freeze sources; **0 CE = cannot
  be chilled at all**. Typical monster CE: **−50 Normal / −40 Nightmare / −33 Hell**;
  players/hirelings/pets have 50. Some archetypes (heavy elite melee, wisp-type ranged)
  have 0 CE in Hell.
- Defender-side reductions (players): cold resist % reduces chill/freeze *length*
  proportionally; **Half Freeze Duration** halves it (does **not** stack from multiple
  items); **Cannot Be Frozen** blocks chill/freeze entirely (but not non-cold slows like
  holy-freeze aura or decrepify-type curse). Total slow on a player is capped at 50%; on
  monsters at 90%.
- Chilled/frozen monsters have a **20% chance to shatter on death** (no corpse ⇒ corpse
  skills can't use it).

### 6.2 Freeze

- Only sources flagged **"freezes target"** (specific skills, +freeze item property)
  freeze; plain cold damage never does.
- **Only normal monsters and minions can be frozen.** Champions/uniques/super
  uniques/act bosses are chilled instead ("cannot be frozen" demotion). Frozen units
  cannot act at all.
- Item "Freezes Target (+B)" mechanics:

```
chance% = 50 + 5 * ( alvl + 4*B - dlvl )      // alvl-6 for ranged; chance/3 for ranged
duration_frames = clamp( (chance - roll) * 2 + 25, 25, 250 )    // 1–10 s
```

- Freeze length suffers the same NM/Hell 50%/25% dealer penalty and defender cold-resist
  /HFD/CBF reductions. Freeze and chill coexist (freeze runs first, chill remainder).

### 6.3 Cold mastery vs immunes

- The sorceress cold-pierce passive is a **pierce** (`-enemy cold resist`), NOT an
  immunity breaker: it does nothing to a cold-immune monster unless the immunity is
  already broken by a curse/aura/sunder.
- **D2R 2.6 change**: once an immunity is broken by another source, pierce now also
  applies at only **1/5 effectiveness** vs that originally-immune monster (pre-2.6 it
  applied at full value after a break — a major behavioral difference).

**Sources:** https://maxroll.gg/d2/resources/crowd-control ·
https://www.theamazonbasin.com/wiki/index.php/Cold_Damage ·
https://www.theamazonbasin.com/wiki/index.php/Chill_effectiveness ·
https://maxroll.gg/d2/resources/immunities

---

## 7. Monster Resistances & Immunities

- Six resist channels: physical, magic, fire, lightning, cold, poison. Per-monster,
  per-difficulty values in monster data.
- **Immune ⇔ resist > 99%** (displayed as "Immune to X"). Monsters may exceed 100
  (e.g. 110–140) — the overage matters for breaking.
- **Resist floor: −100%** (max damage amplification ×2 on that channel).
- **Breaking immunities**: only 4 skill effects can push a resist below 100 —
  conviction-type aura (fire/cold/light), lower-resist curse (fire/cold/light/poison),
  amplify-damage curse (physical −100), decrepify curse (physical −50).
  Against an **immune** channel these apply at **1/5 effectiveness** — permanently for
  that originally-immune monster, even after the immunity is broken by another source:

```
required_reduction = (resist - 99) * 5      // e.g. 140% fire ⇒ need 205 nominal
```

  Breakers **stack** with each other (aura + curse), each at 1/5 vs the immune channel.
- **Non-breaking reductions**: `-% enemy resistance` gear (facet-type) and masteries
  (pierce) apply **only when not immune** (or after a break); full value normally.
- **Application order** (fixed): `Sunder charms → Curses → Auras → -%enemy-resist → Pierce`.
- **Sunder charms (D2R 2.5+)**: carried charm per channel; if the monster is immune to
  that channel, its resist is **set to 95%** for that attacker. Breakers still act at 1/5
  afterward; -%enemy-resist gear then applies at full effect (pierce at 1/5 since 2.6).
- Magic resist is normally unreducible (no curse/aura lowers it; only the magic sunder).
- **Physical**: monsters may be physical-immune; player %DR caps at 50 (see §9). A
  sanctuary-type aura sets *undead* physical resist to 0 for that attacker's hits (not
  for CB).

**Sources:** https://maxroll.gg/d2/resources/immunities ·
https://www.purediablo.com/strategy/monster-resistances-immunities-guide ·
https://diablo-archive.fandom.com/wiki/Lower_Resist_(Diablo_II)

---

## 8. Life / Mana Leech

```
life_gained = physical_damage_actually_dealt * leech% * difficulty_penalty * drain_effectiveness
```

- Basis is **physical damage dealt to the target after all target-side reductions**
  (phys resist, DR). Elemental/magic/poison damage never leeches. Skill damage-transfer
  penalties (e.g. multi-arrow 3/4 weapon damage) shrink the basis.
- **Difficulty penalty: Normal ×1, Nightmare ×1/2, Hell ×1/3** (applies to life AND mana
  leech). (Classic doc phrasing: "cut in 1/2 in Nightmare, cut 2/3 in Hell".)
- **Drain effectiveness**: per-monster, per-difficulty stat (0–100%+).
  - `0%` ⇒ unleechable regardless of damage. Most **undead** archetypes (skeletal &
    ghost types) and construct-type units have 0; many demons have reduced (e.g. 50%)
    values in higher difficulties. This is data-driven per monster, not a strict
    category rule — model it as a `drain` column.
- Result < 1 (after all multipliers) rounds down to 0 — tiny leech on penalized skills
  yields nothing.
- Life-tap-type curse (50% of physical dealt returned as life) **ignores** the difficulty
  penalty and drain effectiveness; "+X life after each kill" is flat and unaffected.
- Mana leech mirrors life leech; monster "mana burn" mod drains player mana (§11).

**Sources:** https://maxroll.gg/d2/resources/life-mana-mechanics ·
https://classic.battle.net/diablo2exp/basics/characters/statprereqs.shtml ·
https://wiki.projectdiablo2.com/wiki/Game_Mechanics (cross-check)

---

## 9. Damage Reduction (Defender Side)

Application order per hit, per channel:

```
physical: dmg → *(1 - phys_resist_or_DR%)  → - flat_DR   → floor
elemental/magic: dmg → *(1 - resist%)      → - flat_MDR  → floor
```

- **%DR ("Damage Reduced by %") caps at 50% for players/hirelings.** Monsters have no
  such cap (physical resist can reach immunity).
- **Flat DR ("Damage Reduced by X")**: subtracts after %, per hit. Does not reduce
  crushing blow (§3) or open wounds (§4).
- **Flat MDR ("Magic Damage Reduced by X")**: subtracts from magic **and** fire/cold/
  lightning hits after resists; does not apply to physical. Poison interaction: in
  1.10+, MDR/PLR handle poison via length/rate rules, not per-frame flat subtraction
  (pre-1.10 per-frame application was removed — see Uncertainties).
- Resists (player) cap at 75 by default (85 with +max gear); difficulty penalty to player
  resists: 0 / −40 / −100 (N/NM/Hell).
- Negative physical resist on a monster (amp-type curses) multiplies physical damage
  taken up to the −100 floor (×2).

**Sources:** https://maxroll.gg/d2/resources/damage-calculation ·
https://diablo2.diablowiki.net/Damage_Reduction ·
https://maxroll.gg/d2/resources/immunities

---

## 10. Curse & Aura Interaction Rules (Structural)

### Curses

- **Exactly one curse per unit.** Casting a new curse **overrides** the existing one
  (full replacement, no queue).
- Override priority exception: the three **AI curses** (blind-area, confuse, attract
  archetypes) cannot be overwritten by *non-AI* curses; attract cannot be overwritten by
  confuse; a specific partial ordering exists among the AI curses (attract > confuse >
  blind for overwrite resistance).
- Radius trickery ≠ stacking: big-radius curse then small-radius curse simply re-curses
  the overlapping units.
- Curse-like non-curses stack with curses: screen-darkening skill (cloak archetype) and
  war-cry defense debuff are *not* curses and coexist. Monster "possessed" champions are
  curse-immune but not immune to those.
- **Duration vs difficulty**: curse durations against monsters are reduced in higher
  difficulties (commonly cited ×1/2 NM, ×1/4 Hell; classic doc guarantees at least the
  AI-curse halving in NM — see Uncertainties).

### Auras

- Auras are continuous pulsed states from a source unit; they apply while in radius.
- **Same aura from different units does not stack — highest slvl wins.** (A monster's
  higher-level conviction suppresses a player's conviction on shared targets.)
- **Different auras stack freely** (one active *selected* aura per paladin-type unit, but
  a unit can be affected by many different auras at once from many sources).
- **Item-granted auras on one wearer**: two items granting the same aura on the *same*
  unit add their levels (15+15 ⇒ level 30); an item aura vs the unit's native same aura
  does not add — higher wins.
- Auras are not curses: aura debuffs (conviction) stack with a curse (lower resist).

**Sources:** https://classic.battle.net/diablo2exp/skills/necromancer-curses.shtml ·
https://www.theamazonbasin.com/wiki/index.php/Curse ·
https://www.purediablo.com/forums/threads/stacking-curses.126074/ ·
https://diablo2.io/forums/stacking-auras-questions-t1278517.html

---

## 11. Monster Taxonomy & Elite Modifier System

### 11.1 Tiers

| Tier | Spawn | Level bonus | HP mult (N/NM/H) | XP mult | Notes |
|---|---|---|---|---|---|
| Normal | trash population | — | ×1 | ×1 | |
| Minion | spawns around a unique | +3 (as boss) | ×2 / ×1.75 / ×1.5 | ×5 | inherits some boss mods |
| Champion | packs of 2–4 (20% of elite packs) | +2 | ×3 / ×2.5 / ×2 | ×3 (berserker ×5) | 5 subtypes |
| Unique (random boss) | 80% of elite packs; 3–6 minions | +3 | ×4 / ×3 / ×2 | ×5 | random mods 1/2/3 |
| Super Unique | fixed spawn points, preset name/mods | own fixed level tables | preset | ×5 | +1 random mod NM, +2 Hell |
| Act boss / prime evil | scripted encounter | fixed per difficulty | preset (very large) | preset | all mods preset; no random mods |

Shared elite rules: only minions can be *frozen* (elites get chilled); stun has only a
**10% chance to apply** to champions/uniques (full length if it lands); ignore-target's-
defense does not work on elites (§1.3).

### 11.2 Champion subtypes (all but one of a pack are plain champions; last rolls 1 of 5)

| Subtype | Damage (N/NM/H) | AR (N/NM/H) | Distinctive |
|---|---|---|---|
| Champion | +90/75/66% | +67/56/49% | +20 velocity |
| Ghostly | +90/75/66% | +67/56/49% | translucent; cold damage rider; physical resist **set to 80%** (displays as "immune") |
| Fanatic | +90/75/66% | +67/56/49% | +100 velocity, faster attack, −70% defense |
| Berserker | +270/225/198% | +270/225/198% | life only 75/62.5/50% of champion base (glass cannon) |
| Possessed | +90/75/66% | +67/56/49% | life ×6/×5/×4 of base (double champion); curse-immune |

### 11.3 Unique (random boss) modifier pool

Random mods per difficulty: **1 Normal / 2 Nightmare / 3 Hell**. Resist-granting mods are
skipped if they would create a 3rd immunity or pile onto 2+ existing immunities. Minions
inherit the marked (†) mods at reduced strength.

| Modifier | Mechanical effect |
|---|---|
| Extra Strong † | dmg +135/112/99%, AR +90/75/66% (N/NM/H); minions half strength |
| Extra Fast † | +100 velocity (boss and minions); faster attack |
| Cursed | on the boss's hit: 75% chance to cast amp-damage curse, level `mlvl/5 + 1` |
| Magic Resistant | +40% each to fire/cold/light resist (each applied only if resist < 100); not rolled in Normal |
| Fire Enchanted † | +66% min/+100% max fire dmg; +75% fire res; **death explosion** (half phys/half fire) sized off a normal monster's base life (%, radius grows with difficulty); minions +33–50% fire dmg in NM/H |
| Cold Enchanted † | +66/+100% cold dmg; +75% cold res; chill length `4 + 0.2*mlvl` s; **death nova** (cold) at level `mlvl/2`; minions +33–50% cold dmg NM/H |
| Lightning Enchanted † | +66/+100% light dmg; +75% light res; **when struck**: releases 8 charged bolts at level `mlvl/2`, `2*lvl−1` dmg each; minions +33–50% light dmg NM/H |
| Mana Burn † | +66/+100% mana-drain damage on hit; +20% magic res; (legacy bug: melee mana damage ×256) |
| Spectral Hit | +40% fire/cold/light res (each if < 75); each hit randomly one of magic/fire/light/cold/poison +66/+100% dmg |
| Stone Skin | +50% physical resist; **base defense doubled** (before %def modifiers) — can create/harden physical immunity |
| Multiple Shots | missile attacks release 3× missiles (only missile-capable monsters) |
| Teleportation | teleports to target when HP < 30% (also heals some life) or when a ranged boss has an adjacent enemy |
| Aura Enchanted † | grants one offensive/party aura: might (mlvl/6), holy-fire (mlvl/6), blessed-aim (mlvl/5), holy-freeze (mlvl/7), holy-shock (mlvl/8, mlvl≥20), conviction (mlvl/8), fanaticism (mlvl/8); min level 1; radiates to minions |

Minion pack size: uniques spawn with 3–6 minions (superuniques have fixed counts,
+1 in NM, +2 in Hell).

**Sources:** https://classic.battle.net/diablo2exp/monsters/bonus.shtml ·
https://diablo2.diablowiki.net/Monster_modifier ·
https://maxroll.gg/d2/resources/elite-monster ·
https://www.purediablo.com/diablo-2/monster-modifiers

---

## 12. Monster Stats Model (mlvl, scaling, player count)

### 12.1 Monster level (mlvl)

- **Normal difficulty**: mlvl is a fixed per-monster value from monster data; area level
  is irrelevant to stats.
- **Nightmare/Hell (1.10+)**: `mlvl = area_level` for normal monsters;
  champions `alvl + 2`; uniques & their minions `alvl + 3`.
- **Exceptions**: super uniques, act bosses (and special event monsters) always keep
  their own fixed per-difficulty levels regardless of area.
- mlvl drives: HP, damage, AR, defense, XP (via level→stat base tables), to-hit rolls
  (level term in §1.2), and loot quality inputs.

### 12.2 Stat derivation (data schema)

The engine uses two tables:

```
MonLvl[difficulty][level] → base HP, defense (AC), AR (TH), XP, min/max damage
MonStats[monster][difficulty] → percentage multipliers per stat + resists, drain,
                                chill_effectiveness, velocity/run, block%, AI params,
                                per-difficulty elemental damage riders
final_stat = MonLvl[diff][mlvl].stat * MonStats[monster][diff].stat% / 100
```

Elemental damage on attacks is a per-difficulty data field (higher difficulties both add
elemental riders to more monsters and raise their magnitudes); it is not derived from a
global formula.

### 12.3 Difficulty scaling (players side of the ledger)

Per-difficulty global effects: player resists −0/−40/−100; leech penalty ×1/½/⅓ (§8);
player-dealt cold/freeze length ×1/½/¼ (§6); curse durations reduced (§10); XP curve
unchanged but mlvls much higher.

### 12.4 Player-count scaling (verified)

```
HP  = base * (N + 1) / 2            // +50% of base per extra player (1.10+)
XP  = base * (N + 1) / 2            // identical multiplier
DMG = base * (1 + 0.0625 * (N - 1)) // +6.25% per extra player (max +43.75% at 8)
AR  = base * (1 + 0.0625 * (N - 1))
```

- Applied at **spawn time** — changing player count doesn't retro-scale live monsters.
- Defense and resistances do **not** scale with player count.
- (Loot: no-drop probability shrinks at N = 3/5/7 — out of scope here.)

### 12.5 Experience award model

```
xp_awarded = base_xp(mlvl) * tier_mult * players_mult * level_diff_mult * party_split
tier_mult: champion ×3 (berserker ×5), unique/superunique/minion ×5
level_diff_mult: 100% within ±5 levels of clvl;
  monster below: 6→81%, 7→62%, 8→43%, 9→24%, ≥10→5%
  monster above: xp * clvl/mlvl; ≥10 above → 2%
clvl ≥ 70: additional global XP multiplier table (95.31% @70 … 0.59% @98)
party: +35% total if partied in same area, split ∝ member level
```

**Sources:** https://diablo2.diablowiki.net/Area_Level ·
https://www.purediablo.com/diablo-2/diablo-2-area-levels ·
https://maxroll.gg/d2/resources/player-settings ·
https://maxroll.gg/d2/resources/experience ·
https://classic.battle.net/diablo2exp/basics/experience.shtml

---

## 13. Hell Immunity Distribution (Design Pattern)

- Each monster family has a **primary resistance matching its own damage theme** that
  ramps with difficulty (e.g. a fire-demon family: 70% fire resist in Normal → 120% in
  Hell ⇒ immune). Secondary resists ramp more slowly.
- In Hell, **nearly every monster is immune to at least one channel** (often two); only a
  small set has none.
- Distribution intent: (a) no single damage type can clear everything — hybrid damage or
  immunity-breaking support is required; (b) each zone's spawn pool is curated so most
  zones remain farmable by *some* mono-element build (players seek out "no X-immune"
  zones); (c) physical immunity is rarer than elemental immunity but does occur, and can
  be *created* by random mods (stone-skin on high-phys-resist base, ghostly champions);
  (d) dual immunity to a build's both elements is possible but uncommon per zone.
- Random elite resist mods are constrained to avoid triple immunity (§11.3), preserving
  the "always some way in" rule for elites.
- Poison and magic immunity exist but are concentrated in specific families (undead
  bias for poison immunity); magic damage has the fewest immune monsters (hence
  magic-damage builds as "immune-proof" fallback).

**Sources:** https://maxroll.gg/d2/resources/immunities ·
https://www.purediablo.com/strategy/monster-resistances-immunities-guide

---

## 14. Monster AI Archetypes

D2 AI is proximity-driven: no threat table. Each monster has an **awareness radius**
(`aidist` data field, engine-capped) plus AI parameters (per difficulty) controlling
decision cadence, flee thresholds, and skill usage odds. Monsters generally target the
**closest valid enemy** (player, hireling, or summon). Blind effects work by shrinking
awareness radius to melee range and restricting the unit to its default attack (normally
only effective vs normal/minion tiers).

Archetypes (structural patterns, 1–2 grounding examples each):

| Archetype | Behavior contract |
|---|---|
| Melee rusher | run toward nearest enemy, attack in melee; may have charge attack (auto-hit charge is blockable) |
| Pack coward | small melee units that **flee for ~1–2 s when any nearby death occurs**, then re-engage; blocked flee path ⇒ keep fighting (fallen-type) |
| Kiting ranged | ranged attacker that retreats/backpedals when an enemy closes to short range, re-opens distance, resumes firing (archer/spitter types) |
| Caster | keeps distance, fires spell missiles on cooldown-ish cadence; some teleport-blink when approached (wisp-type) |
| Summoner/buffer | non-fleeing support unit that **revives dead pack members of its own kind** (revived give no XP and no loot; unlimited re-revives) and/or fires its own missile; boss-tier versions can revive other summoners (shaman-revive pattern). Counter-play: corpse removal (shatter, corpse-consuming skills) |
| Reviver (generic) | any monster with a "resurrects X" flag can raise the matching class anywhere nearby — same mechanism as shaman pattern |
| Suicide bomber | sprints at target; arms when within ~2 yd of a valid target and detonates after ~1 s; explosion is physical(+element), **blockable/dodgeable**, always "hits" in radius; deals no damage to hirelings/summons; awards XP only if killed before detonating (exploder-type) |
| Enrager | elite support that converts pack members into suicide bombers / buffs them (overseer pattern) |
| Burrower/ambusher | hidden until proximity trigger, then surfaces and engages |
| Boss AI | scripted skill sets; typical patterns: teleport when target is distant or when surrounded (also used by the Teleportation elite mod: teleport+partial heal below 30% HP), summon adds, ground-denial spells, enrage timers absent — pacing via high HP and hit-recovery immunity (§15) |

Movement: monster data has separate **walk and run velocities**; some species never run
(heavy units), fleeing units use run velocity; +velocity elite mods add to both. Champion
+20 / fanatic +100 / extra-fast +100 velocity (§11).

**Sources:** https://diablo2.diablowiki.net/Fallen ·
https://diablo2.diablowiki.net/Suicide_Minion ·
https://d2mods.info/forum/viewtopic.php?t=58396 (aidist) ·
https://maxroll.gg/d2/resources/crowd-control (blind/awareness)

---

## 15. Hit Recovery, Stun, Knockback, Size Classes

### 15.1 Hit recovery (flinch)

- **Players**: a hit that removes more than **1/12 of max HP** puts the character into
  the hit-recovery animation (uninterruptible until finished; FHR breakpoints shorten
  it). Repeated qualifying hits ⇒ stun-lock. A finer-grained model from disassembly work
  gives probabilistic bands (≈37.5% flinch chance at ~1/16 max HP, ≈75% between 1/8 and
  1/4, 100% above) — see Uncertainties for which to implement.
- **Monsters**: same concept; hit-recovery frames are per-monster data. Elites resist
  stun (below) but still flinch.
- **Act bosses**: cannot be stunned; each successful hit *during* what would be stun
  forces hit recovery instead — except units flagged fully hit-recovery-immune (top-tier
  act boss), which never flinch.
- Frames counted at 25 fps; FHR uses the standard diminishing-returns breakpoint scheme
  (`EFHR = floor(FHR*120/(FHR+120))` family).

### 15.2 Stun

- Stun length from skills, cap **10 s**; new stun **replaces** the current timer.
- Normal/minion: always applies. **Champion/unique/super unique: 10% chance** to apply
  (full length if it lands). Act bosses/static objects: never.
- Stunned players aren't frozen in place; they are instead forced into hit recovery on
  every hit while stun length runs (even zero-damage hits).

### 15.3 Knockback & size classes

- Every monster has a **size class 1/2/3 (small/medium/large)**. Gear knockback chance:

| Size | Chance |
|---|---|
| 1 (small) | 100% |
| 2 (medium) | 50% |
| 3 (large) | 25% |
| bosses / immovable | 0% |

- On success: target is displaced up to **3 sub-tiles** away from the attack direction
  and put into hit recovery. Not applied if the target is frozen or the hit kills.
- **Skill-based knockback is always 100%** vs any knockback-susceptible target
  (bash/leap archetypes); the size table applies only to the item property.
- Knockback does not stack (binary property).
- Immune: act bosses, uber-tier, ancient-tier super uniques, player golems/vines/spirit
  summons; individual exceptions exist per monster (data-driven flag + KB animation
  presence).
- Elite interaction: stun/cold durations are halved vs super uniques; freeze demoted to
  chill for all elite tiers (§6.2, §11.1).

**Sources:** https://www.theamazonbasin.com/wiki/index.php/Knockback ·
https://maxroll.gg/d2/resources/attack-modifiers ·
https://maxroll.gg/d2/resources/crowd-control ·
https://www.mannm.org/d2library/faqtoids/fhr_eng.html

---

## Uncertainties & Conflicts (flag for implementation decisions)

1. **Block vs Dodge order** — Maxroll (D2R) states block is checked before
   dodge/avoid/evade; some legacy 1.09-era guides list dodge first. Implement
   hit → block → dodge (modern source), keep swappable.
2. **Hit-recovery threshold** — the simple `damage > maxHP/12` rule vs mannm.org's
   probabilistic bands (37.5%/75%/100% at 1/16, 1/8–1/4, >1/4). The banded model comes
   from code analysis and is likely the ground truth; the 1/12 rule is the common
   approximation. Choose one; note D2R 2.4 also adjusted FHR breakpoint tables for one
   class weapon pairing (animation-level, not rule-level).
3. **Curse duration vs difficulty** — classic official doc guarantees AI-curse halving
   in NM; several difficulty guides claim all curse durations are ×1/2 NM and ×1/4 Hell.
   Exact per-curse behavior unverified against code; implement as global multiplier with
   per-curse override capability.
4. **Poison length difficulty penalty** — "Hell poison length ≈ 2× Normal without PLR /
   up to 175% PLR useful in Hell" is asserted in forum-verified tests and Median XL docs,
   but the vanilla mechanism (effective PLR penalty −50/−100?) is not confirmed by a
   primary source. Flagged.
5. **Flat MDR vs poison** — pre-1.10 flat MDR applied per poison frame; 1.10+ behavior
   (no per-frame application) is widely reported but not primary-sourced here.
6. **Crushing blow & flat DR** — Maxroll says flat "Damage Reduced by X" does NOT reduce
   CB; a few legacy sources apply DR in PvP CB calculations. Adopted Maxroll.
7. **Extra Strong exact numbers** — community-tested values (+135/112/99% dmg) come from
   Arreat Summit tables; some forum sources quote slightly different minion shares
   (half vs 75%). Adopted Arreat Summit (half for minions).
8. **Player-count damage scaling scope** — the +6.25%/player applies to monster damage
   and AR per Maxroll; whether elemental riders scale identically with physical is not
   explicitly separated in sources (assumed: all attack damage).
9. **Elemental-enchant death effects** — fire-enchanted explosion percentages/radii are
   Arreat-Summit-era numbers; D2R 2.4 patched the notorious FE death-damage bug
   (pre-D2R the explosion could apply a huge bugged extra physical component). If
   emulating post-2.4, use the listed intended values.
10. **Poison PLR cap** — 75% cap confirmed by testing threads; one older source claims a
    95% cap. Adopted 75%.
11. **d2r.world** — checked; it carries item/area/breakpoint tables but no combat
    formula pages, so it contributed only breakpoint/area-level context
    (`/en-US/info/character/fcr-fhr-fbr`, `/en-US/info/monster/arealevel`).
12. **Freeze duration formula** — `50 + 5*(alvl + 4B − dlvl)`, duration
    `(chance−roll)*2+25` frames is from Basin-derived documentation; not
    double-confirmed by a second independent code-level source.
