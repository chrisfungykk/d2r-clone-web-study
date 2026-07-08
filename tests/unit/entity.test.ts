import { describe, expect, it } from "vitest";
import { EntityPool } from "../../src/sim/entity.ts";

const spawn = (pool: EntityPool, x = 0, z = 0) =>
  pool.spawn({ kind: "monster", archetype: "dev", x, z, tick: 0 });

describe("EntityPool — pooled, id-ordered store", () => {
  it("issues monotonic ids and looks up by id", () => {
    const pool = new EntityPool(16);
    const a = spawn(pool);
    const b = spawn(pool);
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
    expect(pool.get(a.id)).toBe(a);
    expect(pool.get(999)).toBeUndefined();
  });

  it("recycling a slot never perturbs id-order iteration", () => {
    const pool = new EntityPool(16);
    const e1 = spawn(pool);
    const e2 = spawn(pool);
    const e3 = spawn(pool);
    pool.despawn(e2); // frees a middle slot
    const e4 = spawn(pool); // reuses e2's slot but gets a higher id
    const e5 = spawn(pool);

    const ids = pool.live().map((e) => e.id);
    expect(ids).toEqual([e1.id, e3.id, e4.id, e5.id]);
    // strictly increasing (id order), regardless of slot reuse
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ids are never reused after despawn", () => {
    const pool = new EntityPool(16);
    const a = spawn(pool);
    pool.despawn(a);
    const b = spawn(pool);
    expect(b.id).not.toBe(a.id);
    expect(b.id).toBeGreaterThan(a.id);
  });

  it("despawn removes from the live list and marks not alive", () => {
    const pool = new EntityPool(16);
    const a = spawn(pool);
    expect(pool.liveCount).toBe(1);
    pool.despawn(a);
    expect(pool.liveCount).toBe(0);
    expect(a.lifecycle.alive).toBe(false);
    expect(pool.get(a.id)).toBeUndefined();
    pool.despawn(a); // idempotent
    expect(pool.liveCount).toBe(0);
  });

  it("throws when the pool is exhausted", () => {
    const pool = new EntityPool(2);
    spawn(pool);
    spawn(pool);
    expect(() => spawn(pool)).toThrow(/exhausted/);
  });

  it("recycles freed slots so capacity is about live count, not total spawns", () => {
    const pool = new EntityPool(2);
    const a = spawn(pool);
    spawn(pool);
    pool.despawn(a);
    expect(() => spawn(pool)).not.toThrow(); // slot freed by despawn is reusable
  });
});
