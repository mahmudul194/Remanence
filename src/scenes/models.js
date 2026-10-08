/**
 * 3D Models for REMANENCE
 * Supports loading external NASA .glb models with DRACO compression,
 * and contains realistic procedural compound 3D models for all 8 machines.
 * Features realistic PBR materials (gold Kapton foil, solar cells, anodized alloy),
 * accurate proportions, and emissive telemetry beacons.
 */

import * as THREE from 'three';
import { modelLoader } from '../utils/loader.js';

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
 * 1. Apollo 11 Lunar Module Descent Stage
 */
export function createApolloLM() {
  const group = new THREE.Group();
  group.name = 'apollo_lm';

  // Octagonal Descent Stage Body
  const bodyGeo = new THREE.CylinderGeometry(2.0, 2.3, 1.4, 8);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.goldKapton);
  bodyMesh.position.y = 1.3;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Top deck (dark heat shield)
  const topGeo = new THREE.CylinderGeometry(1.9, 1.9, 0.1, 8);
  const topMesh = new THREE.Mesh(topGeo, materials.darkMetal);
  topMesh.position.y = 2.05;
  group.add(topMesh);

  // Descent Propulsion System (DPS) Rocket Engine Bell
  const engineGeo = new THREE.ConeGeometry(0.7, 1.1, 24, 1, true);
  const engineMesh = new THREE.Mesh(engineGeo, materials.darkMetal);
  engineMesh.position.y = 0.5;
  engineMesh.rotation.x = Math.PI;
  group.add(engineMesh);

  // 4 Outrigger Landing Gear Struts & Footpads
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const legGroup = new THREE.Group();

    // Primary strut
    const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5);
    const strutMesh = new THREE.Mesh(strutGeo, materials.goldKapton);
    strutMesh.position.set(0, 0.9, 1.3);
    strutMesh.rotation.x = 0.65;
    legGroup.add(strutMesh);

    // V-shaped secondary braces
    const braceGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8);
    const brace1 = new THREE.Mesh(braceGeo, materials.aluminum);
    brace1.position.set(-0.35, 1.1, 0.8);
    brace1.rotation.set(0.4, 0.3, 0.3);
    legGroup.add(brace1);

    const brace2 = new THREE.Mesh(braceGeo, materials.aluminum);
    brace2.position.set(0.35, 1.1, 0.8);
    brace2.rotation.set(0.4, -0.3, -0.3);
    legGroup.add(brace2);

    // Footpad dish
    const padGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.1, 16);
    const padMesh = new THREE.Mesh(padGeo, materials.goldKapton);
    padMesh.position.set(0, 0.05, 2.1);
    legGroup.add(padMesh);

    legGroup.rotation.y = angle;
    group.add(legGroup);
  }

  // Ladder on front strut
  const ladderGeo = new THREE.BoxGeometry(0.25, 1.6, 0.05);
  const ladderMesh = new THREE.Mesh(ladderGeo, materials.aluminum);
  ladderMesh.position.set(0, 0.9, 2.2);
  ladderMesh.rotation.x = 0.65;
  group.add(ladderMesh);

  // Commemorative plaque on ladder strut
  const plaqueGeo = new THREE.BoxGeometry(0.2, 0.12, 0.02);
  const plaqueMesh = new THREE.Mesh(
    plaqueGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 })
  );
  plaqueMesh.position.set(0, 1.1, 1.95);
  plaqueMesh.rotation.x = 0.65;
  group.add(plaqueMesh);

  // American Flag replica standing nearby
  const flagGroup = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.6);
  const poleMesh = new THREE.Mesh(poleGeo, materials.aluminum);
  poleMesh.position.set(2.8, 0.8, 1.5);
  flagGroup.add(poleMesh);

  const flagGeo = new THREE.PlaneGeometry(0.7, 0.45);
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xdd2233,
    roughness: 0.8,
    side: THREE.DoubleSide
  });
  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(3.15, 1.35, 1.5);
  flagMesh.rotation.y = 0.2;
  flagGroup.add(flagMesh);
  group.add(flagGroup);

  // Telemetry Beacon LED
  const beacon = createBeacon(0xffd700, 1.8);
  beacon.position.set(0, 2.2, 0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
}

/**
 * 2. Apollo Lunar Roving Vehicle (LRV)
 */
export function createLRV() {
  const group = new THREE.Group();
  group.name = 'lrv_rover';

  // Chassis Frame
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.15, 2.6);
  const chassisMesh = new THREE.Mesh(chassisGeo, materials.aluminum);
  chassisMesh.position.y = 0.5;
  group.add(chassisMesh);

  // 4 Wire-Mesh Wheels with Fenders
  const wheelPositions = [
    [-0.95, 0.45, 0.95],
    [0.95, 0.45, 0.95],
    [-0.95, 0.45, -0.95],
    [0.95, 0.45, -0.95]
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.25, 16);
    const tireMesh = new THREE.Mesh(tireGeo, materials.wheelMesh);
    tireMesh.rotation.z = Math.PI / 2;
    wheelGroup.add(tireMesh);

    const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.27, 8);
    const hubMesh = new THREE.Mesh(hubGeo, materials.darkMetal);
    hubMesh.rotation.z = Math.PI / 2;
    wheelGroup.add(hubMesh);

    const fenderGeo = new THREE.BoxGeometry(0.3, 0.08, 0.6);
    const fenderMesh = new THREE.Mesh(fenderGeo, materials.whitePaint);
    fenderMesh.position.set(0, 0.4, 0);
    wheelGroup.add(fenderMesh);

    group.add(wheelGroup);
  });

  // Dual Lawn-Chair Seats
  for (let s = -0.35; s <= 0.35; s += 0.7) {
    const seatBottomGeo = new THREE.BoxGeometry(0.45, 0.05, 0.45);
    const seatBottom = new THREE.Mesh(seatBottomGeo, materials.darkMetal);
    seatBottom.position.set(s, 0.65, 0.0);
    group.add(seatBottom);

    const seatBackGeo = new THREE.BoxGeometry(0.45, 0.5, 0.05);
    const seatBack = new THREE.Mesh(seatBackGeo, materials.darkMetal);
    seatBack.position.set(s, 0.92, -0.22);
    seatBack.rotation.x = -0.15;
    group.add(seatBack);
  }

  // T-handle Steering Control Console
  const stickGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4);
  const stickMesh = new THREE.Mesh(stickGeo, materials.aluminum);
  stickMesh.position.set(0, 0.8, 0.2);
  group.add(stickMesh);

  const tHandleGeo = new THREE.BoxGeometry(0.2, 0.04, 0.04);
  const tHandle = new THREE.Mesh(tHandleGeo, materials.darkMetal);
  tHandle.position.set(0, 1.0, 0.2);
  group.add(tHandle);

  // High-Gain Mesh Antenna Dish on front mast
  const mastGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1);
  const mastMesh = new THREE.Mesh(mastGeo, materials.aluminum);
  mastMesh.position.set(0.5, 1.1, 1.0);
  group.add(mastMesh);

  const dishGeo = new THREE.CylinderGeometry(0.4, 0.1, 0.1, 16, 1, true);
  const dishMesh = new THREE.Mesh(dishGeo, materials.aluminum);
  dishMesh.position.set(0.5, 1.6, 1.0);
  dishMesh.rotation.x = 0.5;
  group.add(dishMesh);

  // RCA Color TV Camera (filmed Apollo 17 lift-off)
  const tvCamGeo = new THREE.BoxGeometry(0.2, 0.18, 0.3);
  const tvCamMesh = new THREE.Mesh(tvCamGeo, materials.goldKapton);
  tvCamMesh.position.set(-0.5, 1.2, 1.0);
  group.add(tvCamMesh);

  // Telemetry Beacon
  const beacon = createBeacon(0x4df0ff, 1.6);
  beacon.position.set(0.5, 1.75, 1.0);
  group.add(beacon);
  group.userData.beacon = beacon;

  return group;
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
    case 'viking_lander': return createViking();
    case 'pathfinder_sojourner': return createPathfinder();
    case 'mer_rover': return createMERRover(false);
    case 'mer_rover_oppy': return createMERRover(true);
    case 'ingenuity': return createIngenuity();
    case 'retroreflector': return createRetroreflector();
    default: return createApolloLM();
  }
}
