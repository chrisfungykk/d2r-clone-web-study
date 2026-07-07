# Data Model — Content as Data

> Every piece of game content is a row in a typed table under `src/sim/data/`.
> Systems interpret tables; they never special-case content ids.
> This mirrors D2's own architecture (its mechanics were driven by spreadsheet-like
> data tables), which is exactly what makes a mechanics-exact clone tractable.

## Ground rules

1. **Typed TS modules, not JSON files.** Tables are `const … satisfies readonly Row[]`
   TypeScript so ids are literal-typed, cross-references are compile-checked, and dead rows
   are unreachable-code errors. (A build step can emit JSON later if modding support wants it.)
2. **Ids are stable snake_case strings** (`"war_axe"`, `"zone_a1_03"`). Renaming an id is a
   save-migration event (see `save-persistence.md`).
3. **No behavior in tables.** Rows are data + references to *mechanic keys* (enums the
   systems implement). A new skill that needs a genuinely new behavior adds one mechanic key
   + system code + N data rows.
4. **All content is original.** Table *schemas* replicate D2's structures; table *rows*
   (names, flavor, numbers within budgeted ranges) are our original content, authored per
   `doc/04-content-bible/`.

## Table inventory

| Table | Schema mirrors | Contents |
|---|---|---|
| `itemBases` | weapons/armor/misc data | base items: slot, grid size, damage/def ranges, req, tier (normal/exceptional/elite chain), weapon speed modifier, sockets max, class restriction |
| `affixes` | prefix/suffix tables | name key, group (mutual exclusion), alvl, frequency weight, allowed item types, stat ranges, rare/craft/magic-only flags |
| `uniques`, `sets` | unique/set item tables | fixed-stat originals authored to D2-equivalent stat budgets; set bonus tiers |
| `gems`, `runes` | socketables | tier ladder, per-slot-context effects (weapon/shield/body), upgrade recipes |
| `words` | runewords | socket count, allowed base types, rune sequence, granted stats |
| `recipes` | cube recipes | input matchers → output constructor (reroll/upgrade/craft/socket/token) |
| `treasureClasses` | TC tables | picks, nodrop weight, entries (item class / go-to-TC / gold), per-difficulty upgrade chain |
| `monsters` | monstats | family, size, base stats per difficulty, resist profile, AI archetype key, skills, treasure class refs, drain/block flags |
| `monsterMods` | champion/unique modifiers | stat multipliers, granted mechanics keys, minion pack spec |
| `superUniques` | fixed spawns | monster ref, fixed mods, zone anchor, TC override |
| `skills` | skills table | class, tree, tier (1/6/12/18/24/30), prereq edges, mechanic key, per-level scaling curves, synergy list (donor skill → % per hard point), mana curve, weapon requirements |
| `zones` | levels table | act, alvl per difficulty, terrain generator key + params, connectivity edges, waypoint flag, spawnable monster set, density, superunique anchors |
| `acts` | — | zone graph, town id, quest list, boss gate |
| `quests` | quest structure | type key (kill/fetch/rescue/unlock), stage machine, reward key (skillPoint/statPoints/resistBoost/socket/imbue/hire), giver NPC role |
| `npcs` | vendors/hirelings | role (vendor/gamble/heal/hire/stash/quest), store inventory generator params |
| `experience` | experience table | clvl 1–99 XP curve, level-diff multipliers, high-level penalty bands |
| `difficulty` | difficulty params | res penalty (0/−40/−100), XP death-loss %, leech penalty, TC upgrade thresholds, immunity budget |
| `charStart` | per-class start | starting stats/skills/items, per-point coefficients (life/vit, mana/ene, AR/dex…) |
| `speeds` | animation data | per archetype × weapon class: base anim frames (attack/cast/hit/block), breakpoint inputs |

Row schemas are specified in detail in the matching `02-game-design/*.md` doc; this file owns
only the conventions.

## Example schemas (canonical style)

```ts
// src/sim/data/affixes.ts
export interface AffixRow {
  id: AffixId;
  kind: "prefix" | "suffix";
  group: number;              // items can't roll two affixes with the same group
  alvl: number;               // min affix level to be rollable
  maxAlvl?: number;           // some low-tier affixes stop appearing on high alvl (rare pools)
  weight: number;             // frequency weighting within eligible pool
  itemTypes: readonly ItemTypeId[];
  stats: readonly StatRoll[]; // e.g. { stat: "edmgPct", min: 201, max: 300 }
  scope: "magic" | "rareAlso" | "craftOnly";
}

// src/sim/data/treasureClasses.ts
export interface TcRow {
  id: TcId;
  picks: number;              // negative = drop-all (boss multi-drop semantics)
  noDrop: number;             // base nodrop weight (player-count formula applies at runtime)
  entries: readonly { ref: TcId | ItemClassId | "gold"; weight: number }[];
  upgrades?: { nightmare: TcId; hell: TcId };   // difficulty TC promotion
}

// src/sim/data/skills.ts
export interface SkillRow {
  id: SkillId;
  class: ClassId;
  tree: 0 | 1 | 2;
  tier: 1 | 6 | 12 | 18 | 24 | 30;
  prereqs: readonly SkillId[];
  mechanic: MechanicKey;      // "projectile" | "nova" | "aura" | "curse" | "summon" | …
  params: MechanicParams;     // per-mechanic shape, discriminated by `mechanic`
  scaling: readonly ScalingBand[]; // per-level increments incl. lvl 8/16/22/28 bonus bands
  synergies: readonly { donor: SkillId; stat: StatId; perHardPoint: number }[];
  mana: { base: number; perLevel: number };
}
```

## Validation

- `tests/data/*.test.ts` validates every table at CI time: dangling references, duplicate
  ids, affix groups colliding, TC graphs acyclic, skill prereq graph acyclic and tier-monotonic,
  every zone reachable from its act's town, every quest reward key implemented.
- A `scripts/data-stats.ts` report prints table sizes and budget outliers (e.g. a unique
  whose stat budget exceeds its tier envelope) for balance review.

## Content authoring flow

1. `doc/04-content-bible/*` names and describes the original content (designer-facing).
2. Rows get authored in `src/sim/data/*` against these schemas (engineer-facing).
3. Golden data tests + drop simulator (`doc/interactive/drop-simulator.html` logic, reused as
   a headless test) verify distributions against `02-game-design/loot-and-drops.md` targets.
