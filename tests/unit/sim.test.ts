import { describe, expect, it } from "vitest";
import { Sim } from "../../src/sim/sim.ts";

function advance(sim: Sim, n: number): void {
  for (let i = 0; i < n; i++) sim.advance();
}

describe("Sim — deterministic kernel", () => {
  it("same seed ⇒ identical state hash after 10k ticks", () => {
    const a = new Sim(0xc0ffee);
    const b = new Sim(0xc0ffee);
    advance(a, 10_000);
    advance(b, 10_000);
    expect(a.tick).toBe(10_000);
    expect(b.tick).toBe(10_000);
    expect(a.stateHash()).toBe(b.stateHash());
  });

  it("checkpoints match tick-for-tick between two independent instances", () => {
    const a = new Sim(1234);
    const b = new Sim(1234);
    for (let i = 0; i < 500; i++) {
      a.advance();
      b.advance();
      if (i % 100 === 0) expect(a.stateHash()).toBe(b.stateHash());
    }
    expect(a.stateHash()).toBe(b.stateHash());
  });

  it("different seeds ⇒ different state (seed actually drives state)", () => {
    const a = new Sim(1);
    const b = new Sim(2);
    advance(a, 1000);
    advance(b, 1000);
    expect(a.stateHash()).not.toBe(b.stateHash());
  });

  it("advance increments the tick counter and swaps the snapshot buffer", () => {
    const sim = new Sim(42);
    const before = sim.snapshot();
    expect(before.tick).toBe(0);
    sim.advance();
    expect(sim.tick).toBe(1);
    expect(sim.snapshot().tick).toBe(1);
    expect(sim.prevSnapshot().tick).toBe(0);
  });

  it("snapshot is interest-agnostic here but well-formed (entities carry anim)", () => {
    const sim = new Sim(7);
    const snap = sim.snapshot();
    expect(snap.entities.length).toBeGreaterThan(0);
    for (const e of snap.entities) {
      expect(typeof e.id).toBe("number");
      expect(e.anim.state).toBeDefined();
    }
  });

  it("hashing does not mutate state (hash is a pure read)", () => {
    const sim = new Sim(99);
    advance(sim, 100);
    const h1 = sim.stateHash();
    const h2 = sim.stateHash();
    expect(h1).toBe(h2);
  });

  it("drainEvents empties the queue", () => {
    const sim = new Sim(0);
    expect(sim.drainEvents()).toEqual([]);
  });
});
