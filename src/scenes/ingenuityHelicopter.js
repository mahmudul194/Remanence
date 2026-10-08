/**
 * REMANENCE: Ingenuity Mars Helicopter (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA JPL Ingenuity
 * Mars Helicopter Technical Specifications, Mars 2020 Flight Documentation,
 * and Sol 1040 Flight 72 Navcam / Mastcam-Z damage imaging.
 *
 * Implements:
 * - Coaxial counter-rotating carbon-fiber rotor system (1.2m rotor diameter)
 * - Flight 72 Historical Damage: Snapped rotor tip with frayed composite fibers
 *   and broken blade fragment resting on the sand nearby
 * - Swashplates, collective pitch control horns, counterweights, and hub drive motors
 * - Cubic avionics fuselage wrapped in crinkled gold Kapton with taped seams
 * - Monocrystalline photovoltaic solar panel with monopole telecom antenna
 * - Downward-facing navigation camera and LIDAR altimeter optical apertures
 * - 4 slender carbon-composite landing legs with aluminum footpads resting on sand
 * - Contact sand berms and authentic Martian hematite dust weathering
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedIngenuity() {
  const root = new THREE.Group();
  root.name = 'ingenuity_mars_helicopter';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'mars' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'mars' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'mars' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'mars' })
  };

  // 1. Carbon-Fiber Material with procedural woven twill texture
  const cfCanvas = document.createElement('canvas');
  cfCanvas.width = 128;
  cfCanvas.height = 128;
  const cfCtx = cfCanvas.getContext('2d');
  cfCtx.fillStyle = '#141518';
  cfCtx.fillRect(0, 0, 128, 128);
  // 2x2 Twill weave pattern
  for (let y = 0; y < 128; y += 8) {
    for (let x = 0; x < 128; x += 8) {
      const isAlt = ((x / 8) + (y / 8)) % 2 === 0;
      cfCtx.fillStyle = isAlt ? '#1e2126' : '#111215';
      cfCtx.fillRect(x, y, 8, 8);
      // Weave fiber highlights
      cfCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      cfCtx.fillRect(x + 1, y + 1, 6, 2);
    }
  }
  const cfTex = new THREE.CanvasTexture(cfCanvas);
  cfTex.wrapS = THREE.RepeatWrapping;
  cfTex.wrapT = THREE.RepeatWrapping;
  cfTex.repeat.set(4, 1);

  const carbonFiberMat = applyWeathering(new THREE.MeshPhysicalMaterial({
    map: cfTex,
    color: 0x181a1f,
    roughness: 0.38,
    metalness: 0.25,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25
  }), { planet: 'mars' });

  // Frayed fracture surface material (broken carbon core)
  const fractureMat = applyWeathering(new THREE.MeshStandardMaterial({
    color: 0x22242a,
    roughness: 0.95,
    metalness: 0.1
  }), { planet: 'mars' });

  // 2. Solar Panel Material (monocrystalline with Martian dust film)
  const solarCanvas = document.createElement('canvas');
  solarCanvas.width = 256;
  solarCanvas.height = 256;
  const sCtx = solarCanvas.getContext('2d');
  sCtx.fillStyle = '#08101e';
  sCtx.fillRect(0, 0, 256, 256);
  sCtx.strokeStyle = '#9ca8b8';
  sCtx.lineWidth = 1.2;
  for (let x = 0; x <= 256; x += 32) {
    sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, 256); sCtx.stroke();
  }
  for (let y = 0; y <= 256; y += 32) {
    sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(256, y); sCtx.stroke();
  }
  // Martian dust layer on horizontal panel
  sCtx.fillStyle = 'rgba(185, 87, 40, 0.45)';
  sCtx.fillRect(0, 0, 256, 256);
  const solarTex = new THREE.CanvasTexture(solarCanvas);

  const solarMat = applyWeathering(new THREE.MeshPhysicalMaterial({
    map: solarTex,
    color: 0xffffff,
    metalness: 0.85,
    roughness: 0.35,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15
  }), { planet: 'mars' });

  const heliGroup = new THREE.Group();
  root.add(heliGroup);

  // Height constants (real-world scale: Ingenuity total height ~0.49m)
  const fuselageCenterY = 0.18;
  const lowerRotorY = 0.34;
  const upperRotorY = 0.44;
  const solarPanelY = 0.52;

  // =========================================================================
  // 1. CUBIC AVIONICS FUSELAGE (Warm Electronics Box)
  // =========================================================================
  const fuselageGroup = new THREE.Group();
  fuselageGroup.position.set(0, fuselageCenterY, 0);
  heliGroup.add(fuselageGroup);

  // Core electronic enclosure (0.14m x 0.14m x 0.14m)
  const bodyGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.goldKapton);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  fuselageGroup.add(bodyMesh);

  // Kapton taped seams and corner brackets
  const bracketGeo = new THREE.BoxGeometry(0.145, 0.015, 0.145);
  const bracketTop = new THREE.Mesh(bracketGeo, mats.aluminum);
  bracketTop.position.y = 0.065;
  fuselageGroup.add(bracketTop);
  const bracketBtm = new THREE.Mesh(bracketGeo, mats.aluminum);
  bracketBtm.position.y = -0.065;
  fuselageGroup.add(bracketBtm);

  // Downward-facing Navcam optics & LIDAR altimeter aperture
  const navcamGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const navcamMat = new THREE.MeshPhysicalMaterial({
    color: 0x050c18,
    metalness: 0.9,
    roughness: 0.05,
    clearcoat: 1.0
  });
  const navcam = new THREE.Mesh(navcamGeo, navcamMat);
  navcam.position.set(0.03, -0.075, 0.02);
  fuselageGroup.add(navcam);

  const lidarGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12);
  const lidar = new THREE.Mesh(lidarGeo, mats.blackInconel);
  lidar.position.set(-0.03, -0.075, -0.02);
  fuselageGroup.add(lidar);

  // =========================================================================
  // 2. CENTRAL ROTOR MAST & DRIVE MOTORS
  // =========================================================================
  const mastGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.38, 16);
  const mastMesh = new THREE.Mesh(mastGeo, mats.aluminum);
  mastMesh.position.y = 0.34;
  mastMesh.castShadow = true;
  heliGroup.add(mastMesh);

  // Drive motor housings and swashplate mechanisms
  [lowerRotorY, upperRotorY].forEach((ry) => {
    const hubGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.035, 16);
    const hub = new THREE.Mesh(hubGeo, mats.blackInconel);
    hub.position.y = ry;
    hub.castShadow = true;
    heliGroup.add(hub);

    // Swashplate disc and pitch pushrods
    const swashGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.01, 16);
    const swash = new THREE.Mesh(swashGeo, mats.aluminum);
    swash.position.y = ry - 0.025;
    heliGroup.add(swash);

    for (let r = 0; r < 2; r++) {
      const rodGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.03, 8);
      const rod = new THREE.Mesh(rodGeo, mats.springSteel);
      const ang = (r * Math.PI) + 0.4;
      rod.position.set(Math.cos(ang) * 0.028, ry - 0.012, Math.sin(ang) * 0.028);
      heliGroup.add(rod);
    }
  });

  // =========================================================================
  // 3. CARBON-FIBER ROTOR BLADES & FLIGHT 72 HISTORICAL DAMAGE
  // =========================================================================
  // Helper to build a tapered airfoil rotor blade
  function createRotorBlade(length, hasDamage = false) {
    const bladeGroup = new THREE.Group();

    // Root connector cuff (machined aluminum)
    const cuffGeo = new THREE.BoxGeometry(0.05, 0.016, 0.024);
    const cuff = new THREE.Mesh(cuffGeo, mats.aluminum);
    cuff.position.x = 0.04;
    bladeGroup.add(cuff);

    if (!hasDamage) {
      // Intact carbon fiber blade with tapered aerodynamic shape
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0, -0.012);
      bladeShape.lineTo(length, -0.006); // Taper at tip
      bladeShape.lineTo(length, 0.006);
      bladeShape.lineTo(0, 0.020);
      bladeShape.closePath();

      const extrudeSettings = {
        depth: 0.005,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.002,
        bevelThickness: 0.002
      };
      const bGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      bGeo.rotateX(-Math.PI / 2);
      bGeo.rotateZ(0.08); // Aerodynamic pitch angle
      const bMesh = new THREE.Mesh(bGeo, carbonFiberMat);
      bMesh.position.x = 0.06;
      bMesh.castShadow = true;
      bladeGroup.add(bMesh);
    } else {
      // FLIGHT 72 DAMAGE: Outer 25% of the blade is severed!
      const brokenLength = length * 0.72;

      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0, -0.012);
      bladeShape.lineTo(brokenLength, -0.008);
      bladeShape.lineTo(brokenLength, 0.012);
      bladeShape.lineTo(0, 0.020);
      bladeShape.closePath();

      const extrudeSettings = {
        depth: 0.005,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.002,
        bevelThickness: 0.002
      };
      const bGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      bGeo.rotateX(-Math.PI / 2);
      bGeo.rotateZ(0.08);
      const bMesh = new THREE.Mesh(bGeo, carbonFiberMat);
      bMesh.position.x = 0.06;
      bMesh.castShadow = true;
      bladeGroup.add(bMesh);

      // Jagged jagged fracture edge with exposed delaminated carbon fibers
      const fractureGeo = new THREE.BoxGeometry(0.012, 0.008, 0.024);
      const fractureMesh = new THREE.Mesh(fractureGeo, fractureMat);
      fractureMesh.position.set(0.06 + brokenLength, 0, 0.002);
      fractureMesh.rotation.y = 0.25;
      bladeGroup.add(fractureMesh);
    }

    return bladeGroup;
  }

  const fullBladeSpan = 0.54; // Half of 1.2m diameter minus hub

  // Lower Rotor (Blades at angle 25° and 205°)
  const lowerRotorGroup = new THREE.Group();
  lowerRotorGroup.position.y = lowerRotorY;
  lowerRotorGroup.rotation.y = 0.45;

  const lowerBlade1 = createRotorBlade(fullBladeSpan, false);
  lowerRotorGroup.add(lowerBlade1);

  const lowerBlade2 = createRotorBlade(fullBladeSpan, false);
  lowerBlade2.rotation.y = Math.PI;
  lowerRotorGroup.add(lowerBlade2);

  heliGroup.add(lowerRotorGroup);

  // Upper Rotor (Blades at angle 115° and 295° - Counter-rotating offset)
  const upperRotorGroup = new THREE.Group();
  upperRotorGroup.position.y = upperRotorY;
  upperRotorGroup.rotation.y = 2.05;

  // Upper Blade 1: THE HISTORICAL DAMAGED BLADE (Flight 72)
  const upperBlade1 = createRotorBlade(fullBladeSpan, true);
  upperRotorGroup.add(upperBlade1);

  // Upper Blade 2: Intact blade
  const upperBlade2 = createRotorBlade(fullBladeSpan, false);
  upperBlade2.rotation.y = Math.PI;
  upperRotorGroup.add(upperBlade2);

  heliGroup.add(upperRotorGroup);

  // Broken blade fragment resting in the sand nearby (historical detail documented by Perseverance)
  const fragmentShape = new THREE.Shape();
  fragmentShape.moveTo(0, -0.008);
  fragmentShape.lineTo(0.14, -0.004);
  fragmentShape.lineTo(0.14, 0.004);
  fragmentShape.lineTo(0, 0.010);
  fragmentShape.closePath();
  const fragGeo = new THREE.ExtrudeGeometry(fragmentShape, {
    depth: 0.004,
    bevelEnabled: false
  });
  fragGeo.rotateX(-Math.PI / 2);
  const fragMesh = new THREE.Mesh(fragGeo, carbonFiberMat);
  fragMesh.position.set(0.72, 0.006, 0.38);
  fragMesh.rotation.set(0.06, 1.2, -0.04);
  fragMesh.castShadow = true;
  root.add(fragMesh);

  // =========================================================================
  // 4. TOP SOLAR ARRAY & TELECOM MONOPOLE ANTENNA
  // =========================================================================
  const solarGroup = new THREE.Group();
  solarGroup.position.y = solarPanelY;
  heliGroup.add(solarGroup);

  // Rectangular solar array substrate (0.24m x 0.16m)
  const panelGeo = new THREE.BoxGeometry(0.24, 0.008, 0.16);
  const panel = new THREE.Mesh(panelGeo, solarMat);
  panel.castShadow = true;
  panel.receiveShadow = true;
  solarGroup.add(panel);

  // Panel support truss (machined composite crossbar)
  const trussGeo = new THREE.BoxGeometry(0.22, 0.012, 0.012);
  const truss = new THREE.Mesh(trussGeo, mats.aluminum);
  truss.position.y = -0.01;
  solarGroup.add(truss);

  // 900 MHz Monopole antenna mast extending vertically into Martian sky
  const antGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.28, 8);
  const ant = new THREE.Mesh(antGeo, mats.blackInconel);
  ant.position.set(0.04, 0.14, 0);
  ant.castShadow = true;
  solarGroup.add(ant);

  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), mats.aluminum);
  antTip.position.set(0.04, 0.28, 0);
  solarGroup.add(antTip);

  // =========================================================================
  // 5. FOUR CARBON-COMPOSITE LANDING LEGS & FOOTPADS
  // =========================================================================
  const legGroup = new THREE.Group();
  heliGroup.add(legGroup);

  const bermTex = createFootpadBermTexture();
  const bermGeo = new THREE.PlaneGeometry(0.35, 0.35);
  bermGeo.rotateX(-Math.PI / 2);
  const bermMat = new THREE.MeshBasicMaterial({
    map: bermTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  // Leg angles in horizontal plane (45°, 135°, 225°, 315°)
  const legAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  const legSpread = 0.28; // Radius on ground where footpad touches

  legAngles.forEach((ang) => {
    // Upper hinge mount at bottom of fuselage
    const hingeGeo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const hinge = new THREE.Mesh(hingeGeo, mats.aluminum);
    const hx = Math.sin(ang) * 0.07;
    const hz = Math.cos(ang) * 0.07;
    hinge.position.set(hx, fuselageCenterY - 0.06, hz);
    legGroup.add(hinge);

    // Carbon fiber tubular strut angled down to ground
    const footX = Math.sin(ang) * legSpread;
    const footZ = Math.cos(ang) * legSpread;
    const footY = 0.015; // Rests firmly on sand

    const dx = footX - hx;
    const dy = footY - (fuselageCenterY - 0.06);
    const dz = footZ - hz;
    const legLen = Math.hypot(dx, dy, dz);

    const legTubeGeo = new THREE.CylinderGeometry(0.006, 0.006, legLen, 8);
    const legTube = new THREE.Mesh(legTubeGeo, carbonFiberMat);
    legTube.position.set((hx + footX) / 2, (fuselageCenterY - 0.06 + footY) / 2, (hz + footZ) / 2);
    legTube.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz).normalize()
    );
    legTube.castShadow = true;
    legGroup.add(legTube);

    // Curved aluminum footpad disk (0.05m diameter)
    const padGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.008, 12);
    const pad = new THREE.Mesh(padGeo, mats.aluminum);
    pad.position.set(footX, footY, footZ);
    pad.castShadow = true;
    pad.receiveShadow = true;
    legGroup.add(pad);

    // Soil berm piled around footpad from touchdown
    const bermMesh = new THREE.Mesh(bermGeo, bermMat);
    bermMesh.position.set(footX, 0.012, footZ);
    root.add(bermMesh);
  });

  // =========================================================================
  // 6. TELEMETRY BEACON INDICATOR
  // =========================================================================
  const beaconGroup = new THREE.Group();
  const ledGeo = new THREE.SphereGeometry(0.025, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffa544 });
  beaconGroup.add(new THREE.Mesh(ledGeo, ledMat));
  // Delicate low intensity LED, no blinding bloom
  beaconGroup.add(new THREE.PointLight(0xffa544, 0.45, 5, 2.0));
  beaconGroup.position.set(0.04, solarPanelY + 0.30, 0);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
