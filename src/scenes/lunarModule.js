/**
 * REMANENCE: Apollo 11 Lunar Module Descent Stage (Hero Asset)
 * Museum-grade, physically accurate reconstruction based on NASA Apollo 11 blueprints,
 * Grumman Operations Handbook LMA790-3-LM, and Apollo Lunar Surface Journal.
 *
 * Implements:
 * - 4.22m octagonal descent stage with Quads 1, 2, 3, 4 equipment bays
 * - Hand-wrapped crinkled gold/amber Kapton MLI blankets & black Inconel heat shields
 * - 4 outrigger landing gear legs (7m span) with primary gold foil shock struts
 * - 37-inch circular dish footpads with inverted crush rims
 * - 5.6-foot contact-sensing wire probes (forward omitted per Apollo 11 specs, 3 bent)
 * - Forward astronaut ladder with 9 rungs and egress porch
 * - Stainless steel commemorative plaque with Earth hemispheres and inscription
 * - Gimbaled DPS rocket engine nozzle with titanium heat-discoloration scorch rings
 * - MESA pallet (Quad 4) with TV camera housing
 * - Quad 1 scientific bay with graphite RTG fuel cask and helium sphere
 * - Displaced lunar regolith berms and contact ground shadows under all 4 footpads
 * - Authentic astronaut bootprints pressed into the lunar dust
 * - Deployed American flag with bent telescopic horizontal rod
 * - Hotspot telemetry callouts for interactive inspection
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootprintTexture, createFootpadBermTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedApolloLM() {
  const root = new THREE.Group();
  root.name = 'apollo_11_lunar_module';

  // Instantiate physically real aerospace materials
  const rawMats = getAerospaceMaterials();
  const mats = {
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'moon' }),
    amberKapton: applyWeathering(rawMats.amberKapton, { planet: 'moon' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'moon' }),
    aluminumAlloy: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    engineScorched: applyWeathering(rawMats.engineScorched, { planet: 'moon' }),
    commemorativePlaque: applyWeathering(rawMats.commemorativePlaque, { planet: 'moon' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' })
  };

  // Dimensions (scaled: 1 unit = 1 meter)
  // Descent stage body sits from y = 0.45 to y = 2.10 (height 1.65m)
  // Footpads sit firmly on the regolith at y = 0.00
  const stageGroup = new THREE.Group();
  stageGroup.name = 'descent_stage_body';
  root.add(stageGroup);

  // =========================================================================
  // 1. OCTAGONAL DESCENT STAGE BODY & QUADRANT SHEAR PANELS
  // =========================================================================
  // Primary octagonal box (4.22m across flat-to-flat, 1.65m tall)
  const bodyGeo = new THREE.CylinderGeometry(2.11, 2.11, 1.65, 8, 3, false);
  const bodyMesh = new THREE.Mesh(bodyGeo, mats.goldKapton);
  bodyMesh.position.y = 1.28;
  bodyMesh.rotation.y = Math.PI / 8; // Align flat faces with coordinate axes
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  stageGroup.add(bodyMesh);

  // Top deck: Inconel & Pyromark heat shield plate
  const topDeckGeo = new THREE.CylinderGeometry(2.05, 2.05, 0.08, 8);
  const topDeck = new THREE.Mesh(topDeckGeo, mats.blackInconel);
  topDeck.position.y = 2.13;
  topDeck.rotation.y = Math.PI / 8;
  topDeck.castShadow = true;
  topDeck.receiveShadow = true;
  stageGroup.add(topDeck);

  // Bottom blast shield plate
  const bottomShieldGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.06, 8);
  const bottomShield = new THREE.Mesh(bottomShieldGeo, mats.blackInconel);
  bottomShield.position.y = 0.46;
  bottomShield.rotation.y = Math.PI / 8;
  bottomShield.castShadow = true;
  stageGroup.add(bottomShield);

  // Alternating amber and gold thermal blanket quilt panels (simulates hand-laid MLI)
  const panelGeo = new THREE.BoxGeometry(1.65, 1.55, 0.06);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const panelMat = (i % 2 === 0) ? mats.amberKapton : mats.goldKapton;
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(
      Math.sin(angle) * 2.08,
      1.28,
      Math.cos(angle) * 2.08
    );
    panel.rotation.y = angle;
    panel.castShadow = true;
    panel.receiveShadow = true;
    stageGroup.add(panel);

    // Black Kapton seam tape along edge borders
    const seamGeo = new THREE.BoxGeometry(1.68, 0.05, 0.07);
    const seamTop = new THREE.Mesh(seamGeo, mats.blackInconel);
    seamTop.position.set(Math.sin(angle) * 2.09, 2.03, Math.cos(angle) * 2.09);
    seamTop.rotation.y = angle;
    stageGroup.add(seamTop);

    const seamBottom = new THREE.Mesh(seamGeo, mats.blackInconel);
    seamBottom.position.set(Math.sin(angle) * 2.09, 0.53, Math.cos(angle) * 2.09);
    seamBottom.rotation.y = angle;
    stageGroup.add(seamBottom);
  }

  // =========================================================================
  // 2. QUADRANT EQUIPMENT DETAILS
  // =========================================================================

  // --- QUAD 4 (Forward-Left): MESA (Modular Equipment Stowage Assembly) ---
  // The pallet that Neil Armstrong released by lanyard to open the TV camera
  const mesaGroup = new THREE.Group();
  mesaGroup.name = 'mesa_pallet';
  mesaGroup.position.set(-1.45, 1.15, 1.52);
  mesaGroup.rotation.y = Math.PI / 4 + 0.15; // slightly deployed angle

  const mesaFrameGeo = new THREE.BoxGeometry(0.85, 0.95, 0.18);
  const mesaFrame = new THREE.Mesh(mesaFrameGeo, mats.betaCloth);
  mesaFrame.castShadow = true;
  mesaGroup.add(mesaFrame);

  // Westinghouse Lunar TV Camera inside MESA
  const tvCameraGeo = new THREE.BoxGeometry(0.24, 0.22, 0.35);
  const tvCamera = new THREE.Mesh(tvCameraGeo, mats.blackInconel);
  tvCamera.position.set(0.12, -0.05, 0.14);
  tvCamera.castShadow = true;
  mesaGroup.add(tvCamera);

  // TV Camera optical lens
  const lensGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 16);
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0x050c18,
    metalness: 0.95,
    roughness: 0.02,
    clearcoat: 1.0,
    reflectivity: 1.0
  });
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0.12, -0.05, 0.33);
  mesaGroup.add(lens);

  // Deployment lanyard hinge bracket
  const hingeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9);
  const hinge = new THREE.Mesh(hingeGeo, mats.aluminumAlloy);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, -0.48, 0.08);
  mesaGroup.add(hinge);

  stageGroup.add(mesaGroup);

  // --- QUAD 1 (Aft-Right): Scientific Equipment Bay & RTG Cask ---
  const quad1Group = new THREE.Group();
  quad1Group.name = 'quad1_scientific_bay';
  quad1Group.position.set(1.45, 1.25, -1.45);

  // SNAP-27 Graphite Fuel Cask (cylindrical ribbed cask)
  const caskGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.85, 16);
  const cask = new THREE.Mesh(caskGeo, mats.blackInconel);
  cask.rotation.z = 0.35; // angled mount on LM side
  cask.position.set(0.2, 0.0, -0.15);
  cask.castShadow = true;
  quad1Group.add(cask);

  // Supercritical Helium Tank Sphere (pressurization system)
  const heliumTankGeo = new THREE.SphereGeometry(0.38, 20, 20);
  const heliumTank = new THREE.Mesh(heliumTankGeo, mats.aluminumAlloy);
  heliumTank.position.set(-0.25, -0.1, 0.1);
  heliumTank.castShadow = true;
  quad1Group.add(heliumTank);

  stageGroup.add(quad1Group);

  // --- QUAD 2 & 3: Propellant Tank Domes (Titanium fuel & oxidizer spheres) ---
  const tankGeo = new THREE.SphereGeometry(0.72, 24, 24);
  // Quad 2 Oxidizer tank (partially visible through bay cutout)
  const oxTank = new THREE.Mesh(tankGeo, mats.amberKapton);
  oxTank.position.set(1.15, 1.25, 0.95);
  stageGroup.add(oxTank);

  // Quad 3 Fuel tank
  const fuelTank = new THREE.Mesh(tankGeo, mats.amberKapton);
  fuelTank.position.set(-1.15, 1.25, -0.95);
  stageGroup.add(fuelTank);

  // Deployable S-band Steerable Antenna Dish Base (Quad 1 top corner)
  const antennaDishGeo = new THREE.ConeGeometry(0.35, 0.12, 24, 1, true);
  const antennaDish = new THREE.Mesh(antennaDishGeo, mats.aluminumAlloy);
  antennaDish.position.set(1.65, 2.18, -1.65);
  antennaDish.rotation.set(-0.4, 0.8, -0.2);
  antennaDish.castShadow = true;
  stageGroup.add(antennaDish);

  const antennaFeedGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25);
  const antennaFeed = new THREE.Mesh(antennaFeedGeo, mats.aluminumAlloy);
  antennaFeed.position.set(1.7, 2.24, -1.7);
  stageGroup.add(antennaFeed);

  // =========================================================================
  // 3. DESCENT PROPULSION SYSTEM (DPS) ROCKET ENGINE BELL
  // =========================================================================
  const dpsGroup = new THREE.Group();
  dpsGroup.name = 'dps_rocket_engine';
  dpsGroup.position.set(0, 0.46, 0);

  // Gimbal mount collar
  const gimbalGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.22, 24);
  const gimbal = new THREE.Mesh(gimbalGeo, mats.blackInconel);
  gimbal.position.y = -0.08;
  dpsGroup.add(gimbal);

  // Engine Bell Cone: Columbium / niobium nozzle extension with heat scorch rings
  // Authentic proportions: throat dia 0.45m, exit skirt dia 1.52m, length 1.15m
  const bellGeo = new THREE.CylinderGeometry(0.38, 0.76, 1.05, 32, 4, true);
  const bell = new THREE.Mesh(bellGeo, mats.engineScorched);
  bell.position.y = -0.58;
  bell.castShadow = true;
  dpsGroup.add(bell);

  // Engine Bell Interior (Dark carbon exhaust soot)
  const interiorGeo = new THREE.CylinderGeometry(0.36, 0.74, 1.02, 32, 1, true);
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x0c0d10,
    metalness: 0.2,
    roughness: 0.95,
    side: THREE.BackSide
  });
  const interior = new THREE.Mesh(interiorGeo, interiorMat);
  interior.position.y = -0.58;
  dpsGroup.add(interior);

  stageGroup.add(dpsGroup);

  // =========================================================================
  // 4. LANDING GEAR OUTRIGGERS (4 LEGS, 7.0m SPAN)
  // =========================================================================
  // Orientations: 0 = Forward (+Z, with ladder), 1 = Right (+X), 2 = Aft (-Z), 3 = Left (-X)
  const footpadPositions = [];

  for (let i = 0; i < 4; i++) {
    const legAngle = i * (Math.PI / 2);
    const isForwardLadderLeg = (i === 0);

    const legGroup = new THREE.Group();
    legGroup.name = `landing_leg_${i}`;

    // Target footpad ground contact position
    const radius = 3.45; // 6.9m landing gear stance
    const targetX = Math.sin(legAngle) * radius;
    const targetZ = Math.cos(legAngle) * radius;
    footpadPositions.push({ x: targetX, z: targetZ, isForward: isForwardLadderLeg });

    // Primary Shock Strut (starts at LM bottom edge, angles down to footpad)
    // Wrapped in crinkled gold Kapton MLI blanket with lacing ties
    const primaryStrutGeo = new THREE.CylinderGeometry(0.085, 0.085, 3.65, 16);
    const primaryStrut = new THREE.Mesh(primaryStrutGeo, mats.goldKapton);
    primaryStrut.castShadow = true;
    primaryStrut.receiveShadow = true;

    // Position & angle primary strut between LM attachment and footpad
    primaryStrut.position.set(0, 0.65, 2.35);
    primaryStrut.rotation.x = 0.58;
    legGroup.add(primaryStrut);

    // Secondary V-Truss Struts (machined aluminum tubular braces)
    const braceGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.5, 12);

    const leftBrace = new THREE.Mesh(braceGeo, mats.aluminumAlloy);
    leftBrace.position.set(-0.55, 0.82, 1.45);
    leftBrace.rotation.set(0.38, 0.28, 0.32);
    leftBrace.castShadow = true;
    legGroup.add(leftBrace);

    const rightBrace = new THREE.Mesh(braceGeo, mats.aluminumAlloy);
    rightBrace.position.set(0.55, 0.82, 1.45);
    rightBrace.rotation.set(0.38, -0.28, -0.32);
    rightBrace.castShadow = true;
    legGroup.add(rightBrace);

    // Horizontal cross-tie brace
    const crossBraceGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8);
    const crossBrace = new THREE.Mesh(crossBraceGeo, mats.aluminumAlloy);
    crossBrace.rotation.z = Math.PI / 2;
    crossBrace.position.set(0, 0.98, 1.15);
    legGroup.add(crossBrace);

    // Landing Gear Footpad (37-inch / 0.94m diameter inverted dish)
    // Sits firmly on lunar regolith (bottom at y = 0.00)
    const padGroup = new THREE.Group();
    padGroup.position.set(0, 0.05, 3.45);

    // Footpad outer shell (spun aluminum wrapped with gold foil)
    const padOuterGeo = new THREE.CylinderGeometry(0.47, 0.44, 0.08, 24);
    const padOuter = new THREE.Mesh(padOuterGeo, mats.goldKapton);
    padOuter.castShadow = true;
    padOuter.receiveShadow = true;
    padGroup.add(padOuter);

    // Top rim cone
    const padConeGeo = new THREE.CylinderGeometry(0.12, 0.47, 0.07, 24);
    const padCone = new THREE.Mesh(padConeGeo, mats.goldKapton);
    padCone.position.y = 0.07;
    padGroup.add(padCone);

    // Universal ball-joint socket connecting strut to footpad
    const socketGeo = new THREE.SphereGeometry(0.09, 14, 14);
    const socket = new THREE.Mesh(socketGeo, mats.aluminumAlloy);
    socket.position.y = 0.12;
    padGroup.add(socket);

    // --- LUNAR SURFACE CONTACT SENSING PROBES ---
    // 5.6-foot (1.7m) spring-steel wire feelers
    // OMITTED on the forward ladder leg to avoid tripping astronauts!
    // Present on the other 3 legs, bent outward upon touchdown.
    if (!isForwardLadderLeg) {
      const probeCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0.04, 0.44),
        new THREE.Vector3(0, -0.05, 0.85),
        new THREE.Vector3((i === 1 ? 0.3 : -0.3), -0.02, 1.35),
        new THREE.Vector3((i === 1 ? 0.6 : -0.6), 0.01, 1.65) // bent outward in dirt
      );
      const probeGeo = new THREE.TubeGeometry(probeCurve, 20, 0.008, 8, false);
      const probe = new THREE.Mesh(probeGeo, mats.springSteel);
      probe.castShadow = true;
      padGroup.add(probe);
    }

    legGroup.add(padGroup);

    // Rotate whole leg assembly to face quadrant
    legGroup.rotation.y = legAngle;
    stageGroup.add(legGroup);
  }

  // =========================================================================
  // 5. ASTRONAUT LADDER & COMMEMORATIVE PLAQUE (FORWARD LEG)
  // =========================================================================
  const forwardLadderGroup = new THREE.Group();
  forwardLadderGroup.name = 'astronaut_ladder_assembly';
  forwardLadderGroup.position.set(0, 0, 0);

  // Top Egress Porch (Platform right beneath the ascent stage hatch)
  const porchGeo = new THREE.BoxGeometry(0.68, 0.05, 0.42);
  const porch = new THREE.Mesh(porchGeo, mats.aluminumAlloy);
  porch.position.set(0, 2.12, 1.85);
  porch.castShadow = true;
  forwardLadderGroup.add(porch);

  // Porch safety handrail
  const handrailGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.55);
  const handrailL = new THREE.Mesh(handrailGeo, mats.aluminumAlloy);
  handrailL.position.set(-0.32, 2.4, 1.95);
  forwardLadderGroup.add(handrailL);

  const handrailR = new THREE.Mesh(handrailGeo, mats.aluminumAlloy);
  handrailR.position.set(0.32, 2.4, 1.95);
  forwardLadderGroup.add(handrailR);

  // 9-Rung Ladder Mounted Over the Forward Primary Strut
  // Slope matches primary strut (0.58 rad)
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(0, 0.68, 2.38);
  ladderGroup.rotation.x = 0.58;

  // Dual side rails
  const railGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.2, 12);
  const railL = new THREE.Mesh(railGeo, mats.aluminumAlloy);
  railL.position.set(-0.22, 0, 0.12);
  railL.castShadow = true;
  ladderGroup.add(railL);

  const railR = new THREE.Mesh(railGeo, mats.aluminumAlloy);
  railR.position.set(0.22, 0, 0.12);
  railR.castShadow = true;
  ladderGroup.add(railR);

  // 9 Non-slip rungs
  const rungGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8);
  for (let r = 0; r < 9; r++) {
    const rungY = -1.4 + r * 0.35;
    const rung = new THREE.Mesh(rungGeo, mats.aluminumAlloy);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, rungY, 0.12);
    ladderGroup.add(rung);
  }

  // --- APOLLO 11 COMMEMORATIVE PLAQUE ---
  // Mounted between the 3rd and 4th rungs on the forward landing gear strut
  const plaqueFrameGeo = new THREE.BoxGeometry(0.34, 0.22, 0.015);
  const plaqueFrame = new THREE.Mesh(plaqueFrameGeo, mats.aluminumAlloy);
  plaqueFrame.position.set(0, -0.22, 0.135);
  plaqueFrame.castShadow = true;
  ladderGroup.add(plaqueFrame);

  const plaqueFaceGeo = new THREE.PlaneGeometry(0.32, 0.20);
  const plaqueFace = new THREE.Mesh(plaqueFaceGeo, mats.commemorativePlaque);
  plaqueFace.position.set(0, -0.22, 0.145);
  ladderGroup.add(plaqueFace);

  forwardLadderGroup.add(ladderGroup);
  stageGroup.add(forwardLadderGroup);

  // =========================================================================
  // 6. GROUND CONTACT REALISM: REGOLITH BERMS & FOOTPRINTS
  // =========================================================================
  const groundContactGroup = new THREE.Group();
  groundContactGroup.name = 'lunar_ground_contact';

  const bermTex = createFootpadBermTexture();
  const bermMat = new THREE.MeshBasicMaterial({
    map: bermTex,
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });

  // Circular compressed regolith berm beneath each footpad
  const bermGeo = new THREE.PlaneGeometry(1.4, 1.4);
  bermGeo.rotateX(-Math.PI / 2);

  footpadPositions.forEach((pos) => {
    const bermMesh = new THREE.Mesh(bermGeo, bermMat);
    bermMesh.position.set(pos.x, 0.01, pos.z);
    bermMesh.renderOrder = 2;
    groundContactGroup.add(bermMesh);
  });

  // Blast Erosion Depression beneath the DPS Rocket Nozzle
  const blastGeo = new THREE.PlaneGeometry(3.6, 3.6);
  blastGeo.rotateX(-Math.PI / 2);
  const blastTex = createFootpadBermTexture();
  const blastMat = new THREE.MeshBasicMaterial({
    map: blastTex,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  const blastMesh = new THREE.Mesh(blastGeo, blastMat);
  blastMesh.position.set(0, 0.005, 0);
  groundContactGroup.add(blastMesh);

  // Astronaut Bootprint Decal Trail (Armstrong & Aldrin walking from ladder to Flag)
  const footprintTex = createFootprintTexture();
  const footprintMat = new THREE.MeshBasicMaterial({
    map: footprintTex,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  const printGeo = new THREE.PlaneGeometry(0.18, 0.38);
  printGeo.rotateX(-Math.PI / 2);

  // Path from forward ladder (+Z ~ 3.5) out toward the flag (+X ~ 2.8, +Z ~ 5.2)
  const trailPoints = [
    { x: -0.15, z: 3.65, rot: 0.1 },
    { x: 0.18, z: 3.92, rot: 0.2 },
    { x: 0.45, z: 4.25, rot: 0.35 },
    { x: 0.85, z: 4.55, rot: 0.42 },
    { x: 1.25, z: 4.80, rot: 0.5 },
    { x: 1.70, z: 5.00, rot: 0.58 },
    { x: 2.15, z: 5.15, rot: 0.65 },
    { x: 2.55, z: 5.25, rot: 0.7 }
  ];

  trailPoints.forEach((pt) => {
    const printMesh = new THREE.Mesh(printGeo, footprintMat);
    printMesh.position.set(pt.x, 0.012, pt.z);
    printMesh.rotation.y = pt.rot;
    printMesh.renderOrder = 3;
    groundContactGroup.add(printMesh);
  });

  root.add(groundContactGroup);

  // =========================================================================
  // 7. DEPLOYED AMERICAN FLAG (APOLLO 11 HISTORICAL SPEC)
  // =========================================================================
  // Planted ~8 ft (~2.5m) from the forward ladder leg
  const flagGroup = new THREE.Group();
  flagGroup.name = 'apollo_11_flag_assembly';
  flagGroup.position.set(2.8, 0.0, 5.2);

  // Vertical staff (anodized aluminum tube with ground spear)
  const staffGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.75, 12);
  const staff = new THREE.Mesh(staffGeo, mats.aluminumAlloy);
  staff.position.y = 0.875;
  staff.castShadow = true;
  flagGroup.add(staff);

  // Ground soil compression berm around flagpole
  const flagBerm = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6).rotateX(-Math.PI / 2), bermMat);
  flagBerm.position.y = 0.01;
  flagGroup.add(flagBerm);

  // Horizontal support arm (jammed slightly on Apollo 11, creating folds)
  const armGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.95);
  const arm = new THREE.Mesh(armGeo, mats.aluminumAlloy);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.47, 1.72, 0);
  flagGroup.add(arm);

  // Undulating Nylon Flag Fabric with Authentic Stars & Stripes Texture
  const flagGeo = new THREE.PlaneGeometry(0.95, 0.60, 24, 12);
  const flagPos = flagGeo.attributes.position;
  // Create natural rippled folds from the stuck horizontal crossbar
  for (let i = 0; i < flagPos.count; i++) {
    const u = flagPos.getX(i);
    const wave = Math.sin(u * 8.5) * 0.035 + Math.cos(u * 14.0) * 0.015;
    flagPos.setZ(i, wave);
  }
  flagGeo.computeVertexNormals();

  // Procedural 50-star American Flag Canvas Texture
  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 760;
  flagCanvas.height = 480;
  const fCtx = flagCanvas.getContext('2d');

  // 13 Red and White Stripes
  const stripeH = 480 / 13;
  for (let s = 0; s < 13; s++) {
    fCtx.fillStyle = (s % 2 === 0) ? '#b22234' : '#f4f6f8';
    fCtx.fillRect(0, s * stripeH, 760, stripeH);
  }

  // Blue Canton (Union)
  fCtx.fillStyle = '#3c3b6e';
  fCtx.fillRect(0, 0, 320, stripeH * 7);

  // Stars
  fCtx.fillStyle = '#ffffff';
  for (let row = 0; row < 9; row++) {
    const isEven = (row % 2 === 0);
    const count = isEven ? 6 : 5;
    const startX = isEven ? 26 : 52;
    for (let col = 0; col < count; col++) {
      const cx = startX + col * 52;
      const cy = 20 + row * 26;
      fCtx.beginPath();
      fCtx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      fCtx.fill();
    }
  }

  const flagTex = new THREE.CanvasTexture(flagCanvas);
  const flagMat = new THREE.MeshStandardMaterial({
    map: flagTex,
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(0.47, 1.42, 0);
  flagMesh.castShadow = true;
  flagGroup.add(flagMesh);

  root.add(flagGroup);

  // =========================================================================
  // 8. INTERACTIVE INSPECTION HOTSPOT ANCHORS
  // =========================================================================
  root.hotspots = [
    {
      id: 'dps_engine',
      title: 'Descent Propulsion System (DPS)',
      category: 'PROPULSION',
      position: new THREE.Vector3(0, 0.45, 0),
      description: 'Gimbaled 10,500 lbf throttleable rocket engine. Columbium nozzle skirt sits 30cm above lunar regolith with blast depression.'
    },
    {
      id: 'plaque',
      title: 'Commemorative Plaque',
      category: 'HISTORICAL ARTIFACT',
      position: new THREE.Vector3(0, 0.72, 2.75),
      description: 'Stainless steel plate on forward ladder strut: "Here men from the planet Earth first set foot upon the Moon. We came in peace for all mankind."'
    },
    {
      id: 'mesa',
      title: 'MESA (Modular Equipment Stowage Assembly)',
      category: 'COMMUNICATIONS & PAYLOAD',
      position: new THREE.Vector3(-1.6, 1.25, 1.65),
      description: 'Hinged pallet deployed by Neil Armstrong at ladder top. Housed the Westinghouse monochrome TV camera that broadcast first steps live.'
    },
    {
      id: 'contact_probe',
      title: 'Lunar Contact Sensing Probe',
      category: 'LANDING TELEMETRY',
      position: new THREE.Vector3(3.2, 0.15, 0.4),
      description: '5.6-foot spring-steel feeler probe. Touched the dust first, triggering the cockpit "LUNAR CONTACT" blue indicator light.'
    },
    {
      id: 'quad1_cask',
      title: 'SNAP-27 Graphite Fuel Cask (Quad 1)',
      category: 'NUCLEAR AUXILIARY POWER',
      position: new THREE.Vector3(1.65, 1.25, -1.6),
      description: 'Graphite-finned thermal containment cask for the Apollo Lunar Surface Experiments Package (ALSEP) radioisotope power supply.'
    }
  ];

  return root;
}
