# Classes & Skills

> Seven classes × 3 trees each, synergy system, +skills mechanics, skill point economy.
> Each class identity per `04-content-bible/class-identities.md`. Sources canonicalized
> from `doc/research/r5-classes-skills.md`.

## Skill tree structure

Each tree: 6 tier rows (level gates 1/6/12/18/24/30), ~4-6 skills per tree, ~30 per class.
Layout: 3 columns × 6 rows with prerequisite arrows. First skill in row 1 is always
unlocked (1 point). Each skill requires N points spent in the tree and possibly specific
prereq skills.

```
Example tree (Warden — Oath-Keeper):
Row 1:  [Holy Spark]──[Keeper's Mark]
             │
Row 6:  [Radiant Aura]──[Smiting Bolt]
             │             │
Row 12: [Fervent Focus]──[Glorious Charge]──[Strength of Oath]
             │
Row 18: [Blessed Ground]──[Beacon of Hope]
             │
Row 24: [Wings of the Keeper]
             │
Row 30: [Last Stand]
```

All 7 class tree maps defined in `class-identities.md` mechanical outlines.
Full skill data table in `src/sim/data/skills.ts`.

## Skill mechanics taxonomy

| Category | Behavior | Implemented as |
|---|---|---|
| Direct-melee | Weapon-based melee attacks; uses weapon damage + skill ED% | Skill → attack roll → apply damage |
| Projectile | Ranged missile; may pierce (if pierce % from skill) or split at target | Spawn missile entity → travel → hit |
| AoE nova | Point-blank radial damage; can be cold (chill), lightning, poison | AoE find entities in radius → apply per-entity |
| AoE wall | Lingering area effect on ground (fire wall, poison cloud) | Place area entity → each tick → apply to entities within |
| Channeled | Continuous effect while key held; mana per tick; breaks on move | Skill 'concentrate per tick' flag on intent |
| Charge-up | Buff applies stack; at N stacks, finisher skill consumes them | Per-stack buff; finisher reads stack count → clears |
| Summon | Spawn N minions from corpse or nothing; stat cap, diminishing returns model `6 + floor(slvl / 3)` — higher levels add diminishingly | Spawn entities with stats scaling from skill table |
| Curse | Apply debuff to target; one curse active on target at a time (override) | Apply effect; replace if same type from same source |
| Aura | Persistent buff in radius; one active aura per character | Field entity; each tick apply to entities within radius |
| Warcry | Party buff, radius, duration (frames) | Apply effect to self+party for N ticks |
| Shapeshift | Transform into form with own stat multipliers + skill lockout | Apply form overrides; freeze gear-derived stats |
| Trap | Deployable proximity mine entity; arms after short delay; can have N out | Place entity; arming timer; explode on proximity |
| Passive | Always-active stat improvement: crit %, dodge %, pierce %, mastery % | Additive stat modifier applied when derived stats computed |
| Corpse-consumer | Use nearby corpse as resource; corpse explosion = % of corpse's max HP | Find corpse entity in radius → consume → effect |
| Teleport | Movement skill that consumes mana; range-gated (max 45 yards at slvl 20) | Instant position change; no pathing needed; cooldown |

## Scaling math (5-segment piecewise)

Damage per skill level uses the following framework:

```ts
function skillDamage(slvl: number, base: number, perLevel: number,
                     softMid: number, softHigh: number, softMax: number): number {
  if (slvl <= 1) return base;
  if (slvl <= 8) return base + (slvl - 1) * perLevel;
  if (slvl <= 16) return base + 7 * perLevel + (slvl - 8) * softMid;
  if (slvl <= 22) return base + 7 * perLevel + 8 * softMid + (slvl - 16) * softHigh;
  // 23+
  return base + 7 * perLevel + 8 * softMid + 6 * softHigh + (slvl - 22) * softMax;
}
```

Where `perLevel`, `softMid`, `softHigh`, `softMax` are per-skill constants from the `skills` table.
Some utility skills (duration, radius, AR) use simpler linear scaling, documented in the table.

The concrete per-skill constants for all 7 classes are catalogued in
`doc/04-content-bible/skill-data.md` (content bible owns the rows; this section owns the
framework and the segment boundaries).

Mana cost scaling:

```ts
mana = baseMana + floor(perLevelMana * (slvl - 1) / manaDivisor)
```

## Synergy system

- Each skill row lists synergies: `{ donor: SkillId, stat: StatId, perHardPoint: number }`
- Synergy bonus = `perHardPoint * hardPointsInDonor`
- Only **hard skill points** count (not +skills from gear)
- Synergy stat is added to the skill's damage/duration/effect after skill-level scaling
- Magnitude range: typically 2-16% per hard point

## +Skills mechanics

| Source | Type | Applies to |
|---|---|---|
| +all skills | Additive | Every skill | yes |
| +class skills | Additive | All skills of one class | yes |
| +tree skills | Additive | All skills in one class tree | yes |
| +single skill | Additive | One specific skill | yes |
| oskill (item-granted) | Separate | Adds a skill charge with fixed slvl | no base level |

Soft points (from gear) count for skill effect but NOT for:
- Prerequisite satisfaction (can't unlock a skill via gear)
- Synergy contribution

Hard cap: no formal cap (base 20 + gear). In practice, gear provides up to +15 total.

## Skill point economy

| Source | Points |
|---|---|
| Level 1 → 99 | 98 |
| Quest rewards (all difficulties) | 12 (4 × 3 difficulties: skill point @ act 1, act 2, act 4, act 5) |
| **Total** | **110** |

- Respec: 3 free respecs via quest reward (act 1 equivalent)
- Token of absolution: crafted from 4 act boss essences
- Combined respec (skills + stats) per D2R approach, for simplicity

## Next-Hit Delay (NHD)

Certain AoE skills have a 4-frame (0.16 s) NHD: the same entity cannot be damaged by the
same skill instance again within 4 ticks. This prevents multi-hit from a single casting.

Skills with NHD: fast-tick AoEs (screen-area cold storms, lingering ground flames,
traveling storm AoEs). NHD status tracked per-entity per-skill-source.

## Charges & procs

- **Chance to cast on striking:** checked on each melee hit; % from item mod; independent of %
- **Chance to cast on attack:** checked on any weapon swing (even if miss)
- **Chance to cast when struck:** checked when hit; same mechanics
- **Chance to cast on kill:** checked on monster death
- **Charged skills:** item-granted skills with limited uses (rechargeable)
- **Level scaling of proc:** fixed level from item; cannot be boosted by +skills

## Mana-shield pattern (defensive conversion)

Documented pattern for mana-as-life skills (e.g. the Reaper's spirit-form):

```
damageTakenByMana = damage * ESConversion% / 100
damageTakenByLife = damage * (100 - ESConversion%) / 100
```

With the designated utility-skill synergy: each hard point in the donor skill reduces
mana damage by `-0.0625` (up to `-1.25` at 20), meaning the shield absorbs more of each
point of damage per synergy. Final damage-to-mana =
`damage * ((100 - synergyReduction) / 100) * (ES% / 100)`.

## Staffmods

Class-specific items (wands, orbs, staves, claws, etc.) may roll +1-3 to a random class
skill as an automod. The tier of skills available depends on ilvl (see `items-and-affixes.md`).
