// Sky layer (G0) — gradient dome + heavy fog.
//
// Renderer-side only. A large BackSide sphere with a horizon→zenith gradient (dark, desaturated)
// plus exponential-cheap linear `THREE.Fog`. Heavy fog is a first-class feature, not a veil
// (graphics-plan pillar 3): it sells gothic mood and caps overdraw. No sun disk at G0 — the
// three-light rig + PMREM IBL arrive at G4.

import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float t = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(mix(uBottom, uTop, t), 1.0);
  }
`;

export class Sky {
  readonly group: THREE.Group;
  private readonly geometry: THREE.SphereGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly fogColor = new THREE.Color(0x3b3d42); // matches the horizon band

  constructor() {
    this.group = new THREE.Group();
    this.group.name = "SkyLayer";

    this.geometry = new THREE.SphereGeometry(500, 32, 15);
    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x191b21) }, // zenith — near-black
        uBottom: { value: new THREE.Color(0x44474d) }, // horizon haze
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });

    const dome = new THREE.Mesh(this.geometry, this.material);
    dome.name = "SkyDome";
    dome.renderOrder = -1; // draw before terrain; depthWrite:false so geometry overwrites it
    dome.frustumCulled = false;
    this.group.add(dome);
  }

  /** Install heavy fog + background clear colour on the scene (graphics-plan pillar 3). */
  apply(scene: THREE.Scene): void {
    scene.fog = new THREE.Fog(this.fogColor, 20, 90);
    scene.background = this.fogColor.clone();
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
