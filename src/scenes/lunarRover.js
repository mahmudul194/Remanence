/**
 * REMANENCE: Apollo Lunar Roving Vehicle (LRV) (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA Apollo 15-17
 * Operations Handbook LS006-002-2H and Boeing/GM Technical Specifications.
 *
 * Implements:
 * - 3.10m tubular 2219 aluminum alloy welded chassis (forward, center, aft)
 * - 4x General Motors wire-mesh tires (woven zinc-coated steel wire with titanium chevron cleats)
 * - 4x 0.25 hp DC traction drive motors with harmonic gearboxes at each wheel hub
 * - Dual folding crew "lawn-chair" seats with tubular frames and nylon webbing straps
 * - Center console T-handle drive controller and D&C instrument panel with sun compass
 * - Steerable 0.85m High-Gain S-band parabolic mesh umbrella dish antenna with feed horn
 * - RCA 16mm Ground-Commanded Color Television Camera (filmed Apollo 17 lift-off)
 * - Aft geological tool pallet with sampling tongs, lunar rake, and core drive tubes
 * - Apollo 17 iconic taped lunar map fender repair on the right-rear fender
 * - Contact soil berms under all 4 wheels and realistic chevron tire tracks in the regolith
 */

import * as THREE from 'three';
import { getAerospaceMaterials, createFootpadBermTexture, createLRVTracksTexture } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedLRV() {
  const root = new THREE.Group();
  root.name = 'apollo_lrv_rover';

  // Instantiate physically real aerospace materials with lunar weathering
  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'moon' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'moon' }),
    amberKapton: applyWeathering(rawMats.amberKapton, { planet: 'moon' }),
    blackInconel: applyWeathering(rawMats.blackInconel, { planet: 'moon' }),
    betaCloth: applyWeathering(rawMats.betaCloth, { planet: 'moon' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'moon' }),
    lrvWheel: applyWeathering(rawMats.lrvWheelMesh, { planet: 'moon' }),
    seatWebbing: applyWeathering(rawMats.seatWebbing, { planet: 'moon' }),
    tapedFender: applyWeathering(rawMats.tapedFender, { planet: 'moon' })
  };

  // Dimensions: 3.10m long, 1.83m wheel track, 2.29m wheelbase, wheel radius 0.405m
  // Wheels touch the ground at y = 0.00
  const lrvGroup = new THREE.Group();
  lrvGroup.name = 'lrv_body_and_running_gear';
  root.add(lrvGroup);

  // =========================================================================
  // 1. TUBULAR ALUMINUM CHASSIS (Forward, Center, Aft)
  // =========================================================================
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'chassis_structure';
  lrvGroup.add(chassisGroup);

  // Center chassis floor grid (1.68m wide, 1.50m long, 0.38m clearance above ground)
  const floorBedGeo = new THREE.BoxGeometry(1.68, 0.04, 1.50);
  const floorBed = new THREE.Mesh(floorBedGeo, mats.aluminum);
  floorBed.position.set(0, 0.42, 0);
  floorBed.castShadow = true;
  floorBed.receiveShadow = true;
  chassisGroup.add(floorBed);

  // Longitudinal tubular frame rails (left & right)
  [-0.78, 0.78].forEach((x) => {
    const railGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.95, 12);
    const rail = new THREE.Mesh(railGeo, mats.aluminum);
    rail.position.set(x, 0.44, 0);
    rail.rotation.x = Math.PI / 2;
    rail.castShadow = true;
    chassisGroup.add(rail);
  });

  // Crossmember tubular beams (front, center, rear)
  [-1.25, -0.65, 0.0, 0.65, 1.25].forEach((z) => {
    const crossGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.62, 12);
    const cross = new THREE.Mesh(crossGeo, mats.aluminum);
    cross.position.set(0, 0.44, z);
    cross.rotation.z = Math.PI / 2;
    cross.castShadow = true;
    chassisGroup.add(cross);
  });

  // Forward chassis suspension bulkhead & battery pan
  const frontPanGeo = new THREE.BoxGeometry(1.42, 0.06, 0.85);
  const frontPan = new THREE.Mesh(frontPanGeo, mats.aluminum);
  frontPan.position.set(0, 0.43, 1.12);
  frontPan.castShadow = true;
  chassisGroup.add(frontPan);

  // Aft chassis tool tray platform
  const rearPanGeo = new THREE.BoxGeometry(1.45, 0.05, 0.75);
  const rearPan = new THREE.Mesh(rearPanGeo, mats.aluminum);
  rearPan.position.set(0, 0.43, -1.08);
  rearPan.castShadow = true;
  chassisGroup.add(rearPan);

  // Toe-hold footrest bar for seated astronauts
  const footrestGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
  const footrest = new THREE.Mesh(footrestGeo, mats.aluminum);
  footrest.position.set(0, 0.48, 0.62);
  footrest.rotation.z = Math.PI / 2;
  chassisGroup.add(footrest);

  // =========================================================================
  // 2. SUSPENSION & DRIVE TRACTION MOTORS (4 Hubs)
  // =========================================================================
  const wheelBaseX = 0.915; // 1.83m track / 2
  const wheelBaseZ = 1.145; // 2.29m wheelbase / 2
  const wheelRadius = 0.405; // 32-inch diameter / 2
  const wheelWidth = 0.23;

  const wheelPositions = [
    { x: -wheelBaseX, y: wheelRadius, z: wheelBaseZ, side: 'front-left', isDamagedFender: false },
    { x: wheelBaseX, y: wheelRadius, z: wheelBaseZ, side: 'front-right', isDamagedFender: false },
    { x: -wheelBaseX, y: wheelRadius, z: -wheelBaseZ, side: 'rear-left', isDamagedFender: false },
    { x: wheelBaseX, y: wheelRadius, z: -wheelBaseZ, side: 'rear-right', isDamagedFender: true } // Apollo 17 repaired fender
  ];

  wheelPositions.forEach((wp) => {
    const hubGroup = new THREE.Group();
    hubGroup.position.set(wp.x, wp.y, wp.z);

    // Double wishbone A-arms connecting chassis to hub
    const armInX = wp.x > 0 ? wp.x - 0.22 : wp.x + 0.22;
    const wishboneGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8);
    const upperArm = new THREE.Mesh(wishboneGeo, mats.aluminum);
    upperArm.position.set(wp.x > 0 ? -0.12 : 0.12, 0.06, 0);
    upperArm.rotation.z = wp.x > 0 ? 0.35 : -0.35;
    hubGroup.add(upperArm);

    // DC Traction Drive Motor Housing (0.25 hp motor + 80:1 harmonic drive)
    const motorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16);
    const motor = new THREE.Mesh(motorGeo, mats.blackInconel);
    motor.rotation.z = Math.PI / 2;
    motor.position.x = wp.x > 0 ? -0.06 : 0.06;
    hubGroup.add(motor);

    // Kingpin steering knuckle & damper spring
    const springGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 12);
    const spring = new THREE.Mesh(springGeo, mats.springSteel);
    spring.position.set(wp.x > 0 ? -0.08 : 0.08, 0.12, 0);
    hubGroup.add(spring);

    // Wire-Mesh Wheel Tire
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32, 2, true);
    const tire = new THREE.Mesh(tireGeo, mats.lrvWheel);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    hubGroup.add(tire);

    // Inner Titanium Chevron Cleat Ring (Structural ribbing)
    const innerRingGeo = new THREE.CylinderGeometry(wheelRadius * 0.96, wheelRadius * 0.96, wheelWidth * 0.92, 24, 1, true);
    const innerRing = new THREE.Mesh(innerRingGeo, mats.aluminum);
    innerRing.rotation.z = Math.PI / 2;
    hubGroup.add(innerRing);

    // Spun Aluminum Wheel Center Disc & Hub Nut
    const discGeo = new THREE.CylinderGeometry(wheelRadius * 0.52, wheelRadius * 0.52, 0.03, 24);
    const disc = new THREE.Mesh(discGeo, mats.aluminum);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = wp.x > 0 ? 0.08 : -0.08;
    hubGroup.add(disc);

    // 8 Hub Mounting Bolts
    for (let b = 0; b < 8; b++) {
      const bAng = (b * Math.PI) / 4;
      const boltGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6);
      const bolt = new THREE.Mesh(boltGeo, mats.springSteel);
      bolt.position.set(
        wp.x > 0 ? 0.095 : -0.095,
        Math.sin(bAng) * 0.14,
        Math.cos(bAng) * 0.14
      );
      bolt.rotation.z = Math.PI / 2;
      hubGroup.add(bolt);
    }

    // High-Arc Contoured Wheel Fender
    const fenderGeo = new THREE.CylinderGeometry(wheelRadius + 0.08, wheelRadius + 0.08, 0.28, 20, 1, true, 0, Math.PI * 0.65);
    const fenderMat = wp.isDamagedFender ? mats.tapedFender : mats.betaCloth;
    const fender = new THREE.Mesh(fenderGeo, fenderMat);
    fender.rotation.z = Math.PI / 2;
    fender.rotation.x = -Math.PI * 0.32;
    fender.position.set(0, 0.06, 0);
    fender.castShadow = true;
    hubGroup.add(fender);

    // Apollo 17 iconic taped lunar map extension repair!
    if (wp.isDamagedFender) {
      const repairMapGeo = new THREE.BoxGeometry(0.26, 0.015, 0.32);
      const repairMap = new THREE.Mesh(repairMapGeo, mats.tapedFender);
      repairMap.position.set(0, 0.35, -0.32);
      repairMap.rotation.x = -0.45;
      hubGroup.add(repairMap);

      // 2 Gray duct tape bands & locking clamps
      [-0.08, 0.08].forEach((cx) => {
        const tapeGeo = new THREE.BoxGeometry(0.05, 0.02, 0.34);
        const tape = new THREE.Mesh(tapeGeo, mats.blackInconel);
        tape.position.set(cx, 0.35, -0.32);
        tape.rotation.x = -0.45;
        hubGroup.add(tape);

        const clampGeo = new THREE.BoxGeometry(0.03, 0.04, 0.04);
        const clamp = new THREE.Mesh(clampGeo, mats.aluminum);
        clamp.position.set(cx, 0.44, -0.22);
        hubGroup.add(clamp);
      });
    }

    lrvGroup.add(hubGroup);

    // 4x Contact shadow and displaced regolith berm under each wheel
    const bermTex = createFootpadBermTexture();
    const bermGeo = new THREE.PlaneGeometry(0.75, 0.75);
    bermGeo.rotateX(-Math.PI / 2);
    const bermMat = new THREE.MeshBasicMaterial({
      map: bermTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const bermMesh = new THREE.Mesh(bermGeo, bermMat);
    bermMesh.position.set(wp.x, 0.015, wp.z);
    root.add(bermMesh);
  });

  // =========================================================================
  // 3. DUAL ASTRONAUT CREW SEATS ("Lawn-Chair" Tubular Design)
  // =========================================================================
  const seatGroup = new THREE.Group();
  seatGroup.name = 'crew_seats';
  lrvGroup.add(seatGroup);

  [-0.38, 0.38].forEach((sx) => {
    const singleSeat = new THREE.Group();
    singleSeat.position.set(sx, 0.44, -0.05);

    // Tubular aluminum frame base
    const seatFrameGeo = new THREE.BoxGeometry(0.52, 0.04, 0.48);
    const seatFrame = new THREE.Mesh(seatFrameGeo, mats.aluminum);
    seatFrame.position.set(0, 0.22, 0);
    singleSeat.add(seatFrame);

    // Woven nylon webbing bottom cushion straps
    for (let s = -0.2; s <= 0.2; s += 0.07) {
      const strapGeo = new THREE.BoxGeometry(0.48, 0.01, 0.05);
      const strap = new THREE.Mesh(strapGeo, mats.seatWebbing);
      strap.position.set(0, 0.245, s);
      singleSeat.add(strap);
    }

    // Tilted backrest frame (reclined 15 degrees for bulky Apollo EVA suits)
    const backFrameGeo = new THREE.BoxGeometry(0.52, 0.62, 0.04);
    const backFrame = new THREE.Mesh(backFrameGeo, mats.aluminum);
    backFrame.position.set(0, 0.52, -0.24);
    backFrame.rotation.x = -0.22;
    singleSeat.add(backFrame);

    // Woven backrest straps
    for (let b = 0.28; b <= 0.76; b += 0.08) {
      const bStrapGeo = new THREE.BoxGeometry(0.48, 0.05, 0.01);
      const bStrap = new THREE.Mesh(bStrapGeo, mats.seatWebbing);
      bStrap.position.set(0, b, -0.24 - (b - 0.52) * 0.22);
      bStrap.rotation.x = -0.22;
      singleSeat.add(bStrap);
    }

    // Seatbelt harness strap & metal buckle
    const beltGeo = new THREE.BoxGeometry(0.50, 0.02, 0.06);
    const belt = new THREE.Mesh(beltGeo, mats.seatWebbing);
    belt.position.set(0, 0.34, 0.05);
    singleSeat.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.03, 0.08);
    const buckle = new THREE.Mesh(buckleGeo, mats.aluminum);
    buckle.position.set(0, 0.35, 0.05);
    singleSeat.add(buckle);

    seatGroup.add(singleSeat);
  });

  // =========================================================================
  // 4. CENTER CONTROL CONSOLE & T-HANDLE STEERING STICK
  // =========================================================================
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0, 0.44, 0.38);
  lrvGroup.add(consoleGroup);

  // Center vertical pedestal console mast
  const pedestalGeo = new THREE.BoxGeometry(0.24, 0.62, 0.18);
  const pedestal = new THREE.Mesh(pedestalGeo, mats.aluminum);
  pedestal.position.set(0, 0.32, 0);
  pedestal.castShadow = true;
  consoleGroup.add(pedestal);

  // T-Handle 4-way Flight Controller Joystick
  const stickGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12);
  const stick = new THREE.Mesh(stickGeo, mats.aluminum);
  stick.position.set(0, 0.72, -0.05);
  stick.rotation.x = -0.25;
  consoleGroup.add(stick);

  const tBarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.24, 12);
  const tBar = new THREE.Mesh(tBarGeo, mats.blackInconel);
  tBar.position.set(0, 0.88, -0.09);
  tBar.rotation.z = Math.PI / 2;
  consoleGroup.add(tBar);

  // Display & Control (D&C) Instrument Panel (Tilted toward astronaut eyes)
  const panelGeo = new THREE.BoxGeometry(0.38, 0.28, 0.04);
  const panel = new THREE.Mesh(panelGeo, mats.blackInconel);
  panel.position.set(0, 0.68, 0.12);
  panel.rotation.x = -0.45;
  consoleGroup.add(panel);

  // Attitude indicator 8-ball & Heading gyro gauge dials
  [-0.11, 0.11].forEach((gx) => {
    const gaugeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16);
    const gauge = new THREE.Mesh(gaugeGeo, mats.aluminum);
    gauge.position.set(gx, 0.72, 0.14);
    gauge.rotation.x = Math.PI / 2 - 0.45;
    consoleGroup.add(gauge);
  });

  // Sun Compass Shadow Device on top of panel
  const sunCompassMast = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12), mats.springSteel);
  sunCompassMast.position.set(0, 0.86, 0.08);
  consoleGroup.add(sunCompassMast);

  // =========================================================================
  // 5. FORWARD HIGH-GAIN UMBRELLA ANTENNA & RCA TV CAMERA
  // =========================================================================
  const commGroup = new THREE.Group();
  commGroup.name = 'forward_communications';
  lrvGroup.add(commGroup);

  // Forward equipment shelf / battery covers
  const batteryCoverGeo = new THREE.BoxGeometry(1.25, 0.24, 0.58);
  const batteryCover = new THREE.Mesh(batteryCoverGeo, mats.betaCloth);
  batteryCover.position.set(0, 0.58, 1.05);
  batteryCover.castShadow = true;
  commGroup.add(batteryCover);

  // Gold Kapton tape seams across battery thermal covers
  [-0.35, 0.35].forEach((tx) => {
    const tapeStripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.60), mats.goldKapton);
    tapeStripe.position.set(tx, 0.58, 1.05);
    commGroup.add(tapeStripe);
  });

  // High-Gain S-Band Umbrella Antenna (0.85m diameter parabolic mesh dish)
  const antennaGroup = new THREE.Group();
  antennaGroup.position.set(0.48, 0.48, 1.25);

  // Tubular mounting mast & elevation/azimuth gimbal
  const antMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15), mats.aluminum);
  antMast.position.y = 0.58;
  antMast.castShadow = true;
  antennaGroup.add(antMast);

  const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mats.blackInconel);
  gimbal.position.y = 1.15;
  antennaGroup.add(gimbal);

  // Parabolic mesh umbrella dish (16 open ribs)
  const dishHead = new THREE.Group();
  dishHead.position.set(0, 1.15, 0);
  dishHead.rotation.x = 0.45;
  dishHead.rotation.y = -0.35;

  const dishGeo = new THREE.CylinderGeometry(0.44, 0.08, 0.14, 24, 1, true);
  const dishMesh = new THREE.Mesh(dishGeo, mats.aluminum);
  dishMesh.castShadow = true;
  dishHead.add(dishMesh);

  // Dish central dipole feed horn
  const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.35), mats.amberKapton);
  feedHorn.position.y = 0.18;
  dishHead.add(feedHorn);

  // Optical sighting peep sight for manual Earth alignment
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), mats.blackInconel);
  sight.position.set(0.18, 0.06, 0);
  dishHead.add(sight);

  antennaGroup.add(dishHead);
  commGroup.add(antennaGroup);

  // Low-Gain S-band whip antenna on left mast
  const whipGroup = new THREE.Group();
  whipGroup.position.set(-0.55, 0.48, 1.28);
  const whipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15), mats.aluminum);
  whipBase.position.y = 0.08;
  whipGroup.add(whipBase);
  const whipSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12), mats.springSteel);
  whipSpring.position.y = 0.20;
  whipGroup.add(whipSpring);
  const whipRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.003, 1.45), mats.springSteel);
  whipRod.position.set(0, 0.95, -0.05);
  whipRod.rotation.x = -0.08;
  whipGroup.add(whipRod);
  commGroup.add(whipGroup);

  // RCA Ground-Commanded Color Television Camera (CTC-1)
  const tvCamGroup = new THREE.Group();
  tvCamGroup.position.set(-0.35, 0.58, 1.22);

  const tvPanTilt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18), mats.blackInconel);
  tvPanTilt.position.y = 0.09;
  tvCamGroup.add(tvPanTilt);

  const tvBodyGeo = new THREE.BoxGeometry(0.24, 0.22, 0.34);
  const tvBody = new THREE.Mesh(tvBodyGeo, mats.goldKapton);
  tvBody.position.set(0, 0.28, 0);
  tvBody.rotation.x = 0.25; // Aimed slightly upward toward descent stage
  tvCamGroup.add(tvBody);

  const tvLensGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.22, 16);
  const tvLens = new THREE.Mesh(tvLensGeo, mats.blackInconel);
  tvLens.position.set(0, 0.32, 0.24);
  tvLens.rotation.x = Math.PI / 2 + 0.25;
  tvCamGroup.add(tvLens);

  // TV Camera control cable looping to electronics pan
  const tvCableGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8);
  const tvCable = new THREE.Mesh(tvCableGeo, mats.blackInconel);
  tvCable.position.set(0.08, 0.14, -0.08);
  tvCable.rotation.x = -0.55;
  tvCamGroup.add(tvCable);

  commGroup.add(tvCamGroup);

  // =========================================================================
  // 6. AFT GEOLOGICAL TOOL PALLET & LUNAR SAMPLING GEAR
  // =========================================================================
  const toolGroup = new THREE.Group();
  toolGroup.name = 'geological_tool_pallet';
  toolGroup.position.set(0, 0.46, -1.05);
  lrvGroup.add(toolGroup);

  // Tubular Pallet Gate Frame
  const palletFrameGeo = new THREE.BoxGeometry(1.35, 0.48, 0.04);
  const palletFrame = new THREE.Mesh(palletFrameGeo, mats.aluminum);
  palletFrame.position.set(0, 0.24, 0);
  toolGroup.add(palletFrame);

  // Apollo Lunar Surface Rake (comb tines for gravel)
  const rakeGroup = new THREE.Group();
  rakeGroup.position.set(-0.45, 0.22, -0.06);
  const rakePole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.82), mats.aluminum);
  rakePole.position.y = 0.15;
  rakeGroup.add(rakePole);
  const rakeComb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), mats.springSteel);
  rakeComb.position.y = 0.55;
  rakeGroup.add(rakeComb);
  toolGroup.add(rakeGroup);

  // Lunar Sampling Tongs (Long grabber tool)
  const tongGroup = new THREE.Group();
  tongGroup.position.set(-0.15, 0.26, -0.06);
  const tongRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.78), mats.aluminum);
  tongGroup.add(tongRod);
  const tongJaws = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), mats.springSteel);
  tongJaws.position.y = 0.42;
  tongGroup.add(tongJaws);
  toolGroup.add(tongGroup);

  // 2x Drive Tube Core Sample Sleeves
  [-0.05, 0.05].forEach((cx) => {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.65), mats.aluminum);
    tube.position.set(0.15 + cx, 0.22, -0.05);
    toolGroup.add(tube);
  });

  // Sample Collection Bag (SCB) Pouch (Beta cloth bag)
  const scbPouch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.22), mats.betaCloth);
  scbPouch.position.set(0.42, 0.22, -0.12);
  toolGroup.add(scbPouch);

  // =========================================================================
  // 7. GROUND TRACKS & SCATTERED REGOLITH DEBRIS
  // =========================================================================
  // 18-meter long twin chevron rover tire tracks in regolith
  const trackGeo = new THREE.PlaneGeometry(2.1, 18.0, 1, 32);
  trackGeo.rotateX(-Math.PI / 2);
  const trackTex = createLRVTracksTexture();
  const trackMat = new THREE.MeshBasicMaterial({
    map: trackTex,
    transparent: true,
    opacity: 0.88,
    depthWrite: false
  });
  const tracksMesh = new THREE.Mesh(trackGeo, trackMat);
  // Stretches out behind the rear wheels along Z negative
  tracksMesh.position.set(0, 0.012, -9.5);
  root.add(tracksMesh);

  // Scattered lunar regolith pebbles around vehicle contact zone
  const pebbleGeo = new THREE.DodecahedronGeometry(0.06, 1);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x484b52,
    roughness: 0.95,
    metalness: 0.05
  });
  const pebbleCount = 14;
  for (let i = 0; i < pebbleCount; i++) {
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
    const px = (Math.random() - 0.5) * 2.8;
    const pz = (Math.random() - 0.5) * 3.6;
    const s = 0.5 + Math.random() * 1.4;
    pebble.scale.set(s, s * 0.5, s);
    pebble.position.set(px, 0.02 * s, pz);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    root.add(pebble);
  }

  // =========================================================================
  // 8. TELEMETRY BEACON
  // =========================================================================
  const beaconGroup = new THREE.Group();
  const ledGeo = new THREE.SphereGeometry(0.045, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x4df0ff });
  const led = new THREE.Mesh(ledGeo, ledMat);
  beaconGroup.add(led);

  const light = new THREE.PointLight(0x4df0ff, 1.6, 8, 2.0);
  beaconGroup.add(light);
  beaconGroup.position.set(0.48, 1.72, 1.25);
  root.add(beaconGroup);

  root.userData = {
    beacon: beaconGroup
  };

  return root;
}
