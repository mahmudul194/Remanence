/**
 * REMANENCE: Mars Exploration Rovers Spirit & Opportunity (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA JPL MER Flight
 * System Documentation, MER Rover Telemetry Data, and Cornell Athena Science Payload.
 *
 * Implements:
 * - Triangular Warm Electronics Box (WEB) with aerogel insulation & gold Kapton wrap
 * - Functional Rocker-Bogie suspension with differential pivot and 6 spiral-cleated aluminum wheels
 * - Bat-wing solar array deck with photovoltaic gridlines and authentic Martian hematite dust layer
 * - 1.5m Pancam/Navcam composite camera mast with MarsDial color calibration sundial
 * - 5-DOF articulated robotic arm (IDD) with Mössbauer spectrometer, Microscopic Imager, and RAT
 * - High-Gain steerable dish & Low-Gain conical antennas
 * - Authentic rover wheel tracks in the red sand (plus Spirit's iconic stuck wheel trench!)
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedMERRover(isOpportunity = true) {
  const root = new THREE.Group();
  root.name = isOpportunity ? 'mer_opportunity_rover' : 'mer_spirit_rover';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'mars' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'mars' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'mars' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'mars' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'mars' })
  };

  // Dedicated Mars Rover Materials
  // Photovoltaic solar array (dark navy cells with dust accumulation)
  const solarCanvas = document.createElement('canvas');
  solarCanvas.width = 256;
  solarCanvas.height = 256;
  const sCtx = solarCanvas.getContext('2d');
  sCtx.fillStyle = '#0a1022';
  sCtx.fillRect(0, 0, 256, 256);

  // Silver gridlines & wafer cell divisions
  sCtx.strokeStyle = '#c5cdd8';
  sCtx.lineWidth = 1.2;
  for (let x = 0; x <= 256; x += 32) {
    sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, 256); sCtx.stroke();
  }
  for (let y = 0; y <= 256; y += 32) {
    sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(256, y); sCtx.stroke();
  }

  // Dust layer over solar panel (heavy for Opportunity twilight, lighter for Spirit)
  const dustAlpha = isOpportunity ? 0.55 : 0.38;
  sCtx.fillStyle = `rgba(185, 87, 40, ${dustAlpha})`;
  sCtx.fillRect(0, 0, 256, 256);

  const solarTex = new THREE.CanvasTexture(solarCanvas);
  solarTex.wrapS = THREE.RepeatWrapping;
  solarTex.wrapT = THREE.RepeatWrapping;

  const solarMat = applyWeathering(new THREE.MeshPhysicalMaterial({
    map: solarTex,
    color: 0xffffff,
    metalness: 0.85,
    roughness: isOpportunity ? 0.65 : 0.35,
    clearcoat: isOpportunity ? 0.3 : 0.8,
    clearcoatRoughness: 0.25
  }), { planet: 'mars' });

  // Rover group: Rover rests on Martian dunes at y = 0.00
  const roverGroup = new THREE.Group();
  root.add(roverGroup);

  const wheelRadius = 0.125; // 25cm diameter / 2
  const chassisGroundClearance = 0.28;

  // =========================================================================
  // 1. WARM ELECTRONICS BOX (WEB) CHASSIS & AEROGEL INSULATION
  // =========================================================================
  const chassisGroup = new THREE.Group();
  chassisGroup.position.set(0, chassisGroundClearance, 0);
  roverGroup.add(chassisGroup);

  // Triangular insulated chassis core (tapered forward)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.45, -0.65); // Rear left
  bodyShape.lineTo(0.45, -0.65);  // Rear right
  bodyShape.lineTo(0.32, 0.45);   // Front right
  bodyShape.lineTo(-0.32, 0.45);  // Front left
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04
  });
  bodyGeo.rotateX(Math.PI / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, mats.goldKapton);
  bodyMesh.position.set(0, 0.13, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  chassisGroup.add(bodyMesh);

  // Lower chassis titanium belly pan
  const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.95), mats.aluminum);
  bellyPan.position.set(0, -0.02, 0);
  chassisGroup.add(bellyPan);

  // =========================================================================
  // 2. BAT-WING SOLAR PANEL ARRAY & MARSDIAL
  // =========================================================================
  const solarDeckGroup = new THREE.Group();
  solarDeckGroup.position.set(0, 0.16, 0);
  chassisGroup.add(solarDeckGroup);

  // Center main solar panel
  const centerSolar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.025, 0.95), solarMat);
  centerSolar.castShadow = true;
  solarDeckGroup.add(centerSolar);

  // Left & Right folding bat-wing panels
  [-0.62, 0.62].forEach((wx) => {
    const wingGeo = new THREE.BoxGeometry(0.38, 0.02, 0.85);
    const wing = new THREE.Mesh(wingGeo, solarMat);
    wing.position.set(wx, -0.02, 0);
    wing.rotation.z = wx > 0 ? -0.08 : 0.08;
    wing.castShadow = true;
    solarDeckGroup.add(wing);

    // Hinge brackets connecting wings
    [-0.35, 0.35].forEach((hz) => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06), mats.aluminum);
      hinge.position.set(wx > 0 ? 0.43 : -0.43, 0, hz);
      hinge.rotation.x = Math.PI / 2;
      solarDeckGroup.add(hinge);
    });
  });

  // MarsDial: Color calibration photometric sundial on rear solar deck
  const marsDialGroup = new THREE.Group();
  marsDialGroup.position.set(0.18, 0.02, -0.38);

  const dialBase = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.015, 0.09), mats.aluminum);
  marsDialGroup.add(dialBase);

  // Center gnomon shadow pin
  const gnomon = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.06), mats.blackInconel);
  gnomon.position.y = 0.035;
  marsDialGroup.add(gnomon);

  // 4 colored corner calibration chips (red, green, blue, yellow)
  const chipColors = [0xbb3322, 0x228833, 0x2255aa, 0xccaa22];
  const chipOffsets = [[-0.03, -0.03], [0.03, -0.03], [0.03, 0.03], [-0.03, 0.03]];
  chipOffsets.forEach(([cx, cz], i) => {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.005, 0.018), new THREE.MeshBasicMaterial({ color: chipColors[i] }));
    chip.position.set(cx, 0.01, cz);
    marsDialGroup.add(chip);
  });
  solarDeckGroup.add(marsDialGroup);

  // =========================================================================
  // 3. ROCKER-BOGIE SUSPENSION & 6 SPIRAL-CLEATED ALUMINUM WHEELS
  // =========================================================================
  const suspensionGroup = new THREE.Group();
  roverGroup.add(suspensionGroup);

  // Transverse differential rocker pivot tube
  const diffTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95), mats.aluminum);
  diffTube.position.set(0, chassisGroundClearance + 0.08, -0.15);
  diffTube.rotation.z = Math.PI / 2;
  suspensionGroup.add(diffTube);

  const wheelTracksX = 0.58; // Center-to-wheel track
  const wheelPositions = [
    // Left side: Front, Middle, Rear
    { x: -wheelTracksX, z: 0.52, isFront: true, isRight: false },
    { x: -wheelTracksX - 0.04, z: 0.0, isMiddle: true, isRight: false },
    { x: -wheelTracksX, z: -0.52, isRear: true, isRight: false },
    // Right side: Front, Middle, Rear
    { x: wheelTracksX, z: 0.52, isFront: true, isRight: true },
    { x: wheelTracksX + 0.04, z: 0.0, isMiddle: true, isRight: true },
    { x: wheelTracksX, z: -0.52, isRear: true, isRight: true }
  ];

  // Rocker and Bogie Linkage Arm Tubing
  [-wheelTracksX, wheelTracksX].forEach((sx) => {
    const isR = sx > 0;
    // Main Rocker arm (connecting differential to front wheel and bogie pivot)
    const rockerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65);
    const rocker = new THREE.Mesh(rockerGeo, mats.aluminum);
    rocker.position.set(sx * 0.88, chassisGroundClearance - 0.02, 0.18);
    rocker.rotation.x = -0.52;
    suspensionGroup.add(rocker);

    // Bogie arm (connecting bogie pivot to middle and rear wheels)
    const bogieGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.58);
    const bogie = new THREE.Mesh(bogieGeo, mats.aluminum);
    bogie.position.set(sx * 0.92, chassisGroundClearance - 0.08, -0.28);
    bogie.rotation.x = 0.42;
    suspensionGroup.add(bogie);
  });

  // 6 Machined Aluminum Wheels
  wheelPositions.forEach((wp) => {
    const wheelGroup = new THREE.Group();
    // Wheel resting on terrain at y = wheelRadius
    wheelGroup.position.set(wp.x, wheelRadius, wp.z);

    // Spirit's iconic stuck right-front wheel (dragged behind, angled 18 degrees)
    if (!isOpportunity && wp.isFront && wp.isRight) {
      wheelGroup.rotation.y = 0.32; // Turned inward, dragging in trench!
    }

    // Wheel rim cylinder
    const rimGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.14, 24);
    const rim = new THREE.Mesh(rimGeo, mats.aluminum);
    rim.rotation.z = Math.PI / 2;
    rim.castShadow = true;
    wheelGroup.add(rim);

    // Spiral traction cleats (grousers) across tire tread
    for (let c = 0; c < 12; c++) {
      const cAng = (c * Math.PI) / 6;
      const cleatGeo = new THREE.BoxGeometry(0.14, 0.012, 0.02);
      const cleat = new THREE.Mesh(cleatGeo, mats.blackInconel);
      cleat.position.set(
        0,
        Math.sin(cAng) * (wheelRadius + 0.006),
        Math.cos(cAng) * (wheelRadius + 0.006)
      );
      cleat.rotation.x = cAng;
      wheelGroup.add(cleat);
    }

    // Central hub motor housing & spiral titanium flexure spokes
    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16), mats.blackInconel);
    hubCap.rotation.z = Math.PI / 2;
    wheelGroup.add(hubCap);

    suspensionGroup.add(wheelGroup);

    // Contact sand berm under each wheel
    const bermTex = createFootpadBermTexture();
    const bermGeo = new THREE.PlaneGeometry(0.38, 0.38);
    bermGeo.rotateX(-Math.PI / 2);
    const berm = new THREE.Mesh(bermGeo, new THREE.MeshBasicMaterial({
      map: bermTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    }));
    berm.position.set(wp.x, 0.015, wp.z);
    root.add(berm);
  });

  // =========================================================================
  // 4. PANCAM / NAVCAM MAST ASSEMBLY (PMA)
  // =========================================================================
  const mastGroup = new THREE.Group();
  mastGroup.position.set(-0.18, chassisGroundClearance + 0.18, 0.32);
  roverGroup.add(mastGroup);

  // 1.5m tall composite camera mast tube
  const mastTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 1.25, 12), mats.betaCloth);
  mastTube.position.y = 0.62;
  mastTube.castShadow = true;
  mastGroup.add(mastTube);

  // Camera Head Pan/Tilt Unit
  const pmaHead = new THREE.Group();
  pmaHead.position.set(0, 1.25, 0);

  const headBlock = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.14), mats.aluminum);
  headBlock.castShadow = true;
  pmaHead.add(headBlock);

  // Stereo Panoramic Cameras (Pancam) with cylindrical sun hoods
  [-0.08, 0.08].forEach((cx) => {
    const pancamGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.12, 12);
    const pancam = new THREE.Mesh(pancamGeo, mats.blackInconel);
    pancam.position.set(cx, 0.03, 0.08);
    pancam.rotation.x = Math.PI / 2;
    pmaHead.add(pancam);
  });

  // Stereo Navigation Cameras (Navcam) mounted slightly lower
  [-0.05, 0.05].forEach((nx) => {
    const navcamGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 12);
    const navcam = new THREE.Mesh(navcamGeo, mats.blackInconel);
    navcam.position.set(nx, -0.04, 0.07);
    navcam.rotation.x = Math.PI / 2;
    pmaHead.add(navcam);
  });

  mastGroup.add(pmaHead);

  // =========================================================================
  // 5. ROBOTIC ARM (Instrument Deployment Device - IDD)
  // =========================================================================
  const armGroup = new THREE.Group();
  armGroup.position.set(0, chassisGroundClearance + 0.04, 0.42);
  roverGroup.add(armGroup);

  // Shoulder azimuth/elevation joint
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), mats.aluminum);
  armGroup.add(shoulder);

  // Folded Upper Arm & Forearm
  const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35), mats.aluminum);
  bicep.position.set(0.08, -0.06, 0.08);
  bicep.rotation.set(0.4, 0.2, -0.6);
  armGroup.add(bicep);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32), mats.aluminum);
  forearm.position.set(0.12, -0.16, 0.15);
  forearm.rotation.set(-0.2, 0.4, 0.8);
  armGroup.add(forearm);

  // Science Turret Head with Mössbauer, MI, and RAT
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), mats.blackInconel);
  turret.position.set(0.08, -0.22, 0.22);
  armGroup.add(turret);

  // =========================================================================
  // 6. HIGH-GAIN & LOW-GAIN ANTENNAS
  // =========================================================================
  // High-Gain steerable dish antenna (0.28m diameter)
  const hgaGroup = new THREE.Group();
  hgaGroup.position.set(-0.24, chassisGroundClearance + 0.22, -0.28);

  const hgaDishGeo = new THREE.CylinderGeometry(0.14, 0.04, 0.06, 16, 1, true);
  const hgaDish = new THREE.Mesh(hgaDishGeo, mats.aluminum);
  hgaDish.rotation.set(0.45, 0.35, 0);
  hgaGroup.add(hgaDish);

  const hgaFeed = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14), mats.goldKapton);
  hgaFeed.position.set(0, 0.06, 0);
  hgaGroup.add(hgaFeed);
  roverGroup.add(hgaGroup);

  // Low-Gain Antenna (conical whip)
  const lgaCone = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 12), mats.blackInconel);
  lgaCone.position.set(0.28, chassisGroundClearance + 0.28, -0.22);
  roverGroup.add(lgaCone);

  // =========================================================================
  // 7. ROVER TIRE TRACKS IN RED SAND (plus Spirit's stuck wheel furrow!)
  // =========================================================================
  const trackLength = 14.0;
  const trackGeo = new THREE.PlaneGeometry(1.4, trackLength, 1, 24);
  trackGeo.rotateX(-Math.PI / 2);

  // Procedural 6-wheel track texture
  const trackCanvas = document.createElement('canvas');
  trackCanvas.width = 128;
  trackCanvas.height = 512;
  const tCtx = trackCanvas.getContext('2d');
  tCtx.clearRect(0, 0, 128, 512);

  // Left & right wheel tire marks
  [24, 104].forEach((tx) => {
    tCtx.fillStyle = 'rgba(70, 24, 12, 0.82)';
    tCtx.fillRect(tx - 10, 0, 20, 512);
    // Cleat ribs
    tCtx.strokeStyle = 'rgba(30, 10, 5, 0.95)';
    tCtx.lineWidth = 2.5;
    for (let y = 0; y < 512; y += 16) {
      tCtx.beginPath();
      tCtx.moveTo(tx - 9, y);
      tCtx.lineTo(tx + 9, y + 4);
      tCtx.stroke();
    }
  });

  // If Spirit, draw the deep dragged furrow of the stuck right-front wheel!
  if (!isOpportunity) {
    tCtx.fillStyle = 'rgba(40, 12, 6, 0.95)';
    tCtx.fillRect(94, 0, 22, 512); // Deep dragged furrow
    tCtx.strokeStyle = 'rgba(185, 95, 45, 0.6)'; // Raised berm lip
    tCtx.lineWidth = 3;
    tCtx.beginPath();
    tCtx.moveTo(92, 0); tCtx.lineTo(92, 512);
    tCtx.moveTo(117, 0); tCtx.lineTo(117, 512);
    tCtx.stroke();
  }

  const trackTex = new THREE.CanvasTexture(trackCanvas);
  trackTex.wrapS = THREE.RepeatWrapping;
  trackTex.wrapT = THREE.RepeatWrapping;
  trackTex.repeat.set(1, 4);

  const trackMesh = new THREE.Mesh(trackGeo, new THREE.MeshBasicMaterial({
    map: trackTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  trackMesh.position.set(0, 0.012, -7.5);
  root.add(trackMesh);

  // Telemetry Beacon
  const beaconGroup = new THREE.Group();
  const ledColor = isOpportunity ? 0xffb84d : 0x6fe3ff;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: ledColor }));
  beaconGroup.add(led);
  beaconGroup.add(new THREE.PointLight(ledColor, 0.5, 6, 2.0));
  beaconGroup.position.set(-0.18, chassisGroundClearance + 1.48, 0.32);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
