# Endgame

> Post-Hell-act-5 content: farming meta, boss-key event chain, world-event superboss,
> terror zones, ladder concepts. Sources canonicalized from
> `doc/research/r4-world-progression.md`.

## alvl85 farming meta

For characters that have completed Hell difficulty, ~8 zones with area level 85 provide:
- Highest-affix-level rolls (all affixes available across dropped items)
- Highest experience yield
- Strong boss-density for rune farming
- Specific superuniques with target-farmable unique drops

Primary alvl85 zones (**canonical list** — `04-content-bible/zones.md` syncs its zone
rows to these names):
1. Rift-Fields (Act V endgame) — main open farming route
2. The Descent (Act V) — linear speed-farm
3. Throne of the Shattered King (Act IV) — boss + elite pack density
4. The Bleed Heart (Act V) — wave combat, high density + boss
5. Echo-Mine (Act V endgame) — quiet route, charm farming
6. Root-Tunnels Hell version (Act III) — charm-focused
7. Sunken Fane Hell (Act I) — fast boss run
8. Chasm routes (Act IV) — caster-favored

## Boss-key event chain (three-key gauntlet)

Hell difficulty only. Structure:
```
1. Key Wardens: 3 superuniques in Hell, each drops a unique key (T1, T2, T3)
   - Key of Sorrow — Act I superunique
   - Key of Ruin — Act III superunique
   - Key of Bleeding — Act V superunique
   Drop rate: 1/12 per warden kill at players-1 — a flat rate that improves only via
   the player-count NoDrop rule; MF does not apply (keys are not magic items)

2. Each portal: 3 keys of one type → opens portal to a mini-boss arena
   (a reskinned existing layout; the same arena won't repeat within one game session,
   so completing all 3 in one game costs exactly 3 key sets = 9 keys)
   - The Weeping Matron — poison-melee assassin archetype in a den arena
   - The Rusted King — confined-arena physical bruiser archetype
   - The Final Echo — aura-armored melee wraith archetype

3. Each mini-boss drops its organ — GUARANTEED (100%) on kill
   - Heart of the Weeping Matron
   - Crown of the Rusted King
   - Echoing Husk

4. 3 organs (one of each) → transmuted in town → "Heart Chamber" final arena
   - Encounter: The Forgotten Heart — three simultaneously active super-buffed boss
     echoes (one with a massive −resist aura, one tank-summoner, one summoner of
     immune minion streams); no town portals may be cast inside
   - Reward: the LAST boss killed drops "Heartbrand" — unique large charm, guaranteed,
     MF-independent, one per game: +3 to one class's skills (class rolled on drop),
     +10-20 all attributes, +10-20 all resistances; carry limit 1
```

Verification note: key rate and guaranteed organs verified against D2R community data
(keys ≈ 1/10-1/12 per warden, a Blizzard-confirmed flat rate scaled only by player
count; organs are 100% drops from the mini-bosses). The charm's stat budget mirrors the
D2R event reward.

## Immunity-breaking charms

Unique grand charms, Hell only. Drop sources: champions/uniques in the currently
corrupted zone (see Terror Zone analogue below), plus a guaranteed-pool chance from the
boss-key finale. One immunity type each:

| Charm (unique grand charm) | Immunity broken | Equipper self-penalty |
|---|---|---|
| Ember Shard | Fire | −40..−70 fire resist (rolled) |
| Frost Splinter | Cold | −40..−70 cold resist (rolled) |
| Static Fragment | Lightning | −40..−70 lightning resist (rolled) |
| Venom Shard | Poison | −40..−70 poison resist (rolled) |

Mechanics (exact): while the charm is in the carrier's inventory, any monster with ≥100%
resistance in that element is treated as having **95% resistance** against the carrier's
own damage and minions only (not party members or hirelings). After the break, aura/curse
−resist effects apply at **1/5 effectiveness** against those monsters; item-based −enemy-
resist% applies at full value. Duplicates do not stack the break but do stack the
self-penalty.

## World-event superboss (economy-triggered)

Mechanically equivalent to D2R's economy-sink world boss. Hell difficulty only.

1. **Trigger economy:** every vendor sale of "Keeper's Signet" — the chase unique caster
   ring (+1 all skills, +mana; catalog entry in `04-content-bible/item-catalog.md`) —
   increments a region-wide counter. When the counter reaches a threshold rolled in
   **75-125** per cycle, the event fires in every eligible Hell game in the region.
   Offline/single-player: threshold = **1 sale**. The counter resets after each event
   cycle. Design intent (as in D2R): a deliberate sink that retires duplicated copies of
   the most-traded unique from the economy.
2. **Broadcast:** counter progress announces in **6 escalating stages** to all eligible
   games (original announcement text per the content bible), so players can position in
   advance.
3. **Spawn:** in each eligible Hell game, the **next superunique whose activation radius
   a player enters is replaced** by the superboss, "Vessel of the Bleed" — players
   therefore choose an easy, town-adjacent superunique as the spawn anchor.
4. **Boss profile:** massive HP pool with fast regeneration, **95% resist all** (broken
   only by −resist effects; not immune), heavy mixed melee/caster kit. A sustained
   DPS-and-survival check tuned above any act boss.
5. **Reward:** guaranteed drop, one per game, MF-independent: **"Bleeding Star"** —
   unique small charm: +1 to all skills, +10-20 to all attributes (rolled), +10-20 all
   resistances (rolled), +5-10% experience gained (rolled). Carry limit 1 (a second
   cannot be picked up).

Counter, stages, and thresholds are server state (Phase 6); offline the event runs
per-character. Both unique charms ("Heartbrand", "Bleeding Star") and "Keeper's Signet"
are catalog rows in `04-content-bible/item-catalog.md`.

## Terror Zone analogue

System: every 15-20 minutes, one zone is "seething with Bleed corruption":
- Zone's mlvl = min(playerClvl + 2, zoneCap) — for mlvl > zone alvl
- Monster XP multiplied by ~1.5
- Immunity-breaking-charm drop chance active from champions/uniques in the zone
- Visual indicator: zone name pulses red on waypoint panel
- Rotation: cycles through all zones from acts I-V (excluding towns)

TZ cap by player level:
- clvl ≤ 45: zone's alvl + 2, capped at 45
- clvl 46-70: zone's alvl + 2, capped at 71
- clvl 71+: zone's alvl + 2, capped at 96 (but actual game caps at alvl85)

## Ladder season concept (Phase 6+, deferred)

- Seasonal ladder: fresh economy, new unique items/words exclusive to ladder
- Ladder-only content: additional terror zones, ladder-only words
- Offline characters cannot trade to ladder (as D2R)
- Season duration target: 4 months

## Economy stability targets

- Runes: tier 11+ (high rune equivalent) drop rate ~1 per 8 hours of alvl85 farming
  (targeting the P5 equivalent of D2R's ~1:100,000-per-kill high-rune magnitude; exact
  rune TC chain and per-tier odds in `loot-and-drops.md` § Rune drops)
- Unique: every 10-15 alvl85 kills yields 1 unique appropriate to the zone
- Sets: every 5-8 kills yields 1 set piece
- Gold: incidental — gold sinks designed to prevent hyperinflation (repair costs, merchant buy, gamble)

All rates configurable in TC tables; initial values established from research targets,
adjusted during Phase 5 balance pass.
