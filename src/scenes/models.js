/**
 * 3D Models for REMANENCE
 * Supports loading external NASA .glb models with DRACO compression,
 * and contains realistic procedural compound 3D models for all 8 machines.
 * Features realistic PBR materials (gold Kapton foil, solar cells, anodized alloy),
 * accurate proportions, and emissive telemetry beacons.
 */

import * as THREE from 'three';
import { modelLoader } from '../utils/loader.js';
import { createDetailedApolloLM } from './lunarModule.js';
import { createDetailedLRV } from './lunarRover.js';

// Realistic Aerospace Materials Pool (Tuned for HDR Image-Based Lighting)
const materials = {
  goldKapton: new THREE.MeshPhysicalMaterial({
    color: 0xdfb43a,
    metalness: 1.0,
    roughness: 0.12,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    reflectivity: 0.98
  }),
  aluminum: new THREE.MeshPhysicalMaterial({
    color: 0xdfe3eb,
    metalness: 0.98,
    roughness: 0.15,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12
  }),
  darkMetal: new THREE.MeshStandardMaterial({
    color: 0x181a20,
    metalness: 0.92,
    roughness: 0.3
  }),
  whitePaint: new THREE.MeshStandardMaterial({
    color: 0xf0f3f8,
    metalness: 0.05,
    roughness: 0.32
  }),
  solarCell: new THREE.MeshPhysicalMaterial({
    color: 0x060f22,
    metalness: 0.92,
    roughness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    reflectivity: 1.0
  }),
  wheelMesh: new THREE.MeshStandardMaterial({
    color: 0x8c95a6,
    metalness: 0.92,
    roughness: 0.22,
    wireframe: true
  }),
  carbonFiber: new THREE.MeshStandardMaterial({
    color: 0x121316,
    metalness: 0.45,
    roughness: 0.48
  }),
  retroQuartz: new THREE.MeshPhysicalMaterial({
    color: 0xebffff,
    metalness: 0.08,
    roughness: 0.01,
    transmission: 0.94,
    ior: 1.54,
    reflectivity: 0.98,
    emissive: 0x004422,
    emissiveIntensity: 0.4
  })
};

/**
 * 1. Apollo 11 Lunar Module Descent Stage (Hero Asset)
 */
export function createApolloLM() {
  const group = createDetailedApolloLM();

  // Subtle telemetry beacon LED indicator on top deck
  const beacon = createBeacon(0xffbf66, 1.4);
  beacon.position.set(0, 2.18, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 2. Apollo Lunar Roving Vehicle (LRV) (Hero Asset)
 */
export function createLRV() {
  return createDetailedLRV();
}

/**
 * 3. Surveyor 3 Lander
 */
export function createSurveyor() {
  const group = new THREE.Group();
  group.name = 'surveyor';

  // Triangular Tubular Aluminum Frame
  const frameGeo = new THREE.CylinderGeometry(0.8, 1.2, 1.0, 3);
  const frameMesh = new THREE.Mesh(frameGeo, materials.aluminum);
  frameMesh.position.y = 1.0;
  group.add(frameMesh);

  // 3 Outrigger Landing Legs with Round Footpads
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const legGroup = new THREE.Group();

    const legBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2), materials.aluminum);
    legBar.position.set(0, 0.6, 1.1);
    legBar.rotation.x = 0.8;
    legGroup.add(legBar);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.08, 12), materials.aluminum);
    pad.position.set(0, 0.04, 1.8);
    legGroup.add(pad);

    legGroup.rotation.y = angle;
    group.add(legGroup);
  }

  // Center Mast with Solar Array & High Gain Planar Antenna
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), materials.aluminum);
  mast.position.y = 2.0;
  group.add(mast);

  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.04), materials.solarCell);
  solarPanel.position.set(0, 2.6, 0.2);
  solarPanel.rotation.x = -0.3;
  group.add(solarPanel);

  // TV Camera
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12), materials.whitePaint);
  cam.position.set(0.4, 1.5, 0.3);
  cam.rotation.z = 0.2;
  group.add(cam);

  // Surface Sampler Scoop Arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), materials.aluminum);
  arm.position.set(-0.5, 0.6, 0.7);
  arm.rotation.set(0.6, 0.3, -0.4);
  group.add(arm);

  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.2), materials.aluminum);
  scoop.position.set(-0.8, 0.1, 1.2);
  group.add(scoop);

  // Telemetry Beacon
  const beacon = createBeacon(0xfff4b8, 1.5);
  beacon.position.set(0, 2.9, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 4. Viking 1 Lander
 */
export function createViking() {
  const group = new THREE.Group();
  group.name = 'viking_lander';

  // Hexagonal Body Base
  const bodyGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.7, 6);
  const body = new THREE.Mesh(bodyGeo, materials.aluminum);
  body.position.y = 0.8;
  group.add(body);

  // 3 Landing Legs with shock struts & footpads
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const legGroup = new THREE.Group();

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5), materials.aluminum);
    strut.position.set(0, 0.5, 1.3);
    strut.rotation.x = 0.7;
    legGroup.add(strut);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.08, 12), materials.darkMetal);
    pad.position.set(0, 0.04, 1.8);
    legGroup.add(pad);

    legGroup.rotation.y = angle;
    group.add(legGroup);
  }

  // 2 RTG Power Covers
  [-0.6, 0.6].forEach((x) => {
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), materials.whitePaint);
    rtg.position.set(x, 1.3, -0.2);
    rtg.rotation.z = Math.PI / 2;
    group.add(rtg);
  });

  // High-Gain Dish Antenna
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.15, 0.15, 16, 1, true), materials.aluminum);
  dish.position.set(0.0, 1.5, 0.5);
  dish.rotation.x = 0.4;
  group.add(dish);

  // Meteorology Boom Mast
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), materials.aluminum);
  boom.position.set(-0.8, 1.8, -0.4);
  group.add(boom);

  // Surface Sampler Arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), materials.aluminum);
  arm.position.set(0.7, 0.6, 1.1);
  arm.rotation.set(0.8, -0.4, 0.2);
  group.add(arm);

  // Telemetry Beacon
  const beacon = createBeacon(0xffaa44, 1.8);
  beacon.position.set(-0.8, 2.7, -0.4);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 5. Mars Pathfinder & Sojourner
 */
export function createPathfinder() {
  const group = new THREE.Group();
  group.name = 'pathfinder_sojourner';

  const centerPetal = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 3), materials.goldKapton);
  centerPetal.position.y = 0.2;
  group.add(centerPetal);

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    const petal = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 1.0), materials.solarCell);
    petal.position.set(Math.sin(angle) * 1.1, 0.12, Math.cos(angle) * 1.1);
    petal.rotation.y = angle;
    group.add(petal);
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), materials.aluminum);
  mast.position.set(0, 0.9, 0);
  group.add(mast);

  const impHead = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.12), materials.darkMetal);
  impHead.position.set(0, 1.6, 0);
  group.add(impHead);

  // Miniature Sojourner Rover
  const sojourner = new THREE.Group();
  sojourner.position.set(1.6, 0.18, 1.0);
  sojourner.rotation.y = 0.8;

  const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.65), materials.solarCell);
  sojourner.add(sBody);

  for (let wx = -0.3; wx <= 0.3; wx += 0.6) {
    for (let wz = -0.22; wz <= 0.22; wz += 0.22) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10), materials.darkMetal);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, -0.08, wz);
      sojourner.add(wheel);
    }
  }

  group.add(sojourner);

  const beacon = createBeacon(0x4df0ff, 1.6);
  beacon.position.set(0, 1.7, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 6. Mars Exploration Rover (Spirit & Opportunity)
 */
export function createMERRover(isOpportunity = false) {
  const group = new THREE.Group();
  group.name = isOpportunity ? 'mer_rover_oppy' : 'mer_rover_spirit';

  const deckShape = new THREE.Shape();
  deckShape.moveTo(0, 1.4);
  deckShape.lineTo(1.2, -0.9);
  deckShape.lineTo(0.6, -1.3);
  deckShape.lineTo(-0.6, -1.3);
  deckShape.lineTo(-1.2, -0.9);
  deckShape.closePath();

  const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 };
  const deckGeo = new THREE.ExtrudeGeometry(deckShape, extrudeSettings);

  const panelMat = isOpportunity
    ? new THREE.MeshStandardMaterial({
        color: 0x543622,
        metalness: 0.4,
        roughness: 0.8
      })
    : materials.solarCell;

  const deckMesh = new THREE.Mesh(deckGeo, panelMat);
  deckMesh.rotation.x = Math.PI / 2;
  deckMesh.position.y = 0.95;
  group.add(deckMesh);

  const webGeo = new THREE.BoxGeometry(0.8, 0.45, 1.1);
  const webMesh = new THREE.Mesh(webGeo, materials.goldKapton);
  webMesh.position.set(0, 0.65, -0.1);
  group.add(webMesh);

  const wheelPositions = [
    [-0.9, 0.25, 0.9],
    [0.9, 0.25, 0.9],
    [-1.0, 0.25, 0.0],
    [1.0, 0.25, 0.0],
    [-0.9, 0.25, -0.9],
    [0.9, 0.25, -0.9]
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);
    if (!isOpportunity && x > 0 && z > 0.5) {
      wheelGroup.position.y -= 0.12;
    }
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14);
    const wheelMesh = new THREE.Mesh(wheelGeo, materials.aluminum);
    wheelMesh.rotation.z = Math.PI / 2;
    wheelGroup.add(wheelMesh);
    group.add(wheelGroup);
  });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), materials.aluminum);
  mast.position.set(0.3, 1.5, 0.5);
  group.add(mast);

  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.14), materials.darkMetal);
  camHead.position.set(0.3, 2.05, 0.5);
  if (isOpportunity) {
    camHead.rotation.x = 0.45;
  }
  group.add(camHead);

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.08, 0.08, 16, 1, true), materials.aluminum);
  dish.position.set(-0.4, 1.15, -0.6);
  dish.rotation.x = 0.6;
  group.add(dish);

  if (!isOpportunity) {
    group.rotation.x = 0.1;
    group.rotation.z = -0.15;
  }

  const beaconColor = isOpportunity ? 0xff4422 : 0xff8833;
  const beacon = createBeacon(beaconColor, isOpportunity ? 1.4 : 1.7);
  beacon.position.set(0.3, 2.15, 0.5);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 7. Ingenuity Mars Helicopter ("Ginny")
 */
export function createIngenuity() {
  const group = new THREE.Group();
  group.name = 'ingenuity';

  const fuselageGeo = new THREE.BoxGeometry(0.4, 0.42, 0.4);
  const fuselage = new THREE.Mesh(fuselageGeo, materials.darkMetal);
  fuselage.position.y = 0.65;
  group.add(fuselage);

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9), materials.carbonFiber);
    leg.position.set(Math.sin(angle) * 0.35, 0.32, Math.cos(angle) * 0.35);
    leg.rotation.x = 0.65;
    leg.rotation.y = angle;
    group.add(leg);

    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), materials.darkMetal);
    foot.position.set(Math.sin(angle) * 0.62, 0.02, Math.cos(angle) * 0.62);
    group.add(foot);
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9), materials.aluminum);
  mast.position.y = 1.15;
  group.add(mast);

  const bladeGeo = new THREE.BoxGeometry(2.3, 0.02, 0.14);
  const lowerRotor = new THREE.Mesh(bladeGeo, materials.carbonFiber);
  lowerRotor.position.y = 1.1;
  lowerRotor.rotation.y = 0.3;
  group.add(lowerRotor);

  const upperRotor = new THREE.Mesh(bladeGeo, materials.carbonFiber);
  upperRotor.position.y = 1.35;
  upperRotor.rotation.y = -0.7;
  group.add(upperRotor);

  // Flight 72 Damaged Blade Tip
  const damagedTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.03, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
  );
  damagedTip.position.set(1.05, 1.35, -0.7);
  group.add(damagedTip);

  const solarTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), materials.solarCell);
  solarTop.position.y = 1.55;
  group.add(solarTop);

  const beacon = createBeacon(0x66ffaa, 1.9);
  beacon.position.set(0.18, 2.05, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 8. Apollo Lunar Laser Ranging Retroreflector (LRRR)
 */
export function createRetroreflector() {
  const group = new THREE.Group();
  group.name = 'retroreflector';

  // Tilted Palette Base
  const baseGeo = new THREE.BoxGeometry(1.4, 0.15, 1.4);
  const base = new THREE.Mesh(baseGeo, materials.whitePaint);
  base.position.y = 0.5;
  base.rotation.x = -0.3;
  group.add(base);

  // Array of 100 Quartz Corner-Cube Prisms
  const prismGroup = new THREE.Group();
  prismGroup.position.set(0, 0.55, 0);
  prismGroup.rotation.x = -0.3;

  for (let r = -4; r <= 4; r++) {
    for (let c = -4; c <= 4; c++) {
      const prismGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 6);
      const prism = new THREE.Mesh(prismGeo, materials.retroQuartz);
      prism.position.set(r * 0.12, 0.06, c * 0.12);
      prismGroup.add(prism);
    }
  }
  group.add(prismGroup);

  // Active Green Laser Beam firing up toward Earth
  const laserCoreGeo = new THREE.CylinderGeometry(0.02, 0.02, 50, 16);
  const laserCoreMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.9
  });
  const laserCore = new THREE.Mesh(laserCoreGeo, laserCoreMat);
  laserCore.position.set(0, 25, 0);
  laserCore.rotation.x = -0.25;
  group.add(laserCore);

  const laserHaloGeo = new THREE.CylinderGeometry(0.06, 0.06, 50, 16);
  const laserHaloMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending
  });
  const laserHalo = new THREE.Mesh(laserHaloGeo, laserHaloMat);
  laserHalo.position.set(0, 25, 0);
  laserHalo.rotation.x = -0.25;
  group.add(laserHalo);

  // Telemetry Beacon
  const beacon = createBeacon(0x00ff88, 2.0);
  beacon.position.set(0, 0.9, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 9. Apollo Lunar Surface Experiments Package (ALSEP) Central Station
 */
export function createALSEP() {
  const group = new THREE.Group();
  group.name = 'alsep_station';

  // Central Station Electronics Box
  const boxGeo = new THREE.BoxGeometry(0.85, 0.55, 0.7);
  const box = new THREE.Mesh(boxGeo, materials.goldKapton);
  box.position.y = 0.35;
  group.add(box);

  // White Specular Thermal Radiator Top
  const radiatorGeo = new THREE.BoxGeometry(0.82, 0.04, 0.68);
  const radiator = new THREE.Mesh(radiatorGeo, materials.whitePaint);
  radiator.position.y = 0.64;
  group.add(radiator);

  // Helical S-band Telemetry Antenna Mast
  const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9);
  const mast = new THREE.Mesh(mastGeo, materials.aluminum);
  mast.position.set(0.25, 1.05, 0);
  group.add(mast);

  const helixGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12, 1, true);
  const helix = new THREE.Mesh(helixGeo, materials.aluminum);
  helix.position.set(0.25, 1.45, 0);
  group.add(helix);

  // SNAP-27 Radioisotope Thermoelectric Generator (RTG) Cask
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(-1.2, 0.25, 0.4);

  const rtgCaskGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.48, 12);
  const rtgCask = new THREE.Mesh(rtgCaskGeo, materials.darkMetal);
  rtgGroup.add(rtgCask);

  // RTG Cooling Fins
  for (let i = 0; i < 6; i++) {
    const finGeo = new THREE.BoxGeometry(0.02, 0.44, 0.54);
    const fin = new THREE.Mesh(finGeo, materials.aluminum);
    fin.rotation.y = (i * Math.PI) / 6;
    rtgGroup.add(fin);
  }

  // Connecting Cable Ribbon
  const cableGeo = new THREE.PlaneGeometry(0.12, 1.1);
  cableGeo.rotateX(-Math.PI / 2);
  const cable = new THREE.Mesh(cableGeo, materials.darkMetal);
  cable.position.set(-0.6, 0.02, 0.2);
  cable.rotation.y = -0.3;
  group.add(cable);
  group.add(rtgGroup);

  // Passive Seismic Experiment (PSE) Package with Mylar Skirt
  const pseGeo = new THREE.CylinderGeometry(0.25, 0.38, 0.22, 16);
  const pse = new THREE.Mesh(pseGeo, materials.aluminum);
  pse.position.set(0.9, 0.12, -0.6);
  group.add(pse);

  // Telemetry Beacon
  const beacon = createBeacon(0xffb84d, 1.8);
  beacon.position.set(0.25, 1.55, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 10. The Hammer and the Feather (Apollo 15 Galileo Experiment Site)
 */
export function createHammerFeather() {
  const group = new THREE.Group();
  group.name = 'hammer_feather';

  // Apollo Lunar Geology Hammer
  const hammerGroup = new THREE.Group();
  hammerGroup.position.set(0.3, 0.06, 0);
  hammerGroup.rotation.set(0.1, 0.4, 0.05);

  const handleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.45);
  handleGeo.rotateZ(Math.PI / 2);
  const handle = new THREE.Mesh(handleGeo, materials.aluminum);
  hammerGroup.add(handle);

  const headGeo = new THREE.BoxGeometry(0.14, 0.06, 0.06);
  const head = new THREE.Mesh(headGeo, materials.darkMetal);
  head.position.set(0.22, 0, 0);
  hammerGroup.add(head);
  group.add(hammerGroup);

  // The Falcon Feather (White gyrfalcon feather)
  const featherGroup = new THREE.Group();
  featherGroup.position.set(-0.35, 0.03, 0.15);
  featherGroup.rotation.set(-0.05, -0.6, 0.1);

  const vaneGeo = new THREE.PlaneGeometry(0.08, 0.32);
  vaneGeo.rotateX(-Math.PI / 2);
  const vaneMat = new THREE.MeshStandardMaterial({
    color: 0xf5f2ea,
    roughness: 0.95,
    metalness: 0.02,
    side: THREE.DoubleSide
  });
  const vane = new THREE.Mesh(vaneGeo, vaneMat);
  featherGroup.add(vane);

  const quillGeo = new THREE.CylinderGeometry(0.006, 0.003, 0.36);
  quillGeo.rotateZ(Math.PI / 2);
  const quill = new THREE.Mesh(quillGeo, materials.whitePaint);
  featherGroup.add(quill);
  group.add(featherGroup);

  // Subtle amber memory beacon
  const beacon = createBeacon(0xffb84d, 1.4);
  beacon.position.set(0, 0.35, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 11. Mars Descent Debris (Parachute, Backshell, and Impact Scar)
 */
export function createDescentDebris() {
  const group = new THREE.Group();
  group.name = 'descent_debris';

  // Jettisoned Conical Backshell (Half-buried in dust)
  const shellGeo = new THREE.ConeGeometry(1.6, 1.1, 16, 1, true);
  shellGeo.rotateZ(0.4);
  shellGeo.rotateX(0.2);
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xe8e4dc,
    roughness: 0.75,
    metalness: 0.15
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.set(-0.8, 0.45, 0);
  group.add(shell);

  // Draped Supersonic Nylon Parachute
  const chuteGeo = new THREE.PlaneGeometry(3.6, 4.8, 16, 16);
  chuteGeo.rotateX(-Math.PI / 2);
  const pos = chuteGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    // Billow folds in Martian wind
    const billow = Math.sin(px * 2.5) * 0.12 + Math.cos(pz * 1.8) * 0.08;
    pos.setY(i, billow + 0.04);
  }
  chuteGeo.computeVertexNormals();

  const chuteMat = new THREE.MeshStandardMaterial({
    color: 0xd95a2b, // Mars orange-and-white pattern
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide
  });
  const chute = new THREE.Mesh(chuteGeo, chuteMat);
  chute.position.set(2.2, 0.02, 0.6);
  chute.rotation.y = 0.3;
  group.add(chute);

  // Charred Sky-Crane / Descent Stage Impact Scar on Sand
  const scorchGeo = new THREE.CircleGeometry(2.4, 24);
  scorchGeo.rotateX(-Math.PI / 2);
  const scorchMat = new THREE.MeshBasicMaterial({
    color: 0x1f140e,
    transparent: true,
    opacity: 0.65
  });
  const scorch = new THREE.Mesh(scorchGeo, scorchMat);
  scorch.position.set(-2.8, 0.015, -1.8);
  group.add(scorch);

  // Telemetry Beacon
  const beacon = createBeacon(0xe8643c, 1.8);
  beacon.position.set(-0.8, 1.4, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

function createBeacon(colorHex, intensity = 1.5) {
  const beaconGroup = new THREE.Group();

  const ledGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const ledMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const led = new THREE.Mesh(ledGeo, ledMat);
  beaconGroup.add(led);

  const light = new THREE.PointLight(colorHex, intensity, 10, 2.0);
  beaconGroup.add(light);

  beaconGroup.userData = {
    baseColor: colorHex,
    baseIntensity: intensity,
    light: light,
    ledMat: ledMat
  };

  return beaconGroup;
}

export async function getOrCreateModel(modelType) {
  const glbUrl = `./models/${modelType}.glb`;
  const loadedModel = await modelLoader.loadModel(glbUrl);

  if (loadedModel) {
    const beacon = createBeacon(0x4df0ff, 1.8);
    beacon.position.set(0, 2, 0);
    loadedModel.add(beacon);
    loadedModel.userData.beacon = beacon;
    return loadedModel;
  }

  switch (modelType) {
    case 'apollo_lm': return createApolloLM();
    case 'lrv_rover': return createLRV();
    case 'surveyor': return createSurveyor();
    case 'alsep': return createALSEP();
    case 'hammer_feather': return createHammerFeather();
    case 'descent_debris': return createDescentDebris();
    case 'viking_lander': return createViking();
    case 'pathfinder_sojourner': return createPathfinder();
    case 'mer_rover': return createMERRover(false);
    case 'mer_rover_oppy': return createMERRover(true);
    case 'ingenuity': return createIngenuity();
    case 'retroreflector': return createRetroreflector();
    default: return createApolloLM();
  }
}
