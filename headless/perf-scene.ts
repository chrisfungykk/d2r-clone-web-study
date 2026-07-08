// Headless perf scene (performance-budget.md "Measurement rig"). Builds a worst-case cluster
// (50 walking dummies + 150 static, all inside the AoI) and runs a fixed number of frames,
// publishing metrics on window.__perf and setting window.__perfDone for scripts/run-perf.mjs.
//
// headless/ is exempt from the import-boundary rule — it composes Sim (src/sim) + Renderer
// (src/render), exactly like main.ts.

import { PerfSampler } from "../src/render/perf-overlay.ts";
import { Renderer } from "../src/render/renderer.ts";
import { Sim } from "../src/sim/sim.ts";

const app = document.getElementById("app");
if (app === null) throw new Error("perf-scene: missing #app");

const sim = new Sim(1);
sim.perfPopulate(50, 150); // 50 walkers + 150 static, near the player

const renderer = new Renderer(app);
renderer.buildZone(sim);
const sampler = new PerfSampler();

const TOTAL = 220;
const WARMUP = 40;
let frame = 0;
let lastFrame = 0;

function step(): void {
  const t0 = performance.now();
  sim.advance();
  sim.advance(); // ~2 ticks/frame to load the sim slice
  const tickMs = performance.now() - t0;

  renderer.render(sim, 0.5);

  const now = performance.now();
  const frameMs = lastFrame > 0 ? now - lastFrame : 1000 / 60;
  lastFrame = now;
  if (frame >= WARMUP) sampler.push(frameMs, tickMs);
  frame += 1;

  if (frame >= TOTAL) {
    const info = renderer.info();
    const m = sampler.compute(info.draws, info.tris, sim.snapshot().entities.length);
    console.log("perf", JSON.stringify(m));
    window.__perfDone = true;
    return;
  }
  requestAnimationFrame(step);
}

requestAnimationFrame(step);
