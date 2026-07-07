# Crafting & Cube

> Transmutation-cube system: recipes engine, crafted items, upgrades, rerolls.
> Sources canonicalized from `doc/research/r2-items-loot.md`.

## Recipe engine

Schema per recipe:

```
recipeId: string
inputs: InputMatcher[]      // { itemId?: string; type?: ItemType; quality?: Quality; count: number }
output: OutputDef           // { itemId?: string; mods?: StatRollDef[]; count: number }
```

Input matchers match items in the cube grid (3×4 = 12 cells). Each matcher: either
exact item id (quest items), or item type + quality + minimum count.

Validation: recipe engine scans all 12 cells, matches the contents (unordered multiset)
against recipes in table order — first fully-matching recipe wins — then consumes inputs
and creates the output through the normal item-creation path (so ilvl/alvl math applies).
If no recipe matches or items are left over in the grid: reject with an error message.

## Recipe categories

### Rerolls
- 3 perfect gems + magic item → new magic item of same base (rerolls affixes, **ilvl preserved**)
- 6 perfect gems (one family) + rare item → new rare of same base
  (**ilvl = floor(0.4·clvl) + floor(0.4·ilvl)** — the intended slight ilvl/alvl reduction)
- Tahl (T5) + Gorn (T6) + 1 perfect gem + rare item → new rare of same base (**ilvl preserved** — premium reroll)
- 3 perfect gems + charm → same charm base rerolled (**ilvl preserved**)
- Unique item + event token → same unique, variable stats rerolled (**ilvl preserved**)

### Tier upgrades
Rare and unique items move along the base tier chain (normal → exceptional → elite),
**keeping all affixes and ilvl**. 8 recipes = {weapon, armor} × {rare, unique} ×
{N→X, X→E}, each with a distinct rune pair + 1 perfect gem:

| Item | N → Exceptional | Exceptional → Elite |
|---|---|---|
| Rare weapon | Kre (T3) + Tahl (T5) + 1 perfect gem | Gorn (T6) + Zul (T9) + 1 perfect gem |
| Rare armor | Mos (T4) + Tahl (T5) + 1 perfect gem | Sek (T7) + Zul (T9) + 1 perfect gem |
| Unique weapon | Gorn (T6) + Reth (T8) + 1 perfect gem | Vor (T10) + Xan (T11) + 1 perfect gem |
| Unique armor | Sek (T7) + Reth (T8) + 1 perfect gem | Vor (T10) + Quor (T12) + 1 perfect gem |

Consumables:
- 3 potions of tier n → 1 potion of tier n+1
- 3 scrolls (same type) → 1 tome of that type

### Socketing
One recipe per slot family. Input must be a **normal-quality, unsocketed** item (not
low-quality, superior, or magic+):

- Weapon: Tor (T1) + Ven (T2) + 1 perfect gem + item
- Body armor: Tor (T1) + Kre (T3) + 1 perfect gem + item
- Helm: Ven (T2) + Kre (T3) + 1 perfect gem + item
- Shield: Tor (T1) + Mos (T4) + 1 perfect gem + item

**Socket count roll (exact):** `1 + rng.u32("loot") % 6` — uniform over 1..6 — then
clamped to the item's max socket count = min(per-base cap, type × ilvl bracket; see
`sockets-gems-words.md`). The clamp collapses the excess probability mass onto the max:

| Item max | P(1) | P(2) | P(3) | P(4) | P(5) | P(6) |
|---|---|---|---|---|---|---|
| 6 | 1/6 | 1/6 | 1/6 | 1/6 | 1/6 | 1/6 |
| 4 | 1/6 | 1/6 | 1/6 | 3/6 | — | — |
| 3 | 1/6 | 1/6 | 4/6 | — | — | — |
| 1 | 6/6 | — | — | — | — | — |

Socketing magic/rare/set/unique items is only possible via the act V quest service
(exact counts in `sockets-gems-words.md`).

### Repair
- Kre (T3) + weapon → fully repaired
- Mos (T4) + armor → fully repaired
- Kre (T3) + 1 chipped gem + weapon → repaired and quantity recharged (stacked/thrown)
- Ethereal items cannot be repaired by any recipe (self-repair affixes still work).

### Crafting
4 recipe families:

| Family | Guaranteed mod 1 | Guaranteed mod 2 | Concept |
|---|---|---|---|
| **Caster** | 5-10% FCR | +mana or regen | Caster weapons/jewelry |
| **Blood** | 5-10% life leech | 1-3% OW | Melee weapons/gloves |
| **Hitpower** | 5-10% FHR | +moderate defense | Armor/belts/gloves |
| **Safety** | 1-5% DR | +MDR | Shields/armor/helm |

Each recipe (4 families × 9 slots = 36 recipes): **magic item of the recipe's base
category + 1 specific low-mid rune (T3-T6 band) + 1 perfect gem (fixed per family) +
any jewel** (the jewel's own affixes are discarded) → crafted-quality item.

Fixed mods: the 2 family mods above + 1 slot-specific fixed mod defined per recipe in
data — **3 fixed props total**, values rolled in recipe-defined ranges. Crafted items
cannot be re-crafted and cannot be used in words.

Craft ilvl formula: `craftedIlvl = floor(clvl / 2) + floor(inputIlvl / 2)`.

Random affix count by crafted ilvl (from the rare affix pool; standard alvl math applies
with the base's qlvl; fixed props do not consume prefix/suffix slots, but the 3-prefix /
3-suffix cap applies to the random picks):

| crafted ilvl | P(1) | P(2) | P(3) | P(4) |
|---|---|---|---|---|
| 1-30 | 40% | 20% | 20% | 20% |
| 31-50 | 0 | 60% | 20% | 20% |
| 51-70 | 0 | 0 | 80% | 20% |
| 71+ | 0 | 0 | 0 | 100% |

Level requirement: `levelreq = levelreq(highest random affix) + 10 + 3 × (number of
random affixes)`, capped at 98.[^craft]

[^craft]: Craft ilvl formula, affix-count table, and levelreq formula verified in
`doc/research/r2-items-loot.md` §11.3 (Project Diablo 2 wiki / Maxroll crafted-items
cross-check).

### Respec token
4 boss essences → token. Essence types: acts I and II bosses drop the first essence type;
acts III, IV, and V bosses drop the other three (Hell difficulty only; drop chance set in
the boss TC tables). Right-click token → respec (skills + stats fully refunded). Unused
token sits in inventory.

### Event items (see endgame.md)
- 3 keys of one type → opens one mini-boss portal (boss-key event)
- 3 organs (one of each) → opens the finale-arena portal (boss-key event)
- Quest artifacts for the act quest chains (exact item id matchers)

### Other
- Rune upgrade: 3 × rune(n) → 1 × rune(n+1) for T1-T8; 2 × rune(n) + 1 gem (gem tier
  rises with rune tier) → 1 × rune(n+1) for T9-T12 (the 2:1 tail keeps top runes
  tradable but uncraftable in practice)
- Gem upgrade: 3 same-tier, same-family gems → 1 next-tier gem
