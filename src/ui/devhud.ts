// Dev HUD (B6) — seed readout, reroll, and the perf-overlay mount point (?perf=1 lands in B7).
// UI-side: DOM only, imports nothing from src/sim. The overlay is pointer-events:none except
// its controls, so it never eats a click meant for the ground (click-through is impossible).

export class DevHud {
  private readonly root: HTMLDivElement;
  private readonly info: HTMLPreElement;
  readonly perfMount: HTMLDivElement;

  constructor(container: HTMLElement, seed: number) {
    this.root = document.createElement("div");
    this.root.style.cssText =
      "position:absolute;inset:0;pointer-events:none;font:12px ui-monospace,monospace;color:#cfc9bd;";

    this.info = document.createElement("pre");
    this.info.style.cssText = "position:absolute;left:12px;top:10px;margin:0;white-space:pre;";
    this.root.appendChild(this.info);

    const reroll = document.createElement("button");
    reroll.textContent = "reroll seed";
    reroll.style.cssText =
      "position:absolute;left:12px;top:64px;pointer-events:auto;font:12px ui-monospace,monospace;" +
      "background:#1b1b20;color:#cfc9bd;border:1px solid #3a3a42;padding:4px 8px;cursor:pointer;";
    reroll.addEventListener("click", () => {
      const next = ((seed * 1103515245 + 12345) >>> 0) % 1_000_000;
      const url = new URL(window.location.href);
      url.searchParams.set("seed", String(next));
      window.location.href = url.toString();
    });
    this.root.appendChild(reroll);

    this.perfMount = document.createElement("div");
    this.perfMount.style.cssText = "position:absolute;right:12px;top:10px;pointer-events:none;";
    this.root.appendChild(this.perfMount);

    container.appendChild(this.root);
    this.info.textContent = `seed ${seed}`;
  }

  update(tick: number, entityCount: number, alpha: number): void {
    this.info.textContent = `Phase 0 — walk the zone\nseed · tick ${tick}  entities ${entityCount}  α ${alpha.toFixed(2)}\nleft-click: move   wheel: zoom   Q/E: orbit   Home: reset`;
  }

  destroy(): void {
    this.root.remove();
  }
}
