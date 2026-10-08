/**
 * REMANENCE: Apollo Lunar Laser Ranging Retroreflector (LLRR) (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on Bendix Aerospace
 * and NASA Apollo 11/14/15 LRRR Technical Documentation.
 *
 * Implements:
 * - 0.65m white anodized aluminum palette with 30-degree tilt toward Earth
 * - 100 recessed Suprasil corner-cube quartz prisms with thermal sunshade baffles
 * - Sun compass alignment gnomon pin and circular spirit bubble level
 * - Tubular aluminum folding support legs and deployment handle
 * - Contact soil berms on lunar regolith and green 532nm return laser pulse beam
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedRetroreflector() {
  const root = new THREE.Group();
  root.name = 'apollo_retroreflector_array';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    whiteThermal: applyWeathering(rawMats.betaCloth, { planet: 'moon' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'moon' })
  };

  // High-purity optical Suprasil quartz material (physical transmission & refraction)
  const quartzMat = new THREE.MeshPhysicalMaterial({
    color: 0xedffff,
    emissive: 0x003318,
    emissiveIntensity: 0.35,
    metalness: 0.04,
    roughness: 0.02,
    transmission: 0.95,
    ior: 1.54,
    reflectivity: 0.98,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02
  });

  const arrayGroup = new THREE.Group();
  arrayGroup.position.set(0, 0.35, 0);
  root.add(arrayGroup);

  // =========================================================================
  // 1. ANODIZED ALUMINUM PALETTE & SUNSHADE CAVITY MATRIX
  // =========================================================================
  const tiltAngle = -0.42; // Tilted toward Earth at 45° latitude

  // Main palette box (0.72m x 0.72m x 0.08m)
  const paletteGeo = new THREE.BoxGeometry(0.74, 0.08, 0.74);
  const palette = new THREE.Mesh(paletteGeo, mats.whiteThermal);
  palette.rotation.x = tiltAngle;
  palette.castShadow = true;
  palette.receiveShadow = true;
  arrayGroup.add(palette);

  // Inverted gold thermal curtain insulation skirts
  const skirtGeo = new THREE.BoxGeometry(0.76, 0.12, 0.76);
  const skirt = new THREE.Mesh(skirtGeo, mats.goldKapton);
  skirt.position.y = -0.05;
  skirt.rotation.x = tiltAngle;
  arrayGroup.add(skirt);

  // 10x10 Matrix of 100 Recessed Corner-Cube Quartz Cavities
  const matrixGroup = new THREE.Group();
  matrixGroup.rotation.x = tiltAngle;
  matrixGroup.position.y = 0.04;
  arrayGroup.add(matrixGroup);

  const spacing = 0.065;
  const startOffset = -4.5 * spacing;

  const prismGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.035, 6);
  const baffleGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.045, 12, 1, true);

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const px = startOffset + c * spacing;
      const pz = startOffset + r * spacing;

      // Quartz corner cube prism
      const prism = new THREE.Mesh(prismGeo, quartzMat);
      prism.position.set(px, 0.015, pz);
      matrixGroup.add(prism);

      // Deep cylindrical thermal sun baffle around each prism
      const baffle = new THREE.Mesh(baffleGeo, mats.blackInconel);
      baffle.position.set(px, 0.025, pz);
      matrixGroup.add(baffle);
    }
  }

  // =========================================================================
  // 2. SUN COMPASS GNOMON & SPIRIT LEVEL BUBBLE
  // =========================================================================
  // Shadow-casting gnomon pin for aiming at Apollo coordinates
  const gnomon = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14), mats.springSteel);
  gnomon.position.set(0.32, 0.12, 0.28);
  matrixGroup.add(gnomon);

  const dialPlate = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), mats.aluminum);
  dialPlate.position.set(0.32, 0.045, 0.28);
  dialPlate.rotation.x = -Math.PI / 2;
  matrixGroup.add(dialPlate);

  // Circular spirit level bubble
  const levelGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 16);
  const levelMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ee88,
    transmission: 0.85,
    roughness: 0.05
  });
  const spiritLevel = new THREE.Mesh(levelGeo, levelMat);
  spiritLevel.position.set(-0.30, 0.045, 0.28);
  matrixGroup.add(spiritLevel);

  // Astronaut carry and alignment handle
  const handleGeo = new THREE.BoxGeometry(0.24, 0.03, 0.04);
  const handle = new THREE.Mesh(handleGeo, mats.aluminum);
  handle.position.set(0, 0.06, 0.38);
  matrixGroup.add(handle);

  // =========================================================================
  // 3. FOLDING TUBULAR DEPLOYMENT LEGS & CONTACT BERMS
  // =========================================================================
  // 2 Rear telescoping support legs
  [-0.32, 0.32].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), mats.aluminum);
    leg.position.set(lx, -0.05, -0.22);
    leg.rotation.x = -0.55;
    arrayGroup.add(leg);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 12), mats.aluminum);
    pad.position.set(lx, -0.32, -0.38);
    arrayGroup.add(pad);

    const bermTex = createFootpadBermTexture();
    const berm = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), new THREE.MeshBasicMaterial({
      map: bermTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    }));
    berm.rotation.x = -Math.PI / 2;
    berm.position.set(lx, 0.015, -0.38);
    root.add(berm);
  });

  // Front base pivot bar resting on regolith
  const frontBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72), mats.aluminum);
  frontBar.position.set(0, -0.32, 0.28);
  frontBar.rotation.z = Math.PI / 2;
  arrayGroup.add(frontBar);

  // =========================================================================
  // 4. PULSED RETURN LASER BEAM (Active Grounding to Observatories)
  // =========================================================================
  // 532nm emerald green laser beam pointing directly toward Earth
  const beamGroup = new THREE.Group();
  beamGroup.position.set(0, 0.35, 0);
  beamGroup.rotation.x = tiltAngle;

  const coreGeo = new THREE.CylinderGeometry(0.014, 0.014, 45, 12);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x55ff99,
    transparent: true,
    opacity: 0.85
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 22.5;
  beamGroup.add(core);

  const glowGeo = new THREE.CylinderGeometry(0.045, 0.045, 45, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x11ff66,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 22.5;
  beamGroup.add(glow);

  root.add(beamGroup);

  // Telemetry Beacon
  const beaconGroup = new THREE.Group();
  const ledGeo = new THREE.SphereGeometry(0.035, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
  beaconGroup.add(new THREE.Mesh(ledGeo, ledMat));
  beaconGroup.add(new THREE.PointLight(0x00ff88, 0.5, 6, 2.0));
  beaconGroup.position.set(0, 0.85, 0);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
