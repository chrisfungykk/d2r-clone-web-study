# Item Catalog — Content Bible

> Original unique/set items designed to D2-equivalent stat budgets per tier slot.
> This file is the **canonical authoring source**: the representative stat blocks below are
> copied 1:1 into `src/sim/data/uniques.ts`, `sets.ts`, and `words.ts` per the
> `data-model.md` schema. Remaining backlog items (counts at the end of each section) are
> authored later against the stat-budget rules in this file.

## Design rules

1. **Each unique item occupies a slot tier** (early normal / mid normal / late normal /
   nightmare / hell) matching a D2-tier comparable power level. Its stat budget (sum of
   affix values) must fit within the envelope for its tier ±5%.
2. **No unique outclasses every other option in its slot** — BiS items exist but have
   tradeoffs (rune-word analogy items compete at top end; see `sockets-gems-words.md`).
3. **Set items** grant partial bonuses at N pieces, full at N-1 pieces, with the final
   piece completing the most powerful bonus. No set is BiS in every slot.
4. **Names** reference the world's lore (factions, events, Keepers, the Bleed, named
   characters, wars). Never Blizzard references. See `naming-and-lore.md`.

## Base-item table (excerpt)

Bases follow D2's three-tier chain (normal → exceptional → elite share a silhouette; qlvl
and stats rise). Uniques and words below reference these ids. Full base table lives in
`src/sim/data/itemBases.ts`.

| Chain id | Normal (qlvl) | Exceptional (qlvl) | Elite (qlvl) | Slot |
|---|---|---|---|---|
| hatchet | Hatchet (4) | Fell Axe (28) | Storm Cleaver (62) | 1h axe |
| warsword | Work Sword (6) | Burgh Blade (30) | Vault Edge (64) | 1h sword |
| greathammer | Sledge (10) | Toll Maul (36) | Ruin Hammer (70) | 2h mace |
| warspear | Boar Spear (12) | Long Pike (38) | Hollow Lance (72) | 2h spear |
| poleblade | Scythe-Staff (14) | Reaping Pole (40) | Ash Halberd (74) | polearm |
| shortbow | Fen Bow (3) | Recurve of Reeds (27) | Whisper Bow (61) | bow |
| shortstaff | Walking Staff (2) | Warded Staff (26) | Keeper's Rod (60) | staff |
| orb | Glass Orb (8) | Storm Glass (32) | Bleed Prism (66) | caster orb |
| wand | Tallow Wand (3) | Grave Wand (27) | Nihl Wand (61) | wand |
| cap | Felt Cap (1) | War Hood (25) | Vault Casque (59) | helm |
| kite | Door Board (5) | Kite of the Court (29) | Keeper's Aegis (63) | shield |
| quilt | Quilted Coat (2) | Riveted Coat (26) | Bleed-Sewn Mail (60) | light armor |
| plate | Field Plate (18) | Court Plate (44) | Vault Plate (78) | heavy armor |
| lgloves | Field Gloves (1) | Clasped Gauntlets (25) | Vault Grips (59) | gloves |
| lboots | Road Boots (1) | Courier Treads (25) | Vault Striders (59) | boots |
| sash | Rope Sash (1) | Studded Girdle (25) | Vault Cord (59) | belt |
| ring | Ring (1) | — | — | ring |
| amulet | Amulet (1) | — | — | amulet |
| charm-s | Small Charm (1) | — | — | charm 1×1 |
| charm-l | Large Charm (1) | — | — | charm 1×2 |

## Unique items — representative catalog (30 of ~150)

Column format matches `uniques.ts`: id · base · qlvl · req lvl · fixed mod list (ranges roll
per item). Skill mods name original trees (see `class-identities.md`, `skill-data.md`).

### Early game (Normal acts I–II, ilvl 3–25) — 10 rows

| Name | Base | qlvl | req | Mods |
|---|---|---|---|---|
| Rust-Biter | Hatchet | 8 | 6 | +40-60% ED · +20 poison dmg /3 s (75 f) · 10% IAS · +25 AR |
| Flickering Ember | Walking Staff | 10 | 8 | +1 Thermal (Arcanist) · 10% FCR · regenerate mana 15% |
| Scorched Door | Door Board | 6 | 4 | +12-18 defense · +15% fire resist · +5% block |
| Salt-Wick Crown | Felt Cap | 7 | 5 | +20-30% ED(def) · replenish life +3 · +1 light radius |
| Tide-Walker's Coat | Quilted Coat | 9 | 7 | +25-40% ED(def) · +15% cold resist · +10% FRW |
| Marsh-Grubbers | Field Gloves | 11 | 9 | 15% IAS · +25% poison resist · +20 AR |
| Soggy Treads | Road Boots | 5 | 3 | +10% FRW · 15% MF · +5 defense |
| Brass Loop | Ring | 12 | 10 | +40-60 AR · +3-5 strength |
| Fog-Charm | Amulet | 14 | 12 | +5-8 energy · +5% all resist · +1 light radius |
| Grave-Lantern | Tallow Wand | 18 | 15 | +1 Grave-Song (Reaper) · 10% FCR · +20 mana |

### Mid game (Normal acts III–V / early NM, ilvl 25–55) — 10 rows

| Name | Base | qlvl | req | Mods |
|---|---|---|---|---|
| Cinder-Psalm | Warded Staff | 30 | 24 | +2 Thermal (Arcanist) · 20% FCR · +40 mana · +10% fire resist |
| Wolf-Iron | Fell Axe | 32 | 26 | +90-130% ED · 20% IAS · 6% life leech · +2-4 cold dmg (50 f) |
| The Quiet Bell | Toll Maul | 35 | 28 | +80-120% ED · 25% crushing blow · 10% FHR |
| Keeper's Ward | Kite of the Court | 34 | 27 | +60-90% ED(def) · +10% all resist · 20% FBR · +30 def vs missile |
| Gallows-Air | Field Plate | 38 | 31 | +80-120% ED(def) · +15% FRW · 5% DR · attacker takes 8 |
| Red-Letter | Clasped Gauntlets | 36 | 29 | 20% IAS · 5% crushing blow · +40 AR |
| Milestone | Courier Treads | 33 | 26 | 20% FRW · 10% FHR · 25% gold find · +10% lightning resist |
| The Patient Orbit | Ring | 40 | 33 | 10% FCR · +20 mana · +10% cold resist |
| Low-Choir | Amulet | 42 | 35 | +1 all skills · +15% MF |
| Toll-Taker's Scale | Studded Girdle | 37 | 30 | +40-60% ED(def) · 10% FHR · +15 life |

### Endgame (NM/Hell, alvl85 chase, ilvl 55–87) — 10 rows

| Name | Base | qlvl | req | Mods |
|---|---|---|---|---|
| Heart-Piercer | Hollow Lance | 75 | 66 | +180-240% ED · ignore target defense · 33% deadly strike · 20% IAS · 8% life leech |
| Last Candle | Bleed Prism | 72 | 63 | +2 all skills · 20% FCR · +80 mana · +6 life after each kill |
| Keeper's Grief | Vault Plate | 78 | 68 | +180-250% ED(def) · 24% DR · cannot be frozen · +40 life |
| Beggar's Gaze | War Hood | 58 | 49 | 50% MF · +8-12 dexterity · 25% gold find · +2 light radius |
| Bone-Faith | Amulet | 70 | 61 | +10% all resist · +30-40 vitality · replenish life +10 · MDR 8 |
| Drowned-Soul | Amulet | 80 | 70 | +5% max cold resist · +25% lightning resist · +15% cold skill dmg · MDR 10 |
| Keeper's Signet | Ring | 65 | 57 | +1 all skills · 5% DR · +10% all resist *(world-event trigger item — see `endgame.md`)* |
| Heartbrand | Large Charm | 85 | 75 | +2 to (class) skills · +10-20 all attributes · +10-20% all resist *(finale reward, one per character; class rolled on drop)* |
| Bleeding Star | Small Charm | 85 | 75 | +1 all skills · +10-20 all attributes · +10-20% all resist · +5-10% XP *(world-event boss drop, one per character)* |
| The Unlit Road | Vault Striders | 76 | 67 | 30% FRW · 20% FHR · +40 defense · half freeze duration |

**Backlog:** ~120 further uniques to author against the budget rules below (target ~150
total; keep the tier spread from the outline sections that follow).

## Unique tier outlines (authoring guide for the backlog)

### Early-game uniques (Normal act I-II, ilvl 3-25)
~30 items. Budget: 1-3 low-tier affixes + possible socket. Designed to feel exciting on
first playthrough but replaced by late normal / nightmare.

### Mid-game uniques (Normal act III-V, ilvl 25-50)
~45 items. Budget: 2-4 impactful affixes. Caster weapons (FCR, +skills, mana after kill),
melee (ED%, IAS, leech), hybrid helms, tank/damage armors, specialist boots/gloves,
single-emphasis rings/amulets.

### Late-game / Nightmare uniques (NM, ilvl 50-70)
~40 items. Budget: 3-4 affixes at higher values + possible socket.

### Endgame uniques (Hell alvl85 zones, ilvl 70-99)
~35 items. Budget: 4-5 high-tier affixes, may include "broken" modifiers (ignore target
defense, +skill tree, pierce).

## Notable uniques by mechanical niche

| Niche | Item concept | Design intent |
|---|---|---|
| Uber-boss runner (The Forgotten Heart) | "Drowned-Soul" amulet | Max cold resist + lightning resist, +cold skill damage, MDR. Best-in-slot for boss-killing cold builds |
| Physical DPS | "Heart-Piercer" spear | Very high damage, ignore target defense, deadly strike, IAS. Top-tier physical weapon for spear build |
| Caster general | "Last Candle" orb | +skills, 20% FCR, high mana, +life per kill. Flexible best-in-slot for many builds |
| Tank | "Keeper's Grief" armor | High defense range, DR, cannot be frozen. Best res slot for hardcore |
| Starter MF | "Beggar's Gaze" helm | 50% MF, +dex, light radius. Cheapest slot for MF |
| Hardcore | "Bone-Faith" amulet | Res-all, +vitality, replenish life, MDR. Safety first |

## Set items — 5 complete sets (of ~20 planned)

Format matches `sets.ts`: per-item rows + partial/full bonuses. Partial bonuses activate on
that piece-count worn; the full bonus stacks on top.

### Freehold Survivor (3 pieces — Normal act I starter)

| Piece | Base | qlvl | req | Item mods |
|---|---|---|---|---|
| Survivor's Hood | Felt Cap | 4 | 3 | +15 defense · +10 life |
| Survivor's Coat | Quilted Coat | 5 | 4 | +20 defense · +10% cold resist |
| Survivor's Knife | Work Sword | 6 | 5 | +25% ED · +15 AR |

Bonuses — 2 pc: +10% all resist. Full (3): +1 all skills · +15% FRW · 20% gold find.

### The Iron Court (5 pieces — mid, any physical build)

| Piece | Base | qlvl | req | Item mods |
|---|---|---|---|---|
| Court Visor | War Hood | 34 | 28 | +60% ED(def) · 10% FHR |
| Court Plate | Court Plate | 38 | 31 | +90% ED(def) · +20 strength req −20% |
| Court Gauntlets | Clasped Gauntlets | 33 | 27 | 15% IAS · +30 AR |
| Court Girdle | Studded Girdle | 32 | 26 | +40% ED(def) · +15 life |
| Judge's Sledge | Toll Maul | 40 | 33 | +110% ED · 15% crushing blow |

Bonuses — 2 pc: +50 AR. 3 pc: +15% IAS. 4 pc: +100 defense · +10% all resist.
Full (5): +2 all skills · +25% FRW · attacker takes 20 · +1 to light radius.

### Kael's Legacy (4 pieces — Arcanist-themed caster)

| Piece | Base | qlvl | req | Item mods |
|---|---|---|---|---|
| Kael's Eye | Storm Glass | 46 | 38 | +2 Galvanic (Arcanist) · 15% FCR |
| Kael's Circlet | War Hood | 44 | 36 | +1 all skills · +30 mana |
| Kael's Vestment | Riveted Coat | 45 | 37 | +80% ED(def) · regenerate mana 20% |
| Kael's Seal | Ring | 43 | 35 | 10% FCR · +20 mana |

Bonuses — 2 pc: +10% lightning resist · +20 mana. 3 pc: +1 Arcanist skills · 10% FCR.
Full (4): Blink charges (level 5, 20 charges) · +100 mana · −10% enemy lightning resist.

### The Bleed Heart (5 pieces — endgame chase)

| Piece | Base | qlvl | req | Item mods |
|---|---|---|---|---|
| Heart's Crown | Vault Casque | 74 | 65 | +1 all skills · 20% FHR |
| Heart's Shell | Vault Plate | 78 | 68 | +200% ED(def) · +50 life |
| Heart's Aegis | Keeper's Aegis | 76 | 66 | +30% all resist · 20% FBR |
| Heart's Pulse | Amulet | 75 | 65 | +1 all skills · 8% life leech |
| Heart's Thorn | Vault Edge | 77 | 67 | +200% ED · 30% open wounds |

Bonuses — 2 pc: +100 defense. 3 pc: +15% all resist · 20% MF. 4 pc: +1 all skills · 10% DR.
Full (5): +3 all skills · +20% IAS · +20% all resist · 50% MF · replenish life +20.

### Cog-Engine (2 pieces — caster jewelry)

| Piece | Base | qlvl | req | Item mods |
|---|---|---|---|---|
| Cog Ring | Ring | 28 | 22 | 10% FCR · +15 mana |
| Engine Pendant | Amulet | 30 | 24 | +1 all skills · 15% gold find |

Full (2): +10% FCR · +40 mana · 30% gold find.

**Backlog:** 15 further sets (~85 items) to author; keep one starter, one per-act theme, one
per-class theme, 2-3 endgame.

## Rune system (original, 13 tiers)

D2R has 33 runes. Our system uses 13 tiered runes with ladder rarity (drop weights in
`loot-and-drops.md`). Req lvl gates word usage (word req = highest rune req).

| Tier | Name | req | Weapon effect | Armor/helm effect | Shield effect |
|---|---|---|---|---|---|
| 1 | Tor | 1 | +5% IAS | +5% cold res | +5% cold res |
| 2 | Ven | 5 | +5% fire dmg | +5% fire res | +5% fire res |
| 3 | Kre | 9 | +15% def | +5 life | +5% light res |
| 4 | Mos | 13 | +5% cold dmg | +10% poison res | +10% poison res |
| 5 | Tahl | 17 | +7% IAS | +10 life | +10% all res |
| 6 | Gorn | 21 | +10% EDmg | +10% FHR | +5% block |
| 7 | Sek | 25 | +10% EDmg (undead) | +10 life | +10% all res |
| 8 | Reth | 31 | +5% cast speed | +20% mana | +10% magic res |
| 9 | Zul | 37 | +15% fire dmg | +10 life | +15% fire res |
| 10 | Vor | 43 | +10% EDmg | +5% DR | +5% max fire res |
| 11 | Xan | 49 | +15% cold dmg | +15 life | +15% cold res |
| 12 | Quor | 55 | +10% IAS | +5% DR | +5% max cold res |
| 13 | Nihl | 61 | +20% EDmg | +20 life | +20% all res |

## Words — 12 complete recipes (of ~50 planned)

Rules (see `sockets-gems-words.md`): exact rune sequence in a **gray base** of the correct
category with socket count **equal** to word length; the finished item gets every rune's
per-context effect **plus** the word bonus below; req lvl = highest rune req.

| Word | Sockets | Sequence | Base category | req | Word bonus (adds to rune effects) |
|---|---|---|---|---|---|
| First Light | 2 | Tor·Ven | caster weapon | 5 | 10% FCR · +25 mana · +10 fire dmg |
| Flickering Shroud | 2 | Ven·Kre | helm | 9 | +1 all skills · 10% FHR · +2 mana after each kill |
| Cold Compact | 3 | Kre·Mos·Tahl | shield | 17 | +10% block · 20% FBR · half freeze duration |
| Bleed-Edge | 3 | Tor·Gorn·Mos | sword | 21 | +60% ED · 25% open wounds · 5% life leech |
| Root and Bough | 3 | Mos·Gorn·Tahl | polearm | 21 | +80% ED · 8% life leech · +1.5 AR per clvl |
| Watcher's Sight | 3 | Tahl·Sek·Reth | helm | 31 | +5 all attributes · +15% mana · +10% all res |
| Severed Hour | 4 | Reth·Tahl·Gorn·Sek | caster weapon | 31 | 20% FCR · +1 all skills · +4 mana after each kill · +50 mana |
| Toll of Hours | 4 | Gorn·Reth·Vor·Kre | mace | 43 | +120% ED · 10% crushing blow · 20% FHR · attacker takes 12 |
| Iron Covenant | 4 | Vor·Quor·Tahl·Nihl | armor | 61 | 10% DR · +50 life · cannot be frozen · +20% all res |
| Last Oath | 5 | Nihl·Vor·Gorn·Quor·Sek | melee weapon | 61 | +240-300% ED · 30% IAS · prevent monster heal · 10% deadly strike · −20% target defense |
| Threshold | 4 | Nihl·Reth·Xan·Quor | armor | 61 | +2 all skills · grants Blink level 1 (o-skill teleport) · +45% FRW · +15% mana |
| Herald's Burden | 4 | Sek·Vor·Gorn·Nihl | polearm | 61 | grants level-12 Rallying Banner aura when equipped (party +%ED) · +220% ED · −15% target defense |

**Backlog:** 38 further words; keep the rarity ladder — cheap 2-3 socket utility words
through Nihl-anchored chase words. `Threshold` and `Herald's Burden` are the
teleport-armor and hireling-aura chase slots respectively.

## Stat-budget authoring rules

Budget points per qlvl (a unique's mod list must price out to `B(qlvl) ± 5%`):

```
B(qlvl) = 20 + 3 × qlvl        // uniques
Bset(qlvl) = 14 + 2 × qlvl     // per set piece (set bonuses priced separately at ~B/2 per tier)
Bword(req) = 30 + 4 × req      // word bonus only (rune effects ride free — they cost the runes)
```

Mod price sketch (full table in `src/sim/data/modCosts.ts`):

| Mod | Cost |
|---|---|
| +1% ED / def / single res / AR (per 5) | 0.5 |
| +1 life / mana (per 2) | 0.5 |
| 1% IAS / FCR / FHR / FRW / FBR | 1 |
| +1% all resist | 2 |
| +1% MF / gold find (per 5) | 1 |
| 1% leech (life or mana) | 4 |
| 1% DR / max-res | 8 |
| 1% crushing blow / deadly strike / open wounds | 2 |
| +1 single-tree skill | 15 |
| +1 class skills | 20 |
| +1 all skills | 25 |
| cannot be frozen | 30 |
| ignore target defense / o-skill grant | 35 |

Outliers (anything > +5% over budget) need a PR note per `CLAUDE.md` workflow rules.
