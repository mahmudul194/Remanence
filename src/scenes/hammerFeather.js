/**
 * REMANENCE: Apollo 15 Galileo Experiment Site (Hammer & Feather)
 * Museum-grade, physically authentic reconstruction based on NASA Apollo 15
 * Lunar Surface Journal, Commander David Scott EVA-3 transcripts, and
 * Smithsonian National Air and Space Museum Apollo Tool Catalog.
 *
 * Implements:
 * - Apollo Lunar Geologic Hammer:
 *   - Knurled 2024-T4 aluminum alloy handle with tactile depth and centimeter scales
 *   - Stainless steel pick/chisel head with bevel, flat striking face, and mounting pin
 *   - Astronaut lanyard attachment loop at butt of handle
 *   - Resting semi-embedded in lunar regolith with impact indentation and rim berm
 * - White Female Gyrfalcon Feather (USAF Academy mascot):
 *   - Tapered central shaft (rachis) with hollow translucent calamus
 *   - Asymmetric aerodynamic vane with micro-barb texture and realistic alpha cutout
 *   - Resting gently on the lunar surface beside the hammer
 * - David Scott EVA-3 Apollo Spacesuit Bootprints in the regolith
 * - Soil disturbance crater and soft telemetry indicator
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootprintTexture, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedHammerFeather() {
  const root = new THREE.Group();
  root.name = 'apollo_15_hammer_feather_memorial';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    darkSteel: applyWeathering(rawMats.blackInconel, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' })
  };

  const memorialGroup = new THREE.Group();
  root.add(memorialGroup);

  // =========================================================================
  // 1. APOLLO LUNAR GEOLOGIC HAMMER (Mass: 1.3 kg, Length: 0.39 m)
  // =========================================================================
  const hammerGroup = new THREE.Group();
  // Rests tilted into the regolith as dropped by Scott from waist height (~1.1m)
  hammerGroup.position.set(0.18, 0.045, -0.05);
  hammerGroup.rotation.set(0.12, 0.58, -0.08);
  memorialGroup.add(hammerGroup);

  // Knurled Aluminum Handle
  const handleCanvas = document.createElement('canvas');
  handleCanvas.width = 128;
  handleCanvas.height = 128;
  const hCtx = handleCanvas.getContext('2d');
  hCtx.fillStyle = '#b0b8c4';
  hCtx.fillRect(0, 0, 128, 128);
  // Diamond knurling grip pattern
  hCtx.strokeStyle = '#5a6270';
  hCtx.lineWidth = 1.0;
  for (let i = -128; i <= 256; i += 8) {
    hCtx.beginPath(); hCtx.moveTo(i, 0); hCtx.lineTo(i + 128, 128); hCtx.stroke();
    hCtx.beginPath(); hCtx.moveTo(i, 128); hCtx.lineTo(i + 128, 0); hCtx.stroke();
  }
  const handleTex = new THREE.CanvasTexture(handleCanvas);
  handleTex.wrapS = THREE.RepeatWrapping;
  handleTex.wrapT = THREE.RepeatWrapping;
  handleTex.repeat.set(2, 6);

  const knurledHandleMat = applyWeathering(new THREE.MeshPhysicalMaterial({
    map: handleTex,
    color: 0xc8d0dc,
    metalness: 0.92,
    roughness: 0.28,
    clearcoat: 0.5
  }), { planet: 'moon' });

  // Handle shaft (0.34m length)
  const shaftGeo = new THREE.CylinderGeometry(0.014, 0.015, 0.34, 16);
  shaftGeo.rotateZ(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, knurledHandleMat);
  shaft.castShadow = true;
  hammerGroup.add(shaft);

  // Handle butt cap & lanyard loop
  const buttGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 16);
  buttGeo.rotateZ(Math.PI / 2);
  const butt = new THREE.Mesh(buttGeo, mats.aluminum);
  butt.position.x = -0.175;
  hammerGroup.add(butt);

  const loopGeo = new THREE.TorusGeometry(0.012, 0.003, 8, 16);
  const loop = new THREE.Mesh(loopGeo, mats.springSteel);
  loop.position.x = -0.19;
  loop.rotation.y = Math.PI / 2;
  hammerGroup.add(loop);

  // Hammer Head (0.16m length, solid forged steel)
  const headGroup = new THREE.Group();
  headGroup.position.set(0.17, 0, 0);
  hammerGroup.add(headGroup);

  // Central head sleeve
  const sleeveGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12);
  const sleeve = new THREE.Mesh(sleeveGeo, mats.darkSteel);
  headGroup.add(sleeve);

  // Flat square striking face
  const strikeGeo = new THREE.BoxGeometry(0.045, 0.04, 0.04);
  const strike = new THREE.Mesh(strikeGeo, mats.darkSteel);
  strike.position.y = 0.055;
  strike.castShadow = true;
  headGroup.add(strike);

  // Tapered chisel pick opposite the striking face
  const chiselGeo = new THREE.ConeGeometry(0.024, 0.09, 4);
  chiselGeo.rotateX(Math.PI);
  const chisel = new THREE.Mesh(chiselGeo, mats.darkSteel);
  chisel.position.y = -0.07;
  chisel.castShadow = true;
  headGroup.add(chisel);

  // Impact crater indentation where hammer struck lunar dust
  const hammerBermTex = createFootpadBermTexture();
  const hammerBermGeo = new THREE.PlaneGeometry(0.48, 0.35);
  hammerBermGeo.rotateX(-Math.PI / 2);
  const hammerBerm = new THREE.Mesh(hammerBermGeo, new THREE.MeshBasicMaterial({
    map: hammerBermTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  hammerBerm.position.set(0.28, 0.013, -0.05);
  root.add(hammerBerm);

  // =========================================================================
  // 2. THE FALCON FEATHER (Female White Gyrfalcon, Length: 0.30 m)
  // =========================================================================
  const featherGroup = new THREE.Group();
  featherGroup.position.set(-0.24, 0.016, 0.12);
  featherGroup.rotation.set(-0.02, -0.45, 0.04);
  memorialGroup.add(featherGroup);

  // Procedural feather barb texture with translucent alpha vane
  const featherCanvas = document.createElement('canvas');
  featherCanvas.width = 256;
  featherCanvas.height = 512;
  const fCtx = featherCanvas.getContext('2d');
  fCtx.clearRect(0, 0, 256, 512);

  // Draw feather vane shape
  fCtx.beginPath();
  fCtx.moveTo(128, 480); // Base calamus
  fCtx.bezierCurveTo(40, 360, 20, 160, 128, 30); // Left vane
  fCtx.bezierCurveTo(236, 160, 216, 360, 128, 480); // Right vane
  fCtx.closePath();

  // Pure white/ivory feather tone with subtle barb variations
  const featherGrad = fCtx.createLinearGradient(0, 0, 0, 512);
  featherGrad.addColorStop(0, 'rgba(248, 250, 252, 0.98)');
  featherGrad.addColorStop(0.5, 'rgba(235, 238, 244, 0.94)');
  featherGrad.addColorStop(1, 'rgba(215, 220, 228, 0.88)');
  fCtx.fillStyle = featherGrad;
  fCtx.fill();

  // Individual barb lines (micro texture)
  fCtx.strokeStyle = 'rgba(180, 190, 205, 0.35)';
  fCtx.lineWidth = 1.0;
  for (let y = 60; y < 460; y += 6) {
    // Left barbs
    fCtx.beginPath();
    fCtx.moveTo(128, y);
    fCtx.lineTo(60 + (y > 256 ? (y - 256) * 0.3 : (256 - y) * 0.2), y - 24);
    fCtx.stroke();
    // Right barbs
    fCtx.beginPath();
    fCtx.moveTo(128, y);
    fCtx.lineTo(196 - (y > 256 ? (y - 256) * 0.3 : (256 - y) * 0.2), y - 24);
    fCtx.stroke();
  }

  // Central translucent quill shaft (rachis)
  fCtx.strokeStyle = '#f8fafc';
  fCtx.lineWidth = 4.0;
  fCtx.beginPath();
  fCtx.moveTo(128, 495);
  fCtx.lineTo(128, 35);
  fCtx.stroke();

  const featherTex = new THREE.CanvasTexture(featherCanvas);

  const featherMat = applyWeathering(new THREE.MeshStandardMaterial({
    map: featherTex,
    transparent: true,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide,
    depthWrite: false
  }), { planet: 'moon' });

  // Feather geometry curved gently across the regolith
  const featherGeo = new THREE.PlaneGeometry(0.12, 0.32, 8, 8);
  featherGeo.rotateX(-Math.PI / 2);
  const fPos = featherGeo.attributes.position;
  for (let i = 0; i < fPos.count; i++) {
    const pz = fPos.getZ(i);
    // Subtle natural curvature of avian flight feather
    const curve = Math.sin((pz + 0.16) * Math.PI / 0.32) * 0.008;
    fPos.setY(i, curve);
  }
  featherGeo.computeVertexNormals();

  const featherMesh = new THREE.Mesh(featherGeo, featherMat);
  featherMesh.castShadow = true;
  featherGroup.add(featherMesh);

  // 3D Quill shaft spine
  const rachisGeo = new THREE.CylinderGeometry(0.0025, 0.001, 0.33, 8);
  rachisGeo.rotateX(Math.PI / 2);
  const rachisMat = applyWeathering(new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.45,
    metalness: 0.05
  }), { planet: 'moon' });
  const rachis = new THREE.Mesh(rachisGeo, rachisMat);
  rachis.position.y = 0.004;
  featherGroup.add(rachis);

  // =========================================================================
  // 3. ASTRONAUT DAVID SCOTT EVA BOOTPRINTS IN REGOLITH
  // =========================================================================
  const fpTex = createFootprintTexture();
  const fpGeo = new THREE.PlaneGeometry(0.28, 0.55);
  fpGeo.rotateX(-Math.PI / 2);
  const fpMat = new THREE.MeshBasicMaterial({
    map: fpTex,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  // Where Commander Scott stood during the Galileo demonstration
  const footprints = [
    { x: -0.42, z: -0.25, rot: 0.35 },
    { x: -0.15, z: -0.32, rot: 0.40 },
    { x: 0.52, z: 0.38, rot: -0.65 },
    { x: 0.32, z: 0.50, rot: -0.72 }
  ];

  footprints.forEach((fp) => {
    const fMesh = new THREE.Mesh(fpGeo, fpMat);
    fMesh.position.set(fp.x, 0.012, fp.z);
    fMesh.rotation.y = fp.rot;
    root.add(fMesh);
  });

  // Subtle telemetry memorial beacon (delicate LED)
  const beaconGroup = new THREE.Group();
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
  beaconGroup.add(led);
  beaconGroup.add(new THREE.PointLight(0xffb84d, 0.45, 5, 2.0));
  beaconGroup.position.set(0, 0.42, 0);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
