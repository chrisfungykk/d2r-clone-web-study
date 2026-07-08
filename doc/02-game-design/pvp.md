# Player-vs-Player (PvP)

> **STATUS: forward spec — documented but UNSCHEDULED.** PvP math is canon so the sim can
> reason about player-dealt damage against players, but no shipping phase targets full
> hostility. The first (and only near-term) consumer is **Phase 6 §6.8 consent-based
> duels** — a deliberately narrow slice. Free-for-all hostility, ladder/arena, and PvP
> balance tuning are later-phase, out of scope until the co-op core is proven
> (`00-vision.md` non-goal: "PvP math documented but unscheduled").
>
> Sources canonicalized from `doc/research/r5-classes-skills.md` §9,
> `doc/research/r4-world-progression.md` §11, and `doc/research/r3-combat-monsters.md`.

## Two distinct PvP factors — do not conflate

There are **two independent** PvP multipliers with the same historical name. Keep them
separate in code:

| Factor | Value | Applies to | Where |
|---|:---:|---|---|
| **PvP damage penalty** | **×0.17 (1/6)** | *all* incoming damage vs a player, applied FIRST | this doc §Damage pipeline |
| **PvP leech penalty** | **×0.5** | life/mana leech basis vs a player *only* | `combat-resolution.md` §Leech |

The leech `PvPPenalty: 0.5` in `combat-resolution.md` is **leech-only** and is *not* the
damage penalty. Implementers: name these `pvpDamagePenalty` and `pvpLeechPenalty` (or
similar) so they can never be swapped.

## Hostility & duel model

Relationship state is per-player-pair and drives the overhead-name / roster color code
(matches `03-ui-ux/inventory-and-panels.md`):

| Relationship | Color | Can damage each other |
|---|---|:---:|
| Neutral | white | no |
| Partied | green | no |
| Hostile | red | yes |

**Becoming hostile (full model, later phase).**
- Hostility is **declared from town** only, via the players roster (`declare hostile`
  button). It cannot be declared in the field.
- Declaration is one-sided but enables **two-way** combat: once A is hostile to B, both
  can damage each other and both render red to each other ("mutual-ish", per
  `r4-world-progression.md` §11).
- A short **cooldown/countdown** gates the toggle (prevents instant declare→strike→revert
  abuse); hostility persists until the game ends or is explicitly cleared in town.
- **Party exclusion:** partied players cannot be hostile. Declaring hostility drops the
  shared-party relationship; a hostile player is ineligible for XP share, quest share, and
  loot permission with the target.
- **Town safety:** no player skills/attacks resolve in town (`r4` §town rules), so combat
  only happens in the field even between hostile players.
- **Portals:** hostile players **cannot** ride the target's town portal (non-hostiles can).

**Duel consent (Phase 6 §6.8 — the scheduled slice).**
- A **duel** is a scoped, symmetric-consent subset of hostility: `duel button on party
  member → other accepts → duel state`. No town-declaration flow, no abuse surface.
- Duel state flags both players as combat-eligible against each other, applies the PvP
  damage pipeline below, and guarantees **no permanent death** — a defeated dueler is
  returned to town with **no XP loss** and no item drop.
- Ends on: one player defeated, either leaves town proximity, or either disconnects.

## Damage pipeline order

The PvP damage penalty is applied **before** resists and block — not after. This is the
load-bearing ordering rule (from `r5-classes-skills.md` §9.2, canon):

```
1. baseDamage       = attacker's computed hit (post attacker-side pipeline, see
                      combat-resolution.md "Damage pipeline")
2. pvpDamage        = baseDamage * 0.17            -- ×1/6 PvP penalty, applied FIRST
3. [Energy Shield]  = sorc-only: ES absorbs its % of pvpDamage into mana BEFORE resists
                      (see r5 §9; the mana portion is unmitigated by resists)
4. afterResists     = pvpDamage * (100 - targetResist%) / 100   -- per channel; %DR for physical
5. afterBlock       = 0 if the hit is blocked, else afterResists  -- blockable hits only
6. finalDamage      = afterBlock                    -- applied to life
```

| Step | Operation | Notes |
|---|---|---|
| 1 | base damage | full attacker-side pipeline already resolved |
| 2 | **× 0.17** | PvP damage penalty — **FIRST**, before any defender mitigation |
| 3 | Energy Shield | sorceress only; soaks a % into mana at 2:1 (TK synergy) before resists |
| 4 | resists / %DR | per-channel resist; physical uses %DR (player cap 50%) then flat DR |
| 5 | block | blockable hits only; cap 75% standing (÷3 running) |
| 6 | final | remainder hits life |

Reference formula (Energy-Shield case, `r5` §9.3):

```
LifeDamage = Incoming * pvpDamagePenalty * (1 - Res/100) * (1 - Block/100) * (1 - ES%/100)
ManaDamage = Incoming * (2 - 0.0625 * TK_hard) * pvpDamagePenalty
```

**Why order matters:** applying ×0.17 first means resists and block operate on the
already-reduced number, and — critically — the **hit-recovery check** (below) sees only the
post-penalty damage. This is what makes stun-lock far harder in PvP than PvM.

## Leech vs players

Leech vs a player uses the **×0.5 leech penalty** — the separate factor, stacked
**multiplicatively** on top of the difficulty leech penalty. See `combat-resolution.md`
§Leech for the full expression (`leeched = finalPhysicalDamage * leech% / 100 *
drainEffectiveness * difficultyPenalty * PvPPenalty`).

```
leechedVsPlayer = finalPhysicalDamage * leech%/100 * drainEffectiveness
                * difficultyPenalty        -- Normal 1.0 / NM 0.5 / Hell 0.33
                * 0.5                       -- pvpLeechPenalty (this factor)
```

- Basis is **physical damage actually dealt after all reductions** (post-×0.17,
  post-resist/%DR). Elemental/magic/poison never leech.
- Example (Hell duel): effective leech multiplier = `0.33 * 0.5 = 0.165` of the nominal
  leech%, on an already-×0.17-penalized physical basis.
- The leech penalty is **independent** of the damage penalty; both apply to a PvP hit.

## FHR & knockback in PvP

- **Faster Hit Recovery.** The flinch trigger is unchanged (`combat-resolution.md` §Hit
  Recovery): a single hit removing `> maxHP / 12` (8.33%) forces hit recovery. Because the
  ×0.17 penalty is applied **before** this check, PvP hits rarely cross the threshold, so
  reliable stun-lock requires very high burst. FHR breakpoints
  (`stats-and-formulas.md`) govern recovery frame count identically to PvM.
- **Knockback.** Players are knockback-susceptible. Skill-based knockback (bash/leap
  archetypes) is **100%**; the item `Knockback` property uses the size-class chance table
  (`combat-resolution.md` §Knockback / `r3` §15.3). KB is suppressed if the hit kills or
  the target is frozen; **Cannot Be Frozen** does not prevent KB.
- **On-hit riders vs players** (from `combat-resolution.md`, PvP rows):

  | Rider | Melee vs player | Ranged vs player |
  |---|:---:|:---:|
  | Crushing Blow | 1/10 current HP | 1/20 current HP |
  | Open Wounds | ×1/4 | ×1/8 |

  Open Wounds and CB **bypass** the ×0.17 penalty and resists (they are fraction-of-HP /
  negative-regen, not standard damage); the multipliers above already encode the PvP
  reduction. Poison vs players **cannot deal the killing blow** (floors at 1 HP).

## Scope table

| Feature | Phase 6 duels (scheduled) | Later / out of scope |
|---|:---:|:---:|
| Consent-based duel (accept prompt) | ✅ | — |
| ×0.17 PvP damage penalty | ✅ | — |
| ×0.5 leech-vs-player penalty | ✅ | — |
| No permanent death / no XP loss on duel defeat | ✅ | — |
| Town-declared free-for-all hostility | ❌ | ✅ |
| Hostility cooldown / red portal denial | ❌ | ✅ |
| Ladder / arena / matchmaking | ❌ | ✅ |
| PvP-specific balance tuning (per-skill PvP coefficients) | ❌ | ✅ |
| Ranked rewards, PvP cosmetics | ❌ | ✅ |

Until a phase schedules full hostility, treat everything in the right column as **spec
only** — the sim must compute PvP numbers correctly, but no UI beyond the Phase 6 duel
prompt is built.
