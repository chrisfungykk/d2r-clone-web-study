# Performance Budget

> Target: 60 fps on mid-range 2020 hardware (integrated GPU tier), playable 30 fps floor on
> low-end. Budgets are CI-checked where possible and dashboard-tracked otherwise.

## Frame budget (16.6 ms @ 60 fps)

| Slice | Budget | Notes |
|---|---|---|
| Sim tick (amortized) | ≤ 4 ms | 25 Hz ⇒ ≤ 1 tick most render frames; tick itself ≤ 8 ms worst case |
| Snapshot + interpolation | ≤ 1 ms | pooled DTOs, no per-frame allocation |
| Renderer scene update | ≤ 3 ms | instance matrix writes, pose solvers, LOD |
| Draw (GPU-bound proxy: CPU submit) | ≤ 4 ms | draw-call ceiling below |
| UI/DOM overlay | ≤ 1.5 ms | label transforms batched, panel updates event-driven |
| Headroom | ≥ 3 ms | GC spikes, browser jank |

## Hard ceilings

| Metric | Ceiling | Enforcement |
|---|---|---|
| Draw calls / frame | 350 | `renderer.info` asserted in E2E perf scene |
| Triangles / frame | 1.5 M | perf scene assert |
| Active animated entities | 220 (mercs+summons+monsters+players) | sim spawn governor |
| Live missiles | 400 | pooled, oldest culled |
| Particles | 4,000 quads | pool cap, LOD-scaled |
| DOM label nodes | 120 | pooled overlay |
| JS heap (steady state) | ≤ 350 MB | perf scene assert |
| Per-frame allocations in steady combat | ~0 (no GC pause > 4 ms) | allocation test w/ forced GC instrumentation |
| Initial load (cold, no cache) | ≤ 3 s to menu, ≤ 6 s to in-game on mid hardware | Lighthouse/benchmark CI |
| Bundle size | ≤ 1.2 MB gzip total JS (Three ~170 KB of it) | CI size check |

Procedural assets make the load budget easy (no texture/model downloads — generation at boot
must stay ≤ 1.5 s, measured).

## Standing strategies

- **Pooling is the default.** Entities, missiles, particles, vectors in hot paths, snapshot
  DTOs, DOM labels. `new` in a per-frame path needs a review justification.
- **Instancing is the default.** Any mesh drawn > 3× is instanced. Monster families budget:
  ≤ 6 instanced draws per family (body parts × materials); ≤ 8 families active per zone.
- **The sim is allocation-disciplined too** — flat typed arrays for spatial hash and
  pathfinding grids; entity components as plain objects created at spawn, mutated in place.
- **Interest scoping caps work.** AoI radius bounds snapshot size, label count, and pose
  solves regardless of zone population.
- **LOD by camera distance** (see `camera.md`): pose solve rate halves beyond 20 m
  (interpolated), particles/fx density scales with zoom, far ring uses static poses.
- **No per-frame material/geometry creation.** All materials built at boot; tints via
  instance attributes.

## Measurement rig

- `?perf=1` overlay: fps, frame-time percentiles (p50/p95/p99), draw calls, triangles,
  heap, sim tick time, entity/particle counts.
- `headless/perf-scene.ts`: scripted worst-case brawl (max entities, max missiles, dense fx)
  driven by bot intents — runs in CI via headless Chrome; asserts ceilings; results
  appended to `doc/perf-history.csv` (gstack `/benchmark` can wrap this).
- Regression rule: p95 frame time +15% vs baseline fails CI (same machine class), matching
  the testing-strategy gates.

## Known heavy spots & planned answers

| Risk | Plan |
|---|---|
| Pathfinding many monsters | flow-field per active player position on coarse grid (recompute ≤ every 5 ticks), local steering per monster; A* only for scripted NPC moves |
| Poison/DoT bookkeeping on hordes | struct-of-arrays effect ring buffers, fixed tick math (frame-based DoTs are cheap by design) |
| Loot label pileups after big fights | label pool + priority (rarity first), Alt-toggle renders only pooled visible set |
| Boss fx bursts | fx budget governor: particle pool pressure drops cosmetic emitters first, never gameplay-relevant telegraphs |
| Shadow cost on iGPU | single 1024² cascade near ring + blob shadows; "shadows off" setting swaps to AO-only, must stay visually acceptable |
