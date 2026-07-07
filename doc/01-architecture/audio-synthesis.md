# Audio Synthesis

> No audio files in the repo. All sound is WebAudio-synthesized at runtime — matching the
> procedural-everything ethos. Spec'd for Phase 7; this doc exists so earlier phases can
> stub the audio bus without a rewrite.

## Architecture

```
AudioBus (src/render/audio.ts)
├── SfxPool        # one-shot sounds: hits, drops, UI clicks, skill casts
├── AmbientLayer   # per-zone looping atmosphere (wind, drip, hum)
├── MusicLayer     # procedural dark-ambient generative music
└── VoicePool      # class barks: mana-fail, level-up, low-hp (short noise-shaped bursts)
```

- `AudioBus` is a render-side module. It consumes `SimEvent[]` from `drainEvents()` (via
  the game layer fan-out) and zone metadata from `ZoneView`. It never imports `src/sim`.
- All synthesis uses the Web Audio API (`AudioContext`, `OscillatorNode`,
  `BiquadFilterNode`, `GainNode`, `ConvolverNode`, noise buffers). No `<audio>` elements,
  no fetch of audio files.
- Volume sliders (master/sfx/music/ambient) map to `GainNode` values on their bus.

## SFX synthesis patterns

| Category | Technique | Trigger |
|---|---|---|
| Melee hit | Noise burst (50 ms) → bandpass (800 Hz) → fast decay envelope | `SimEvent { t: "damage", kind: "physical" }` |
| Spell cast | Sine sweep (200→2000 Hz, 150 ms) + filtered noise tail | `SimEvent { t: "damage", kind: elemental }` or cast animation start |
| Elemental hit | Per-element: fire = crackling noise burst + low rumble; cold = high-pass shimmer + pitch-down; lightning = white noise spike + ring-mod | `SimEvent { t: "damage", kind }` |
| Loot drop | Chime: sine cluster (3 harmonics), duration and pitch by rarity. White → short dull click; blue → mid bell; yellow → bright dual-tone; gold → rich 3-note arpeggio; green → warm chord | `SimEvent { t: "drop", rarity }` |
| Potion use | Gulp: filtered noise (200 ms) + pitch-down | Belt key press |
| Death | Low rumble (80 Hz, 500 ms) + filtered noise fade | `SimEvent { t: "death" }` |
| Level up | Rising sine sweep (300→1200 Hz, 400 ms) + shimmer overtones | `SimEvent { t: "levelUp" }` |
| UI click | Short click: band-limited impulse (5 ms) | DOM click events |
| Portal | Resonant hum (120 Hz base + 5th harmonic), looping while near portal entity | Proximity to portal entity |

## Ambient layer

Per-zone ambient from `ZoneView.ambientProfile` (a content-table string mapped to a
synthesis preset):

| Profile | Synthesis |
|---|---|
| `marsh` | Low wind (filtered brown noise) + water drip (random impulses, 1-3/s) + frog chorus (slow sine LFO at 400 Hz, intermittent) |
| `dungeon` | Deep hum (40 Hz drone) + water drip + distant metal clang (impulse every 8-15 s) |
| `desert` | Wind (bandpass noise, slow volume LFO) + sand hiss (high-pass noise at low volume) |
| `jungle` | Dense insect chorus (multiple sine oscillators with random vibrato) + bird call (swept sine, intermittent) + rain (noise) |
| `fortress` | Echo reverb on wind + chain clink impulses + low rumble |
| `void` | Near-silence + very low sub-bass drone + occasional distant tone |
| `town` | Gentle ambient hum + fire crackle (noise bursts at low rate) |

Crossfade: 2 s linear crossfade on zone transition. Ambient volume independent of SFX.

## Music layer (generative)

No composed tracks. Dark ambient generative system:

- **Drone:** 2-3 sine oscillators at consonant intervals (root + 5th + octave), very
  slow random pitch drift (±2 semitones over 30-60 s). Root pitch per act (A1 act I →
  E1 act V, descending = darker).
- **Texture:** filtered noise pad, volume modulated by a slow random envelope (15-45 s
  cycle). Bandpass center wanders 200-800 Hz.
- **Accent:** sparse single-note sine tones (random pentatonic scale degree), one every
  10-30 s, 2 s decay. Combat zones increase accent rate to every 3-8 s.
- **Combat intensity:** on combat start (first `damage` event), crossfade in a faster
  accent rate + raise drone volume 3 dB + add a subtle pulse (16th-note gain LFO at
  current BPM estimate from attack speed). On combat end (no `damage` events for 5 s),
  fade back to exploration state over 4 s.

## Performance

- **Budget:** ≤ 8 active `OscillatorNode`s + 4 `BiquadFilterNode`s + 2 noise sources
  at any time. Web Audio runs on a dedicated thread; CPU cost is negligible vs rendering.
- **Pooling:** SFX pool of 16 voice slots (oldest-steal on exhaustion). Ambient and
  music nodes are persistent (zone lifetime).
- **Latency:** `AudioContext` created on first user gesture; `latencyHint: "interactive"`.
  SFX play on the next audio callback after the event — perceptually instant.

## Mute / settings

- Master mute: `AudioContext.suspend()` / `resume()`. Tab blur auto-suspends.
- Per-bus gain nodes for volume sliders.
- "Reduce motion" accessibility setting also reduces accent rate and disables combat
  pulse LFO.
