# Automap

> Fog-of-war overlay that reveals as the player explores. Two modes: minimap (corner
> widget) and fullscreen (transparent overlay). Data sourced entirely from `ZoneView`
> revealed cells — the renderer never tracks visits itself.

## Data source

The sim exposes revealed automap cells via `zone().revealedCells` on `IWorld` (see
`world-seam.md`). Reveal radius: 20 m around the player, updated on automap-cell
crossing, not per tick. Cell size: 2 m (a large zone is 128² = 16,384 cells). Per
character, per session — maps reroll each game so reveal state is ephemeral
(`save-persistence.md`).

## Two modes (Tab toggles)

| Mode | Display | Toggle |
|---|---|---|
| Minimap | Corner widget (~15% viewport), semi-transparent | Tab (cycle: mini → full → off) |
| Fullscreen | Transparent overlay over gameplay, centered on player | Tab |

`V` key moves the minimap between the four viewport corners (persisted in settings).

## Color scheme

All colors use high-contrast, colorblind-safe palette on a dark translucent background:

| Element | Color | Note |
|---|---|---|
| Explored walkable | `#3a6a3a` (muted green) | Base map fill |
| Unexplored / fog | fully transparent | No geometry drawn |
| Walls / unwalkable | `#1a1a2e` (dark blue-gray) | Boundary outlines, 1 px |
| Player | `#ffffff` (white) | Arrow icon showing facing direction |
| Party members | `#00cc00` (bright green) | Dot with name label |
| Hostile players | `#cc0000` (red) | Dot (Phase 6) |
| NPCs | `#c9a84c` (gold) | Small diamond |
| Waypoint (discovered) | `#5599ff` (blue) | Cross icon |
| Waypoint (undiscovered) | not shown | Reveals on visit |
| Portal (town/player) | `#cc66ff` (purple) | Small circle |
| Shrine (unused) | `#ff9933` (orange) | Small triangle |
| Shrine (used) | `#666666` (gray) | Same shape, dimmed |
| Quest target | `#ff4444` (red pulse) | Pulsing diamond (when quest active) |
| Zone exit / entrance | `#ffffff` (white) | Door icon |

## Rendering

- DOM `<canvas>` overlay, not Three.js scene geometry — crisp at any zoom, zero draw calls.
- Fullscreen mode: 50% opacity background fill, world continues rendering beneath.
- Minimap mode: rounded-rect clip, 2 px border matching HUD stone texture color.
- Both modes: north-up fixed orientation (no rotation with camera orbit). Player arrow
  rotates to show facing.
- Scale: fullscreen ≈ 1 px per automap cell; minimap ≈ 0.5 px per cell (enough to read
  structure, not labels). Zoom the minimap with Ctrl+wheel (3 fixed steps).

## Interaction

| Input | Action |
|---|---|
| Tab | Cycle: minimap → fullscreen → off |
| V | Move minimap corner (TL → TR → BR → BL) |
| Ctrl+wheel (minimap) | Zoom minimap (3 steps) |
| Click (fullscreen only) | No click-through — clicks on the overlay do nothing; close overlay first to interact with the world |

## Update cadence

- Reveal check: on player crossing a 2 m cell boundary (not per frame).
- Redraw: on reveal update, entity position change (party/NPC markers), or mode toggle.
  Not per frame — dirty-flag driven.
- Entity markers update every 10 ticks (400 ms) — smooth enough for map, saves work.

## Persistence

- Per-session only. Zone layouts reroll each game; persisting reveal data for a layout
  that no longer exists is meaningless. Within a session, reveal survives zone exit and
  re-entry.
- Minimap corner preference and zoom level persist in settings (IndexedDB).
