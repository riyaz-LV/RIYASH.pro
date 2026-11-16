import * as THREE from 'three';
import type { MaterialFinishId, SceneId } from '../types/portfolio';
import type { ProceduralTextureSet } from './proceduralTextures';
import { computeExplodedOffset } from '../utils/resumeParser';

export interface ExplodablePart {
  mesh: THREE.Object3D;
  basePos: [number, number, number];
  explodeVec: [number, number, number];
}

export interface PortfolioSceneModel {
  id: SceneId;
  root: THREE.Group;
  animatedParts: {
    obj: THREE.Object3D;
    axis: 'x' | 'y' | 'z';
    speed: number;
  }[];
  explodableParts: ExplodablePart[];
  primaryMaterials: THREE.MeshPhysicalMaterial[];
  accentMaterials: THREE.MeshPhysicalMaterial[];
  dispose: () => void;
}

interface FinishPalette {
  primaryColor: number;
  metalness: number;
  roughness: number;
  anisotropy: number;
  accentColor: number;
  emissive: number;
}

export const FINISH_PRESETS: Record<MaterialFinishId, FinishPalette> = {
  titanium: {
    primaryColor: 0xb8c4d4,
    metalness: 0.92,
    roughness: 0.22,
    anisotropy: 0.85,
    accentColor: 0x34d399,
    emissive: 0x059669,
  },
  obsidian: {
    primaryColor: 0x202736,
    metalness: 0.65,
    roughness: 0.34,
    anisotropy: 0.4,
    accentColor: 0x22d3ee,
    emissive: 0x0891b2,
  },
  brass: {
    primaryColor: 0xd6a85c,
    metalness: 0.95,
    roughness: 0.18,
    anisotropy: 0.8,
    accentColor: 0xfbbf24,
    emissive: 0xb45309,
  },
  aurora: {
    primaryColor: 0x3b6e78,
    metalness: 0.85,
    roughness: 0.16,
    anisotropy: 0.75,
    accentColor: 0x6ee7b7,
    emissive: 0x10b981,
  },
};

export function applyFinishToModel(model: PortfolioSceneModel, finish: MaterialFinishId): void {
  const preset = FINISH_PRESETS[finish];
  for (const mat of model.primaryMaterials) {
    mat.color.setHex(preset.primaryColor);
    mat.metalness = preset.metalness;
    mat.roughness = preset.roughness;
    mat.anisotropy = preset.anisotropy;
    mat.iridescence = finish === 'aurora' ? 0.95 : 0.12;
    mat.needsUpdate = true;
  }
  for (const mat of model.accentMaterials) {
    mat.color.setHex(preset.accentColor);
    mat.emissive.setHex(preset.emissive);
    mat.needsUpdate = true;
  }
}

export function applyExplodeToModel(model: PortfolioSceneModel, amount: number): void {
  for (const part of model.explodableParts) {
    const [nx, ny, nz] = computeExplodedOffset(part.basePos, part.explodeVec, amount);
    part.mesh.position.set(nx, ny, nz);
  }
}

function registerExplodable(
  parts: ExplodablePart[],
  mesh: THREE.Object3D,
  explodeVec: [number, number, number]
): void {
  parts.push({
    mesh,
    basePos: [mesh.position.x, mesh.position.y, mesh.position.z],
    explodeVec,
  });
}

function createSharedMaterials(textures: ProceduralTextureSet, isSoftwareGl: boolean) {
  const primaryMat = new THREE.MeshPhysicalMaterial({
    color: FINISH_PRESETS.titanium.primaryColor,
    metalness: 0.92,
    roughness: 0.22,
    anisotropy: 0.85,
    bumpMap: textures.brushedBump,
    bumpScale: 0.008,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    iridescence: 0.15,
    iridescenceIOR: 1.45,
  });

  const matteChassisMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: textures.carbonAlbedo,
    roughness: 0.62,
    metalness: 0.28,
    bumpMap: textures.brushedBump,
    bumpScale: 0.012,
  });

  const opticalGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x99f6e4,
    metalness: 0.05,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.9,
    transparent: true,
    opacity: isSoftwareGl ? 0.42 : 1.0,
    ior: 1.65,
    thickness: 1.4,
    attenuationColor: new THREE.Color(0x0d9488),
    attenuationDistance: 1.8,
    clearcoat: 1.0,
    depthWrite: false,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.astrolabeDial,
    roughness: 0.32,
    metalness: 0.78,
  });

  const accentEmitMat = new THREE.MeshPhysicalMaterial({
    color: 0x34d399,
    emissive: 0x059669,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.3,
    clearcoat: 0.9,
  });

  return {
    primaryMat,
    matteChassisMat,
    opticalGlassMat,
    dialMat,
    accentEmitMat,
  };
}

export function buildKineticCoreModel(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): PortfolioSceneModel {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const animatedParts: PortfolioSceneModel['animatedParts'] = [];
  const explodableParts: ExplodablePart[] = [];

  const { primaryMat, matteChassisMat, opticalGlassMat, dialMat, accentEmitMat } =
    createSharedMaterials(textures, isSoftwareGl);

  // 1. Grounded stepped pedestal base (y=0 bottom)
  const baseProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.45, 0.0),
    new THREE.Vector2(1.45, 0.08),
    new THREE.Vector2(1.18, 0.16),
    new THREE.Vector2(1.05, 0.24),
    new THREE.Vector2(0.55, 0.24),
    new THREE.Vector2(0.45, 0.42),
    new THREE.Vector2(0.0, 0.42),
  ];
  const pedestalGeo = new THREE.LatheGeometry(baseProfile, 48);
  const pedestal = new THREE.Mesh(pedestalGeo, matteChassisMat);
  pedestal.castShadow = !isSoftwareGl;
  pedestal.receiveShadow = !isSoftwareGl;
  root.add(pedestal);
  geometries.push(pedestalGeo);
  registerExplodable(explodableParts, pedestal, [0, -0.45, 0]);

  // 2. Machined cradle yokes (ExtrudeGeometry with bevel)
  const yokeShape = new THREE.Shape();
  yokeShape.moveTo(-0.18, 0);
  yokeShape.lineTo(0.18, 0);
  yokeShape.lineTo(0.24, 1.35);
  yokeShape.lineTo(0.1, 1.5);
  yokeShape.lineTo(-0.1, 1.5);
  yokeShape.lineTo(-0.24, 1.35);
  yokeShape.closePath();

  const yokeGeo = new THREE.ExtrudeGeometry(yokeShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  yokeGeo.center();
  geometries.push(yokeGeo);

  const leftYoke = new THREE.Mesh(yokeGeo, primaryMat);
  leftYoke.position.set(-1.32, 1.15, 0);
  leftYoke.rotation.z = -0.14;
  leftYoke.castShadow = !isSoftwareGl;
  root.add(leftYoke);
  registerExplodable(explodableParts, leftYoke, [-0.85, 0.1, 0]);

  const rightYoke = new THREE.Mesh(yokeGeo, primaryMat);
  rightYoke.position.set(1.32, 1.15, 0);
  rightYoke.rotation.z = 0.14;
  rightYoke.castShadow = !isSoftwareGl;
  root.add(rightYoke);
  registerExplodable(explodableParts, rightYoke, [0.85, 0.1, 0]);

  // 3. Outer graduated meridian ring
  const outerRingGeo = new THREE.TorusGeometry(1.35, 0.075, 24, 72);
  const outerRing = new THREE.Mesh(outerRingGeo, primaryMat);
  outerRing.position.set(0, 1.85, 0);
  outerRing.castShadow = !isSoftwareGl;
  root.add(outerRing);
  geometries.push(outerRingGeo);
  animatedParts.push({ obj: outerRing, axis: 'y', speed: 0.24 });
  registerExplodable(explodableParts, outerRing, [0, 0.5, -0.75]);

  // 4. Inscribed star-chart dial band
  const dialGeo = new THREE.CylinderGeometry(1.12, 1.12, 0.16, 48, 1, true);
  const dialRing = new THREE.Mesh(dialGeo, dialMat);
  dialRing.position.set(0, 1.85, 0);
  dialRing.rotation.x = Math.PI * 0.18;
  root.add(dialRing);
  geometries.push(dialGeo);
  animatedParts.push({ obj: dialRing, axis: 'z', speed: -0.35 });
  registerExplodable(explodableParts, dialRing, [0, 0.25, 0.75]);

  // 5. Inner precision gimbal ring + 4 cardinal calibration pins
  const innerGimbal = new THREE.Group();
  innerGimbal.position.set(0, 1.85, 0);
  const innerRingGeo = new THREE.TorusGeometry(0.86, 0.055, 20, 60);
  const innerRingMesh = new THREE.Mesh(innerRingGeo, primaryMat);
  innerRingMesh.rotation.x = Math.PI / 2.4;
  innerGimbal.add(innerRingMesh);
  geometries.push(innerRingGeo);

  const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.28, 16);
  geometries.push(pinGeo);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const pin = new THREE.Mesh(pinGeo, accentEmitMat);
    pin.position.set(Math.cos(a) * 0.86, 0, Math.sin(a) * 0.86);
    pin.rotation.z = Math.PI / 2;
    pin.rotation.y = -a;
    innerGimbal.add(pin);
  }
  root.add(innerGimbal);
  animatedParts.push({ obj: innerGimbal, axis: 'x', speed: 0.42 });
  registerExplodable(explodableParts, innerGimbal, [0, 0.8, 0]);

  // 6. Optical sapphire outer shell + faceted energy core
  const glassShellGeo = new THREE.SphereGeometry(0.56, 36, 36);
  const glassShell = new THREE.Mesh(glassShellGeo, opticalGlassMat);
  glassShell.position.set(0, 1.85, 0);
  glassShell.renderOrder = 4;
  root.add(glassShell);
  geometries.push(glassShellGeo);
  registerExplodable(explodableParts, glassShell, [0, 0, 1.1]);

  const coreGeo = new THREE.IcosahedronGeometry(0.32, 1);
  const coreMesh = new THREE.Mesh(coreGeo, accentEmitMat);
  coreMesh.position.set(0, 1.85, 0);
  root.add(coreMesh);
  geometries.push(coreGeo);
  animatedParts.push({ obj: coreMesh, axis: 'y', speed: -0.75 });
  registerExplodable(explodableParts, coreMesh, [0, 0, 0]);

  // 7. Orbiting helical energy tube (TubeGeometry)
  const curvePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    curvePoints.push(
      new THREE.Vector3(Math.cos(t) * 1.62, 1.85 + Math.sin(t * 2) * 0.24, Math.sin(t) * 1.62)
    );
  }
  const helixCurve = new THREE.CatmullRomCurve3(curvePoints, true);
  const helixGeo = new THREE.TubeGeometry(helixCurve, 72, 0.02, 10, true);
  const helixMesh = new THREE.Mesh(helixGeo, accentEmitMat);
  root.add(helixMesh);
  geometries.push(helixGeo);
  animatedParts.push({ obj: helixMesh, axis: 'y', speed: 0.18 });
  registerExplodable(explodableParts, helixMesh, [0, -0.3, 0]);

  return {
    id: 'kinetic-core',
    root,
    animatedParts,
    explodableParts,
    primaryMaterials: [primaryMat],
    accentMaterials: [accentEmitMat],
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      primaryMat.dispose();
      matteChassisMat.dispose();
      opticalGlassMat.dispose();
      dialMat.dispose();
      accentEmitMat.dispose();
    },
  };
}

export function buildBasaltPavilionModel(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): PortfolioSceneModel {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const animatedParts: PortfolioSceneModel['animatedParts'] = [];
  const explodableParts: ExplodablePart[] = [];

  const { primaryMat, matteChassisMat, opticalGlassMat, dialMat, accentEmitMat } =
    createSharedMaterials(textures, isSoftwareGl);

  // 1. Stepped obsidian plinth
  const plinthGeo = new THREE.CylinderGeometry(2.15, 2.35, 0.22, 8);
  const plinth = new THREE.Mesh(plinthGeo, matteChassisMat);
  plinth.position.set(0, 0.11, 0);
  plinth.receiveShadow = !isSoftwareGl;
  root.add(plinth);
  geometries.push(plinthGeo);
  registerExplodable(explodableParts, plinth, [0, -0.4, 0]);

  // 2. Floor compass bezel (offset +0.025 to prevent Z-fighting)
  const bezelGeo = new THREE.RingGeometry(1.15, 1.75, 48);
  bezelGeo.rotateX(-Math.PI / 2);
  const bezel = new THREE.Mesh(bezelGeo, dialMat);
  bezel.position.set(0, 0.245, 0);
  dialMat.polygonOffset = true;
  dialMat.polygonOffsetFactor = -1;
  dialMat.polygonOffsetUnits = -1;
  root.add(bezel);
  geometries.push(bezelGeo);

  // 3. Five cantilevered basalt monolith pillars (ExtrudeGeometry)
  const pillarShape = new THREE.Shape();
  pillarShape.moveTo(-0.22, 0);
  pillarShape.lineTo(0.22, 0);
  pillarShape.lineTo(0.14, 2.45);
  pillarShape.lineTo(-0.28, 2.2);
  pillarShape.closePath();

  const pillarGeo = new THREE.ExtrudeGeometry(pillarShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  geometries.push(pillarGeo);

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + 0.3;
    const radius = 1.42;
    const pillar = new THREE.Mesh(pillarGeo, primaryMat);
    pillar.position.set(Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius);
    pillar.rotation.y = -angle + Math.PI / 2;
    pillar.scale.set(1, 0.78 + (i % 3) * 0.16, 1);
    pillar.castShadow = !isSoftwareGl;
    pillar.receiveShadow = !isSoftwareGl;
    root.add(pillar);
    registerExplodable(explodableParts, pillar, [Math.cos(angle) * 0.9, 0.2, Math.sin(angle) * 0.9]);
  }

  // 4. Iridescent glass architectural fins
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.85, 0.25);
  finShape.lineTo(0.45, 2.35);
  finShape.lineTo(-0.1, 1.9);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  geometries.push(finGeo);

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeo, opticalGlassMat);
    fin.position.set(Math.cos(angle) * 0.75, 0.32, Math.sin(angle) * 0.75);
    fin.rotation.y = -angle;
    fin.renderOrder = 3;
    root.add(fin);
    registerExplodable(explodableParts, fin, [Math.cos(angle) * 0.7, 0.55, Math.sin(angle) * 0.7]);
  }

  // 5. Suspended octahedron aurora beacon
  const beaconGeo = new THREE.OctahedronGeometry(0.48, 0);
  const beacon = new THREE.Mesh(beaconGeo, accentEmitMat);
  beacon.position.set(0, 1.75, 0);
  root.add(beacon);
  geometries.push(beaconGeo);
  animatedParts.push({ obj: beacon, axis: 'y', speed: 0.55 });
  registerExplodable(explodableParts, beacon, [0, 0.95, 0]);

  return {
    id: 'basalt-pavilion',
    root,
    animatedParts,
    explodableParts,
    primaryMaterials: [primaryMat],
    accentMaterials: [accentEmitMat],
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      primaryMat.dispose();
      matteChassisMat.dispose();
      opticalGlassMat.dispose();
      dialMat.dispose();
      accentEmitMat.dispose();
    },
  };
}

export function buildOpticalRigModel(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): PortfolioSceneModel {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const animatedParts: PortfolioSceneModel['animatedParts'] = [];
  const explodableParts: ExplodablePart[] = [];

  const { primaryMat, matteChassisMat, opticalGlassMat, dialMat, accentEmitMat } =
    createSharedMaterials(textures, isSoftwareGl);

  // 1. Dual machined dolly rails
  const railGeo = new THREE.CylinderGeometry(0.055, 0.055, 3.8, 20);
  railGeo.rotateZ(Math.PI / 2);
  geometries.push(railGeo);

  const frontRail = new THREE.Mesh(railGeo, primaryMat);
  frontRail.position.set(0, 0.08, 0.65);
  root.add(frontRail);
  registerExplodable(explodableParts, frontRail, [0, -0.35, 0.45]);

  const backRail = new THREE.Mesh(railGeo, primaryMat);
  backRail.position.set(0, 0.08, -0.65);
  root.add(backRail);
  registerExplodable(explodableParts, backRail, [0, -0.35, -0.45]);

  // 2. Bogie carriage chassis
  const carriageGeo = new THREE.BoxGeometry(1.75, 0.24, 1.48);
  const carriage = new THREE.Mesh(carriageGeo, matteChassisMat);
  carriage.position.set(0, 0.34, 0);
  carriage.castShadow = !isSoftwareGl;
  root.add(carriage);
  geometries.push(carriageGeo);
  registerExplodable(explodableParts, carriage, [0, -0.15, 0]);

  // 3. Four precision rail rollers
  const wheelGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.14, 24);
  wheelGeo.rotateX(Math.PI / 2);
  geometries.push(wheelGeo);
  const wheelOffsets: [number, number][] = [
    [-0.65, 0.65],
    [0.65, 0.65],
    [-0.65, -0.65],
    [0.65, -0.65],
  ];
  for (const [wx, wz] of wheelOffsets) {
    const wheel = new THREE.Mesh(wheelGeo, primaryMat);
    wheel.position.set(wx, 0.19, wz);
    root.add(wheel);
    registerExplodable(explodableParts, wheel, [wx * 0.4, -0.25, wz * 0.4]);
  }

  // 4. Articulated turret riser + cinema camera head group
  const turretHead = new THREE.Group();
  turretHead.position.set(0, 1.38, 0);

  const riserGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.72, 28);
  const riser = new THREE.Mesh(riserGeo, primaryMat);
  riser.position.set(0, 0.78, 0);
  root.add(riser);
  geometries.push(riserGeo);
  registerExplodable(explodableParts, riser, [0, 0.25, 0]);

  // Cinema body
  const bodyGeo = new THREE.BoxGeometry(0.95, 0.74, 0.84);
  const camBody = new THREE.Mesh(bodyGeo, matteChassisMat);
  camBody.castShadow = !isSoftwareGl;
  turretHead.add(camBody);
  geometries.push(bodyGeo);

  // Lathe-turned multi-step prime anamorphic lens barrel
  const lensPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.34, 0.24),
    new THREE.Vector2(0.37, 0.28),
    new THREE.Vector2(0.37, 0.56),
    new THREE.Vector2(0.41, 0.62),
    new THREE.Vector2(0.41, 0.85),
    new THREE.Vector2(0.35, 0.85),
    new THREE.Vector2(0.35, 0.76),
    new THREE.Vector2(0.0, 0.76),
  ];
  const lensGeo = new THREE.LatheGeometry(lensPoints, 36);
  lensGeo.rotateZ(-Math.PI / 2);
  const lensBarrel = new THREE.Mesh(lensGeo, primaryMat);
  lensBarrel.position.set(0.46, 0, 0);
  turretHead.add(lensBarrel);
  geometries.push(lensGeo);

  // Focus gear ring (graduated dial)
  const focusRingGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.16, 36, 1, true);
  focusRingGeo.rotateZ(Math.PI / 2);
  const focusRing = new THREE.Mesh(focusRingGeo, dialMat);
  focusRing.position.set(0.88, 0, 0);
  turretHead.add(focusRing);
  geometries.push(focusRingGeo);

  // Optical front element crystal
  const elementGeo = new THREE.SphereGeometry(0.32, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.45);
  elementGeo.rotateZ(-Math.PI / 2);
  const frontGlass = new THREE.Mesh(elementGeo, opticalGlassMat);
  frontGlass.position.set(1.12, 0, 0);
  frontGlass.renderOrder = 3;
  turretHead.add(frontGlass);
  geometries.push(elementGeo);

  // Glowing tally beacon & accent strips
  const accentStripGeo = new THREE.BoxGeometry(0.55, 0.06, 0.88);
  const accentStrip = new THREE.Mesh(accentStripGeo, accentEmitMat);
  accentStrip.position.set(-0.08, 0.39, 0);
  turretHead.add(accentStrip);
  geometries.push(accentStripGeo);

  root.add(turretHead);
  animatedParts.push({ obj: turretHead, axis: 'y', speed: 0.2 });
  registerExplodable(explodableParts, turretHead, [0, 0.85, 0]);

  return {
    id: 'optical-rig',
    root,
    animatedParts,
    explodableParts,
    primaryMaterials: [primaryMat],
    accentMaterials: [accentEmitMat],
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      primaryMat.dispose();
      matteChassisMat.dispose();
      opticalGlassMat.dispose();
      dialMat.dispose();
      accentEmitMat.dispose();
    },
  };
}
