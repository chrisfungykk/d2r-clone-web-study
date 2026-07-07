# Controls

> Classic click-to-move ARPG controls following D2R conventions, with optional quick-cast
> and rebindable keys. Targeting to be built on ground-plane raycast so limited orbit never
> changes movement semantics.

## Mouse

| Input | Function |
|---|---|
| LMB on ground | Click-to-move to point. Hold = continuous movement following cursor |
| LMB on monster | Attack/cast LMB-bound skill at target |
| LMB on NPC/object/portal/item | Interact / talk / open / pick up |
| LMB on ground item label | Pick up that item (no pixel-hunting) |
| RMB | Cast RMB-bound skill at cursor position or target |
| Shift + LMB | Force-stand-still: attack/cast at cursor without moving, even if cursor is past range (ranged will fire at max range in direction) |
| Ctrl + LMB on item | Quick-move between containers / quick-sell to vendor |
| Shift + RMB on potion | Feed potion to hireling |
| Middle-mouse drag horizontal | Orbit camera within ±45° |
| Middle-mouse drag vertical (close zoom only) | Tilt ±8° |
| Mouse wheel | Zoom along the camera rail |
| Wheel-click double-tap / Home | Reset zoom / reset camera yaw |

**Force Move** = LMB click that ignores targets (walks through monsters). Unbound by default; assignable in settings for players who want to avoid attacking when clicking past a monster.

## Keyboard defaults

| Key | Function |
|---|---|
| F1–F8 | Skill hotkeys. Default: reassigns active mouse button to that skill, then click to use. With Quick Cast enabled: casts skill at cursor instantly |
| 1–4 | Use potion from belt column 1–4 |
| W | Weapon set swap (I ↔ II) |
| Tab | Automap toggle (fullscreen/mini) |
| Alt | Show ground item labels (hold or toggle per option) |
| Shift (hold) | Stand still while attacking |
| R | Run / walk toggle |
| A or C | Character sheet |
| I | Inventory |
| T | Skill tree |
| Q | Quest log |
| P | Party screen |
| O | Hireling panel |
| S | Open RMB skill selector |
| Z | Toggle merc portrait visibility |
| V | Move minimap between corners |
| Esc | Close panel / open game menu |
| Enter | Open chat entry |
| Home | Snap camera yaw back to 0 |
| F (hold) + wheel | Fine zoom control (D2R pattern) |

## Quick Cast (settings-optional)

When enabled (default: off, to preserve classic behavior):

- Pressing F1–F8 (or any rebound skill key) **instantly casts** that skill at the current cursor position
- Does NOT change the RMB binding, solving the D2R community pain point where quick cast disrupted aura toggles
- Works alongside the classic bind-then-click mode — players choose per preference

## Controller scheme (Phase 7+ outline)

- Left stick: direct movement (no click-to-move), with soft auto-target
- Right stick: aim / camera orbit
- Face buttons (4) + triggers (2): skill slots page 1; hold left trigger for page 2 → 12 skills
- D-pad: belt columns 1–4
- Menu buttons: consolidated full-screen panel UIs

## Input layering

```
Game view → UI panels (absorb clicks on open panel areas)
         → ground plane raycast (movement / skill targeting)
         → entity raycast (attack / interact)
```

- Click-through-UI is impossible (panels absorb input first)
- Ctrl/Shift/Alt modifiers only apply in game view, not in text fields
- Skill-select flyouts pause movement until dismissed

## UI hotkeys (all panels)

All panel hotkeys work as open/close toggles. Opening a closed panel opens it; opening an already-open panel closes it. Panels on the same side stack (last-opened wins). Full list in `inventory-and-panels.md`.

## Settings

- Full key rebinding (per-character settings file in IndexedDB)
- Quick Cast: on/off toggle
- Show Items label behavior: Hold / Toggle
- Auto gold pickup: on/off
- Item drop spacing: Classic (dense) / Updated (spread, D2R)
- Mouse sensitivity for orbit (0–100%)
- Zoom sensitivity (0–200%)
- Force Move key bind
