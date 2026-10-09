/**
 * Martian Desert Scene Component
 * Simulates Chryse Planitia, Ares Vallis, Gusev Crater, and Endeavour Crater.
 * Features realistic red iron-oxide dune terrain, basalt rocks, and atmospheric lighting
 * with day-to-night dust storm darkening for the Opportunity scene.
 */

import * as THREE from 'three';
import { getOrCreateModel } from './models.js';

// 1. Martian Dune Landscape Mesh & Elevation Calculator
export function getMarsTerrainElevation(x, z) {
  // Multi-frequency sand dune ripples and hills
  const dunes = Math.sin(x * 0.025 + z * 0.035) * 3.2 +
                Math.sin(x * 0.07 - z * 0.05) * 1.2 +
                Math.cos(x * 0.15) * 0.45;

  // Small crater depressions (Endeavour Crater depression for Opportunity)
  const dist = Math.hypot(x - 10, z - 190);
  let craterMod = 0;
  if (dist < 45) {
    const u = dist / 45;
    craterMod = -4.2 * 0.5 * (1 + Math.cos(u * Math.PI));
  }

  // Planetary curvature skirt ONLY at distant outer boundaries of the terrain tile
  const latDist = Math.abs(x);
  const longDist = Math.max(0, -60 - z, z - 280);
  const boundaryDist = Math.hypot(Math.max(0, latDist - 120), longDist);
  let dropMod = 0;
  if (boundaryDist > 0) {
    const drop = Math.min(2.5, boundaryDist / 60);
    dropMod = drop * drop * 18.0;
  }

  return dunes + craterMod - dropMod;
}

export async function createMarsScene() {
  const group = new THREE.Group();
  group.name = 'mars_scene';
  group.position.set(0, -10, 650);

  // 1. Martian Dune Landscape Mesh (Spanning entire corridor from z = -140 to +380)
  const terrainGeo = new THREE.PlaneGeometry(380, 520, 140, 160);
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(0, 0, 120);

  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    posAttr.setY(i, getMarsTerrainElevation(x, z));
  }
  terrainGeo.computeVertexNormals();

  // Procedural Martian Iron Oxide Texture & Bump Map
  const { diffuse, bump } = createMarsTextures();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: diffuse,
    bumpMap: bump,
    bumpScale: 0.35,
    color: 0xb54d24,
    roughness: 0.94,
    metalness: 0.04
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Martian Basalt Boulders
  const rockGeo = new THREE.DodecahedronGeometry(0.7, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x482417,
    roughness: 0.88,
    metalness: 0.1
  });
  const rockCount = 90;
  const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < rockCount; i++) {
    const rx = (Math.random() - 0.5) * 300;
    const rz = -60 + Math.random() * 360;
    const scale = 0.5 + Math.random() * 2.2;
    const rY = getMarsTerrainElevation(rx, rz);
    dummy.position.set(rx, rY + scale * 0.35, rz);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    dummy.scale.set(scale, scale * 0.8, scale);
    dummy.updateMatrix();
    rockInstanced.setMatrixAt(i, dummy.matrix);
  }
  rockInstanced.receiveShadow = true;
  rockInstanced.castShadow = true;
  group.add(rockInstanced);

  // 3. Machines on Mars (firmly anchored at calculated terrain elevations)
  const machines = {};

  // EDL Descent Debris in crater furrow
  const descentDebris = await getOrCreateModel('descent_debris');
  descentDebris.position.set(-20, getMarsTerrainElevation(-20, -35), -35);
  group.add(descentDebris);
  machines.descent_debris = descentDebris;

  // Viking 1 Lander on Chryse Planitia ridge
  const viking = await getOrCreateModel('viking_lander');
  viking.position.set(0, getMarsTerrainElevation(0, 0), 0);
  group.add(viking);
  machines.viking1 = viking;

  // Mars Pathfinder & Sojourner at Ares Vallis
  const pathfinder = await getOrCreateModel('pathfinder_sojourner');
  pathfinder.position.set(38, getMarsTerrainElevation(38, 60), 60);
  group.add(pathfinder);
  machines.pathfinder = pathfinder;

  // Spirit Rover in Troy sand deposit
  const spirit = await getOrCreateModel('mer_rover');
  spirit.position.set(-36, getMarsTerrainElevation(-36, 125), 125);
  group.add(spirit);
  machines.spirit = spirit;

  // Opportunity Rover in Endeavour Crater depression
  const opportunity = await getOrCreateModel('mer_rover_oppy');
  opportunity.position.set(12, getMarsTerrainElevation(12, 195), 195);
  group.add(opportunity);
  machines.opportunity = opportunity;

  // Ingenuity Mars Helicopter at Valinor Hills crest
  const ingenuity = await getOrCreateModel('ingenuity');
  ingenuity.position.set(-28, getMarsTerrainElevation(-28, 260), 260);
  group.add(ingenuity);
  machines.ingenuity = ingenuity;

  // 4. Martian Atmospheric Lighting (Deep contrast sunlight)
  const marsSun = new THREE.DirectionalLight(0xffecd4, 1.45);
  marsSun.position.set(-80, 85, -60);
  marsSun.castShadow = true;
  marsSun.shadow.mapSize.width = 2048;
  marsSun.shadow.mapSize.height = 2048;
  const d = 150;
  marsSun.shadow.camera.left = -d;
  marsSun.shadow.camera.right = d;
  marsSun.shadow.camera.top = d;
  marsSun.shadow.camera.bottom = -d;
  marsSun.shadow.bias = -0.0004;
  group.add(marsSun);

  const marsAmbient = new THREE.AmbientLight(0x401f12, 0.22);
  group.add(marsAmbient);

  function setStormDarkness(factor) {
    marsSun.intensity = THREE.MathUtils.lerp(1.45, 0.45, factor);
    marsAmbient.intensity = THREE.MathUtils.lerp(0.22, 0.14, factor);
    marsSun.color.setHex(factor > 0.4 ? 0x9e4324 : 0xffecd4);
    marsAmbient.color.setHex(factor > 0.4 ? 0x241220 : 0x401f12);
  }

  return {
    group,
    terrain: terrainMesh,
    machines,
    marsSun,
    marsAmbient,
    setStormDarkness
  };
}

/**
 * Creates procedural red Martian sand diffuse and ripple bump textures
 */
function createMarsTextures() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#be4b22');
  grad.addColorStop(0.5, '#a13c17');
  grad.addColorStop(1, '#862e0f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Sand ripples
  ctx.fillStyle = 'rgba(60, 16, 7, 0.22)';
  for (let y = 0; y < 512; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 16) {
      const wave = Math.sin(x * 0.04) * 3;
      ctx.lineTo(x, y + wave);
    }
    ctx.lineTo(512, y + 4);
    ctx.lineTo(0, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Micro-specks
  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const dark = Math.random() > 0.5;
    ctx.fillStyle = dark ? 'rgba(40, 10, 5, 0.35)' : 'rgba(235, 115, 55, 0.25)';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const diffuse = new THREE.CanvasTexture(canvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.repeat.set(16, 16);

  // Bump map for wind ripples
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d');
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let y = 0; y < 512; y += 8) {
    bCtx.fillRect(0, y, 512, 3);
  }
  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(16, 16);

  return { diffuse, bump };
}
