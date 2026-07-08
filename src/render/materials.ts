// Material factory (G0) — one cached instance per logical surface.
//
// Renderer-side only: imports `three` and nothing from `src/sim`. G0 uses `MeshLambertMaterial`
// everywhere (no metallic-roughness BRDF, no env sampling) per graphics-plan §2 `low`/G0 scope.
// Colours are the desaturated gothic base of graphics-plan pillar 2 — saturation is reserved as
// a signalling channel for later steps, so nothing here is bright.

import * as THREE from "three";

/** Desaturated gothic base tint per prop archetype (graphics-plan pillar 2). */
function propColor(kind: string): number {
  switch (kind) {
    case "tree":
      return 0x4b5a35; // mossy green-brown
    case "rock":
      return 0x5c5f5b; // cool grey stone
    case "ruin":
      return 0x6f695c; // weathered stone
    default:
      return 0x565651; // neutral fallback
  }
}

export class Materials {
  private terrainMat: THREE.MeshLambertMaterial | undefined;
  private readonly props = new Map<string, THREE.MeshLambertMaterial>();

  /** Vertex-coloured ground material (colour + baked AO live in the geometry's `color` attr). */
  terrain(): THREE.Material {
    let mat = this.terrainMat;
    if (mat === undefined) {
      mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      this.terrainMat = mat;
    }
    return mat;
  }

  /** One shared Lambert material per prop archetype; instances tint it via `instanceColor`. */
  prop(kind: string): THREE.Material {
    const cached = this.props.get(kind);
    if (cached !== undefined) return cached;
    const mat = new THREE.MeshLambertMaterial({ color: propColor(kind) });
    this.props.set(kind, mat);
    return mat;
  }

  dispose(): void {
    this.terrainMat?.dispose();
    this.terrainMat = undefined;
    for (const mat of this.props.values()) mat.dispose();
    this.props.clear();
  }
}
