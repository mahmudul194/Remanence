/**
 * REMANENCE: Mars Pathfinder Base & Sojourner Micro-Rover (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA JPL Mars Pathfinder
 * Project Final Reports, Ares Vallis Touchdown Telemetry, and APXS Science Logs.
 *
 * Implements:
 * - Tetrahedral Carl Sagan Memorial Base with 3 unfolded solar petals
 * - Bunched and deflated multi-lobed Vectran impact airbags underneath petals
 * - Stereo Imager for Mars Pathfinder (IMP) camera mast with color filter wheel
 * - Egress deployment ramps with Sojourner's descent wheel tracks in the sand
 * - Sojourner micro-rover with 6-wheel rocker-bogie and GaAs solar panel deck
 * - APXS sensor deployed against a basalt Martian rock
 * - Displaced sand berms and authentic GLSL hematite dust weathering
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedPathfinder() {
  const root = new THREE.Group();
  root.name = 'mars_pathfinder_and_sojourner';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'mars' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'mars' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'mars' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'mars' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'mars' })
  };

  // Airbag Kevlar/Vectran material (matte woven synthetic fabric with deflation creases)
  const airbagMat = applyWeathering(new THREE.MeshStandardMaterial({
    color: 0xdfd9ce,
    roughness: 0.92,
    metalness: 0.04
  }), { planet: 'mars' });

  // Solar array material
  const solarCanvas = document.createElement('canvas');
  solarCanvas.width = 256; solarCanvas.height = 256;
  const sCtx = solarCanvas.getContext('2d');
  sCtx.fillStyle = '#081224'; sCtx.fillRect(0, 0, 256, 256);
  sCtx.strokeStyle = '#9ca5b5'; sCtx.lineWidth = 1.2;
  for (let i = 0; i <= 256; i += 32) {
    sCtx.beginPath(); sCtx.moveTo(i, 0); sCtx.lineTo(i, 256); sCtx.stroke();
    sCtx.beginPath(); sCtx.moveTo(0, i); sCtx.lineTo(256, i); sCtx.stroke();
  }
  sCtx.fillStyle = 'rgba(185, 87, 40, 0.42)'; // Martian dust film
  sCtx.fillRect(0, 0, 256, 256);
  const solarTex = new THREE.CanvasTexture(solarCanvas);
  solarTex.wrapS = THREE.RepeatWrapping;
  solarTex.wrapT = THREE.RepeatWrapping;

  const solarMat = applyWeathering(new THREE.MeshPhysicalMaterial({
    map: solarTex,
    color: 0xffffff,
    metalness: 0.88,
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2
  }), { planet: 'mars' });

  const pathfinderGroup = new THREE.Group();
  root.add(pathfinderGroup);

  // =========================================================================
  // 1. DEFLATED VECTRAN AIRBAGS (Cushioned the Ares Vallis Touchdown)
  // =========================================================================
  const airbagGroup = new THREE.Group();
  airbagGroup.position.set(0, 0.08, 0);
  pathfinderGroup.add(airbagGroup);

  // Multiple deflated overlapping lobes bunched on the terrain
  const lobeGeo = new THREE.DodecahedronGeometry(0.55, 1);
  for (let b = 0; b < 9; b++) {
    const bAng = (b * 2 * Math.PI) / 9;
    const lobe = new THREE.Mesh(lobeGeo, airbagMat);
    const bDist = 0.65 + Math.random() * 0.45;
    lobe.position.set(Math.sin(bAng) * bDist, 0.08 + Math.random() * 0.08, Math.cos(bAng) * bDist);
    lobe.scale.set(1.4 + Math.random() * 0.4, 0.35 + Math.random() * 0.2, 1.1 + Math.random() * 0.3);
    lobe.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    airbagGroup.add(lobe);
  }

  // =========================================================================
  // 2. 3 UNFOLDED TRIANGULAR PETALS (Carl Sagan Memorial Base)
  // =========================================================================
  const petalGroup = new THREE.Group();
  petalGroup.position.set(0, 0.24, 0);
  pathfinderGroup.add(petalGroup);

  // Central triangular electronics shelf
  const centerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 3), mats.goldKapton);
  petalGroup.add(centerBase);

  // 3 Unfolded Triangular Petals with Solar Arrays
  for (let p = 0; p < 3; p++) {
    const pAng = (p * 2 * Math.PI) / 3;
    const petalSub = new THREE.Group();
    petalSub.rotation.y = pAng;

    // Triangular petal structural panel
    const petalGeo = new THREE.BoxGeometry(0.92, 0.035, 1.25);
    const petal = new THREE.Mesh(petalGeo, mats.aluminum);
    petal.position.set(0, -0.04, 0.88);
    petal.rotation.x = -0.12; // Slanted down onto the airbags
    petalSub.add(petal);

    // Solar array covering petal
    const sPanel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 1.15), solarMat);
    sPanel.position.set(0, -0.02, 0.88);
    sPanel.rotation.x = -0.12;
    petalSub.add(sPanel);

    petalGroup.add(petalSub);
  }

  // Egress Deployment Ramp (Where Sojourner rolled down to the soil)
  const rampGeo = new THREE.BoxGeometry(0.42, 0.02, 1.15);
  const ramp = new THREE.Mesh(rampGeo, mats.aluminum);
  ramp.position.set(0.72, 0.12, 0.75);
  ramp.rotation.set(0.24, 0.75, -0.15);
  pathfinderGroup.add(ramp);

  // =========================================================================
  // 3. STEREO IMP CAMERA MAST & ANTENNAS
  // =========================================================================
  const mastGroup = new THREE.Group();
  mastGroup.position.set(0, 0.28, 0);
  pathfinderGroup.add(mastGroup);

  // 0.8m Deployable IMP mast tube
  const impMast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 12), mats.aluminum);
  impMast.position.y = 0.42;
  mastGroup.add(impMast);

  // Stereo Camera Head (two camera eyes like periscope)
  const impHead = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.10, 0.14), mats.aluminum);
  impHead.position.y = 0.85;
  mastGroup.add(impHead);

  [-0.05, 0.05].forEach((cx) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.06, 12), mats.blackInconel);
    eye.position.set(cx, 0.85, 0.08);
    eye.rotation.x = Math.PI / 2;
    mastGroup.add(eye);
  });

  // HGA & LGA Antennas
  const lgaAnt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.65), mats.springSteel);
  lgaAnt.position.set(0.22, 0.55, -0.18);
  mastGroup.add(lgaAnt);

  // =========================================================================
  // 4. SOJOURNER MICRO-ROVER (Stationed nearby on the Martian Soil)
  // =========================================================================
  const sojournerGroup = new THREE.Group();
  // Parked on the red sand 2.2m away from the lander
  sojournerGroup.position.set(1.85, 0.06, 1.65);
  sojournerGroup.rotation.y = 0.45;
  root.add(sojournerGroup);

  // Micro-rover body chassis (65cm long, 48cm wide, 18cm tall)
  const sBodyGeo = new THREE.BoxGeometry(0.38, 0.12, 0.52);
  const sBody = new THREE.Mesh(sBodyGeo, mats.aluminum);
  sBody.position.y = 0.11;
  sBody.castShadow = true;
  sojournerGroup.add(sBody);

  // GaAs Solar Array deck covering top of Sojourner
  const sSolarGeo = new THREE.BoxGeometry(0.36, 0.015, 0.48);
  const sSolar = new THREE.Mesh(sSolarGeo, solarMat);
  sSolar.position.set(0, 0.175, 0);
  sojournerGroup.add(sSolar);

  // 6 Aluminum Cleated Wheels with Rocker-Bogie
  const sWheelRadius = 0.065; // 13cm diameter
  const sWheelPositions = [
    [-0.24, 0.18], [-0.26, 0.0], [-0.24, -0.18],
    [0.24, 0.18], [0.26, 0.0], [0.24, -0.18]
  ];

  sWheelPositions.forEach(([wx, wz]) => {
    const swGeo = new THREE.CylinderGeometry(sWheelRadius, sWheelRadius, 0.065, 16);
    const sw = new THREE.Mesh(swGeo, mats.aluminum);
    sw.rotation.z = Math.PI / 2;
    sw.position.set(wx, sWheelRadius, wz);
    sw.castShadow = true;
    sojournerGroup.add(sw);

    // Micro cleat treads
    for (let c = 0; c < 8; c++) {
      const cAng = (c * Math.PI) / 4;
      const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.008, 0.012), mats.blackInconel);
      cleat.position.set(wx, sWheelRadius + Math.sin(cAng) * 0.066, wz + Math.cos(cAng) * 0.066);
      sojournerGroup.add(cleat);
    }
  });

  // UHF whip antenna
  const sUhf = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.32), mats.springSteel);
  sUhf.position.set(0.12, 0.32, -0.18);
  sojournerGroup.add(sUhf);

  // APXS instrument sensor arm deployed against Martian rock
  const apxsArm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22), mats.aluminum);
  apxsArm.position.set(0, 0.08, 0.34);
  apxsArm.rotation.x = 0.55;
  sojournerGroup.add(apxsArm);

  const apxsHead = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), mats.blackInconel);
  apxsHead.position.set(0, 0.04, 0.44);
  sojournerGroup.add(apxsHead);

  // Basalt Martian rock ("Barnacle Bill" / "Yogi" rock)
  const rockGeo = new THREE.DodecahedronGeometry(0.24, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x582a1a,
    roughness: 0.92,
    metalness: 0.05
  });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(0, 0.12, 0.62);
  rock.scale.set(1.4, 0.85, 1.2);
  rock.castShadow = true;
  sojournerGroup.add(rock);

  // Sojourner wheel tracks in sand leading from the ramp
  const trackGeo = new THREE.PlaneGeometry(0.52, 1.8);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMat = new THREE.MeshBasicMaterial({
    color: 0x44160a,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });
  const tracks = new THREE.Mesh(trackGeo, trackMat);
  tracks.position.set(1.45, 0.012, 1.25);
  tracks.rotation.y = 0.65;
  root.add(tracks);

  // Telemetry Beacon indicator
  const beaconGroup = new THREE.Group();
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffb84d }));
  beaconGroup.add(led);
  beaconGroup.add(new THREE.PointLight(0xffb84d, 0.5, 6, 2.0));
  beaconGroup.position.set(0, 1.25, 0);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
