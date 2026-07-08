import { describe, expect, it } from "vitest";
import { DEFAULT_ZOOM, railSample } from "../../src/render/camera.ts";

// The zoom rail must reproduce the camera.md keyframe table exactly at each detent stop.
const TABLE: readonly { z: number; dist: number; pitch: number; fov: number }[] = [
  { z: 0.0, dist: 4, pitch: 18, fov: 50 },
  { z: 0.35, dist: 10, pitch: 38, fov: 45 },
  { z: 0.7, dist: 18, pitch: 52, fov: 40 },
  { z: 1.0, dist: 28, pitch: 58, fov: 36 },
];

describe("camera zoom rail", () => {
  it("passes exactly through every camera.md keyframe", () => {
    for (const row of TABLE) {
      const s = railSample(row.z);
      expect(s.dist).toBeCloseTo(row.dist, 6);
      expect(s.pitch).toBeCloseTo(row.pitch, 6);
      expect(s.fov).toBeCloseTo(row.fov, 6);
    }
  });

  it("is monotonic between keyframes (dist grows, fov shrinks as you zoom out)", () => {
    let lastDist = -1;
    let lastFov = 999;
    for (let z = 0; z <= 1.0001; z += 0.05) {
      const s = railSample(z);
      expect(s.dist).toBeGreaterThanOrEqual(lastDist - 1e-6);
      expect(s.fov).toBeLessThanOrEqual(lastFov + 1e-6);
      lastDist = s.dist;
      lastFov = s.fov;
    }
  });

  it("clamps out-of-range zoom and defaults to the classic framing", () => {
    expect(railSample(-1).dist).toBeCloseTo(4, 6);
    expect(railSample(2).dist).toBeCloseTo(28, 6);
    expect(DEFAULT_ZOOM).toBe(0.7);
  });
});
