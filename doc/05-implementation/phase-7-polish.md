# Phase 7 — Polish

> Goal: sound, juice, accessibility, settings, onboarding, UI animation, and hardening to
> final performance budgets. The difference between "works" and "feels good."

Implements: audio synthesis, UI animation design system, accessibility features,
settings menu, title/character-select flows, final perf tuning.

## Tasks

### 7.1 Audio system
WebAudio synthesis engine — no audio files. Categories:
- **Hits/impacts:** band-limited noise bursts per damage type (crunch for phys, sizzle for
  fire, pop for lightning), parametric impact decay by damage magnitude.
- **Spell sounds:** filtered oscillator sweeps per skill-element type (elementalist spells,
  auras, curses), stereo pan from entity position.
- **Footsteps:** textured noise across tile-type palette (stone, dirt, wood, water) stepped
  via sim-walk animation state.
- **UI sounds:** inventory open/close click, potion drink gulp, vendor coin clink, level-up
  fanfare (harmonic ratio burst), item-drop chime (tiered by rarity: bell timbre for magic,
  brass for rare, full harmonic cluster for unique), death/revive sting.
- **Ambient:** filtered brown noise (wind), occasional creak/ring (dungeon), distant
  combat rumble (lowpass-filtered collision events from AoI edge), boss room low drone.
- **Music/stingers:** procedurally generated (Phase 7 will decide: pure-algorithmic or
  built with WebAudio Tone.js as a simple drone + motif system — not composed MIDI).

Audio mixing: gain-compensated categories, master volume + sfx + ambience sliders,
accessibility: mono-panning toggle.
**Accept:** every player action has an audio response; no silence in combat; audio budget
≤ 0.2 ms per frame mixing (on top of existing budget).

### 7.2 Visual juice
- **Damage numbers:** floating text per hit (element-colored, crit enlarged), pooled DOM
  overlay, lifespan 1.2 s.
- **Hit flash:** entity mesh emissive white flash on hit (1 frame at 25 Hz, interpolation
  stretches to ~100 ms render).
- **Death effect:** ragdoll-collapse procedural pose (creatures), dissolve-to-ash (summons).
- **Skill fx pass:** projectile trails (line emission), impact splash (particle burst per
  element color), AoE ground scar (decal ring), aura particle stream (orbiting dots).
- **Level-up / rare drop / quest-complete:** brief full-screen vignette flash, camera ripple.
- **Item pickup:** entity shrink + teleport-to-inventory animation (120 ms, pooled).
- **Champion/unique visual shader:** outline glow via Three.js `OutlinePass` or tinted
  emissive instance attribute (performance choice — instance attribute if passes budget,
  OutlinePass if < 10 unique entities in AoI).
- **Corpse fade:** dissolve over 60 ticks (2.4 s) after loot cleared.
- **Rain/snow/dust weather particles** per zone-spec.
**Accept:** each effect has a toggle-able option in settings; per-effect cost measured and
under budget; effects scale with zoom (more visible close, reduced far).

### 7.3 Accessibility
- Font size scaling (1×–2×).
- Colorblind modes (protanopia/deuteranopia/tritanopia global shader pass toggle).
- Reduce motion: replaces animations (level-up flash → static badge, hit flash → icon) and
  disables camera shake, flips/fast-rotation, particle intensity. Prefers-reduced-motion
  media query auto-detects.
- Mono audio toggle.
- Chat/dialogue font options (serif/sans, high-contrast).
- Key rebinding UI (Phase 7 v0: remap LMB/action/hotkeys — not controller support yet).
- Tooltip delay slider (200 ms–1 s).
**Accept:** each feature works; no regressions in existing tests.

### 7.4 Settings
Settings persisted to localStorage/IndexedDB: graphics (shadow quality, postprocess toggle,
LOD distance bias, resolution scale slider), audio (master/sfx/ambience/UI sliders, mono
toggle, mute), gameplay (quick-cast toggle, item-label auto-show, potion-refill belt toggle,
zoom sensitivity), controls (keybind), accessibility (listed above), save/load (manage
characters, export/import `.json`).
**Accept:** every setting round-trips correctly (set → save → reload → verify); no setting
affects sim determinism (golden replay unchanged by any graphics setting).

### 7.5 Onboarding + menus
Title screen: animated procedural background (zone flyover cinematic — orbit camera over
randomly seeded zone at 1/4 speed). Buttons: Play Offline, Load Character, Settings, Credits.
Character select: roster cards (name, class icon, clvl, difficulty, hardcore symbol, play time),
create new (→ name + class pick), delete, export. Non-hardcore/hardcore toggle at creation.
Loading screen between difficulty/act transitions: procedural pan over zone sketch art
(minimal geometry, high fog) with tip text.
**Accept:** menu flow from cold load → in-game in < 6 s on mid hardware; character create
→ first zone in < 5 interactions.

### 7.6 Perf pass to final budgets
Measure current state vs `performance-budget.md`:
- Draw-call count per zone type — is instancing covering everything it can? Check remaining
  bottlenecks: per-frame allocation profile, GC pause count.
- AoI sensitivity test — worst-case Hell act-boss arena equivalent (wave spawn -> 20+
  monsters + 8 summons + projectiles all in AoI).
- Procedural generation cost — zone gen amortized over first ~5 frames not whole frame
  (> 16 ms budget? → split-gen across frames).
- Shadows: performance with single cascade vs no-shadows. Target: playable 30 fps on
  iGPU with shadows off.
- Texture atlases: verify atlas packing efficient; no unbounded texture creation per zone.
- Memory leak sweep: zone enter/exit 50× in headless → heap steady-state no drift.
**Accept:** all budgets green on reference hardware; `?perf=1` overlay p95 < 14 ms in
worst-case endgame scene.

### 7.7 Credits + polish items
Credits: procedural-title-card roll (speed scroll, no video). Easter-egg-free per IP policy.
Known-bugs document in repo. Catch-all "juicing" pass: test the game for an hour; write
down every moment that feels flat; fix the top 20.

## Test plan
Perf scene passes final budgets, no settings-regression test (golden replay with all
graphics settings high vs low), accessibility toggle tests, audio system node-count latency
budget test (< 32 active nodes, cleanup after effects).

## Exit criteria
- The game sounds like an ARPG — no silent actions.
- Every major action has audio + visual feedback.
- Accessible to colorblind players and motion-sensitive players.
- Gold-master playthrough of full Normal difficulty is enjoyable (not just functional).
- Performance budgets green in worst-case scenarios on reference hardware.
- Settings persist correctly, no gameplay-via-settings exploits.
