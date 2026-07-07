# Class Identities — Content Bible

> 7 original classes, each mapping to a D2 mechanical archetype. Names, fantasy, and flavor
> are original; 3-tree structure with synergies and skill-level scaling follows the
> pattern described in `02-game-design/classes-and-skills.md`. Per-skill numeric data
> (level gates, mana, scaling constants, synergies, worked values) lives in
> `skill-data.md` — the authoring source for `src/sim/data/skills.ts`. Warden and
> Arcanist are covered there; the other 5 classes are backlog.

**Note on "Stamina per vit" lines below:** `02-game-design/stats-and-formulas.md` is
canonical — Vitality grants **+1 stamina per point, universal for all classes**; class
differences in stamina are expressed through the per-class `classDrain` constant (and
form modifiers), not through per-vit gain. The per-class "Stamina per vit" values in this
file are superseded flavor and will be removed when the class entries are next revised.

## The 7 classes

### 1. Warden (Strength-based melee + shouts + passives)
- **D2 archetype:** Paladin analogue (heavy armor, auras, supportive melee)
- **Identity:** Frontline soldier of the Freeholds — trained in heavy armor, group tactics,
  and the surviving techniques of the old Keeper orders. Wears the heaviest armor, shields
  are effective, and leads from the front.
- **3 trees:**
  - **Oath-Keeper:** Auras that buff allies (+damage, +defense, +resist, +elemental dmg aura)
  - **Iron Vow:** Holy-melee-style combat skills (smite-equivalent stun, charge, elemental
    strike conversion, zealous multi-strike)
  - **Last Bastion:** Defense passives (block, armor%, resist passive, damage reduction, thorns)
- **Starting stats:** Str 25, Dex 15, Vit 25, Ene 10 — the tank
- **Life per vit:** 3
- **Stamina per vit:** 1.25
- **Base AR:** 150

### 2. Shadow (Dexterity-based traps + shadow arts + melee combos)
- **D2 archetype:** Assassin analogue (traps, shadow magic, martial arts)
- **Identity:** Operative of the Iron Court's now-disavowed shadow division — master of
  mechanical traps, concealment magic, and rapid close-quarters strike combos.
- **3 trees:**
  - **Machinist:** Deployable trap skills (fire/lightning/cold variants), proximity-armed,
    damage scales with skill level. Also: blade-throw ranged attack.
  - **Veil-Weaver:** Shadow utility (cloak of shadows accuracy debuff, burst-of-speed movement,
    defensive shadow-ally summon, shadow-form defensive transformation)
  - **Iron Dance:** Charge-up + finisher combo system (punch → kick → palm → finisher release).
    Dual-claw/cestus weapon mechanic.
- **Starting stats:** Str 15, Dex 30, Vit 15, Ene 20
- **Life per vit:** 2
- **Stamina per vit:** 1.25
- **Base AR:** 170

### 3. Berserker (Strength-based dual-wield + war cries + combat masteries)
- **D2 archetype:** Barbarian analogue (dual wield, shouts, passive weapons masteries)
- **Identity:** Outsider from the frontier tribes — survivors whose culture revolves around
  Bleed-hunting as a rite of passage. They wield massive weapons, work themselves into
  killing frenzies, and can endure punishment that would kill anyone else.
- **3 trees:**
  - **War-Maker:** Offensive weapon skills (bash, cleave, frenzy-style ramp attack, whirlwind,
    leap attack). Dual-wielding is primary: attack alternates mainhand/offhand.
  - **War Cry:** Shout buffs (battle-cry +damage/AR, iron-skin +defense/resist, war-shout
    +life/party, taunt single enemy in +damage taken)
  - **Iron Grip:** Combat masteries (weapon-type-specific crit/AR/ED passives, iron skin
    passive DR%, increased speed, +natural resist, increased stamina)
- **Starting stats:** Str 30, Dex 20, Vit 25, Ene 5 — pure physical
- **Life per vit:** 4
- **Stamina per vit:** 1.5
- **Base AR:** 135

### 4. Skin-Shifter (Shapeshifter + elemental + summon)
- **D2 archetype:** Druid analogue (were-form, elemental, summon)
- **Identity:** One who learned to merge with the Bleed rather than resist it — at a cost.
  Skin-Shifters can transform into corrupted bestial forms and call upon the twisted
  life-force of the Bleed-contaminated wilds.
- **3 trees:**
  - **Primal Form:** Shapeshift into 2 forms: Raptor-form (fast, bleed DoT claw attacks, low
    survivability) and Bear-form (high HP, melee stun/pound, slow but tanky). Skill points
    improve form stats and grant special attacks. Gear stats freeze to form multipliers.
  - **Bleed-Touched:** Elemental spells drawn from the Bleed: venom-line (poison DoT stream),
    rust-line (physical damage + corrosion armor debuff), and sinkhole (AoE ground rupture).
  - **Pack-Tender:** Summonable minor Bleed-creatures (2-5 max per type, diminishing returns
    past slvl 8): Shalehide-lings (melee tanks), Gloomwing young (ranged poison), and a
    single large Tremor-Back (tank/summon cap counts this as 2). Summons scale via
    "mastery" synergy from pack-tender skill.
- **Starting stats:** Str 20, Dex 15, Vit 25, Ene 20
- **Life per vit:** 2.5 (human), 3.5 (bear-form), 2 (raptor-form)
- **Stamina per vit:** 1 (bear), 1.5 (raptor)
- **Base AR:** 145

### 5. Reaper (Summon army + curses + projectile magic)
- **D2 archetype:** Necromancer analogue (necromancy, curses, bone magic)
- **Identity:** One who walks the thin line between life and Bleed-corruption. Reapers speak
  to the lingering spirits of the dead — compelling them to fight, cursing enemies with
  the weight of ages, and projecting their will as physical force.
- **3 trees:**
  - **Soul-Caller:** Summon skeleton-warrior analogue (melee spirits, up to 10, scaling stats
    per level, +damage/+life per hard point from summoner mastery synergy). Revive
    mechanic on corpse consumption. Golem-type minion (one at a time, larger + taunt).
  - **Fading Word:** Curses (diminish: reduces enemy damage by %, amplify: increase physical
    damage taken by %, weaken: reduces enemy defense, attract: distraction agro-pull,
    decrepify-equivalent: slow + damage taken increase). One curse active at a time.
  - **Bone-Chill:** Projectile physical damage (bone-chill bolt: piercing cold+physical
    projectile, spirit lance: higher-damage single target, bone-armor: defense+block
    shield, corpse-explosion: AoE %max-hp fire/physical damage around target corpse,
    spirit-form: energy shield analogue with mana-as-life conversion).
- **Starting stats:** Str 10, Dex 10, Vit 15, Ene 35 — the caster
- **Life per vit:** 1.5
- **Stamina per vit:** 1.0
- **Base AR:** 100

### 6. Eternal (Aura-support + holy melee + combat)
- **D2 archetype:** Paladin secondary — the "sustain" variant. Eternal focuses on
  persistent area effects and weapon-blessing melee rather than the Warden's soldier role.
- **Identity:** Ancient order that predates the Keepers — practitioners of "eternal arts"
  that weave the fabric of reality around them. They fight with blessed weapons and
  maintain persistent fields of power.
- **3 trees:**
  - **Glyph-Forge:** Persistent field effects (an aura analogue — only one active at a time,
    radius ~20 yds). Choices: warm-glow (regen HP/sec for party), rally (bonus AR/damage
    scaling), barrier (resists + flat DR), warding (thorns damage return), presence
    (party +defense +FHR). Each learned as a separate skill; synergies between fields.
    Activation cost, then free per tick.
  - **Blessed Edge:** Weapon-blessing melee combat skills (righteous strike: single target,
    +elemental conversion, zeal-equivalent multi-strike, charge-equivalent gap-closing
    leap, smite-equivalent shield-bash stun, holy-bolt: undead-only ranged projectile)
  - **Eternal Body:** Passives (resist passive, +FHR, +block, max res passive, +life%,
    +defense%, +healing effectiveness)
- **Starting stats:** Str 20, Dex 15, Vit 25, Ene 20 — balanced melee/hybrid
- **Life per vit:** 3
- **Stamina per vit:** 1.0
- **Base AR:** 140

### 7. Arcanist (Pure caster — 3 elemental trees)
- **D2 archetype:** Sorceress analogue (3 element trees with mastery passives and synergies)
- **Identity:** One who has studied the raw forces of the world — thermal (fire/cold),
  galvanic (lightning), and entropic (poison/magic) — and can channel them with devastating
  effect. The ultimate glass cannon.
- **3 trees:**
  - **Thermal:** Fire + Cold. Fire branch: fireball (AoE projectile), flame-wall (lingering
    fire patch), meteor-equivalent (delayed AoE), fire-mastery (passive %fire damage).
    Cold branch: ice-bolt (piercing cold projectile), frost-nova (point-blank AoE chill),
    blizzard-equivalent (screen-area cold damage over time), cold-mastery (%cold pen).
  - **Galvanic:** Lightning. Chain-lightning (bouncing, each jump reduces damage),
    lightning (single target continuous beams equivalent), nova (point-blank shock,
    high mana), static-field (15% current HP AoE, NO synergy scaling — fixed effect per
    R1/R5 research), thunder-storm (periodic random bolt over area, channeled), and
    lightning-mastery (passive %lightning damage, FCR passive bonus).
  - **Entropic:** Poison + magic damage. Toxic-cloud (lingering poison AoE), curse-bolt
    (single-target magic damage + debuff), entropy-wave (cone debuff — reduces enemy
    attack rating and resistances), and entropy-mastery (passive %poison/magic damage).
- **Starting stats:** Str 10, Dex 10, Vit 10, Ene 35
- **Life per vit:** 1
- **Stamina per vit:** 1.0
- **Base AR:** 95
