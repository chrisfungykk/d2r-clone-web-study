// Browser entry point. Phase 0 wires the host loop + renderer here (tasks 0.4–0.6).
// For now this is a boot stub so `npm run dev` and `npm run build` are green from B1.
//
// The renderer, UI, and game controller may import ONLY `./world_api.ts` from the
// deterministic side — never `./sim/**` (enforced by scripts/check-sim-purity.mjs).

const app = document.getElementById("app");
if (app) {
  const banner = document.createElement("div");
  banner.style.cssText =
    "position:absolute;left:12px;top:10px;font:12px ui-monospace,monospace;color:#8a8578;";
  banner.textContent = "engine boot stub — Phase 0";
  app.appendChild(banner);
}

export {};
