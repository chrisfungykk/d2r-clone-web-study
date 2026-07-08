// Browser entry point / composition root.
//
// The ONE place allowed to import the concrete Sim (src/sim) and hand it to the game/render as
// an IWorld — the import-boundary gate scans src/render|ui|game, not this file, keeping the
// "renderer/UI/game see only the seam" rule intact (overview.md invariant 1).

import { attachInput } from "./game/input.ts";
import { parseSeed, Session } from "./game/session.ts";
import { PerfOverlay, PerfSampler } from "./render/perf-overlay.ts";
import { Renderer } from "./render/renderer.ts";
import { Sim } from "./sim/sim.ts";
import { DevHud } from "./ui/devhud.ts";

const app = document.getElementById("app");
if (app === null) throw new Error("missing #app container");

const seed = parseSeed(location.search, 1);
const sim = new Sim(seed);

const renderer = new Renderer(app);
renderer.buildZone(sim);

const hud = new DevHud(app, seed);

const perfOn = /[?&]perf=1/.test(location.search);
const perfSampler = perfOn ? new PerfSampler() : null;
const perfOverlay = perfOn ? new PerfOverlay(hud.perfMount) : null;
let lastFrame = 0;

const session = new Session(sim, {
  onRender: (world, alpha) => {
    renderer.render(world, alpha);
    hud.update(world.tick, world.snapshot().entities.length, alpha);
    if (perfSampler && perfOverlay) {
      const now = performance.now();
      const frameMs = lastFrame > 0 ? now - lastFrame : 1000 / 60;
      lastFrame = now;
      perfSampler.push(frameMs, session.lastTickMs);
      const info = renderer.info();
      perfOverlay.render(perfSampler.compute(info.draws, info.tris, world.snapshot().entities.length));
    }
  },
});

attachInput(renderer.domElement, {
  pickGround: (x, y) => renderer.pickGround(x, y),
  zoomByDetents: (d) => renderer.zoomByDetents(d),
  orbitBy: (d) => renderer.orbitBy(d),
  resetZoom: () => renderer.resetZoom(),
  resetYaw: () => renderer.resetYaw(),
  moveTo: (x, z) => session.world.submit(session.playerId, { t: "move", x, z }),
});

window.addEventListener("resize", () => renderer.resize());

session.attach();
