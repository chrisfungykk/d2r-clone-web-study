// Sim → seam DTO projection. Produces the deep-readonly `EntityView`s the renderer/UI read.
// B3 adds interest-scoping (40 m AoI) and pooled double-buffering here.

import type { EntityView } from "../world_api.ts";
import type { Entity } from "./entity.ts";

export function toEntityView(e: Entity): EntityView {
  return {
    id: e.id,
    kind: e.kind,
    archetype: e.archetype,
    x: e.transform.x,
    z: e.transform.z,
    facing: e.transform.facing,
    // Real (frame-accurate) anim state is computed by the combat/locomotion systems (B6).
    anim: { state: e.lifecycle.alive ? "idle" : "dead", frame: 0, totalFrames: 1 },
  };
}
