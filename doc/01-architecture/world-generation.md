# World Generation

> Every zone layout is a pure function of `(worldSeed, zoneId)` — regenerable, never stored.
> Zone rows and generator keys live in `02-game-design/world-and-zones.md`; this doc owns the
> algorithms, parameters, and derived runtime grids. Sim-side consumers are specified in
> `simulation-runtime.md`.

## Generator families

The ten `generatorKey`s (and Phase 4's zone-type list) are parameterizations of three
algorithm families — new themes add parameter sets, not new generators:

| Family | Keys | Algorithm |
|---|---|---|
| outdoor scatter | `wilderness_open`, `_forest`, `_desert`, `_swamp`, `_jungle`, `_floating` | heightfield + border + spine carve + feature scatter |
| room graph | `dungeon_rooms`, `dungeon_tomb`, `dungeon_fortress` | BSP rooms + corridor graph |
| cellular | `dungeon_caves`, organic/infernal variants | cellular automata + flood-fill repair |

## Footprints & grids

Zone `size` (zones table) fixes the footprint; all runtime grids derive from it:

| size | footprint | walkability cells (0.5 m) | typical use |
|---|---|---|---|
| small | 96 × 96 m | 192² | side dungeons, boss arenas |
| medium | 160 × 160 m | 320² | dungeon floors, dense wilderness |
| large | 256 × 256 m | 512² | overworld chain zones |

Towns are authored fixed templates (~120 × 120 m), seed-independent — NPCs and services sit
at hand-placed positions (`world-and-zones.md`).

## Outdoor scatter

1. **Border:** 4 m impassable ring (dressed with edge props by the renderer).
2. **Heightfield:** 2–3 octaves of value noise via `fixedmath` tables, amplitude per theme;
   adjacent-cell height delta > 0.5 m ⇒ cliff (unwalkable).
3. **Spine carve:** jittered polylines connecting entrance, exit(s), and the waypoint site;
   width 3–5 m, forced walkable — the connectivity guarantee is constructive, not hopeful.
4. **Feature scatter:** props, rock formations, ruins, tree clusters placed by dart-throwing
   with per-feature min-spacing (30 attempts against an occupancy grid, then give up on that
   feature). Theme sets density and LOS character: `_forest`/`_jungle` scatter LOS-blocking
   canopy blobs; `_open`/`_desert` stay sparse; `_floating` masks the footprint to island
   blobs joined by 2 m bridges before scattering.
5. **Connectivity check:** flood fill from the entrance; disconnected open pockets are either
   carved into the main component (shortest wall cut) or filled solid. Accept: ≥ 90% of open
   cells reachable, all placement anchors reachable.

## Room-graph dungeons

1. **Rooms:** BSP-partition the footprint; room count small 8–12 / medium 12–20 / large
   20–30; room sides 6–14 m (12–28 cells). `dungeon_tomb` mirrors placement across an axis;
   `dungeon_fortress` reserves an outer courtyard ring and BSPs only the keep interior.
2. **Corridors:** minimum spanning tree over room centers plus 15–25% extra edges for loops;
   dog-leg (axis-aligned) runs, width 2 m (3 m on the entrance–exit spine).
3. **Doors:** at room/corridor junctions; locked/lever doors only where a quest row asks.
4. **Entrance/exit:** stairs in the two rooms with maximal graph distance (exits feel "deep");
   multi-floor zones (2–3 floors per act structure) chain exit stair → next floor record.
5. Connected by construction (MST); a flood fill still validates before placement passes.

## Cellular caves & organic zones

1. **Seed:** 45% wall fill from the zone stream; border forced wall.
2. **Smooth:** 5 automata iterations — a cell becomes wall iff ≥ 5 of 8 neighbors are wall.
3. **Repair:** flood-fill components; keep the largest; components ≥ 60 m² are joined by a
   carved 2 m tunnel along the shortest route, smaller ones are filled.
4. **Chambers:** dilate 2–3 pockets into wide chambers (superunique/hoard anchors).
5. **Entrance/exit:** maximal-distance floor cells near the border.

Infernal/organic variants (Phase 4's "hell" type) reuse this family at 40% fill and 4
iterations with a ridge-noise overlay and `areaEffect` cells (burn/chill) from the zone row.

## Determinism

- Generation draws only from derived streams `worldgen/<zoneId>`, split further per pass
  (`worldgen/<zoneId>/layout`, `/shrines`, `/packs`, …). This extends `determinism.md`'s
  named-stream scheme (the `map` family): generating or re-tuning one zone — or adding a
  pass — never shifts another stream's sequence.
- Generation is **pure of the tick loop**: it runs at zone transition, outside `step()`,
  touches no gameplay stream (`combat`/`loot`/`ai`), and same `(worldSeed, zoneId)` yields a
  bit-identical layout — the walkability-grid hash is the golden test (Phase 0.5/4.1).

## Walkability derivation

Tiles/props resolve to the 0.5 m cell bitfield the sim consumes (`simulation-runtime.md`):

```ts
const WALK  = 1 << 0;  // units may occupy (cleared by cliffs, water, walls, prop footprints)
const LOS   = 1 << 1;  // blocks sight (walls, canopy, formations — water/muck do not)
const FLY   = 1 << 2;  // blocks missiles (walls yes; water, low rubble no)
const SPAWN = 1 << 3;  // monster packs may seed here (spawn bounds pass)
```

## Placement passes

Run in fixed order after layout, each on its own sub-stream; every anchor must land on
reachable cells (validated against the flood fill):

1. **Entrance/exit** — by generator (above); transitions match the zone's connectivity edges.
2. **Waypoint** — near the main-path midpoint, ≥ 20 m from the entrance, 2 m clearance forced walkable.
3. **Quest fixtures** — altars/cells/gates per quest rows; largest room or dilated chamber, ≥ 30 m from entrance.
4. **Superunique anchors** — per zone row; distinct rooms/pockets, ≥ 25 m apart.
5. **Shrines** — roll count in the row's `shrineCount` range; walkable cells with 2 m clearance, outside spawn bounds, ≥ 15 m apart.
6. **Chests/loot fixtures** — outdoor 2–5, dungeon 4–8 plus one hoard chest in a far room; TC by zone alvl.
7. **Monster pack seeding** — blue-noise pack sites on SPAWN cells at ≈ 0.5 × `density` packs
   per 1,000 walkable m² (row density 1–5); pack composition/size per `monsters.md`, rolled
   on the `monsterSpawn` stream at spawn time, not gen time.

## Automap

- **Reveal bitfield** per zone at 2 m automap cells (large zone: 128², 2 KB). Reveal radius
  20 m around the player, updated on automap-cell crossing, not per tick.
- **Per character, session-scoped.** Zone layouts are ephemeral and reroll each session
  (`save-persistence.md`), so persisted reveal would describe a map that no longer exists;
  within a session, reveal survives zone exit/re-entry.
- Exposed as the "revealed automap cells" of `ZoneView` (`world-seam.md`); the renderer draws
  fog-of-war strictly from that snapshot — it never tracks visits itself.

## Timing & memory

- **Whole-zone generation at entry**, amortized over ≤ 5 render frames (~80 ms) per Phase 7
  §7.6: layout ≤ 40 ms, placement passes ≤ 20 ms, grid/automap buffers ≤ 10 ms, spawn
  seeding ≤ 10 ms. Renderer mesh build overlaps on its own budget behind the transition fade.
- **Per-zone footprint** (large): heightfield Float32 512² ≈ 1 MB, walkability 256 KB, coarse
  flow grids ≈ 192 KB, automap 2 KB — < 2 MB total. Only the current zone's layout buffers
  stay resident; visited zones retain just dynamic state (live entities, ground items,
  opened/used flags — kilobytes) and regenerate layout bit-identically on re-entry.
- **No streaming.** The largest zone is 256 m across and its buffers are ~0.5% of the 350 MB
  heap budget; the 32 m render chunks (`rendering.md`) are frustum-culling granularity, not a
  streaming unit, and the 40 m AoI already bounds entity work regardless of zone size.
