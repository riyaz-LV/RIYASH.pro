import { useEffect, useRef, useState, type FC } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Camera, ChevronDown, ChevronUp, Download, RotateCcw } from 'lucide-react';
import type { CameraPresetId, MaterialFinishId, SceneId } from '../types/portfolio';
import { createProceduralTextures } from '../three/proceduralTextures';
import { createAuroraBackdrop } from '../three/auroraShader';
import {
  applyExplodeToModel,
  applyFinishToModel,
  buildBasaltPavilionModel,
  buildKineticCoreModel,
  buildOpticalRigModel,
  type PortfolioSceneModel,
} from '../three/models';
import { dampValue } from '../utils/resumeParser';

interface AuroraViewportProps {
  fullName: string;
  roleTitle: string;
  summary: string;
  activeScene: SceneId;
  onChangeScene: (scene: SceneId) => void;
}

const SCENE_OPTIONS: { id: SceneId; label: string }[] = [
  { id: 'kinetic-core', label: 'Kinetic Astrolabe' },
  { id: 'basalt-pavilion', label: 'Basalt Pavilion' },
  { id: 'optical-rig', label: 'Optical Rig' },
];

const FINISH_OPTIONS: { id: MaterialFinishId; label: string; swatch: string }[] = [
  { id: 'titanium', label: 'Titanium', swatch: '#b8c4d4' },
  { id: 'obsidian', label: 'Obsidian', swatch: '#334155' },
  { id: 'brass', label: 'Solar Brass', swatch: '#d6a85c' },
  { id: 'aurora', label: 'Aurora Iridescent', swatch: '#34d399' },
];

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  hero: { label: 'Hero Orbit', pos: [3.2, 2.55, 5.4], target: [-0.85, 1.35, 0] },
  macro: { label: 'Macro Detail', pos: [2.15, 1.9, 2.7], target: [0, 1.65, 0] },
  top: { label: 'Top Plan', pos: [0.1, 6.4, 2.4], target: [0, 1.1, 0] },
};

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const AuroraViewport: FC<AuroraViewportProps> = ({
  fullName,
  roleTitle,
  summary,
  activeScene,
  onChangeScene,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [finish, setFinish] = useState<MaterialFinishId>('titanium');
  const [explode, setExplode] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('hero');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [webglStatus, setWebglStatus] = useState<'ready' | 'lost' | 'fallback'>('ready');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Mutable refs for zero-teardown Three.js bridge
  const desiredSceneRef = useRef<SceneId>(activeScene);
  const desiredFinishRef = useRef<MaterialFinishId>(finish);
  const desiredExplodeRef = useRef<number>(explode);
  const currentExplodeRef = useRef<number>(0);
  const cameraTransitionRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.hero.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.hero.target),
  });
  const exportStillRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    desiredSceneRef.current = activeScene;
  }, [activeScene]);

  useEffect(() => {
    desiredFinishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    desiredExplodeRef.current = explode;
  }, [explode]);

  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    cameraTransitionRef.current.pos.set(...preset.pos);
    cameraTransitionRef.current.target.set(...preset.target);
    cameraTransitionRef.current.active = true;
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: isSoftwareGl,
      });
    } catch {
      setWebglStatus('fallback');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 680;
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglStatus('lost');
    };
    const onContextRestored = () => {
      setWebglStatus('ready');
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04070d);
    scene.fog = new THREE.FogExp2(0x04070d, 0.065);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.1;
    controls.maxDistance = 12.5;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();

    const stopCameraTransition = () => {
      cameraTransitionRef.current.active = false;
    };
    controls.addEventListener('start', stopCameraTransition);

    // 3-point warm/cool studio lighting + optional RectAreaLight on GPU
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.25);
    keyLight.position.set(5.5, 8.5, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -4.5;
    keyLight.shadow.camera.right = 4.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.55);
    rimLight.position.set(-5.0, 4.2, -5.5);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0x6ee7b7, 3.2, 4.5, 2.2);
      softbox.position.set(0, 5.2, 2.2);
      softbox.lookAt(0, 1.2, 0);
      scene.add(softbox);
    }

    const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());

    // Ground stage disc + contact shadow grounding
    const floorGeo = new THREE.CylinderGeometry(16, 16, 0.14, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3b4859,
      map: textures.carbonAlbedo,
      roughness: 0.78,
      metalness: 0.18,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.07;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const shadowDiscGeo = new THREE.CircleGeometry(2.6, 48);
    shadowDiscGeo.rotateX(-Math.PI / 2);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    shadowDisc.position.y = 0.015;
    scene.add(shadowDisc);

    // Subtle concentric stage ring (polygonOffset prevents Z-fighting)
    const stageRingGeo = new THREE.RingGeometry(2.45, 2.52, 72);
    stageRingGeo.rotateX(-Math.PI / 2);
    const stageRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.32,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const stageRing = new THREE.Mesh(stageRingGeo, stageRingMat);
    stageRing.position.y = 0.02;
    scene.add(stageRing);

    // Volumetric Aurora backdrop & starfield
    const aurora = createAuroraBackdrop();
    scene.add(aurora.group);

    // Build all 3 portfolio models once and toggle visibility cleanly
    const models: Record<SceneId, PortfolioSceneModel> = {
      'kinetic-core': buildKineticCoreModel(textures, isSoftwareGl),
      'basalt-pavilion': buildBasaltPavilionModel(textures, isSoftwareGl),
      'optical-rig': buildOpticalRigModel(textures, isSoftwareGl),
    };

    (Object.keys(models) as SceneId[]).forEach((id) => {
      models[id].root.visible = id === desiredSceneRef.current;
      scene.add(models[id].root);
    });

    let appliedScene: SceneId = desiredSceneRef.current;
    let appliedFinish: MaterialFinishId = desiredFinishRef.current;
    applyFinishToModel(models[appliedScene], appliedFinish);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Export still handler (4K on GPU, 1920x1080 cap on software GL for stability)
    exportStillRef.current = () => {
      const targetW = isSoftwareGl ? 1920 : 3840;
      const targetH = isSoftwareGl ? 1080 : 2160;
      const prevSize = new THREE.Vector2();
      renderer.getSize(prevSize);
      const prevPixelRatio = renderer.getPixelRatio();
      const prevAspect = camera.aspect;

      renderer.setPixelRatio(1);
      renderer.setSize(targetW, targetH, false);
      camera.aspect = targetW / targetH;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      const dataUrl = renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `aurora-${appliedScene}-${targetW}x${targetH}.png`;
      link.href = dataUrl;
      link.click();

      // Restore live viewport
      renderer.setPixelRatio(prevPixelRatio);
      renderer.setSize(prevSize.x, prevSize.y, false);
      camera.aspect = prevAspect;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);

      setExportNotice(`Exported ${targetW}×${targetH} PNG render`);
      window.setTimeout(() => setExportNotice(null), 3200);
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 680;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', handleResize);

    // Render loop with software-WebGL afterDraw pacing
    let frameId = 0;
    let disposed = false;
    const startMs = performance.now();
    let prevMs = startMs;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      let polls = 0;
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        polls += 1;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED && polls < 24) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const delta = Math.min((nowMs - prevMs) / 1000, 0.05);
      const elapsed = (nowMs - startMs) / 1000;
      prevMs = nowMs;

      // Scene switching
      if (desiredSceneRef.current !== appliedScene) {
        models[appliedScene].root.visible = false;
        appliedScene = desiredSceneRef.current;
        models[appliedScene].root.visible = true;
        applyFinishToModel(models[appliedScene], desiredFinishRef.current);
        appliedFinish = desiredFinishRef.current;
      }

      // Material finish switching
      if (desiredFinishRef.current !== appliedFinish) {
        appliedFinish = desiredFinishRef.current;
        applyFinishToModel(models[appliedScene], appliedFinish);
      }

      // Smooth exploded-view interpolation
      const targetExplode = desiredExplodeRef.current;
      if (Math.abs(currentExplodeRef.current - targetExplode) > 0.001) {
        currentExplodeRef.current = dampValue(currentExplodeRef.current, targetExplode, 8, delta);
      } else {
        currentExplodeRef.current = targetExplode;
      }
      applyExplodeToModel(models[appliedScene], currentExplodeRef.current);

      // Animate parts & Aurora backdrop (freeze rotation if reduced-motion)
      const activeModel = models[appliedScene];
      if (!prefersReducedMotion) {
        for (const part of activeModel.animatedParts) {
          part.obj.rotation[part.axis] += part.speed * delta;
        }
        aurora.update(elapsed);
      }

      // Smooth camera preset transition
      if (cameraTransitionRef.current.active) {
        const tPos = cameraTransitionRef.current.pos;
        const tTarget = cameraTransitionRef.current.target;
        camera.position.x = dampValue(camera.position.x, tPos.x, 6.5, delta);
        camera.position.y = dampValue(camera.position.y, tPos.y, 6.5, delta);
        camera.position.z = dampValue(camera.position.z, tPos.z, 6.5, delta);
        controls.target.x = dampValue(controls.target.x, tTarget.x, 6.5, delta);
        controls.target.y = dampValue(controls.target.y, tTarget.y, 6.5, delta);
        controls.target.z = dampValue(controls.target.z, tTarget.z, 6.5, delta);
        if (
          camera.position.distanceTo(tPos) < 0.02 &&
          controls.target.distanceTo(tTarget) < 0.02
        ) {
          camera.position.copy(tPos);
          controls.target.copy(tTarget);
          cameraTransitionRef.current.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', stopCameraTransition);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      Object.values(models).forEach((m) => m.dispose());
      aurora.dispose();
      textures.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      shadowDiscGeo.dispose();
      shadowDiscMat.dispose();
      stageRingGeo.dispose();
      stageRingMat.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  // Keyboard shortcut 'H' to toggle dock visibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <section
      id="stage"
      data-active-scene={activeScene}
      data-active-finish={finish}
      className="relative w-full h-[calc(100vh-65px)] min-h-[620px] max-h-[900px] overflow-hidden bg-[#04070d]"
    >
      {/* Isolated WebGL mount container */}
      <div
        ref={mountRef}
        data-testid="aurora-webgl-stage"
        className="absolute inset-0 h-full w-full"
        aria-label="Interactive 3D Aurora Animation Stage. Drag to orbit, scroll to zoom."
      />

      {webglStatus !== 'ready' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060b14] p-6 text-center">
          <div className="max-w-md space-y-2">
            <p className="font-display text-xl font-semibold text-white">
              3D Studio Viewport Paused
            </p>
            <p className="text-sm text-slate-300">
              WebGL context is temporarily unavailable. Browse the 4K rendered works and resume below.
            </p>
          </div>
        </div>
      )}

      {/* Subtle contrast scrim for hero copy legibility without obscuring the 3D subject */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-[#04070d]/75 via-[#04070d]/35 to-transparent lg:bg-gradient-to-r lg:from-[#04070d]/65 lg:via-[#04070d]/20 lg:to-transparent"
      />

      {/* Top-Left Editorial Hero Copy (unobtrusive, leaves center 3D subject clear) */}
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1380px] flex-col justify-between px-4 pt-6 pb-6 sm:px-6 sm:pt-8">
        <div className="max-w-lg pointer-events-auto">
          <p className="font-mono text-xs tracking-wide text-emerald-300 tabular-nums">
            {fullName} · 3840 × 2160 · 60 FPS Real-Time Stage
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {roleTitle}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-200 sm:text-slate-300">
            {summary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <a
              href="#portfolio"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Explore Portfolio
            </a>
            <a
              href="#resume"
              className="rounded-lg border border-white/20 bg-[#080d18]/90 px-5 py-2.5 text-sm font-medium text-white hover:border-emerald-400/60 hover:text-emerald-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              View Resume
            </a>
          </div>
        </div>

        {/* Export feedback toast */}
        {exportNotice && (
          <div
            role="status"
            className="pointer-events-none self-start rounded-lg border border-emerald-400/40 bg-[#080d18]/95 px-3.5 py-2 font-mono text-xs text-emerald-300"
          >
            {exportNotice}
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (Zero backdrop-filter over WebGL; solid rgba surface) */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[min(940px,94vw)] -translate-x-1/2 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          aria-expanded={!dockCollapsed}
          aria-controls="stage-control-dock"
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-white/15 bg-[#080d18]/95 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-emerald-300 transition-colors cursor-pointer whitespace-nowrap"
        >
          {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
        </button>

        {!dockCollapsed && (
          <div
            id="stage-control-dock"
            className="pointer-events-auto w-full rounded-xl border border-white/15 bg-[#080d18]/95 px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
              {/* 3D Rig / Scene Tabs */}
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/5 p-1" role="group" aria-label="3D Scene selector">
                {SCENE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeScene(opt.id)}
                    aria-pressed={activeScene === opt.id}
                    className={`rounded-md px-2.5 py-1.5 sm:px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeScene === opt.id
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Material Finish Swatches */}
              <div className="flex items-center gap-2" role="group" aria-label="Material finish">
                <span className="text-xs text-slate-400 whitespace-nowrap">Finish</span>
                {FINISH_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFinish(f.id)}
                    aria-label={`Select ${f.label} finish`}
                    aria-pressed={finish === f.id}
                    title={f.label}
                    className={`h-6 w-6 rounded-md border transition-transform cursor-pointer ${
                      finish === f.id
                        ? 'border-emerald-300 scale-110'
                        : 'border-white/25 hover:border-white/60'
                    }`}
                    style={{ backgroundColor: f.swatch }}
                  />
                ))}
              </div>

              {/* Exploded View Slider */}
              <div className="flex items-center gap-2.5">
                <label htmlFor="explode-slider" className="text-xs text-slate-300 whitespace-nowrap">
                  Explode
                </label>
                <input
                  id="explode-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={explode}
                  onChange={(e) => setExplode(Number(e.target.value))}
                  className="aurora-slider w-20 sm:w-24"
                />
                <span className="font-mono text-xs text-emerald-300 tabular-nums w-9 text-right">
                  {Math.round(explode * 100)}%
                </span>
              </div>

              {/* Camera Presets + 4K Capture */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => setCameraPreset(presetKey)}
                    aria-pressed={cameraPreset === presetKey}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === presetKey
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Camera className="h-3 w-3" />
                    <span>{CAMERA_PRESETS[presetKey].label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setExplode(0);
                    setCameraPreset('hero');
                  }}
                  aria-label="Reset camera and assembly"
                  title="Reset view"
                  className="rounded-md border border-white/15 p-1.5 text-slate-300 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => exportStillRef.current?.()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Capture 4K</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
