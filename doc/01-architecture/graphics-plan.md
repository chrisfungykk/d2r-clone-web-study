# Graphics Plan — Visual-Quality Tiers & Step Roadmap

> **Scope.** This doc is the *visual-quality* plan: how we make the scene look moody-gothic
> and read cleanly, in tiers, without breaking the frame budget. It is layered **on top of**
> `rendering.md`, which stays the canonical **pipeline + seam contract** (layers, procedural
> assets, animation model, what the renderer may never do). Where this doc and
> `performance-budget.md` disagree on a number, **`performance-budget.md` wins** — it is
> CI-gated canon (see §7).
>
> This plan adapts the world-of-claudecraft (WoC) visual approach — procedural everything,
> PMREM/IBL lighting, a fixed post stack, instanced scatter — to an isometric, dark-fantasy
> ARPG with a long zoom rail (`camera.md`). Every claim here is a *render-side* concern: none
> of it may touch `src/sim`, and none of it changes a single view DTO.

---

## 1. Visual pillars

The look is decided by three pillars and three deliberate exclusions. Everything downstream
(tiers, lighting, post) exists to serve them.

1. **Readability wins at the 18 m default detent.** The zoom rail (`camera.md`) spawns at
   `z = 0.7` (dist 18 m, pitch 52°, fov 40°) — this is the framing 90% of play happens in.
   Silhouette separation of player, hostiles, and ground loot at 18 m is the top acceptance
   test for every visual step. Detail that only reads at the 4 m showcase detent is a bonus,
   never a cost we pay at 18 m.
2. **Desaturated base, saturated accents.** The world palette sits low-chroma (stone, ash,
   bark, tarnished metal). Saturation is *reserved* as a signalling channel: rarity colors on
   ground-item beams, elemental tints on missiles/auras, champion/unique tints on monsters.
   The eye tracks color because color means something.
3. **Heavy fog is a feature, not a veil.** Exponential-squared fog both sells gothic mood and
   is our cheapest LOD: it hides the far LOD ring transition, caps overdraw, and tightens at
   far zoom (`rendering.md` "far view tightens fog") so a big pull never becomes visual soup.

**Exclusions vs WoC** (things WoC does that we intentionally do *not*):

| WoC feature | Here | Why |
|---|---|---|
| Day/night cycle | **Cut.** Fixed per-zone lighting mood. | ARPG zones are authored moods; a cycle fights readability and adds sim-adjacent state. |
| Depth of field | **Cut.** | DoF blurs the tactical read at far zoom and eats GPU we spend on bloom + grade instead. |
| Free orbit | **±45° only** (`camera.md`). | Full orbit breaks isometric aim/kiting readability the combat assumes. |

---

## 2. Quality tiers — `src/render/gfx.ts`

`src/render/gfx.ts` owns a single frozen `GfxTier` object chosen once at boot. Every render
subsystem reads its knobs from this object — no subsystem hardcodes a quality decision. There
are three tiers: `low`, `high`, `ultra`.

```ts
// src/render/gfx.ts — chosen at boot, frozen, read everywhere in src/render
export type TierName = "low" | "high" | "ultra";

export interface GfxTier {
  name: TierName;
  pixelRatioCap: number;   // devicePixelRatio is clamped to this
  shadows: "blob" | "1024" | "2048";
  terrainMaterial: "lambert" | "standard";  // lit model for terrain/props
  maxParticles: number;    // FxLayer pool ceiling (≤ perf-budget 4,000)
  scatterDensity: number;  // 0..1 multiplier on non-collidable prop scatter
  pointLightPool: number;  // dynamic point lights (torches, spell glows)
  gtao: boolean;           // ground-truth AO post pass
}

export const TIERS: Record<TierName, GfxTier> = {
  low:   { name: "low",   pixelRatioCap: 1.0, shadows: "blob", terrainMaterial: "lambert",  maxParticles: 1200, scatterDensity: 0.35, pointLightPool: 0, gtao: false },
  high:  { name: "high",  pixelRatioCap: 1.5, shadows: "1024", terrainMaterial: "standard", maxParticles: 2800, scatterDensity: 0.70, pointLightPool: 4, gtao: false },
  ultra: { name: "ultra", pixelRatioCap: Math.min(2, DEVICE_DPR), shadows: "2048", terrainMaterial: "standard", maxParticles: 4000, scatterDensity: 1.0, pointLightPool: 8, gtao: true },
};
```

| Knob | `low` | `high` | `ultra` |
|---|---|---|---|
| Pixel-ratio cap | 1.0 | 1.5 | `min(2, device)` |
| Shadows | blob only | 1024² cascade | 2048² cascade |
| Lit material | `MeshLambertMaterial` | `MeshStandardMaterial` | `MeshStandardMaterial` |
| Particle pool | 1,200 | 2,800 | 4,000 |
| Scatter density | 0.35 | 0.70 | 1.0 |
| Point-light pool | 0 | 4 | 8 |
| GTAO post pass | off | off | on |

**Lambert vs Standard.** `low` swaps `MeshStandardMaterial` → `MeshLambertMaterial` for
terrain and props: no metallic-roughness BRDF, no env-map sampling, half the fragment cost on
an integrated GPU. Emissive/accent materials (beams, missiles) stay unlit-additive on all
tiers so signalling color never depends on the tier.

**Tier selection & alignment with settings.** The Video tab (`settings-and-menus.md`) exposes
player-facing labels; `gfx.ts` maps them onto tiers. The Video-tab labels are canon for the
UI; `gfx.ts` names are internal.

| Video-tab setting | Option | Effect on `GfxTier` |
|---|---|---|
| **Quality** | Low / Medium / High | selects tier `low` / `high` / `ultra` |
| **Shadows** | Off / Blob only / Full | forces `shadows` to none / `blob` / tier default |
| **Post-processing** | Off / Fog only / Full | see §4 composer gating |
| **FPS limit** | 30 / 60 / Unlimited | frame cap; also the target the auto-probe defends |
| **Show FPS** | Off / On | toggles the `?perf=1` overlay (`performance-budget.md`) |

- **`?lowgfx=1` URL flag** hard-pins `low` before any probing (kiosks, screenshots, repro).
- **Auto-downgrade fps probe.** For the first ~4 s after the first in-game zone loads, a probe
  watches p95 frame time against the active FPS-limit target. Two consecutive windows over
  budget step the tier down one notch (`ultra→high→low`) and surface a one-time toast. The
  probe **never steps up** (avoids oscillation); the player can re-raise Quality manually. On
  `low` it stops.
- **Resolution × pixel-ratio.** The Video tab's **Resolution** (Auto / fixed) sets the drawing
  buffer size; `pixelRatioCap` then clamps `devicePixelRatio` on top. `Auto` tracks the
  viewport; a fixed lower resolution is the strongest single lever on an integrated GPU and is
  the first thing the probe leans on implicitly (fewer fragments) via the tier's cap. The two
  compose — they are never set independently of `gfx.ts`.
- **No gfx setting ever touches the sim.** Tier, resolution, shadows, post, probe — all live
  in `src/render`. Same seed + same intents ⇒ identical sim state on a phone and a workstation;
  only pixels differ. This is the render/sim invariant restated for graphics.

---

## 3. Lighting & IBL

Lighting is image-based (WoC model) but dialed toward gothic gloom.

- **Procedural sky → PMREM.** A `SkyLayer` gradient dome (horizon haze + zenith) is rendered
  once per zone-mood into an offscreen target, then run through `PMREMGenerator` to produce a
  prefiltered environment map. This is the env used by every `MeshStandardMaterial` — one
  bake, reused, regenerated only on a zone-mood change (never per frame).
- **Three-light rig** over the IBL: a hemisphere fill (sky/ground bounce), a key directional
  "sun", and the tier's point-light pool for local warm sources (braziers, spell glow).

```ts
// src/render/light.ts — built once per zone-mood, never per frame.
function buildRig(mood: ZoneMood, tier: GfxTier): LightRig {
  const env = pmrem.fromScene(skyDome(mood)).texture;   // procedural sky → prefiltered IBL
  scene.environment = env;
  scene.environmentIntensity = mood.envIntensity;        // 0.40 outdoor · 0.15 dungeon
  const hemi = new HemisphereLight(mood.skyCol, mood.groundCol, mood.hemi);   // 0.45 / 0.20
  const sun  = new DirectionalLight(mood.keyCol, mood.key);                    // 2.2 / 0.3
  sun.position.copy(azimuthToDir(HOME_YAW, mood.sunElevation));  // fixed vs camera home yaw
  const pool = allocPointLights(tier.pointLightPool);            // 0 / 4 / 8, recycled
  return { env, hemi, sun, pool };
}
```
- **Intensities** (WoC's outdoor sun ≈ 2.8 is dialed to **2.2** for the gothic key; everything
  else follows):

| Zone class | Env (IBL) intensity | Hemi fill | Key/"sun" | Fog |
|---|---|---|---|---|
| Outdoor | ≈ 0.40 | 0.45 | 2.2 | medium, cool |
| Dungeon / interior | 0.15 | 0.20 | 0.3 | dense, near-black |
| Cathedral / lit interior | 0.25 | 0.30 | 1.0 (skylights) | medium |

- **Fixed sun azimuth.** The key light's azimuth is locked **relative to the camera home yaw**
  (`camera.md` yaw 0), so shadows fall consistently regardless of the ±45° orbit — orbiting
  parallax-peeks a wall without swinging every shadow across the screen. Elevation is per-zone.
- **No day/night** (§1): the sun is a constant per zone-mood, not a function of time. There is
  no wall clock on the render side either — mood transitions are event-driven (zone load).

---

## 4. Post stack

One `EffectComposer`, fixed pass order, HDR working target. The chain:

```
EffectComposer (HalfFloat HDR render target, MSAA 4× samples)
  1. RenderPass            scene → HDR
  2. GTAOPass              [ultra only] ground-truth AO, composited into HDR
  3. UnrealBloomPass       threshold 0.85, soft-knee — blooms emissive accents only
  4. OutputPass            HDR → LDR tone-map (ACES-ish) + sRGB
  5. GradeShader (custom)  lift/gamma/gain · vignette · grain · [colorblind-LUT hook]
```

- **GradeShader** is our single color-grade + finishing pass: per-zone lift/gamma/gain
  (the desaturated base of §1 is set here), a soft vignette (focuses the 18 m read), and fine
  film grain (breaks up flat fog gradients cheaply). It carries a **Phase-7 colorblind-LUT
  hook**: a 3D LUT slot that the Accessibility tab's *Colorblind mode*
  (`settings-and-menus.md`: Off / Protanopia / Deuteranopia / Tritanopia) swaps in. Because
  rarity/elements are our saturation channel (§1), the LUT is a first-class accessibility path,
  not an afterthought.

```glsl
// GradeShader uniforms — one full-screen finishing pass (~0.3 ms, §7)
uniform sampler2D tDiffuse;   // tone-mapped LDR from OutputPass
uniform vec3  uLift;          // shadows offset   (per-zone mood)
uniform vec3  uGamma;         // midtone curve
uniform vec3  uGain;          // highlight scale
uniform float uSaturation;    // global desaturation toward the low-chroma base (§1)
uniform float uVignette;      // 0..1 edge falloff, focuses the 18 m read
uniform float uGrain;         // film-grain amount (render-seeded, not sim RNG)
uniform sampler2D uLut;       // Phase-7 colorblind 3D-LUT (identity until wired in G11)
uniform float uLutMix;        // 0 = off; Accessibility "Colorblind mode" drives this
```

- **Composer gating** maps to the **Post-processing** setting: `Off` = RenderPass → OutputPass
  only (no bloom/grade, fog still in-material); `Fog only` = + GradeShader vignette, bloom off;
  `Full` = the whole chain. GTAO is additionally gated to the `ultra` tier.

### Why MSAA 4×, not FXAA

We anti-alias with **MSAA 4× on the HalfFloat HDR target**, not a post FXAA pass:

- **Our edges are geometric, high-contrast, and far away.** Low-poly silhouettes against heavy
  fog present long, near-vertical edges at the 18–28 m detents. MSAA resolves those at true
  sub-pixel geometry coverage; FXAA only guesses from luminance and **smears** exactly the
  crisp silhouettes readability depends on. At far zoom the difference is stark — FXAA turns a
  distant fence into mush.
- **Order matters with HDR bloom.** MSAA resolves *before* tone-map, so bright emissive accents
  (§6 HDR VFX) don't get FXAA's post-tonemap luminance smear crawling along their edges. Bloom
  reads clean coverage-resolved values.
- **A HalfFloat HDR target is required anyway** for the 0.85 bloom threshold and for grade to
  operate in linear light — MSAA on that same target is nearly free versus adding a
  full-screen FXAA read. Cost is bounded and lives in the §7 sub-budget.

MSAA sample count follows the tier implicitly (target created at 4× on `high`/`ultra`, 2× on
`low` where the pixel-ratio cap already softens edges).

---

## 5. Procedural texture kit

All textures are canvas-painted at boot — no binary files (invariant 6). The kit lives in
`src/render/tex/`.

- **Painter registry.** A set of pure canvas painters (`stone`, `ground`, `bark`, `cloth`,
  `metal`, `foliage`, `rune-glow`, …) run once at boot into **256² atlases**. Total boot paint
  cost is held **≤ 1.5 s** — the same budget `performance-budget.md` gives all boot-time
  generation. Painters are deterministic given a seed but use render-owned cosmetic seeds
  (never a sim RNG stream).
- **Height-to-normal.** Painters emit a height field; a shared `heightToNormal(canvas)` pass
  derives a tangent-space normal map (Sobel gradient) so `MeshStandardMaterial` gets relief
  without hand-painted normals. `low` tier skips normal maps (Lambert).
- **4-layer terrain splat via `onBeforeCompile`.** Terrain uses one `MeshStandardMaterial`
  patched through `onBeforeCompile` to blend up to **4 material layers** (e.g. grass / dirt /
  rock / path) from a per-vertex splat weight, plus a detail-tiling term. One material, one
  program, four looks — keeps us under the §6 shader-program budget.

```ts
// themeAt: render-side theme lookup — driven by the seam, sampled at zone-load, cached.
// It reads world.zone().theme ONCE per zone; it NEVER queries the sim per frame or per vertex.
function themeAt(x: number, z: number): RenderTheme {
  return zoneThemeField.sample(x, z);   // field built at zone-load from ZoneView.theme
}
```

- **`themeAt(x, z)` and the world seam.** The renderer reads `world.zone().theme` **once** at
  zone-load (`world-seam.md`: `zone(): ZoneView`) and bakes a local theme field that
  `themeAt` samples for splat weights, palette, and prop selection. Per-frame or per-vertex
  sim queries are forbidden — this is the world-seam rule applied to texturing: the sim owns
  *layout*, the renderer owns *cosmetic surface*.

---

## 6. Terrain, props, entities, VFX

Four layers, each with its own budget discipline. All techniques restate `rendering.md`'s
instancing/pooling defaults with the concrete visual-quality choices.

### Terrain
- **32 m chunks** (matches `performance-budget.md` chunk size), frustum-culled.
- **2 LOD rings + edge skirts.** Near ring full-res heightfield; far ring decimated; **skirts**
  (short downward vertical strips at chunk seams) hide LOD cracks without stitching.
- **Baked vertex AO.** Cavity/contact darkening baked into a vertex-color channel at chunk
  build (not a runtime pass) — cheap ambient occlusion that survives on `low` where GTAO is
  off. GTAO (§4) layers on top for `ultra`.

### Props
- **`InstancedMesh` when drawn > 3×** (the global instancing default). Rocks, fences, ruined
  columns, foliage → one instanced draw per prop-mesh × material.
- **Static `mergeGeometries` per chunk** for the fixed, non-instanced dressing of a chunk
  (unique clutter): merged into a single geometry so a chunk's static set is one draw.
- **Wind sway + per-instance HSL jitter.** A vertex-shader wind term (cheap sinusoid, phase by
  instance) sways foliage; a per-instance **HSL jitter** attribute varies hue/sat/lum slightly
  so an instanced forest doesn't read as clones. Jitter stays inside the low-chroma band (§1).

### Entities
- **Pose-curve rigs** (`rendering.md` animation model): logical `anim.state/frame` from the
  view drives procedural pose curves — no imported skeletal clips. Frame-honest (a 13-frame
  attack presents over 13 ticks).
- **Material factory ≤ 40 shader programs.** All entity materials come from one factory that
  interns programs by feature set (skinned? emissive? tinted?). Hard ceiling **40 programs**
  total across the entity layer — protects compile time and draw-state churn.
- **Champion/unique tint via instance attributes.** Monster mods (champion, unique, elemental)
  are per-instance color/emissive attributes on the shared family material — no material forks,
  no extra programs (restates `rendering.md`).

### HDR VFX
- **Emissive cores ×2.5.** Missiles, on-hit sparks, aura cores, rarity beams write emissive
  above 1.0 (core multiplier ≈ **2.5**) into the HDR target so the §4 bloom threshold (0.85)
  catches them and they glow. This is *the* mechanism that makes saturated accents pop out of
  the desaturated base — the entire look of pillar 2 depends on HDR emissive + threshold bloom.

---

## 7. Budget reconciliation (normative)

**`performance-budget.md` always wins.** It is the CI-gated ceiling; this doc may only set
*targets at or under* it and add *new sub-budgets that fit inside* its slices. If a number here
ever exceeds it, this doc is wrong and must change. The GPU post sub-budgets below are carved
out of the existing **Draw ≤ 4 ms** / **Renderer scene update ≤ 3 ms** frame slices.

| Metric | `performance-budget.md` ceiling (CI) | This-doc target | Notes |
|---|---|---|---|
| Draw calls / frame | **350** (hard, asserted) | < 300 | WoC recorded < 300; leave headroom for fx bursts |
| Triangles / frame | **1.5 M** (hard, asserted) | 1.2 M | far LOD + skirts keep the far ring cheap |
| Particles | **4,000** quads | tier-scaled (§2) | `low` caps at 1,200 |
| Boot texture/mesh gen | **≤ 1.5 s** | ≤ 1.5 s | painter registry (§5) shares this budget |
| **New GPU sub-budgets (render-side, inside Draw slice)** | | | |
| Bloom pass | — | **≤ 1.2 ms** | UnrealBloom, all tiers with Post = Full |
| GTAO pass | — | **≤ 3 ms** | `ultra` only; skipped elsewhere |
| GradeShader pass | — | **≤ 0.3 ms** | single full-screen pass, incl. LUT |
| Shadow render | — | **≤ 1.5 ms** | 1024²/2048² cascade; `low` blob ≈ 0 |

These sub-budgets are dashboard-tracked via the `?perf=1` overlay and the headless perf scene;
they are advisory targets *within* the hard, CI-asserted ceilings above — not new CI gates
unless promoted in `performance-budget.md`. Any change to a **hard** ceiling happens in
`performance-budget.md` first; this table follows.

---

## 8. Step roadmap — G0…G11

The graphics work ships as eleven independently-landable steps. Each is **screenshot-
verifiable** (a specific visual acceptance shot at the 18 m detent unless noted) and slots into
the implementation phases (`phases.md`). No step regresses a CI budget; each re-runs the perf
scene.

| Step | Phase slot | Deliverable | Screenshot / accept check |
|---|---|---|---|
| **G0** | 0.5 / 0.6 | Renderer v0: Lambert materials, vertex-color terrain, **no composer**, blob shadows only. Bare `IWorld` view. | Character walks a lit, vertex-colored zone at 60 fps; silhouettes read at 18 m. |
| **G1** | 0.7 | `gfx.ts` tiers + `?lowgfx=1` + auto-downgrade probe; wires `?perf=1` overlay counters. | Same scene at `low`/`high`/`ultra` side-by-side; overlay shows draw calls/tris/heap. |
| **G2** | 1 | Procedural texture kit: painter registry, height-to-normal, 4-layer splat via `onBeforeCompile`, `themeAt`. | Terrain shows 4 blended materials + relief; boot gen ≤ 1.5 s logged. |
| **G3** | 1 | Post stack: EffectComposer, HDR target, **MSAA 4×**, UnrealBloom (0.85), OutputPass, GradeShader (lift/gamma/gain + vignette + grain). | Graded, bloomed frame; emissive test-quad glows; Post = Off/Fog/Full all valid. |
| **G4** | 1 | IBL: procedural sky → PMREM env; three-light rig; outdoor vs dungeon intensity sets; fixed sun azimuth. | Standard materials show env reflections; dungeon reads near-black, outdoor 2.2 key. |
| **G5** | 1 | Entity rigs + material factory: pose-curve animation, ≤ 40 programs, champion tint via instance attrs. | Monster family walk/attack/hit/death cycles; a champion tint variant beside base. |
| **G6** | 2 | Rarity ground-item beams: HDR emissive cores ×2.5, rarity-colored, bloom-catching; label overlay sync. | Magic/rare/set/unique beams distinguishable by color at 18 m and 28 m. |
| **G7** | 3–4 | Prop system: `InstancedMesh` (>3×), per-chunk `mergeGeometries`, wind sway + per-instance HSL jitter. | Dense instanced foliage sways; no visible clone-tiling; draw calls stay < 300. |
| **G8** | 4 | Water + per-act palette themes + weather (rain/snow/dust as pooled particle emitters, tier-scaled). | Each act-mood zone visibly distinct; weather on/off within particle budget. |
| **G9** | 4 | Occlusion & roof system (`camera.md`): dither-fade occluders to 25%, blocked-combatant outline, roof collapse on interior entry. | Player never lost behind a wall/doorway; roofs fade+scale-Y when inside. |
| **G10** | 5 | GTAO (ultra) + endgame perf hardening: worst-case brawl at max entities/missiles/fx holds ceilings. | Perf scene green at 350-draw / 1.5 M-tri ceilings; GTAO ≤ 3 ms on `ultra`. |
| **G11** | 7 | Juice + accessibility + final hardening: shake polish (respects Reduce motion), colorblind-LUT wired to GradeShader, grain/vignette final tune, screenshot-diff regression gate. | Colorblind modes swap LUT; Reduce motion caps shake; visual-diff baseline locked. |

**Landability rules.** Each step (a) leaves `main` shippable, (b) is gated behind `gfx.ts`
where it could regress low-end, (c) adds/updates its perf-scene assertions, and (d) never
alters a view DTO, a sim result, or a golden replay — graphics is pure presentation. Steps
before their phase slot are not pulled forward without editing the phase docs first
(`CLAUDE.md` workflow rule).

---

## What the visual layer may never do

The quality plan inherits every renderer constraint from `rendering.md` and adds none of its
own escape hatches. Restated as visual-quality invariants:

- **Never read the sim per frame or per vertex for looks.** Theme, palette, and prop selection
  come from `world.zone().theme` at zone-load only (§5). Gameplay numbers stay display-only.
- **Never let a gfx knob change a sim result.** Tier, resolution, shadows, post, probe, grain —
  a screenshot on `low` and `ultra` differs in pixels, never in world state (§2).
- **Never fork a material to encode content.** Champion/unique/element variation is instance
  attributes on shared programs; the entity factory stays ≤ 40 programs (§6).
- **Never exceed a hard ceiling to buy a look.** Sub-budgets fit inside `performance-budget.md`;
  if a visual costs more, the visual loses (§7).
- **Never ship a step that regresses low-end.** Every G-step is gated behind `gfx.ts` and
  re-runs the perf scene before landing (§8).

## Cross-references

- `rendering.md` — canonical pipeline, scene layers, procedural-asset philosophy, seam rules.
- `camera.md` — zoom rail (18 m default detent), ±45° orbit, occlusion/roof behavior (G9).
- `performance-budget.md` — the CI-gated ceilings this doc reconciles against (§7 — it wins).
- `settings-and-menus.md` — Video/Accessibility tab option names the tiers and post gating bind to.
- `phases.md` — phase slots for G0…G11.
- `world-seam.md` — `zone(): ZoneView` is the only source for `themeAt` (§5).
