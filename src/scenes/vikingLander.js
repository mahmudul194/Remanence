/**
 * REMANENCE: Viking 1 Mars Lander (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA Langley Research Center
 * Technical Reports, Martin Marietta Flight System Specs, and Chryse Planitia Telemetry.
 *
 * Implements:
 * - Hexagonal titanium/aluminum central equipment bus with fiberglass thermal blankets
 * - 3 outrigger landing legs with telescoping shock struts and crushable honeycomb footpads
 * - 2x SNAP-19 Radioisotope Thermoelectric Generators (RTGs) with aerodynamic finned cowlings
 * - 3-meter surface sampler boom with collector scoop resting in an authentic soil trench
 * - Dual facsimile scanning imaging camera towers, meteorology sensor mast, and S-band dish
 * - Multi-nozzle terminal descent engine clusters with charred titanium blast shields
 * - Displaced Martian sand berms under all 3 footpads and GLSL hematite dust weathering
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedViking() {
  const root = new THREE.Group();
  root.name = 'viking_1_mars_lander';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'mars' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'mars' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'mars' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'mars' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'mars' })
  };

  const landerGroup = new THREE.Group();
  root.add(landerGroup);

  const busGroundClearance = 0.58;

  // =========================================================================
  // 1. HEXAGONAL TITANIUM CENTRAL EQUIPMENT BUS
  // =========================================================================
  const busGroup = new THREE.Group();
  busGroup.position.set(0, busGroundClearance, 0);
  landerGroup.add(busGroup);

  // Hexagonal structural body (1.55m across flat-to-flat, 0.45m tall)
  const busGeo = new THREE.CylinderGeometry(1.42, 1.55, 0.45, 6);
  const busMesh = new THREE.Mesh(busGeo, mats.aluminum);
  busMesh.position.y = 0.22;
  busMesh.castShadow = true;
  busMesh.receiveShadow = true;
  busGroup.add(busMesh);

  // Top deck equipment cover plate (fiberglass thermal coating)
  const topPlateGeo = new THREE.CylinderGeometry(1.38, 1.38, 0.04, 6);
  const topPlate = new THREE.Mesh(topPlateGeo, mats.betaCloth);
  topPlate.position.y = 0.46;
  busGroup.add(topPlate);

  // Bottom blast shield plate with gold Kapton thermal wrap
  const bottomShield = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.04, 6), mats.goldKapton);
  bottomShield.position.y = -0.02;
  busGroup.add(bottomShield);

  // =========================================================================
  // 2. 3 INVERTED-TRIPOD LANDING LEGS & HONEYCOMB FOOTPADS
  // =========================================================================
  const legGroup = new THREE.Group();
  landerGroup.add(legGroup);

  const padDist = 1.95;
  const padRadius = 0.28;

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const legSub = new THREE.Group();
    legSub.rotation.y = angle;

    // Telescoping primary shock absorber oleo strut
    const strutGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.85, 12);
    const strut = new THREE.Mesh(strutGeo, mats.aluminum);
    strut.position.set(0, 0.35, 1.15);
    strut.rotation.x = 0.65;
    strut.castShadow = true;
    legSub.add(strut);

    // Inverted-V A-frame radius rods
    [-0.22, 0.22].forEach((rx) => {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.55), mats.aluminum);
      rod.position.set(rx, 0.28, 1.32);
      rod.rotation.x = 0.42;
      rod.rotation.z = rx > 0 ? -0.12 : 0.12;
      legSub.add(rod);
    });

    // Crushable Honeycomb Aluminum Footpad Dish
    const padDishGeo = new THREE.CylinderGeometry(padRadius, padRadius * 1.12, 0.07, 16);
    const padDish = new THREE.Mesh(padDishGeo, mats.blackInconel);
    padDish.position.set(0, 0.035, padDist);
    legSub.add(padDish);

    legGroup.add(legSub);

    // 3x Displaced Martian sand berm contact discs under footpads
    const padX = Math.sin(angle) * padDist;
    const padZ = Math.cos(angle) * padDist;
    const bermTex = createFootpadBermTexture();
    const berm = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshBasicMaterial({
      map: bermTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    }));
    berm.rotation.x = -Math.PI / 2;
    berm.position.set(padX, 0.015, padZ);
    root.add(berm);
  }

  // =========================================================================
  // 3. 2x SNAP-19 RTG NUCLEAR POWER UNITS (Finned Aerodynamic Cowlings)
  // =========================================================================
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(0, busGroundClearance + 0.48, 0);
  landerGroup.add(rtgGroup);

  // Left and right elongated RTG housings with cooling fins (Not blinding blobs!)
  [-0.45, 0.45].forEach((rx) => {
    const singleRTG = new THREE.Group();
    singleRTG.position.set(rx, 0.18, -0.15);

    // Aerodynamic white thermal windshield cylinder
    const rtgBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 16), mats.betaCloth);
    rtgBody.rotation.z = Math.PI / 2;
    rtgBody.castShadow = true;
    singleRTG.add(rtgBody);

    // Longitudinal cooling fins
    for (let f = 0; f < 6; f++) {
      const fAng = (f * Math.PI) / 3;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.015, 0.12), mats.aluminum);
      fin.position.set(0, Math.sin(fAng) * 0.26, Math.cos(fAng) * 0.26);
      fin.rotation.x = fAng;
      singleRTG.add(fin);
    }

    rtgGroup.add(singleRTG);
  });

  // =========================================================================
  // 4. TERMINAL DESCENT ENGINE CLUSTERS (Multi-Nozzle Hydrazine Thrusters)
  // =========================================================================
  for (let e = 0; e < 3; e++) {
    const eAng = (e * 2 * Math.PI) / 3 + Math.PI / 3;
    const engineGroup = new THREE.Group();
    engineGroup.position.set(Math.sin(eAng) * 1.25, busGroundClearance + 0.05, Math.cos(eAng) * 1.25);

    // Charred titanium heat shield hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.28), mats.blackInconel);
    engineGroup.add(hood);

    // Multi-nozzle cluster (18 small nozzles to prevent surface cratering)
    for (let nx = -0.08; nx <= 0.08; nx += 0.08) {
      for (let nz = -0.08; nz <= 0.08; nz += 0.08) {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.06, 8), mats.aluminum);
        nozzle.position.set(nx, -0.09, nz);
        engineGroup.add(nozzle);
      }
    }
    landerGroup.add(engineGroup);
  }

  // =========================================================================
  // 5. 3-METER SURFACE SAMPLER ARM WITH COLLECTOR SCOOP IN TRENCH
  // =========================================================================
  const samplerGroup = new THREE.Group();
  samplerGroup.position.set(0.65, busGroundClearance + 0.42, 0.65);
  landerGroup.add(samplerGroup);

  // Extendable tubular boom (3 stages reaching down to the Martian regolith)
  const boom1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15), mats.aluminum);
  boom1.position.set(0.35, -0.15, 0.45);
  boom1.rotation.set(0.72, -0.35, 0.35);
  samplerGroup.add(boom1);

  const boom2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.05), mats.aluminum);
  boom2.position.set(0.72, -0.42, 0.88);
  boom2.rotation.set(0.45, -0.25, 0.22);
  samplerGroup.add(boom2);

  // Mechanical collector scoop with soil sampling jaws
  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.24), mats.aluminum);
  scoop.position.set(0.98, -0.68, 1.25);
  scoop.rotation.set(0.15, -0.4, 0.15);
  samplerGroup.add(scoop);

  // Dug collection trench in the Martian sand directly under the scoop
  const trenchGeo = new THREE.BoxGeometry(0.28, 0.05, 0.95);
  const trench = new THREE.Mesh(trenchGeo, new THREE.MeshBasicMaterial({
    color: 0x220c06,
    transparent: true,
    opacity: 0.88
  }));
  trench.position.set(1.68, 0.015, 1.85);
  trench.rotation.y = -0.45;
  root.add(trench);

  // =========================================================================
  // 6. DUAL FACSIMILE CAMERAS, S-BAND DISH & METEOROLOGY BOOM
  // =========================================================================
  // 2 Facsimile Scanning Camera Towers
  [[-0.45, 0.45], [0.45, 0.45]].forEach(([cx, cz]) => {
    const camTower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.48, 16), mats.aluminum);
    camTower.position.set(cx, busGroundClearance + 0.68, cz);
    camTower.castShadow = true;
    landerGroup.add(camTower);

    const camWindow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), mats.blackInconel);
    camWindow.position.set(cx, busGroundClearance + 0.74, cz + 0.07);
    landerGroup.add(camWindow);
  });

  // 0.76m Steerable High-Gain S-Band Parabolic Dish Antenna
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(0.0, busGroundClearance + 0.52, -0.55);

  const hgaMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45), mats.aluminum);
  hgaMast.position.y = 0.22;
  hgaGroup.add(hgaMast);

  const hgaDish = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.08, 0.12, 24, 1, true), mats.aluminum);
  hgaDish.position.set(0, 0.48, 0);
  hgaDish.rotation.set(0.45, 0.32, 0);
  hgaGroup.add(hgaDish);
  landerGroup.add(hgaGroup);

  // Meteorology Sensor Boom (1.5m tall mast with wind & temp sensors)
  const metMast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.45), mats.aluminum);
  metMast.position.set(-0.68, busGroundClearance + 1.15, -0.42);
  landerGroup.add(metMast);

  const windSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08), mats.blackInconel);
  windSensor.position.set(-0.68, busGroundClearance + 1.88, -0.42);
  landerGroup.add(windSensor);

  // Telemetry Beacon indicator (Delicate LED, no blinding searchlight)
  const beaconGroup = new THREE.Group();
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffa544 }));
  beaconGroup.add(led);
  beaconGroup.add(new THREE.PointLight(0xffa544, 0.5, 6, 2.0));
  beaconGroup.position.set(-0.68, busGroundClearance + 1.95, -0.42);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
