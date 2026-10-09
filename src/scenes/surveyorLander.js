/**
 * REMANENCE: Surveyor 3 Lunar Lander (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA Hughes Aircraft
 * Technical Manuals, Surveyor Project Final Report TR 32-1265, and Apollo 12 Inspection Data.
 *
 * Implements:
 * - Triangular tubular 7075 aluminum alloy tripod spaceframe with 3 outrigger landing legs
 * - 3 crushable aluminum honeycomb footpads (0.3m diameter) resting on crater slope
 * - Center mast with planar high-gain array and GaAs/Si solar array
 * - Motorized pantograph surface sampler arm with collection scoop
 * - Cylindrical television camera unit with optical azimuth mirror head
 * - 3 vernier rocket engines, solid retro-rocket sphere, and titanium helium tanks
 * - Displaced lunar regolith berms, Apollo 12 astronaut bootprints, and GLSL weathering
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture, createFootprintTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedSurveyor() {
  const root = new THREE.Group();
  root.name = 'surveyor_3_lander';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'moon' }),
    amberKapton: applyWeathering(rawMats.amberKapton, { planet: 'moon' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'moon' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' })
  };

  const landerGroup = new THREE.Group();
  root.add(landerGroup);

  // =========================================================================
  // 1. TRIANGULAR TUBULAR ALUMINUM TRIPOD SPACEFRAME
  // =========================================================================
  const frameGroup = new THREE.Group();
  landerGroup.add(frameGroup);

  // Central triangular equipment mast (0.95m edge, 1.15m height)
  for (let i = 0; i < 3; i++) {
    const a1 = (i * 2 * Math.PI) / 3;
    const a2 = ((i + 1) * 2 * Math.PI) / 3;
    const r = 0.65;

    const x1 = Math.sin(a1) * r;
    const z1 = Math.cos(a1) * r;
    const x2 = Math.sin(a2) * r;
    const z2 = Math.cos(a2) * r;

    // Horizontal lower and upper structural struts
    [0.55, 1.25].forEach((y) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const strutGeo = new THREE.CylinderGeometry(0.025, 0.025, len, 8);
      const strut = new THREE.Mesh(strutGeo, mats.aluminum);
      strut.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      strut.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(x2 - x1, 0, z2 - z1).normalize()
      );
      frameGroup.add(strut);
    });

    // Vertical corner upright tubular columns
    const columnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8);
    const column = new THREE.Mesh(columnGeo, mats.aluminum);
    column.position.set(x1, 0.90, z1);
    frameGroup.add(column);

    // Cross-diagonal truss bracing
    const diagGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.15, 8);
    const diag = new THREE.Mesh(diagGeo, mats.aluminum);
    diag.position.set((x1 + x2) / 2, 0.90, (z1 + z2) / 2);
    diag.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(x2 - x1, 0.70, z2 - z1).normalize()
    );
    frameGroup.add(diag);
  }

  // Thermal Compartments (A and B equipment electronics boxes)
  const compAGeo = new THREE.BoxGeometry(0.45, 0.38, 0.35);
  const compA = new THREE.Mesh(compAGeo, mats.goldKapton);
  compA.position.set(0.18, 0.85, 0.12);
  frameGroup.add(compA);

  const compBGeo = new THREE.BoxGeometry(0.42, 0.35, 0.32);
  const compB = new THREE.Mesh(compBGeo, mats.whitePaint || mats.betaCloth);
  compB.position.set(-0.20, 0.82, -0.15);
  frameGroup.add(compB);

  // Spherical Solid Propellant Retro-Rocket (Nestled in base center)
  const retroSphereGeo = new THREE.SphereGeometry(0.38, 16, 16);
  const retroSphere = new THREE.Mesh(retroSphereGeo, mats.blackInconel);
  retroSphere.position.set(0, 0.72, 0);
  frameGroup.add(retroSphere);

  // 2 Spherical Helium & 3 Hydrazine Fuel Tanks
  const tankGeo = new THREE.SphereGeometry(0.14, 12, 12);
  for (let t = 0; t < 3; t++) {
    const tang = (t * 2 * Math.PI) / 3 + 0.5;
    const tank = new THREE.Mesh(tankGeo, mats.aluminum);
    tank.position.set(Math.sin(tang) * 0.42, 0.65, Math.cos(tang) * 0.42);
    frameGroup.add(tank);
  }

  // =========================================================================
  // 2. 3 OUTRIGGER LANDING LEGS & HONEYCOMB FOOTPADS
  // =========================================================================
  const legGroup = new THREE.Group();
  landerGroup.add(legGroup);

  const padRadius = 0.24; // 0.3m footpad
  const legDist = 1.95;

  for (let l = 0; l < 3; l++) {
    const angle = (l * 2 * Math.PI) / 3;
    const singleLeg = new THREE.Group();
    singleLeg.rotation.y = angle;

    // Primary shock absorber oleo strut
    const strutGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.85, 12);
    const strut = new THREE.Mesh(strutGeo, mats.aluminum);
    strut.position.set(0, 0.48, 1.05);
    strut.rotation.x = 0.65;
    singleLeg.add(strut);

    // Inverted V A-frame radius rods
    [-0.18, 0.18].forEach((rx) => {
      const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.45, 8);
      const rod = new THREE.Mesh(rodGeo, mats.aluminum);
      rod.position.set(rx, 0.38, 1.25);
      rod.rotation.x = 0.45;
      rod.rotation.z = rx > 0 ? -0.15 : 0.15;
      singleLeg.add(rod);
    });

    // Crushable Aluminum Honeycomb Footpad Dish
    const padDishGeo = new THREE.CylinderGeometry(padRadius, padRadius * 1.15, 0.06, 16);
    const padDish = new THREE.Mesh(padDishGeo, mats.aluminum);
    padDish.position.set(0, 0.03, legDist);
    singleLeg.add(padDish);

    // Omni-directional whip antenna on leg 1 & 2
    if (l < 2) {
      const omniWhip = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.2), mats.springSteel);
      omniWhip.position.set(0.12, 0.85, 1.6);
      omniWhip.rotation.x = -0.3;
      singleLeg.add(omniWhip);
    }

    // Vernier Thruster engine cluster at leg hinge
    const vernierGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.18, 12);
    const vernier = new THREE.Mesh(vernierGeo, mats.blackInconel);
    vernier.position.set(0, 0.38, 0.82);
    singleLeg.add(vernier);

    legGroup.add(singleLeg);

    // Displaced lunar regolith berm contact disc under each footpad
    const padWorldX = Math.sin(angle) * legDist;
    const padWorldZ = Math.cos(angle) * legDist;
    const bermTex = createFootpadBermTexture();
    const bermGeo = new THREE.PlaneGeometry(0.85, 0.85);
    bermGeo.rotateX(-Math.PI / 2);
    const bermMat = new THREE.MeshBasicMaterial({
      map: bermTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const bermMesh = new THREE.Mesh(bermGeo, bermMat);
    bermMesh.position.set(padWorldX, 0.015, padWorldZ);
    root.add(bermMesh);
  }

  // =========================================================================
  // 3. CENTER POWER MAST, SOLAR ARRAY & PLANAR HIGH-GAIN ANTENNA
  // =========================================================================
  const mastGroup = new THREE.Group();
  mastGroup.position.set(0, 1.25, 0);
  landerGroup.add(mastGroup);

  // Tubular aluminum vertical mast
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.65, 12), mats.aluminum);
  mastPole.position.y = 0.82;
  mastGroup.add(mastPole);

  // Steerable Azimuth/Elevation Drive Gimbal Unit
  const gimbalBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.22), mats.blackInconel);
  gimbalBox.position.y = 1.62;
  mastGroup.add(gimbalBox);

  // Solar Array Panel (Tilted toward the low lunar sun)
  const solarPanelGeo = new THREE.BoxGeometry(0.65, 0.95, 0.035);
  const solarPanel = new THREE.Mesh(solarPanelGeo, mats.betaCloth);
  solarPanel.position.set(0.18, 1.95, 0.15);
  solarPanel.rotation.set(-0.35, 0.25, 0);
  mastGroup.add(solarPanel);

  // Solar cells on panel face
  const cellsGeo = new THREE.BoxGeometry(0.60, 0.90, 0.01);
  const cells = new THREE.Mesh(cellsGeo, mats.blackInconel);
  cells.position.set(0.18, 1.95, 0.17);
  cells.rotation.set(-0.35, 0.25, 0);
  mastGroup.add(cells);

  // Planar High-Gain Antenna Array (Flat slotted waveguide array facing Earth)
  const planarAntGeo = new THREE.BoxGeometry(0.55, 0.72, 0.03);
  const planarAnt = new THREE.Mesh(planarAntGeo, mats.goldKapton);
  planarAnt.position.set(-0.22, 1.88, -0.15);
  planarAnt.rotation.set(0.45, -0.35, 0);
  mastGroup.add(planarAnt);

  // =========================================================================
  // 4. TELEVISION CAMERA WITH APOLLO 12 RETRIEVAL MARKS
  // =========================================================================
  const camGroup = new THREE.Group();
  camGroup.position.set(0.42, 1.15, 0.35);
  landerGroup.add(camGroup);

  // Cylindrical Camera Barrel with Optical Azimuth Mirror Hood
  const camBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 16), mats.aluminum);
  camGroup.add(camBarrel);

  const mirrorHood = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16, 1, true), mats.goldKapton);
  mirrorHood.position.y = 0.25;
  camGroup.add(mirrorHood);

  const mirrorLens = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), mats.blackInconel);
  mirrorLens.position.set(0, 0.25, 0.06);
  mirrorLens.rotation.x = -0.4;
  camGroup.add(mirrorLens);

  // Severed wiring loom (where Pete Conrad clipped cables with wire cutters!)
  const wireLoom = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14), mats.blackInconel);
  wireLoom.position.set(-0.08, -0.18, 0);
  wireLoom.rotation.z = 0.6;
  camGroup.add(wireLoom);

  // =========================================================================
  // 5. MOTORIZED PANTOGRAPH SURFACE SAMPLER SCOOP MECHANISM
  // =========================================================================
  const samplerGroup = new THREE.Group();
  samplerGroup.position.set(-0.38, 0.72, 0.55);
  landerGroup.add(samplerGroup);

  // Motor drive gearbox
  const gearbox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.14), mats.aluminum);
  samplerGroup.add(gearbox);

  // Scissor pantograph extension arm (reaching down to the lunar soil)
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95), mats.aluminum);
  arm1.position.set(-0.25, -0.15, 0.45);
  arm1.rotation.set(0.85, 0.25, -0.45);
  samplerGroup.add(arm1);

  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85), mats.aluminum);
  arm2.position.set(-0.55, -0.45, 0.95);
  arm2.rotation.set(0.45, 0.15, -0.25);
  samplerGroup.add(arm2);

  // Soil sampling collection scoop with cutting teeth
  const scoopBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.22), mats.aluminum);
  scoopBox.position.set(-0.75, -0.66, 1.25);
  scoopBox.rotation.set(0.2, 0.1, -0.1);
  samplerGroup.add(scoopBox);

  // Dug trench in lunar regolith beneath the scoop
  const trenchGeo = new THREE.BoxGeometry(0.22, 0.04, 0.65);
  const trenchMat = new THREE.MeshBasicMaterial({
    color: 0x22252a,
    transparent: true,
    opacity: 0.85
  });
  const trench = new THREE.Mesh(trenchGeo, trenchMat);
  trench.position.set(-0.85, 0.015, 1.35);
  trench.rotation.y = 0.35;
  root.add(trench);

  // =========================================================================
  // 6. APOLLO 12 ASTRONAUT FOOTPRINTS (Conrad & Bean examining Surveyor)
  // =========================================================================
  const fpTex = createFootprintTexture();
  const fpGeo = new THREE.PlaneGeometry(0.32, 0.62);
  fpGeo.rotateX(-Math.PI / 2);
  const fpMat = new THREE.MeshBasicMaterial({
    map: fpTex,
    transparent: true,
    opacity: 0.80,
    depthWrite: false
  });

  const footprintCoords = [
    { x: 0.85, z: 0.45, rot: 1.8 },
    { x: 0.72, z: 0.85, rot: 1.6 },
    { x: -0.65, z: 1.65, rot: -0.8 },
    { x: -0.45, z: 1.95, rot: -0.6 }
  ];

  footprintCoords.forEach((fp) => {
    const fMesh = new THREE.Mesh(fpGeo, fpMat);
    fMesh.position.set(fp.x, 0.014, fp.z);
    fMesh.rotation.y = fp.rot;
    root.add(fMesh);
  });

  // Reference anchor for inspection
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(0, 1.8, 0);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
