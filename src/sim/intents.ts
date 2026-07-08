// Intent queue (determinism.md, "Intents").
//
// Intents are requests, not commands: the sim validates range/cost/ownership before applying.
// Per tick each player contributes at most one *movement* intent (latest wins) and a bounded
// queue of *discrete* intents (applied in submission order). Movement is drained sorted by
// playerId so multi-player application order is deterministic regardless of submit order.

import type { Intent, PlayerId } from "../world_api.ts";

export interface QueuedIntent {
  playerId: PlayerId;
  intent: Intent;
}

const DISCRETE_CAP = 16; // bounded discrete queue per drain

export class IntentQueue {
  private readonly movement = new Map<PlayerId, Intent>();
  private discrete: QueuedIntent[] = [];

  submit(playerId: PlayerId, intent: Intent): void {
    if (intent.t === "move") {
      this.movement.set(playerId, intent); // latest movement intent wins this tick
    } else if (this.discrete.length < DISCRETE_CAP) {
      this.discrete.push({ playerId, intent });
    }
  }

  /** Movement intents, sorted by playerId (deterministic apply order). Clears the buffer. */
  drainMovement(): QueuedIntent[] {
    const out: QueuedIntent[] = [];
    for (const [playerId, intent] of this.movement) out.push({ playerId, intent });
    out.sort((a, b) => a.playerId - b.playerId);
    this.movement.clear();
    return out;
  }

  /** Discrete intents in submission order. Clears the buffer. */
  drainDiscrete(): QueuedIntent[] {
    const out = this.discrete;
    this.discrete = [];
    return out;
  }

  get pending(): number {
    return this.movement.size + this.discrete.length;
  }
}
