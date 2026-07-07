# Sockets, Gems & Words

> Socket system, gem tiers, rune system (original), and word system (runeword-analog).
> Sources canonicalized from `doc/research/r2-items-loot.md`. Item catalog per
> `04-content-bible/item-catalog.md`.

## Socket basics

Max sockets for an item instance = **min(per-base cap, type × ilvl bracket, source rule)**.
Items can be used in Words only if they have exactly the required socket count. A socketed
item displays as gray text base type + "socketed (N)" suffix in tooltip.

### Max-socket table by item type and ilvl

ilvl brackets: **1-25 / 26-40 / 41+**.[^brackets]

| Item type | ilvl 1-25 | ilvl 26-40 | ilvl 41+ |
|---|---|---|---|
| Body armor | 3 | 4 | 4 |
| Shields (generic) | 3 | 3 | 4 |
| Class shields | 3 | 4 | 4 |
| Class fetish off-hands | 2 | 2 | 2 |
| Helms | 2 | 2 | 3 |
| Class helms | 2 | 3 | 3 |
| Circlet family | 1 | 2 | 3 |
| Staves | 5 | 6 | 6 |
| Large (2h) axes | 4 | 5 | 6 |
| Scepters | 3 | 5 | 5 |
| Class bows | 3 | 4 | 5 |
| Generic weapons (swords, 1h axes, polearms, spears, bows, crossbows, hammers) | 3 | 4 | 6 |
| Daggers / claws / orbs | 2 | 3 | 3 |
| Wands | 2 | 2 | 2 |

Each base additionally carries its own `maxSockets` cap that may be lower than the
bracket value (e.g. a 1×2 blade caps at 2 regardless of ilvl). Recipes that reset ilvl
(low-quality → normal sets ilvl = 1) deliberately shrink the socket cap.

[^brackets]: Table verified against `doc/research/r2-items-loot.md` §7.1 (d2r.world +
Maxroll socket references). The bracket boundary has an off-by-one conflict across
sources (26-40 vs 26-41); 25/40 is canonical here per the D2R-era majority.

### Socket sources

- **On drop:** normal and superior items may spawn socketed. Count roll: uniform 1-6,
  clamped to the item's max — the clamp mass collapses upward (cap 4 ⇒ P(4) = 3/6).
  Natural spawn counts are additionally capped by difficulty: ≤3 Normal, ≤4 Nightmare,
  ≤6 Hell.
- **Cube recipe:** normal-quality unsocketed items only; same uniform 1-6 clamp roll
  (exact distribution in `crafting-cube.md`).
- **Quest reward (act V socket service, once per difficulty):** normal-quality item →
  **max** sockets for its type + ilvl (deterministic); magic → 1-2 (50/50); rare / set /
  unique / crafted → exactly 1.

## Gem system (6 tiers)

| Tier | Name | Weapon | Armor/Helm | Shield |
|---|---|---|---|---|
| 1 | Chipped | +2-4 fire damage | +5 life | +3% all res |
| 2 | Flawed | +5-8 fire damage | +10 life | +5% all res |
| 3 | Standard | +10-16 fire damage | +15 life | +7% all res |
| 4 | Flawless | +18-30 fire damage | +25 life | +10% all res |
| 5 | Perfect | +30-50 fire damage | +40 life | +15% all res |
| 6 | Radiant | +40-70 fire damage | +60 life | +20% all res |

Gem upgrade recipe: 3 same-tier gems → 1 next-tier gem. Only works up to Radiant.

## Rune system (13 tiers)

Per `04-content-bible/item-catalog.md` rune table. Runes are single-slot socketables with
fixed stat grants varying by context (weapon/armor/shield). Drop rarity exponential per
tier: T1-T4 common, T5-T7 uncommon, T8-T10 rare, T11-T13 very rare (high rune equivalence).

Rune upgrade: 3 × rune(n) → 1 × rune(n+1) for T1-T8; 2 × rune(n) + 1 gem → 1 × rune(n+1)
for T9-T12 (exact recipe rows in `crafting-cube.md`).

## Word system

Words are the runeword-analog: specific base type + exact socket count + rune sequence =
item with combined rune base stats + bonus stats from the word.

Rules:
- Base must be non-magic (normal or superior quality only)
- Base must have EXACTLY the required socket count
- Runes must be inserted in the exact order listed
- A base can hold at most one word (mixing is not possible)
- Ethereal word items keep the ethereal +50% bonus
- Word items cannot be unmade (no recipe to extract runes)

Word table (~50 entries) in `src/sim/data/words.ts`. The **first 12 concrete words —
names, allowed bases, socket counts, and exact rune sequences — are specified in
`04-content-bible/item-catalog.md`** (content bible is canon for word content). Notable
word concepts: "Last Oath" (5-socket melee BIS), "Severed Hour" (4-socket caster),
"Iron Covenant" (4-socket armor defensive), "Flickering Shroud" (2-socket helm),
"Bleed-Edge" (3-socket budget physical).

Word power curve: roughly matches D2 runewords — from normal-viable mid-game words
(2-3 sockets, lower-tier runes) to endgame best-in-slot words (4-5 sockets, highest runes).
The exact power progression is balanced to match the item tier economy.

## Ethereal mechanics

Ethereal items: 1/20 (5%) base chance. Effect: +50% base damage (weapons) or +50% base
defense (armor/helm/shield), −10 str/dex requirements, max durability = floor(base/2)+1.
Cannot be repaired. Indestructible affix + ethereal = best base. Full rules in
`items-and-affixes.md`. Words can be made in ethereal bases and keep the ethereal bonus.
Socket fillers (gems/runes/jewels) are never recoverable: the socket-clearing recipe
destroys the filler items and preserves the base (see below).

## Socket filler removal

Cube recipe: rune + scroll of ID → remove one filled socketable (destroy it).
Quest NPC (act 5): remove all filler (for a gold cost scaled by tiers of gems/runes involved).
