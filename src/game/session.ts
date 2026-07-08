// Session — the game-side glue that owns the host loop and fans sim events out to the
// renderer / audio / UI. Constructed with an `IWorld` (never the concrete Sim — that is
// wired at the composition root, src/main.ts), so swapping Sim for a Phase-6 ClientWorld is
// invisible here (overview.md invariant 1; world-seam.md rule 4).

import type { IWorld, PlayerId, SimEvent } from "../world_api.ts";
import { HostLoop, type LoopHooks } from "./loop.ts";

/** Parse `?seed=` (decimal or 0x-hex) from a location search string. */
export function parseSeed(search: string, fallback = 1): number {
  const m = /[?&]seed=(-?(?:0x)?[0-9a-f]+)/i.exec(search);
  if (!m || m[1] === undefined) return fallback;
  const raw = m[1];
  const n = /^-?0x/i.test(raw) ? Number.parseInt(raw, 16) : Number(raw);
  return Number.isFinite(n) ? n | 0 : fallback;
}

export interface SessionHooks {
  now?: () => number;
  onEvents?: (events: SimEvent[]) => void;
  onRender?: (world: IWorld, alpha: number) => void;
}

export class Session {
  readonly world: IWorld;
  readonly playerId: PlayerId = 0;
  private readonly loop: HostLoop;
  private readonly hooks: SessionHooks;
  private rafId = 0;
  private detach: (() => void) | null = null;

  constructor(world: IWorld, hooks: SessionHooks = {}) {
    this.world = world;
    this.hooks = hooks;
    const loopHooks: LoopHooks = {
      now: hooks.now ?? (() => performance.now()),
      onRender: (alpha) => this.hooks.onRender?.(this.world, alpha),
    };
    this.loop = new HostLoop(world, loopHooks);
  }

  /** Advance one animation frame and fan out any events. Returns ticks advanced. */
  frame(nowMs?: number): number {
    const ticks = this.loop.frame(nowMs);
    const events = this.world.drainEvents();
    if (events.length > 0) this.hooks.onEvents?.(events);
    return ticks;
  }

  start(nowMs?: number): void {
    this.loop.start(nowMs);
  }

  stop(): void {
    this.loop.stop();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.detach?.();
    this.detach = null;
  }

  get alpha(): number {
    return this.loop.alpha;
  }

  /** Browser driver: rAF loop + freeze on tab blur. Not used in headless tests. */
  attach(): void {
    this.start();
    const tick = () => {
      this.frame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
    const onVis = () => {
      if (document.hidden) this.loop.freeze();
      else this.loop.unfreeze();
    };
    document.addEventListener("visibilitychange", onVis);
    this.detach = () => document.removeEventListener("visibilitychange", onVis);
  }
}
