# Naming & Lore — Content Bible Framework

> Core identity: original world name, tone, acts, and factions. This is the **expression**
> layer — all proper nouns, flavor, and narrative are ours. Mechanical roles and structural
> patterns link to D2 archetypes for engineering reference only; no Blizzard names appear
> anywhere in-game or in code.

## World identity

**Working title (dev codename only):** D2R-Clone (replace with original title before any
public release. Decision: Phase 5.)

**World tone:** Dark bronze-age fantasy. Not high-fantasy nor grimdark-parody. Gods exist
but are indifferent; civilization is scattered city-states holding back a tide of
monstrous corruption called "The Bleed." Magic is a corrupting force — it works, but it
leaves scars on user and land alike.

Visual register: desaturated earth tones, rust and verdigris bronze, pale sky, black iron,
cracked obsidian. No cartoon, no photoreal — moody low-poly with strong silhouette language.

## Act framework (5 acts, structural analogue only)

Each act maps structurally to a D2 act (act boss gating, zone chain length, town service
set), but all zones/NPCs/quests are original named and authored.

| Act | Title theme | Structural role | Act boss mechanical profile |
|---|---|---|---|
| I | Coastal frontier — crumbling lighthouse towns, misty marshes, a fallen cathedral | Opening act: town → 4-zone wilderness → catacombs → boss. 9 waypoints | Fast poison melee rusher with charging attack + poison cloud AoE. Arena: flooded burial chamber |
| II | Desert expanse — ancient clockwork ruins in endless sand | Act 2: town → 3-zone desert chain + 4 branching tombs → burial chambers → boss. 9 waypoints | Large bruiser in confined arena, knockback charge, freeze-pulse field. Must destroy 7 seal engines to unlock |
| III | Jungle basin — flooded temples, canopy cities, mercury rivers | Act 3: town → 4-zone jungle chain + 2 dungeon branches → council chambers → boss. 9 waypoints | Three-member caster council with elemental combos + summoned minions. Teleport-linked shared HP pool |
| IV | Sky-reach — floating islands connected by crystal bridges over infinite void | Act 4: central fortress → 2 branching zones → throne → boss. 3 waypoints | Mixed-phase boss: seal-gated waves, firestorm + bone-cage, lightning storm intermission, phase-switch at 66%/33% HP |
| V | Bleed heart — ground zero of the corruption; organic-obsidian landscape | Act 5: town → 4-zone chain (mountain → fortress → keep → throne room) → boss waves → boss. 9 waypoints | Wave arena (5 minion waves with escalating modifiers) → final boss "Heart of the Bleed" with corruption-cleanse phases |

## Factions (world-building depth, light presence in gameplay)

- **The Freeholds:** town-states the player operates from. Neutral pragmatic survivors.
- **The Bleed:** the corrupting force = monsters. Not evil, not good — a mutagenic geological
  phenomenon. The world is losing ground to it.
- **The Keepers:** ancient order that held the Bleed back for centuries via the "Lodestar"
  artifacts. Now fallen/dispersed; their remnants are the superunique encounters and
  dungeon guardians.
- **The Iron Court:** autocephalous city-state that weaponized the Bleed (via "grimwork" —
  cursed gear with power and cost). Not enemies per se, but morally flexible traders
  (gamble NPCs, some unique item manufacturers).

## Name conventions

| Element | Convention | Example |
|---|---|---|
| Characters | Short, guttural, 2-3 syllables | Kael, Orvin, Sareth, Nyssa, Tharn, Jora |
| Zones | Atmospheric descriptor + feature noun | Drowned Fens, Chisel-Spire, Ashen Ramparts, Mirror-Marsh, Hanging Gardens of Khol |
| Monsters | Creature-type word + distinctive prefix/suffix | Shalehide, Gloomwing, Bright-Tick, Rustwalker, Scorch-Nest |
| Items (uniques) | Evocative name referencing creator/event | Heart-Piercer, Last Candle of Khol, Stag-King's Gaze |
| Set items | Named after legendary figure or court | The Iron Court, Kael's Legacy, Shattered Keepers |
| Runes | Single-syllable resonant-symbol words | Tor, Ven, Kre, Mos, Tahl, Gorn, Sek, Reth, Zul, Vor, Xan, Quor, Nihl |

## IP enforcement checklist

Before any commit, verify:

1. **No Blizzard proper nouns** — scoped to **all of `doc/` and `src/`, EXCEPT
   `doc/research/**`**. The research appendices describe the original game for mechanics
   canonicalization and may name it and its content directly; nothing under
   `doc/research/` ships or is quoted into shipping text. Everywhere else the rule is
   absolute: `grep -iE 'diablo|mephisto|baal|andariel|duriel|tyrael|deckard|cain|akara|charsi|warriv|malah|qual-kehk|harrogath|lut|gom|tristram|khanduras|westmarch|arreat|tal rasha|horazon|viz-jun|kurast|travincal|temple of [a-z]+|worldstone|soulstone|throne of [a-z]+|river of [a-z]+|chaos sanctuary|cow level|arcane sanctuary|cathedral|monastery|barracks|jail|forge|council|summoner|radament(?!\s+is)|ancient kaa|the summoner|izual|nihlathak|pindleskin|shenk|eldritch|colenzo|achmel|bartuc|corpsefire|bonebreaker|bishibosh|magewrath|stormeye|coldworm|magmaball|creeping feature|fangskin|wormbeak|arena[h-z]|blood-?raven|griswold|the countess|treehead|woodfist|rotfeather|raven claw|shadow-?mancer'`
   - Allowed (mechanics terms, generic): `treehead` excluded from above (accidental catch) — actual test uses a curated blocklist in `scripts/blocked-content-names.txt`
   - The CI grep driven by `scripts/blocked-content-names.txt` excludes `doc/research/`
     from its search paths; it covers the rest of `doc/` and all of `src/`
2. **No Blizzard item names** in data tables (unique/set/runeword names, NPC names)
3. **No reproduced map layouts** — zones use original generators
4. **No ripped assets** — this invariant is checked by repo policy (no binary blobs)
5. Allowed: mechanics jargon (FCR, ilvl, TC, NoDrop, "treasure class"), generic archetype
   words (barbarian, sorceress, paladin as *descriptors of mechanical archetypes in design
   docs only*, never as in-game class names)
