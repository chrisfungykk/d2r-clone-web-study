// Browser entry point / composition root.
//
// main.ts is the ONE place allowed to import the concrete Sim (src/sim) and hand it to the
// game as an IWorld — the import-boundary gate scans src/render|ui|game, not this file, which
// keeps the "renderer/UI/game see only the seam" rule intact (overview.md invariant 1).
//
// B4 wires the deterministic host loop; the renderer + camera arrive in B5/B6.

import { parseSeed, Session } from "./game/session.ts";
import { Sim } from "./sim/sim.ts";

const app = document.getElementById("app");
const banner = document.createElement("div");
banner.style.cssText =
  "position:absolute;left:12px;top:10px;font:12px ui-monospace,monospace;color:#8a8578;white-space:pre;";
app?.appendChild(banner);

const seed = parseSeed(location.search, 1);
const sim = new Sim(seed);

const session = new Session(sim, {
  onRender: (world, alpha) => {
    const snap = world.snapshot();
    banner.textContent = `Phase 0 host loop\nseed ${seed}  tick ${world.tick}  entities ${snap.entities.length}  α ${alpha.toFixed(2)}`;
  },
});

session.attach();
