# Zone Roster — Content Bible

> Original zone names, themes, and structural roles mapped to act-flow slots. Each zone
> conforms to the mechanical patterns described in `02-game-design/world-and-zones.md`
> (alvl range, connectivity rules, spawn density, size, dungeon depth).

## Naming notes

Each zone entry shows: `Name (Type) — theme, approximate alvl range Normal, D2 reference structure.`
The D2 reference is for engineer orientation only — a one-line note; zones are authored
with original generators and never reproduce Blizzard layouts.

## Act I — The Drowned Coast

| Zone | Type | Theme | Alvl (N) | Structural note |
|---|---|---|---|---|
| Salt-Wick Town (town) | Safe town | Clifftop fishing village, weathered stone, creaking wooden piers, fog | — | Hub with all NPC services |
| Tide-Wracked Flats | Wilderness | Intertidal marsh, scattered shipwrecks, ankle-deep water, dense reeds | 1-3 | Start zone, open with patches of vision-blocking tall grass. Sparse spawn |
| Brackwood | Forest | Flooded forest, dark standing water, moss-draped ancient trees | 4-6 | Moderately dense, winding paths, some ruins as landmarks |
| Fenlight Barrows | Wilderness | Fog-bound burial downs, sunken cairns, pale marsh-lights over open graves | 6-7 | Fourth mainline wilderness zone (completes the act's 4-zone chain per `naming-and-lore.md`). Open, low fog LOS |
| Sundered Watch | Ruins | Collapsed stone watch-fortress overrun by marsh | 7-8 | Indoor-outdoor hybrid, small to medium rooms |
| The Sunken Fane (dungeon) | Catacombs | Submerged temple, flooded lower floors, pale luminescent fungi | 9-10 | 3 levels. Level 3 = boss arena (flooded chamber) |
| Shale-Root Pass | Side cave | Eroded sea-cliff caves, iron vein deposits | 3-6 | Optional. Good early-item farming, contains cave-zombie variant |
| Bleak-Head | Side ruin | Watchtower ruin with unique encounter | 7 | Single-room superunique encounter (The Toll-Keeper — rune farm), adjacent to Sundered Watch |

### Act I mechanical data (complete — template for Acts II–V)

Per-zone data for the `zones` table (`world-and-zones.md` schema). NM/Hell alvls follow
the Act I bands in `difficulty-progression.md` (NM 36–42, Hell 67–75); the Sunken Fane
Hell values are the act's sanctioned alvl-85 exception per `02-game-design/endgame.md`.
TC ids are placeholders resolved in `src/sim/data/treasure-classes.ts` (Phase 2). Monster
sets use family ids from `monster-roster.md`; superunique specs in the Act I superunique
roster there. **Waypoint total: 9** (act invariant per `world-and-zones.md`). Acts II–V
mechanical tables are backlog.

| Zone | WP | Alvl N | NM | Hell | TC id | Monster set (superuniques) |
|---|---|---|---|---|---|---|
| Salt-Wick Town | yes | — | — | — | — | none (town) |
| Tide-Wracked Flats | yes | 1–3 | 36 | 67 | `tc_a1_flats` | gloomwing, brack_wight, starving_one (Morvane the First-Drowned) |
| Brackwood | yes | 4–6 | 37 | 68 | `tc_a1_brackwood` | shalehide, gloomwing, vine_tender, starving_one (Thicket-Jaw; The Pale Choir) |
| Shale-Root Pass | yes | 3–6 | 37 | 69 | `tc_a1_shaleroot` | shalehide, bright_tick, brack_wight (Mother-of-Needles) |
| Fenlight Barrows | yes | 6–7 | 38 | 69 | `tc_a1_barrows` | husk_walker, brack_wight, gloomwing (Root-Mother Sessk) |
| Sundered Watch | yes | 7–8 | 39 | 70 | `tc_a1_watch` | shalehide, scorchling, husk_walker, starving_one (Cindermaw) |
| Bleak-Head | yes | 7 | 39 | 71 | `tc_a1_bleakhead` | husk_walker, gloomwing (The Toll-Keeper) |
| The Sunken Fane, Level 1 | yes | 9 | 40 | 84 | `tc_a1_fane1` | brack_wight, husk_walker, bright_tick |
| The Sunken Fane, Level 2 | yes | 9–10 | 41 | 85 | `tc_a1_fane2` | scorchling, husk_walker, bright_tick, starving_one (Vess the Starving) |
| The Sunken Fane, Level 3 | no | 10 | 42 | 85 | `tc_a1_fane3` | act boss + brack_wight adds (boss arena; run from Level 2 WP) |

## Act II — The Clockwork Wastes

| Zone | Type | Theme | Alvl (N) | Structural note |
|---|---|---|---|---|
| Khol Gate (town) | Safe town | Mud-brick walled city at the edge of desert, clockwork water-wheel towers | — | All NPC services |
| Cog-Marked Sands | Wilderness | Endless sand with half-buried brass gear-works, dust storms, crumbling road markers | 14-18 | Open, high visual distance, scattered debris provide occasional cover |
| Warden's March | Wilderness | Former caravan route between automated fortresses, intermittent wind-scoured canyons | 19-21 | Canyon sections provide chokepoints. Warden golem encounters |
| Alkali Flats | Wilderness | Salt flats + chemical geysers, speed difference due to crust breakable sections | 22-23 | Open with environmental hazards; kiting-friendly with careful footing |
| Tombs of Forgotten Gears (dungeon) | 7 branching tombs | Clockwork burial chambers, piston traps, animated bronze constructs | 24 | All 7 tombs open but only 1 contains the sigil at bottom (randomized per seed). 3 levels each |
| The Grand Ossuary | Dungeon | Central bone-vault where all 7 tomb passages converge | 25-26 | Labyrinthine central chamber with branching spokes. Boss arena at center |
| Cistern of Rust | Side dungeon | Abandoned water-system of Khol, iron-corroded tunnels | 18-20 | Optional 2-floor dungeon. High unique-spawn chance |
| Scavenger Tunnels | Side dungeon | The Court's smuggler tunnels under Khol | 16-18 | Contains a gamble NPC |

## Act III — The Verdant Abyss

| Zone | Type | Theme | Alvl (N) | Structural note |
|---|---|---|---|---|
| Veridium (town) | Safe town | Tree-city built in canopy, rope bridges, mercury-lit | — | All NPC services |
| Canopy-Dark | Wilderness | Dense triple-canopy jungle floor, near-zero visibility beyond short range | 30-32 | Dense LOS blockage, many short path splits. Caster-unfriendly |
| Hanging Gardens of Khol (ruins) | Wilderness | Overgrown floating garden terraces, exposed to sky | 33-34 | Open vertical platforms connected by root bridges |
| Mirror-Marsh | Wilderness | Still black water reflecting sky, copy-creature hazards (illusory enemies) | 35-37 | Strategic: enemy illusions that look identical to real ones until struck |
| Mercury Falls | River level | Fast-flowing toxic river, island stepping-stones, cataracts | 38-39 | Linear river flow; environmental puzzle (jump across) |
| Fane of the Bleeding Lotus (temple) | Dungeon | Step-pyramid temple, quicksilver-filled channels, serpent motifs | 39-40 | 3 floors. Some sections underwater (breath timer) |
| The Council Chamber | Boss arena | Circular mercury pool chamber with 3 throne seats | 40 | 3 council bosses with elemental combination attacks |
| Root-Tunnels | Side dungeon | Giant parasitic root system under the jungle, tunnel complex | 31-33 | Optional area with rare crafting materials |
| The Echoing Vaults | Side dungeon | Keeper-era mercury-memory vaults | 35-38 | Puzzle dungeon — reflects Doppelgänger |

## Act IV — The Sky-Reach

| Zone | Type | Theme | Alvl (N) | Structural note |
|---|---|---|---|---|
| Ember-Stone (town) | Safe town | Fortress on floating island, approachable by chain-bridge | — | Minimal services (fewer NPCs). The war-front feel |
| Iron-Crack | Fortress | Fortress exterior, siege-breached outer wall, crumbling battlements | 45-47 | Linear progression through breach → inner yard |
| Obsidian Spire | Fortress interior | Vertical climb through fortress core, tight spiral staircases, jump platforms | 47-48 | Multi-level, some open-atrium rooms |
| The Crystal Chasm | Void zone | Bridge of floating crystal shards over infinite star-speckled void | 49-50 | Arena-like open platforms with void-death below |
| Throne of the Shattered King | Boss arena | Stained-glass chapel floating in void, 4 seal lights at corners | 50 | Seal-gated multi-phase boss fight |
| Forge-Tower | Side dungeon | Clockwork forge tower, craft-focused | 47-48 | Contains anvils and a unique crafting recipe |
| Shatter-Stairs | Side dungeon | Broken stairway descending below the floating island into void | 48-49 | Reward: void-tinged gear |

## Act V — The Bleed Heart

| Zone | Type | Theme | Alvl (N) | Structural note |
|---|---|---|---|---|
| Last Landing (town) | Safe town | Final settlement built on frozen obsidian, near the Bleed edge | — | All NPCs including hireling pool and gamble |
| The Jagged Sink | Wilderness | Shattered obsidian landscape, tectonic-rupture terrain, blood-lightning storms | 57-60 | Environmental hazards, flat-fight fields separated by pillar formations |
| Rampart of Rust | Fortress | Keeper-era fortress converted to Bleed nest, organic-obisidian overgrowth on iron | 61-63 | Varied: open courtyards, tight corridors, vertical drops |
| The Weeping Keep | Fortress interior | Interior: chambers pulse with Bleed energy, visual distortion | 63-65 | Some rooms warp/shift layout when re-entered (same seed, deterministic) |
| Coven of Scabs | Wilderness | Organic "village" of Bleed-creatures, hive-like | 64-66 | Dense spawn, tight paths. Caster challenge |
| The Descent | Tunnel | Spiral descent into the Bleed heart, walls surface actively mutate | 66-68 | Monsters progressively get Tough and Fast modifiers |
| The Bleed Heart (boss) | Boss arena | Massive pulsating chamber, 5 wave-summoning circles | 68 | Wave combat event (5 escalating waves) → final boss emerges from chamber ceiling |
| Bone-Trails | Side dungeon | Path of bleached remains, fallen soldiers returning as walkers | 58-60 | XP-farming zone |
| Echo-Mine | Side dungeon | Resources extraction tunnel, ore still valuable, guardian entities | 61-62 | Contains a vendor-NPC (survivor) and crafting materials |
| Rift-Fields | Side dungeon (endgame) | Reality-thinning area where alvl hits max (85 equivalent) | 85 (Hell) | Post-game farming zone available only after completing Hell act 5 |

## Endgame zones (Nightmare/Hell alvl mapping)

The 8 alvl-85 zones — synced to the canonical list in `02-game-design/endgame.md`
(that file is the source of truth for which zones qualify; this table adds NM alvls).

| Original zone | Act | NM alvl | Hell alvl | Notes |
|---|---|---|---|---|
| Rift-Fields | V (endgame) | 75 | 85 | Main open farming route |
| The Descent | V | 75 | 85 | Linear speed-farm route |
| Throne of the Shattered King | IV | 75 | 85 | Boss + elite pack density |
| The Bleed Heart | V | 75 | 85 | Wave-farming, high density + boss |
| Echo-Mine | V (endgame) | 70 | 85 | Quiet route, fewer monsters, high qlvl |
| Root-Tunnels (NM/Hell version) | III | 70 | 85 | Charm-farming route |
| The Sunken Fane (Hell) | I | 42 | 85 | Fast boss run; NM value stays in the Act I band — the zone only reaches alvl 85 in Hell |
| The Crystal Chasm | IV | 66 | 85 | Caster-favored open-platform routes |
