/**
 * REMANENCE: Physically Real Aerospace Materials Library
 * Provides authentic PBR materials for Apollo hardware, rovers, and scientific instruments.
 * Features high-frequency crinkled Kapton foil, brushed alloy, heat-scorched titanium,
 * stamped commemorative plaques, and lunar regolith contact textures.
 */

import * as THREE from 'three';

// Cache generated textures so we don't recreate canvases unnecessarily
const textureCache = new Map();

/**
 * 1. High-Frequency Crinkled Gold / Amber Kapton Foil Normal & Roughness Map
 * Simulates hand-wrapped, creased multilayer insulation (MLI) blankets with sharp folds.
 */
export function createCrinkledFoilTextures() {
  if (textureCache.has('foil')) return textureCache.get('foil');

  const size = 512;
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d');

  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = size;
  roughnessCanvas.height = size;
  const rCtx = roughnessCanvas.getContext('2d');

  // Height map generator for Voronoi-like crinkles and sharp origami creases
  const heightData = new Float32Array(size * size);

  // Seed random crease feature points
  const numPoints = 160;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: Math.random() * size,
      y: Math.random() * size,
      h: Math.random() * 0.9 + 0.1
    });
  }

  // Generate faceted crinkle heightmap
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d1 = 1e9, d2 = 1e9;
      let nearestH = 0.5;

      for (let p of points) {
        // Toroidal distance for seamless tile
        const dx = Math.abs(x - p.x);
        const dy = Math.abs(y - p.y);
        const wrapX = Math.min(dx, size - dx);
        const wrapY = Math.min(dy, size - dy);
        const d = Math.hypot(wrapX, wrapY);

        if (d < d1) {
          d2 = d1;
          d1 = d;
          nearestH = p.h;
        } else if (d < d2) {
          d2 = d;
        }
      }

      // Cellular crease profile: sharp ridges at cell boundaries
      const cellEdge = Math.max(0, 1.0 - (d2 - d1) * 0.22);
      const microNoise = (Math.sin(x * 0.18) + Math.cos(y * 0.18)) * 0.08;
      const h = Math.min(1.0, Math.max(0.0, nearestH * 0.6 + cellEdge * 0.35 + microNoise));
      heightData[y * size + x] = h;
    }
  }

  // Convert heightmap to Tangent-Space Normal Map & Roughness Map
  const nImg = nCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const xl = (x - 1 + size) % size;
      const xr = (x + 1) % size;
      const yu = (y - 1 + size) % size;
      const yd = (y + 1) % size;

      const hL = heightData[y * size + xl];
      const hR = heightData[y * size + xr];
      const hU = heightData[yu * size + x];
      const hD = heightData[yd * size + x];

      // Sobel gradient
      const strength = 6.5;
      const dx = (hR - hL) * strength;
      const dy = (hD - hU) * strength;
      const dz = 1.0;

      const len = Math.hypot(dx, dy, dz);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = dz / len;

      // Pack normal into [0, 255]
      nImg.data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      // Roughness: peaks are shinier, creases gather tiny micro-shadows
      const rVal = Math.floor(25 + heightData[y * size + x] * 60);
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  // Paint subtle dark Kapton seam tape across the edges
  nCtx.fillStyle = 'rgba(20, 15, 10, 0.35)';
  nCtx.fillRect(0, 0, 8, size);
  nCtx.fillRect(0, 0, size, 8);

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(3, 3);

  const roughnessTex = new THREE.CanvasTexture(roughnessCanvas);
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;
  roughnessTex.repeat.set(3, 3);

  const result = { normal: normalTex, roughness: roughnessTex };
  textureCache.set('foil', result);
  return result;
}

/**
 * 2. Brushed Anisotropic Aluminum Normal & Roughness Map
 */
export function createBrushedAlloyTextures() {
  if (textureCache.has('aluminum')) return textureCache.get('aluminum');

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8080ff'; // Flat normal base
  ctx.fillRect(0, 0, size, size);

  // Draw fine horizontal micro-brush streaks
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * size;
    const alpha = Math.random() * 0.14 + 0.04;
    const isBright = Math.random() > 0.5;
    ctx.strokeStyle = isBright ? `rgba(180, 180, 255, ${alpha})` : `rgba(70, 70, 200, ${alpha})`;
    ctx.lineWidth = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const normalTex = new THREE.CanvasTexture(canvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(4, 4);

  const result = { normal: normalTex };
  textureCache.set('aluminum', result);
  return result;
}

/**
 * 3. Commemorative Plaque Stamped Stainless Steel Texture
 * Authentic Apollo 11 text and twin hemispheres.
 */
export function createApollo11PlaqueTexture() {
  if (textureCache.has('plaque')) return textureCache.get('plaque');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Brushed steel background
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
  bgGrad.addColorStop(0, '#f2f4f8');
  bgGrad.addColorStop(0.5, '#dbe0e8');
  bgGrad.addColorStop(1, '#e4e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 640);

  // Subtle bevel border
  ctx.strokeStyle = '#5a6270';
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, 992, 608);

  ctx.strokeStyle = '#9ea7b5';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 964, 580);

  // Hemispheres outlines (Earth Eastern & Western hemispheres)
  ctx.fillStyle = '#1c2028';
  ctx.beginPath();
  ctx.arc(360, 210, 105, 0, Math.PI * 2);
  ctx.arc(664, 210, 105, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#222832';
  ctx.stroke();

  // Continents simplified silhouette
  ctx.fillStyle = '#343b47';
  ctx.beginPath();
  // Western
  ctx.ellipse(350, 190, 48, 75, -0.2, 0, Math.PI * 2);
  ctx.ellipse(370, 245, 38, 55, 0.3, 0, Math.PI * 2);
  // Eastern
  ctx.ellipse(650, 180, 55, 65, 0.1, 0, Math.PI * 2);
  ctx.ellipse(675, 230, 45, 50, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Inscribed Text
  ctx.fillStyle = '#0f1218';
  ctx.textAlign = 'center';

  ctx.font = '600 32px "Inter", "Arial", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('HERE MEN FROM THE PLANET EARTH', 512, 365);
  ctx.fillText('FIRST SET FOOT UPON THE MOON', 512, 410);

  ctx.font = '500 28px "Inter", "Arial", sans-serif';
  ctx.fillText('JULY 1969, A. D.', 512, 465);

  ctx.font = 'italic 300 29px "Cormorant Garamond", "Times New Roman", serif';
  ctx.fillText('WE CAME IN PEACE FOR ALL MANKIND', 512, 515);

  // Signatures line
  ctx.font = '500 17px "Space Mono", monospace';
  ctx.fillStyle = '#444c59';
  ctx.fillText('NEIL A. ARMSTRONG    MICHAEL COLLINS    EDWIN E. ALDRIN, JR.    RICHARD NIXON', 512, 580);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set('plaque', tex);
  return tex;
}

/**
 * 4. Titanium / Inconel Scorch Gradient for DPS Rocket Engine
 */
export function createEngineScorchTexture() {
  if (textureCache.has('scorch')) return textureCache.get('scorch');

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Vertical heat gradient along bell cone
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#3a3d44'); // Top throat: dull oxidized titanium
  grad.addColorStop(0.35, '#2e323a');
  grad.addColorStop(0.55, '#3b4356'); // Blue-purple heat bloom
  grad.addColorStop(0.68, '#594432'); // Bronze-gold oxidation ring
  grad.addColorStop(0.82, '#2b231d');
  grad.addColorStop(1.0, '#121214'); // Bottom skirt rim: carbon exhaust soot

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  // Horizontal manufacturing heat rings and weld lines
  for (let i = 0; i < 28; i++) {
    const y = Math.random() * 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, y, 128, Math.random() * 3 + 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set('scorch', tex);
  return tex;
}

/**
 * 5. Lunar Astronaut Footprint Sole Tread Normal Map
 * Distinctive Apollo A7L space suit horizontal rib tread marks.
 */
export function createFootprintTexture() {
  if (textureCache.has('footprint')) return textureCache.get('footprint');

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background is transparent
  ctx.clearRect(0, 0, 256, 512);

  // Sole silhouette depression mask
  ctx.fillStyle = 'rgba(20, 22, 26, 0.75)';
  ctx.beginPath();
  // Heel
  ctx.ellipse(128, 390, 55, 75, 0, 0, Math.PI * 2);
  // Ball & toe
  ctx.ellipse(128, 190, 70, 125, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal ribbed tread impressions
  ctx.strokeStyle = 'rgba(5, 6, 8, 0.95)';
  ctx.lineWidth = 9;
  for (let y = 80; y <= 450; y += 22) {
    // Leave small arch gap
    if (y > 290 && y < 330) continue;
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(186, y);
    ctx.stroke();
  }

  // Raised rim rimming around impression
  ctx.strokeStyle = 'rgba(160, 165, 175, 0.35)';
  ctx.lineWidth = 4;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set('footprint', tex);
  return tex;
}

/**
 * 6. Contact Soil Displaced Berm & Ground Ambient Occlusion Texture
 * Creates circular compressed lunar dirt rim under lander footpads.
 */
export function createFootpadBermTexture() {
  if (textureCache.has('berm')) return textureCache.get('berm');

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);

  // Soft ambient contact occlusion shadow (pure dark shadow, zero glowing halo)
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 118);
  grad.addColorStop(0.0, 'rgba(4, 5, 8, 0.92)');
  grad.addColorStop(0.45, 'rgba(8, 10, 14, 0.65)');
  grad.addColorStop(0.75, 'rgba(12, 14, 18, 0.22)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set('berm', tex);
  return tex;
}

/**
 * High-Quality Aerospace Material Factory
 */
export function getAerospaceMaterials() {
  const foilTex = createCrinkledFoilTextures();
  const alloyTex = createBrushedAlloyTextures();
  const plaqueTex = createApollo11PlaqueTexture();
  const scorchTex = createEngineScorchTexture();

  return {
    // 1. Hand-wrapped Gold Kapton Foil (Zero self-glow in vacuum)
    goldKapton: new THREE.MeshPhysicalMaterial({
      color: 0xdeb846,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 1.0,
      roughness: 0.22,
      roughnessMap: foilTex.roughness,
      normalMap: foilTex.normal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      clearcoat: 0.85,
      clearcoatRoughness: 0.18,
      reflectivity: 0.98
    }),

    // 2. Amber/Copper Mylar Blanket (Zero self-glow in vacuum)
    amberKapton: new THREE.MeshPhysicalMaterial({
      color: 0xbf6724,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      metalness: 0.98,
      roughness: 0.26,
      roughnessMap: foilTex.roughness,
      normalMap: foilTex.normal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      clearcoat: 0.8,
      clearcoatRoughness: 0.22
    }),

    // 3. Black Inconel & Pyromark Thermal Shield (Top deck & engine heat shielding)
    blackInconel: new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      metalness: 0.88,
      roughness: 0.52,
      normalMap: alloyTex.normal,
      normalScale: new THREE.Vector2(0.3, 0.3)
    }),

    // 4. Anodized / Bare Structural 7075 Aluminum (Struts, ladder, trusses)
    aluminumAlloy: new THREE.MeshStandardMaterial({
      color: 0x98a0ab,
      metalness: 0.92,
      roughness: 0.32,
      normalMap: alloyTex.normal,
      normalScale: new THREE.Vector2(0.35, 0.35)
    }),

    // 5. DPS Engine Rocket Nozzle (Scorched titanium/niobium alloy)
    engineScorched: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: scorchTex,
      metalness: 0.85,
      roughness: 0.38,
      side: THREE.DoubleSide
    }),

    // 6. Commemorative Plaque (Polished stainless steel)
    commemorativePlaque: new THREE.MeshStandardMaterial({
      map: plaqueTex,
      metalness: 0.9,
      roughness: 0.18
    }),

    // 7. White Thermal Beta Cloth (Blankets & protective wraps)
    betaCloth: new THREE.MeshStandardMaterial({
      color: 0xd4d8de,
      metalness: 0.06,
      roughness: 0.85
    }),

    // 8. Contact Sensors & Wiring (Thin spring-steel probes)
    springSteel: new THREE.MeshStandardMaterial({
      color: 0x7a808b,
      metalness: 0.96,
      roughness: 0.3
    }),

    // 9. LRV Wire-Mesh Tire with Titanium Chevron Cleats (Alpha-tested open wire weave)
    lrvWheelMesh: new THREE.MeshPhysicalMaterial({
      map: createLRVWheelTexture().map,
      normalMap: createLRVWheelTexture().normal,
      normalScale: new THREE.Vector2(1.8, 1.8),
      metalness: 0.95,
      roughness: 0.32,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
      transparent: true,
      alphaTest: 0.26,
      depthWrite: true,
      side: THREE.DoubleSide
    }),

    // 10. LRV Seat Webbing (Woven olive/gray nylon straps)
    seatWebbing: new THREE.MeshStandardMaterial({
      color: 0x4e544a,
      metalness: 0.08,
      roughness: 0.92
    }),

    // 11. Apollo 17 Taped Lunar Map Fender Repair (Laminated maps & gray duct tape)
    tapedFender: new THREE.MeshStandardMaterial({
      map: createApollo17TapedMapTexture(),
      metalness: 0.12,
      roughness: 0.72,
      side: THREE.DoubleSide
    }),

    // 12. LRV Display & Control Console Instrument Panel
    lrvConsole: new THREE.MeshStandardMaterial({
      map: createLRVConsoleTexture(),
      metalness: 0.5,
      roughness: 0.45
    }),

    // 13. LRV Slotted Floor Bed Corrugated Grid
    lrvFloor: new THREE.MeshStandardMaterial({
      map: createLRVFloorGridTexture().map,
      normalMap: createLRVFloorGridTexture().normal,
      normalScale: new THREE.Vector2(1.2, 1.2),
      metalness: 0.90,
      roughness: 0.36
    }),

    // 14. Specular Quartz Thermal Mirror Tiles (Battery radiators)
    quartzMirror: new THREE.MeshPhysicalMaterial({
      color: 0xf5f8ff,
      metalness: 0.98,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 0.99
    }),

    // 15. High-Gain S-Band Dish Golden Wire Mesh
    goldDishMesh: new THREE.MeshStandardMaterial({
      color: 0xdaa520,
      metalness: 0.96,
      roughness: 0.25,
      side: THREE.DoubleSide
    }),

    // 16. Optical Camera Lens Glass
    opticalLens: new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.15,
      roughness: 0.05,
      transmission: 0.35,
      reflectivity: 0.95
    }),

    // 17. Titanium Chevron Tread Cleat Alloy
    titaniumCleat: new THREE.MeshStandardMaterial({
      color: 0x767d88,
      metalness: 0.94,
      roughness: 0.35
    })
  };
}

/**
 * 7. LRV Wire-Mesh Tire Texture with Titanium Chevron Cleats (Alpha-tested open wire lattice)
 */
export function createLRVWheelTexture() {
  if (textureCache.has('lrv_wheel')) return textureCache.get('lrv_wheel');

  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Clear completely to transparent for see-through wire mesh
  ctx.clearRect(0, 0, width, height);

  // Woven zinc-coated steel wire mesh lattice
  const spacing = 16;
  const wireWidth = 2.4;

  // Drop shadow under cross points
  ctx.strokeStyle = 'rgba(35, 40, 48, 0.75)';
  ctx.lineWidth = wireWidth + 1.2;
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + height, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Metallic zinc-coated high-tensile steel wire strands
  ctx.strokeStyle = '#9ca5b2';
  ctx.lineWidth = wireWidth;
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  for (let x = -height; x < width + height; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + height, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Specular wire weave nodes
  ctx.fillStyle = '#dbe2ec';
  for (let y = 0; y <= height; y += spacing) {
    for (let x = 0; x <= width; x += spacing) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  // Titanium chevron tread cleats (V-shaped traction bars riveted to mesh)
  // Herringbone pattern riveted around circumference
  const cleatStep = 32;
  const cleatW = 16;
  const topY = 36;
  const midY = height / 2;
  const botY = height - 36;

  for (let x = 0; x < width; x += cleatStep) {
    // Chevron body
    ctx.fillStyle = '#6e7682';
    ctx.strokeStyle = '#22262d';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x + 16, midY);
    ctx.lineTo(x, botY);
    ctx.lineTo(x + cleatW, botY);
    ctx.lineTo(x + cleatW + 16, midY);
    ctx.lineTo(x + cleatW, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top beveled highlight edge
    ctx.strokeStyle = '#b8c0cc';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x + 16, midY);
    ctx.lineTo(x, botY);
    ctx.stroke();

    // Rivet dots securing cleat to wire mesh
    [topY + 18, midY, botY - 18].forEach((ry, idx) => {
      const rx = idx === 1 ? x + cleatW / 2 + 16 : x + cleatW / 2;
      ctx.fillStyle = '#e8edf6';
      ctx.beginPath();
      ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b1d22';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  // Clinging lunar dust along tire edges
  ctx.fillStyle = 'rgba(135, 130, 120, 0.25)';
  ctx.fillRect(0, 0, width, 18);
  ctx.fillRect(0, height - 18, width, 18);

  const diffuseTex = new THREE.CanvasTexture(canvas);
  diffuseTex.wrapS = THREE.RepeatWrapping;
  diffuseTex.wrapT = THREE.RepeatWrapping;

  // Tangent Normal Map
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const nCtx = normalCanvas.getContext('2d');
  nCtx.fillStyle = '#8080ff';
  nCtx.fillRect(0, 0, width, height);

  for (let x = 0; x < width; x += cleatStep) {
    nCtx.fillStyle = '#b080ff';
    nCtx.beginPath();
    nCtx.moveTo(x, topY);
    nCtx.lineTo(x + 16, midY);
    nCtx.lineTo(x, botY);
    nCtx.lineTo(x + cleatW, botY);
    nCtx.lineTo(x + cleatW + 16, midY);
    nCtx.lineTo(x + cleatW, topY);
    nCtx.closePath();
    nCtx.fill();
  }

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;

  const result = { map: diffuseTex, normal: normalTex };
  textureCache.set('lrv_wheel', result);
  return result;
}

/**
 * 7b. Apollo 17 Taped Lunar Chronomap Fender Repair Texture
 */
export function createApollo17TapedMapTexture() {
  if (textureCache.has('apollo17_map')) return textureCache.get('apollo17_map');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Cream/ivory laminated paper background
  ctx.fillStyle = '#eae5d4';
  ctx.fillRect(0, 0, 512, 512);

  // Topographic shading
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
  grad.addColorStop(0, 'rgba(155, 150, 135, 0.40)');
  grad.addColorStop(1, 'rgba(195, 190, 175, 0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Contour rings & crater circles
  ctx.strokeStyle = 'rgba(85, 75, 60, 0.35)';
  ctx.lineWidth = 1.5;
  [[120, 140, 48], [340, 160, 64], [220, 360, 52], [380, 380, 40]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (let r = 80; r < 240; r += 38) {
    ctx.beginPath();
    ctx.ellipse(256, 256, r * 1.2, r * 0.8, 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Grid coordinates
  ctx.strokeStyle = 'rgba(60, 55, 45, 0.35)';
  ctx.lineWidth = 1.0;
  for (let x = 64; x < 512; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 64; y < 512; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Navigation text
  ctx.fillStyle = '#28251e';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('TAURUS-LITTROW EVA-2', 28, 44);
  ctx.font = '11px monospace';
  ctx.fillText('LAT 20°09\'55"N  LONG 30°46\'18"E', 28, 64);
  ctx.fillText('STATION 2 - SOUTH MASSIF', 28, 82);
  ctx.fillText('STATION 4 - SHORTY CRATER', 28, 100);

  // Apollo gray duct tape cross seams
  const tapeColor = '#4a5058';
  const tapeHighlight = '#707680';

  // Horizontal tape seam
  ctx.fillStyle = tapeColor;
  ctx.fillRect(0, 238, 512, 38);
  ctx.fillStyle = tapeHighlight;
  ctx.fillRect(0, 239, 512, 2);

  // Vertical tape seam
  ctx.fillStyle = tapeColor;
  ctx.fillRect(236, 0, 38, 512);
  ctx.fillStyle = tapeHighlight;
  ctx.fillRect(237, 0, 2, 512);

  // Perimeter tape bands
  ctx.fillStyle = tapeColor;
  ctx.fillRect(0, 0, 512, 26);
  ctx.fillRect(0, 486, 512, 26);

  // Tape wrinkles
  ctx.strokeStyle = 'rgba(25, 27, 30, 0.55)';
  ctx.lineWidth = 1.0;
  for (let i = 0; i < 512; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 238); ctx.lineTo(i + 14, 276);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(236, i); ctx.lineTo(274, i + 14);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('apollo17_map', tex);
  return tex;
}

/**
 * 7c. LRV Display & Control Console Instrument Panel Texture
 */
export function createLRVConsoleTexture() {
  if (textureCache.has('lrv_console')) return textureCache.get('lrv_console');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark matte aerospace anodized aluminum panel
  ctx.fillStyle = '#15171c';
  ctx.fillRect(0, 0, 512, 512);

  // Bezel border
  ctx.strokeStyle = '#323640';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 500);

  // Sun Compass dial
  ctx.fillStyle = '#1e222a';
  ctx.beginPath();
  ctx.arc(256, 100, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4e5666';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = '#cfd4dc';
  ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 58, 100 + Math.sin(a) * 58);
    ctx.lineTo(256 + Math.cos(a) * 70, 100 + Math.sin(a) * 70);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8ecf2';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SUN COMPASS', 256, 105);

  // Attitude 8-Ball (Left)
  ctx.fillStyle = '#101216';
  ctx.beginPath();
  ctx.arc(105, 230, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0e4eb';
  ctx.beginPath();
  ctx.arc(105, 230, 54, Math.PI, 0, false);
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 230); ctx.lineTo(140, 230);
  ctx.stroke();
  ctx.fillText('ATTITUDE', 105, 305);

  // Speedometer (Right)
  ctx.fillStyle = '#101216';
  ctx.beginPath();
  ctx.arc(405, 230, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfd4dc';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let s = 0; s <= 20; s += 2) {
    const ang = Math.PI * 0.75 + (s / 20) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(405 + Math.cos(ang) * 40, 230 + Math.sin(ang) * 40);
    ctx.lineTo(405 + Math.cos(ang) * 52, 230 + Math.sin(ang) * 52);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 2.5;
  const needAng = Math.PI * 0.75 + (8 / 20) * Math.PI * 1.5;
  ctx.beginPath();
  ctx.moveTo(405, 230);
  ctx.lineTo(405 + Math.cos(needAng) * 46, 230 + Math.sin(needAng) * 46);
  ctx.stroke();
  ctx.fillStyle = '#e8ecf2';
  ctx.fillText('SPEED KM/H', 405, 305);

  // Center Battery & Motor Meters
  ctx.fillStyle = '#1b1e25';
  ctx.fillRect(176, 195, 160, 125);
  ctx.strokeStyle = '#464e5c';
  ctx.strokeRect(176, 195, 160, 125);
  ctx.fillStyle = '#8e96a4';
  ctx.font = '10px monospace';
  ctx.fillText('BAT 1: 36.2V  118Ah', 256, 220);
  ctx.fillText('BAT 2: 36.1V  115Ah', 256, 240);
  ctx.fillText('MOTORS: LF RF LR RR', 256, 270);
  ctx.fillStyle = '#34c759';
  ctx.fillText('TEMP:  NORM (52°C)', 256, 290);

  // Lower Toggle Switches
  ctx.fillStyle = '#1f232c';
  ctx.fillRect(36, 355, 440, 115);
  ctx.strokeStyle = '#363c48';
  ctx.strokeRect(36, 355, 440, 115);

  ctx.fillStyle = '#d0d6e0';
  ctx.font = '9px sans-serif';
  const switches = ['STEER FWD', 'STEER REAR', 'DRIVE PWR', 'PWM 1', 'PWM 2', 'AUX PWR'];
  switches.forEach((label, idx) => {
    const swX = 68 + idx * 68;
    ctx.strokeStyle = '#6f7784';
    ctx.lineWidth = 2;
    ctx.strokeRect(swX - 12, 380, 24, 42);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(swX, 401, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9ea7b4';
    ctx.fillText(label, swX, 445);
  });

  // Plaque
  ctx.fillStyle = '#c5a059';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('LUNAR ROVING VEHICLE • BOEING / DELCO', 256, 492);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache.set('lrv_console', tex);
  return tex;
}

/**
 * 7d. LRV Slotted Floor Bed Corrugated Grid Texture
 */
export function createLRVFloorGridTexture() {
  if (textureCache.has('lrv_floor')) return textureCache.get('lrv_floor');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Brushed aluminum
  ctx.fillStyle = '#7a828c';
  ctx.fillRect(0, 0, 512, 512);

  // Perforated boot traction slots
  ctx.fillStyle = '#22252a';
  for (let y = 16; y < 512; y += 32) {
    for (let x = 12; x < 512; x += 48) {
      ctx.beginPath();
      ctx.roundRect(x, y, 32, 12, 4);
      ctx.fill();
      ctx.strokeStyle = '#9ca6b2';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  // Cross structural ribs
  ctx.strokeStyle = '#4e545e';
  ctx.lineWidth = 3;
  for (let x = 0; x < 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);

  // Normal map
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = 512;
  normalCanvas.height = 512;
  const nCtx = normalCanvas.getContext('2d');
  nCtx.fillStyle = '#8080ff';
  nCtx.fillRect(0, 0, 512, 512);

  for (let y = 16; y < 512; y += 32) {
    for (let x = 12; x < 512; x += 48) {
      nCtx.fillStyle = '#6060c0';
      nCtx.beginPath();
      nCtx.roundRect(x, y, 32, 12, 4);
      nCtx.fill();
    }
  }

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(4, 4);

  const result = { map: tex, normal: normalTex };
  textureCache.set('lrv_floor', result);
  return result;
}

/**
 * 8. Lunar Regolith Chevron Rover Tire Tracks (PBR Decal with Distance Fade)
 */
export function createLRVTracksTexture() {
  if (textureCache.has('lrv_tracks_pbr')) return textureCache.get('lrv_tracks_pbr');

  const width = 256;
  const height = 1024;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d');

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const nCtx = normalCanvas.getContext('2d');

  // Fill transparent
  aCtx.clearRect(0, 0, width, height);
  nCtx.fillStyle = '#8080ff'; // Flat tangent normal
  nCtx.fillRect(0, 0, width, height);

  // Twin tire track impressions (spaced 1.8m wheel track apart)
  const leftX = 54;
  const rightX = 202;

  [leftX, rightX].forEach((cx) => {
    // Compressed dark regolith impression
    aCtx.fillStyle = 'rgba(20, 22, 28, 0.88)';
    aCtx.fillRect(cx - 24, 0, 48, height);

    // Chevron cleat depressions
    aCtx.strokeStyle = 'rgba(10, 12, 16, 0.98)';
    aCtx.lineWidth = 5;
    for (let y = 0; y < height; y += 22) {
      aCtx.beginPath();
      aCtx.moveTo(cx - 20, y);
      aCtx.lineTo(cx, y + 12);
      aCtx.lineTo(cx + 20, y);
      aCtx.stroke();
    }

    // Displaced berm edges (raised lighter dust along outer rims)
    aCtx.strokeStyle = 'rgba(110, 115, 125, 0.45)';
    aCtx.lineWidth = 4;
    aCtx.beginPath();
    aCtx.moveTo(cx - 26, 0);
    aCtx.lineTo(cx - 26, height);
    aCtx.moveTo(cx + 26, 0);
    aCtx.lineTo(cx + 26, height);
    aCtx.stroke();
  });

  // Apply distance fade along Y (alpha fades smoothly toward top/far end)
  const imgData = aCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    // y = 0 is far end (fade to 0), y = height is under rover (full opacity)
    const factor = Math.min(1.0, Math.pow(y / (height * 0.75), 1.4));
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx + 3] = Math.round(data[idx + 3] * factor);
    }
  }
  aCtx.putImageData(imgData, 0, 0);

  // Create normal map from chevron shapes
  const nImg = nCtx.getImageData(0, 0, width, height);
  const nData = nImg.data;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const aL = data[(y * width + (x - 1)) * 4 + 3];
      const aR = data[(y * width + (x + 1)) * 4 + 3];
      const aU = data[((y - 1) * width + x) * 4 + 3];
      const aD = data[((y + 1) * width + x) * 4 + 3];

      const dx = (aR - aL) / 255.0 * 2.5;
      const dy = (aD - aU) / 255.0 * 2.5;
      const dz = 1.0;
      const len = Math.hypot(dx, dy, dz);

      nData[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      nData[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      nData[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const albedoTex = new THREE.CanvasTexture(albedoCanvas);
  albedoTex.wrapS = THREE.ClampToEdgeWrapping;
  albedoTex.wrapT = THREE.ClampToEdgeWrapping;

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.ClampToEdgeWrapping;
  normalTex.wrapT = THREE.ClampToEdgeWrapping;

  const result = { map: albedoTex, normal: normalTex };
  textureCache.set('lrv_tracks_pbr', result);
  return result;
}

/**
 * 9. Martian Sand Rover Tire Tracks (PBR Decal with Distance Fade)
 */
export function createMarsTracksTexture(isOpportunity = false) {
  const cacheKey = isOpportunity ? 'mars_tracks_oppy' : 'mars_tracks_spirit';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const width = 256;
  const height = 1024;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d');

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const nCtx = normalCanvas.getContext('2d');

  aCtx.clearRect(0, 0, width, height);
  nCtx.fillStyle = '#8080ff';
  nCtx.fillRect(0, 0, width, height);

  // MER wheel track spacing
  const leftX = 52;
  const rightX = 204;

  [leftX, rightX].forEach((cx, colIdx) => {
    const isStuckWheel = !isOpportunity && colIdx === 1; // Spirit right-front stuck wheel furrow!

    if (isStuckWheel) {
      // Deep dragged furrow rut in Troy sand
      aCtx.fillStyle = 'rgba(40, 16, 10, 0.95)';
      aCtx.fillRect(cx - 28, 0, 56, height);

      // Exposed silica bright sand core
      aCtx.fillStyle = 'rgba(235, 230, 215, 0.75)';
      aCtx.fillRect(cx - 10, 0, 20, height);

      // Raised berm walls
      aCtx.strokeStyle = 'rgba(120, 52, 28, 0.65)';
      aCtx.lineWidth = 6;
      aCtx.beginPath();
      aCtx.moveTo(cx - 30, 0); aCtx.lineTo(cx - 30, height);
      aCtx.moveTo(cx + 30, 0); aCtx.lineTo(cx + 30, height);
      aCtx.stroke();
    } else {
      // Regular rotating wheel tracks
      aCtx.fillStyle = 'rgba(55, 22, 12, 0.90)';
      aCtx.fillRect(cx - 22, 0, 44, height);

      // Straight cleat depressions
      aCtx.strokeStyle = 'rgba(28, 10, 6, 0.98)';
      aCtx.lineWidth = 4;
      for (let y = 0; y < height; y += 18) {
        aCtx.beginPath();
        aCtx.moveTo(cx - 18, y);
        aCtx.lineTo(cx + 18, y);
        aCtx.stroke();
      }

      // Berm edges
      aCtx.strokeStyle = 'rgba(145, 62, 34, 0.50)';
      aCtx.lineWidth = 4;
      aCtx.beginPath();
      aCtx.moveTo(cx - 24, 0); aCtx.lineTo(cx - 24, height);
      aCtx.moveTo(cx + 24, 0); aCtx.lineTo(cx + 24, height);
      aCtx.stroke();
    }
  });

  // Distance fade
  const imgData = aCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    const factor = Math.min(1.0, Math.pow(y / (height * 0.75), 1.4));
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx + 3] = Math.round(data[idx + 3] * factor);
    }
  }
  aCtx.putImageData(imgData, 0, 0);

  // Generate normal map
  const nImg = nCtx.getImageData(0, 0, width, height);
  const nData = nImg.data;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const aL = data[(y * width + (x - 1)) * 4 + 3];
      const aR = data[(y * width + (x + 1)) * 4 + 3];
      const aU = data[((y - 1) * width + x) * 4 + 3];
      const aD = data[((y + 1) * width + x) * 4 + 3];

      const dx = (aR - aL) / 255.0 * 2.5;
      const dy = (aD - aU) / 255.0 * 2.5;
      const dz = 1.0;
      const len = Math.hypot(dx, dy, dz);

      nData[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      nData[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      nData[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const albedoTex = new THREE.CanvasTexture(albedoCanvas);
  albedoTex.wrapS = THREE.ClampToEdgeWrapping;
  albedoTex.wrapT = THREE.ClampToEdgeWrapping;

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.ClampToEdgeWrapping;
  normalTex.wrapT = THREE.ClampToEdgeWrapping;

  const result = { map: albedoTex, normal: normalTex };
  textureCache.set(cacheKey, result);
  return result;
}

