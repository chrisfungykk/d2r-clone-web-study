// LOD policy (stub — camera.md "Zoom-dependent presentation", rendering.md). Level-of-detail
// curves (pose-solve rate, particle/fx density, label scale, ring shifts) as functions of
// camera distance live here in one place. G0 has no LOD; this fixes the seam so B-phase
// systems tune against a single module. Render-side only.

/** Coarse LOD bucket for a camera distance in metres. */
export type LodBand = "near" | "mid" | "far";

export function lodBand(cameraDistM: number): LodBand {
  if (cameraDistM < 12) return "near";
  if (cameraDistM < 20) return "mid";
  return "far";
}

/** Pose-solve rate multiplier (halves beyond ~20 m per performance-budget.md). Stubbed at 1. */
export function poseSolveRate(_band: LodBand): number {
  return 1;
}
