# Camera — Isometric + Zoom + Limited Orbit

> Default: fixed isometric angle in the classic ARPG tradition.
> Mouse wheel travels a long zoom rail from close-up 3D detail out to the tactical view.
> Small optional orbit/tilt keeps the 3D feel without breaking ARPG readability.

## Rig

```
CameraRig
├── target        # Vector3 — smoothed follow point (player position + small look-ahead)
├── yaw           # radians around Y, default 0 (world "south-over-shoulder")
├── pitch         # radians below horizontal, function of zoom (see rail)
├── dist          # meters along boom, wheel-controlled
└── camera        # PerspectiveCamera, fov = f(dist)
```

Position each frame (render-rate, after interpolation):

```
boom  = (cos(pitch)·sin(yaw), sin(pitch), cos(pitch)·cos(yaw)) · dist
camera.position = target + boom
camera.lookAt(target)
```

All parameters critically damped (`smoothTime ≈ 0.12 s` for target, `0.20 s` for dist/yaw)
— no springiness, no overshoot.

## The zoom rail

Zoom is one scalar `z ∈ [0, 1]` (wheel input, exponential steps, ~14 detents). `dist`,
`pitch`, and `fov` are all functions of `z` so the framing stays composed at every stop:

| z | dist | pitch | fov | reads as |
|---|---|---|---|---|
| 0.0 (min) | 4 m | 18° | 50° | over-the-shoulder showcase — gear/rig detail, screenshots |
| 0.35 | 10 m | 38° | 45° | action camera — melee combat comfortable |
| 0.7 (default) | 18 m | 52° | 40° | classic ARPG framing — combat + tactics |
| 1.0 (max) | 28 m | 58° | 36° | tactical — ranged builds, big pulls |

- Piecewise-smooth (Catmull-Rom over the keyframes above).
- Default spawn at `z = 0.7`. Double-tap wheel-click returns to default.
- **Gameplay fairness rule:** interest radius, aggro ranges, and projectile logic are
  sim-side constants independent of zoom. Zooming out reveals more pixels, never more
  entities than the AoI provides (AoI ≥ max-zoom visible area + margin).

## Limited orbit & tilt

- **Orbit:** hold middle-mouse (or `Q`/`E`) → yaw within **±45°** of home; release
  eases back to nearest 15° detent; `Home` key snaps to 0. Rationale: full free orbit breaks
  the isometric readability D2 combat assumes (aim, kiting, doorway play); ±45° is enough to
  peek behind walls and enjoy parallax.
- **Tilt:** at `z < 0.35` only, vertical middle-mouse drag adjusts pitch ±8° for framing.
- Automap overlay and pathing input are yaw-compensated: **click-to-move resolves through a
  ground-plane raycast**, so orbit never changes movement semantics.

## Occlusion & readability

- Structures between camera and player: dither-fade to ~25% opacity (per-instance attribute),
  never fully hidden — silhouette language stays gothic-solid.
- Player + hostiles get a subtle occlusion outline when fully blocked (post pass or
  stencil silhouette) so combat never dies in a doorway.
- Roofs/upper floors of enterable structures collapse (fade + scale-Y) when the player is
  inside — dungeon interiors read like classic ARPG rooms at any zoom.

## Input summary

| Input | Action |
|---|---|
| Wheel | zoom along rail |
| Middle-drag horizontal / `Q` `E` | orbit within ±45° |
| Middle-drag vertical (close zoom only) | tilt ±8° |
| `Home` / wheel-click double-tap | reset yaw / reset zoom |

Gamepad (later phase): right-stick horizontal = orbit, triggers = zoom.

## Implementation notes

- Lives in `src/render/camera.ts`; consumes interpolated player position; zero sim coupling.
- Shake/impulse effects (boss slams) are renderer-local offsets layered on the rig — capped
  amplitude, respects a "reduce motion" accessibility setting.
- Zone ambience may *suggest* a default yaw per zone entrance (e.g., canyon vistas), applied
  only as the ease-back home if the player hasn't touched orbit for 30 s. Never forced.
