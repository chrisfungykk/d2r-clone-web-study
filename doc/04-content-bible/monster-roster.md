# Monster Roster — Content Bible

> Original monster families mapped to D2 mechanical archetype roles. ~80 monster entries
> across 15 families with 3-5 tier variants each. Each family has: base theme, AI archetype
> from the behavior library, resist profile, size class, drain flags, and per-difficulty
> stat scaling curves.

## Monster family design rules

1. Each family occupies a mechanical niche (melee rusher, ranged kiter, caster, summoner,
   suicide bomber, buffer, boss) that maps to a registered AI archetype key.
2. Each family has 3-5 tier-variants (e.g., "Scorchling" → "Scorch-Whelp" → "Scorch Matron"
   → "Scorch Queen") that appear in progressively higher-level zones. Higher tiers gain new
   abilities and improved resistances.
3. Base stats (HP, damage, AR, defense) are computed from the family's base entry scaled
   by difficulty and the zone's alvl — formula is system-owned (`monsters` table).
4. Every family has a defined drop role (treasure class chain) — some are chaff (potions/gold),
   some are gear-carriers, boss-tier guarantees a rare+.

## Family roster

### 1. Shalehide (melee rusher)
- **Appearance:** Armored quadruped, armored plates of cracked stone, slow deliberate movement that accelerates.
- **AI:** Rusher — walks slowly until in melee range, then burst-charge. High damage, moderate defense. Vulnerable to poison.
- **Tiers:** Shalehide → Ironhide → Bleedhide → Obsidianhide
- **Zone spread:** Acts I–IV (tier increases with act)
- **Drain:** None (construct-adjacent — immune to leech)
- **Resist profile:** Physical resistant, poison weak

### 2. Gloomwing (flying swarmer)
- **Appearance:** Moth/pterosaur hybrid, pale tattered wings, bioluminescent trails.
- **AI:** Swarmer — fast approach, attack-and-flee, surround target. Low individual HP, high pack density.
- **Tiers:** Gloomwing → Duskwing → Bleakwing → Shroudwing
- **Zone spread:** Acts I–V
- **Drain:** 100% (living)
- **Resist profile:** Cold resistant, fire weak

### 3. Rustwalker (skeletal construct)
- **Appearance:** Animated bronze/iron humanoid skeleton, joints grind audibly.
- **AI:** Melee standard — deliberate gap-closing, consistent damage, occasional shield-block that halves incoming damage.
- **Tiers:** Rustwalker → Bronzewalker → Iron Sentinel → Bleed-Corrupted Golem
- **Zone spread:** Acts II–V
- **Drain:** None (construct — immune to life/mana leech)
- **Resist profile:** Physical resistant, lightning resistant, magic weak

### 4. Scorchling (caster)
- **Appearance:** Small bipedal lizard with burning crest. Larger variants have crest-fans.
- **AI:** Caster — maintains distance, fires firebolts in volleys of 2-4, flees when approached. High damage, low HP.
- **Tiers:** Scorchling → Scorch-Whelp → Scorch Matron → Scorch Queen
- **Zone spread:** Acts I–V
- **Drain:** 75% (partial resistance to leech)
- **Resist profile:** Fire immune/resistant, cold weak

### 5. Bright-Tick (bug swarmer)
- **Appearance:** Giant tick, iridescent carapace, glowing abdomen. Pop from ground or drop from ceiling.
- **AI:** Ambusher — buries underground (untargetable for 1-2 sec), surfaces beneath player. Fast attack chain.
- **Tiers:** Bright-Tick → Blood-Tick → Swell-Tick → Bloat-Tick (explodes on death at higher tiers)
- **Zone spread:** Acts I–III
- **Drain:** 100%
- **Resist profile:** Poison resistant, fire weak

### 6. Brack-Wight (swamp zombie)
- **Appearance:** Waterlogged rotting humanoid, trailing marsh plants and leeches.
- **AI:** Shambler — very slow, high HP, on-death spawns 2 leech-swarm minis. Hit recovery interrupts them easily.
- **Tiers:** Brack-Wight → Fen-Wight → Sink-Wight → Bleed-Wight
- **Zone spread:** Acts I, III, V
- **Drain:** 50% (partial)
- **Resist profile:** Poison immune, cold resistant, fire weak

### 7. Mirror-Thing (illusionist)
- **Appearance:** Translucent humanoid, reflects environment. Hard to see against background.
- **AI:** Kiter — fires projectile that copies the damage-type of the last attack it took. Creates 1-2 non-damaging mirror images that vanish on hit.
- **Tiers:** Mirror-Thing → Echo-Shell → Shimmer-Wraith → Void-Phantasm
- **Zone spread:** Acts III–V
- **Drain:** 0% (spectral)
- **Resist profile:** Magic resistant, lightning weak

### 8. Cog-Golem (clockwork guardian)
- **Appearance:** Brass and iron golem, exposed gear mechanisms, steam vents.
- **AI:** Zone guardian — patrols a fixed area, aggro on approach. Damage-reducing shell (DR 30%) that deactivates when hit by lightning damage. Charging slam attack.
- **Tiers:** Cog-Golem → Gear-Guardian → Clockwork Titan → Bleed-Engine
- **Zone spread:** Acts II, IV, V
- **Drain:** None (construct)
- **Resist profile:** Physical immune (Act IV+), lightning weak, fire resistant

### 9. Husk-Walker (corpse reanimator)
- **Appearance:** Desiccated corpse draped in tattered shroud. Carries a bell.
- **AI:** Summoner — stays at range, rings bell to reanimate nearby corpses as basic walkers. Prioritize killing first.
- **Tiers:** Husk-Walker → Bone-Caller → Soul-Bell → Lich-Bell
- **Zone spread:** Acts I–V
- **Drain:** 25% (partial)
- **Resist profile:** Magic resistant, cold weak

### 10. Vine-Tender (nature caster)
- **Appearance:** Plant-humanoid hybrid, root-legs, flowering head.
- **AI:** Buffer — empowers nearby monsters (damage aura) and entangles player with root-vines (immobilize 2-4 sec). Does not directly attack.
- **Tiers:** Vine-Tender → Thorn-Weaver → Bloom-Prophet → Rot-Heart
- **Zone spread:** Acts I, III
- **Drain:** 100%
- **Resist profile:** Poison immune, fire weak

### 11. Starving-One (jump scavenger)
- **Appearance:** Gaunt, long-limbed humanoid with oversized jaw. Scavenger posture.
- **AI:** Ambusher — hides among dead monsters (appears as corpse, springs up when player nears). Fast, flurry attack, flees at low HP to eat another corpse (heals).
- **Tiers:** Starving-One → Famine → Ravener → Glutton-Heart
- **Zone spread:** Acts I–III, V
- **Drain:** 100%
- **Resist profile:** None (standard)

### 12. Ashen Fiend (demon caster)
- **Appearance:** Horned bipedal fiend, smoldering skin, eyes emit embers.
- **AI:** Aggressive caster — teleports short distances, fires fireball volleys, leaves fire patches on death. High threat, glass cannon.
- **Tiers:** Ashen Fiend → Ember Fiend → Blaze Tyrant → Infernal Lord
- **Zone spread:** Acts III–V
- **Drain:** 0% (demonic)
- **Resist profile:** Fire immune, cold weak

### 13. Ward-Stalker (sniper)
- **Appearance:** Tall gaunt sentinel fused with a crossbow mechanism on one arm.
- **AI:** Ranged artillery — keeps maximum distance, fires piercing bolts that hit the first target and continue to a second. Moves infrequently, prefers elevated terrain.
- **Tiers:** Ward-Stalker → Ward-Sniper → Eye-Ward → Bleed-Scout
- **Zone spread:** Acts II, IV
- **Drain:** 75%
- **Resist profile:** Physical resistant, magic weak

### 14. Corruptor (spell thief)
- **Appearance:** Floating robed humanoid wreathed in Bleed energy.
- **AI:** Debuffer — applies random weakening curse (reduce damage, increase damage taken, slow) to player. Alternates with life-tap projectile. Priority target.
- **Tiers:** Corruptor → Void-Speaker → Bleed-Priest → Heart-Whisper
- **Zone spread:** Acts III–V
- **Drain:** 0% (spectral)
- **Resist profile:** Magic immune, physical weak

### 15. Tremor-Back (boss-shield minion)
- **Appearance:** Massive tortoise-like creature with crystal growths on shell.
- **AI:** Juggernaut — very slow, extremely high HP, area-of-effect ground-pound stuns nearby. Cannot be knocked back. Crystal shards on shell reflect projectiles.
- **Tiers:** Tremor-Back → Quake-Shell → Mountain-Tread → Bleed-Carapace
- **Zone spread:** Acts II (unique only), IV, V
- **Drain:** None (elemental)
- **Resist profile:** Physical immune, lightning resistant, cold weak

## Act I base-stat tables

Eight families spawn in Act I (zone spread includes Act I): **Shalehide, Gloomwing,
Scorchling, Bright-Tick, Brack-Wight, Husk-Walker, Vine-Tender, Starving-One**. The
tables below are the authoring numbers for their Act-I tier variants in the `monsters`
data table. Reading notes:

- Values are **Normal-tier** (tier multiplier 1×). Minion/Champion/Unique/Superunique
  variants apply the tier multipliers from `02-game-design/monsters.md` (e.g., champion =
  2× HP, 3× XP, 1.5× damage/AR). Player-count scaling also per that file.
- **mlvl** follows the zone in NM/Hell: regular monsters `mlvl = alvl`; champions `alvl+2`;
  uniques and their minions `alvl+3` (canonical rule in `02-game-design/monsters.md`).
  Normal uses the per-monster table value. mlvl columns below are regular-monster values
  from the Act I zone alvls in `zones.md`; the Hell top of 85 is the Sunken Fane alvl-85
  exception (`02-game-design/endgame.md`) — its uniques reach mlvl 88 via the +3.
  Stat ranges span the family's lowest to highest Act-I spawn.
- Ranged/caster families (Scorchling) list missile damage; AR shown is for their melee
  fallback. Vine-Tender never attacks directly (entangle + buff aura only).
- **XP** is base XP per kill before tier/player multipliers.
- **TC** entries are placeholders resolved in `src/sim/data/treasure-classes.ts`
  (Phase 2). Drop-role intent: `chaff` = potions/gold-weighted, `std` = standard gear,
  `caster` = wand/orb/charm-weighted.

### Normal (Act I alvl 1–10)

| Family | mlvl | HP | Damage | AR | Defense | XP | TC |
|---|---|---|---|---|---|---|---|
| Shalehide | 2–8 | 16–58 | 3–9 | 28–72 | 14–42 | 40–110 | `tc_shalehide_a1_n` (std) |
| Gloomwing | 1–9 | 6–26 | 1–5 | 22–65 | 5–24 | 20–70 | `tc_gloomwing_a1_n` (chaff) |
| Scorchling | 2–9 | 8–30 | 5–14 fire | 30–78 | 8–28 | 35–100 | `tc_scorchling_a1_n` (caster) |
| Bright-Tick | 3–9 | 10–34 | 2–7 | 34–82 | 10–30 | 28–85 | `tc_bright_tick_a1_n` (chaff) |
| Brack-Wight | 1–10 | 22–74 | 3–8 | 20–58 | 8–30 | 45–130 | `tc_brack_wight_a1_n` (std) |
| Husk-Walker | 4–10 | 14–42 | 2–5 | 24–55 | 12–36 | 50–140 | `tc_husk_walker_a1_n` (caster) |
| Vine-Tender | 4–8 | 16–46 | — (entangle) | — | 16–46 | 45–120 | `tc_vine_tender_a1_n` (caster) |
| Starving-One | 2–9 | 11–38 | 3–10 | 36–88 | 7–26 | 30–95 | `tc_starving_one_a1_n` (std) |

### Nightmare (Act I alvl 36–42 → regular mlvl 36–42)

| Family | mlvl | HP | Damage | AR | Defense | XP | TC |
|---|---|---|---|---|---|---|---|
| Shalehide | 36–42 | 420–780 | 26–58 | 720–1040 | 340–560 | 1500–2600 | `tc_shalehide_a1_nm` |
| Gloomwing | 36–42 | 230–430 | 16–36 | 660–950 | 190–330 | 900–1600 | `tc_gloomwing_a1_nm` |
| Scorchling | 36–42 | 260–500 | 38–86 fire | 700–1000 | 230–380 | 1300–2200 | `tc_scorchling_a1_nm` |
| Bright-Tick | 36–42 | 300–560 | 20–46 | 760–1090 | 260–420 | 1100–1900 | `tc_bright_tick_a1_nm` |
| Brack-Wight | 36–42 | 560–1000 | 24–52 | 640–920 | 250–400 | 1700–2900 | `tc_brack_wight_a1_nm` |
| Husk-Walker | 36–42 | 340–620 | 15–34 | 660–950 | 280–450 | 1900–3200 | `tc_husk_walker_a1_nm` |
| Vine-Tender | 36–42 | 380–700 | — | — | 320–520 | 1700–2800 | `tc_vine_tender_a1_nm` |
| Starving-One | 36–42 | 320–580 | 28–64 | 800–1150 | 210–350 | 1200–2100 | `tc_starving_one_a1_nm` |

### Hell (Act I alvl 67–75 → regular mlvl 67–75; Sunken Fane alvl 85 → mlvl 85)

| Family | mlvl | HP | Damage | AR | Defense | XP | TC |
|---|---|---|---|---|---|---|---|
| Shalehide | 67–75 | 1900–3600 | 70–140 | 1900–2700 | 950–1500 | 5200–9500 | `tc_shalehide_a1_h` |
| Gloomwing | 67–75 | 1050–2000 | 45–90 | 1750–2450 | 550–900 | 3200–6000 | `tc_gloomwing_a1_h` |
| Scorchling | 67–85 | 1200–2600 | 95–220 fire | 1850–2900 | 650–1200 | 4500–9800 | `tc_scorchling_a1_h` |
| Bright-Tick | 67–85 | 1350–2900 | 55–125 | 2000–3100 | 700–1300 | 3900–8500 | `tc_bright_tick_a1_h` |
| Brack-Wight | 67–85 | 2500–5300 | 60–140 | 1700–2650 | 700–1300 | 5900–12800 | `tc_brack_wight_a1_h` |
| Husk-Walker | 67–85 | 1550–3300 | 40–95 | 1750–2700 | 800–1450 | 6600–14200 | `tc_husk_walker_a1_h` |
| Vine-Tender | 67–75 | 1700–3200 | — | — | 900–1450 | 5900–10400 | `tc_vine_tender_a1_h` |
| Starving-One | 67–85 | 1450–3100 | 75–175 | 2100–3250 | 580–1100 | 4300–9200 | `tc_starving_one_a1_h` |

(Families whose mlvl tops at 88 spawn inside the Sunken Fane Hell exception zone; the
upper ends of their ranges apply there.)

### Resistances per difficulty (%, order F/C/L/P/M/Phys)

Consistent with each family's qualitative resist profile above. **Bold = immune**
(res ≥ 100, per `02-game-design/difficulty-progression.md`: breakable, then capped 95%).
Weakness elements stay at or below 0 in all difficulties so every family keeps a
farmable hole.

| Family | Normal | Nightmare | Hell |
|---|---|---|---|
| Shalehide | 0/0/0/−30/0/50 | 25/25/25/−20/0/50 | 50/50/50/−10/25/75 |
| Gloomwing | −30/50/0/0/0/0 | −20/60/25/25/0/0 | −10/75/40/40/25/0 |
| Scorchling | 75/−30/0/0/0/0 | 85/−20/25/25/0/0 | **110**/−10/40/40/25/0 |
| Bright-Tick | −30/0/0/60/0/0 | −20/25/25/75/0/0 | −10/40/40/90/0/25 |
| Brack-Wight | −30/40/0/95/0/0 | −20/50/25/**100**/0/0 | −10/70/40/**110**/0/25 |
| Husk-Walker | 0/−30/0/0/50/0 | 25/−20/25/25/60/0 | 40/−10/40/50/75/25 |
| Vine-Tender | −30/0/0/95/0/0 | −20/25/25/**100**/0/0 | −10/40/40/**110**/0/25 |
| Starving-One | 0/0/0/0/0/0 | 25/25/25/25/0/0 | 40/40/40/40/0/25 |

**NM immunity note:** Brack-Wight and Vine-Tender carry the roster's rare NM immunity
allowance (poison, at exactly 100% — any −poison-res effect breaks it). This matches the
canonical NM rule in `difficulty-progression.md`: NM immunities are very rare — a monster
may be immune to physical or to a single element at exactly 100% (never multiple, never
the broad Hell-style immunities). No Act I family is physical-immune in any difficulty.

## Act I superuniques

Eight named fixed spawns. Superuniques use the superunique tier multipliers
(3.5× HP, 5× XP, 2× damage/AR, per `02-game-design/monsters.md`), spawn at their zone's
fixed anchor (`world-and-zones.md` generation step 7), and keep their **authored modifier
set in all difficulties** (fixed sets may include NM+ pool mods even in Normal — matching
the D2 superunique convention). Modifier names from the pool table below. The Act I boss
(Sunken Fane Level 3) is act-boss tier, not a superunique, and is specced in the quest
docs.

| Name | Base family | Zone | Fixed modifiers | Notable drop behavior |
|---|---|---|---|---|
| Morvane the First-Drowned | Brack-Wight | Tide-Wracked Flats | Curse-Touched, Berserker's Rage | Guards the beached wreck of the *Pale Gull*; first kill per difficulty guarantees 2 magic+ items (early-game gear catch-up) |
| Thicket-Jaw | Shalehide | Brackwood | Iron Hide, Berserker's Rage | Standard superunique TC; charges through tree cover on aggro |
| The Pale Choir | Gloomwing | Brackwood | Multi-Shot, Frost-Wreathed | Spawns with 8-strong wing pack; chaff-heavy TC with elevated gold/potion yield |
| Mother-of-Needles | Bright-Tick | Shale-Root Pass | Multi-Shot, Berserker's Rage | Re-burrows between assaults, surfacing with 4-tick brood; elevated gem odds (iron-vein zone TC) |
| Root-Mother Sessk | Vine-Tender | Fenlight Barrows | Aura-Bearer, Curse-Touched | Entangles while empowering barrow packs; charm-weighted TC |
| Cindermaw | Scorchling | Sundered Watch | Flame-Core, Teleport-Strike | Volley caster; fire-immune in Hell (family profile); standard superunique TC |
| The Toll-Keeper | Husk-Walker | Bleak-Head | Aura-Bearer, Curse-Touched | Rune farm target: guaranteed 1–3 runes, rune ceiling rises per difficulty; rings its bell to raise walker waves during the fight |
| Vess the Starving | Starving-One | The Sunken Fane, Level 2 | Berserker's Rage, Teleport-Strike | Flees to eat corpses (heals 25% max HP) — burst him down; guards the Fane's golden chest anchor |

## Champion/unique modifier pool (mechanical, original names)

| Modifier | Effect | Available in |
|---|---|---|
| Berserker's Rage | +80% damage, +50% AR, +50% speed | All tiers |
| Iron Hide | +150% defense, +20% DR, immune to knockback | NM+ |
| Curse-Touched | Attacker takes damage on hit (thorns, 200% return) | All tiers |
| Frost-Wreathed | Melee attacks chill for 8 sec, ranged chill half; +50% cold damage | NM+ |
| Flame-Core | Death explosion deals fire damage in 8y radius | NM+ |
| Static Surge | Periodic shock pulse (25% current HP, 6y radius, 4s cooldown) | NM+ |
| Mana Burn | Melee drain 50% max mana per hit, hit freeze mana regen 2s | NM+ |
| Spectral Form | 30% chance to dodge attacks, takes +30% magic damage | Hell |
| Bleed-Touched | Open Wounds on attack (160/320 over 8 sec), +50% poison damage | Hell |
| Stone-Skin | 50% resist all, immune to physical critical | Hell |
| Multi-Shot | Ranged attack fires 3-4 projectiles in spread | All tiers |
| Teleport-Strike | Short-range teleport to target on attack cooldown (4 ticks) | NM+ |
| Aura-Bearer | Party buff: 1 of Might/Defiance/Conviction/Holy Fire equivalents | NM+ |
| Lightning-Enchanted | On-hit chain lightning (single target, not nova), death emits bolts | NM+ |

Champion/unique families get 1/2/3 mods (Normal/NM/Hell) in addition to bonus HP/XP/damage
multipliers from the `monsterMods` table.
