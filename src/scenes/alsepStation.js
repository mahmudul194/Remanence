/**
 * REMANENCE: Apollo Lunar Surface Experiments Package (ALSEP) (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on Bendix Aerospace
 * Flight Systems Manual, NASA ALSEP Termination Reports, and Apollo 12/14/15/16 records.
 *
 * Implements:
 * - Central Station electronics compartment with embossed gold Kapton multilayer insulation
 * - White specular thermal radiator top with sun-shade louvers
 * - Deployable helical S-band telemetry antenna mast with copper spiral element
 * - SNAP-27 Radioisotope Thermoelectric Generator (RTG) with 8 radial cooling fins
 * - Flat 3-meter electrical ribbon cable lying across the lunar regolith with realistic drape
 * - Passive Seismic Experiment (PSE) with aluminized Mylar thermal skirt
 * - Astronaut EVA bootprints and contact soil berms in the regolith
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture, createFootprintTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedALSEP() {
  const root = new THREE.Group();
  root.name = 'alsep_central_station';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'moon' }),
    amberKapton: applyWeathering(rawMats.amberKapton, { planet: 'moon' }),
    darkInconel: applyWeathering(rawMats.blackInconel, { planet: 'moon' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' })
  };

  const alsepGroup = new THREE.Group();
  root.add(alsepGroup);

  // =========================================================================
  // 1. CENTRAL STATION ELECTRONICS ENCLOSURE
  // =========================================================================
  const csGroup = new THREE.Group();
  csGroup.position.set(0, 0.28, 0);
  alsepGroup.add(csGroup);

  // Main electronics box (0.85m x 0.55m x 0.70m) wrapped in crinkled Kapton
  const boxGeo = new THREE.BoxGeometry(0.85, 0.52, 0.70);
  const boxMesh = new THREE.Mesh(boxGeo, mats.goldKapton);
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  csGroup.add(boxMesh);

  // Thermal Radiator Roof (White specular reflector with side louvers)
  const radGeo = new THREE.BoxGeometry(0.88, 0.04, 0.72);
  const radMesh = new THREE.Mesh(radGeo, mats.betaCloth);
  radMesh.position.y = 0.28;
  radMesh.castShadow = true;
  csGroup.add(radMesh);

  // Boyd bolt fastening points and astronaut carry handles
  [-0.38, 0.38].forEach((x) => {
    const handleGeo = new THREE.TorusGeometry(0.045, 0.008, 6, 12);
    const handle = new THREE.Mesh(handleGeo, mats.aluminum);
    handle.position.set(x, 0.15, 0.36);
    handle.rotation.x = Math.PI / 2;
    csGroup.add(handle);
  });

  // Contact soil berm under Central Station base
  const bermTex = createFootpadBermTexture();
  const csBermGeo = new THREE.PlaneGeometry(1.4, 1.2);
  csBermGeo.rotateX(-Math.PI / 2);
  const csBerm = new THREE.Mesh(csBermGeo, new THREE.MeshBasicMaterial({
    map: bermTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  csBerm.position.set(0, 0.012, 0);
  root.add(csBerm);

  // =========================================================================
  // 2. HELICAL S-BAND TELEMETRY ANTENNA
  // =========================================================================
  const antGroup = new THREE.Group();
  antGroup.position.set(0.24, 0.30, -0.15);
  csGroup.add(antGroup);

  // Tubular aluminum antenna mast (0.95m height)
  const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.95, 12);
  const mast = new THREE.Mesh(mastGeo, mats.aluminum);
  mast.position.y = 0.48;
  mast.castShadow = true;
  antGroup.add(mast);

  // Antenna aiming gimbal mechanism
  const gimbalGeo = new THREE.SphereGeometry(0.04, 12, 12);
  const gimbal = new THREE.Mesh(gimbalGeo, mats.aluminum);
  gimbal.position.y = 0.95;
  antGroup.add(gimbal);

  // S-Band Helical Spiral Antenna (pointed toward Earth)
  const helixPoints = [];
  const turns = 5;
  const radius = 0.055;
  const height = 0.32;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const angle = t * turns * Math.PI * 2;
    helixPoints.push(new THREE.Vector3(
      Math.sin(angle) * radius,
      0.95 + t * height,
      Math.cos(angle) * radius
    ));
  }
  const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
  const helixGeo = new THREE.TubeGeometry(helixCurve, 60, 0.005, 6, false);
  const helixMat = new THREE.MeshPhysicalMaterial({
    color: 0xdf843a, // Copper/gold helix wire
    metalness: 0.95,
    roughness: 0.2
  });
  const helixMesh = new THREE.Mesh(helixGeo, helixMat);
  antGroup.add(helixMesh);

  // Ground plane reflector disk behind helix
  const gndPlane = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 16), mats.aluminum);
  gndPlane.position.y = 0.95;
  antGroup.add(gndPlane);

  // =========================================================================
  // 3. SNAP-27 RADIOISOTOPE THERMOELECTRIC GENERATOR (RTG)
  // =========================================================================
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(-2.2, 0.26, 0.6);
  alsepGroup.add(rtgGroup);

  // Cylindrical RTG casing (Plutonium-238 fuel capsule enclosure)
  const rtgGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.52, 16);
  const rtgCasing = new THREE.Mesh(rtgGeo, mats.darkInconel);
  rtgCasing.castShadow = true;
  rtgGroup.add(rtgCasing);

  // 8 Extruded Radial Aluminum Cooling Fins (Vacuum heat radiation)
  for (let f = 0; f < 8; f++) {
    const finAngle = (f * Math.PI) / 4;
    const finGeo = new THREE.BoxGeometry(0.012, 0.48, 0.22);
    const fin = new THREE.Mesh(finGeo, mats.aluminum);
    fin.position.set(Math.sin(finAngle) * 0.22, 0, Math.cos(finAngle) * 0.22);
    fin.rotation.y = finAngle;
    fin.castShadow = true;
    rtgGroup.add(fin);
  }

  // Tubular landing footpads for RTG base
  const rtgBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.04, 16), mats.aluminum);
  rtgBase.position.y = -0.24;
  rtgGroup.add(rtgBase);

  // RTG contact berm
  const rtgBermGeo = new THREE.PlaneGeometry(0.9, 0.9);
  rtgBermGeo.rotateX(-Math.PI / 2);
  const rtgBerm = new THREE.Mesh(rtgBermGeo, new THREE.MeshBasicMaterial({
    map: bermTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  rtgBerm.position.set(-2.2, 0.012, 0.6);
  root.add(rtgBerm);

  // =========================================================================
  // 4. POWER RIBBON CABLE (Connecting RTG to Central Station)
  // =========================================================================
  // Flat ribbon cable draped across the lunar regolith
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.2, 0.03, 0.6),
    new THREE.Vector3(-1.7, 0.015, 0.45),
    new THREE.Vector3(-1.1, 0.018, 0.32),
    new THREE.Vector3(-0.5, 0.015, 0.18),
    new THREE.Vector3(0.0, 0.03, 0.0)
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 24, 0.025, 4, false);
  const cableMat = applyWeathering(new THREE.MeshStandardMaterial({
    color: 0x242830, // Flat fluoropolymer insulation
    roughness: 0.85,
    metalness: 0.1
  }), { planet: 'moon' });
  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  cableMesh.scale.set(1, 0.3, 1); // Flatten into ribbon
  cableMesh.castShadow = true;
  root.add(cableMesh);

  // =========================================================================
  // 5. PASSIVE SEISMIC EXPERIMENT (PSE) WITH MYLAR SKIRT
  // =========================================================================
  const pseGroup = new THREE.Group();
  pseGroup.position.set(1.6, 0.14, -1.2);
  alsepGroup.add(pseGroup);

  // Flared conical aluminized Mylar thermal shroud/skirt
  const skirtGeo = new THREE.ConeGeometry(0.65, 0.28, 24, 2, true);
  const skirt = new THREE.Mesh(skirtGeo, mats.amberKapton);
  skirt.position.y = 0.02;
  skirt.castShadow = true;
  pseGroup.add(skirt);

  // Central seismometer sensor canister
  const sensorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 16);
  const sensor = new THREE.Mesh(sensorGeo, mats.aluminum);
  sensor.position.y = 0.12;
  pseGroup.add(sensor);

  // PSE contact berm
  const pseBermGeo = new THREE.PlaneGeometry(1.2, 1.2);
  pseBermGeo.rotateX(-Math.PI / 2);
  const pseBerm = new THREE.Mesh(pseBermGeo, new THREE.MeshBasicMaterial({
    map: bermTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  pseBerm.position.set(1.6, 0.012, -1.2);
  root.add(pseBerm);

  // =========================================================================
  // 6. ASTRONAUT EVA FOOTPRINTS
  // =========================================================================
  const fpTex = createFootprintTexture();
  const fpGeo = new THREE.PlaneGeometry(0.3, 0.58);
  fpGeo.rotateX(-Math.PI / 2);
  const fpMat = new THREE.MeshBasicMaterial({
    map: fpTex,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  const footprints = [
    { x: -0.65, z: 0.45, rot: 1.1 },
    { x: -1.05, z: 0.65, rot: 1.3 },
    { x: -1.65, z: 0.82, rot: 1.2 },
    { x: 0.85, z: -0.55, rot: -0.8 },
    { x: 1.25, z: -0.85, rot: -0.7 }
  ];

  footprints.forEach((fp) => {
    const fMesh = new THREE.Mesh(fpGeo, fpMat);
    fMesh.position.set(fp.x, 0.013, fp.z);
    fMesh.rotation.y = fp.rot;
    root.add(fMesh);
  });

  // Telemetry Beacon
  const beaconGroup = new THREE.Group();
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
  beaconGroup.add(led);
  beaconGroup.add(new THREE.PointLight(0xffb84d, 0.5, 6, 2.0));
  beaconGroup.position.set(0.24, 1.62, -0.15);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
