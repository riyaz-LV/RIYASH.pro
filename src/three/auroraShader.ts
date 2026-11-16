import * as THREE from 'three';

export interface AuroraBackdrop {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
}

const AURORA_VERTEX = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uPhase;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.42 + uTime * 0.35 + uPhase) * 0.85;
    float wave2 = cos(pos.x * 0.85 - uTime * 0.22 + uPhase * 1.7) * 0.45;
    pos.z += wave1 + wave2;
    pos.y += sin(pos.x * 0.3 + uTime * 0.18 + uPhase) * 0.35;
    vElevation = wave1 + wave2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const AURORA_FRAGMENT = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uPhase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    float verticalFade = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.22, vUv.y);
    float edgeFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);

    float streaks = noise(vec2(vUv.x * 14.0 + uTime * 0.12 + uPhase, vUv.y * 2.5 - uTime * 0.08));
    float fineStreaks = noise(vec2(vUv.x * 34.0 - uTime * 0.18, vUv.y * 4.0 + uPhase));
    float curtain = smoothstep(0.28, 0.88, streaks * 0.7 + fineStreaks * 0.4);

    vec3 col = mix(uColorA, uColorB, smoothstep(0.15, 0.65, vUv.y + vElevation * 0.15));
    col = mix(col, uColorC, smoothstep(0.58, 0.95, vUv.y));

    float alpha = verticalFade * edgeFade * curtain * 0.85;
    gl_FragColor = vec4(col * (1.25 + curtain * 0.55), alpha);
  }
`;

export function createAuroraBackdrop(): AuroraBackdrop {
  const group = new THREE.Group();
  const materials: THREE.ShaderMaterial[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  const curtainConfigs = [
    {
      y: 2.35,
      z: -6.5,
      rotY: 0.12,
      phase: 0.0,
      colorA: new THREE.Color(0x10b981),
      colorB: new THREE.Color(0x06b6d4),
      colorC: new THREE.Color(0x6366f1),
    },
    {
      y: 2.85,
      z: -9.5,
      rotY: -0.18,
      phase: 2.3,
      colorA: new THREE.Color(0x34d399),
      colorB: new THREE.Color(0x22d3ee),
      colorC: new THREE.Color(0x818cf8),
    },
  ];

  for (const cfg of curtainConfigs) {
    const geo = new THREE.PlaneGeometry(24, 7.5, 48, 12);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: cfg.phase },
        uColorA: { value: cfg.colorA },
        uColorB: { value: cfg.colorB },
        uColorC: { value: cfg.colorC },
      },
      vertexShader: AURORA_VERTEX,
      fragmentShader: AURORA_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, cfg.y, cfg.z);
    mesh.rotation.y = cfg.rotY;
    group.add(mesh);
    materials.push(mat);
    geometries.push(geo);
  }

  // Instanced arctic crystalline dust / starfield (> 20 identical items -> InstancedMesh)
  const particleCount = 160;
  const starGeo = new THREE.OctahedronGeometry(0.028, 0);
  const starMat = new THREE.MeshBasicMaterial({
    color: 0xa7f3d0,
    transparent: true,
    opacity: 0.65,
  });
  const stars = new THREE.InstancedMesh(starGeo, starMat, particleCount);
  const dummy = new THREE.Object3D();
  const basePositions: { x: number; y: number; z: number; speed: number; scale: number }[] = [];
  const tint = new THREE.Color();

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + (i % 7) * 0.4;
    const radius = 3.4 + (i % 13) * 0.78;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 2.0;
    const y = 0.35 + ((i * 19) % 100) / 16.0;
    const scale = 0.55 + ((i * 11) % 10) * 0.08;
    basePositions.push({ x, y, z, speed: 0.2 + (i % 5) * 0.08, scale });

    dummy.position.set(x, y, z);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    stars.setMatrixAt(i, dummy.matrix);

    tint.setHSL(0.45 + (i % 9) * 0.025, 0.72, 0.72);
    stars.setColorAt(i, tint);
  }
  stars.instanceMatrix.needsUpdate = true;
  if (stars.instanceColor) stars.instanceColor.needsUpdate = true;
  stars.computeBoundingSphere();
  stars.frustumCulled = false;
  group.add(stars);

  geometries.push(starGeo);

  return {
    group,
    update: (elapsed: number) => {
      for (const mat of materials) {
        mat.uniforms.uTime.value = elapsed;
      }
      for (let i = 0; i < particleCount; i++) {
        const bp = basePositions[i];
        dummy.position.set(
          bp.x + Math.sin(elapsed * bp.speed + i) * 0.08,
          bp.y + Math.cos(elapsed * bp.speed * 0.9 + i) * 0.12,
          bp.z
        );
        dummy.rotation.y = elapsed * 0.5 + i;
        dummy.scale.setScalar(bp.scale);
        dummy.updateMatrix();
        stars.setMatrixAt(i, dummy.matrix);
      }
      stars.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      starMat.dispose();
    },
  };
}
