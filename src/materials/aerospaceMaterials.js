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

  // Center contact depression shadow
  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 115);
  grad.addColorStop(0.0, 'rgba(10, 12, 16, 0.95)');
  grad.addColorStop(0.45, 'rgba(20, 24, 30, 0.85)');
  grad.addColorStop(0.68, 'rgba(80, 85, 95, 0.45)'); // Raised berm lip rim
  grad.addColorStop(0.9, 'rgba(30, 34, 42, 0.15)');
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
    // 1. Hand-wrapped Gold Kapton Foil (Primary descent stage facets)
    goldKapton: new THREE.MeshPhysicalMaterial({
      color: 0xdeb846,
      emissive: 0x1f1402,
      emissiveIntensity: 0.15,
      metalness: 1.0,
      roughness: 0.18,
      roughnessMap: foilTex.roughness,
      normalMap: foilTex.normal,
      normalScale: new THREE.Vector2(0.95, 0.95),
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      reflectivity: 0.98
    }),

    // 2. Amber/Copper Mylar Blanket (Interspersed thermal insulation panels)
    amberKapton: new THREE.MeshPhysicalMaterial({
      color: 0xbf6724,
      emissive: 0x160802,
      emissiveIntensity: 0.1,
      metalness: 0.98,
      roughness: 0.22,
      roughnessMap: foilTex.roughness,
      normalMap: foilTex.normal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      clearcoat: 0.8,
      clearcoatRoughness: 0.2
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
      color: 0xdde2ea,
      metalness: 0.95,
      roughness: 0.22,
      normalMap: alloyTex.normal,
      normalScale: new THREE.Vector2(0.4, 0.4)
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
      color: 0xe8ebf0,
      metalness: 0.04,
      roughness: 0.82
    }),

    // 8. Contact Sensors & Wiring (Thin spring-steel probes)
    springSteel: new THREE.MeshStandardMaterial({
      color: 0x7a808b,
      metalness: 0.96,
      roughness: 0.3
    })
  };
}
