/**
 * Lunar Surface Scene Component
 * Simulates Mare Tranquillitatis and Apollo landing sites with
 * cratered regolith terrain, rocks, tracks, and machine mountings.
 * Features dramatic high-contrast lunar lighting and realistic PBR regolith.
 */

import * as THREE from 'three';
import { getOrCreateModel } from './models.js';

export async function createMoonScene() {
  const group = new THREE.Group();
  group.name = 'moon_scene';
  group.position.set(0, -10, -180);

  // 1. Lunar Terrain Mesh with realistic craters and micro-relief
  const terrainGeo = new THREE.PlaneGeometry(350, 350, 140, 140);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const craters = [
    { x: 28, z: 32, r: 16, depth: 2.4 }, // Little West Crater (visited by Armstrong)
    { x: 35, z: -55, r: 24, depth: 3.5 },
    { x: -40, z: -95, r: 35, depth: 5.2 }, // Surveyor Crater
    { x: -50, z: 40, r: 15, depth: 1.8 },
    { x: 60, z: 50, r: 20, depth: 2.6 }
  ];

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    // Natural undulating topography
    let y = Math.sin(x * 0.035) * Math.cos(z * 0.035) * 1.8 +
            Math.sin(x * 0.09) * Math.sin(z * 0.07) * 0.6;

    // Apply crater bowls and raised ejecta rims
    craters.forEach((c) => {
      const dist = Math.hypot(x - c.x, z - c.z);
      if (dist < c.r * 1.5) {
        const normDist = dist / c.r;
        if (normDist < 1.0) {
          y -= (1.0 - normDist * normDist) * c.depth;
        } else if (normDist < 1.4) {
          const rimDist = (normDist - 1.0) / 0.4;
          y += Math.sin(rimDist * Math.PI) * (c.depth * 0.4);
        }
      }
    });

    // Tranquility Base touchdown pad: smoothly leveled so footpads rest firmly with zero float
    const distTB = Math.hypot(x, z);
    if (distTB < 14) {
      const blend = Math.max(0, Math.min(1, (distTB - 4.5) / 9.5));
      y = y * blend;
    }

    // Planetary curvature skirt: outer rim slopes downward into the underlying lunar globe
    const distRim = Math.hypot(x, z);
    if (distRim > 105) {
      const drop = (distRim - 105) / 70;
      y -= drop * drop * 32.0;
    }

    posAttr.setY(i, y);
  }
  terrainGeo.computeVertexNormals();

  // Procedural Lunar Regolith Texture & Bump Map
  const { diffuse, bump } = createRegolithTextures();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: diffuse,
    bumpMap: bump,
    bumpScale: 0.35,
    roughness: 0.95,
    metalness: 0.02,
    color: 0x6e7178
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Scatter Dark Basalt Boulders and Rocks
  const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x3f4248,
    roughness: 0.92,
    metalness: 0.08
  });
  const rockCount = 70;
  const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < rockCount; i++) {
    const rx = (Math.random() - 0.5) * 260;
    const rz = (Math.random() - 0.5) * 260;
    const scale = 0.4 + Math.random() * 1.8;
    dummy.position.set(rx, scale * 0.35, rz);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    dummy.scale.set(scale, scale * (0.6 + Math.random() * 0.5), scale);
    dummy.updateMatrix();
    rockInstanced.setMatrixAt(i, dummy.matrix);
  }
  rockInstanced.receiveShadow = true;
  rockInstanced.castShadow = true;
  group.add(rockInstanced);

  // 4. Instantiate Machines at their Historical Lunar Stations
  const machines = {};

  // Tranquility Base pad leveled to y = 0
  const apolloLM = await getOrCreateModel('apollo_lm');
  apolloLM.position.set(0, 0.0, 0);
  group.add(apolloLM);
  machines.apollo11 = apolloLM;

  // ALSEP Station on gentle Mare ridge (y = 0.085)
  const alsep = await getOrCreateModel('alsep');
  alsep.position.set(14, 0.085, -20);
  alsep.rotation.y = 0.4;
  group.add(alsep);
  machines.alsep = alsep;

  // Lunar Roving Vehicle parked near crater slope (y = -4.159)
  const lrv = await getOrCreateModel('lrv_rover');
  lrv.position.set(38, -4.159, -55);
  lrv.rotation.y = 0.65;
  group.add(lrv);
  machines.lrv = lrv;

  // Apollo 15 Hammer & Feather site in Hadley terrain (y = -1.214 on surface)
  const hammerFeather = await getOrCreateModel('hammer_feather');
  hammerFeather.position.set(22, -1.214, -72);
  group.add(hammerFeather);
  machines.hammer_feather = hammerFeather;

  // Surveyor 3 on eastern inner slope of Surveyor Crater (y = -3.551)
  const surveyor = await getOrCreateModel('surveyor');
  surveyor.position.set(-40, -3.551, -95);
  surveyor.rotation.set(0.18, 0.5, 0.08);
  group.add(surveyor);
  machines.surveyor = surveyor;

  // Apollo Lunar Laser Ranging Retroreflector (y = 0.875)
  const retro = await getOrCreateModel('retroreflector');
  retro.position.set(15, 0.875, 45);
  group.add(retro);
  machines.retroreflector = retro;

  // 5. Stark Lunar Sunlight (Authentic 16° low sun elevation, natural PBR exposure)
  const lunarSun = new THREE.DirectionalLight(0xfff8ee, 1.5);
  lunarSun.position.set(110, 32, 55);
  lunarSun.castShadow = true;
  lunarSun.shadow.mapSize.width = 4096;
  lunarSun.shadow.mapSize.height = 4096;
  lunarSun.shadow.camera.near = 10;
  lunarSun.shadow.camera.far = 380;
  const d = 110;
  lunarSun.shadow.camera.left = -d;
  lunarSun.shadow.camera.right = d;
  lunarSun.shadow.camera.top = d;
  lunarSun.shadow.camera.bottom = -d;
  lunarSun.shadow.bias = -0.0003;
  group.add(lunarSun);

  // Extremely faint Earthshine ambient (deep space contrast)
  const earthshine = new THREE.AmbientLight(0x0a1018, 0.06);
  group.add(earthshine);

  return {
    group,
    terrain: terrainMesh,
    machines,
    lunarSun
  };
}

/**
 * Creates high resolution (1024x1024) procedural lunar regolith diffuse and bump textures:
 * Features multi-scale micro-craters with raised ejecta rims, basalt volcanic dust specks,
 * and high-frequency tactile regolith bump relief.
 */
function createRegolithTextures() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Baseline dark mare basalt
  ctx.fillStyle = '#6b6e76';
  ctx.fillRect(0, 0, 1024, 1024);

  // Broad tonal albedo patches (highland dust vs basalt mare)
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 60 + Math.random() * 160;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const alpha = 0.08 + Math.random() * 0.12;
    const isBright = Math.random() > 0.45;
    grad.addColorStop(0, isBright ? `rgba(165, 168, 175, ${alpha})` : `rgba(45, 48, 52, ${alpha})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Multi-scale micro-crater bowls with raised rims
  for (let i = 0; i < 750; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 2.5 + Math.random() * 14;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(25, 27, 30, 0.90)');
    grad.addColorStop(0.65, 'rgba(55, 58, 64, 0.50)');
    grad.addColorStop(0.85, 'rgba(150, 155, 165, 0.45)'); // Raised ejecta rim
    grad.addColorStop(1, 'rgba(110, 114, 122, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dense fine particulate regolith dust specks (breccia & anorthosite grains)
  for (let i = 0; i < 60000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const shade = 75 + Math.random() * 85;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  const diffuse = new THREE.CanvasTexture(canvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.repeat.set(16, 16);
  diffuse.generateMipmaps = true;
  diffuse.minFilter = THREE.LinearMipmapLinearFilter;
  diffuse.anisotropy = 8;

  // High-frequency tactile regolith bump map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 1024;
  const bCtx = bumpCanvas.getContext('2d');
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 1024, 1024);

  // Micro-pits and crater depths in bump
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 3 + Math.random() * 12;
    const bGrad = bCtx.createRadialGradient(x, y, 0, x, y, r);
    bGrad.addColorStop(0, 'rgba(20, 20, 20, 0.85)');
    bGrad.addColorStop(0.7, 'rgba(100, 100, 100, 0.3)');
    bGrad.addColorStop(0.88, 'rgba(240, 240, 240, 0.7)'); // Raised crater rim
    bGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  // High-frequency grit
  for (let i = 0; i < 35000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const v = Math.random() > 0.5 ? 240 : 15;
    bCtx.fillStyle = `rgba(${v},${v},${v}, 0.30)`;
    bCtx.fillRect(x, y, 1.8, 1.8);
  }

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(16, 16);
  bump.generateMipmaps = true;
  bump.minFilter = THREE.LinearMipmapLinearFilter;
  bump.anisotropy = 8;

  return { diffuse, bump };
}
