// Perf gate — drive the headless perf scene in Chromium against `vite preview` and assert the
// CI-stable budget subset (draw calls, heap, sim tick time). FPS is report-only (SwiftShader
// software WebGL in CI has too much variance to gate). Windows-portable, pure Node.
//
// Requires a production build (dist/) and the Playwright Chromium browser. If the browser is
// not installed it SKIPS (exit 0) so `npm run perf` never blocks a fresh local checkout; CI
// installs the browser explicitly, so the gate really runs there.
//
//   npm run build && npm run perf

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4174;
const URL = `http://localhost:${PORT}/perf.html`;

// CI-gated stable subset (performance-budget.md).
const BUDGET = { draws: 350, heapMB: 350, tickMsAvg: 4, tickMsMax: 8 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  return false;
}

async function main() {
  if (!existsSync(join(ROOT, "dist", "perf.html"))) {
    console.error("run-perf: dist/perf.html missing — run `npm run build` first.");
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("run-perf: SKIP — playwright not installed.");
    process.exit(0);
  }

  let browser;
  try {
    browser = await chromium.launch({
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--enable-precise-memory-info",
      ],
    });
  } catch (e) {
    if (/Executable doesn't exist|playwright install/i.test(String(e))) {
      console.log("run-perf: SKIP — Chromium not installed (`npx playwright install chromium`).");
      process.exit(0);
    }
    throw e;
  }

  const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    shell: true,
    stdio: "ignore",
  });

  let perf;
  try {
    const up = await waitForServer(URL, 30_000);
    if (!up) throw new Error("vite preview did not come up");
    const page = await browser.newPage();
    page.on("pageerror", (err) => console.error("page error:", err.message));
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForFunction(() => window.__perfDone === true, undefined, { timeout: 60_000 });
    perf = await page.evaluate(() => window.__perf);
  } finally {
    await browser.close();
    preview.kill();
  }

  if (!perf) {
    console.error("run-perf: no metrics captured.");
    process.exit(1);
  }

  console.log("run-perf metrics:", JSON.stringify(perf));
  console.log(`fps ${perf.fps.toFixed(0)} (report-only)`);

  const fails = [];
  if (perf.draws > BUDGET.draws) fails.push(`draws ${perf.draws} > ${BUDGET.draws}`);
  if (perf.heapMB > 0 && perf.heapMB > BUDGET.heapMB)
    fails.push(`heap ${perf.heapMB.toFixed(0)}MB > ${BUDGET.heapMB}`);
  if (perf.tickMsAvg > BUDGET.tickMsAvg)
    fails.push(`tickAvg ${perf.tickMsAvg.toFixed(2)} > ${BUDGET.tickMsAvg}`);
  if (perf.tickMsMax > BUDGET.tickMsMax)
    fails.push(`tickMax ${perf.tickMsMax.toFixed(2)} > ${BUDGET.tickMsMax}`);

  if (fails.length > 0) {
    console.error(`run-perf: FAIL — ${fails.join("; ")}`);
    process.exit(1);
  }
  console.log("run-perf: OK — draws/heap/tick within budget.");
}

main().catch((e) => {
  console.error("run-perf: error", e);
  process.exit(1);
});
