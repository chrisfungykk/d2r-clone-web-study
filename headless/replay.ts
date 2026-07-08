// Headless replay core (determinism.md "Replay & golden tests"). Runs (seed, intentLog) to a
// final state hash plus per-100-tick checkpoints (checkpoints localise a divergence to a
// 4-second window). `--record` drives a scripted walking bot and writes a golden fixture.
//
// headless/ is exempt from the import-boundary rule — it may import src/sim directly.
//
//   node headless/replay.ts --record [seed]   # (re)write tests/replays/walk-around.v0.1.0.json

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Rng } from "../src/sim/rng.ts";
import { Sim } from "../src/sim/sim.ts";
import type { Intent, PlayerId } from "../src/world_api.ts";

export interface IntentLogEntry {
  tick: number; // the tick the intent takes effect on (submitted just before that advance)
  playerId: PlayerId;
  intent: Intent;
}

export interface Checkpoint {
  tick: number;
  hash: number;
}

export interface ReplayResult {
  seed: number;
  ticks: number;
  checkpoints: Checkpoint[];
  finalHash: number;
}

export interface ReplayFixture extends ReplayResult {
  version: string;
  log: IntentLogEntry[];
}

const CHECKPOINT_EVERY = 100;

/** Run a fresh Sim over the intent log and return checkpoints + final hash. */
export function runReplay(seed: number, ticks: number, log: readonly IntentLogEntry[]): ReplayResult {
  const sim = new Sim(seed);
  const byTick = new Map<number, IntentLogEntry[]>();
  for (const e of log) {
    const arr = byTick.get(e.tick);
    if (arr) arr.push(e);
    else byTick.set(e.tick, [e]);
  }
  const checkpoints: Checkpoint[] = [];
  for (let t = 1; t <= ticks; t++) {
    const es = byTick.get(t);
    if (es) for (const e of es) sim.submit(e.playerId, e.intent);
    sim.advance();
    if (t % CHECKPOINT_EVERY === 0) checkpoints.push({ tick: t, hash: sim.stateHash() });
  }
  return { seed, ticks, checkpoints, finalHash: sim.stateHash() };
}

/** Deterministically script a ~1500-tick walk: reissue a move to a nearby walkable point every
 * 120 ticks. Pure of Math.random — uses the seeded Rng so `--record` is reproducible. */
export function recordWalkAround(seed: number, ticks = 1500): IntentLogEntry[] {
  const sim = new Sim(seed);
  const zone = sim.getZone();
  const bot = new Rng(seed ^ 0x5f3759df);
  const log: IntentLogEntry[] = [];
  let baseX = zone.entrance.x;
  let baseZ = zone.entrance.z;
  for (let t = 60; t <= ticks - 60; t += 120) {
    let tx = baseX;
    let tz = baseZ;
    for (let attempt = 0; attempt < 24; attempt++) {
      const cx = baseX + (bot.float("x") - 0.5) * 40;
      const cz = baseZ + (bot.float("z") - 0.5) * 40;
      if (zone.walkAt(cx, cz)) {
        tx = cx;
        tz = cz;
        break;
      }
    }
    log.push({ tick: t, playerId: 0, intent: { t: "move", x: tx, z: tz } });
    baseX = tx;
    baseZ = tz;
  }
  return log;
}

const FIXTURE_VERSION = "0.1.0";
const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(HERE, "..", "tests", "replays", "walk-around.v0.1.0.json");

function record(seed: number): void {
  const ticks = 1500;
  const log = recordWalkAround(seed, ticks);
  const result = runReplay(seed, ticks, log);
  const fixture: ReplayFixture = { version: FIXTURE_VERSION, log, ...result };
  writeFileSync(FIXTURE_PATH, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(
    `wrote ${FIXTURE_PATH}  (seed=${seed} ticks=${ticks} moves=${log.length} finalHash=0x${result.finalHash.toString(16).padStart(8, "0")})`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = process.argv[2];
  if (arg === "--record") {
    record(Number(process.argv[3] ?? 1) | 0);
  } else {
    console.log("usage: node headless/replay.ts --record [seed]");
  }
}
