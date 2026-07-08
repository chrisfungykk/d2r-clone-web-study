// The World Seam — `IWorld` and its DTOs (doc/01-architecture/world-seam.md).
//
// This is the ONLY file both sides of the architecture may import. Renderer, UI, and game
// controller see the world exclusively through `IWorld`. `Sim` (offline) and, later,
// `ClientWorld` (Phase 6) both implement it.
//
// Rules that this file must honor:
//   • Every type here is plain JSON-serializable data (no classes / functions / Maps) — it
//     doubles as the Phase 6 wire format. (CLAUDE.md invariant 7.)
//   • Views are deep-readonly across the seam; the only write path is `submit(intent)`.
//   • This file is subject to the sim-purity gate (no Date / Math.random / three, etc.).
//
// B2 defines the full type surface; B3 completes the snapshot double-buffering + AoI
// implementation in the Sim and the JSON round-trip tests.

// ─── ids (sequential ints from the sim; zone ids are stable snake_case strings) ──────────
export type EntityId = number;
export type PlayerId = number;
export type ZoneId = string;

// ─── intents: the only way anything outside the sim influences it ────────────────────────
export type SkillSlot = "L" | "R";
export type BeltIndex = 0 | 1 | 2 | 3;

/** Where an item lives, for inventory moves (grid coordinates completed in the item phase). */
export type ItemLoc =
  | { kind: "inv"; x: number; y: number }
  | { kind: "equip"; slot: EquipSlot }
  | { kind: "belt"; index: BeltIndex }
  | { kind: "stash"; x: number; y: number }
  | { kind: "cursor" }
  | { kind: "ground" };

export type EquipSlot =
  | "head"
  | "body"
  | "weapon"
  | "offhand"
  | "gloves"
  | "boots"
  | "belt"
  | "ring1"
  | "ring2"
  | "amulet";

export type NpcAction =
  | { kind: "talk" }
  | { kind: "trade" }
  | { kind: "gamble" }
  | { kind: "heal" }
  | { kind: "hire" };

export type Intent =
  | { t: "move"; x: number; z: number }
  | { t: "skill"; slot: SkillSlot; targetId?: EntityId; x?: number; z?: number }
  | { t: "pickup"; itemId: EntityId }
  | { t: "belt"; index: BeltIndex }
  | { t: "invMove"; from: ItemLoc; to: ItemLoc }
  | { t: "npc"; npcId: EntityId; action: NpcAction }
  | { t: "waypoint"; zoneId: ZoneId };

// ─── entity views (interest-scoped snapshot payload) ─────────────────────────────────────
export type EntityKind =
  | "player"
  | "monster"
  | "npc"
  | "missile"
  | "groundItem"
  | "portal"
  | "shrine"
  | "corpse";

export type AnimStateName =
  | "idle"
  | "walk"
  | "run"
  | "attack"
  | "cast"
  | "hit"
  | "block"
  | "death"
  | "dead";

/** Sim-owned logical animation state (mechanics — frame-accurate breakpoints). */
export interface AnimState {
  state: AnimStateName;
  frame: number; // current frame within the state
  totalFrames: number; // frames the state runs for at 25 Hz
}

export type Rarity = "normal" | "magic" | "rare" | "set" | "unique";
export type MonsterModId = "champion" | "unique" | "minion";

export interface GroundItemLabel {
  name: string;
  rarity: Rarity;
}

export interface EntityView {
  id: EntityId;
  kind: EntityKind;
  archetype: string; // key into content data (monster family, item base…)
  x: number;
  z: number;
  facing: number; // radians
  anim: AnimState;
  hpPct?: number; // display-only precision
  modifiers?: readonly MonsterModId[];
  labels?: GroundItemLabel;
}

export interface WorldSnapshot {
  tick: number;
  entities: readonly EntityView[]; // interest-scoped: ~40 m radius around the player
}

// ─── player view (the UI's whole world — all numbers pre-computed by the sim) ────────────
// Fleshed out across B6 (character) and the item/skill phases. Kept minimal + serializable.
export interface PlayerView {
  id: PlayerId;
  entityId: EntityId;
  name: string;
  clvl: number;
  x: number;
  z: number;
  hp: number;
  hpMax: number;
  mana: number;
  manaMax: number;
  zoneId: ZoneId;
}

// ─── zone view (terrain metadata + revealed automap; completed in B5) ─────────────────────
export interface ZonePropView {
  archetype: string; // parametric prop family key
  x: number;
  z: number;
  facing: number;
  scale: number;
}

export interface ZoneView {
  id: ZoneId;
  theme: string; // drives renderer texture/palette selection (never queried per-frame)
  seed: number;
  widthM: number;
  depthM: number;
  props: readonly ZonePropView[];
  /** Packed automap reveal bitfield (2 m cells), row-major. Empty until B5/automap. */
  automapWidth: number;
  automapDepth: number;
  automap: readonly number[]; // packed bits, JSON-serializable
}

// ─── events drained each frame (render/audio/UI feedback; never fed back into the sim) ───
export type DamageKind = "physical" | "fire" | "cold" | "lightning" | "poison" | "magic";
export type QuestId = string;
export type QuestState = "locked" | "active" | "complete";

export type SimEvent =
  | { t: "damage"; target: EntityId; amount: number; kind: DamageKind; crit: boolean }
  | { t: "death"; entity: EntityId }
  | { t: "drop"; item: EntityId; rarity: Rarity }
  | { t: "levelUp"; player: PlayerId }
  | { t: "questState"; quest: QuestId; state: QuestState }
  | { t: "zoneEnter"; zone: ZoneId }
  | { t: "spawn"; entity: EntityId; kind: EntityKind };

// ─── the seam ────────────────────────────────────────────────────────────────────────────
export interface IWorld {
  // time
  readonly tick: number; // sim frame counter (25 Hz)

  // advancing (host-called)
  submit(playerId: PlayerId, intent: Intent): void;
  advance(): void; // run exactly one 40 ms tick, consuming queued intents

  // queries (renderer/UI read path)
  snapshot(): WorldSnapshot;
  prevSnapshot(): WorldSnapshot;
  player(id: PlayerId): PlayerView;
  terrainHeight(x: number, z: number): number;
  zone(): ZoneView;

  // events since last drain
  drainEvents(): SimEvent[];
}
