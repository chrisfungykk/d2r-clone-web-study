// Host loop — the accumulator that turns real (wall-clock) time into fixed 25 Hz sim ticks
// (overview.md "Frame loop", determinism.md "The 25 Hz tick").
//
// The sim never reads time; the host owns it and calls `world.advance()` the right number of
// times. This module lives in src/game (it may touch DOM/timers) and imports only the seam.
//
//   • TICK_MS = 40 (25 Hz), constant, never derived from the clock.
//   • Frame dt is clamped to MAX_FRAME_MS so a long stall can't trigger a catch-up spiral.
//   • On tab blur the loop freezes: time does not accumulate, and unfreeze resets the clock
//     so the away-time gap is discarded (no burst of ticks on return).
//   • `frame()` returns the number of ticks advanced — used by the headless timing test.

import type { IWorld } from "../world_api.ts";

export const TICK_MS = 40;
export const MAX_FRAME_MS = 250;

export interface LoopHooks {
  /** Injectable clock: performance.now() in the browser, a fake in tests. */
  now: () => number;
  /** Called once per sim tick (game applies queued intents / per-tick logic). */
  onTick?: () => void;
  /** Called once per frame with interpolation alpha in [0, 1). */
  onRender?: (alpha: number) => void;
}

export class HostLoop {
  private readonly world: IWorld;
  private readonly hooks: LoopHooks;
  private acc = 0;
  private last = 0;
  private running = false;
  private frozen = false;
  private _lastTickMs = 0;

  constructor(world: IWorld, hooks: LoopHooks) {
    this.world = world;
    this.hooks = hooks;
  }

  start(nowMs = this.hooks.now()): void {
    this.running = true;
    this.frozen = false;
    this.last = nowMs;
    this.acc = 0;
  }

  stop(): void {
    this.running = false;
  }

  /** Tab blur: stop accumulating time. */
  freeze(): void {
    this.frozen = true;
  }

  /** Tab focus: resume without catching up the away-time gap. */
  unfreeze(nowMs = this.hooks.now()): void {
    this.frozen = false;
    this.last = nowMs;
    this.acc = 0;
  }

  get alpha(): number {
    return this.acc / TICK_MS;
  }

  /** Wall-clock ms spent in sim advances during the last frame (perf overlay). */
  get lastTickMs(): number {
    return this._lastTickMs;
  }

  /** Advance real time to `nowMs`, running whole ticks; returns ticks advanced this frame. */
  frame(nowMs = this.hooks.now()): number {
    if (!this.running) {
      this.last = nowMs;
      return 0;
    }
    let dt = nowMs - this.last;
    this.last = nowMs;
    if (this.frozen) {
      this.acc = 0;
      return 0;
    }
    if (dt < 0) dt = 0;
    if (dt > MAX_FRAME_MS) dt = MAX_FRAME_MS; // clamp — no spiral of death
    this.acc += dt;

    let ticks = 0;
    const tickStart = this.hooks.now();
    while (this.acc >= TICK_MS) {
      this.world.advance();
      this.hooks.onTick?.();
      this.acc -= TICK_MS;
      ticks += 1;
    }
    this._lastTickMs = ticks > 0 ? this.hooks.now() - tickStart : 0;
    this.hooks.onRender?.(this.alpha);
    return ticks;
  }
}
