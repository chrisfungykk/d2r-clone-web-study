# Items & Affixes

> Base item taxonomy, quality tiers, affix system math, ethereal/superior mechanics.
> Sources canonicalized from `doc/research/r2-items-loot.md`.

## Base item taxonomy

Items are organized by:
- **Category:** weapon, armor, jewelry, charm, potion, scroll, gem, rune, key, quest
- **Weapon sub:** melee (1h/2h), ranged (bow/crossbow/thrown), caster (wand/scepter/staff/orb)
- **Armor sub:** light/medium/heavy helm, body armor, shield, gloves, boots, belt
- **Tier:** Normal → Exceptional → Elite (qlvl increases, stat ranges increase, level req increases)
- **Tier upgrade chain:** each base item (e.g., "Sword" → "War Sword" → "Battle Sword") has fixed
  qlvl and stat range. Higher tiers have higher str/dex reqs.

### Base item fields

```
id: string
category: string
subcategory: string
tier: 0 | 1 | 2        // normal/exceptional/elite
qlvl: number           // quality level = min ilvl to drop
tierUp: BaseItemId?    // next tier in chain (exceptional→elite link)
slot: EquipSlot[]      // valid equipment slots
gridSize: [w, h]       // inventory footprint
weaponClass?: string   // for weapon speed modifier lookup
wsm: number            // weapon speed modifier (-30 to +30, negative = faster)
dmgMin/dmgMax/defMin/defMax: number  // stat range per base
reqStr/reqDex/reqLvl: number
speedClass?: string    // base frame animation table key
maxSockets: number
classRestriction?: ClassId
```

## Quality tiers

Drop roll order (once the item generation decides "a weapon/armor/etc. will drop"):

```
1. Unique?   (fail → 2)
2. Set?      (fail → 3)
3. Rare?     (fail → 4)
4. Magic?    (fail → 5)
5. Superior? (fail → 6)
6. Normal
```

Quality chance uses the integer 128ths system with per-tier MF diminishing returns
(factor: unique 250, set 500, rare 600; magic tier applies MF linearly). The exact check,
item-ratio rows, and a worked example live in `loot-and-drops.md` (§ Quality check).

Fallback rules after a successful check:
- **Unique** succeeded but no eligible unique exists for this base (qlvl ≤ ilvl), or the
  specific unique already dropped this game → item becomes a **rare with 3× durability**.
- **Set** succeeded but no eligible set item for this base → **magic with 2× durability**.
- Jewelry-like types (rings, amulets, charms, jewels) skip superior/normal entirely: if
  unique/set/rare all fail, they are always at least magic.

## ilvl/alvl/qlvl

- **qlvl** (quality level): static per base item; gates when the base can drop and feeds
  the alvl math below.
- **ilvl** (item level): per item instance, set at creation. The exact assignment table
  (monster drop = killer mlvl; chest = area alvl; gamble = clvl−5..clvl+4; craft =
  floor(clvl/2) + floor(inputIlvl/2); vendor = clvl+5; imbue = clvl+4) is in
  `loot-and-drops.md` (§ ilvl assignment).
- **alvl** (affix level): derived at affix-roll time; the maximum affix `alvl` gate that
  may spawn. Exact integer formula:

```
ilvl = min(ilvl, 99)
if qlvl > ilvl: ilvl = qlvl              // only relevant after ilvl-lowering recipes
if magicLvl > 0:                         // small static bonus on a few base types
    alvl = ilvl + magicLvl               //   (e.g. circlet family, caster off-hands)
else if ilvl < 99 − floor(qlvl/2):
    alvl = ilvl − floor(qlvl/2)
else:
    alvl = 2·ilvl − 99
alvl = min(alvl, 99)
```

Consequences worth preserving: qlvl-1 bases (rings, amulets, jewels, charms) always have
alvl = ilvl; high-qlvl bases pay an alvl penalty until ilvl approaches 99, where the
`2·ilvl − 99` branch lets them catch up (any ilvl-99 item is alvl 99). The displayed
required level of a magic/rare item = max levelreq over base + rolled affixes (each affix
carries its own levelreq).[^alvl]

[^alvl]: Verified against `doc/research/r2-items-loot.md` §3.3 (cross-sourced from the
Project Diablo 2 wiki affix page, PureDiablo item generation, and the Amazon Basin affix
level chart).

## Affix system

### Affix table fields

```
id: AffixId
kind: "prefix" | "suffix"
group: number          // no two affixes with same group can appear on same item
alvl: number           // min affix level to be rollable
maxAlvlIf?: number     // some affixes stop appearing above this alvl (rare/magic pool management)
weight: number         // frequency in the weighted pool
itemTypes: ItemTypeId[]  // valid base type
scope: "magic" | "rareAlso" | "craftOnly"
stats: StatRollDef[]   // { stat: StatId, min: number, max: number }
```

### Roll process

1. Determine number of affix slots:
   - Magic: max 1 prefix + 1 suffix, at least one affix. Composition split:
     **25% prefix only, 50% suffix only, 25% both** (equivalently: 50% roll a prefix,
     then 50% add a suffix; if no prefix rolled, the suffix is guaranteed).
   - Rare: total affixes **uniform 3-6 (25% each)**; each slot independently 50/50
     prefix vs suffix, subject to max 3 prefixes and 3 suffixes (re-roll the side if
     full). Jewels cap at 4 total.
   - Crafted: 3 fixed craft mods + 1-4 random affixes (count table by crafted ilvl in
     `crafting-cube.md`).
2. For each slot, roll from eligible affixes (affix alvl gate ≤ item alvl ≤ affix
   maxAlvl, item type matches, group not already used)
   - Weighted random selection on the `weight` field
3. For each selected affix, roll stat values uniformly within [min, max]
   - There is no extra "min roll" floor on rares — same uniform roll as magic
   - Numeric affixes come in tier ladders sharing a `group` with rising alvl gates,
     so tiers never stack on one item

### Affix count by quality

| Quality | Min affixes | Max affixes | Notes |
|---|---|---|---|
| Magic | 1 | 2 | 25% prefix only / 50% suffix only / 25% both |
| Rare | 3 | 6 | Uniform 25% each for 3/4/5/6; ≤3 prefixes, ≤3 suffixes, no duplicate groups; jewels cap at 4 |
| Crafted | 1-4 random | + 3 fixed | Caster/blood/hitpower/safety families; random count by crafted ilvl (see crafting-cube.md) |
| Unique | fixed table | — | Every unique has predefined stat list |
| Set | fixed table | — | Every set item has predefined stat list |

### Staffmods (class skills on class-specific items)

Per-class items (warden staves, shadow claws, etc.) can roll +1-3 to a random class skill
as an automatic modifier (automod). The tier of skill (by level gate) is determined by ilvl:

| ilvl range | Tiers rollable |
|---|---|
| 1-24 | Tier 1 (lv 1) skills |
| 25-36 | Tier 1-2 (lv 1, 6) |
| 37+ | Tier 1-3 (lv 1, 6, 12) |

+value distribution: 10% +1, 20% +2, 70% +3 (for items high-enough ilvl; capped at +3).

## Ethereal items (exact)

- **1/20 (5%)** chance on eligible dropped equipment; rolls independently of the quality
  check, so normal, superior, magic, rare, and unique items can all spawn ethereal.
- **Ineligible:** anything without durability (bows, crossbows, jewelry, charms, jewels,
  quest items), set items, crafted items. Never appears in vendor stock or gambling.
- **Effects:** +50% base damage (weapons) and +50% base defense (armor/helm/shield),
  applied to the base roll before all other bonuses; str and dex requirements each
  reduced by 10.
- **Max durability = floor(base / 2) + 1** (a 20-durability base becomes 11).
- **Cannot be repaired** by vendors or repair recipes. Self-repair affixes still tick,
  but an item that reaches 0 durability stays broken. The indestructible affix + ethereal
  = full bonus with no durability drawback (best possible base).[^eth]

[^eth]: Verified against PureDiablo/Maxroll/community wikis: bonus is +50% (the +25%
figure recorded in `doc/research/r2-items-loot.md` §1.5 is wrong), −10 str/dex,
durability floor(base/2)+1, 5% spawn chance.

## Superior items (exact)

- Checked after the magic roll fails (the "high quality" tier of the 128ths system).
- Rolls 1-2 superior mods:
  - **Weapons:** +5-15% enhanced damage, +1-3 attack rating, or +10-15% max durability.
    %ED and +1 max damage are mutually exclusive alternatives: if the rolled %ED would
    not raise the weapon's max damage by at least 1, the item gets **+1 max damage**
    instead (low-damage bases therefore never show %ED).
  - **Armor/helm/shield:** +5-15% enhanced defense and/or +10-15% max durability.
- Can be socketed, spawn ethereal, and be used in words — the %ED/%def superior mod
  persists through word creation, which is why superior bases are premium word fodder.
- Cannot roll magic+ affixes; sells at a small premium; repair cost scales up.[^sup]

[^sup]: Mod list and ranges verified against `QualityItems.txt`-derived community data
(diablowiki item-quality page, Maxroll durability reference).

## Durability baselines

Max durability is a per-base field; canonical baseline bands by item class (normal-tier
anchors — exceptional/elite versions of a family carry higher values per the tier chain):

| Item class | Baseline max durability |
|---|---|
| Body armor | 20 (lightest) – 70 (heaviest plate) |
| Helms | 12 – 40 |
| Shields | 12 (buckler-class) – 140 (tower-class) |
| Gloves / boots / belts | 12 – 24 |
| Swords | 20 – 50 |
| Axes | 20 – 50 |
| Blunt (clubs/maces/hammers/scepters) | 30 – 72 |
| Polearms | 40 – 65 |
| Spears | 25 – 35 |
| Daggers | 16 – 24 |
| Staves / wands | 15 – 50 |
| Bows / crossbows | no durability (can never be ethereal) |
| Thrown weapons | quantity instead of durability |
| Jewelry / charms / jewels | no durability, never degrade |

## Jewels

1×1 socketable affix-carriers — the "player-authored gem" of the socket system:

- Quality: **magic (1-2 affixes) or rare (3-4 affixes; hard cap 4)**; unique jewels exist
  as fixed-prop drops. Never superior/normal/socketed/ethereal.
- Own affix pool (%ED, IAS, min/max damage, AR, resists, stats, requirement reduction),
  standard weighted selection and alvl gating; qlvl 1 ⇒ alvl = ilvl.
- Socket into any socketable base type; insertion is permanent (the socket-clearing
  recipe destroys the jewel, not the base).
- A base containing a jewel (or gem) can never form a word — words require runes only,
  in exact sequence.
- Crafting recipes consume one jewel as an ingredient; the jewel's own affixes are
  discarded, not inherited.

## Charms

Charms grant their affix effects **while in the main inventory grid** (not in the stash
or the transmutation cube).

| Size | Grid | Affix pool |
|---|---|---|
| Small | 1×1 | small-charm prefix/suffix ladders (lowest values) |
| Large | 1×2 | large-charm ladders |
| Grand | 1×3 | grand-charm ladders (highest values) |

- Quality: **magic only** — never rare, superior, socketed, or ethereal. Unique charms
  exist only as fixed-prop event drops (below).
- Standard magic composition (max 1 prefix + 1 suffix, 25/50/25 split) and alvl math;
  charm bases are qlvl 1, so alvl = ilvl.
- Pools are size-specific value ladders: life, single/all resists, elemental damage, AR,
  FHR, FRW, MF, attributes. The **+1 skill-tree prefix exists only on grand charms**
  (alvl 50 gate); the top flat-life suffix gates at alvl 91 — reproducing the classic
  "ilvl 91+ grand charm" chase (skill tree + max life on one charm).
- Reroll lever: 3 perfect gems + charm → same base rerolled at the same ilvl
  (see crafting-cube.md).
- **Unique charm slots** (each has carry limit 1 — a second one cannot be picked up):
  - "Heartbrand" — large charm, boss-key event finale reward (+3 to one class's skills;
    see endgame.md).
  - "Bleeding Star" — small charm, world-event superboss reward (+1 all skills; see
    endgame.md).
  - Immunity-breaking grand charms ("Ember Shard" family; see endgame.md).

## Item generation (chest mlvl)

For chest/corpse/container drops: ilvl = area alvl. TC quality roll as normal. Unique
items from chests: use the standard unique check (no penalty).
