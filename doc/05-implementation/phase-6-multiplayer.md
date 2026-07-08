# Phase 6 — Co-op Multiplayer

> Goal: authoritative server, lobby-based 8-player co-op, postgres persistence, trade,
> players-count scaling. The seam design from Phase 0 means adding multiplayer is
> *additive* — no render, ui, or sim-system rewrites.

Implements: `01-architecture/networking-future.md`, relevant sections of
`02-game-design/economy.md` (trade, gold dup prevention).

## Tasks

### 6.1 Netcode scaffold
Node server process (single-threaded, runs sim per-lobby), WebSocket handshake, binary
frame protocol using MessagePack over a single connection. Intent serialization round-trip
(test: intents → wire → deserialized → identical hash). Auth v0 (basic session token).
**Accept:** client connects → sends intents → receives snapshots; 8 simultaneous connections
at 25 Hz message rate < 5 MB/s server bandwidth (check budget).

### 6.2 ClientWorld
`ClientWorld implements IWorld` — receives server snapshot deltas (dirty-entity masks) at
25 Hz, maintains interpolation buffer (2 frames + alpha), fans events into the existing
event pipeline (drainEvents shows server events). No prediction (except local-player move
prediction replay — same intents replayed over last received state for instant movement,
server-corrected on next snapshot).
**Accept:** runs existing Phase 4/5 E2E bot scripts unchanged (test: same bot script drives
`Sim` directly or through `ClientWorld`→loopback-server, producing same sequence of moves
and skill uses — final state may differ due to no-prediction determinism, but bot logic
should converge).

### 6.3 Lobby system
Create game (name, password, difficulty, player-count setting, FFA vs personal-loot toggle),
join by name, ready-state, max 8 players per lobby. Lobby list on server. Player-slot
tracking. Host migration on disconnect (last-man-standing becomes host for session control).
**Accept:** create → join → ready → play flow works; 8 clients in one lobby sustained 60 fps
on server (headless benchmark); disconnect → rejoin restores character at town.

### 6.4 Server-side persistence
Postgres (via `pg` or ORM — pick in Phase 6 based on team preference). `accounts` table
(email+hash or OAuth), `characters` table (characterdoc jsonb, account FK), `stash` table
(shared + personal per account). Character write debounce logic moved server-side. Save
format identical to offline (same `CharacterDoc` schema, same `SaveFile` envelope).
**Accept:** character save → crash → reload → correct state; concurrent save from two
sessions on same character atomically serialized (last-write-wins with conflict detection:
tick-based staleness check).

### 6.5 Trade system
Atomic two-sided confirm trade state machine: offer → inspect → both-confirm → commit.
Server-validated: item present before commit, not double-sold, gold within limits. No
drop-trade on ground (no desync surface). Player stash accessible during trade.
**Accept:** trade E2E — items and gold transfer correctly; race-condition test (both
parties confirm simultaneously) processes atomically; trade is cancelled if either
party moves from town or begins combat.

### 6.6 Players-count scaling
`playersCount` per lobby (1–8) affects NoDrop calculation, monster HP, XP, damage, AR per
the research formulas integrated into the sim at tick resolution. Lobby setting may be
changed by host within difficulty (risk: stronger monsters, reward: better NoDrop).
**Accept:** NoDrop P1 vs P3 vs P5 vs P7 breakpoints match research document;
`(n+1)/2` HP/XP formula verified; P8 Hell act 5 boss is extremely hard but possible.

### 6.7 Party system
Party invite + accept, party-mates visible on automap, XP share within 2-screen (AoI) range
with level-gap reduction (35% party bonus, split proportional to levels). Quest completion
shared (nearby party members complete same quest steps). FFA loot vs personal-loot toggle
per lobby settings. Party chat.
**Accept:** XP share math golden tests; quest credit shared for nearby members; FFA loot
allows anyone to pick up; personal loot tagged per player instance (unpickable by others).

### 6.8 Dueling (optional)
Duel button on party member → accept → duel state: reduced damage (**×0.17 = 1/6 PvP damage
penalty**, applied before resists/block per the research PvP penalty), flagged status, no
permanent death. Full pipeline, hostility model, and scope in
`doc/02-game-design/pvp.md` (the leech-vs-player ×0.5 factor is separate — see that doc).
**Accept:** Duel works; damage correctly penalized (×0.17 first, then resists/block); death
returns party member to town with no XP loss.

## Test plan
Loopback E2E suite (2–8 clients automated via headless bot scripts), network jitter
simulation (latency up to 200 ms, packet loss up to 5% — interpolation artifact test),
trade atomicity fuzzing, server crash recovery test, lobby stress test (100 sequential
games).

## Exit criteria
- Two browsers on same network co-op through Normal act 1 (vertical slice full clear).
- Trade loop: drop → trade → equip between two players.
- Players-count 1–8 scaling matches research tables statistically.
- Client tolerates 150 ms latency without visible rubber-banding (interpolation buffer
  tuned).
- No gameplay regression in offline mode (all existing golden replays still pass).
