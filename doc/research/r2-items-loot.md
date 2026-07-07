# R2 — Items & Loot Generation (D2/D2R Mechanics Reference)

Engineering reference for a deterministic loot engine. Documents the *mechanics* of Diablo II
(LoD 1.10–1.13 / D2R) item generation as verified against community reverse-engineering of the
game's data files (`weapons.txt`, `armor.txt`, `misc.txt`, `ItemRatio.txt`, `TreasureClassEx.txt`,
`MagicPrefix.txt`, `MagicSuffix.txt`, `AutoMagic.txt`, `CubeMain.txt`).
Per project IP policy: schemas, formulas, counts, and curves only — at most 1–2 canonical examples
per concept. All content entries for our game will be original.

Confidence tags: **[V]** = verified against 2+ sources or raw game data; **[1S]** = single source;
**[U]** = unverified/from memory, see Uncertainties.

---

## 1. Base Item Taxonomy

### 1.1 Data schema (per base item row)

Every base item is one row in a weapons/armor/misc table. Fields relevant to loot:

| Field | Meaning |
|---|---|
| `code` | 3–4 char unique id |
| `level` (**qlvl**) | quality level; gates when the base can drop (needs mlvl/TC ≥ qlvl) and feeds affix-level math |
| `levelreq` | character level to equip |
| `reqstr`, `reqdex` | attribute requirements |
| `mindam`/`maxdam` (+2-hand, +throw variants) | weapon base damage |
| `minac`/`maxac` | armor base defense — rolled uniformly per item instance |
| `speed` (**WSM**) | weapon speed modifier; lower = faster; observed range ≈ −60…+20; input to the attack-speed/IAS breakpoint formula (see R3 combat doc) |
| `StrBonus`/`DexBonus` | % damage scaling per stat point (usually 100/0, 1H swords/daggers 75/75 etc.) |
| `durability`, `nodurability` | max durability; no-durability items (bows) can never be ethereal |
| `stackable`, `quantity` | throwables/keys/arrows |
| `gemsockets` | per-base absolute max sockets |
| `gemapplytype` | which gem/rune effect column applies: 0=weapon, 1=armor/helm, 2=shield |
| `invwidth × invheight` | inventory grid footprint |
| `normcode` / `ubercode` / `ultracode` | links the three tier versions of the same family |
| `type` (itype) | item type node in a type tree (e.g. "sword" < "melee weapon" < "weapon") — used by affix/TC/recipe/runeword filters |
| `magic lvl` | bonus added to alvl for a few types (see §3) |
| `rarity` | weight when a TC picks among bases of the same band **[U exact use]** |
| vendor columns (`<Vendor>Min/Max/MagicMin/MagicMax/MagicLvl`) | shop stocking rules (see §13) |

### 1.2 Tier system: Normal → Exceptional → Elite **[V]**

- Each equipment "family" exists in exactly 3 versions sharing appearance, linked by
  `normcode/ubercode/ultracode`. Same slot/size; different name, qlvl, level req, str/dex req,
  damage/defense, and durability.
- Rough banding (design curve, not exact table): Normal qlvl ~1–30 with mostly no levelreq;
  Exceptional qlvl ~25–60, levelreq ~21–45 (intended for Nightmare); Elite qlvl ~39–87,
  levelreq ~39–73 (intended for Hell).
- Scaling pattern: Exceptional ≈ ×1.5–2 damage / +~50% defense vs Normal; Elite adds a further
  ~20–50% and often *higher str reqs but sometimes better speed*. Sell value and repair cost scale
  with tier.
- The quality roll uses a different `ItemRatio.txt` row for exceptional/elite ("uber") bases (§2.3).
- Cube "upgrade" recipes move an item along this normcode→ubercode→ultracode chain keeping its
  affixes (§11).

### 1.3 Weapon / armor classes **[V]**

- Weapon classes: axes, swords, daggers, clubs/maces/hammers/scepters/wands/staves (blunt family),
  polearms, spears, bows, crossbows, javelins, throwing weapons.
- Armor slots: body armor, helm, shield, gloves, boots, belt (belts also define potion-slot rows).
- Jewelry: ring, amulet (qlvl 1, no base stats, affix-only carriers).
- Class-specific categories (7): bow/spear/javelin (class A), claw (class B), primal helm (class C),
  pelt (class D), shrunken head (class E), class shield (class F), orb (class G) — each usable by
  one class only, each with all 3 tiers, each able to roll inherent class-skill automods (§4.6),
  and each using the "Class Specific" quality-ratio row (§2.3).

### 1.4 Inventory grid sizes **[V common values; U edge cases]**

| Item | Size |
|---|---|
| ring, amulet, gem, rune, jewel, small charm, potion, scroll, key(stack) | 1×1 |
| large charm, wand, dagger, tome (20 scrolls) | 1×2 |
| grand charm, arrows/bolts (stack), javelin | 1×3 |
| gloves, boots, belt, helm, most shields | 2×2 |
| body armor, tower-class shields, many 1H weapons | 2×3 |
| 2H weapons, bows, polearms, staves, largest shields | 2×4 (max footprint) |

Max grid footprint in D2 is 2 wide × 4 tall. Our schema: `invW ∈ {1,2}`, `invH ∈ {1..4}`.

### 1.5 Ethereal modifier **[V concept; U exact numbers]

- ~5% (1/20) chance on eligible dropped equipment of any quality (needs durability; excludes
  bows/indestructible bases and quest items). Not available from vendors/gambling.
- Effects: +25% base damage/defense, −10 str and −10 dex requirement, roughly half max durability,
  cannot be repaired by vendors (self-repair affixes/recipes still work).

**Sources:** base schema & tiers cross-checked via `weapons.txt`/`armor.txt` structure at
https://github.com/fabd/diablo2/tree/master/code/d2_113_data ; taxonomy nav at
https://d2r.world/en-US/info/item/base ; https://classic.battle.net/diablo2exp/ (Arreat Summit).

---

## 2. Item Generation Pipeline

### 2.1 Order of operations per dropped item **[V]**

```
1. Resolve Treasure Class tree (§5) -> concrete base item code (or gold/potion/misc/rune) 
2. Set ilvl = mlvl of killer-owner monster (chest: area level) (§3.2)
3. Quality selection, checked IN THIS ORDER, stop at first success:
     unique -> set -> rare -> magic -> superior(hiquality) -> normal
   all fail -> low quality
   (jewelry/charms/jewels skip superior/normal: they are always >= magic)
4. Concrete generation:
     unique: pick eligible unique for this base (qlvl<=ilvl), weighted by rarity;
             none eligible OR already dropped this game -> RARE with 3x durability
     set:    pick eligible set item for this base; none -> MAGIC with 2x durability
     rare:   roll 3-6 affixes (§4.4) + two-part generated name
     magic:  roll 1-2 affixes (§4.3)
     superior: roll 1-2 superior mods; low quality: apply stat penalty
5. Post rolls: sockets-on-drop (§7), ethereal (§1.5), defense roll in [minac,maxac],
   durability roll where applicable
```

### 2.2 The 128ths quality check **[V]**

For each quality tier in order, using that tier's columns from `ItemRatio.txt`:

```
Chance   = (BaseChance - floor((ilvl - qlvl) / Divisor)) * 128
if tier in {unique, set, rare}:
    EMF  = floor(MF * Factor / (MF + Factor))     # Factor: unique=250, set=500, rare=600
else:
    EMF  = MF                                      # magic tier: linear MF
Chance   = floor(Chance * 100 / (100 + EMF))
if Chance < MinChance: Chance = MinChance          # floor caps the best possible odds
FinalChance = Chance - floor(Chance * QualityFactor / 1024)   # QualityFactor from the TC (§5)
roll = RND[FinalChance]                            # uniform integer 0 .. FinalChance-1
success iff roll < 128                             # i.e. P = 128 / FinalChance
```

All arithmetic is integer. The ×128 exists purely for precision; `P(success) = 128/FinalChance`,
and if `FinalChance <= 128` the check always succeeds (this is how boss TCs with
MagicFactor = 1024 guarantee ≥ magic quality: FinalChance becomes 0).

Worked example (Hell act-boss, mlvl 99, base qlvl 86, 167% MF, boss UniqueFactor 983):
`(400 − (99−86)/1)·128 = 49536` → EMF `= 167·250/417 = 100` → `49536·100/200 = 24768` (≥ 6400 floor)
→ `24768 − 24768·983/1024 = 992` → **P(unique) = 128/992 ≈ 12.9%**.

### 2.3 ItemRatio rows (v1.13 values) **[V]**

Four rows selected by (uber?, class-specific?) of the base item. `(Base / Divisor / Min)`:

| Row | Unique | Set | Rare | Magic | HiQuality | Normal |
|---|---|---|---|---|---|---|
| Normal bases | 400 / 1 / 6400 | 160 / 2 / 5600 | 100 / 2 / 3200 | 34 / 3 / 192 | 12 / 8 / – | 2 / 2 / – |
| Uber (exceptional/elite) | same as above except Normal = 1 / 1 | | | | | |
| Class-specific | 240 / – / – | 120 / – / – | 80 / – / – | 17 / – / – | – | – |

(Class-specific divisors/mins follow the same pattern; not re-verified — see Uncertainties.)
Interpretation: best possible unique odds without a boss QualityFactor = 128/6400 = 2%;
set 128/5600 ≈ 2.3%; rare 128/3200 = 4%; magic floor 128/192 = 66.7%.

### 2.4 Notes for engine design

- MF affects only the quality *checks*; never base selection, rune/gold drops, or affix rolls.
- Quality of jewelry-like types (rings/amulets/charms/jewels) short-circuits: if unique/set/rare
  fail they become magic (never superior/normal/low).
- "Already dropped" uniqueness: a specific unique can spawn once per game instance; re-rolls
  degrade to 3×-durability rare. Decide whether to keep this rule (per-game registry) or drop it.

**Sources:** https://www.purediablo.com/forums/threads/item-generation-tutorial.110/ (Warrior of
Light "Item Generation Tutorial", canonical); https://d2mods.info/forum/viewtopic.php?t=30222
("How the game uses ItemRatio.txt", worked example); raw values
https://github.com/fabd/diablo2/blob/master/code/d2_113_data/ItemRatio.txt .

---

## 3. ilvl / qlvl / alvl Relationships

### 3.1 Definitions

- **qlvl** — static per base item type (data file). Gates drops and alvl.
- **ilvl** — per item instance, set at creation (below). Stored on the item, invisible in-game.
- **alvl** — derived at affix-roll time; the maximum affix `level` that may spawn.
- **magic_lvl** — small static bonus on a few base types (e.g. non-elite wands/staves/orbs +1,
  circlet family +3/+8/+13/+18) that inflates alvl. Optional for our engine.

### 3.2 How ilvl is assigned **[V]**

| Creation path | ilvl |
|---|---|
| Monster drop | `mlvl` of the monster (Normal: per-monster; NM/Hell: mlvl = area level for regulars, +2 champions, +3 uniques/minions; act bosses fixed) |
| Chest / object | area level |
| Vendor shop stock | `clvl + 5` (Normal-difficulty per-act caps 12/20/28/36/45; uncapped NM/Hell; max 99) |
| Gambling | `clvl − 5 + RND[10]` → uniform in `[clvl−5, clvl+4]`, floor 5 |
| Craft recipe | `floor(clvl/2) + floor(ilvl_input/2)` |
| Imbue quest | `clvl + 4` |
| Reroll recipes | recipe-specific (§11.2) |

(D2R Terror Zones raise mlvl toward clvl with per-rank caps ≈96/97/98, i.e. a mechanism to make
any zone endgame-viable for drops. **[1S]**)

### 3.3 alvl formula (exact, integer math) **[V]**

```
ilvl' = min(ilvl, 99)
if qlvl > ilvl': ilvl' = qlvl              # only matters after ilvl-lowering recipes
if magic_lvl > 0:
    alvl = ilvl' + magic_lvl
else:
    if ilvl' < 99 - floor(qlvl/2):
        alvl = ilvl' - floor(qlvl/2)
    else:
        alvl = 2*ilvl' - 99
alvl = min(alvl, 99)
```

Consequences worth preserving: qlvl-1 bases (rings/amulets/jewels/quivers) always have
`alvl = ilvl`; high-qlvl bases pay an alvl penalty until ilvl approaches 99, then the
`2*ilvl−99` branch lets them catch up (any ilvl-99 item is alvl 99). Community thresholds:
ilvl 85+ ⇒ alvl ≥ 71 for all qlvl ≤ some bound; ilvl 92+ ⇒ alvl ≥ 85 for qlvl ≤ 13.

Note: the displayed "required level" of a magic/rare item = max levelreq over base + rolled
affixes (each affix carries its own `levelreq`; the "75% of alvl" folklore is NOT reliable).

**Sources:** https://wiki.projectdiablo2.com/wiki/Item_Affixes (formula + alvl chart);
https://www.purediablo.com/diablo-2/item-generation ;
https://www.theamazonbasin.com/wiki/index.php/Affix_level_chart .

---

## 4. Affix System Schema

### 4.1 Affix record schema **[V]**

Two tables (prefixes, suffixes); an item's magic name = `<prefix> <base> <suffix>`. Fields:

| Field | Meaning |
|---|---|
| `name` | display word |
| `spawnable` | can roll randomly (0 = recipe/vendor-only entries) |
| `rare` | allowed on rare/crafted items (some affixes are magic-only, e.g. +3-to-skill-tree tiers) |
| `level` | **alvl gate**: affix eligible iff `level <= alvl` |
| `maxlevel` | optional: affix stops spawning when alvl > maxlevel (used to retire low tiers) |
| `levelreq` | clvl needed to equip an item carrying it |
| `frequency` | selection weight among eligible affixes (0 = never random) |
| `group` | mutual-exclusion group id — max one affix per group per item |
| `mod1..3 (code,param,min,max)` | up to 3 stat effects; value rolled uniform in [min,max] |
| `itype1..7 / etype1..5` | include/exclude item-type filters |
| `classspecific / class / classlevelreq` | class-gated affixes |
| `multiply/add` | vendor price effect |

Selection algorithm per affix slot: filter by (spawnable, rare-allowed if rare/craft, itype
include/exclude, level ≤ alvl ≤ maxlevel, group not used) → weighted pick by `frequency` →
roll value in [min,max].

### 4.2 Tiered ladders (schema example) **[V]**

Numeric affixes come in tier families sharing a `group`, with rising `level` gates — e.g. the
weapon %-enhanced-damage prefix ladder ends in a top tier of **+201–300% ED at alvl 51**
("Cruel" in D2 — cited for grounding only). Design pattern: 6–10 tiers per stat family, each tier
a separate row with its own level/frequency, same group so tiers never stack.

### 4.3 Magic items **[V]**

- 1 prefix max + 1 suffix max, at least one affix.
- Composition split: **25% prefix only, 50% suffix only, 25% both** (equivalently: 50% roll a
  prefix; then 50% add a suffix; if no prefix, suffix guaranteed).
- Magic-only affixes (rare=0) let magic items exceed rare power in narrow lanes (e.g. +3 skill
  tab); this is a deliberate schema lever.

### 4.4 Rare items **[V]**

- Total affixes: uniform **3–6 (25% each)**; jewels cap at 4.
- Each affix slot independently 50/50 prefix vs suffix, subject to max 3 prefixes and 3 suffixes
  (re-rolled if side is full).
- No duplicate affix, no duplicate `group`.
- Name = 2 words drawn from dedicated rare-name tables (first-word list + second-word list),
  keyed by item class.
- Min-roll note: rares roll each mod value uniformly in the affix's [min,max] like magic items;
  there is no extra "min roll" floor. (Crafted items share the rare affix pool, §11.3.)

### 4.5 Staffmods **[V concept]**

Class-skill bonuses (+1–3 to specific class skills) generated *on the base item itself* at
creation time for class-usable types (staves/wands/scepters + the 7 class-specific categories).
Independent of quality — they appear on white/superior items too (which is why shop-scanning for
them works), stack with affixes, and are gated by ilvl-driven eligibility of each skill.

### 4.6 Automods **[V concept]**

A separate auto-affix table applies fixed hidden affix groups to certain base types regardless of
quality (the mechanism behind inherent bonuses on class items, e.g. class-shield resistances /
skill automods). Schema: `(itype filter, group, mod, min, max, level gate)` — same shape as an
affix row, applied unconditionally with a random pick within its group.

**Sources:** https://wiki.projectdiablo2.com/wiki/Item_Affixes ;
https://diablo2.diablowiki.net/Prefix ; https://planetdiablo.eu/diablo2/itemdb/affix_info_en.php ;
https://www.purediablo.com/diablo-2/item-generation ; Arreat Summit affix pages.

---

## 5. Treasure Classes

### 5.1 TC row schema **[V]**

```
TC := { name, group?, level?, picks,
        qualityFactors: {unique, set, rare, magic},   # 0..1024, feed §2.2 FinalChance step
        noDrop,                                       # weight of "drop nothing"
        entries: [ (ref, prob) x up to 10 ] }         # ref = item code | sub-TC | "gld[,mul=N]"
```

TCs form a recursive tree: roll once over `noDrop + Σprob` weights, descend into sub-TC, repeat
until a leaf (item code / gold / nothing). QualityFactors are inherited down the chain
(max of factors seen **[U exact combine rule]**) and applied in the quality check.

Atomic equipment TCs band all bases by qlvl in steps of 3 (armor bands 3,6,…,87; weapons same),
so "armor band 30" contains every armor base with qlvl 28–30. Monster TCs are per act × difficulty
× monster archetype, typically referencing `{Equip, Junk, Good, gld}` sub-TCs plus potions.

### 5.2 Picks **[V]**

- `picks = N > 0`: make N independent weighted rolls over the entry list (noDrop included each time).
- `picks = −N < 0`: **guaranteed multi-drop**: iterate the first N entries in order; entry i drops
  `prob_i` items from its sub-TC (prob is a count, not a weight).
- Hard cap: max 6 items dropped per monster kill, applied after picks (earlier entries win).

Example (v1.13 data): Hell act-5 boss TC = picks 7, qualityFactors 983/983/983/1024, noDrop 15,
entries `gld,mul=2048 ×5, EquipB ×52, Junk ×5, Good ×3` (weights; total incl. noDrop = 80).
A "quest kill" variant of boss TCs uses noDrop 0 (first-kill bonus drop).

### 5.3 NoDrop and the player-count formula **[V]**

Base: `P(nothing per pick) = noDrop / (noDrop + ProbSum)`, `ProbSum = Σ prob_i`.

With more players, noDrop is substituted:

```
N          = 1 + floor(AdditionalPlayers/2) + floor(ClosePartiedPlayers/2)
X          = ( noDrop / (noDrop + ProbSum) ) ^ N
newNoDrop  = floor( ProbSum * X / (1 - X) )
```

- `AdditionalPlayers` = other players anywhere in game (incl. simulated `/players X` minus 1);
  `ClosePartiedPlayers` = partied players within ~2 screens. Each *pair* of halves matters →
  effective steps at players 1/3/5/7 for unpartied.
- TCs with `noDrop = 0` are unaffected. Boss noDrop (15 vs 80) reaches 0 at ≈ players 5 unpartied.

### 5.4 TC upgrading in NM/Hell **[V]**

TC rows carry optional `(group, level)`. In Nightmare/Hell only:

```
effectiveTC = the highest-`level` TC in the same `group` with level <= mlvl
```

Combined with "NM/Hell mlvl = area level (+2 champ / +3 unique)", this is why high-level areas
drop high bases everywhere: the monster's nominal TC auto-upgrades to its band ≤ mlvl.
Nested/child TCs are not re-upgraded; Normal difficulty never upgrades.

### 5.5 Gold drops **[V mechanism; U base amount]**

- `gld` leaf entries drop a gold pile; `gld,mul=N` scales the amount by `N/1024`
  (1280→×1.25, 2048→×2). Plain `gld` ≡ `mul=1024`.
- Base pile size is a random amount scaling with mlvl and difficulty (exact base roll not
  reverse-engineered in sources; observed cap ≈5k pre-GoldFind). Champions always drop gold or an
  item plus 2 potions; boss TCs weight gold explicitly.
- Gold Find %: final = base × (1 + GF/100); merc GF counts on merc kills. MF never affects gold.

**Sources:** https://diablo2.diablowiki.net/Guide:Magic_Find_Guide_v1.11,_by_Hrus (noDrop formula);
https://diablo2.diablowiki.net/Player_Settings ;
https://github.com/fabd/diablo2/blob/master/code/d2_113_data/TreasureClassEx.txt (raw rows);
https://d2mods.info/forum/kb/viewarticle?a=410 (TreasureClassEx docs);
https://www.purediablo.com/diablo-2/diablo-2-treasure-class ;
https://www.purediablo.com/d2wiki/Gold_Find .

---

## 6. Magic Find

**[V]** Applied inside each quality check (§2.2). Per-tier diminishing returns:

```
EffectiveMF(tier) = floor( MF * F / (MF + F) )      F: unique=250, set=500, rare=600
EffectiveMF(magic) = MF                              (linear, no cap)
```

Asymptotes: unique → +250% max, set → +500%, rare → +600% (never reached). Reference points:
MF 100 → EMF_u 71; MF 300 → EMF_u 136; MF 1000 → EMF_u 200. Because magic is checked last but
unaffected, huge MF shifts distribution magic→rare→set→unique in that priority order.
MF sums from all worn gear + charms; killer's merc MF adds to the owner's on merc kills.
MF does not apply to: gold, rune/gem/misc leaf drops, base selection, gambling, or affix quality.

**Sources:** https://diablo2.diablowiki.net/Magic_find_diminishing_returns ;
https://www.purediablo.com/diablo-2/magic-find-diminishing-returns ; Item Generation Tutorial.

---

## 7. Sockets

### 7.1 Max sockets = min(per-base cap, type/ilvl bracket, source rule) **[V]**

ilvl brackets: **1–25 / 26–40 / 41+** (some sources give 26–41/42+; off-by-one, see Uncertainties).
Type table (D2R reference):

| Item type | ilvl 1–25 | 26–40 | 41+ |
|---|---|---|---|
| Body armor | 3 | 4 | 4 |
| Shields (generic) | 3 | 3 | 4 |
| Class shields | 3 | 4 | 4 |
| Shrunken heads | 2 | 2 | 2 |
| Helms | 2 | 2 | 3 |
| Class helms (barb/druid) | 2 | 3 | 3 |
| Circlet family | 1 | 2 | 3 |
| Staves | 5 | 6 | 6 |
| Axes (large) | 4 | 5 | 6 |
| Scepters | 3 | 5 | 5 |
| Class bows | 3 | 4 | 5 |
| Generic weapons | 3 | 4 | 6 |
| Daggers / claws / orbs | 2 | 3 | 3 |
| Wands | 2 | 2 | 2 |

Each individual base also has its own `gemsockets` cap (e.g. a 1×2 blade caps at 2 regardless).

### 7.2 Socket sources & roll odds

- **On drop**: normal/superior items may spawn socketed (socketed counts as the "normal" outcome
  branch with a socket sub-roll). Natural spawn count additionally capped by difficulty:
  ≤3 Normal, ≤4 NM, ≤6 Hell **[1S]**. Roll: uniform 1–6, then clamp to caps → probability mass of
  the clamp lands on the max (e.g. cap 4 ⇒ P(4) = 3/6).
- **Cube socketing recipes** (one per slot family: weapon/armor/shield/helm; ingredients =
  2 specific low runes + 1 perfect gem + the item): requires **normal quality, unsocketed**
  (not low-quality/superior/magic+). Result: uniform `RND[6]+1` clamped to (type∩ilvl∩base) max —
  same clamp-mass rule. **[V]**
- **Quest socket reward** (Larzuk-style, once per difficulty): white base → **max** sockets for its
  type+ilvl (deterministic); magic → 1–2 (50/50); rare/set/unique/crafted → exactly 1. **[V]**
- ilvl-manipulation interaction: recipes that reset ilvl (e.g. low-quality→normal sets ilvl=1)
  intentionally shrink the socket cap — keep this coupling.

**Sources:** https://d2r.world/en-US/info/misc/baseilvlsockets ; https://maxroll.gg/d2/items/sockets ;
https://diablo2.diablowiki.net/Sockets ; https://diablobytes.com/d2-resurrected/guides/socket-guide/ .

---

## 8. Gems

- **7 families** (6 gems + skull) × **5 tiers** = 35 items: chipped → flawed → normal → flawless →
  perfect. Each tier is a distinct 1×1 item with rising qlvl. **[V]**
- **Per-slot effect structure**: every gem defines exactly 3 effects keyed by the receiving item's
  `gemapplytype`: weapon (0), armor/helm (1), shield (2). Effect magnitude scales with tier.
  Canonical examples: ruby = fire damage (weapon) / +life (armor) / fire resist (shield);
  skull = dual leech (weapon) / life+mana regen (armor) / attacker-takes-damage (shield). **[V]**
- **Upgrade recipe**: 3 same-tier same-family → 1 next tier (3:1). Cost to perfect from chipped =
  3^4 = 81 chipped. **[V]**
- Drops: gem TCs per tier (chipped/flawed/normal/flawless) referenced from act "Good" TCs with
  weights rising by act; the v1.13 Hell act-5 Good row weights = chipped 4 / flawed 10 / normal 14 /
  flawless 28 (plus jewelry 60, runes 14). Perfect tier droppability: see Uncertainties.
- Gems socket permanently (no removal that preserves the gem; a "clear sockets" recipe destroys
  fillers **[V concept]**).

**Sources:** Arreat Summit gems page (classic.battle.net); TreasureClassEx raw data (fabd/diablo2);
https://d2r.world/en-US/info/item/recipes .

---

## 9. Runes

### 9.1 Ladder **[V]**

33 runes, #1→#33, each a 1×1 socketable with a clvl requirement rising in pairs from 11 to 69
(one mid-ladder rune anomalously has none). Like gems, each rune defines 3 effects by
`gemapplytype` (weapon / armor+helm / shield). Examples: #1 (El) +50 AR +1 light radius in weapons;
#33 (Zod) = indestructible in weapons.

### 9.2 Drop rarity curve — exact TC data (v1.13) **[V raw data]**

Rune drops route through 17 chained TCs, `Runes 1` … `Runes 17`. Each `Runes N` (N≥2) contains:
lower rune of its pair (prob 3), higher rune (prob 2), and a fallback to `Runes N−1` whose prob
grows superlinearly — this single mechanism produces the exponential high-rune rarity:

| TC | runes (prob) | fallback prob to previous |
|---|---|---|
| Runes 1 | #1 (3), #2 (2) | — |
| Runes 2 | #3 (3), #4 (2) | 2 |
| Runes 3 | #5 (3), #6 (2) | 5 |
| Runes 4 | #7 (3), #8 (2) | 7 |
| Runes 5 | #9 (3), #10 (2) | 12 |
| Runes 6 | #11 (3), #12 (2) | 22 |
| Runes 7 | #13 (3), #14 (2) | 45 |
| Runes 8 | #15 (3), #16 (2) | 90 |
| Runes 9 | #17 (3), #18 (2) | 180 |
| Runes 10 | #19 (3), #20 (2) | 360 |
| Runes 11 | #21 (3), #22 (2) | 720 |
| Runes 12 | #23 (3), #24 (2) | 1066 |
| Runes 13 | #25 (3), #26 (2) | 1519 |
| Runes 14 | #27 (3), #28 (2) | 2170 |
| Runes 15 | #29 (3), #30 (2) | 2941 |
| Runes 16 | #31 (3), #32 (2) | 3957 |
| Runes 17 | #33 (1) | 5170 |

So P(#33 | Runes 17 hit) = 1/5171; P(#32 | Runes 17) = (5170/5171)·(2/3962)… each level down
multiplies survival probability. Within a pair the higher rune is 2/3 as likely as the lower.

### 9.3 Where high runes can drop (TC caps) **[V]**

Every act×difficulty "Good" TC references a *capped* `Runes N` (rising by act/difficulty; only
Hell late acts reference `Runes 17`), so top runes simply cannot appear from low areas — no
special-case code needed. Special farming monsters use dedicated rune TCs with negative picks
(e.g. the tower boss: picks −2 → 5 item-TC drops + 3 rune-TC drops, 6-drop cap; her rune TC caps
at Runes 4 / 8 / 12 by difficulty, giving reliable low-mid runes but never top runes).

### 9.4 Upgrade recipes **[V]**

Gem families cycle in fixed order across recipes: topaz→amethyst→sapphire→ruby→emerald→diamond.

```
3 × rune(n)                    -> rune(n+1)   for n = 1..9      (no gem)
3 × rune(n) + chipped gem      -> rune(n+1)   for n = 10..15    (gem cycles)
3 × rune(n) + flawed gem       -> rune(n+1)   for n = 16..21
2 × rune(n) + flawed diamond   -> rune(22)    (n = 21 -> 22 starts 2:1)
2 × rune(n) + normal gem       -> rune(n+1)   for n = 22..27
2 × rune(n) + flawless gem     -> rune(n+1)   for n = 28..32
```

(Cube-cost of a #33 from #1s ≈ 3^9·2^12 ≈ 80.6M — the 2:1 tail keeps top runes tradable but
uncraftable in practice. In legacy bnet the 2:1 recipes were ladder-only; D2R enables everywhere.)

**Sources:** https://github.com/fabd/diablo2/blob/master/code/d2_113_data/TreasureClassEx.txt ;
https://d2r.world/en-US/info/item/runes ; https://d2mods.info/forum/kb/viewarticle?a=412 ;
https://d2runewizard.com/articles/mechanics/countess .

---

## 10. Runewords

Mechanics only. **[V]**

- A runeword activates iff ALL hold at insertion of the final rune:
  1. Base is **non-magic quality**: normal or superior (ethereal ok; low-quality: see
     Uncertainties). Never magic/rare/set/unique/crafted.
  2. Base's item type matches the word's allowed-type list (types use the itype tree: e.g.
     "body armor", "shields", "axes|scepters|hammers", "missile weapons", "any weapon").
  3. Socket count **exactly equals** the word length (a 4-socket base can NOT make a 3-rune word).
  4. Runes are inserted in the word's **exact sequence** (socket order = insertion order).
- On activation the item gains: the word's name (replaces base display name), the word's own
  property list, **plus** each socketed rune's normal per-slot effect — both stack; superior
  mods and staffmods on the base also persist.
- Wrong order/partial fill = just socketed runes (their individual effects only) — irreversible
  without a socket-clearing recipe.
- Each word has its own required level = max(base levelreq, highest rune clvl req).
- Catalog size for calibration: 98 words in current D2R (grown by ladder seasons; legacy 1.11 had
  ~78); words are flagged ladder-only until rotated to non-ladder.
- Engine schema: `runeword := { name, runeSeq[2..6], allowedTypes[], ladderFlag, props[] }` —
  validation is pure set/sequence matching, no RNG.

**Sources:** https://d2r.world/en-US/info/item/runewords ; Arreat Summit runewords rules page;
https://diablo2.diablowiki.net/Runewords (rules cross-check).

---

## 11. Cube-style Transmute System

### 11.1 Recipe engine schema **[V]**

`CubeMain.txt` model — evaluate on "transmute" click against the container's contents
(unordered multiset):

```
recipe := { enabled, ladderFlag, minDiffLevel?, class?, op?/param?/value?,   # optional gates
            numInputs, inputs[1..7], outputs[1..3] }
input  := itemSpec + qualifiers
outputs := itemSpec + mod1..5 (fixed props) + lvl expressions
itemSpec  := concrete code | itype ("any sword") | quality-restricted ("mag", "rar", "uni"),
             flags: "low", "hiq", "nor" (normal), "noe" (non-eth), "sock", "nos", "eth",
             "upg"-style tier selectors, counts ("qty=")
output lvl := absolute ilvl, or "lvl=pX%" of clvl, "plvl/ilvl fractions" (see 11.2)
```

First matching recipe wins; inputs consumed; outputs generated through the normal item-creation
path (so alvl math applies).

### 11.2 Major recipe categories (with canonical input→output patterns) **[V]**

| Category | Pattern (1–2 examples) | ilvl rule |
|---|---|---|
| **Rerolls** | 3 perfect gems + magic item → new magic item of same base | ilvl preserved |
| | 6 perfect skulls + rare → new rare same base | `floor(.4·clvl)+floor(.4·ilvl)` **[1S]** |
| **Upgrades (tier)** | 2 runes + 1 perfect gem + unique/rare item → same item on next tier base (normal→exc→elite chains; 8 recipes: {weapon,armor}×{rare,unique}×{N→X,X→E}, each with distinct rune pair + gem) | ilvl unchanged **[U]** |
| **Socketing** | 2 low runes + perfect gem + normal item (per slot family) → socketed, RND[6]+1 clamped (§7.2) | unchanged |
| **Crafting** | §11.3 | `floor(clvl/2)+floor(ilvl/2)` |
| **Repair** | 1 rune (#9) + weapon → repaired; 1 rune (#8) + armor → repaired; +chipped-gem variants also recharge quantity | unchanged |
| **Gem/rune upgrades** | §8 / §9.4 | — |
| **Consumables** | 3 potions of tier n → tier n+1; potions + gem → thrown/rejuv conversions | — |
| **Token/organ (quest currency)** | 1 essence from each of 4 boss archetypes → respec token; 3 keys → mini-boss portal; 3 organs → super-boss portal | — |
| **Utility/quality resets** | low-quality item + gem(s) → normal-quality version with **ilvl = 1** (socket-cap manipulation lever) | ilvl := 1 |

### 11.3 Crafted items **[V]**

- 4 craft families × 9 slots = **36 recipes**. Ingredients per recipe:
  `magic item of fixed base category + 1 specific low rune (#3..#12 range) + 1 perfect gem
  (fixed per family) + any jewel`.
- Output = "crafted" quality (own color/quality enum; cannot be runeworded, cannot re-craft):
  **3–4 fixed props** (recipe-defined, values may roll in ranges) **+ 1–4 random affixes** from
  the rare pool (max 3 prefixes / 3 suffixes counting fixed ones **[U interaction]**).
- Random affix count by **crafted ilvl** = `floor(clvl/2) + floor(ilvl_input/2)`:

| crafted ilvl | P(1) | P(2) | P(3) | P(4) |
|---|---|---|---|---|
| 1–30 | 40% | 20% | 20% | 20% |
| 31–50 | 0 | 60% | 20% | 20% |
| 51–70 | 0 | 0 | 80% | 20% |
| 71+ | 0 | 0 | 0 | 100% |

- alvl then follows §3.3 with the base's qlvl (amulet-type bases: alvl = crafted ilvl exactly).
- Level requirement: `levelreq = levelreq(highest affix) + 10 + 3 × (number of random affixes)`,
  capped at 98. **[V]**

**Sources:** https://wiki.projectdiablo2.com/wiki/Crafting ; https://maxroll.gg/d2/items/crafted-items ;
https://d2r.world/en-US/info/item/crafted ; https://d2r.world/en-US/info/item/recipes ;
https://diablo2.diablowiki.net/Guide:Crafting_Cubing_and_Socketing_v1.10,_by_Uzziah .

---

## 12. Gambling

**[V]** Vendor-independent, difficulty-independent, MF-independent.

- Screen shows a random selection of base *categories* (jewelry always present); price is a fixed
  per-base-type `gamble cost` column (jewelry examples: ring 50,000, amulet 63,000). Refreshes per
  visit.
- `ilvl = clvl − 5 + RND[10]` (uniform clvl−5…clvl+4, min 5).
- Quality table (checked in order):

```
P(unique) = 1/2000        P(set) = 1/1000        P(rare) = 1/10        else magic
```

- Tier upgrade of the purchased base (rolled after quality, both possible in sequence —
  elite check only after exceptional succeeds):

```
P(exceptional) = 1% + (ilvl − qlvl_exceptionalVersion) × 0.9%
P(elite | exc) = 1% + (ilvl − qlvl_eliteVersion)      × 0.33%
```

  (clamped ≥ 0; uses the qlvl of the corresponding upgraded base). Uniques/sets can therefore be
  gambled in upgraded bases; compound odds for a specific top unique ≈ 1/60k+.
- Affixes roll normally with alvl from §3.3 — gambling is the deliberate "pay gold for
  high-ilvl jewelry" sink.
- Not gambleable: charms, jewels, throwables, ethereal, sockets.

**Sources:** https://diablo2.diablowiki.net/Gambling ;
https://www.purediablo.com/diablo-2/diablo-2-gambling ;
https://classic.battle.net/diablo2exp/basics/gambling.shtml .

---

## 13. Vendors

**[V unless noted]**

- **Stock generation**: each base row carries per-vendor `Min/Max` (normal stock) and
  `MagicMin/MagicMax/MagicLvl` (magic stock) counts, plus NM/Hell upgrade selectors. On town
  entry the shop generates items with `ilvl = clvl + 5` (caps: Normal per act 12/20/28/36/45;
  NM/Hell uncapped, ≤99), excluding bases with `qlvl > ilvl`. Stock refreshes on re-entering town
  from a different area (not while another player idles in town **[1S]**).
- Quality of stock: normal + socketed only while ilvl < 25; at ilvl ≥ 25 magic-capable slots
  become magic-only. Exceptional bases appear from NM, elite from Hell (small chances).
  Never ethereal. Staffmod scanning works because staffmods are quality-independent (§4.5).
- **Buy price**: from base `cost` × affix `multiply/add` modifiers
  (`price = base·(1 + Σ(value_i·mult_i)/1024) + Σ add_i`), scaled by difficulty/act and charisma-
  style discounts (D2: none) — D2 uses flat per-difficulty vendor markups **[U detail]**.
- **Repair cost**: derived from the same item-value formula, proportional to missing
  durability/charges; superior% and socketed-filler bonuses multiply base cost, which is why
  high-value fillers in elite bases produce 6–7 figure repair bills. Rune-based repair recipes
  are the designed escape valve (§11.2).
- **Sell price cap** (anti-economy-break): cap = 5,000 × act in Normal (A1 5k … A5 25k),
  flat 30,000 anywhere in NM, 35,000 anywhere in Hell **[V cap values; U per-act Normal ladder]**.
  Sell price is otherwise value/4-ish **[U divisor]**.

**Sources:** https://classic.battle.net/diablo2exp/basics/vendors.shtml ;
https://diablo2.io/forums/the-complete-overview-guide-to-shopping-in-diablo-2-by-hastmannen-t6614.html ;
https://d2mods.info/forum/viewtopic.php?t=62406 (price formula);
https://www.purediablo.com/d2wiki/Gold .

---

## 14. Charms, Jewels, Consumables, Keys

### 14.1 Charms **[V]**

- 3 sizes: small 1×1, large 1×2, grand 1×3. Provide their affix effects **while in main inventory**
  (not stash/cube; D2R adds a dedicated charm zone concept only via mods — base game: whole
  inventory).
- Quality: magic only (plus a tiny unique-charm class in D2R lore — mechanically: fixed-prop
  uniques dropped by special spawns). Never rare/socketed/superior.
- Affix schema: charm-size-specific prefix/suffix pools (a "+skill-tab" style prefix exists only
  for grand; life/resist suffix ladders scale down with size). 1 prefix + 1 suffix max, standard
  §4.3 composition and §3.3 alvl gating (charms have low qlvl so alvl ≈ ilvl; the classic
  "ilvl 91+ grand charm" chase = top prefix alvl 50 + top life suffix alvl 91).
- Reroll lever: 3 perfect gems + charm → reroll at same ilvl (§11.2).

### 14.2 Jewels **[V]**

1×1 socketables carrying rolled affixes (magic: 1–2; rare: 3–4 max 4). Own affix pool
(damage%, IAS, resist, stat, ED/AR etc.). Inserted permanently into any socket type — the
"player-authored gem" of the system. Unique jewels exist as fixed-prop drops.

### 14.3 Potions / scrolls / keys **[V]**

- Healing & mana potions: 5 tiers each (fixed restore amounts; restore scales by character class
  in D2). Rejuvenation: 2 tiers (35% / 100%, instant). Utility: stamina/antidote/thawing (timed
  buffs in D2R). Throwables: 2 families (fire/poison) × tiers.
- Scrolls: identify + town-portal, 1×1; tomes 1×2 holding up to 20 of one scroll type.
  Cube recipe: 1 tome + 1 scroll compaction patterns exist (schema: consumable merging).
- Keys: 1×1 stack of 12, open locked chests (locked chest = same TC + key gate).
- All of these appear in TCs via act-banded "Junk"/potion sub-TCs; belts define
  potion-row capacity (2/3/4 rows × 4 columns by belt tier).

**Sources:** Arreat Summit items/basics pages; https://diablo2.diablowiki.net/Charms ;
https://maxroll.gg/d2/getting-started/charms-and-consumables .

---

## 15. Uncertainties & Conflicts

1. **Socket ilvl bracket boundary**: d2r.world + several guides give 1–25 / 26–40 / 41+;
   diablowiki's socket page says 1–25 / 26–41 / 42+. Off-by-one unresolved — recommend 25/40 as
   canonical (majority + D2R-era sources).
2. **Gold pile base amount**: exact base roll vs mlvl/difficulty not reverse-engineered anywhere
   found (modders observed a ~5k pre-GF cap and mlvl/difficulty scaling). Our engine needs an
   original curve anyway: suggest `amount = RND[mlvl × k_diff] + 1`, tuned.
3. **Class-specific ItemRatio row**: base chances verified (240/120/80/17); divisors & minimums
   not re-verified (likely 1/6400 pattern analogues). Also unverified: exact combine rule when a
   TC chain has multiple QualityFactors (assumed max).
4. **Perfect-gem droppability**: act "Good" TCs sampled cap at flawless tier; whether perfect gems
   drop directly anywhere in vanilla data is unconfirmed here.
5. **Runewords in low-quality bases**: non-magic rule is certain; whether low-quality (cracked)
   bases are eligible differs by patch/source. Superior/eth definitely eligible.
6. **Upgrade-recipe ilvl**: whether tier-upgrade recipes preserve ilvl exactly (believed yes) —
   matters for later socket-quest math.
7. **Craft affix-slot interaction**: whether fixed craft props consume prefix/suffix slots toward
   the 3+3 cap (community consensus: fixed props are outside the random pick but the 3/3 cap
   applies to randoms; jewels' own affixes are consumed/discarded — verify before implementing).
8. **Ethereal numbers**: +25% and −10 req widely cited; exact durability formula (`floor(base/2)+?`)
   unverified.
9. **Normal-difficulty sell-cap per-act ladder** (5k/10k/15k/20k/25k) and the sell-price divisor:
   directionally confirmed (cap rises by act in Normal; 30k NM / 35k Hell flat) but the per-act
   values are from one source cluster.
10. **Vendor buy-price difficulty markup** details and gamble screen base-category weighting are
    not precisely documented.
11. **Charm qlvls** (which drive small alvl offsets per charm size) not re-verified; treat
    charm alvl ≈ ilvl and tune gates as original design.
12. **Terror-zone mlvl caps** (D2R 2.5+): ≈96/97/98 by monster rank per patch notes — single
    source here; only relevant if we adopt a TZ-like mechanic.
13. **"75% of alvl" level-requirement folklore is wrong** — use per-affix `levelreq`
    (counter-example documented on PureDiablo forums).

---

## Appendix: One-page pipeline summary for the engine

```
KILL -> TC tree walk (picks, noDrop_playerScaled, NM/Hell TC-upgrade-by-mlvl, 6-drop cap)
     -> leaf: base code | gld*mul/1024 | rune/gem TC chain | nothing
ITEM -> ilvl := mlvl (or source rule §3.2)
     -> quality: for q in [uniq,set,rare,magic,sup,norm]:
          P = 128 / ( clampMin( (Base_q - (ilvl-qlvl)/Div_q)*128 * 100/(100+EMF_q) )
                      * (1 - QF_q/1024) )
     -> unique/set: pick by (base, qlvl<=ilvl, rarity weight); fallback rare(3xDur)/magic(2xDur)
     -> magic: 25/50/25 prefix/suffix/both; rare: 3..6 uniform, <=3+3, group-exclusive
          affix pool filter: itype, level<=alvl<=maxlevel, frequency-weighted; alvl per §3.3
     -> post: sockets (1..6 clamp), eth 5%, def roll, staffmods/automods
```
