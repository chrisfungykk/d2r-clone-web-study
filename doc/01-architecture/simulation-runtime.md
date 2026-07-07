# Simulation Runtime

> How the sim executes one tick: entity store, fixed system order, collision, pathfinding,
> line of sight, missiles, monster AI, town portals. Refines `overview.md` (frame loop) and
> `determinism.md`; hard ceilings live in `performance-budget.md`.

## Entity store

Entities are **pooled plain objects** (per `overview.md` and Phase 0.2), created at spawn and
mutated in place — zero steady-state allocation:

```ts
// src/sim/entity.ts
export interface Entity {
  id: EntityId;             // monotonic uint32, never reused within a session
  slot: number;             // pool index — internal, never leaks across the seam
  kind: EntityKind;         // "player" | "monster" | "npc" | "missile" | …
  transform: Transform;     // always present
  lifecycle: Lifecycle;     // always present
  locomotion?: Locomotion; combatant?: Combatant; ai?: AiState;
  missile?: MissileState; lootable?: Lootable; groundItem?: GroundItem;
  portal?: PortalState; shrine?: ShrineState;
}
```

| Component | Carried by | Contents |
|---|---|---|
| `transform` | all | `x, z` (m, float), `facing` (fixedmath angle) |
| `locomotion` | players, monsters, hirelings, summons | speed (m/tick), move mode, collision size class, current path / flow-field ref |
| `combatant` | anything that fights or is hittable | hp, stat block ref, anim `{state, frame, totalFrames}`, queued attack/cast order |
| `ai` | monsters, hirelings, summons | archetype key + params ref, state, target id, home anchor, `nextThinkTick` |
| `missile` | projectiles | direction, speed (m/frame), source id, skill ref, pierce %, hit list, bounces left, age/max frames, homing target + turn rate |
| `lootable` | corpses, chests, breakables | TC ref, opened/looted flag |
| `groundItem` | dropped items | materialized `ItemInstance`, label tier |
| `portal` | town/event portals | owner id, pair link, destination (zone, x, z) |
| `shrine` | shrines | shrine type id, recharge tick |
| `lifecycle` | all | alive flag, spawn tick, optional despawn tick (corpse fade: 60 ticks after loot cleared) |

Pooling and id rules:

- **Fixed-capacity pools, free-list recycled.** General pool 1,024 slots; missiles a separate
  400-slot pool (ceiling per `performance-budget.md` — on exhaustion the oldest missile is
  culled; monster spawns are refused by the spawn governor, never over-allocated).
- **Ids are monotonic and never reused** in a session (per `determinism.md`); slots recycle
  immediately. Stale id lookups return `undefined` — event/view consumers must tolerate them.
- **Iteration order = id order.** Systems walk an insertion-ordered live list (monotonic ids ⇒
  id order), so free-list slot reuse can never perturb replay hashes.
- **SoA for hot data.** DoT/aura effects live in struct-of-arrays ring buffers keyed by slot;
  the spatial hash (2 m buckets) and all pathfinding grids are flat typed arrays
  (per `performance-budget.md`). Component objects stay plain-object for everything else.

## Tick pipeline

`step()` runs systems in a fixed order. Reordering changes replay hashes and is treated as a
mechanics change (golden re-record + justification, per `determinism.md`).

| # | System | Does | RNG streams |
|---|---|---|---|
| 1 | intents | validate queued player intents (range, cost, ownership) and apply | — |
| 2 | ai | staggered monster/hireling decisions → movement + attack orders | `ai` |
| 3 | pathing | flow-field refresh (≤ every 5 ticks), player A* requests, path-waypoint advance | — |
| 4 | locomotion | integrate movement, resolve collision (slide, corner rules), rebuild spatial hash | — |
| 5 | combat | advance anim frames, resolve contact-frame hits, apply skill effects | `combat` |
| 6 | missiles | integrate, collide vs grid + entities, pierce/ricochet/homing, lifetime | `combat` |
| 7 | dots/auras | frame-based DoT ring buffers, aura pulses, buff/curse expiry | — |
| 8 | deaths/loot | kills → XP, quest triggers, TC rolls → ground items, corpse setup | `loot` |
| 9 | events | flush `SimEvent` queue, swap snapshot double-buffer (pooled DTOs) | — |

## Space, units, and collision

- **Units.** Sim space is meters; the game-design docs' mechanics "yards" map **1 yard = 1 m**
  (so `monsters.md` aggro 30–40 yd ⇒ 30–40 m, inside the 40 m AoI margin rule of `camera.md`).
- **Walkability grid.** Each zone carries a `Uint8Array` of **0.5 m cells** derived at
  generation time (`world-generation.md` owns the derivation and the per-cell bit layout).
- **Collision sizes.** The `monsters` table `size` field selects a radius class:
  S = 0.5 m (1 cell), M = 1.0 m (2 cells), L = 1.5 m (3 cells). Players and hirelings are M.

| Mover ↓ / blocker → | grid (unwalkable) | monster | player | missile · item · portal · shrine |
|---|---|---|---|---|
| player | blocks | **blocks** (body-blocking is tactical canon) | passes | passes |
| monster | blocks | blocks | blocks (stops → attacks) | passes |
| missile | blocks (missile-block bit) | hit-test | hit-test | passes |

Corpses and dead entities never block. Entities never write to the walkability grid —
dynamic blocking is resolved at move time only.

**Movement resolution** (locomotion, per tick): step = speed in m/tick, sub-stepped at
≤ 0.5 m increments to prevent tunneling. A step is valid if every cell overlapped by the
mover's radius at the destination is walkable and no hard-blocker circle overlaps. On block:
try the x-only then z-only projection, take whichever makes more progress (slide); if both
fail, stop (monsters then re-steer next think). **Corner rule:** a diagonal step requires
both adjacent orthogonal cells walkable — no clipping wall corners.

## Pathfinding

Promoted from `performance-budget.md` (Known heavy spots):

- **Players (click-to-move) and scripted NPC moves: A\*** on the 0.5 m grid, octile heuristic,
  M-radius clearance, then string-pulling (drop intermediate nodes reachable by a walkable-ray
  LOS check). Budget: ≤ 2 A* runs per tick, ≤ 8,000 expanded nodes; on failure, move toward
  the nearest reachable cell to the target.
- **Monsters: flow fields.** One field per active player, Dijkstra out to leash radius (50 m)
  on a **1 m coarse grid** (coarse cell walkable iff all four fine cells are), recomputed
  ≤ every 5 ticks, shared by every monster hunting that player. Per-monster local steering:
  sampled flow direction + neighbor separation via the spatial hash + wall slide.
- **Repath triggers** (player paths): step blocked > 3 consecutive ticks; follow-target moved
  > 2 m off the path tail; fallback repath every 25 ticks.
- **Cache limits:** one path per entity, one flow field per player — nothing else is cached.

## Line of sight

Integer DDA raycast over the 0.5 m grid's LOS-block bit (fixedmath only — no
transcendentals). Max ray = caller's range (aggro 40 m ⇒ ≤ 80 cells). Consumers: aggro
checks (on think ticks), kiter/caster/sniper positioning, skill target validation, and
missile spawn (the muzzle cell must be LOS-clear of the caster or the cast re-aims/fails —
no through-wall casting). LOS ranges are sim constants, independent of camera zoom
(`camera.md` fairness rule).

## Missiles

- **Motion:** speed stored in **m/frame** in skill/missile data (frames-native, per
  `determinism.md`); typical bolt 0.8 m/frame = 20 m/s. Homing adjusts heading by
  ≤ turn-rate (data, typical 6°/frame) toward the target before integration.
- **Collision:** swept DDA along the tick's segment against the missile-block grid bit, plus
  entity circle tests via the spatial hash, in traversal order.
- **Pierce:** on entity hit, resolve damage, then roll pierce chance (`combat` stream) per
  target; success continues flight. A per-missile hit list (cap 8) prevents re-hitting.
- **Ricochet** (mechanic-key flag): reflect across the blocked grid axis, max 3 bounces.
- **Lifetime:** `maxAgeFrames` from data (default 75 = 3 s); range-defined missiles convert
  range/speed at spawn. Expiry, wall hit (non-ricochet), or failed pierce despawns to pool.
- **Cap:** 400 live (pool above); oldest culled first — a cosmetic-degradation, never a
  gameplay-order, decision (the culled missile has had its oldest hits already resolved).

## Monster AI

State machine per entity, parameterized by the archetype table in
`02-game-design/monsters.md` (aggro/leash radii, flee thresholds, volley counts, ranges).

| State | Trigger | Next |
|---|---|---|
| idle | player in aggro radius + LOS (think tick) | approach |
| idle | wander timer elapses (`ai` stream) | wander |
| wander | point reached / timer / aggro check passes | idle / approach |
| approach | in attack range, attack ready | attack |
| approach | target lost (no LOS > 50 ticks or > 1.5× aggro radius) | leash |
| approach / recover | hp below archetype flee threshold | flee |
| attack | attack animation completes (frame-counted) | recover |
| recover | cooldown frames elapse | approach (or archetype reposition) |
| any combat state | > 50 m from home anchor | leash |
| leash | home reached (fast hp regen en route) | idle |
| flee | distance gained / hp recovered / cornered | idle / approach |

- **Cadence:** decisions run every 5 ticks, staggered by `id % 5` (~44 monsters thinking per
  tick at the 220-entity ceiling). Frame-accurate work — animation advance, path following,
  contact hits — runs every tick regardless.
- Bosses use the `boss` archetype: bespoke phase machines, unlimited leash inside the arena
  (`monsters.md`), interrupt rules per phase.

## Town portals

Portals are ordinary entities (`portal` component), fully sim-owned:

- **Cast** spawns a linked pair: field end at the caster's nearest walkable cell, town end at
  the current act town's portal plaza (8 fixed slots, one per player).
- **Ownership:** one live pair per player; recasting despawns the old pair first.
- **Use:** the owner and party members may traverse either direction. The pair closes when
  the **owner traverses town → field** (the return trip), on recast, or on session end.
  Non-party players cannot use it.
- **Persistence: none.** Town portal state is ephemeral per `save-persistence.md` — a new
  session starts portal-free. Waypoints are zone fixtures, not portal entities, and follow
  their own persistence rules.
