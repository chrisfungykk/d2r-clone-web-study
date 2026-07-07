# Saves & Persistence

> Character = durable JSON document. Session (map layouts, monster state) = ephemeral,
> rerolled per game from the world seed — matching the classic "maps reroll each game" model.

## What persists vs what doesn't

| Persists (character doc) | Ephemeral (per session) |
|---|---|
| identity: name, class, hardcore flag, created/played time | zone layouts, spawned monsters, ground items |
| level, experience, stat points spent/banked | shrine states, opened chests |
| skill hard points, respec charges used | town portal state |
| inventory / equipped / belt / cube contents, gold on person | current position (respawn in town of last act) |
| stash contents + stash gold (account-scoped, shared across characters) | party/players-count context |
| quest completion flags + reward-consumed flags, per difficulty | quest in-progress sub-stages that are session-bound |
| waypoints activated, per difficulty | |
| mercenary: variant, level, gear, alive flag | |
| highest difficulty unlocked | |

## Document format

```ts
interface SaveFile {
  v: number;                    // schema version — REQUIRED, monotonic
  kind: "character" | "stash";
  createdAt: string;            // ISO — host writes these, not the sim
  updatedAt: string;
  payload: CharacterDoc | StashDoc;
  check: string;                // FNV-1a of canonical payload — corruption + casual-tamper detection
}

interface CharacterDoc {
  name: string; classId: ClassId; hardcore: boolean; dead?: boolean;
  clvl: number; xp: number; statPointsFree: number; skillPointsFree: number;
  attrs: { str: number; dex: number; vit: number; ene: number };
  skills: Record<SkillId, number>;          // hard points only
  respecsUsed: number;
  gold: number;
  equipped: Partial<Record<EquipSlot, ItemInstance>>;
  inventory: PlacedItem[];                  // grid coords + ItemInstance
  belt: (ItemInstance | null)[];
  cube: PlacedItem[];
  quests: Record<Difficulty, Record<QuestId, QuestSaveState>>;
  waypoints: Record<Difficulty, ZoneId[]>;
  merc?: MercDoc;
  unlockedDifficulty: Difficulty;
}
```

**`ItemInstance` is fully materialized** — base id, quality, rolled affix ids *and rolled
values*, sockets + inserted socketables, ethereal/superior flags, personalization. Items are
never re-rolled from a seed at load: rolled-at-drop, stored-as-rolled is the loot-integrity
model (and the only model that survives data-table rebalances without changing player items).

## Storage tiers

1. **IndexedDB** (primary): `characters` store keyed by id, `stash` singleton, `settings`.
   Every write is a full-document atomic put, debounced to: town entry, zone transition,
   quest/waypoint/level events, inventory close, and a 30 s idle timer. Crash = lose at most
   seconds, never a corrupt half-save.
2. **Export/import**: single `.json` download / file-picker import (the `SaveFile` envelope).
   This is the backup story and the "move browsers" story.
3. **Phase 6**: same `CharacterDoc` schema stored server-side in Postgres JSONB (the WoC
   pattern). Offline characters stay offline-only (classic open-vs-closed realm split) —
   server characters are born server-side; no laundering offline saves into online play.

## Versioning & migration

- `v` bumps whenever `CharacterDoc` shape or any referenced content id changes meaning.
- `src/game/save/migrations.ts`: ordered pure functions `migrate_vN_to_vN+1(doc)`; loader
  folds a doc forward, then zod-validates the final shape. Unknown future version → refuse
  load with clear UI (never destructive).
- Content-id renames ship with a migration entry (old id → new id map). Deleting a content
  id requires a migration that converts affected items to a defined fallback (documented in
  the PR).
- Golden fixture saves in `tests/saves/` — one per historical version — must load cleanly
  forever. CI-gated.

## Failure & recovery

- **Sim exception containment.** The host wraps `sim.tick()` in a try/catch at the loop
  boundary. On throw: freeze the sim (stop ticking, keep rendering the last snapshot), show
  an error UI offering (a) save-from-last-good-snapshot — the `CharacterDoc` captured at the
  most recent save trigger, already durable — and (b) export of the `(seed, intent log)`
  bundle for exact reproduction (`determinism.md`). State extracted *after* the exception is
  never written.
- **Corrupt save detection.** Load path: verify `check` (FNV-1a) → migrate → zod-validate.
  Any failure marks the doc corrupt (retained, never deleted) and falls back to backups.
- **Rotating backups.** Each successful save shifts the previous doc into a 3-deep backup
  ring per character. Fallback tries newest first; the UI names which backup loaded and its
  `updatedAt`.
- **Mid-write atomicity.** Saves write the full envelope to the inactive slot of a
  double-buffered pair (`<charId>#a` / `<charId>#b`) in one IndexedDB transaction, then flip
  a pointer record — the IDB equivalent of write-then-rename. A crash mid-write can only
  lose the in-flight save, never the previous good one; the loader falls back to the other
  slot if the pointer target fails validation.

## Death, hardcore, and difficulty unlock semantics

- Softcore death: respawn in town; body with equipped gear + gold penalty per the researched
  death rules (`02-game-design/difficulty-progression.md` owns the numbers). Corpse recovery
  restores gear; latest N corpses tracked (persisted so a save-quit doesn't eat a corpse).
- Hardcore death: `dead: true` — character locked forever, viewable in roster, playable never.
  The write happens *before* the death UI (no alt-F4 escape).
- Difficulty unlock: killing the final act boss sets `unlockedDifficulty` — the classic
  three-tier ladder (see `02-game-design/difficulty-progression.md`).

## Integrity stance (offline)

Offline saves are client-side; a determined user can edit them — same trust model as classic
offline play and world-of-claudecraft offline mode. The `check` hash catches corruption and
casual tampering only. Real integrity arrives with server-side characters in Phase 6.
No DRM theater.
