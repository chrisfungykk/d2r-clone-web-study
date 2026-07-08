import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// The gate scripts are the authoritative determinism enforcers (Windows-portable Node).
// We unit-test their exported helpers here so a regression in the checker fails CI.
import { checkBoundary, checkPurity } from "../../scripts/check-sim-purity.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("sim purity checker", () => {
  it("flags Math.random", () => {
    const v = checkPurity("src/sim/x.ts", "export const r = Math.random();");
    expect(v.map((x) => x.rule)).toContain("Math.random");
  });

  it("flags transcendental Math.* but allows Math.sqrt/abs/floor", () => {
    const bad = checkPurity("src/sim/x.ts", "const a = Math.sin(x); const b = Math.atan2(y, x);");
    expect(bad).toHaveLength(2);
    const ok = checkPurity("src/sim/x.ts", "const a = Math.sqrt(x) + Math.abs(y) + Math.floor(z);");
    expect(ok).toHaveLength(0);
  });

  it("flags Date, performance, timers, DOM globals", () => {
    const src = "const t = Date.now(); performance.now(); setTimeout(f, 1); window.x; document.y;";
    const rules = checkPurity("src/sim/x.ts", src).map((x) => x.rule);
    expect(rules).toEqual(
      expect.arrayContaining(["Date", "performance", "setTimeout", "window", "document"]),
    );
  });

  it("flags three imports", () => {
    const v = checkPurity("src/sim/x.ts", 'import * as THREE from "three";');
    expect(v.map((x) => x.rule)).toContain("import 'three'");
  });

  it("ignores banned tokens that appear only in comments", () => {
    const v = checkPurity("src/sim/x.ts", "// uses Math.random and new Date here\nexport const a = 1;");
    expect(v).toHaveLength(0);
  });
});

describe("import-boundary checker", () => {
  it("flags a render/ui/game file importing from src/sim, but allows world_api", () => {
    const fixture = readFileSync(join(ROOT, "tests", "fixtures", "lint", "bad-import.txt"), "utf8");
    // Treat the fixture as a game-side source (its imports resolve as if from src/game/).
    const v = checkBoundary("src/game/bad-import.ts", fixture);
    expect(v).toHaveLength(1);
    expect(v[0]?.text).toBe("../sim/sim.ts");
  });

  it("allows a game file importing only the seam", () => {
    const v = checkBoundary("src/game/ok.ts", 'import type { IWorld } from "../world_api.ts";');
    expect(v).toHaveLength(0);
  });
});
