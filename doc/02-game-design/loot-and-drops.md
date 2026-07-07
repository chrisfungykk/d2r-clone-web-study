# Loot & Drops

> Treasure-class engine, NoDrop math, MF integration. Every drop is deterministic from a seed.
> Sources canonicalized from `doc/research/r2-items-loot.md`.

## Treasure Class (TC) system

TCs form a tree. A drop pick walks down the tree:

```
tcRow {
  id: TcId
  picks: number        // positive = picks with drop probability; negative = "drop all" (boss)
  noDrop: number       // base weight for "nothing" result
  entries: entry[]
}

entry = ref: TcId | ItemClassId | "gold"  // child TC / concrete item / lump gold
        weight: number                     // frequency weight, total = sum(weights) + noDrop
```

**Example (low-level skeleton):**

```
tc= "skeleton_a1_0",  picks=1, noDrop=100
  entries: [
    { ref: "weapon_norm_t1", weight: 30 },
    { ref: "armor_norm_t1", weight: 30 },
    { ref: "gold_low", weight: 40 },
    { ref: "potion_t1", weight: 50 },
  ]
```

### NoDrop player-count formula (exact)

Each pick rolls over `noDrop + totalFreq` weights, where `totalFreq = Σ entry.weight`.
At 1 player the chance of "nothing" per pick is exactly `noDrop / (noDrop + totalFreq)`.

With more players in the game, an effective NoDrop weight is substituted so that the
per-pick nothing-chance is raised to the power `n`:

```
n        = 1 + floor(additionalPlayers / 2) + floor(nearbyPartiedPlayers / 2)
X        = ( noDrop / (noDrop + totalFreq) ) ^ n
noDrop'  = floor( totalFreq * X / (1 - X) )
```

- `additionalPlayers` = every other player anywhere in the game (partied or not).
- `nearbyPartiedPlayers` = players partied with the killer within ~2 screens of the kill;
  a partied player standing near the kill therefore counts in *both* terms (double weight).
- Integer arithmetic throughout; rows with `noDrop = 0` are unaffected (X = 0 ⇒ noDrop' = 0).
- Because each term floors a half per player, effective steps happen at total players
  3 / 5 / 7 for unpartied games (n = 2 / 3 / 4), and at players 2 / 3 / 4 when everyone
  is partied and standing near the kill.

**Worked example** (skeleton TC above: noDrop = 100, totalFreq = 30+30+40+50 = 150):

| Players (unpartied) | n | X = (100/250)^n | noDrop' | P(nothing) per pick |
|---|---|---|---|---|
| 1 | 1 | 0.4 | 100 | 100/250 = 40% |
| 3 | 2 | 0.16 | floor(150·0.16/0.84) = 28 | 28/178 ≈ 15.7% |
| 5 | 3 | 0.064 | floor(150·0.064/0.936) = 10 | 10/160 = 6.25% |
| 7 | 4 | 0.0256 | floor(150·0.0256/0.9744) = 3 | 3/153 ≈ 1.96% |

Boss TCs (noDrop 15 vs totalFreq 65) hit noDrop' = 0 at 5 players unpartied / 3 partied-near:
floor(65 · 0.1875³ / 0.9934) = 0.[^nodrop]

[^nodrop]: Verified against `doc/research/r2-items-loot.md` §5.3 and `r4-world-progression.md`
§11.1 (both sourced from the Hrus Magic Find guide's reverse-engineered formula).

### TC upgrading in NM/Hell

Each TC entry may have `upgrades: { nightmare: TcId; hell: TcId }`. On kill in that
difficulty, the upgraded TC is used instead. This gates exceptional weapons (NM+)
and elite weapons (Hell+).

## Item generation pipeline

```
1. Kill monster → roll TC → pick result
2. If item class rolled: pick specific base item from that class's probability table
   (weighted by item rarity)
3. Quality roll (below): unique → set → rare → magic → superior → normal
4. ilvl assignment per the exact table below
5. affix roll (if magic/rare): weighted random from eligible pool
6. ethereal roll (1/20 on eligible equipment of any quality — see items-and-affixes.md)
7. socket roll (as per max-sockets rules in sockets-gems-words.md)
8. Quantity roll (if applicable)
```

## ilvl assignment (exact)

| Creation path | ilvl |
|---|---|
| Monster drop | killer's mlvl. Normal difficulty: per-monster table value. NM/Hell: mlvl = area alvl for regular monsters, alvl+2 for champions, alvl+3 for uniques/minions; act bosses use their fixed mlvl |
| Chest / object / container | area alvl |
| Vendor stock | clvl + 5 (Normal per-act caps 12/20/28/36/45; NM/Hell uncapped; max 99) |
| Gamble | clvl − 5 + rng[10] → uniform in clvl−5 .. clvl+4, floor 5 |
| Craft recipe | floor(clvl/2) + floor(inputIlvl/2) |
| Imbue quest reward | clvl + 4 |
| Reroll recipes | recipe-specific (see crafting-cube.md) |

## Quality check & Magic Find (exact 128ths system)

At step 3 each quality tier is checked in order (unique → set → rare → magic → superior →
normal), using that tier's row `(base, divisor, min)` from the item-ratio table:

```
chance = (base − floor((ilvl − qlvl) / divisor)) × 128
emf    = tier ∈ {unique, set, rare} ? floor(MF × factor / (MF + factor)) : MF
         // factor: unique 250, set 500, rare 600; the magic tier applies MF linearly
chance = floor(chance × 100 / (100 + emf))
if chance < min: chance = min           // per-tier floor caps the best possible odds
final  = chance − floor(chance × qualityFactor / 1024)   // qualityFactor from the TC row
success iff rng.u32("loot") % final < 128                // P(success) = 128 / final
```

Item-ratio rows (cloned magnitudes; `base / divisor / min`): normal bases — unique
400/1/6400, set 160/2/5600, rare 100/2/3200, magic 34/3/192, superior 12/8, normal 2/2.
Exceptional/elite bases use a variant row; class-specific bases use reduced base chances
(unique 240, set 120, rare 80, magic 17). Best-case odds without a TC qualityFactor:
unique 128/6400 = 2%, set ≈ 2.3%, rare 4%, magic floor ≈ 66.7%.

If `final ≤ 128` the check always succeeds — boss TCs set the magic qualityFactor to 1024
to guarantee ≥ magic quality. MF diminishing-return asymptotes: unique → +250 effective
max, set → +500, rare → +600 (MF 100 → EMF_unique 71; MF 300 → 136; MF 1000 → 200).
MF affects only these quality checks — never base selection, rune/gem/gold drops,
quantity, sockets, or affix rolls.

Worked example (Hell act boss, mlvl 99, base qlvl 86, 167 MF, boss unique factor 983):
(400 − 13)·128 = 49536 → emf = 167·250/417 = 100 → 49536·100/200 = 24768 (≥ 6400 floor)
→ 24768 − floor(24768·983/1024) = 992 → P(unique) = 128/992 ≈ 12.9%.[^quality]

[^quality]: Formula and row values verified in `doc/research/r2-items-loot.md` §2.2-2.3
(sourced from the PureDiablo Item Generation Tutorial and raw v1.13 `ItemRatio.txt` data).

## Rune drops

Runes route through a chain of rune TCs `rune_tc_1 .. rune_tc_7`. Each act × difficulty
"good" TC references a *capped* rune TC (only Hell endgame TCs reference `rune_tc_7`), so
top runes simply cannot drop from low areas — no special-case code needed. Dedicated
rune-farming superuniques use rune TCs with negative picks and their own per-difficulty
caps (reliable low/mid runes, never top runes).

Each `rune_tc_N` (N ≥ 2) holds the tier pair it introduces plus a fallback entry to the
previous TC whose weight grows superlinearly — this single mechanism produces the
exponential high-rune rarity curve:

| TC | Rune entries (weight) | Fallback weight → previous TC |
|---|---|---|
| rune_tc_1 | T1 (3), T2 (2) | — |
| rune_tc_2 | T3 (3), T4 (2) | 2 |
| rune_tc_3 | T5 (3), T6 (2) | 6 |
| rune_tc_4 | T7 (3), T8 (2) | 16 |
| rune_tc_5 | T9 (3), T10 (2) | 45 |
| rune_tc_6 | T11 (3), T12 (2) | 125 |
| rune_tc_7 | T13 (1) | 1250 |

Within a pair the higher rune is 2/3 as likely as the lower. Conditional odds given a
`rune_tc_7` hit: T13 = 1/1251, T12 ≈ 1/65, T11 ≈ 1/43; lower tiers decay down the
fallback chain. With Hell endgame kills routing into the rune chain at roughly 1/80 via
the "good" TC, the T13 per-kill magnitude is ≈ 1×10⁻⁵ (~1 per 100k kills at P1) — the
high-rune rarity target in `economy.md` / `endgame.md`. MF never affects rune drops.

(D2 reference being cloned: 33 runes across 17 chained TCs — lower rune weight 3, higher
rune weight 2, fallback weights growing 2 → 5170, giving P(top rune | top-TC hit) =
1/5171. Our 13-tier ladder compresses the same curve shape; weights above are the
canonical initial values in `src/sim/data/`, tunable in the Phase 5 balance pass.)

## Gold drop math

Gold drops are a fixed TC type (`gold_low` / `gold_mid` / `gold_high`). Amount formula:

```
gold = goldMin + rng("loot") % (goldMax - goldMin)
goldMin/Max scale by difficulty (×N in NM, ×2N in Hell per level range)
```

Gold Find (EG) modifies gold amount: `finalGold = gold * (100 + totalEG) / 100`.

## Potion drops

Potions use their own TC sub-branch; tier by monster level:
- Low: healing/mana potion (minor)
- Mid: healing/mana (normal) + rejuv (partial)
- High: full rejuv chance

Monster potion drops per-entity: some monsters are flagged high-potion-drop (bosses).

## Quest drops

Each act boss has a quest-drop flag on first kill per difficulty: the quest variant of
the boss TC removes the junk/gold picks, sets `noDrop = 0`, guarantees Rare as the
minimum quality, and applies a heavy (~33×) unique/set quality bias.

Once the quest is complete, the standard boss TC applies on every later kill. The D2
quest-sequencing bug that could leave an act boss permanently on its quest-drop TC for a
difficulty is intentionally NOT reproduced (it's a bug, not a mechanic).
