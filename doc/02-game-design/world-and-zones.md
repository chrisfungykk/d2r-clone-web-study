# World & Zones

> Zone generation, connectivity, waypoints, mapping, and travel structures for 5 acts.
> Zone content names per `04-content-bible/zones.md`. Sources canonicalized from
> `doc/research/r4-world-progression.md`.

## Act structure (standard form)

Each act follows:
```
Safe town → [overworld chain: 3-4 zones] → [optional side dungeons: 1-2] → [dungeon: 2-3 lvls] → boss arena
```

Waypoints: 9 per act (except act IV = 3). Placed at: town entrance, zone transitions,
midpoint of each overworld zone, before dungeon entrance, after dungeon exit, before boss.

## Zone properties

Each zone in the `zones` table:

```
id: ZoneId
act: number
name: string (from content bible)
alvlN: number; alvlNM: number; alvlH: number
generatorKey: string     // terrain generator to use
size: "small" | "medium" | "large"
type: "town" | "wilderness" | "dungeon" | "boss"
connectivity: { to: ZoneId[] }  // forward edges (reverse edges implicit)
waypoint: boolean       // has waypoint
density: 1-5            // spawn density weight
monsterSet: MonsterFamilyId[]
superuniques: SuperUniqueId[]
shrineCount: [min, max]
areaEffect?: "burn" | "chill" | "none"
```

## Terrain generators

Each `generatorKey` produces a unique-feeling layout:

| Key | Layout pattern | LOS profile |
|---|---|---|
| `wilderness_open` | Rolling terrain, sparse trees, wide paths | High (see far) |
| `wilderness_forest` | Dense tree coverage, winding paths | Low (dense occlusion) |
| `wilderness_desert` | Flat with rock formations, ruins | High with intermittent block |
| `wilderness_swamp` | Water channels, reeds, muck-tiles | Medium-low |
| `wilderness_jungle` | Triple canopy, root tunnels, near-zero visibility | Very low |
| `wilderness_floating` | Islands connected by narrow bridges | Vertical, open gaps |
| `dungeon_rooms` | Rectangular rooms connected by corridors | Room-LOS |
| `dungeon_caves` | Organic tunnels with wide chambers | Tunnel-LOS |
| `dungeon_tomb` | Symmetrical chamber-and-passage, trap floors | Corridor-LOS |
| `dungeon_fortress` | Walls, courtyards, balconies, stairs | Multi-height |

## Generation process (per seed)

```
1. seed → rng(zone generator seed from `map` stream)
2. Layout: generate base terrain from generatorKey → heightfield + walkability grid
3. Props: place static prop instances (trees, rocks, ruins) at seeded positions
4. Spawn bounds: define pack-spawning zones based on movement-freedom analysis
5. Waypoints: place at pre-defined coordinates (per zone, per seed-generator offset)
6. Shrines: place `shrineCount` at random walkable cells (not in spawn areas)
7. Superunique: place at anchor location (fixed per zone, per generator)
8. Town: no spawns, all NPCs placed at fixed positions around the hub
```

Deterministic: same (zoneId, seed) → identical grid hash. No wall-clock input.

## Shrine catalog

Shrines are clickable world objects placed at generation (`shrineCount` per zone, drawn
from a per-zone allowed pool). Rules:

- Timed buffs **do not stack**: activating a new shrine replaces the current buff and
  resets the duration (no additive stacking).
- Curses remove an active shrine buff, and activating a shrine buff removes curses.
- All durations/refresh timers are stored in ticks (25 Hz). A refreshing shrine can be
  re-used after its refresh timer; "never" shrines are one-use per game session.

14 shrine types (the four elemental wards are variants of one type):

| Shrine | Effect (exact) | Duration | Refresh |
|---|---|---|---|
| Wellspring | Refills life AND mana instantly | instant | never |
| Lifespring | Refills life instantly | instant | 3000 (120 s) |
| Manaspring | Refills mana instantly | instant | 3000 (120 s) |
| Bulwark | +100% defense | 2400 (96 s) | 7500 (300 s) |
| Warbrand | +200% attack rating, +200% min and max damage | 2400 (96 s) | 7500 (300 s) |
| Siphon | +400% mana regeneration rate | 2400 (96 s) | 7500 (300 s) |
| Communion | +2 to all skills (only skills with ≥1 hard point) | 3600 (144 s) | 7500 (300 s) |
| Epiphany | +50% experience per kill | 3600 (144 s) | **never** |
| Emberward / Frostward / Stormward / Venomward | +75% to one resistance (fire / cold / lightning / poison) | 3600 (144 s) | 7500 (300 s) |
| Longstride | Unlimited stamina | 4800 (192 s) | 7500 (300 s) |
| Lapidary | Upgrades one random carried gem by one tier (drops a chipped gem at the shrine if none carried; cube contents ignored) | instant | never |
| Provocation | Promotes the nearest normal monster to champion/unique (rolled) | instant | never |
| Cinder | Trap: ring of fire bolts that halves the current life of anything hit | instant | never |
| Shatter | Trap: scatters 5-10 exploding vials (fire damage) around the shrine | instant | never |
| Miasma | Trap: scatters 5-10 gas vials plus a poison cloud around the shrine | instant | never |
| Gateway | Opens a town portal (persists for the game session) | instant | never |

Epiphany shrines are the routing standout: non-refreshing and high-value, so players save
them for boss kills and high-density pulls.

**Wells** (separate object class, placed like shrines): restore 50% of max life/mana/
stamina for the player and minions, cure poison, remove curses; hold 2 charges, each
recharging on an independent 750-tick (30 s) timer.[^shrines]

[^shrines]: Effects, durations, and refresh timers verified against the Maxroll D2R
shrine reference (Armor/Combat/Mana-Recharge 96 s; Skill/Experience/Resist 144 s;
Stamina 192 s; boosters refresh at 300 s, Health/Mana springs at 120 s; Experience/
Refilling/magic shrines never refresh), converted to 25 Hz ticks. This resolves the
96-vs-144 s conflicts noted in `doc/research/r4-world-progression.md` §7.

## Waypoints

- 30 total (9/9/9/3/9)
- Discovered by clicking the waypoint object in-zone
- Cross-act travel: town waypoints always available; inter-act travel from any town WP
- Per-character, per-difficulty unlocking
- Party members share discovered WPs in co-op

## Town NPC services

| Service | Count per act | Notes |
|---|---|---|
| Healer | 1 | Heals + resurrect hireling |
| Vendor (armor/weapons/misc) | 1-2 per type | Per act, buying "vendor category" filters |
| Gamble NPC | 1 | Gambling interface |
| Stash | 1 | Personal + shared |
| Waypoint | 1 | In town square |
| Quest NPCs | ~6 | Per-act quest givers |
| Transporter (act transition) | 1 | At town edge, opens quest-clearable transport |
| Hireling pool | 1 | All 4 variants available from specific act hubs |

## World connectivity graph

```
Act I town → wilderness chain → dungeon → boss → 
Act II town → wilderness + side tombs → ossuary → boss →
Act III town → jungle chain → temple dungeon → council boss →
Act IV town → fortress chain → chasm → seal boss →
Act V town → mountain chain → keep → throne → final boss → credits
```

No cross-act shortcuts until waypoints unlocked. Each act transition is one-way until
the player completes the next act (then travel via town waypoints opens bidirectionally).
