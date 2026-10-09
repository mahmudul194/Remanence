/**
 * High-Performance Cosmic Particle Systems for REMANENCE
 *
 * Implements:
 * - 3-Layer Parallax Starfield (Deep Cosmic, Midfield, Foreground).
 * - Star Streaks: stretches foreground stars along direction of travel via vertex shader.
 * - Cockpit Space Dust (3,500 particles continuously respawned around camera, streaming backward at speed).
 * - Electrostatic lunar regolith levitation.
 * - Dynamic Martian iron-oxide dust storm.
 */

import * as THREE from 'three';

function createSoftParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.2)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createParticleManager(scene, app) {
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const softParticleTex = createSoftParticleTexture();

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // =========================================================================
  // 1. THREE-LAYER PARALLAX STARFIELD WITH VELOCITY STREAKING
  // =========================================================================

  // Layer 1: Deep Cosmic Background (distant, slow, faint)
  const bgCount = 2200;
  const bgGeo = new THREE.BufferGeometry();
  const bgPos = new Float32Array(bgCount * 3);
  const bgCol = new Float32Array(bgCount * 3);

  for (let i = 0; i < bgCount; i++) {
    const r = 900 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    bgPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    bgPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    bgPos[i * 3 + 2] = r * Math.cos(phi);

    bgCol[i * 3] = 0.85; bgCol[i * 3 + 1] = 0.90; bgCol[i * 3 + 2] = 1.0;
  }
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
  const bgMat = new THREE.PointsMaterial({
    size: 0.8,
    map: softParticleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });
  const bgStars = new THREE.Points(bgGeo, bgMat);
  scene.add(bgStars);

  // Layer 2: Mid-Range Stellar Field (spectral variation, twinkle)
  const midCount = 2500;
  const midGeo = new THREE.BufferGeometry();
  const midPos = new Float32Array(midCount * 3);
  const midCol = new Float32Array(midCount * 3);

  for (let i = 0; i < midCount; i++) {
    const r = 350 + Math.random() * 650;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    midPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    midPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    midPos[i * 3 + 2] = r * Math.cos(phi);

    const temp = Math.random();
    if (temp < 0.5) {
      midCol[i * 3] = 0.95; midCol[i * 3 + 1] = 0.98; midCol[i * 3 + 2] = 1.0; // Blue-white
    } else if (temp < 0.8) {
      midCol[i * 3] = 1.0; midCol[i * 3 + 1] = 0.88; midCol[i * 3 + 2] = 0.72; // Warm yellow
    } else {
      midCol[i * 3] = 1.0; midCol[i * 3 + 1] = 0.65; midCol[i * 3 + 2] = 0.55; // Orange-red
    }
  }
  midGeo.setAttribute('position', new THREE.BufferAttribute(midPos, 3));
  midGeo.setAttribute('color', new THREE.BufferAttribute(midCol, 3));
  const midMat = new THREE.PointsMaterial({
    size: 1.25,
    map: softParticleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const midStars = new THREE.Points(midGeo, midMat);
  scene.add(midStars);

  // Layer 3: Foreground Navigational Stars with Velocity Streaks Shader
  const fgCount = 1200;
  const fgGeo = new THREE.BufferGeometry();
  const fgPos = new Float32Array(fgCount * 3);
  const fgCol = new Float32Array(fgCount * 3);
  const fgSize = new Float32Array(fgCount);

  for (let i = 0; i < fgCount; i++) {
    const r = 140 + Math.random() * 320;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    fgPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    fgPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    fgPos[i * 3 + 2] = r * Math.cos(phi);

    fgCol[i * 3] = 1.0; fgCol[i * 3 + 1] = 0.95; fgCol[i * 3 + 2] = 0.90;
    fgSize[i] = 1.8 + Math.random() * 2.2;
  }
  fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
  fgGeo.setAttribute('color', new THREE.BufferAttribute(fgCol, 3));
  fgGeo.setAttribute('aBaseSize', new THREE.BufferAttribute(fgSize, 1));

  const streakUniforms = {
    uSpeed: { value: 0.0 },
    uVelocity: { value: new THREE.Vector3(0, 0, -1) },
    uTime: { value: 0.0 }
  };

  const fgShaderMat = new THREE.ShaderMaterial({
    uniforms: streakUniforms,
    vertexShader: `
      attribute vec3 color;
      attribute float aBaseSize;
      uniform float uSpeed;
      uniform vec3 uVelocity;
      uniform float uTime;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vAlpha = 0.95;

        // Subtle organic scintillation
        float twinkle = sin(uTime * 3.0 + position.x * 0.05) * 0.2 + 0.8;
        vAlpha *= twinkle;

        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPos;

        // Star streak size elongation scaled by travel speed
        float speedStretch = clamp(uSpeed * 8.0, 1.0, 3.8);
        gl_PointSize = aBaseSize * speedStretch * (300.0 / -mvPos.z);
        gl_PointSize = clamp(gl_PointSize, 1.5, 36.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float intensity = pow(1.0 - smoothstep(0.0, 0.5, dist), 1.8);
        gl_FragColor = vec4(vColor, intensity * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const fgStars = new THREE.Points(fgGeo, fgShaderMat);
  scene.add(fgStars);

  // =========================================================================
  // 2. COCKPIT SPACE DUST (3,500 particles streaming past camera)
  // =========================================================================
  const dustCount = 3500;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustVels = new Float32Array(dustCount * 3);
  const dustBoxSize = 65.0; // Box centered on camera

  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * dustBoxSize;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * dustBoxSize;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * dustBoxSize;

    dustVels[i * 3] = (Math.random() - 0.5) * 0.05;
    dustVels[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
    dustVels[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.35,
    map: softParticleTex,
    color: 0x88ccff,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const dustMesh = new THREE.Points(dustGeo, dustMat);
  scene.add(dustMesh);

  // =========================================================================
  // 3. LUNAR REGOLITH LEVITATION DUST
  // =========================================================================
  const lunarCount = 1200;
  const lunarGeo = new THREE.BufferGeometry();
  const lunarPos = new Float32Array(lunarCount * 3);
  for (let i = 0; i < lunarCount; i++) {
    lunarPos[i * 3] = (Math.random() - 0.5) * 160;
    lunarPos[i * 3 + 1] = -10 + Math.random() * 12;
    lunarPos[i * 3 + 2] = -240 + Math.random() * 200;
  }
  lunarGeo.setAttribute('position', new THREE.BufferAttribute(lunarPos, 3));
  const lunarMat = new THREE.PointsMaterial({
    size: 0.32,
    map: softParticleTex,
    color: 0xc4c7cc,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const lunarMesh = new THREE.Points(lunarGeo, lunarMat);
  scene.add(lunarMesh);

  // =========================================================================
  // 4. MARTIAN ATMOSPHERIC DUST STORM
  // =========================================================================
  const marsDustCount = 2400;
  const marsGeo = new THREE.BufferGeometry();
  const marsPos = new Float32Array(marsDustCount * 3);
  const marsVels = new Float32Array(marsDustCount * 3);

  for (let i = 0; i < marsDustCount; i++) {
    marsPos[i * 3] = (Math.random() - 0.5) * 220;
    marsPos[i * 3 + 1] = -10 + Math.random() * 25;
    marsPos[i * 3 + 2] = 550 + Math.random() * 340;

    marsVels[i * 3] = 0.8 + Math.random() * 1.5;
    marsVels[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
    marsVels[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  marsGeo.setAttribute('position', new THREE.BufferAttribute(marsPos, 3));
  const marsMat = new THREE.PointsMaterial({
    size: 0.22,
    map: softParticleTex,
    color: 0xdd6633,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const marsDustMesh = new THREE.Points(marsGeo, marsMat);
  scene.add(marsDustMesh);

  let dustStormDensity = 1.0;

  function setDustStormIntensity(multiplier) {
    dustStormDensity = multiplier;
    marsMat.opacity = Math.min(0.9, 0.45 * multiplier);
    marsMat.size = 0.8 * Math.sqrt(multiplier);
  }

  function update(delta, camPos = null, speedNorm = 0.0, time = 0.0) {
    // Parallax mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Update star streaks
    streakUniforms.uSpeed.value = speedNorm;
    streakUniforms.uTime.value = time;

    // Cockpit space dust animation
    if (camPos) {
      const dPositions = dustGeo.attributes.position.array;
      const streamVelocity = speedNorm * 55.0;

      for (let i = 0; i < dustCount; i++) {
        // Stream backwards relative to forward travel
        dPositions[i * 3 + 2] += (dustVels[i * 3 + 2] + streamVelocity) * delta;

        // Wrap around moving camera bounding box
        const halfBox = dustBoxSize * 0.5;
        if (dPositions[i * 3] < camPos.x - halfBox) dPositions[i * 3] += dustBoxSize;
        if (dPositions[i * 3] > camPos.x + halfBox) dPositions[i * 3] -= dustBoxSize;
        if (dPositions[i * 3 + 1] < camPos.y - halfBox) dPositions[i * 3 + 1] += dustBoxSize;
        if (dPositions[i * 3 + 1] > camPos.y + halfBox) dPositions[i * 3 + 1] -= dustBoxSize;
        if (dPositions[i * 3 + 2] < camPos.z - halfBox) dPositions[i * 3 + 2] += dustBoxSize;
        if (dPositions[i * 3 + 2] > camPos.z + halfBox) dPositions[i * 3 + 2] -= dustBoxSize;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    // Lunar regolith levitation
    const lPos = lunarGeo.attributes.position.array;
    for (let i = 0; i < lunarCount; i++) {
      lPos[i * 3 + 1] += Math.sin(time + i) * 0.008;
    }
    lunarGeo.attributes.position.needsUpdate = true;

    // Martian wind dust
    const mPos = marsGeo.attributes.position.array;
    for (let i = 0; i < marsDustCount; i++) {
      mPos[i * 3] += marsVels[i * 3] * delta * 12 * dustStormDensity;
      mPos[i * 3 + 1] += marsVels[i * 3 + 1] * delta * 4;
      mPos[i * 3 + 2] += marsVels[i * 3 + 2] * delta * 6;

      if (mPos[i * 3] > 110) mPos[i * 3] = -110;
      if (mPos[i * 3 + 1] > 20) mPos[i * 3 + 1] = -10;
      if (mPos[i * 3 + 1] < -10) mPos[i * 3 + 1] = 20;
    }
    marsGeo.attributes.position.needsUpdate = true;
  }

  return {
    bgStars,
    midStars,
    fgStars,
    dustMesh,
    lunarMesh,
    marsDustMesh,
    mouse,
    setDustStormIntensity,
    update
  };
}
