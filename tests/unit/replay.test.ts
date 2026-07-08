import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { type ReplayFixture, runReplay } from "../../headless/replay.ts";

const REPLAY_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "replays");

function loadFixtures(): { file: string; fixture: ReplayFixture }[] {
  return readdirSync(REPLAY_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => ({ file, fixture: JSON.parse(readFileSync(join(REPLAY_DIR, file), "utf8")) }));
}

const fixtures = loadFixtures();

describe("golden replays", () => {
  it("has at least one fixture", () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const { file, fixture } of fixtures) {
    describe(file, () => {
      it("reproduces the full checkpoint chain and final hash", () => {
        const r = runReplay(fixture.seed, fixture.ticks, fixture.log);
        expect(r.checkpoints).toEqual(fixture.checkpoints);
        expect(r.finalHash).toBe(fixture.finalHash);
      });

      // Cross-OS is a determinism gate (CI runs this on ubuntu + windows). Two independent
      // Sim instances of the same fixture must agree at every checkpoint.
      it("is bit-identical across two independent Sim instances", () => {
        const a = runReplay(fixture.seed, fixture.ticks, fixture.log);
        const b = runReplay(fixture.seed, fixture.ticks, fixture.log);
        expect(a.finalHash).toBe(b.finalHash);
        expect(a.checkpoints).toEqual(b.checkpoints);
        // and the checkpoints must actually evolve (the bot really walked)
        const hashes = new Set(a.checkpoints.map((c) => c.hash));
        expect(hashes.size).toBeGreaterThan(1);
      });
    });
  }
});
