# Combat Resolution

> Full hit resolution order, damage pipeline, special effects. All frame-accurate at 25 Hz.
> Sources canonicalized from `doc/research/r3-combat-monsters.md`; contested values
> re-verified against live references (footnotes per section).

## Hit resolution order (melee/ranged attacks)

Canonical pipeline — one order, no variants:

```
1. Attack Rating check → miss/hit
   - Roll AR vs Defense (see stats-and-formulas → CTH formula)
   - Spells skip this check entirely (they hit on collision/geometry)
   - "Always hits" weapon skills skip it too, but still require missile collision
   - Running defender: the hit check auto-succeeds
   - If miss: no further processing; play miss animation
2. Block check (defender)
   - Roll totalBlock% (cap 75%; running: totalBlock / 3, effective cap 25%)
   - Blockable: melee attacks, physical missiles (arrows/bolts/thrown), missiles with a
     physical component, monster charge attacks, certain death explosions. Pure
     elemental/magic spells are not blockable (short exception list is data-driven)
   - If blocked: play block animation (FBR frames), zero damage, no on-hit effects
3. Dodge/avoid/evade check (class defensive passives)
   - Rolled after a hit passes the block check; an avoided attack deals no damage and
     triggers no on-hit effects
4. Damage resolution
   a. Crushing Blow (fraction of CURRENT life, applied before regular damage)
   b. Physical damage (flat DR → %DR/physical resist)
   c. Elemental damage per channel (flat MDR → resist% → absorb)
   d. On-hit riders: Open Wounds roll, chill/freeze application, mana burn, leech
      accrual, knockback, chance-to-cast-on-striking procs
5. Target reaction: hit-recovery / stun / knockback animation checks
```

The block-before-dodge order is the modern verified order; legacy 1.09-era guides listed
dodge first and are superseded. *Verified against maxroll.gg block-mechanics, 2026-07.*

## Damage pipeline

```
preSkillDamage = weaponDamageRange * (100 + onWeaponED%) / 100 + flatDamage

offWeaponED% = strBonus% + skillPercentBonus% + auraPercentBonus%
              + offWeaponPercentBonus%

baseDamage = preSkillDamage * (100 + offWeaponED%) / 100

criticalCheck:
  if roll(deadlyStrike% or criticalStrike%):  -- they don't stack; max one doubling
    baseDamage *= 2                            -- only physical portion is doubled
  -- Deadly Strike vs Critical Strike: sequential rolls, max one, never ×4
  -- CS from passive skills checks first, then DS from items if no CS proc

finalPhysical = (baseDamage - targetFlatDR) * (100 - targetDRpct) / 100
  -- flat DR first, then %DR / physical resist (player %DR hard cap 50%)
  -- flat DR does NOT reduce Crushing Blow or Open Wounds

elementalDamage: each element computed separately (flat adds are never crit-doubled)
  finalEle = (eleBase - targetFlatMDR) * (100 - targetResist%) / 100
  then absorb (see Damage reduction)
```

**Order per channel:** flat DR/MDR → % resist (or %DR) → % absorb (hard cap 40%) → flat
absorb (no cap). Absorb first **heals the defender for the absorbed amount** (capped by
max life), then subtracts it from the damage — each absorbed point is worth two points of
effective life. *Order and the 40% percentage-absorb cap verified against maxroll.gg
damage-reductions, 2026-07.*

**Poison damage:** delivered as rate-over-frames. Item format: `damage * rate / frames`. Multiple sources: if same rate class (items), average rates + sum durations. Override rule: if a new source has >= rate, it overwrites the active poison; else it's ignored.

**Cold damage (chill):** every cold hit applies its source-defined cold length; the
Chilled state is a 50% slow (attack rate and velocity) for the duration.

```
chillFrames = baseColdFrames * dealerDivisor * (100 - targetColdRes) / 100
  dealerDivisor (player/hireling/pet-dealt only): ×1 Normal, ×1/2 Nightmare, ×1/4 Hell
```

- Re-application replaces the active chill only if the new length ≥ the remaining length;
  cold lengths from multiple equipped items add on the attacker side.
- Defender-side: cold resist reduces length proportionally (above); **Half Freeze
  Duration** halves it once (does not stack); **Cannot Be Frozen** blocks chill and
  freeze entirely (but not non-cold slows).
- Monster **chill effectiveness** stat caps the slow actually applied (typical −50
  Normal / −40 NM / −33 Hell; 0 = cannot be chilled). Total slow cap: 50% on players,
  90% on monsters.
- Chilled/frozen monsters have a 20% chance to shatter on death (no corpse).

**Freeze:** only sources flagged "freezes target" freeze; plain cold damage never does.
Only normal monsters and minions can be frozen — champions/uniques/superuniques/act
bosses are chilled instead. Frozen units cannot act for the duration; freeze runs first,
then any remaining chill. Item `Freezes Target (+B)`:

```
chance% = 50 + 5 * (alvl + 4*B - dlvl)      -- ranged: use alvl - 6, then chance / 3
freezeFrames = clamp((chance - roll) * 2 + 25, 25, 250)   -- 1 to 10 s
```

Freeze length takes the same NM/Hell dealer divisors and defender-side reductions as
chill.

## Crushing Blow

Chance-on-hit (additive across items, cap 100%) to remove a fraction of the target's
**current** life, applied **before** the same swing's regular damage:

| Target | Melee | Ranged |
|---|:---:|:---:|
| Normal monster / minion | 1/4 | 1/8 |
| Champion / unique / superunique / act boss | 1/8 | 1/16 |
| Player / hireling | 1/10 | 1/20 |

```
CBdamage = currentHP * CBfraction / (0.5 + 0.5 * players)   -- player-count divisor
```

- Physical resistance applies only if positive (negative phys resist does not amplify CB)
- Flat "Damage Reduced by X" does NOT reduce CB; %DR does
- Never doubled by Critical/Deadly Strike
- Fraction-of-current-HP ⇒ geometric decay; CB alone can never kill

## Open Wounds

Frame-based bleed damage (per 200 frame cycle = 8 seconds), in 1/256 HP units per frame:

```
clvl 1-15:    (9 * clvl + 31) / 256 per frame
clvl 16-30:   (18 * clvl - 104) / 256 per frame
clvl 31-45:   (27 * clvl - 374) / 256 per frame
clvl 46-60:   (36 * clvl - 779) / 256 per frame
clvl 61-99:   (45 * clvl - 1319) / 256 per frame
```

Duration: 200 frames (8 seconds). Non-stacking: re-application replaces the bleed and
resets the timer. Target multipliers: normal monster ×1; champion/unique/superunique/act
boss ×1/2; player ×1/4 (melee trigger) or ×1/8 (ranged trigger). The drain is
negative-regen, not damage: it bypasses all damage reduction and resists, and it zeroes
the target's HP regeneration while active.

## Leech

```
leeched = finalPhysicalDamage * leech% / 100 * drainEffectiveness
  * difficultyPenalty * PvPPenalty
```

Where:
- `drainEffectiveness` = monster drain stat % (0 = no leech)
- `difficultyPenalty`: Normal 1.0, Nightmare 0.5, Hell 0.33
- `PvPPenalty`: 0.5 — **LEECH-ONLY.** This ×0.5 applies to life/mana leech vs players and
  is a *separate* factor from the PvP **damage** penalty (×0.17 = 1/6, applied first, before
  resists/block). Do not conflate. See `pvp.md` for the damage penalty and full PvP pipeline.
  (Value active only under Phase 6 duels / hostility.)

## Damage reduction

```
Physical:  (damage - flatDR) * (100 - DR%) / 100     -- %DR hard cap 50% (players)
Elemental: (damage - flatMDR) * (100 - resist%) / 100
Absorb:    %absorb first (hard cap 40%), then flat absorb (no cap);
           each heals for the absorbed amount (capped by max life), then reduces damage
```

Flat DR/MDR is heavily penalized (1/25 effect) against damage-over-time skill ticks.

## Hit Recovery

Trigger: a single hit deals more than `maxHP / 12` (8.33% of max HP). FHR breakpoints
determine animation frame count (lower frames = faster recovery; tables in
`stats-and-formulas.md`). Recovery state: locks other actions; damage still taken during
recovery frames; no interrupt on hit-while-recovering.

## Knockback

```
KBtrigger: on any weapon attack hit (melee or ranged)
KBdistance: 3.75 yards (≈8.5 frames movement at run speed)
  -- halved vs large targets
  -- no KB vs massive targets
```

Knockback pushes the target away from the attacker and briefly stuns (0-3 frames) depending on target size.

## Monster hit resolution differences

- Monsters use the same CTH formula with their internal AR vs player defense
- Monsters have hidden chance to hit recovery (based on HP% threshold, typically 1/12)
- Champion/unique: reduced chance to be in hitrecovery (lower)
