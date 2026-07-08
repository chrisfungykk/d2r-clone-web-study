# Rendering Pipeline

> Three.js renderer, 100% procedural assets, built for hundreds of animated entities at 60 fps.
> The renderer is a *view* of `IWorld` — it holds no gameplay state and computes no mechanics.
>
> **This doc is the pipeline + seam contract.** The visual-quality tiers (`gfx.ts` low/high/
> ultra), lighting/IBL values, post stack, procedural texture kit, and the G0…G11 step roadmap
> live in [`graphics-plan.md`](graphics-plan.md), which layers on top of this one.

## Scene architecture

```
Renderer (src/render)
├── TerrainLayer        # chunked heightfield meshes per zone, generated from sim's zone seed params
├── PropLayer           # instanced static props (trees, ruins, fences) from zone generator output
├── EntityLayer         # skinned/rigged procedural creatures + players, pooled + instanced
├── MissileLayer        # pooled projectile meshes/trails
├── GroundItemLayer     # item drop markers + DOM label overlay
├── FxLayer             # particles (hits, deaths, skill vfx), light pool
├── SkyLayer            # gradient dome, fog, weather
└── CameraRig           # see camera.md
```

- One `WebGLRenderer`, one scene graph; layers are `Group`s with explicit update order.
- The renderer consumes `prevSnapshot()`/`snapshot()` + alpha for interpolation, and
  `drainEvents()` (via game layer fan-out) for one-shot effects.

## Procedural assets — no binary files

Same philosophy as world-of-claudecraft ("no 3D model files for the world"):

- **Creatures**: parameterized rigged families. A `MonsterFamily` render-def describes body
  plan (biped/quadruped/serpent/floater/swarm), proportions, palette, and attachment points;
  geometry is generated (capsules/boxes/lathes + noise displacement) and animated by
  code-driven skeletal poses (walk/attack/cast/hit/death cycles as procedural pose curves).
  Champion/unique monster mods tint/scale/add glow via instanced attributes.
- **Characters**: one humanoid rig; class archetypes differ by proportion set, palette, and
  gear overlays. Equipped items swap visible attachment meshes (weapon silhouette classes,
  shield, helm) — visible gear tiers matter in an ARPG.
- **Terrain/props**: heightfield from zone generator (seeded, sim-owned layout data;
  cosmetic displacement renderer-owned), canvas-painted splat textures (2–4 materials per
  zone theme), instanced prop meshes from parametric generators.
- **Textures**: painted at boot into a small atlas set via offscreen canvas (stone, ground,
  cloth, metal, foliage ramps). Item icons: procedurally composed 2D canvas drawings per
  base type + rarity frame.
- **Audio**: WebAudio synthesis (noise-burst hits, filtered sweeps for spells, rarity-tiered
  drop chimes) — spec'd in Phase 7.

**Style target** (descriptors, not copies): low-poly-but-moody gothic dark fantasy; desaturated
palette with strong rarity-color accents; heavy fog; single warm key light + cool ambient;
readability of silhouettes over detail.

## Performance techniques (budgets in `performance-budget.md`)

| Technique | Application |
|---|---|
| `InstancedMesh` everywhere | monster family body parts, props, missiles, ground items — target: one draw call per family-part × material |
| Object pooling | entities, missiles, particles, damage numbers, DOM labels — zero allocation in steady-state frame |
| Chunked terrain | 32×32 m chunks, frustum-culled, 2 LOD rings |
| Palette/tint via instance attributes | champion tints, elemental glows without material forks |
| Single directional light + fake AO | one CSM-lite shadow cascade for near ring; blob shadows beyond; baked vertex AO on terrain |
| DOM overlay for text | item labels, damage numbers, nameplates in a transform-synced overlay — crisper + cheaper than SDF text in-scene |
| Fixed-cost postprocess | fog + vignette + subtle bloom only; all optional in settings |

## Animation model

- Sim owns *logical* animation (`anim: { state, frame, totalFrames }` in `EntityView`) because
  attack/cast/hit-recovery timing is mechanics (frame-accurate breakpoints).
- Renderer maps logical state+frame → procedural pose; visual blending/easing is cosmetic and
  local. A 13-frame attack in the sim is *presented* over exactly 13 ticks (520 ms) — weapon
  speed must be visibly honest, or breakpoint gearing loses its feel.

## Zoom-dependent presentation (see `camera.md`)

- Far (classic tactical view): labels scale up, fx density reduced, LOD ring shifts, fog tightened.
- Near (3D showcase): full-detail rigs, camera-space rim light, gear detail visible.
- LOD/label/fx curves are functions of camera distance, tuned in one place (`render/lod.ts`).

## What the renderer may never do

- Import from `src/sim/**` (only `world_api.ts`).
- Compute gameplay numbers (hit chance, damage, drop identity) — display what views provide.
- Mutate anything it receives.
- Assume entities beyond the interest radius exist.
