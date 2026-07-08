import { describe, expect, it } from "vitest";
import { HostLoop, MAX_FRAME_MS, TICK_MS } from "../../src/game/loop.ts";
import { parseSeed, Session } from "../../src/game/session.ts";
import { Sim } from "../../src/sim/sim.ts";

function makeLoop(seed = 1) {
  const now = 0;
  const world = new Sim(seed);
  const loop = new HostLoop(world, { now: () => now });
  return { world, loop };
}

describe("HostLoop — fixed-tick accumulator", () => {
  it("1000 jittered frames produce exactly floor(elapsed / 40) ticks", () => {
    const { world, loop } = makeLoop();
    loop.start(0);
    let now = 0;
    let elapsed = 0;
    let total = 0;
    let s = 12345; // deterministic LCG jitter (no Math.random in a determinism test)
    for (let i = 0; i < 1000; i++) {
      s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
      const dt = 5 + (s % 30); // 5..34 ms, always < MAX_FRAME_MS
      now += dt;
      elapsed += dt;
      total += loop.frame(now);
    }
    expect(total).toBe(Math.floor(elapsed / TICK_MS));
    expect(world.tick).toBe(total);
  });

  it("clamps a long frame so it can't spiral", () => {
    const { loop } = makeLoop();
    loop.start(0);
    expect(loop.frame(1000)).toBe(Math.floor(MAX_FRAME_MS / TICK_MS)); // 250/40 = 6
  });

  it("freezes on blur and does not catch up on unfreeze", () => {
    const { world, loop } = makeLoop();
    loop.start(0);
    expect(loop.frame(100)).toBe(2); // 100/40 = 2, remainder 20
    const t1 = world.tick;
    loop.freeze();
    expect(loop.frame(10_000)).toBe(0); // away time discarded
    expect(world.tick).toBe(t1);
    loop.unfreeze(10_000);
    expect(loop.frame(10_040)).toBe(1); // only the new 40 ms, no 9.9 s burst
  });

  it("exposes interpolation alpha in [0, 1)", () => {
    const { loop } = makeLoop();
    loop.start(0);
    loop.frame(50); // acc = 10
    expect(loop.alpha).toBeCloseTo(10 / TICK_MS, 10);
    expect(loop.alpha).toBeGreaterThanOrEqual(0);
    expect(loop.alpha).toBeLessThan(1);
  });

  it("does nothing before start", () => {
    const { world, loop } = makeLoop();
    expect(loop.frame(1000)).toBe(0);
    expect(world.tick).toBe(0);
  });
});

describe("Session", () => {
  it("parseSeed reads decimal, hex, and falls back", () => {
    expect(parseSeed("?seed=42")).toBe(42);
    expect(parseSeed("?seed=0xFF")).toBe(255);
    expect(parseSeed("?a=1&seed=7")).toBe(7);
    expect(parseSeed("?foo=1")).toBe(1);
    expect(parseSeed("")).toBe(1);
    expect(parseSeed("?seed=bad", 99)).toBe(99); // hex-looking but no 0x → NaN → fallback
    expect(parseSeed("?seed=-8")).toBe(-8);
  });

  it("drives the loop and reports ticks advanced", () => {
    const sim = new Sim(5);
    const now = 0;
    const session = new Session(sim, { now: () => now });
    session.start(0);
    expect(session.frame(80)).toBe(2);
    expect(sim.tick).toBe(2);
  });
});
