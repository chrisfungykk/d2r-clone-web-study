# Difficulty & Progression

> Three-tier difficulty ladder: Normal → Nightmare → Hell. Each tier increases monster
> stats, adds penalties, unlocks higher item tiers, and introduces immunities.
> Sources canonicalized from `doc/research/r4-world-progression.md`.

## Tier parameters

| Parameter | Normal | Nightmare | Hell |
|---|---|---|---|
| Resist penalty | 0 | −40% | −100% |
| Death XP loss | 0% | 5% (75% recoverable) | 10% (75% recoverable) |
| Leech penalty | ×1.0 | ×0.5 | ×0.33 |
| Gold loss | `clvl%` capped 20% | same | same |
| TC upgrade | Normal only | Exceptional unlocked | Elite unlocked |
| mlvl rule | Fixed per monster | `= alvl` (champions +2, uniques +3) | `= alvl` (champions +2, uniques +3) |
| Monsters immune | No | Very rare (physical or 1 element, exactly 100%) | Yes (element, physical) |

## Area level bands per difficulty

| Act | Normal alvl range | NM alvl range | Hell alvl range |
|---|---|---|---|
| Act I | 1–10 | 36–42 | 67–75 |
| Act II | 14–26 | 43–52 | 71–80 |
| Act III | 30–40 | 50–60 | 74–82 |
| Act IV | 45–50 | 60–67 | 80–85 |
| Act V | 57–68 | 63–70 | 82–85 |

Exact per-zone alvl in `zones` table for every difficulty; monster mlvl derives from alvl
per the mlvl rule above (superuniques and act bosses keep fixed levels).

## Immunity system

- **Threshold:** immunity activates at ≥ 100% monster resistance. Resist values may exceed
  100 (e.g. 110–140) — the overage matters for breaking.
- **Appearing:** Hell only (NM: very rare — physical or a single element at exactly 100%)
- **Breaking (auras/curses):** only resist-lowering auras and the physical-vulnerability /
  decay curses can push a resist below 100. Against an **immune** channel they apply at
  **1/5 effectiveness** — permanently for that originally-immune monster, even after the
  immunity is broken by another source. Required nominal reduction to break:
  `(res - 99) * 5` (e.g. 140% fire needs 205 nominal). Breakers stack with each other,
  each at 1/5 vs the immune channel.
- **Non-breaking reductions:** `-% enemy resistance` gear and mastery-pierce passives
  apply only when the channel is not immune (or after a break) — gear at full value,
  mastery pierce at 1/5 vs originally-immune monsters (post-2.6 rule).
- **Sunder charms:** carrying the matching sunder charm sets an immune channel to **95%
  resist** for that attacker only. After sundering: gear `-% enemy resistance` applies at
  **full value**; resist-lowering auras/curses still apply at 1/5; mastery pierce at 1/5.
- **Application order (fixed):** sunder charm → curses → auras → `-% enemy resist` gear →
  mastery pierce.
- **Immunity distribution:** each monster family resist profile designed so that no single
  element is 100% blocked (every act has at least one viable farming route for each
  element); numeric per-family tables and authoring rules in `monsters.md`
- Pure physical immunes exist (stone-skin constructs); solved by the
  physical-vulnerability curse analogue

## Monster scaling by player count

| Statistic | Scaling with player count n |
|---|---|
| HP | `× (n + 1) / 2` (+50% of base per extra player) |
| XP | `× (n + 1) / 2` (same multiplier as HP) |
| Damage & AR | `× (1 + 0.0625 * (n - 1))` (+6.25% per extra player, max +43.75%) |
| Defense & resistances | do not scale |
| NoDrop | Per NoDrop formula (see `loot-and-drops.md`) |

Applied at monster spawn time — changing player count never re-scales live monsters.

## Experience curve

Level 1–99 table in `experience` data table. Key milestones:
- Level 30: all skills unlocked (3 trees × tier)
- Level 50: viable for Nightmare act 5
- Level 70: high-level XP penalty begins
- Level 80+: Hell-viable; XP gains slow to crawl for skill point grinding
- Level 99: theoretical max

Penalty above clvl 70 applied as per `stats-and-formulas.md`.
