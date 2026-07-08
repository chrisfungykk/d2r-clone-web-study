// Perf instrumentation (?perf=1) — frame-time percentiles, draw calls, triangles, heap, and
// sim tick time. Metrics are published on `window.__perf` (read by scripts/run-perf.mjs) and,
// in-app, rendered by the overlay. Render/UI-side: no src/sim import.

export interface PerfMetrics {
  fps: number;
  p50: number;
  p95: number;
  p99: number;
  draws: number;
  tris: number;
  heapMB: number;
  tickMsAvg: number;
  tickMsMax: number;
  entities: number;
}

declare global {
  interface Window {
    __perf?: PerfMetrics;
    __perfDone?: boolean;
  }
}

interface HeapPerf {
  memory?: { usedJSHeapSize: number };
}

const CAP = 240;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] as number;
}

export class PerfSampler {
  private readonly frameMs: number[] = [];
  private readonly tickMs: number[] = [];

  push(frameMs: number, tickMs: number): void {
    this.frameMs.push(frameMs);
    this.tickMs.push(tickMs);
    if (this.frameMs.length > CAP) this.frameMs.shift();
    if (this.tickMs.length > CAP) this.tickMs.shift();
  }

  /** Compute + publish metrics on window.__perf. */
  compute(draws: number, tris: number, entities: number): PerfMetrics {
    const sorted = [...this.frameMs].sort((a, b) => a - b);
    const p50 = percentile(sorted, 50);
    const heap = (performance as unknown as HeapPerf).memory?.usedJSHeapSize ?? 0;
    const tickAvg = this.tickMs.length ? this.tickMs.reduce((a, b) => a + b, 0) / this.tickMs.length : 0;
    const tickMax = this.tickMs.reduce((a, b) => Math.max(a, b), 0);
    const m: PerfMetrics = {
      fps: p50 > 0 ? 1000 / p50 : 0,
      p50,
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      draws,
      tris,
      heapMB: heap / (1024 * 1024),
      tickMsAvg: tickAvg,
      tickMsMax: tickMax,
      entities,
    };
    window.__perf = m;
    return m;
  }
}

export class PerfOverlay {
  private readonly el: HTMLPreElement;

  constructor(mount: HTMLElement) {
    this.el = document.createElement("pre");
    this.el.style.cssText =
      "margin:0;padding:6px 8px;background:rgba(10,10,14,0.7);color:#9fe0a0;font:11px ui-monospace,monospace;white-space:pre;";
    mount.appendChild(this.el);
  }

  render(m: PerfMetrics): void {
    this.el.textContent =
      `fps ${m.fps.toFixed(0)}  p50 ${m.p50.toFixed(1)} p95 ${m.p95.toFixed(1)} p99 ${m.p99.toFixed(1)} ms\n` +
      `draws ${m.draws}  tris ${(m.tris / 1000).toFixed(0)}k  heap ${m.heapMB.toFixed(0)}MB\n` +
      `tick ${m.tickMsAvg.toFixed(2)}/${m.tickMsMax.toFixed(2)} ms  ents ${m.entities}`;
  }
}
