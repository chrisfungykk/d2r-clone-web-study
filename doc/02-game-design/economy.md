# Economy

> Gold sinks, drop-rate economy, trade model, balance philosophy.
> Sources canonicalized from `doc/research/r2-items-loot.md` and `r4-world-progression.md`.

## Gold economy

Gold is a soft currency with designed scarcity. Sinks vs faucets:

| Faucet (gold income) | Sink (gold expense) |
|---|---|
| Monster gold drops | Potion purchases |
| Vendor sales of found items | Scroll/tome/key purchases |
| Chest/container gold | Repair costs (gear degradation) |
| Quest reward gold | Hireling resurrection |
| Gambling (net negative — gold sink with dopamine return) | Gambling |
| | Death gold loss (rule below) |

**Design targets:**
- Normal act I: gold-neutral (repair/basic pots match income)
- Normal act V: mild gold-positive (can afford occasional gamble or full repair)
- Nightmare: moderately gold-positive (funds steady gambling)
- Hell: strongly gold-positive (enables target-farming gambles for base items)

Repair costs scale with item value (which scales with tier, quality, and affix count).
Crafted item repair is expensive (match high-affix items). Unique item repair is also premium.

## Gold caps & death rule (exact)

- **Carried gold cap: 10,000 × clvl.**
- **Stash gold cap: flat 2,500,000 per tab**, independent of clvl (personal tab; each
  shared stash tab in Phase 6 holds its own 2,500,000).[^stash]
- **Death gold loss:** on death, lose `min(clvl, 20)%` of gold. Online: applied to
  carried + personal stash gold (carried first). Offline: personal stash is exempt, and
  500 × clvl of carried gold is exempt. The lost carried portion drops at the corpse as
  a gold pile (anyone may pick it up). Shared stash tabs are never touched. There is no
  other stash fee or tax — deposits and withdrawals are free.

[^stash]: D2R caps verified: stash gold is a flat 2.5M per tab (the legacy clvl-scaled
stash cap was removed in patch 1.13c); carried cap 10,000 × clvl; death gold rule per
`doc/research/r4-world-progression.md` §12.1.

## Drop economy & loot inflation

Without server-side economy, single-player D2R has infinite loot (no item leaving economy).
Design approach: embrace this for offline (Phase 0-5), solve with server-side economy in
Phase 6 (ladder resets create fresh supply).

**Offline balance:** drop rates target P5-equivalent — slightly better than P1 to make
endgame feel rewarding, but not so generous that unique items feel common.

## Gold find (EG) as a build dimension

EG (extra gold) from items is a meaningful mod category: builds that stack EG can fund
gambling as an alternate gearing path. EG applies: goldDrop * (100 + totalEG) / 100.

## Trade model (Phase 6)

- Player-to-player trade: atomic two-sided confirm (no trade window hacking)
- Item-for-item and gold-for-item only (no gold-for-gold, no unbalanced trades)
- Server-validated ownership before each commit
- Ladder items are flagged; cannot trade ladder → non-ladder characters

## Rune/gem/word economy

Runes are the "high-tier currency" by design:
- Mid-tier runes (T5-T8) are trade commodities for mid-game items
- High-tier runes (T9-T13) are the chase items equivalent of D2 high runes
- Words provide the best-in-slot items that drive endgame farming loops

Rune drop rarity: exponential. T13 (highest) drop rate ≈ 1 per 50 hours of focused alvl85
Hell farming at P5 (matches D2R high rune rarity target of "rare but achievable").

Gem economy: cheap (common drop), used for crafting/cube recipes, tier-6 (Radiant) is
moderately rare. Gems are the "secondary currency" alongside runes.

## Vendor pricing formula

```
sellPrice = basePrice * (qualityMult) * (1 + 0.25 * dmgSuffix or +0.25 * defSuffix) / 4
  + pricePerAffixTierSum
buyPrice = sellPrice * 4 (typical markup)

basePrice: from itemBases table (per base)
qualityMult: magic 1.5, rare 2.0, unique/set 2.5 (base × quality mult)
affix contribution: per tier of each affix added to price
```

**Repair cost (canonical formula, referenced by `quests-and-npcs.md` vendors):**

```
repairCost = ceil(buyPrice × missingDurability / maxDurability / 4)   per item
```

Repair-all sums per-item costs. Because `buyPrice` carries quality/affix multipliers,
high-value fillers in elite bases produce very large repair bills — the rune repair
recipes in `crafting-cube.md` are the designed escape valve. Jewelry and no-durability
items never degrade; ethereal items cannot be repaired at all.

**Vendor sell cap (anti-inflation):** gold paid per item sold to a vendor is capped at
5,000 × act in Normal (act I 5k … act V 25k), flat 30,000 anywhere in Nightmare, flat
35,000 anywhere in Hell.

## Stash gold

Gold stored in stash is separate from carried gold (caps in "Gold caps & death rule"
above: 2,500,000 flat per tab vs 10,000 × clvl carried). Deposits/withdrawals are
instant, no fee. Stash gold persisted in save file (same per-character). Shared stash
gold is account-scoped, 2,500,000 per shared tab (Phase 6). No cross-mode gold sharing.
