# Settings, Menus & Character Flow

> Game menu, settings screen, character creation, difficulty selection, and the
> meta-UI that wraps the gameplay session.

## Screen flow

```
Launch → Main Menu → [New Character] → Character Creation → Difficulty Select → In-Game
                   → [Load Character] → Character Select → Difficulty Select → In-Game
                   → [Settings] → Settings Screen → back
                   → [Credits] → Credits scroll → back

In-Game → Esc → Game Menu → [Resume] → In-Game
                           → [Settings] → Settings Screen → back
                           → [Save & Exit] → Main Menu
```

## Main menu

Fullscreen dark background with atmospheric particle effect (procedural, no assets).
Working title centered; version number bottom-left.

| Button | Action |
|---|---|
| New Character | → Character Creation |
| Load Character | → Character Select (list of saved characters) |
| Settings | → Settings Screen |
| Credits | → Credits scroll |

## Character creation

Left panel: class selector (7 icons, click to preview). Right panel: procedural 3D
preview of selected class in idle pose at close zoom. Bottom: name input field (max 15
chars, alphanumeric + hyphens, profanity-filtered client-side against a small blocklist).

| Step | UI |
|---|---|
| 1. Choose class | 7 class icons with name + one-line description. Click = select + preview |
| 2. Choose hardcore | Toggle: "Hardcore" checkbox with warning tooltip ("Death is permanent") |
| 3. Enter name | Text field, auto-focus. Unique per account (offline: per IndexedDB) |
| 4. Confirm | [Create] button. Disabled until name valid + class selected |

No appearance customization (procedural characters vary by class, not by player choice —
matching the D2 model). Stat allocation and skill choices happen in-game.

## Character select

Vertical list of saved characters, sorted by last-played. Each row:

```
[Class icon] Name — Level N ClassType — Last played: date
  [HC badge if hardcore] [DEAD badge if dead]
```

Click = select. [Play] button → Difficulty Select. [Delete] button → confirm dialog
(irreversible).

Dead hardcore characters display grayed out with a skull badge. Clicking shows the
character sheet but [Play] is disabled.

## Difficulty select

After character selection. Available difficulties based on `unlockedDifficulty`:

| Difficulty | Unlock condition |
|---|---|
| Normal | Always available |
| Nightmare | Act V boss killed on Normal |
| Hell | Act V boss killed on Nightmare |

Locked difficulties shown dimmed with lock icon and requirement text. Selected
difficulty highlighted. [Start Game] button → generates world seed → enters game.

## Game menu (Esc in-game)

Centered modal over darkened gameplay (world pauses in offline; continues in Phase 6
multiplayer):

| Button | Action |
|---|---|
| Resume | Close menu, return to game |
| Settings | → Settings Screen (returns here on back) |
| Save & Exit | Save character → Main Menu |

## Settings screen

Tab-organized. All settings persist in IndexedDB `settings` store. Changes apply
immediately (no "Apply" button).

### Video tab

| Setting | Options | Default |
|---|---|---|
| Resolution | Auto (viewport) / fixed common resolutions | Auto |
| Quality | Low / Medium / High | Medium |
| Shadows | Off / Blob only / Full | Blob only |
| Post-processing | Off / Fog only / Full (fog + bloom + vignette) | Fog only |
| FPS limit | 30 / 60 / Unlimited | 60 |
| Show FPS | Off / On | Off |

### Gameplay tab

| Setting | Options | Default |
|---|---|---|
| Quick Cast | Off / On | Off |
| Show Items | Hold Alt / Toggle Alt | Hold |
| Auto gold pickup | Off / On | On |
| Item label style | Classic (dense) / Spread | Spread |
| Minimap corner | TL / TR / BR / BL | TR |
| Clock display | Off / On | Off |
| Camera shake | Off / Reduced / Full | Full |

### Controls tab

Full key rebinding grid. Each action shows current key; click → "press new key" capture
mode. [Reset to defaults] button.

### Audio tab (Phase 7)

| Setting | Range | Default |
|---|---|---|
| Master volume | 0–100 | 80 |
| SFX volume | 0–100 | 100 |
| Music volume | 0–100 | 70 |
| Ambient volume | 0–100 | 60 |

### Accessibility tab

| Setting | Options | Default |
|---|---|---|
| Reduce motion | Off / On | Off |
| High contrast UI | Off / On | Off |
| Screen reader hints | Off / On | Off |
| Font size | Normal / Large / X-Large | Normal |
| Colorblind mode | Off / Protanopia / Deuteranopia / Tritanopia | Off |
| Low health indicator | Globe only / Globe + vignette / Globe + vignette + audio | Globe only |

## Loading screen

Between zone transitions: dark screen with zone name + atmospheric one-liner (from
content bible), thin progress bar. Target: ≤ 80 ms zone generation (5 render frames per
`world-generation.md`), so the loading screen is brief but prevents a blank flash.
