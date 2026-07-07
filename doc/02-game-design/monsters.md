# Monsters

> Monster system: taxonomy, stats model, champion/unique modifiers, AI archetypes.
> Sources canonicalized from `doc/research/r3-combat-monsters.md` and
> `r4-world-progression.md`. Monster roster per `04-content-bible/monster-roster.md`.

## Monster tiers

| Tier | Level bonus (NM/Hell) | HP mult (N/NM/H) | XP mult | Notes |
|---|---|---|---|---|
| Normal | mlvl = alvl | ×1 | ×1 | trash population |
| Minion | +3 (as its boss) | ×2 / ×1.75 / ×1.5 | ×5 | spawns around a unique; inherits marked mods at half strength |
| Champion | +2 | ×3 / ×2.5 / ×2 | ×3 (Berserker subtype ×5) | packs of 2–4; 5 subtypes |
| Unique | +3 | ×4 / ×3 / ×2 | ×5 | 80% of elite packs; 3–6 minions; random mods 1/2/3 (N/NM/H) |
| Superunique | fixed per difficulty | preset | ×5 | fixed spawn point, preset mods; +1 random mod NM, +2 Hell |
| Act boss | fixed per difficulty | preset (per-boss row) | preset | scripted encounter; all mods preset |

Damage/AR bonuses for champions and uniques come from the subtype/modifier tables below,
not from a flat tier multiplier.

## Monster stats model

**Monster level (mlvl) — canonical rule:**

- **Normal difficulty:** mlvl is a fixed per-monster value in the `monsters` table; the
  zone's alvl only affects loot quality.
- **Nightmare/Hell:** `mlvl = alvl` for regular monsters and their spawn variants;
  champions `alvl + 2`; uniques and their minions `alvl + 3`.
- **Exceptions:** superuniques and act bosses always keep their own fixed per-difficulty
  levels regardless of area.

The Hell alvl band table in `difficulty-progression.md` is **area data** (which alvl each
zone gets); this rule is how a monster's mlvl is derived from it.

**Stat derivation (data schema):**

```
MonLvl[difficulty][mlvl]        → base HP, defense, AR, XP, min/max damage
MonStats[monster][difficulty]   → % multipliers per stat + resists, drain,
                                  chillEffectiveness, walk/run velocity, block%,
                                  damageRegen, AI params, elemental attack riders
finalStat = MonLvl[diff][mlvl].stat * MonStats[monster][diff].stat% / 100

hp = finalHP * (players + 1) / 2 * tierMult        -- snapshot at spawn
xp = finalXP * tierMult * (players + 1) / 2
damage/AR = base * (1 + 0.0625 * (players - 1))    -- defense/resists never player-scale
```

## Monster HP regeneration

```
regenPerFrame = maxHP * damageRegen / 4096    -- HP tracked in 1/256 units;
                                              -- minimum 1 bit/frame when damageRegen > 0
```

`damageRegen` is a per-monster, per-difficulty data column: 0 = no regen, 2 = typical
(≈1.2% of max HP per second), 3–5 for high-regen designs; act bosses use elevated values
as an anti-chip mechanic. Regeneration is zeroed while poison (≥1 bit/frame) or an Open
Wounds bleed is active, and by the prevent-monster-heal item mod for that target.
*Verified against the DamageRegen field documentation (Phrozen Keep d2mods.info /
PureDiablo forums), 2026-07.*

## Champion subtypes

A champion pack is all plain champions except the last member, which rolls 1 of 5
subtypes. Damage/AR bonuses are per difficulty (N/NM/H):

| Subtype | Damage | AR | Distinctive |
|---|---|---|---|
| Champion | +90/75/66% | +67/56/49% | +20 velocity |
| Ghostly | +90/75/66% | +67/56/49% | translucent; cold damage rider on hits; physical resist set to 80% (displays as immune) |
| Fanatic | +90/75/66% | +67/56/49% | +100 velocity, faster attack, −70% defense |
| Berserker | +270/225/198% | +270/225/198% | life only 75/62.5/50% of champion base (glass cannon); XP ×5 |
| Possessed | +90/75/66% | +67/56/49% | life ×6/×5/×4 of base (double champion); immune to curses |

## Unique modifier system

Random mods per difficulty: **1 Normal / 2 Nightmare / 3 Hell**. Resist-granting mods are
skipped if they would create a third immunity or stack onto 2+ existing immunities.
Minions (3–6 per unique) inherit the marked (†) mods at half strength.

| Mod | Effect | Available |
|---|---|---|
| Extra Strong † | +135/112/99% dmg, +90/75/66% AR (N/NM/H) | All |
| Extra Fast † | +100 velocity, faster attack rate | All |
| Cursed | on the boss's hit: 75% chance to cast the physical-vulnerability curse at level `mlvl/5 + 1` | All |
| Magic Resistant | +40% each to fire/cold/lightning resist (each applied only if resist < 100) | NM+ |
| Fire Enchanted † | +66% min / +100% max fire dmg; +75% fire res; death explosion (half physical / half fire, % of a normal monster's base life, radius grows with difficulty); minions +33–50% fire dmg NM/H | All |
| Lightning Enchanted † | +66% min / +100% max lightning dmg; +75% lightning res; **when struck** releases 8 charged bolts at level `mlvl/2`, `2*lvl − 1` dmg each; minions +33–50% NM/H | NM+ |
| Cold Enchanted † | +66% min / +100% max cold dmg; +75% cold res; chill length `4 + 0.2*mlvl` s; cold death nova at level `mlvl/2`; minions +33–50% NM/H | NM+ |
| Mana Burn † | +66/+100% mana-drain damage on hit; +20% magic res | NM+ |
| Spectral Hit | +40% fire/cold/lightning res (each if < 75); each hit rides one random element at +66/+100% dmg | Hell |
| Stone Skin | +50% phys res; **base defense doubled** (before % defense mods) — can create or harden physical immunity; immune to critical doubling | Hell |
| Multiple Shots | missile attacks release 3× missiles (missile-capable monsters only) | All |
| Teleportation | teleports to target (with partial heal) when HP < 30%, or when a ranged unique has an adjacent enemy | NM+ |
| Aura Enchanted † | gains one melee-aura-archetype aura, level scaled by mlvl divisor: damage-boost `mlvl/6`, fire-damage `mlvl/6`, attack-rating `mlvl/5`, chill `mlvl/7`, lightning-damage `mlvl/8` (mlvl ≥ 20), resist-lowering `mlvl/8`, frenzy `mlvl/8`; minimum level 1; radiates to minions | NM+ |

## Resistances per difficulty

Monster resistances are a full numeric table: one row per family-tier per difficulty in
the `monsters` table, six channels each. **Immunity rule: a channel with resist ≥ 100 is
immune** (display only — the overage matters for immunity-breaking, see
`difficulty-progression.md`). Floor: −100 (×2 damage taken).

**Table template** (`monsters` table columns):

| Family | Diff | Phys | Magic | Fire | Ltng | Cold | Psn |
|---|---|---:|---:|---:|---:|---:|---:|

**Filled example rows — Act I families** (base-tier values; higher tier variants add
+5–15 to the family's themed channels):

| Family | Diff | Phys | Magic | Fire | Ltng | Cold | Psn |
|---|---|---:|---:|---:|---:|---:|---:|
| Shalehide | N | 25 | 0 | 0 | 0 | 0 | −25 |
| Shalehide | NM | 40 | 0 | 15 | 15 | 15 | −15 |
| Shalehide | H | 60 | 0 | 30 | 30 | 30 | 0 |
| Gloomwing | N | 0 | 0 | −33 | 0 | 40 | 0 |
| Gloomwing | NM | 0 | 0 | −25 | 0 | 75 | 25 |
| Gloomwing | H | 0 | 0 | −10 | 25 | 110 | 50 |
| Scorchling | N | 0 | 0 | 75 | 0 | −33 | 0 |
| Scorchling | NM | 0 | 0 | 95 | 20 | −25 | 20 |
| Scorchling | H | 0 | 0 | 130 | 33 | −10 | 40 |
| Bright-Tick | N | 0 | 0 | −25 | 0 | 0 | 50 |
| Bright-Tick | NM | 0 | 0 | −15 | 15 | 15 | 75 |
| Bright-Tick | H | 0 | 0 | 0 | 25 | 25 | 105 |
| Brack-Wight | N | 0 | 0 | −33 | 0 | 33 | 100 |
| Brack-Wight | NM | 10 | 0 | −25 | 15 | 50 | 105 |
| Brack-Wight | H | 20 | 0 | −10 | 25 | 75 | 110 |
| Husk-Walker | N | 0 | 33 | 0 | 0 | −25 | 25 |
| Husk-Walker | NM | 0 | 50 | 15 | 15 | −15 | 40 |
| Husk-Walker | H | 0 | 75 | 30 | 30 | 0 | 75 |
| Vine-Tender | N | 0 | 0 | −33 | 0 | 0 | 100 |
| Vine-Tender | NM | 0 | 15 | −25 | 15 | 15 | 105 |
| Vine-Tender | H | 0 | 30 | −10 | 30 | 30 | 110 |
| Starving-One | N | 0 | 0 | 0 | 0 | 0 | 0 |
| Starving-One | NM | 0 | 0 | 10 | 10 | 10 | 10 |
| Starving-One | H | 20 | 0 | 20 | 20 | 20 | 20 |

**Authoring rules for the remaining families** (asserted by `tests/data/`):

1. Each family's **primary themed channel** ramps ~+30–40 per difficulty and crosses 100
   (immune) in Hell for immunity-flagged families (roster's "X immune" profiles).
2. Each family keeps at least one channel at ≤ 0 in Hell (the exploitable weakness).
3. Per zone spawn pool: no more than 40% of spawnable families immune to the same
   element; every act keeps a farmable route for every damage type.
4. Physical immunity is reserved for construct/juggernaut families (Cog-Golem,
   Tremor-Back) and Stone Skin rolls; magic immunity is rarest (Corruptor family only).
5. Poison immunity biases to undead/plant families (Brack-Wight, Vine-Tender).

## AI archetypes

| Archetype | Behavior |
|---|---|
| `melee_rusher` | Approach player → melee attack → short cooldown → repeat. Some variants flee at low HP |
| `melee_ambusher` | Burrow/hide (untargetable) → surface near player → attack chain → flee |
| `kiter` | Keep distance, fire projectile. Move when player gets close. Seek elevation |
| `caster` | Maintain distance, fire spells in volleys. Flee when approached. High damage, low HP |
| `summoner` | Stay at max vision, summon minions from nearby corpses or from nothing. Flee if player gets close |
| `buffer` | Stay behind pack, apply buff aura to nearby allies. No direct attack |
| `swarmer` | Fast approach, surround target. Individual low HP, high pack density |
| `sniper` | Stationary, long-range piercing projectile. Move infrequently |
| `debuff` | Apply weakening curse to player (reduce damage / increase damage taken / slow) |
| `boss` | Per-act-boss-specific state machine (multiple phases, telegraphed abilities, summon waves) |
| `juggernaut` | Very slow, very high HP/high damage. Cannot be knocked back. Ground-pound AoE stun |

Aggro radius: typically 30 yards (40 for aggressive archetypes). Leash: 50 yards. Bosses:
unlimited leash (follow to anywhere in arena).

## Act boss kits

Five act bosses, one per act. Names come from `04-content-bible` (`naming-and-lore.md`);
Act I–III bosses are not yet named there, so they carry placeholder content ids
`boss-a1`/`boss-a2`/`boss-a3` until the content bible assigns names. Each boss has a
fixed per-difficulty mlvl row in the `monsters` table, elevated `damageRegen`, is
stun-immune, and forces hit recovery instead of stun (interrupt-immune during phase
transitions). Frame counts are 25 Hz; "action frame" = the frame damage/spawn occurs.

### boss-a1 — Act I (poison melee rusher)

| Ability | Element | Frames (action) | Cooldown | Mechanics |
|---|---|---|---|---|
| Venom Lash | phys + poison | 12 (hits @ 5/8/11) | none | 3-hit melee chain; each hit applies the boss's poison (rate/length per difficulty) |
| Caustic Nova | poison | 16 (@ 9) | 75 ticks | radial burst, 8 yd; strong poison DoT, 250-frame length |
| Lunging Charge | phys | 10 + travel | 50 ticks; only if target > 8 yd | auto-pathing charge, blockable, knockback on impact |
| Spore Cloud | poison | 14 (@ 10) | 125 ticks | 4 yd ground cloud lingering 200 frames; NHD 4 |
| Bleed Frenzy | — | passive | at < 40% HP | gains +30 SIAS and +20% velocity for the rest of the fight |

### boss-a2 — Act II (confined-space bruiser)

| Ability | Element | Frames (action) | Cooldown | Mechanics |
|---|---|---|---|---|
| Crushing Charge | phys | 12 + travel | 60 ticks | knockback 3.75 yd on impact + hit-recovery check |
| Overhead Smash | phys | 15 (@ 10) | 25 ticks | 1.5× melee damage single hit; always triggers the target's hit-recovery check |
| Freeze-Pulse Field | cold | pulse every 25 ticks | always on | aura: chills everything within 6 yd (50% slow, 50-frame chill per pulse) |
| Gore Sweep | phys | 13 (@ 8) | 15 ticks | 120° frontal arc melee |
| Seismic Slam | phys | 18 (@ 14) | 150 ticks | 6 yd ground pound; 25-tick stun (full effect vs players) |

### boss-a3 — Act III (caster council, three members, shared HP pool)

| Ability | Element | Frames (action) | Cooldown | Mechanics |
|---|---|---|---|---|
| Quicksilver Bolt | cold | 14 (@ 9) | 20 ticks/member | single homing-free missile; applies chill (75-frame base) |
| Arc Cascade | lightning | 16 (@ 10) | 50 ticks | chains to 3 targets, −25% damage per jump |
| Mercury Geyser | phys + cold | 20 (@ 16) | 100 ticks | telegraphed ground eruption, 5 yd, detonates 25 ticks after placement |
| Summon Temple Wards | — | 24 (@ 18) | 250 ticks; max 6 active | spawns melee construct adds |
| Blink Rotation | — | 10 | 75 ticks | members teleport-swap positions (retarget pressure) |
| Communion | — | passive | on member "death" | shared pool has 3 segments; when a segment empties that member falls and survivors gain +15 SIAS |

### The Shattered King — Act IV (mixed melee-caster climax)

Phase switches at 66% and 33% HP (interrupt-immune during transitions, each followed by a
125-tick storm intermission: random lightning bolts, ~8/second, arena-wide).

| Ability | Element | Frames (action) | Cooldown | Mechanics |
|---|---|---|---|---|
| Prismatic Nova | fire | 20 (@ 12) | 100 ticks | radial nova, 12 yd |
| Void Lance | lightning | 15 windup, then 75-tick beam | 200 ticks | sustained sweeping beam; damage per tick while intersecting |
| Glass-Storm | fire | 18 (@ 13) | 150 ticks | delayed AoE + lingering ground fire patches (300 frames); NHD 4 |
| Crystal Cage | phys | 12 (@ 9) | 250 ticks | imprisons target in a destructible cage (HP = 25 × mlvl; auto-breaks after 100 ticks) |
| Shattering Charge | phys | 10 + travel | 75 ticks; only if target > 10 yd | charge with knockback |

### Heart of the Bleed — Act V (wave-event trickster)

Prelude: 5 scripted minion waves with escalating modifiers at the throne (see
`04-content-bible/naming-and-lore.md`), then the boss fight.

| Ability | Element | Frames (action) | Cooldown | Mechanics |
|---|---|---|---|---|
| Bleed-Wave | — | 30 (@ 24) | 300 ticks | summons 3–5 corrupted adds from arena spawn circles |
| Hoarfrost Nova | cold | 17 (@ 11) | 100 ticks | radial cold nova; 100-frame chill |
| Corruption Rift | magic | 20 (@ 15) | 150 ticks | 4 yd ground rift, 250 frames: magic DoT + drains % of max mana per tick |
| Blink-Step | — | 8 | 50 ticks; if melee-engaged > 75 ticks or target > 12 yd | teleport reposition |
| Mirror-Self | — | 25 (@ 20) | 300 ticks | spawns a decoy clone: 10% of boss HP, deals 50% damage, no ability cooldowns shared |
| Grasping Tendrils | phys | 16 (@ 12) | 75 ticks | line AoE from the boss; mana-burn rider on hit |

## Hit recovery

Monsters have the same HP-threshold trigger (single hit > 1/12 maxHP). HR frame counts
per monster family from the `speeds` data table. Champion/unique: 75% of normal HR frames.
Boss: 50% or special interrupt rules (some act bosses are interrupt-immune during phase
transitions). Stun applies at only 10% chance to champions/uniques/superuniques (full
length if it lands) and never to act bosses.
