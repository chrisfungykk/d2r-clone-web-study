# HUD

> The player's constant companion. Bottom-anchored control bar following D2R's layout:
> health globe (left), mana globe (right), skill buttons + belt (center), utility elements
> nestled around them. Readable at 1080p–4k, adapts to 16:9–19:9 (ultrawide capped).

## Layout (1080p reference)

```
              [merc portrait + HP bar]     top-left corner
              [buff/debuff icons]          (designer decision — add, D2R lacked)
                                                                 (OPT) CLOCK ─┐
┌──────────────────────────── GAMEPLAY VIEW ───────────────────────────────────┐
│           MONSTER HP BAR (top-center, ~30% screen width, hover/target)       │
│                                                                              │
│                                       ┌──────────────┐                      │
│                                       │ MINIMAP       │ (corner V toggle)   │
│                                       └──────────────┘                      │
│  [unspent stat card]    [unspent skill card]                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  ◀ toggle → [chr][inv][skl][pty][map][msg][cht][menu]                       │
│      ┌───┐             ┌──────┐ ╔═══╦═══╦═══╦═══╗ ┌──────┐            ┌───┐│
│     ╱ HP  ╲   [RUN◉]   │ LMB  │ ║ b1 ║ b2 ║ b3 ║ b4 ║ │ RMB  │  (gold) ╱MANA╲│
│    │GLOBE │   stm ▬▬   │ SKL  │ ╚═══╩═══╩═══╩═══╝ │ SKL  │        │GLOBE ││
│     ╲    ╱             └──────┘                   └──────┘         ╲    ╱│
│      └──┘ ← carved-stone bar spans full width →                      └──┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key dimensions** (relative to viewport at 1920×1080):
- Globe diameter: ~16% of viewport height
- Bottom bar height: ~10-12% of viewport height
- Center cluster (LMB + belt + RMB): ~30-35% of viewport width, centered
- Left/right globe panels each ~9-10% of viewport width
- Belt: 4 visible cells, each ~40×40 px

## Element inventory

| Element | Position | Behavior |
|---|---|---|
| Health globe | Far bottom-left | Red liquid level = current/max HP. Click bottom of globe toggles persistent numeric HP text overlay above it. |
| Mana globe | Far bottom-right | Blue liquid, same numeric-toggle. |
| LMB skill button | Left of belt | Shows icon of bound skill. Left-click opens skill-select flyout. Assignment per weapon-set (swap W changes). |
| RMB skill button | Right of belt | Same flyout. `S` also opens RMB skill selector. |
| Belt | Center, between skill buttons | 4 columns × 1 visible row. Hover displays remaining rows upward. Total rows = belt tier: 1/2/3/4 (4/8/12/16 potions). Keys 1-4 consume from each column; gravity-fill from above. |
| Active skill bar | Optional row above HUD | Up to 16 bound skill icons with hotkey labels. D2R 2.3+ feature; enable in settings. |
| Run/walk toggle | Small button near stamina bar | `R` toggles. Icon state shows mode. |
| Mini-panel toggle | Small arrow above center bar | Expands row of 8 small buttons: character, inventory, skill tree, party, automap, message log, chat, game menu. |
| Stamina bar | Thin horizontal strip above belt cluster | Depletes while running; run disabled at 0. |
| Merc portrait | Top-left corner of viewport | Small portrait + HP bar. `Z` toggles visibility. Right-click opens hireling panel. Shift-RMB potion onto it to feed merc. |
| New Stats / New Skill | Pop-up buttons above bar edges | Appear when unspent stat/skill points exist. Click opens character sheet / skill tree. |
| Clock | Top-right corner (optional) | 12-hour format, toggle in settings. |
| FPS/ping | Top-left near merc (chat cmd) | `/fps` overlay. |

**Deliberate omissions** (matching D2R): no XP bar on HUD (XP is numeric-only in character sheet), no gold display on HUD (shown in inventory panel), no auto-sort, no inventory weight.

## Aspect ratio adapt

- Three anchored groups: left globe panel, center cluster, right globe panel
- Decorative carved-stone bar stretches between them
- World camera viewport clamped to 19:9 gameplay area regardless of viewport aspect ratio
- Panels overlay the gameplay strip, not the HUD bar

## Feedback systems

| Signal | Implementation |
|---|---|
| Hit recovery | Entity flinch animation (sim-owned frame count) |
| Monster HP bar | Top-center, on hover/target, name label + HP bar. Champion/unique get colored names + modifier labels |
| Level-up | Audio sting + New Stats/New Skill popup buttons |
| Low health | Globe liquid level visual + pain grunt audio. Optional vignette pulse as accessibility addition |
| Mana failure | Class voice bark audio. Skill icons remain lit |
| Loot drop | Rarity-colored label on Alt-show; no beams/pillars (that's D3/D4). Audio chime per rarity |
| Death | Screen message, corpse at death location with gear, Esc → respawn in town without gear |

## Undertones

- Bottom bar: dark stone texture with chiseled edge, low saturation, warm-tinted
- Globes: glass sphere with meniscus, slow slosh animation on value change, specular highlight
- Buttons: cast-metal appearance with subtle ember glow on hover
- All hover states, tooltips, and panels optimize for *readability* over *flash*
