# R4 — World Structure & Progression (D2/D2R Mechanics Reference)

Engineering reference for building an ORIGINAL world against D2/D2R structural patterns.
Facts describe Diablo II (LoD 1.14 / D2R patch 2.4+) mechanics. No expressive Blizzard content
(dialogue, story text, full zone rosters) is reproduced; a few well-known zone/NPC names appear
only as orientation anchors.

---

## 1. Act Structure

### 1.1 Overview

- **5 acts** per difficulty. Structural themes: Act 1 = temperate wilderness + fortress-dungeon;
  Act 2 = desert + tombs; Act 3 = jungle + ruined city; Act 4 = hell realm (short act);
  Act 5 = mountain/ice ascent (expansion act).
- Each act = **1 town hub + overworld zone chain + side dungeons + quest dungeons + act boss dungeon**.
- Acts must be completed in order the first time through (boss/quest gates), but once visited,
  free travel between acts via a travel NPC in each town and via waypoints.

### 1.2 Town anatomy (per-act hub)

Every town provides the same service skeleton; NPCs differ per act:

| Service | Notes |
|---|---|
| Healer | Free full heal, cures poison, removes curses; also sells potions in some acts |
| Weapon/armor vendor(s) | Buy/sell/repair; inventory rerolls per visit; per-difficulty stock tiers |
| Potion/scroll/key vendor | Consumables, TP/ID tomes |
| Gambling NPC | Buy unidentified items at premium (quality rolled on purchase; ilvl ≈ clvl −5/+4) |
| Identify NPC | A rescued sage NPC identifies items for free (unlocked by an Act 1 quest, then present in every town) |
| Stash | Personal stash; D2R adds 3 shared stash tabs (cross-character, per core/ladder/hardcore pool) |
| Waypoint | Always one WP in town (first WP of the act) |
| Hireling NPC | Hires that act's merc variant; ALL hireling NPCs can resurrect any merc. Act 4 has no hireable variant (revive only) |
| Act-travel NPC | Caravan/ship/portal to adjacent acts (unlocked by act completion) |
| Quest-giver NPCs | 2–4 NPCs hold the act's 6 quests |

Town rules: no player skills/attacks usable in town; monsters cannot enter town; PvP hostility
can only be declared/resolved outside town.

### 1.3 Per-act structural skeleton

| Act | Overworld spine | Dungeon depth pattern | Boss approach | Quests | Notable structure |
|---|---|---|---|---|---|
| 1 | ~6–7 wilderness zones in a chain (Blood Moor → … → highland) | Side dungeons: 6+ caves/crypts of 1–2 levels; one 5-level tower | Fortress complex: ~5 named sub-areas → 4-level catacombs → boss (Andariel) | 6 | Teaches the pattern: each overworld zone hosts 0–2 optional side dungeons |
| 2 | ~5 desert zones + 3-level sewers under town + 3-level palace cellar | Quest dungeons of 2–3 levels each (staff-piece fetches) | Special maze zone (Arcane Sanctuary: fixed 4-arm cross layout, randomized arms) → canyon hub → **7 tombs (1 true + 6 decoys)** → boss (Duriel) in a tiny arena | 6 | Decoy-branch pattern; boss gated behind multi-part item assembly |
| 3 | ~7–8 jungle/city zones, densest act | Side dungeons: ~5 caves/pits (1–3 levels), 2-level sewers, **6 one-room temples**; city zones stack multiple micro-dungeons | Council mini-boss pack in temple district → 3-level descent (Durance) → boss (Mephisto) | 6 | Optional large swamp branch off the spine; temple cluster = shallow-dungeon density |
| 4 | Only ~4 zones, no side dungeons, no town WP beyond entry (short "gauntlet" act) | None | Seal mechanic: open 3 seals in a fixed-layout sanctuary, each spawns a mini-boss pack, then boss (Diablo) spawns center | **3** | Deliberately short/climactic; no hireling variant; only 3 WPs |
| 5 | ~8 mountain zones ascending; several have 1-level side caverns | 3 quest-created red-portal dungeons (1 level each); a 2+3-level temple complex via red portal | Level-gated trio fight (Ancients, clvl 20/40/60 min per difficulty) → 3-level keep → throne (wave event) → boss chamber (Baal) | 6 | Expansion act: longer, includes "guest monsters" (higher-level imports from earlier acts) in NM/Hell |

Totals: **27 quests**, **30 waypoints**, act boss at the end of every act.

### 1.4 Act boss gating & transitions

- Act boss kill + turn-in unlocks the travel NPC route to the next act.
- Additional hard gates: Act 2 true tomb requires an assembled quest item placed on an altar;
  Act 3 boss level requires smashing a quest object with an assembled quest item;
  Act 4 boss requires opening 3 seals; Act 5 final ascent requires winning the Ancients trio fight
  (minimum clvl 20/40/60 by difficulty; the fight resets if you portal out).
- Completing Act 5 boss on a difficulty unlocks the next difficulty (Normal → Nightmare → Hell).

### 1.5 Topology & map generation model

- **Topology pattern:** linear spine of overworld zones (each with 1 mandatory forward exit),
  decorated with optional branches: dead-end side zones, 1–5 level side dungeons, decoy branches
  (six false tombs), and red-portal micro-zones. Dungeons are linear stacks (level 1 → N, boss or
  quest object at the bottom). Towns are hub-and-spoke.
- **Random generation:** D2 uses **preset tile/room templates stitched at runtime**.
  Each zone type has a pool of hand-built map chunks (preset rooms) with defined edge connectors;
  the generator lays them on a grid per zone with constraints (entrance edge, exit edge, required
  quest/waypoint rooms, side-dungeon entrance nodes). Interior decoration (shrines, chests,
  monster pack anchor points) is placed on candidate nodes.
- Some maps are **fixed**: towns, the Act 4 boss sanctuary, the Act 2 maze's cross skeleton
  (arm contents random), a few quest micro-maps.
- **Seeding:** multiplayer maps re-roll every new game session. Single-player keeps a persistent
  map seed per difficulty (layouts memorizable across sessions). Monster spawns re-roll every game.
- **Size scale (qualitative):** dungeon floors ≈ 1–2 min to clear; typical overworld zone ≈ 2–4 min
  to traverse; a few oversized optional zones exist. Endgame farm dungeons are sized for 2–5 minute
  repeat runs — this run length is a core design constant of the whole loot loop.

Sources: https://diablo2.diablowiki.net/Area_Level , https://classic.battle.net/diablo2exp/quests/rewards.shtml , https://maxroll.gg/d2/resources/important-quests

---

## 2. Waypoints

- **Count per act: 9 / 9 / 9 / 3 / 9 = 30 total.** First WP of each act is in town.
- **Placement cadence:** roughly every 1–2 zones along the spine; a few placed mid-dungeon
  (e.g., a mid-level of the Act 1 jail/catacombs, level 2 of the final keep) so death/exit doesn't
  cost a full dungeon re-descend. Side dungeons and decoy branches never contain WPs.
- WP position within a zone is randomized among candidate map nodes per game seed; players must
  find and click it once to activate.
- **Persistence:** activated WPs are saved per character **per difficulty** forever.
- **Cross-act travel:** the WP UI has one tab per act; a character can jump to any activated WP in
  any act of the current difficulty, from any WP. This is the primary fast-travel/farm-routing tool.
- WPs are not shared between party members; being rushed still requires clicking WPs yourself
  (or riding another player's town portals).

Source: https://classic.battle.net/diablo2exp/ (waypoint pages), https://maxroll.gg/d2/resources/general-leveling

---

## 3. Quests

### 3.1 Counts & flow

- 6 quests in Acts 1, 2, 3, 5; **3 in Act 4**; 27 total, repeated per difficulty (81 completions max).
- Per act: typically 1–2 mandatory gate quests, 1 boss quest, 3–4 optional quests carrying the
  permanent rewards. Optional quests are the character-power faucet.

### 3.2 Quest TYPE taxonomy

| Type | Pattern | Examples (structural) |
|---|---|---|
| Clear dungeon | Kill every monster in a small dungeon | A1 Q1 |
| Kill named target | Superunique or mini-boss at a known location | A1 Q2/Q4, A2 Q1/Q5, A5 Q1/Q4 |
| Fetch item → use/turn-in | Retrieve object, deliver to NPC or use on world object | A1 Q5, A3 Q2/Q4 |
| Multi-part assemble | Collect N pieces, combine (cube), use at a gate object | A2 Q2 (staff), A3 Q3 (relic) |
| Rescue NPC | Find and free an NPC → unlocks a town service | A1 Q3, A5 Q2/Q3 |
| World-state fix / altar | Destroy or activate an object to change world state | A2 Q3, A4 Q2 |
| Kill pack event | Kill a fixed elite council/trio (may be level-gated) | A3 Q5, A5 Q5 |
| Act boss gate | Kill the act boss | last quest of each act |

### 3.3 Reward TYPE taxonomy + act/slot map

Per difficulty (all stack ×3 across N/NM/Hell):

| Act.Slot | Quest type | Reward type | Reward detail |
|---|---|---|---|
| 1.1 | Clear dungeon | **Skill point** + service | +1 skill point; +1 free respec (D2R) |
| 1.2 | Kill target | **Hireling unlock** | Free Act-1 merc + hiring opens |
| 1.3 | Rescue NPC | **Service unlock** (+item) | Free identification in all towns; small ring/gold |
| 1.4 | Kill target (optional) | Item drop | Rune-drop superunique (repeat-farmable outside quest) |
| 1.5 | Fetch item | **Imbue service** | One normal item → rare (ilvl = clvl + 4), once per difficulty |
| 1.6 | Act boss | Progression | Act transition |
| 2.1 | Kill target | **Skill point** + discount | +1 skill (consumable book) + 10% vendor discount |
| 2.2–2.5 | Assemble/altar/kill | Progression + cube | Grants the Horadric Cube (permanent crafting tool) as a side effect of the chain |
| 2.6 | Act boss | Progression | Act transition |
| 3.1 | Fetch chain | **Permanent +20 life** | Consumable potion |
| 3.2 | Fetch item | Item grant | A specific unique-quality dagger |
| 3.3 | Assemble (mandatory) | Progression | Gate to boss level |
| 3.4 | Fetch item | **+5 stat points** | Permanent attribute points |
| 3.5 | Kill pack | Progression | Gate step |
| 3.6 | Act boss | Progression | Act transition |
| 4.1 | Kill target | **+2 skill points** | Largest skill grant |
| 4.2 | Altar/use item | Item grant | 1 normal + 2 flawless + 1 perfect gem + 1 rune; rune tier scales by difficulty (low runes Normal; mid ~Sol–Um NM; ~Hel–Gul Hell) |
| 4.3 | Act boss | Progression | Act transition |
| 5.1 | Kill target | **Socket service** | NPC adds max sockets to one normal item (magic: 1–2; rare/set/unique: 1), once per difficulty |
| 5.2 | Rescue NPCs | Item grant + **hireling unlock** | 3 low-mid runes + Act-5 merc hiring |
| 5.3 | Rescue NPC | **+10 all resistances** + item | Permanent resist scroll + rare class item; also unlocks a red-portal farm dungeon |
| 5.4 | Kill target | **Personalize service** | Engrave character name on one item |
| 5.5 | Kill trio (level-gated 20/40/60) | **XP grant** | Large fixed XP (~1.4M / ~20M / ~40M by difficulty; approx) |
| 5.6 | Act boss | Progression + title | Difficulty complete; unlocks next difficulty (and Terror Zones in D2R) |

Cumulative permanent totals across 3 difficulties: **+12 skill points, +15 stat points, +60 life,
+30 all resistances**, 3 imbues, 3 sockets, 3 personalizes, 3 respecs.

### 3.4 Sharing rules

- Kill-quest credit goes to characters **in the game** (partied) when the target dies; turn-in and
  service rewards are always per-character.
- Some quests require presence/interaction (the Ancients fight requires being on the plateau;
  reward-consumable quests require personally using the item).
- Being in a game where a later quest completes can permanently skip earlier optional quests for
  that difficulty (basis of "rushing"). Hell Ancients' clvl-60 gate is the anti-rush backstop.

Sources: https://classic.battle.net/diablo2exp/quests/rewards.shtml , https://maxroll.gg/d2/resources/important-quests , http://www.vhpg.com/d2r-quest-rewards-list/ , https://almarsguides.com/Computer/Games/Diablo2/Quests/PermanentRewards/

---

## 4. Difficulty Tiers

- **Normal → Nightmare → Hell**, each a full 5-act replay; next tier unlocks on final-boss kill.
- **Player resistance penalty: 0 / −40 / −100** (verified). This is the single biggest defensive
  cliff; gearing resistances back to the +75% cap is the core Hell gear check.
- **Death XP penalty:** none / 5% / 10% of current-level-to-next XP; 75% recoverable via corpse
  (see §12). Cannot de-level.
- **Monster scaling:** large per-tier jumps in HP/damage/AR/defense (data-driven per monster);
  in NM/Hell monster level is set by area level (§5). Monsters gain new abilities and
  **immunities in Hell** (most Hell monsters have ≥1 damage-type immunity; NM immunities are rare).
  This forces dual-element or immunity-breaking builds (§10 sunder charms).
- **Level bands (area levels ≈ monster levels in NM/Hell):**

| Act | Normal alvl | Nightmare alvl | Hell alvl |
|---|---|---|---|
| 1 | ~1–12 | ~36–43 | ~67–85 |
| 2 | ~12–18 | ~43–49 | ~74–85 |
| 3 | ~21–25 | ~49–55 | ~79–85 |
| 4 | ~26–28 | ~56–58 | ~82–85 |
| 5 | ~24–43 | ~58–68 | ~80–87 |

  (Normal alvl is smooth 1→43; NM compresses to 36→68; Hell flattens at 67→87 with optional
  dungeons boosted to 85.) Secret bonus level: 28/64/81.
- **Expected clvl flow:** finish Normal ~lvl 35–45, NM ~60–70, then Hell is the permanent endgame
  (grind to 99). XP formula pays 100% only within ±5 levels of the monster (sliding to 5% at ±10),
  so each tier's mlvl band defines where leveling is efficient.
- **Drop gating:** treasure classes upgrade with mlvl, so elite-tier bases and high runes are
  effectively Hell-only (NM caps out mid-tier). Hell act bosses and alvl-85 areas are the only
  places (pre-Terror-Zones) that can drop the top treasure classes.
- Hell/NM also mix "guest monsters" into late acts, and champion/unique density rises.

Sources: https://www.purediablo.com/diablo-2/diablo-2-difficulty-levels , https://maxroll.gg/d2/resources/experience , https://diablo2.diablowiki.net/Experience

---

## 5. Area Level (alvl) System

- Every zone has a **fixed alvl per difficulty** (data table, one row per zone).
- **Normal:** monster levels are fixed per-monster data; alvl mostly governs treasure/chest quality.
- **Nightmare/Hell:** **mlvl = alvl** for regular monsters; champions = alvl+2; uniques = alvl+3;
  superuniques and act bosses keep their own fixed levels.
- alvl → mlvl → **treasure class + ilvl of drops**, and alvl caps the affix quality from chests.
  So zone placement in the alvl table IS the loot progression curve.
- **Level-85 areas:** in D2R (patch 2.4 expanded the list) there are **32 Hell areas at alvl 85**
  — distribution ≈ Act1: 4, Act2: 4, Act3: 12, Act4: 2, Act5: 10 (famous anchors: the Pit,
  Ancient Tunnels, Chaos Sanctuary, Worldstone Keep). At alvl 85, unique monsters are mlvl 88 and
  **every item in the game can drop** — this is why 85-areas define the farming meta. One outdoor
  zone reaches alvl 87 (highest in the game). Patch 2.4 deliberately added more 85s to spread
  farming across all acts.

### 5.1 Terror Zones (D2R, patch 2.5+)

- **Unlock:** kill the final boss on that difficulty on that character.
- **Rotation:** one zone-group is "terrorized" at a time, rotating on a fixed timer
  (originally 60 min; halved to 30 min in a later season); same rotation applies to all difficulties;
  announced in UI/chat.
- **Level scaling:** terrorized alvl/mlvl = max(base alvl, min(game-creator clvl + X, cap)):

| Monster type | Bonus | Normal cap | NM cap | Hell cap |
|---|---|---|---|---|
| Base | +2 | 45 | 71 | 96 |
| Champion | +4 | 47 | 73 | 98 |
| Unique | +5 | 48 | 74 | 99 |

- Never scales **below** the zone's base alvl. Superuniques are NOT scaled. The reference clvl is
  the game creator's (re-elected if host leaves).
- **XP:** monsters stay inside the ±5-level 100%-XP window at any clvl, and terrorized monsters'
  base XP values are boosted (up to ~5× at high clvl) — this made 95→99 practical outside boss runs.
- **Drops:** scale with the new mlvl; at clvl ≥ 85 any terrorized base monster can drop anything
  (mobile alvl-85 areas). Hell TZs are also the (original) source of sunder charms (§10).
- Design intent worth copying: a rotating spotlight that revalues otherwise-dead zones hourly.

Sources: https://d2r.world/en-US/info/monster/arealevel , https://d2r.world/en-US/info/monster/alvl85 , https://maxroll.gg/d2/resources/terror-zones , https://www.icy-veins.com/d2/terror-zones-guide

---

## 6. Mercenaries (Hirelings)

### 6.1 Variants & archetypes

| Act | Archetype | Skills | Equipment slots |
|---|---|---|---|
| 1 | Ranged physical/elemental (rogue-style) | Cold-arrow or fire-arrow line + a vision/AR debuff utility | Bow (incl. class bows in D2R), helm, body armor |
| 2 | **Aura melee** (the meta workhorse) | Jab-style attack + one paladin-style aura; aura variant chosen at hire: Normal hires = prayer/defiance/blessed-aim set; NM (and Hell in D2R 2.4+) = thorns/holy-freeze/might set | Spear/polearm/javelin, helm, body armor |
| 3 | Caster (iron-wolf style) | One element per variant: lightning (charged bolt/lightning/static), fire (bolt/fireball/enchant), cold (CC) | 1-h sword, shield (cannot block), helm, body armor |
| 5 | Melee bruiser (barbarian) | Frenzy dual-wield variant or bash/stun/battle-cry variant | Sword(s), helm (incl. barb class helms), body armor |

- Act 4 has no hireable variant; its NPC only revives.
- Only the hiring NPC of an act offers that variant; any act's NPC revives any merc.
- No jewelry slots; no class items except the barbarian helm exception; ethereal gear never loses
  durability on mercs (intended merc-gear economy).

### 6.2 Costs, XP, scaling

- **Hire:** offered list is generated near your clvl; price scales with the offered merc's level
  (hundreds → low thousands of gold). Hiring while one is employed destroys the old merc and its gear.
- **Resurrect:** `cost = min(floor(hlvl² / 2) × 15, 50,000)` gold (e.g., lvl 57 → 24,360; capped 50k).
- **XP/leveling:** merc gains XP from kills it participates in with its employer; cannot out-level
  the character; per-level stat growth (life, defense, AR, resists, damage) comes from per-variant
  tables, and their skill/aura levels step up automatically on fixed merc-level thresholds
  (e.g., an aura creeping from lvl ~1 at hire toward ~lvl 15–20 at high merc level).
- Mercs teleport to the player when too far; are healed by potions (drag onto portrait), wells,
  and town visits; die permanently only in the sense of needing paid revival.
- D2R 2.4 reworked all variants for viability (Act 1 got class-bow access, Act 3/5 buffs,
  aura sets unified so NM/Hell hires match).

Sources: https://maxroll.gg/d2/resources/mercenary , https://diablo-archive.fandom.com/wiki/Hirelings_(Diablo_II)

---

## 7. Shrines & Wells

Placed at map generation from per-zone allowed pools; click to activate. Duration buffs
**do not stack** — a new shrine replaces the current one; curses cancel shrine buffs (and vice versa).

| Shrine | Effect | Duration | Refresh |
|---|---|---|---|
| Refilling | Instantly refill life + mana | instant | ~96 s |
| Health / Mana | Instant full life / full mana | instant | ~96 s |
| Armor | +100% defense | 96 s | 240–300 s |
| Combat | +200% attack rating & damage | 96 s | 240–300 s |
| Mana Recharge | +400% mana regen | 96 s | ~300 s |
| Stamina | Unlimited stamina | ~96 s (some tables: 144 s) | yes |
| Skill | +2 all skills (only skills with ≥1 hard point) | 96 s | 240 s |
| Resist Fire/Cold/Lightning/Poison (4 types) | +75 to one resistance | ~144 s | yes |
| **Experience** | +50% XP per kill | **144 s** | **never** |
| Gem | Upgrades one gem in inventory one tier (random if several) | instant | never |
| Monster | Promotes nearest normal monster to unique/champion | instant | never |
| Fire | Trap: fireball burst / halves nearby HP | instant | never |
| Exploding / Poison | Trap: fire explosion / poison cloud around shrine | instant | never |
| Portal | Opens a town portal | instant | never |

- Experience shrines are the design standout: non-refreshing, high value, and they change player
  routing (saved for boss kills / high-density pulls).
- **Wells:** refill 50% of max life/mana/stamina for player + minions, cure poison, remove curses;
  multiple charges; recharge over time (~30 s per charge per one source; slower per others).
  Function as free mid-zone sustain stations and merc healing.

Sources: https://diablo2.diablowiki.net/Shrines , https://maxroll.gg/d2/resources/shrines-and-wells , https://classic.battle.net/diablo2exp/shrines.shtml

---

## 8. Superuniques

- **Concept:** named unique monsters with **fixed spawn locations** (or small candidate areas),
  **preset modifier loadouts** (e.g., extra strong / cursed / aura-bearing), usually escorted by a
  minion pack of their base type. Roughly 60–70 exist across the game (approx.).
- Levels are fixed per difficulty (not alvl- or TZ-scaled). Always drop items (superuniques drop
  2 items regardless of player count; player count doesn't change their drop count).
- **Placement pattern:** ~1–3 per act zone or dungeon, sited at landmarks — dungeon bottoms,
  bridge/gate chokepoints, quest objects, boss antechambers. Some ARE quest targets
  (tower mini-boss, summoner, siege commander); some guard nothing and exist purely as
  texture/farm nodes.
- **Farm roles (notable examples):** a tower mini-boss with a special rune-heavy treasure class
  (rune farming); a red-portal-adjacent superunique 5 seconds from town (fast item runs);
  paired superuniques at the first Act 5 zone (fast XP/loot warm-up); three Hell superuniques that
  drop the Pandemonium keys (§10); a secret-level king (D2R removed the legacy "killing him locks
  re-entry" restriction).
- Design takeaway: superuniques are the reward-density knobs of a zone — fixed, nameable,
  routable targets with hand-tuned drop tables.

Sources: https://diablo2.diablowiki.net/ (superunique pages), https://www.purediablo.com/diablo-2/ , https://maxroll.gg/d2/resources/ (farming guides)

---

## 9. Act Bosses

### 9.1 Mechanical archetypes (for original boss design)

| Act | Archetype | Kit pattern | Arena pattern |
|---|---|---|---|
| 1 | **Poison melee assassin** | Fast melee chain + poison spray/nova leaving DoT; vulnerable to one element (fire) | Small throne room at dungeon bottom |
| 2 | **Confined-space bruiser** | Charge, knockback smite, permanent chill aura (slows player), huge physical burst; spawns instantly on entry | Tiny arena, no kiting room — pure gear/HP check |
| 3 | **Artillery caster** | Multi-element ranged volleys (cold/lightning + skull missile), slow mover; kitable/cheesable across terrain | Open temple floor with a moat — rewards positioning exploits |
| 4 | **Mixed melee-caster climax** | Fire nova, huge lightning beam ("hose"), firestorm ground fire, bone-cage trap (imprisons player), charge | Fixed-layout sanctuary; 3 seals each spawn an elite pack + mini-boss, boss spawns center after all 3 |
| 5 | **Wave-event trickster** | Prelude: 5 scripted minion waves (themed on prior acts, escalating to an elite pack) at the throne; then boss in inner chamber: teleport, summons, curses, cold nova, mana-drain rift, self-**clone** decoy | Two-stage: defense event → boss room |

- Escalation logic: melee check → burst/CC check → ranged check → hybrid check → endurance event.
- Hell boss mlvls (reference): Act-bosses ~88–99 (Diablo 94, Baal 99); a late quest mini-boss at 95.

### 9.2 Quest drop vs farm drop

- Each act boss has a **special quest treasure class** used the first time a character kills it
  without quest credit ("first-kill quest drop"): junk/gold picks removed, rare quality guaranteed
  minimum, ~33× unique/set bias — but NoDrop still applies.
- Normally, once your quest is complete you get the standard TC forever after. Exception: a famous
  Act 1 sequencing quirk (talking to the caravan NPC before other turn-ins) leaves the boss
  permanently on quest-drop TC for that difficulty — widely used, effectively a feature.
- Joining a game whose creator already completed the quest lets an uncredited character re-trigger
  quest drops repeatedly.
- Boss NoDrop shrinks with player count: ~0 NoDrop at players-5 unpartied / players-3 partied;
  bosses drop up to 6 items.

Sources: https://www.purediablo.com/forums/threads/how-do-quest-drops-work.112159/ , https://forums.d2jsp.org/topic.php?t=71142281 , https://maxroll.gg/d2/ (boss guides)

---

## 10. Endgame Systems

### 10.1 Farming meta-structure

- The endgame is a **rotation of 2–5 minute repeatable runs**: Hell act bosses (fast, high TC),
  alvl-85 dungeons (drop-everything pools), rune-TC superuniques, XP zones (throne-wave runs),
  and (D2R) whatever is terrorized this half-hour. Magic Find gear trades power for drop quality.
  Game recreation re-rolls maps/monsters/drops → the whole loop is "make game → run → leave".

### 10.2 Pandemonium Event (uber endgame)

Structure (Hell difficulty only; legacy = ladder-realm only; D2R = broadly available):

1. **3 keys** drop from **3 specific Hell superuniques** (one per key type; ~1-in-10..12 drop rate;
   Magic Find does NOT apply). Need one of each to proceed — so farm loop across 3 acts.
2. Transmute a key set (cube) in the Act 5 town → opens **1 of 3 red portals at random** to a
   mini-uber zone (reskinned existing layouts). The same zone won't repeat within one game session
   → doing all 3 in one game costs exactly 3 key sets (9 keys).
3. Each mini-uber zone holds a buffed "uber" version of a story boss; each drops **1 of 3 organs**.
4. Transmute the 3 organs → portal to an **uber town instance** containing 3 simultaneously-active
   super-buffed act bosses (one with a massive −resist aura, one tank-summoner, one summoner),
   each summoning immune minion streams. No town portals inside.
5. Last boss killed drops a **guaranteed class-charm reward** (a large charm with +3 to one class's
   skill tree + random stats; MF-independent) plus a vanity item.

Design skeleton: *key farm (3 sources) → gated mini-boss triple → assembled second gate →
triple-boss finale → deterministic build-defining charm*.

### 10.3 World boss event (Diablo Clone)

- Trigger: a community/economic counter — selling **75–125 copies of a specific unique ring** to
  vendors (regional counter in D2R 2.4+; **1 ring in single-player**), originally designed as an
  economy sink for duped rings.
- Progress broadcasts in 6 escalating stages; at the final stage, in each eligible Hell game the
  **next superunique the player approaches is replaced** by the world boss (players thus choose
  an easy superunique as the spawn anchor).
- Boss: massive HP + fast regen + 95 all-res + heavy mixed kit. Drops a **guaranteed unique small
  charm** (+1 all skills class-agnostic chase item), one per game.

### 10.4 Ladder seasons

- Periodic resets (~4 months in D2R): fresh character pool + fresh economy + race to 99.
- Ladder-gating concept: some content/recipes/runewords historically ladder-only; at season end,
  ladder characters convert to non-ladder (items flood the permanent economy). D2R seasons also
  ship the new systems (2.4 new runewords/85-areas; 2.5 Terror Zones; season 2 sunder charms).

### 10.5 Sundered charms (D2R season 2+)

- 6 charm types, one per damage type (fire/cold/lightning/poison/magic/physical).
- Effect while carried: monsters **immune** to that type are treated as **95% resistant** instead.
  After sundering, aura/curse −resist effects (conviction/lower-resist) apply at **1/5 effect**
  vs those monsters; item-based −enemy-resist% applies at full value (cold-mastery handling is
  disputed between sources — see Uncertainties).
- Cost: matching self-penalty rolled on the charm (e.g., −40..−70 self resist of that element).
  Duplicates don't stack the monster effect but do stack your penalty.
- Only helps the carrier's own damage/minions — not party members or mercs.
- Drops: Hell Terror Zone champions/uniques+ originally; later patches added "latent" versions
  dropping more broadly in Hell.
- Design role: immunity system pressure-valve, letting single-element builds do endgame at a price.

Sources: https://diablo2.diablowiki.net/Pandemonium_Event , https://www.wowhead.com/diablo-2/guide/pandemonium-uber-boss-encounters-keys , https://maxroll.gg/d2/meta/diablo-clone , https://maxroll.gg/d2/resources/sundered-charms , https://www.purediablo.com/diablo-2/uber-diablo

---

## 11. Party / Multiplayer Progression Rules

### 11.1 Player-count scaling (`/players X` offline = 1–8; online = real player count)

- Monster **Life and XP** ×  `(n + 1) / 2` → +50% per additional player (8p = 450% of base).
- Monster **damage & attack rating** +6.25% per player above 1.
- Stats snapshot at monster spawn time (players leaving doesn't weaken spawned monsters).
- **Drops:** only the NoDrop probability improves; it steps down per 2 additional players
  (breakpoints at 3/5/7 for the setting; partied players standing near the kill count with double
  weight: `N = 1 + additionalPlayers/2 + closePartiedPlayers/2`). Boss NoDrop hits 0 at p5
  unpartied / p3 partied-near. Chest drops check player count at open time.
- Net design: more players = more totals but contested; solo in a full game = best XP.

### 11.2 XP sharing

- Shared only among **partied** players within **~2 screens (≈53 yards)** of the kill.
- Party bonus ≈ **+35% per additional partied member in range** (exact: ×87/256 per member).
- The pot is split **proportionally to character level** among in-range partied members, then each
  share is scaled by that character's clvl-vs-mlvl penalty (100% within ±5 levels → 5% at ≥10 gap)
  — prevents pure leech from level-gapped carries.

### 11.3 Quests, loot, portals

- Quest kill-credit: partied characters in the game get credit (details per quest; some need presence).
- **Loot allocation: FFA.** Drops are world-shared; first click wins. **D2R deliberately kept FFA**
  (no personal loot) for economy/authenticity reasons — confirmed by Blizzard at launch and never
  changed. Trading/economy design assumes this.
- **Town portals:** each player maintains one TP pair (field ↔ town) from consumable
  scrolls/tomes; casting a new TP closes the old; portals vanish when the caster leaves the game;
  other (non-hostile) players may ride anyone's portal — the backbone of taxi/rush play.
- Red portals (quest/event) are world objects, usable by all, with their own rules.
- Max 8 players per game; parties are opt-in within a game; PvP via mutual-ish hostility
  declaration from town.

Sources: https://maxroll.gg/d2/resources/player-settings , https://diablo2.diablowiki.net/Player_Settings , https://diablo2.diablowiki.net/Experience , https://maxroll.gg/d2/resources/experience , https://www.purediablo.com/no-personal-diablo-2-resurrected-loot , https://kotaku.com/diablo-2-dev-explains-why-the-loot-system-wasn-t-update-1847734454

### 11.4 (D2R) Loot QoL note

D2R added item-label toggles and console couch co-op loot behavior but the allocation model on PC
remained FFA. Any original design choosing personal loot departs from D2R here — flag as a design
decision, not a mechanics clone.

---

## 12. Death / Save Model

### 12.1 Death

- On death: respawn in the **current act's town**, body (with ALL equipped items) remains as a
  corpse at the death spot; gold penalty applies immediately.
- **Gold loss:** clvl < 21 → lose clvl% of (carried + personal stash) gold; clvl ≥ 21 → lose 20%.
  Portion beyond carried gold comes from stash (multiplayer); in single-player, stash is exempt and
  500 × clvl carried gold is exempt. Lost carried gold drops at the corpse (anyone can grab).
  D2R shared-stash tabs don't count → death-tax shelter.
- **Corpse recovery:** walk back and click corpse → re-equip (order-dependent str/dex checks).
  If you save+exit with a corpse in the field, it respawns in town next game (items safe) but the
  XP refund is forfeit. Realm rule: the single most valuable corpse persists across games.
- **XP:** NM −5% / Hell −10% of next-level XP per death; 75% refunded on corpse recovery in-session;
  never de-levels.
- **Hardcore:** separate mode; death is permanent (character unplayable; in D2R its items are lost
  with it unless another player loots the corpse in-game). Legacy required beating Normal on some
  character to unlock HC creation; D2R relaxed this (see Uncertainties).

### 12.2 Persistence model (per character)

| Persists across games | Resets every game session |
|---|---|
| Character (stats/skills/level/XP) | Zone map layouts (multiplayer; SP keeps seed per difficulty) |
| Inventory + equipped + personal stash (+ D2R shared stash pool) | All monsters, chests, shrines states |
| Quest completion flags (per difficulty) | Ground items (anything not picked up is gone) |
| Activated waypoints (per difficulty) | Town portals, red event portals |
| Hireling (identity, level, gear) | World-state quest staging inside zones |
| Difficulty unlocks, ladder flags | /players setting effects |

- Carried gold cap = 10,000 × clvl; stash caps larger (D2R greatly expanded, multi-tab).
- This "world is disposable, character is permanent" model is what makes short randomized farm runs
  the core loop: rerolling the world IS the content generator.

Sources: https://maxroll.gg/d2/resources/death , https://diablo.fandom.com/wiki/Death , https://www.vhpg.com/what-happens-when-you-die-in-diablo-2-resurrected/

---

## Uncertainties & Conflicts

1. **Hellforge (A4 Q2) Normal rune range:** sources conflict — "El–Sol" (one search summary) vs the
   commonly cited "El–Amn". NM ~Sol–Um and Hell ~Hel–Gul are consistent. Verify against
   treasureclassex data before hard-coding.
2. **Ancients (A5 Q5) XP amounts:** ~1.4M / ~20M / ~40M widely quoted but not re-verified here;
   treat as approximate.
3. **Shrine durations for Stamina and the 4 Resist shrines:** tables disagree between 96 s and
   144 s; regeneration timers vary by source (240–300 s). Well recharge time reported as ~30 s by
   one source; other tables imply slower. Exact values live in shrines.txt — verify if cloning.
4. **Merc hire-cost formula:** resurrect formula is verified; the initial hire price formula was
   not found in a primary source (only "scales with offered merc level"). A D2R bug report also
   shows the 50k revive cap being exceeded (~54k) at high level in some patches.
5. **Cold Mastery vs sundered monsters:** Maxroll says full effect; other guides lump it into the
   1/5 rule with conviction/lower-resist. Also "latent sunder charms drop from any Hell monster"
   reflects a recent-season change — confirm current patch behavior.
6. **Pandemonium availability in D2R offline/single-player:** legacy D2 was Battle.net-ladder only;
   D2R is widely reported as available in all modes (incl. offline), but this was not directly
   verified from a primary source here.
7. **Hardcore unlock in D2R:** legacy required completing Normal first; D2R is believed to allow HC
   creation immediately — verify.
8. **Superunique total count** given as ~60–70 (approx., not enumerated).
9. **Exact per-slot alvl numbers** are summarized as bands; the full per-zone table (levels.txt
   equivalent) is on https://d2r.world/en-US/info/monster/arealevel if exact numbers are needed.
10. **Terror Zone rotation cadence** changed by season (60 → 30 min); recent seasons also add a
    random extra monster affix in TZs. Pin to a target patch when speccing.
11. **Boss mlvls in Hell** partially verified (Diablo 94, Baal 99, Nihlathak 95); Andariel/Duriel/
    Mephisto Hell mlvls not re-verified here.
