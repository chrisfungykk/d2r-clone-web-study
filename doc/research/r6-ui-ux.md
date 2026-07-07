# R6 — D2R UI/UX Structure Reference

Engineering/design reference documenting the LAYOUT ANATOMY and INTERACTION MODEL of Diablo II: Resurrected (D2R), for rebuilding a mechanically-equivalent web ARPG UI with fully original art.

**IP policy applied:** This file documents facts — layout anatomy, dimensions/proportions, interaction flows, color-coding conventions. No art assets are referenced for copying, no game text strings are reproduced verbatim. Visual style is described only in adjectives. All names ("health globe", "Horadric Cube") are used descriptively; our implementation uses original names/art.

All pixel/percent figures are **approximations from screenshot analysis and community documentation** unless marked verified. Baseline reference frame: 1920x1080 (16:9), D2R "modern" graphics mode.

---

## 1. HUD anatomy (bottom-anchored control bar)

D2R keeps the classic single bottom control bar but stretches it across the full width of a 16:9 frame (the original game was a fixed 800x600 4:3 bar). Blizzard's stated approach: keep globes, skill icons, potion belt; reorganize menu buttons + stamina bar "closer together" for a cleaner build.

### 1.1 ASCII wireframe (1080p, modern mode)

```
                                                        (optional) CLOCK  hh:mm ─┐
 [merc portrait]                                                                 │
 [player buffs: NONE in vanilla — no buff/debuff icon row exists]                │
                                                                                 ▼
┌─────────────────────────── GAMEPLAY VIEW ──────────────────────────────────────┐
│                    MONSTER NAME + HP BAR (top-center, on hover/target)         │
│                    ┌───────────────────────────┐                               │
│                    │███████████░░░░░░░░░░░░░░░░│  ~25-30% screen width         │
│                    └───────────────────────────┘                               │
│                                                    ┌───────────────┐           │
│                                                    │  MINI-MAP     │ (option:  │
│                                                    │  (corner box) │  L or R)  │
│                                                    └───────────────┘           │
│  [NEW STATS]                                              [NEW SKILL]          │
│  (pop-up buttons above bar edges when points unspent)                          │
│  ┌──(optional) ACTIVE SKILL BINDINGS BAR: up to 16 small skill icons ──┐       │
│  │ [s1][s2][s3][s4][s5][s6][s7][s8] ...                                │       │
│  └──────────────────────────────────────────────────────────────────-─┘       │
├────────────────────────────────────────────────────────────────────────────────┤
│           ▲mini-panel toggle → [chr][inv][skl][pty][map][msg][cht][menu]       │
│   ╭────╮            ┌────┐ ╔═══╦═══╦═══╦═══╗ ┌────┐               ╭────╮       │
│  ╱ HP   ╲   (run/   │ L  │ ║b1 ║b2 ║b3 ║b4 ║ │ R  │              ╱ MANA ╲      │
│ │ GLOBE  │   walk)  │SKL │ ╚═══╩═══╩═══╩═══╝ │SKL │             │ GLOBE  │     │
│ │ (red)  │   [◉]    │BTN │  ▬▬▬stamina bar▬  │BTN │             │ (blue) │     │
│  ╲      ╱           └────┘  (thin strip)     └────┘              ╲      ╱      │
│   ╰────╯ ←── decorative carved-stone bar spans full width ──→     ╰────╯       │
└────────────────────────────────────────────────────────────────────────────────┘
  ~9-10% W                 center cluster ~30-35% W, centered              ~9-10% W
  globe ⌀ ≈ 16-18% of screen height; bar strip height ≈ 10-12% of screen height
```

### 1.2 Element inventory

| Element | Position | Behavior / notes |
|---|---|---|
| Health globe | Far bottom-left | Red liquid level = current/max HP. Clicking the bottom of the globe toggles a persistent numeric text overlay above it (verified, Arreat Summit). |
| Mana globe | Far bottom-right | Blue liquid, same numeric-toggle behavior. |
| Left-click skill button | Left of belt, center cluster | Shows icon of skill bound to LMB. Left-click opens a **flyout panel of all eligible skills** to reassign. Some skills can't be placed on left button; any non-passive skill can go on right. Assignments are **per weapon-set** (swap W changes both buttons). |
| Right-click skill button | Right of belt | Same flyout; `S` key also opens the RMB skill selector. |
| Belt (potion row) | Center, between skill buttons | 4 columns x 1 visible row. Hover/expand pops remaining rows **upward** as an overlay. Total rows = belt tier: none=1 row (4), light belts=2 (8), mid=3 (12), heavy=4 (16); all exceptional/elite-tier belts = 16. Keys 1-4 consume the bottom potion of that column; potions gravity-fall down their column. |
| Stamina bar | Thin horizontal strip above/near belt | Depletes while running; run disabled at 0. D2R moved it adjacent to belt/menu cluster. |
| Run/walk toggle | Small round button near stamina bar | Click or `R` toggles; icon state shows mode. |
| Mini-panel | Small arrow toggle above center; expands a row of ~8 tiny buttons | Buttons: character, inventory, skill tree, party, automap, message log, chat, game menu — mouse access to every panel that also has a hotkey (verified, original manual/Arreat Summit; D2R integrates the row into the bar area). |
| XP bar | **None.** | D2/D2R has no on-HUD XP bar. Experience is numeric-only in the character sheet. (Mods add one; vanilla does not.) |
| Gold display | **Not on HUD.** | Carried gold shows at the bottom of the inventory panel; stash gold in the stash panel. No inventory weight system exists. |
| New Stats / New Skill buttons | Pop above bar (left/right of center) when unspent points exist | Click opens character sheet / skill tree respectively. Appear on level-up. |
| Active Skill Bindings bar (D2R) | Optional extra row **above** the standard HUD | Shows up to 16 bound skills with hotkey labels. Enabled via Options > Gameplay ("display active skill bindings"). Pairs with Quick Cast (§4). Added patch 2.3. |
| Weapon-swap indicator | No dedicated HUD widget | Active weapon set is shown as I/II tabs on the inventory doll; the HUD reflects a swap because LMB/RMB skill icons change (bindings are per-set). |
| Buff/debuff icon row | **Does not exist in vanilla D2R** | Heavily community-requested; only mods provide it. Auras/warcries show as glows on the character model only. |
| Clock | Small text, screen corner (top area) | Optional checkbox in UI settings; 12-hour format only. |
| FPS/ping | Text block, left side | Not a menu toggle: chat command `/fps` prints FPS + ping overlay (overlaps the merc/portrait area). |
| Merc portrait | Top-left corner | Small portrait + thin HP bar; `Z` toggles visibility; right-click opens hireling panel; drag/shift-right-click a potion onto it to feed the merc. |

### 1.3 Aspect-ratio behavior (verified)

- Native support: 16:9. Ultrawide is **hard-capped at 19:9**: on 21:9+ displays the image extends only to 19:9 and the sides get a vignette/black bars. Reason: at 21:9 players could aggro/attack beyond the AI's sensing range (alpha exploit), so visibility is clamped "to protect the integrity" of play.
- HUD at 16:9/19:9: globes anchor to the bottom corners of the rendered frame; center cluster stays screen-centered; the decorative bar spans between them (it elongates on wider frames).
- Legacy graphics mode (`G` toggle): renders the original 4:3 800x600-proportioned interface art, pillarboxed/stretched per legacy video options.
- **Design takeaway for our clone:** treat the HUD as three anchored groups (left globe, centered cluster, right globe) joined by a stretchable decorative strip; clamp the world camera's visible gameplay range to a 19:9-equivalent zone regardless of viewport.

**Sources:** [Arreat Summit controls](https://classic.battle.net/diablo2exp/basics/controls.shtml), [diablo2.io UI-changes thread](https://diablo2.io/forums/how-has-the-user-interface-in-diablo-2-resurrected-changed-t8799.html), [Diablo II manual](https://diablo2.diablowiki.net/Diablo_II_Manual), [Wowhead quick cast explainer](https://www.wowhead.com/diablo-2/news/diablo-ii-resurrected-quick-cast-and-active-skill-bindings-explained-325166), [GameSpot ultrawide](https://www.gamespot.com/articles/diablo-2-resurrected-wont-include-true-ultrawide-support-because-it-breaks-the-game/1100-6495990/), [Blizzard forums clock thread](https://us.forums.blizzard.com/en/d2r/t/show-clock-options/70774), [Blizzard forums buff-icon requests](https://us.forums.blizzard.com/en/d2r/t/mini-icon-for-buffs-and-debuffs/1844).

---

## 2. Panels

### 2.0 The two-panel convention (core architecture)

- Every panel docks to either the **left half** or **right half** of the screen; the world stays visible (and live — the game does NOT pause) in the remaining strip.
- Right-side panels: **inventory**, **skill tree**. Left-side panels: **character sheet, quest log, waypoints, party, hireling, stash, cube, vendor/trade/gamble** (all "container/context" UIs).
- Opening a left-half container (stash/cube/vendor/trade) **auto-opens the inventory on the right** so the player can move items between them.
- One left + one right panel may be open simultaneously; opening a second panel on the same side replaces the first. `Esc` or the panel's close button dismisses.
- Each panel occupies roughly 40-45% of screen width and ~85-90% of height at 16:9, top-aligned above the HUD bar.
- **Design takeaway:** implement as two mutually-exclusive slot stacks (`leftPanel`, `rightPanel`) plus pairing rules (container → forces inventory).

```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────┐   live gameplay   ┌──────────────────┐│
│ │   LEFT PANEL      │   (~15-20% strip, │   RIGHT PANEL    ││
│ │  (stash/vendor/   │    world still    │  (inventory or   ││
│ │   char/quest/...) │    interactive)   │   skill tree)    ││
│ └───────────────────┘                   └──────────────────┘│
│ [═══════════════════════ HUD BAR ══════════════════════════]│
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Inventory (right half) — key `I`

```
┌──────────── INVENTORY ────────────┐
│  weapon-set tabs:  [ I ][ II ]    │
│ ┌────┐   ┌─────┐  ┌────┐  ┌────┐  │   slot grid-cell sizes:
│ │WPN │   │HELM │  │AMU │  │WPN2│  │   helm 2x2   amulet 1x1
│ │ L  │   │ 2x2 │  │1x1 │  │/SHD│  │   body 2x3   rings 1x1
│ │2x4 │   ├─────┤  └────┘  │2x4 │  │   weapon/shield 2x4 (max)
│ │    │   │BODY │          │    │  │   gloves 2x2 boots 2x2
│ └────┘   │ 2x3 │  ┌────┐  └────┘  │   belt 2x1
│ ┌────┐   │     │  │RING│  ┌────┐  │
│ │GLVS│   └─────┘  └────┘  │BOOT│  │   Doll = paper-doll figure
│ │2x2 │   ┌─────┐  ┌────┐  │2x2 │  │   with slots arranged
│ └────┘   │BELT │  │RING│  └────┘  │   anatomically around it.
│          │ 2x1 │  └────┘          │
│          └─────┘                  │
│ ┌───────────────────────────────┐ │
│ │  BACKPACK GRID  10 wide x 4   │ │  ← 40 cells; items occupy
│ │  ██ ░░ ░░ ██ ██ ░░ ░░ ░░ ░ ░  │ │    WxH footprints (1x1 up
│ │  ██ ░░ ░░ ██ ██ ░░ ░░ ░░ ░ ░  │ │    to 2x4). Charms have NO
│ │  ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░ ░  │ │    separate area — they sit
│ │  ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░ ░  │ │    in this grid and are
│ └───────────────────────────────┘ │    active from it (1x1/1x2/1x3).
│        [gold icon]  gold: NNNN    │  ← click opens drop-gold dialog
└───────────────────────────────────┘
```

- Weapon-set tabs I/II (expansion feature): clicking the inactive tab = same as `W` swap. Inactive set's item properties do NOT apply.
- Item pickup/place: click item → it sticks to cursor (rendered at grid scale) → click a valid region to place; invalid regions tint the footprint red, valid tint green (D2R highlights placement cells).
- Ctrl-click = quick-move (to open container / to belt if potion / sell if vendor open). Shift-click potion = move to belt.
- There is **no auto-sort** in vanilla.

### 2.2 Character sheet (left half) — keys `A` or `C`

```
┌────────── CHARACTER ──────────┐
│  NAME            CLASS        │
│  LEVEL nn   EXPERIENCE nnnnn  │
│             NEXT LEVEL nnnnn  │
│  Strength   nn [+]  ← + btn   │   [+] buttons appear only when
│  Dexterity  nn [+]    appears │   unspent stat points exist;
│  Vitality   nn [+]    with    │   each click = 1 point.
│  Energy     nn [+]    points  │   remaining-points counter shown.
│  ────────────────────────     │
│  Life nn/nn   Mana nn/nn      │
│  Stamina nn/nn                │
│  Attack Rating nnn  Defense n │
│  Damage nn-nn                 │
│  ────────────────────────     │
│  Fire Res    nn%              │   resistance block at bottom,
│  Cold Res    nn%              │   one row per element
│  Lightning   nn%              │   (fire/cold/lightning/poison)
│  Poison Res  nn%              │
│  [ADVANCED STATS ⤢] (D2R)     │  ← pop-out: aggregated totals
└───────────────────────────────┘     (magic find, gold find, FCR,
                                       FHR, IAS, FRW, crushing blow,
                                       life leech, etc.) so players
                                       don't sum item mods manually.
```

The advanced-stats pop-out is a D2R addition (confirmed by the lead designer; equivalent to the PlugY mod's stat page).

### 2.3 Skill tree (right half) — key `T`

```
┌───────────── SKILL TREE ──────────────┐
│                             ┌───────┐ │
│   TAB PAGE (one of 3)       │ TAB 1 │ │  3 named tabs per class,
│                             ├───────┤ │  stacked on the panel's
│  row lvl 1:  (A)   (B)      │ TAB 2 │ │  right edge; click to
│               │  ╲          ├───────┤ │  switch page.
│  row lvl 6:  (C)  (D)  (E)  │ TAB 3 │ │
│               │    │  ╱     └───────┘ │  Grid: up to 3 columns x
│  row lvl 12: (F)  (G)               │ │  6 rows; rows = level
│               │    │                  │  gates 1/6/12/18/24/30.
│  row lvl 18: (H)  (I)  (J)           │
│  row lvl 24:      (K)                 │  Arrows drawn between
│  row lvl 30: (L)  (M)                 │  nodes = prerequisite
│                                       │  dependencies.
│  node states: dark=locked,            │
│  lit=available, number badge=points   │  Hover tooltip: current-
│  invested (n/20)                      │  level stats + next-level
│                                       │  stats + synergies.
│        SKILL POINTS REMAINING: n      │
└───────────────────────────────────────┘
```

Click a lit node to spend 1 point (with points available). No respec from this panel (respec is an NPC/quest-reward flow).

### 2.4 Quest log (left half) — key `Q`

```
┌──────────── QUESTS ────────────┐
│ [ACT I][ACT II][III][IV][V]    │ ← act tabs across top
│  ┌───┐ ┌───┐ ┌───┐             │
│  │Q1 │ │Q2 │ │Q3 │   6 quest   │  icon states: dim = not
│  └───┘ └───┘ └───┘   icon      │  started, lit = active,
│  ┌───┐ ┌───┐ ┌───┐   slots     │  marked = complete
│  │Q4 │ │Q5 │ │Q6 │   (2x3)     │
│  └───┘ └───┘ └───┘             │
│ ┌────────────────────────────┐ │
│ │ selected quest title +     │ │
│ │ description / progress txt │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### 2.5 Waypoint list (left half) — opened by clicking a waypoint object in-world

```
┌────────── WAYPOINTS ───────────┐
│ [ACT I][ACT II][III][IV][V]    │ ← act tabs (acts you've reached)
│   ◆ waypoint 1   (lit)         │
│   ◆ waypoint 2   (lit)         │   up to 9 waypoints per act,
│   ◇ waypoint 3   (dim/unknown) │   listed vertically; lit =
│   ◇ ...                        │   discovered; click = instant
│                                │   teleport, panel closes.
└────────────────────────────────┘
```

### 2.6 Stash (left half; auto-opens inventory right) — town chest object

```
┌───────────── STASH ─────────────┐
│  gold: NNNN  [deposit][withdraw]│ ← stash gold header
│  tabs: [PERSONAL][SH1][SH2][SH3]│ ← 1 personal + 3 shared (launch)
│ ┌─────────────────────────────┐ │
│ │  GRID 10 wide x 10 tall     │ │   100 cells per tab; same
│ │  (100 cells)                │ │   item-footprint rules as
│ │                             │ │   inventory.
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- Verified sizes: every D2R tab is 10x10 (original D2 stash was 6x8). Launched with 1 personal + 3 shared tabs (alpha had 1 shared; raised to 3 from feedback).
- 2026 "Reign of the Warlock" expansion raised shared tabs 3 → 5 and added specialized rune/gem/material tabs (expansion-gated).
- Shared tabs are per-account, segregated by mode: ladder vs non-ladder, softcore vs hardcore, online vs offline do not mix. Season end converts ladder shared tabs to withdraw-only.
- Ctrl-click quick-moves items between stash and inventory.

### 2.7 Transmutation cube UI (left half; inventory auto-opens right)

```
┌───────── CUBE ─────────┐
│ ┌────────────────────┐ │   Interior grid: 3 wide x 4 tall
│ │  GRID 3w x 4t      │ │   (12 cells). The cube item itself
│ │  (12 cells)        │ │   occupies 2x2 in inventory/stash
│ └────────────────────┘ │   and opens via right-click.
│     [ TRANSMUTE ]      │ ← single action button; validates
└────────────────────────┘   contents against recipe table,
                             replaces contents with output.
```

### 2.8 Vendor / trade split view (vendor panel left + player inventory right)

```
┌──────── VENDOR STOCK ─────────┐    ┌──── PLAYER INVENTORY ────┐
│ tabs: [ARMOR][WEAPONS][MISC]  │    │ (standard inventory panel│
│  page arrows ◄ ►              │    │  §2.1, right half)       │
│ ┌───────────────────────────┐ │    └──────────────────────────┘
│ │  vendor item grid         │ │
│ │  (same cell system;       │ │  Interactions:
│ │   hover = price tooltip)  │ │  - right-click vendor item = buy
│ └───────────────────────────┘ │  - shift+right-click scroll/key =
│ [repair][repair all]  gold: N │    buy enough to fill tome/stack
└───────────────────────────────┘  - ctrl-click own item = quick sell
                                   - drag own item onto vendor grid = sell
                                   - repair-all repairs equipped items only
```

**Gamble screen** = same split layout at a gambling NPC, with differences: stock is a list of base items with **unknown (unidentified) quality** at premium prices; D2R added a **refresh button** to reroll the stock without closing (verified QoL addition; original required close/reopen).

**Player-to-player trade**: centered two-column secure window; each side has an item grid + gold entry field + accept check button; any change to contents resets both accepts (anti-scam pattern).

### 2.9 Hireling (mercenary) panel (left half) — key `O` or right-click merc portrait

```
┌──────── HIRELING ────────┐
│  portrait  NAME  type    │
│  LEVEL nn  EXP nnnn      │
│  ┌────┐ ┌────┐           │   4 equipment slots only:
│  │HELM│ │BODY│           │   helm, body armor, weapon,
│  └────┘ └────┘           │   (shield for some types).
│  ┌────┐ ┌────┐           │
│  │WPN │ │SHLD│           │   Stats block: life, defense,
│  └────┘ └────┘           │   damage, resistances, skills.
│  life / defense / dmg /  │
│  resist rows             │
└──────────────────────────┘
```

### 2.10 Party panel (left half) — key `P`

- One row per player in the game (max 8): name, class, level; buttons per row to invite/accept party, declare hostile, and toggle loot permission (corpse looting); mute/squelch.
- Relationship color code (also used for overhead name labels): **white = neutral, green = partied, red = hostile** (verified, manual).
- Party members' portraits/list also expose "go to" info; their positions appear on the automap with name labels.

**Sources (panels):** [Diablo II manual](https://diablo2.diablowiki.net/Diablo_II_Manual), [Arreat Summit basics](https://classic.battle.net/diablo2exp/basics/controls.shtml), [diablo2.io shared-stash thread](https://diablo2.io/forums/how-does-the-shared-stash-in-diablo-2-resurrected-work-t8783.html), [PCGamesN stash tabs](https://www.pcgamesn.com/diablo-2-resurrected/shared-stash-tabs), [DiabloBytes RotW stash tabs](https://diablobytes.com/d2-resurrected/news/advanced-stash-tabs/), [diablo2.io all-changes list](https://diablo2.io/forums/27-official-changes-in-diablo-2-resurrected-more-post-launch-t8558.html) (gamble refresh, 10x10 stash, advanced stats), [Fandom stash page](https://diablo.fandom.com/wiki/Stash), [GameFAQs merc inventory answers](https://gamefaqs.gamespot.com/pc/370600-diablo-ii-lord-of-destruction/answers/43356-how-do-i-open-the-mercenary-inventory-plus-barb-question).

---

## 3. Item display conventions

### 3.1 Rarity color code (verified against Arreat Summit + modding docs)

| Text color | Meaning |
|---|---|
| White | Normal (basic) item |
| Gray (darker) | Socketed **or** ethereal base item |
| Blue | Magic (1 prefix + 1 suffix max) |
| Yellow | Rare (up to 6 affixes) |
| Green (bright) | Set item |
| Gold / tan | Unique item |
| Orange | Crafted item; **rune names also render orange** |
| Red | NOT a rarity — used for unmet-requirement lines in tooltips, hostile player names, and warning text |
| Light gray | Tooltip body/description text |
| Purple | Exists in the palette; essentially unused by vanilla items |

D2R expanded the internal string-color palette (many extra shades: multiple reds, greens, grays) but the player-facing rarity semantics above are unchanged. The engine historically uses inline escape codes in strings to switch colors — a useful precedent for a markup-based rich-text tooltip renderer.

### 3.2 Tooltip structure (hover card, order top→bottom)

1. **Item name** — rarity-colored. Rares/uniques/sets/crafted show **two lines**: generated or fixed fancy name (line 1) + base type name (line 2). Magic items show one line (prefix + base + suffix).
2. Core stat line(s): defense (armor) / one-hand & two-hand damage (weapons) / block (shields).
3. Durability current/max; stack quantity where applicable.
4. Class restriction line (class-specific items).
5. Requirements: required level, strength, dexterity — any unmet requirement line renders **red**.
6. Weapon speed / attack rate descriptor line.
7. Magic mods, one per line, **blue** text.
8. Set-bonus block (green; inactive bonuses dimmed) listing other set pieces on set items.
9. Tags at bottom: ethereal marker, socket count marker.

There is **no flavor/lore text** on D2 items (unlike Diablo III/IV) — tooltips are purely mechanical.

- **Compare:** D2R shows a hint line for a hold-to-compare hotkey that displays the equipped item's tooltip alongside; the hint's visibility is a UI option ("show item tooltip hotkeys").
- **Sockets:** socket count appears as a tooltip tag; in the grid icon, sockets render as visible holes/rivets on the item art, filled sockets show the inserted gem/rune drawn into the icon.

### 3.3 Ground item labels

- Dropped items render a small rectangular nameplate (dark translucent box, rarity-colored text) floating at the item's world position. Labels auto-offset to avoid overlap; D2R has a legacy/updated "item drop spacing" gameplay option.
- Show-items key (default `Alt`): **hold** or **toggle** per the "item label display" gameplay option (Hold | Toggle). Clicking a label picks the item up (no pixel-hunting the ground sprite). Known vanilla nit: toggle state doesn't persist across sessions.
- Gold drops label as amount; stacks auto-pick with the D2R auto-gold-pickup option.

### 3.4 Grid footprint

Items occupy a WxH cell footprint in every container (inventory/stash/cube/vendor): 1x1 (rings, gems, runes, potions, small charms) up to 2x4 (largest weapons); 2x3 body armor; 2x2 helms/gloves/boots; 1x2 large charms; 1x3 grand charms; 1x2/1x3 wands/scepters vary. The cursor carries the item at grid scale while relocating; valid/invalid drop cells highlight (green/red tint in D2R).

**Sources:** [Arreat Summit controls (Alt color list)](https://classic.battle.net/diablo2exp/basics/controls.shtml), [Phrozen Keep color codes](https://d2mods.info/forum/viewtopic.php?t=67420), [GameFAQs color meanings](https://gamefaqs.gamespot.com/boards/370600-diablo-ii-lord-of-destruction/43994977), [Blizzard forums item-label threads](https://us.forums.blizzard.com/en/d2r/t/show-items-toggle-state-fails-to-persist-between-games/172474), [vhpg always-show-items](https://www.vhpg.com/d2r-always-show-items/).

---

## 4. Controls

### 4.1 Mouse (PC)

| Input | Function |
|---|---|
| LMB click (ground) | Move to point (click-to-move; hold = continuous move) |
| LMB click (monster) | Attack with LMB-bound skill |
| LMB click (NPC/object/portal/item) | Interact / talk / open / pick up |
| RMB | Cast the RMB-bound skill at cursor |
| Shift + LMB | Force stand-still: attack/cast in place without moving |
| Ctrl + click (item) | Quick-move between open containers / quick-sell at vendor |
| Shift + click (potion) | Send potion to belt |
| Shift + RMB (potion) | Feed potion to hireling |
| Shift + RMB (scroll/key at vendor) | Bulk-buy to fill tome/stack |
| Click skill button on HUD | Open skill-select flyout for that mouse button |

### 4.2 Keyboard defaults (PC)

| Key | Function |
|---|---|
| F1–F8 | Skill hotkeys (bindable up to 16); default behavior = re-assign the active mouse skill, then click to use |
| 1–4 | Use bottom potion in belt column 1–4 |
| W | Weapon-set swap (I ↔ II) |
| Tab | Automap toggle |
| Alt | Show ground item labels (hold or toggle per option) |
| Shift (hold) | Stand still while attacking |
| Ctrl (hold) | Run |
| R | Run/walk toggle |
| A or C | Character sheet |
| I | Inventory |
| T | Skill tree |
| Q | Quest log |
| P | Party screen |
| O | Hireling panel |
| Z | Toggle merc portrait |
| S | Open RMB skill selector |
| V | Move mini-map between corners |
| G | Toggle legacy graphics (instant, even mid-combat) |
| F | Zoom toggle (see §7.4) |
| Enter | Chat entry (also `/commands`: `/fps`, `/players N` offline, `/nopickup`) |
| Esc | Game menu (options / save & exit); also closes open panels |
| Force Move | **Unbound by default** — assignable in Options > Controls |

Custom keybindings historically apply per character (must re-apply for new characters).

### 4.3 D2R Quick Cast + Active Skill Bindings (patch 2.3)

- **Quick Cast Skills** (Options > Gameplay): pressing a skill hotkey **instantly casts** that skill at the cursor instead of merely re-binding the mouse button. Implementation detail worth copying carefully: D2R implements quick cast as a *temporary substitution of the RMB skill for the key-hold duration*, which disrupts persistent RMB states (e.g., a toggled aura) — a known community pain point. A clean implementation should cast without touching the RMB binding.
- **Display Active Skill Bindings**: optional bar above the HUD showing all bound skills (up to 16) with hotkey labels — gives quick-cast users a modern skill-bar visual.
- Both are opt-in; classic bind-then-click remains the default.

### 4.4 Controller scheme (D2R basics)

- Left stick = **direct character movement** (no click-to-move); implicit soft target selection.
- Skill bar swaps to a controller layout: **6 slots** = 4 face buttons + right bumper + right trigger; **hold left trigger** shows a second bank of 6 → 12 usable skills.
- D-pad 4 directions = the 4 belt columns.
- Menu button opens a consolidated full-screen menu system (inventory / skills / quests reorganized for cursorless navigation).
- Show-items maps to a bumper and respects the hold/toggle option; held buttons auto-repeat attacks (accessibility).
- Console monster HP bar and HUD use a different, more modern centered layout than the PC bar.

**Sources:** [Arreat Summit controls](https://classic.battle.net/diablo2exp/basics/controls.shtml), [Game N Guides PC controls](https://www.gamenguides.com/diablo-ii-resurrected-pc-keyboard-controls), [GamerTweak controls](https://gamertweak.com/diablo-2-resurrected-controls/), [Wowhead quick cast](https://www.wowhead.com/diablo-2/news/diablo-ii-resurrected-quick-cast-and-active-skill-bindings-explained-325166), [TheGamer controller article](https://www.thegamer.com/diablo-2-resurrected-is-meant-to-be-played-with-a-controller/), [Blizzard forums quick-cast caveat](https://us.forums.blizzard.com/en/d2r/t/suggestion-quick-cast-and-active-skill-bindings-bar/79583).

---

## 5. Automap

- `Tab` toggles the automap. **Fullscreen mode**: a semi-transparent line-art map drawn as an overlay across the whole gameplay view — walls/paths rendered as thin parchment-toned strokes over the live world; gameplay continues uninterrupted. **Mini-map mode**: same rendering confined to a corner box (top-left or top-right; `V`/option to switch sides).
- D2R Automap options tab (verified): **Automap Size** (Mini Map | Fullscreen), **Mini Map Location** (Right | Left), **Opacity Fade** (No | Custom | Auto), **Custom Opacity** slider, **Center When Cleared**, **Show Names** (game/party info text on map).
- Map data is fog-of-war revealed by exploration, per randomized map seed; persists for the session/game instance.
- Markers rendered on the map layer: player position (center cross/arrow), party members (cross + name label), waypoints (distinct glyph), quest locations/objectives (flagged glyph), town portals, NPCs in town, level exits with destination labels. Monsters are not comprehensively mapped (only nearby blips historically).
- **Design takeaway:** implement as a separate vector/canvas layer with adjustable global alpha, two viewport modes (full overlay / corner clip), and a marker sprite system keyed to entity types.

**Sources:** [Wowhead automap guide](https://www.wowhead.com/diablo-2/guide/auto-map-guide-overlay), [Fandom automap](https://diablo.fandom.com/wiki/Automap), [diablo2.io fullscreen-vs-minimap thread](https://diablo2.io/forums/fullscreen-map-or-minimap-t1070746.html).

---

## 6. Feedback systems

| System | Behavior (design pattern) |
|---|---|
| Hit recovery | Characters/monsters play a flinch/interrupt animation when a hit exceeds a damage threshold ("faster hit recovery" is a stat); communicates stagger with zero UI chrome. |
| Monster HP bar | Appears **top-center of the screen** (not over the monster) while hovering/targeting: monster name label above a horizontal HP bar. Champion/unique monsters get colored name styling + modifier list. |
| XP gain | No floating combat text, no XP bar; only the numeric experience row in the character sheet. Level-up = audio sting + "new stats"/"new skill" buttons popping up above the HUD bar. |
| Level-up effect | Minimal by modern standards: sound + the two pop-up buttons; no screen flash or fanfare (deliberate era-authentic restraint). |
| Low health | Primary signal is the red globe's liquid level; character pain grunts on big hits. **No vignette/pulse overlay in vanilla** (see uncertainties). Clicking globes to pin numeric HP text is the mitigation. |
| Mana failure | Cast attempt without mana fails silently mechanically but plays a class voice bark (an "insufficient mana"–style line) — audio-first feedback. Skill icons don't gray out on the classic PC bar. |
| Skill cooldowns | Most skills have none; a few have a casting delay — vanilla PC UI gives no icon timer (mods add one); controller bar shows unusable states more clearly. Treat cooldown UI as an optional-enhancement layer. |
| Loot drop hierarchy | Audio: distinct drop sounds per item class — heavy metallic clunks (armor/weapons), coin jingle (gold), and a bright glassy "ding" for gems/runes/rings that players are conditioned to react to even off-screen. Visual: rarity-colored nameplate on Alt; no beams/pillars of light in vanilla (that's a D3/D4 idiom). Design pattern: rarity is communicated by label color + audio class, not particle effects. |
| Miss feedback | D2R accessibility added an optional attack-miss indicator (visual cue when an attack whiffs). |
| Death | See §7.3. |

**Sources:** [Diablo II manual](https://diablo2.diablowiki.net/Diablo_II_Manual), [Game Developer accessibility/GDC piece](https://www.gamedeveloper.com/marketing/exploring-modernity-legacy-and-accessibility-in-diablo-ii-resurrected), community documentation cited in §1–4.

---

## 7. Menus and flows

### 7.1 Character select → game entry

```
MAIN MENU (gothic hero scene, vertical button stack)
   └─► CHARACTER SELECT
        - character list w/ 3D model preview, name/class/level
        - filter: Online | Offline (character-bound, immutable)
        - create character: class choice row + name entry
          + hardcore toggle (skull icon) + ladder toggle (seasonal)
        ├─► [PLAY]  (PC): starts a private game
        │      └─ offline/private: DIFFICULTY PROMPT (Normal /
        │         Nightmare / Hell — locked until prior Baal kill)
        └─► [LOBBY] (PC, online only)
               ├─ CREATE GAME tab: name, password, description,
               │    difficulty, level-difference & friends-join params
               ├─ JOIN GAME tab: browsable/searchable game list
               └─ lobby chat channels
Console variant: [PLAY] → "Solo" (invite-only private) or
"Party Finder" (act / difficulty / player-count matchmaking).
```

- Difficulty is fixed per game session — changing it means leaving to the menu and creating a new game.
- 8-player cap per game; `/players N` simulates party size offline (PC).

### 7.2 Options structure (top-level tabs/groups)

- **Video**: modern renderer settings + separate legacy-mode video block (resolution etc.); gamma/contrast calibration.
- **Audio**: granular channel sliders (voices, UI cues, footsteps, monster impacts, weapons, ambient, gore) + subtitle toggles.
- **Gameplay**: quick cast, item label display (hold/toggle), auto gold pickup, item drop spacing (legacy/updated), tooltip hotkey hints, etc.
- **Controls**: full rebinding (per character), controller options.
- **Automap options**: see §5.
- **Accessibility / UI**: see §9; clock checkbox; UI scale; font sizes.

### 7.3 Death flow

- **Softcore:** on death a death message renders over the world; the corpse remains where the player fell **wearing the equipped items**; pressing Esc respawns the character in the act town without equipment; the player must walk back (or re-enter the game) to click their corpse and recover gear; gold penalty applies. Multiple corpses can accumulate; rejoining a game returns the newest corpse to town.
- **Hardcore:** death is permanent — a distinct death notice, and the character becomes unplayable (list-only trophy).
- Design essence: death UX = *message + corpse-run loop*, no respawn timer UI, no durability-only penalty like D3.

### 7.4 Zoom + legacy toggle (verified)

- **Zoom exists in D2R (PC):** tap `F` to toggle between the default camera and a closer fixed zoom level; **hold `F` + mouse wheel** gives gradual zoom between the two bounds (semi-documented). Consoles lack this (players abuse legacy 640x480 resolution for a pseudo-zoom).
- **Legacy toggle (`G`)** flips the entire presentation to the original engine's visuals instantly, any time, including mid-combat — pure render-layer swap, zero simulation change. (Architecture inspiration: keep simulation and presentation strictly decoupled.)

**Sources:** [Game Rant difficulty flow](https://gamerant.com/diablo-2-resurrected-change-difficulty/), [ScreenRant co-op/lobby flow](https://screenrant.com/diablo-2-co-op-online-local-splitscreen-multiplayer/), [Shacknews zoom](https://www.shacknews.com/article/123766/how-to-zoom-diablo-2-resurrected), [GamerTweak zoom](https://gamertweak.com/zoom-in-out-d2r/), [Shacknews/GamerTweak/GameRant legacy toggle](https://gamerant.com/diablo-2-resurrected-legacy-mode-toggle/), [PC Gamer graphics settings](https://www.pcgamer.com/diablo-2-resurrected-graphics-settings/).

---

## 8. Typography & style descriptors (adjectives only — original art required)

- **Headers/panel titles:** weathered gothic serif display lettering; carved or embossed treatment; metallic gold-leaf tone on dark ground.
- **Body/tooltip text:** compact humanist serif/antiqua, parchment-cream on near-black translucent plates; color used semantically (rarity palette) rather than decoratively.
- **Palette family:** deep charcoal and aged-stone grays; desaturated umber and leather browns; blood-crimson (health); arcane cobalt (mana); tarnished-gold accents on frames and buttons; sickly greens reserved for poison states.
- **Chrome/framing:** panels read as aged parchment and tooled leather set into carved stone or wrought-iron frames; corner filigree; heavy bevels; low-saturation, high-texture, grim-medieval mood.
- **Globes:** viscous liquid in a glass sphere — meniscus, inner glow, specular highlight, slow slosh on value change; framed by sculpted stone claws/arches.
- **Buttons:** chiseled stone or cast-metal plates that visibly depress; hover states as subtle ember glows rather than modern flat highlights.
- **Overall register:** grim, weighty, tactile, anti-flat; restraint over spectacle (no floating numbers, minimal particle celebration).

---

## 9. Accessibility options shipped by D2R (structural checklist)

- Colorblind modes with a calibration screen (mode choice + strength slider), offered during first-run setup after contrast/screen calibration.
- Low-vision mode; larger font sizes; tooltip font size; **UI scaling (PC)**.
- Gamma + contrast calibration.
- Subtitles for cinematics; NPC greeting subtitles; chat text-to-speech.
- Granular audio channel mixing (voices, UI cues, footsteps, monster hit impacts, weapons, ambient objects, combat gore) so players can amplify informational audio.
- Auto gold pickup (reduces repetitive clicking).
- Hold-to-toggle conversions for held inputs; controller hold-to-auto-repeat attacks (motor fatigue mitigation).
- Camera shake disable; attack miss indicator.
- Fully rebindable keys (limitation: per-character, in-game only).
- Known gaps flagged by reviewers: TTS limited to chat, console font sizes fixed, few movement alternatives.

**Sources:** [Game Developer (GDC talk coverage)](https://www.gamedeveloper.com/marketing/exploring-modernity-legacy-and-accessibility-in-diablo-ii-resurrected), [GameSpot accessibility article](https://www.gamespot.com/articles/diablo-2-resurrecteds-accessibility-options-include-plenty-of-quality-of-life-changes/1100-6494205/), [Can I Play That? review](https://caniplaythat.com/2021/10/05/diablo-2-resurrected-accessibility-review-pc-can-i-play-that/).

---

## 10. Uncertainties / items needing screenshot-level verification

1. **Exact HUD pixel proportions** (globe diameter, skill-button size, belt cell size, bar height at 1080p) are estimates; verify against captured 16:9 screenshots before finalizing CSS constants. Recommended: Game UI Database entry for Diablo II ([gameuidatabase.com id=804](https://www.gameuidatabase.com/gameData.php?id=804)).
2. **Micro-placement of run/walk button, stamina bar, and mini-panel toggle** within the D2R center cluster — sources confirm they were consolidated near the belt/menu cluster but not exact ordering.
3. **Compare-tooltip modifier key** default (Shift vs Ctrl) — the option "show item tooltip hotkeys" is confirmed, the specific default key is not.
4. **Low-health audio warning:** no source confirms a dedicated vanilla low-HP alarm loop (as opposed to pain grunts); treat a subtle warning cue as an optional accessibility addition rather than a cloned behavior.
5. **Casting-delay (cooldown) visualization** on the D2R PC skill buttons — believed absent (icon unchanged), medium confidence.
6. **Automap marker glyph colors** (party crosses, NPC dots) — shapes/roles confirmed, exact colors not.
7. **Belt tier → row counts for every base** (stated: 4/8/12/16 pattern; all exceptional/elite = 16) — high confidence, but confirm the two 8-slot and two 12-slot normal bases against an item database.
8. **F1–F8 vs 16 bindings interplay** with the Active Skill Bindings bar (which keys display on the bar beyond F8).
9. **Post-2025 "Reign of the Warlock" UI changes** (5 shared tabs + specialized tabs, possible other UI revisions) — decide whether the clone targets launch-era D2R (recommended baseline: 1 personal + 3 shared) or the expansion-era UI.
10. Nexus Mods page 943 (D4-style UI) could not be fetched (HTTP 403); its textual region descriptions were not incorporated.
