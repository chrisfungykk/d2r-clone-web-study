# Inventory & Panels

> Two-panel system: left panel + right panel open simultaneously. Right slots = inventory
> or skill tree. Left slots = character sheet, quest log, waypoints, party, hireling,
> stash, cube, vendor, gamble, trade. Container UIs (stash/cube/vendor) auto-open inventory
> on the right.

## Panel architecture rules

1. Each panel occupies ~40-45% screen width × ~85-90% height (16:9), top-aligned above HUD.
2. One left + one right panel may be open simultaneously.
3. Opening a second panel on same side replaces the first.
4. Esc or close button dismisses panel(s).
5. Container-type left panels (stash, cube, vendor) force-open inventory on right.
6. World continues running while panels are open — no pause.

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────── LEFT PANEL ───────┐   gameplay strip  ┌── RIGHT ─┐│
│ │ (container UIs, char,      │   (~20% visible;   │ inventory│
│ │  quest, party, hireling,   │    world live)     │ or skill│
│ │  waypoints)                │                    │ tree)   │
│ └────────────────────────────┘                    └──────────┘│
│ [═══════════════════════════ HUD BAR ═════════════════════════]│
└──────────────────────────────────────────────────────────────┘
```

## Inventory panel (right half — key `I`)

Paper-doll + backpack grid layout:

```
┌──────────────────────── INVENTORY ────────────────────────┐
│ Weapon sets: [ I ] [ II ]                                  │
│ ┌─────┐   ┌───────┐  ┌─────┐  ┌─────┐                     │
│ │WPN L│   │ HELM  │  │ AMU │  │WPN R│   Grid cell sizes:  │
│ │ 2×4 │   │ 2×2   │  │ 1×1 │  │ 2×4 │   helmet 2×2        │
│ ├─────┤   ├───────┤  └─────┘  ├─────┤   amulet 1×1        │
│ │GLVES│   │ BODY  │  ┌─────┐  │BOOTS│   body 2×3          │
│ │ 2×2 │   │ 2×3   │  │RING1│  │ 2×2 │   rings 1×1×2       │
│ └─────┘   │       │  └─────┘  └─────┘   weapon/shield 2×4  │
│           └───────┘  ┌─────┐           gloves 2×2          │
│   ┌──────┐           │RING2│           boots 2×2           │
│   │ BELT │  ┌─────┐  └─────┘           belt 2×1           │
│   │ 2×1  │  │SHIELD or ORB/SCEPTER etc.                   │
│   └──────┘                                                 │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ BACKPACK GRID: 10 wide × 4 tall (40 cells)              ││
│ │ ██ ░░ ░░ ██ ██ ░░ ░░ ░░ ░░ ░░                          ││
│ │ ██ ░░ ░░ ██ ██ ░░ ░░ ░░ ░░ ░░                          ││
│ │ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░                          ││
│ │ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░                          ││
│ └──────────────────────────────────────────────────────────┘│
│                    Gold: NNNNN  [select amount to drop]     │
└────────────────────────────────────────────────────────────┘
```

- Items occupy W×H cells (1×1 rings up to 2×4 large weapons)
- Click item → sticks to cursor at grid scale → valid drop highlights green, invalid red
- Ctrl-click item = quick-move to open container / to belt if potion / sell if vendor open
- Shift-click potion in inventory = send to belt
- Weapon set tabs I/II: click inactive tab = weapon swap (W). Inactive set mods do not apply
- Charms sit in backpack grid and are active from there (1×1 small, 1×2 medium, 1×3 grand)

## Character sheet (left half — keys `A` or `C`)

```
┌─────────── CHARACTER ────────────┐
│ NAME              CLASS          │
│ LEVEL n    EXPERIENCE nnnnnn     │
│            NEXT LEVEL nnnnnn     │
│                                   │
│ Strength     nn  [+]              │  [+] appears when unspent
│ Dexterity    nn  [+]              │  stat points exist. Each
│ Vitality     nn  [+]              │  click = 1 point.
│ Energy       nn  [+]              │  Remaining points counter.
│ ─────────────────────             │
│ Life:     nnn/nnn                 │
│ Mana:      nnn/nnn                │
│ Stamina:  nnn/nnn                 │
│ Attack Rating: nnnnn              │
│ Defense:     nnnnn                │
│ Damage:      nn-nn                │
│ ─────────────────────             │
│ Fire Resist    nn%                │
│ Cold Resist    nn%                │
│ Lightning      nn%                │
│ Poison Resist  nn%                │
│                                   │
│ [ADVANCED STATS ⤢]                │
│  (pop-out: target/fire/cold/light/poison dmg, magic find,   │
│   gold find, FCR, FHR, IAS, FRW, crushing blow, CB%/DS%,    │
│   life leech, mana leech, pierce, etc.)                     │
└───────────────────────────────────┘
```

- All numbers come from the sim via `PlayerView` — UI never computes formulas
- Advanced stats pop-out is a D2R addition; mirrored here for player convenience

## Skill tree (right half — key `T`)

```
┌───────────── SKILL TREE ──────────────┐
│                               ┌─────┐ │
│   TAB 1 | TAB 2 | TAB 3      │ TAB │ │   3 themed tabs per class,
│                               ├─────┤ │   stacked on right edge
│ row 1:  (A)───(B)            │  T  │ │
│           │    │              │  A  │ │   Grid: 3 columns × 6 rows
│ row 6:  (C) (D) (E)          │  B  │ │   at level gates 1/6/12/18/
│           │   │   ╲          │  2  │ │   24/30. Arrows = prereqs.
│ row 12: (F)─(G)  (H)         │     │ │
│           │                  ├─────┤ │   Node states: dark=locked,
│ row 18: (I)─(J)─(K)         │ TAB │ │   lit=available, number
│                     │        │  3  │ │   badge=points invested (n/20)
│ row 24:           (L)        └─────┘ │
│                     │                │   Hover tooltip = current +
│ row 30:           (M)                │   next-level stats + synergies
│                                      │
│        POINTS REMAINING: n           │
└──────────────────────────────────────┘
```

- Click lit node → spend 1 point (requires available points)
- Right-click or ctrl-click = no-op (reserved for respec token use later)
- Skill tree data is rendered from the `skills` content table — same source used by the sim

## Quest log (left half — key `Q`)

Act tabs across top (I–V). Per act: 6 quest icon slots (2×3 grid, 3 for act 4). Icons: dim=not started, lit=active, check=complete. Click quest → description text + progress shown below.

**Reward types tracked per quest:** skill point, stat points, resist boost, socket add, imbue, hireling unlock, respec charge, token. All rewards display on quest-complete notification.

## Waypoints (left half — activated by clicking in-world waypoint)

Act tabs. Per act: list of waypoints (~9). Lit = discovered, dim = undiscovered. Click lit waypoint → instant teleport, panel closes. Same per-difficulty tracking.

## Stash (left half — auto-opens inventory right)

```
┌───────────────── STASH ─────────────────┐
│ Gold: NNNNN  [Deposit] [Withdraw]        │
│ Tabs: [PERSONAL] [SHARED 1] [2] [3]      │
│ ┌────────────────────────────────────────┐│
│ │ 10 × 10 grid (100 cells)              ││
│ │ Same item-footprint rules as inventory ││
│ └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

1 personal + 3 shared tabs. Same drag/drop + ctrl-click mechanics as inventory. Shared tabs = per-account.

## Transmutation cube (left half — inventory auto-opens)

3×4 grid (12 cells). [TRANSMUTE] button validates contents against recipe table and replaces with output. Cube item itself occupies 2×2 in inventory/stash; right-click cube opens UI.

## Vendor/Trade/Gamble

**Vendor:** split view — vendor stock (left, with armor/weapons/misc tabs, page arrows) + player inventory (right). Right-click vendor item = buy. Ctrl-click own item = quick-sell. Repair/repair-all buttons.

**Gamble:** same split layout. Base item list at premium prices with unknown quality. Refresh button to reroll stock without closing. Item quality determined by clvl at buy-roll time.

**Trade (Phase 6):** centered two-column secure window. Each side shows offer grid + gold entry. Both must confirm; any change resets both confirmations. Server-validated atomic commit.

## Hireling (left half — key `O` or right-click merc portrait)

Stats block + 4 equipment slots (helm, body, weapon, shield for some types). Life/defense/damage/resist rows. Same sim-sourced values as player sheet.

## Party (left half — key `P`)

One row per player (max 8): name/class/level. Buttons: invite/accept, declare hostile, loot permission. Color code: white = neutral, green = partied, red = hostile.

## Item display

| Color | Quality |
|---|---|
| White | Normal |
| Gray | Socketed or ethereal |
| Blue | Magic |
| Yellow | Rare |
| Green | Set |
| Gold/Tan | Unique |
| Orange | Crafted / runes |

**Tooltip structure** (top→bottom):
1. Rarity-colored name (fancy name + base type line for rare/unique/set/crafted)
2. Core stat line (damage/defense/block)
3. Durability/quantity
4. Class restriction
5. Requirements (level, str, dex — unmet = red text)
6. Magic mods (blue text, one per line)
7. Set bonus block (green, dimmed if inactive)
8. Ethereal/socket count tags at bottom

**Ground labels:** Dark translucent box, rarity-colored text, floating at world position. Alt key = show/hold/toggle (per option). Click label = pick up (no pixel-hunting ground sprite).

## Two-panel state machine

```
idle → open inventory (I)  → (right=inventory, left=none)
     → open char (A/C)     → (left=char, right=inventory or stays)
     → open skills (T)     → (right=skills, left=stays)
     → open quest (Q)      → (left=quest, right=stays)
     → open stash          → (left=stash, right=inventory auto)
     → open cube           → (left=cube, right=inventory auto)
     → talk to vendor      → (left=vendor, right=inventory auto)
     → Esc                 → close current side; close all if both sides open
     → Esc (nothing open)  → game menu
```
