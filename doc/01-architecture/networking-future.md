# Networking (Phase 6, Deferred)

> Design now, build later. Everything before Phase 6 must keep this doc true without
> implementing any of it. The seam (`world-seam.md`) and intent model (`determinism.md`)
> ARE the netcode preparation — if those stay clean, Phase 6 is additive.

## Model: authoritative server, thin client

The world-of-claudecraft pattern, proven at this exact scope:

```mermaid
sequenceDiagram
    participant C as Client (render + ClientWorld)
    participant S as Server (Node, runs Sim)
    C->>S: intents @ 25 Hz (move / skill / pickup / …)
    S->>S: sim.tick(all players' intents)
    S->>C: interest-scoped snapshot delta + events @ 25 Hz
    C->>C: ClientWorld applies delta; renderer interpolates
```

- **The client is a renderer.** All combat, loot rolls, quest state, trade, gold — server-side.
  The client never rolls RNG for gameplay.
- **Interest scoping** (~40 m AoI, same constant as offline) bounds bandwidth and is already
  how `snapshot()` behaves offline.
- **Sessions are lobbies, not an MMO**: create/join game (max 8 players), difficulty +
  players-count mechanics apply exactly as designed in `02-game-design/`; game dies when
  last player leaves. This matches the classic lobby model and keeps server cost linear.

## Wire protocol

- WebSocket, binary frames (MessagePack or hand-rolled — decided in Phase 6 by measurement).
- The DTOs in `world_api.ts` are the schema. Rule from day one: **every view type stays
  JSON-serializable, no functions/classes/Maps** — CI-checked so the seam never drifts from
  wire-compatibility.
- Snapshot deltas: per-entity dirty masks against last-acked snapshot; full keyframe every
  25 ticks or on AoI entry.
- Events (`SimEvent[]`) stream as-is — they were designed as the render/audio feed and
  double as the network event channel.

## Client-side feel

- **Interpolation-first** (100 ms display buffer), like WoC. Movement prediction for the
  local player only (replay unacked move intents over server state); no combat prediction —
  ARPG combat reads fine at 100 ms with good hit feedback, and mispredicted loot/damage is
  worse than latency.
- Server timestamped ticks; client clock sync via simple EWMA offset.

## Persistence & accounts

- Postgres, JSONB documents — same `CharacterDoc` as offline (`save-persistence.md`),
  written through the server on the same debounce triggers.
- Accounts: email+password or OAuth (decided then); server characters are a separate
  namespace from offline saves (no import — classic open/closed split).
- Shared stash server-side per account; trade is an atomic server transaction with a
  two-sided confirm state machine (WoC-proven pattern).

## Anti-abuse posture (lobby-scale, not MMO-scale)

- Server validates every intent (range, cost, cooldown frames, ownership) — cheating reduces
  to input automation, not state forgery.
- Rate caps per intent type; server-side movement clamps (speed = stat-derived).
- Personal-loot option per lobby (drop allocation tagged per player) vs FFA classic mode —
  decided by game creator; both are pure sim-config.

## What earlier phases must NOT do

- No `postMessage`/worker seams that bypass `IWorld`.
- No renderer reads of sim singletons "because it's offline anyway".
- No gameplay state in UI components.
- No save writes from inside the sim (host-triggered only), so the server host can own
  persistence policy.

## Deployment sketch (Phase 6 decision points)

Single Node process per N lobbies (sim is cheap: 25 Hz × ≤ 8 players × ≤ 220 entities),
Docker Compose (server + Postgres) for self-hosting parity with WoC; horizontal scale =
more processes behind a lobby directory service. Details finalized in the Phase 6 doc
(`05-implementation/phase-6-multiplayer.md`).
