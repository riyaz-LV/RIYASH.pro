import * as THREE from 'three';

export interface ProceduralTextureSet {
  brushedBump: THREE.CanvasTexture;
  carbonAlbedo: THREE.CanvasTexture;
  astrolabeDial: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const anisotropy = Math.max(1, Math.min(maxAnisotropy, 16));

  // 1. Brushed micro-metal bump/roughness map (linear space)
  const brushedCanvas = document.createElement('canvas');
  brushedCanvas.width = 512;
  brushedCanvas.height = 512;
  const bCtx = brushedCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y++) {
    const shade = 108 + Math.floor(Math.sin(y * 0.73) * 18 + ((y * 37) % 24));
    bCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    bCtx.fillRect(0, y, 512, 1);
  }
  const brushedBump = new THREE.CanvasTexture(brushedCanvas);
  brushedBump.wrapS = THREE.RepeatWrapping;
  brushedBump.wrapT = THREE.RepeatWrapping;
  brushedBump.repeat.set(3, 3);
  brushedBump.anisotropy = anisotropy;

  // 2. Carbon / machined grid albedo (SRGBColorSpace)
  const carbonCanvas = document.createElement('canvas');
  carbonCanvas.width = 256;
  carbonCanvas.height = 256;
  const cCtx = carbonCanvas.getContext('2d')!;
  cCtx.fillStyle = '#181e28';
  cCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 8) {
      const alt = ((x + y) / 8) % 2 === 0;
      cCtx.fillStyle = alt ? '#232c3a' : '#121720';
      cCtx.fillRect(x, y, 7, 7);
    }
  }
  const carbonAlbedo = new THREE.CanvasTexture(carbonCanvas);
  carbonAlbedo.colorSpace = THREE.SRGBColorSpace;
  carbonAlbedo.wrapS = THREE.RepeatWrapping;
  carbonAlbedo.wrapT = THREE.RepeatWrapping;
  carbonAlbedo.repeat.set(6, 6);
  carbonAlbedo.anisotropy = anisotropy;

  // 3. Graduated celestial ring dial texture (SRGBColorSpace)
  const dialCanvas = document.createElement('canvas');
  dialCanvas.width = 1024;
  dialCanvas.height = 128;
  const dCtx = dialCanvas.getContext('2d')!;
  dCtx.fillStyle = '#141b26';
  dCtx.fillRect(0, 0, 1024, 128);
  dCtx.strokeStyle = '#6ee7b7';
  dCtx.fillStyle = '#a7f3d0';
  dCtx.font = '600 18px monospace';
  dCtx.textAlign = 'center';
  for (let i = 0; i < 72; i++) {
    const x = (i / 72) * 1024;
    const major = i % 6 === 0;
    dCtx.lineWidth = major ? 2.5 : 1;
    dCtx.beginPath();
    dCtx.moveTo(x, 12);
    dCtx.lineTo(x, major ? 54 : 32);
    dCtx.stroke();
    if (major) {
      dCtx.fillText(`${i * 5}°`, x + 16, 86);
    }
  }
  const astrolabeDial = new THREE.CanvasTexture(dialCanvas);
  astrolabeDial.colorSpace = THREE.SRGBColorSpace;
  astrolabeDial.wrapS = THREE.RepeatWrapping;
  astrolabeDial.wrapT = THREE.ClampToEdgeWrapping;
  astrolabeDial.anisotropy = anisotropy;

  // 4. Soft radial contact shadow disc texture
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  return {
    brushedBump,
    carbonAlbedo,
    astrolabeDial,
    contactShadow,
    dispose: () => {
      brushedBump.dispose();
      carbonAlbedo.dispose();
      astrolabeDial.dispose();
      contactShadow.dispose();
    },
  };
}
