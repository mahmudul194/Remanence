/**
 * Particle Systems for REMANENCE
 * Handles deep space stars, lunar regolith dust, and Martian atmospheric storm particles
 * with cursor deflection and mouse parallax.
 */

import * as THREE from 'three';

export function createParticleManager(scene) {
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Listen to mouse movement for interactive parallax
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // 1. Deep Space Starfield (spherical shell & volume)
  const starCount = 3500;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // Distribute in a large volume around the trajectory
    const r = 180 + Math.random() * 600;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = (Math.random() - 0.2) * 1200;

    // Star color variation: cool blue, warm yellow, stark white
    const temp = Math.random();
    if (temp < 0.6) {
      starColors[i * 3] = 0.9; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 1.0;
    } else if (temp < 0.85) {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.7;
    } else {
      starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0;
    }
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  });
  const starsMesh = new THREE.Points(starGeo, starMat);
  scene.add(starsMesh);

  // 2. Lunar Regolith Dust (electrostatic floating micro-particles near Moon)
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
    size: 0.45,
    color: 0xcccccc,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const lunarMesh = new THREE.Points(lunarGeo, lunarMat);
  scene.add(lunarMesh);

  // 3. Martian Atmospheric Dust Storm Particles (around Mars scene)
  const marsDustCount = 2400;
  const marsGeo = new THREE.BufferGeometry();
  const marsPos = new Float32Array(marsDustCount * 3);
  const marsVels = new Float32Array(marsDustCount * 3);

  for (let i = 0; i < marsDustCount; i++) {
    marsPos[i * 3] = (Math.random() - 0.5) * 220;
    marsPos[i * 3 + 1] = -10 + Math.random() * 25;
    marsPos[i * 3 + 2] = 550 + Math.random() * 320;

    // Drifting velocity vectors for wind
    marsVels[i * 3] = 0.8 + Math.random() * 1.5; // Wind blowing east
    marsVels[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
    marsVels[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
  }
  marsGeo.setAttribute('position', new THREE.BufferAttribute(marsPos, 3));
  const marsMat = new THREE.PointsMaterial({
    size: 0.8,
    color: 0xdd6633,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending
  });
  const marsDustMesh = new THREE.Points(marsGeo, marsMat);
  scene.add(marsDustMesh);

  let dustStormDensity = 1.0;

  function setDustStormIntensity(multiplier) {
    dustStormDensity = multiplier;
    marsMat.opacity = Math.min(0.9, 0.45 * multiplier);
    marsMat.size = 0.8 * Math.sqrt(multiplier);
  }

  function update(delta) {
    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Lunar regolith levitation drift
    const lPos = lunarGeo.attributes.position.array;
    for (let i = 0; i < lunarCount; i++) {
      lPos[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.008;
      // Cursor repulsion
      lPos[i * 3] += mouse.x * 0.02;
    }
    lunarGeo.attributes.position.needsUpdate = true;

    // Martian wind movement
    const mPos = marsGeo.attributes.position.array;
    for (let i = 0; i < marsDustCount; i++) {
      mPos[i * 3] += marsVels[i * 3] * delta * 12 * dustStormDensity;
      mPos[i * 3 + 1] += marsVels[i * 3 + 1] * delta * 4;
      mPos[i * 3 + 2] += marsVels[i * 3 + 2] * delta * 6;

      // Wrap around bounding box
      if (mPos[i * 3] > 110) mPos[i * 3] = -110;
      if (mPos[i * 3 + 1] > 20) mPos[i * 3 + 1] = -10;
      if (mPos[i * 3 + 1] < -10) mPos[i * 3 + 1] = 20;
    }
    marsGeo.attributes.position.needsUpdate = true;
  }

  return {
    starsMesh,
    lunarMesh,
    marsDustMesh,
    mouse,
    setDustStormIntensity,
    update
  };
}
