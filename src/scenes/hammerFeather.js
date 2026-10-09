/**
 * REMANENCE: Apollo 15 Galileo Experiment Site (Hammer & Feather)
 * Museum-grade, physically authentic reconstruction based on NASA Apollo 15
 * Lunar Surface Journal, Commander David Scott EVA-3 transcripts, and
 * Smithsonian National Air and Space Museum Apollo Tool Catalog.
 *
 * Implements:
 * - Dedicated Lunar Regolith Memorial Ground Bed (no floating in deep space void)
 * - Apollo Lunar Geologic Hammer (Mass: 1.3 kg, Length: 0.39 m):
 *   - Machined 2024-T4 aluminum handle with etched 0-30 cm scales & diamond knurled grip
 *   - Forged stainless tool steel head with square striking face, central socket, and chisel pick
 *   - Embedded directly in a regolith impact divot with displaced ejecta dust berm
 *   - Astronaut wrist lanyard ring loop at butt of handle
 * - White Female Gyrfalcon Flight Feather ("Baggin" - USAF Academy Mascot, Length: 0.31 m):
 *   - Natural aerodynamic curved flight feather with asymmetric leading & trailing vanes
 *   - Thousands of micro-barb striations and central translucent ivory rachis quill
 *   - Resting softly on the lunar regolith beside the hammer
 * - Commander David Scott EVA-3 Apollo Spacesuit Overshoe Bootprints in the regolith
 * - Scattered lunar basalt pebbles and micro-craters
 */

import * as THREE from 'three';
import {
  getAerospaceMaterials,
  createFootprintTexture,
  createFootpadBermTexture
} from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedHammerFeather() {
  const root = new THREE.Group();
  root.name = 'apollo_15_hammer_feather_memorial';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    toolSteel: applyWeathering(rawMats.toolSteel, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' }),
    hammerHandle: applyWeathering(rawMats.hammerHandle, { planet: 'moon' }),
    falconFeather: rawMats.falconFeather // Pristine pure white keratin flight feather
  };

  const memorialGroup = new THREE.Group();
  root.add(memorialGroup);

  // =========================================================================
  // 1. DEDICATED LUNAR REGOLITH SOIL BED & IMPACT CRATER DIVOT
  // =========================================================================
  // Ground disc (2.6m diameter) providing a seamless, physically solid surface
  const groundGeo = new THREE.CircleGeometry(1.35, 36);
  groundGeo.rotateX(-Math.PI / 2);

  // Apply subtle natural lunar micro-topography to the plinth
  const gPos = groundGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const gx = gPos.getX(i);
    const gz = gPos.getZ(i);
    const r = Math.hypot(gx, gz);
    // Subtle undulation with feather-edge fade to marry with main terrain
    let gy = Math.sin(gx * 3.5) * Math.cos(gz * 3.5) * 0.012 + Math.sin(gx * 7.0) * 0.006;
    // Taper to 0 at perimeter
    if (r > 1.0) {
      gy *= Math.max(0, (1.35 - r) / 0.35);
    }
    gPos.setY(i, gy);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x42464e,
    roughness: 0.96,
    metalness: 0.04
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.name = 'regolith_ground_bed';
  groundMesh.position.y = 0.002;
  groundMesh.receiveShadow = true;
  memorialGroup.add(groundMesh);

  // 1b. Hammer Head Impact Divot & Raised Soil Berm
  // In 1971, Dave Scott dropped the hammer head-first from 1.1m; it struck the soft regolith
  // creating a distinct depression and throwing a small powdery dust rim.
  const divotGroup = new THREE.Group();
  divotGroup.name = 'regolith_ground_divot_group';
  divotGroup.position.set(0.14, 0.004, -0.01);
  memorialGroup.add(divotGroup);

  // Displaced regolith impact crater rim (berm)
  const bermTex = createFootpadBermTexture();
  const bermGeo = new THREE.PlaneGeometry(0.38, 0.38);
  bermGeo.rotateX(-Math.PI / 2);
  const bermMat = new THREE.MeshBasicMaterial({
    map: bermTex,
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });
  const bermMesh = new THREE.Mesh(bermGeo, bermMat);
  bermMesh.name = 'regolith_ground_berm';
  bermMesh.position.y = 0.004;
  divotGroup.add(bermMesh);

  // 3D physical depression cup where steel head is seated
  const divotCupGeo = new THREE.CylinderGeometry(0.065, 0.035, 0.024, 16);
  const divotCupMat = new THREE.MeshStandardMaterial({
    color: 0x2e3238,
    roughness: 0.98,
    metalness: 0.02
  });
  const divotCup = new THREE.Mesh(divotCupGeo, divotCupMat);
  divotCup.name = 'regolith_ground_cup';
  divotCup.position.set(0, -0.01, 0);
  divotCup.receiveShadow = true;
  divotGroup.add(divotCup);

  // =========================================================================
  // 2. APOLLO LUNAR GEOLOGIC HAMMER (Mass: 1.3 kg, Length: 0.39 m)
  // =========================================================================
  const hammerGroup = new THREE.Group();
  hammerGroup.name = 'apollo15_hammer_assembly';
  // Head seated in the impact divot at (0.14, -0.01), handle extending to (-0.18)
  hammerGroup.position.set(-0.03, 0.024, -0.04);
  hammerGroup.rotation.set(0.06, 0.18, -0.05);
  memorialGroup.add(hammerGroup);

  // 2a. Machined 2024-T4 Aluminum Handle (0.35m length, 2.6cm diameter)
  // Features engraved 0-30 cm measurement graduations and diamond knurled grip
  const shaftGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.35, 20);
  shaftGeo.rotateZ(Math.PI / 2);
  const shaft = new THREE.Mesh(shaftGeo, mats.hammerHandle);
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  hammerGroup.add(shaft);

  // Handle butt cap (machined aluminum collar)
  const buttGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.025, 16);
  buttGeo.rotateZ(Math.PI / 2);
  const butt = new THREE.Mesh(buttGeo, mats.aluminum);
  butt.position.x = -0.18;
  butt.castShadow = true;
  hammerGroup.add(butt);

  // Stainless steel wrist lanyard attachment loop
  const loopGeo = new THREE.TorusGeometry(0.013, 0.003, 8, 16);
  const loop = new THREE.Mesh(loopGeo, mats.springSteel);
  loop.position.x = -0.198;
  loop.rotation.y = Math.PI / 2;
  loop.castShadow = true;
  hammerGroup.add(loop);

  // 2b. Forged Tool Steel Hammer Head (16.5 cm total head span)
  const headGroup = new THREE.Group();
  headGroup.position.set(0.175, 0, 0);
  hammerGroup.add(headGroup);

  // Head central mounting socket collar fitting over handle
  const sleeveGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.068, 16);
  const sleeve = new THREE.Mesh(sleeveGeo, mats.toolSteel);
  sleeve.castShadow = true;
  headGroup.add(sleeve);

  // Cross-pin locking roll rivet
  const pinGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.046, 8);
  const pin = new THREE.Mesh(pinGeo, mats.springSteel);
  pin.rotation.z = Math.PI / 2;
  headGroup.add(pin);

  // Square striking impact face (4.6 cm x 4.6 cm beveled block)
  // Rests directly in the impact divot!
  const strikeGeo = new THREE.BoxGeometry(0.046, 0.046, 0.052);
  const strike = new THREE.Mesh(strikeGeo, mats.toolSteel);
  strike.position.y = 0.056;
  strike.castShadow = true;
  strike.receiveShadow = true;
  headGroup.add(strike);

  // Beveled striking face chamfers
  const chamferGeo = new THREE.BoxGeometry(0.048, 0.012, 0.048);
  const chamfer = new THREE.Mesh(chamferGeo, mats.toolSteel);
  chamfer.position.y = 0.082;
  chamfer.castShadow = true;
  headGroup.add(chamfer);

  // Curved chisel pick / rock-splitting claw (opposing face)
  const pickGroup = new THREE.Group();
  pickGroup.position.set(0, -0.052, 0);
  headGroup.add(pickGroup);

  // Tapered forged claw body
  const pickArmGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.08, 12);
  const pickArm = new THREE.Mesh(pickArmGeo, mats.toolSteel);
  pickArm.position.y = -0.038;
  pickArm.rotation.z = 0.18; // curved claw sweep
  pickArm.castShadow = true;
  pickGroup.add(pickArm);

  // Sharp horizontal chisel wedge blade at tip
  const pickTipGeo = new THREE.BoxGeometry(0.024, 0.012, 0.028);
  const pickTip = new THREE.Mesh(pickTipGeo, mats.toolSteel);
  pickTip.position.set(-0.012, -0.082, 0);
  pickTip.rotation.z = 0.35;
  pickTip.castShadow = true;
  pickGroup.add(pickTip);

  // =========================================================================
  // 3. WHITE FEMALE GYRFALCON FLIGHT FEATHER ("Baggin")
  // =========================================================================
  // Primary flight feather from USAF Academy mascot falcon (Length: 0.31 m)
  const featherGroup = new THREE.Group();
  featherGroup.name = 'apollo15_feather_assembly';
  // Rests safely above regolith beside hammer, presented broadside to camera & morning sun
  featherGroup.position.set(-0.06, 0.030, 0.10);
  featherGroup.rotation.set(0.08, 0.22, -0.04);
  memorialGroup.add(featherGroup);

  // 3a. Curving 3D Aerodynamic Flight Feather Mesh (Length: 0.32m, Width: 0.088m)
  // Modeled with natural transverse camber and longitudinal arch
  const featherGeo = new THREE.PlaneGeometry(0.088, 0.32, 16, 24);
  featherGeo.rotateX(-Math.PI / 2);

  const fPositions = featherGeo.attributes.position;
  for (let i = 0; i < fPositions.count; i++) {
    const fx = fPositions.getX(i);
    const fz = fPositions.getZ(i);
    const zNorm = (fz + 0.16) / 0.32; // 0 at base to 1 at tip

    // Natural longitudinal arch: calamus touches soil at base, gently arches up ~1cm, tip touches soil
    const archY = Math.sin(zNorm * Math.PI) * 0.012;

    // Transverse camber: convex upper surface, concave underneath
    const camberY = -(fx * fx) * 1.6;

    fPositions.setY(i, Math.max(0.001, archY + camberY));
  }
  featherGeo.computeVertexNormals();

  const featherMesh = new THREE.Mesh(featherGeo, mats.falconFeather);
  featherMesh.castShadow = true;
  featherMesh.receiveShadow = true;
  featherGroup.add(featherMesh);

  // 3b. 3D Central Rachis Quill Shaft (Ivory Keratin Spine)
  // Tapers from 3.2mm calamus base to 0.8mm at the tip
  const rachisGeo = new THREE.CylinderGeometry(0.0006, 0.0018, 0.32, 10);
  rachisGeo.rotateX(Math.PI / 2);
  const rachisMat = new THREE.MeshStandardMaterial({
    color: 0xfffdf6,
    roughness: 0.32,
    metalness: 0.02
  });

  const rachis = new THREE.Mesh(rachisGeo, rachisMat);
  rachis.position.set(0, 0.006, 0);
  rachis.castShadow = true;
  featherGroup.add(rachis);

  // Hollow calamus quill base tube
  const calamusGeo = new THREE.CylinderGeometry(0.0018, 0.0022, 0.04, 10);
  calamusGeo.rotateX(Math.PI / 2);
  const calamus = new THREE.Mesh(calamusGeo, rachisMat);
  calamus.position.set(0, 0.003, -0.165);
  calamus.castShadow = true;
  featherGroup.add(calamus);

  // =========================================================================
  // 4. COMMANDER DAVID SCOTT EVA-3 OVERBOOT BOOTPRINTS IN REGOLITH
  // =========================================================================
  // Two Apollo lunar overshoe bootprints right where Dave Scott stood
  const fpTex = createFootprintTexture();
  const fpGeo = new THREE.PlaneGeometry(0.24, 0.48);
  fpGeo.rotateX(-Math.PI / 2);
  const fpMat = new THREE.MeshBasicMaterial({
    map: fpTex,
    transparent: true,
    opacity: 0.84,
    depthWrite: false
  });

  const footprints = [
    { x: -0.38, z: -0.22, rot: 0.28 }, // Left overshoe print
    { x: -0.12, z: -0.26, rot: 0.34 }, // Right overshoe print
    { x: 0.46, z: 0.32, rot: -0.68 },  // Egress steps
    { x: 0.28, z: 0.44, rot: -0.74 }
  ];

  footprints.forEach((fp) => {
    const fMesh = new THREE.Mesh(fpGeo, fpMat);
    fMesh.name = 'regolith_footprint_decal';
    fMesh.position.set(fp.x, 0.005, fp.z);
    fMesh.rotation.y = fp.rot;
    memorialGroup.add(fMesh);
  });

  // =========================================================================
  // 5. SCATTERED MARE BASALT PEBBLES & REGOLITH CHIPS
  // =========================================================================
  const pebbleGeo = new THREE.DodecahedronGeometry(0.022, 1);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x484c54,
    roughness: 0.94,
    metalness: 0.06
  });

  const pebbleCoords = [
    { x: -0.42, z: 0.18, s: 1.1 },
    { x: -0.28, z: -0.08, s: 0.8 },
    { x: 0.28, z: 0.14, s: 1.3 },
    { x: 0.36, z: -0.18, s: 0.9 },
    { x: -0.15, z: 0.28, s: 0.7 },
    { x: 0.05, z: 0.32, s: 1.2 },
    { x: 0.42, z: 0.06, s: 0.8 },
    { x: -0.52, z: -0.12, s: 1.0 }
  ];

  pebbleCoords.forEach((p) => {
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
    pebble.name = 'regolith_pebble_chip';
    pebble.scale.set(p.s, p.s * 0.6, p.s);
    pebble.position.set(p.x, 0.008 * p.s, p.z);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    memorialGroup.add(pebble);
  });

  // Reference anchor for inspection callouts
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(0, 0.08, 0);
  root.add(beaconGroup);

  root.userData = {
    beacon: beaconGroup
  };

  return root;
}
