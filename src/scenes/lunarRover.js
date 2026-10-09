/**
 * REMANENCE: Apollo Lunar Roving Vehicle (LRV) (Hero Asset)
 * Museum-grade, physically authentic reconstruction based on NASA Apollo 15-17
 * Operations Handbook LS006-002-2H and Boeing/Delco Technical Specifications.
 *
 * Implements:
 * - 3.10m open tubular 2219 aluminum alloy welded spaceframe chassis (no flat slabs)
 * - 4x General Motors woven zinc-coated wire-mesh tires with see-through transparency
 *   and riveted titanium chevron traction cleats in herringbone pattern
 * - Internal flexible titanium bumper rings and 16 radial leaf-spring shock ribs per wheel
 * - 4x 0.25 hp DC traction drive motors with harmonic gearboxes and finned cooling
 * - Dual folding crew "lawn-chair" seats with tubular frames, nylon webbing, and PLSS backpack cutouts
 * - Center console T-handle flight controller and authentic D&C instrument panel with sun compass
 * - Forward equipment deck with dual 36V silver-zinc batteries wrapped in crinkled Gold Kapton MLI,
 *   topped with 48 specular quartz thermal radiator mirrors
 * - Steerable 0.85m High-Gain S-band parabolic umbrella mesh dish antenna with feed horn and peep sight
 * - RCA Ground-Commanded Color Television Camera (GCTA) with gold foil and optical zoom lens
 * - Aft geological tool pallet with sampling tongs, lunar rake, gnomon, and core drive tubes
 * - Apollo 17 iconic taped lunar map fender repair on the right-rear fender
 * - Contact soil berms under all 4 wheels and realistic chevron tire tracks in the regolith
 */

import * as THREE from 'three';
import {
  getAerospaceMaterials,
  createFootpadBermTexture,
  createLRVTracksTexture
} from '../materials/aerospaceMaterials.js';
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
    tapedFender: applyWeathering(rawMats.tapedFender, { planet: 'moon' }),
    lrvConsole: applyWeathering(rawMats.lrvConsole, { planet: 'moon' }),
    lrvFloor: applyWeathering(rawMats.lrvFloor, { planet: 'moon' }),
    quartzMirror: applyWeathering(rawMats.quartzMirror, { planet: 'moon' }),
    goldDishMesh: applyWeathering(rawMats.goldDishMesh, { planet: 'moon' }),
    opticalLens: rawMats.opticalLens, // pristine lens optics
    titaniumCleat: applyWeathering(rawMats.titaniumCleat, { planet: 'moon' })
  };

  // Dimensions: 3.10m long, 1.83m wheel track, 2.29m wheelbase, wheel radius 0.405m
  // Wheels touch the ground at y = 0.00
  const lrvGroup = new THREE.Group();
  lrvGroup.name = 'lrv_body_and_running_gear';
  root.add(lrvGroup);

  // =========================================================================
  // 1. TUBULAR 2219 ALUMINUM CHASSIS & CORRUGATED FLOOR DECK
  // =========================================================================
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'chassis_structure';
  lrvGroup.add(chassisGroup);

  // 1a. Longitudinal Tubular Spaceframe Rails (Outer Left, Outer Right, Center Keel)
  [-0.74, 0.74].forEach((rx) => {
    // Main side rails spanning forward to aft
    const railGeo = new THREE.CylinderGeometry(0.024, 0.024, 2.85, 12);
    const rail = new THREE.Mesh(railGeo, mats.aluminum);
    rail.position.set(rx, 0.42, 0);
    rail.rotation.x = Math.PI / 2;
    rail.castShadow = true;
    chassisGroup.add(rail);

    // Side handrail grab tubes for EVA astronauts mounting/dismounting
    const grabGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.45, 10);
    const grabRail = new THREE.Mesh(grabGeo, mats.aluminum);
    grabRail.position.set(rx > 0 ? rx + 0.05 : rx - 0.05, 0.54, 0);
    grabRail.rotation.x = Math.PI / 2;
    grabRail.castShadow = true;
    chassisGroup.add(grabRail);

    // Upright handrail mounting stanchions
    [-0.65, 0.0, 0.65].forEach((sz) => {
      const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8), mats.aluminum);
      stanchion.position.set(rx > 0 ? rx + 0.05 : rx - 0.05, 0.48, sz);
      chassisGroup.add(stanchion);
    });
  });

  // Center Keel Tube (Running centerline under seats and console)
  const keelGeo = new THREE.CylinderGeometry(0.028, 0.028, 2.75, 12);
  const keel = new THREE.Mesh(keelGeo, mats.aluminum);
  keel.position.set(0, 0.40, 0);
  keel.rotation.x = Math.PI / 2;
  keel.castShadow = true;
  chassisGroup.add(keel);

  // Intermediate Floor Stringers (Under astronaut footrests)
  [-0.37, 0.37].forEach((sx) => {
    const stringerGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.55, 10);
    const stringer = new THREE.Mesh(stringerGeo, mats.aluminum);
    stringer.position.set(sx, 0.41, 0.05);
    stringer.rotation.x = Math.PI / 2;
    chassisGroup.add(stringer);
  });

  // 1b. Transverse Tubular Crossmembers & Structural Bulkheads
  [-1.25, -0.72, -0.25, 0.25, 0.72, 1.25].forEach((cz) => {
    const crossGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.48, 12);
    const cross = new THREE.Mesh(crossGeo, mats.aluminum);
    cross.position.set(0, 0.41, cz);
    cross.rotation.z = Math.PI / 2;
    cross.castShadow = true;
    chassisGroup.add(cross);
  });

  // 1c. Slotted Aluminum Corrugated Floor Deck Panels (Left & Right Footwells)
  // Replaces the flat solid block with rich ribbed, slotted PBR surface!
  [-0.37, 0.37].forEach((fx) => {
    const deckGeo = new THREE.BoxGeometry(0.68, 0.018, 1.42);
    const deck = new THREE.Mesh(deckGeo, mats.lrvFloor);
    deck.position.set(fx, 0.425, 0.02);
    deck.castShadow = true;
    deck.receiveShadow = true;
    chassisGroup.add(deck);
  });

  // 1d. Astronaut Kick Bar / Footrest with Boot Toe-Clips
  const footrestBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.35, 10), mats.aluminum);
  footrestBar.position.set(0, 0.48, 0.62);
  footrestBar.rotation.z = Math.PI / 2;
  footrestBar.castShadow = true;
  chassisGroup.add(footrestBar);

  // 4x Stamped Aluminum Boot Toe Loops
  [-0.52, -0.22, 0.22, 0.52].forEach((tx) => {
    const toeLoop = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16, Math.PI), mats.aluminum);
    toeLoop.position.set(tx, 0.48, 0.64);
    toeLoop.rotation.x = -Math.PI / 2;
    chassisGroup.add(toeLoop);
  });

  // =========================================================================
  // 2. FORWARD CHASSIS & BATTERY BAYS (Gold Kapton MLI & Specular Quartz Mirrors)
  // =========================================================================
  const forwardGroup = new THREE.Group();
  forwardGroup.name = 'forward_equipment_bay';
  lrvGroup.add(forwardGroup);

  // 2a. Forward Tubular Cradle Frame
  [-0.65, 0.65].forEach((cx) => {
    const cradleStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8), mats.aluminum);
    cradleStrut.position.set(cx, 0.46, 1.15);
    cradleStrut.rotation.x = Math.PI / 2;
    forwardGroup.add(cradleStrut);
  });

  // 2b. Two Independent 36V Silver-Zinc Battery Compartments (Battery 1 Port, Battery 2 Starboard)
  // Wrapped in crinkled Gold Kapton MLI blankets with Amber Kapton tape edges
  [-0.34, 0.34].forEach((bx) => {
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(bx, 0.53, 1.14);

    // Battery core blanket in crinkled Gold Kapton
    const batGeo = new THREE.BoxGeometry(0.56, 0.22, 0.62);
    const batMesh = new THREE.Mesh(batGeo, mats.goldKapton);
    batMesh.castShadow = true;
    batteryGroup.add(batMesh);

    // Amber Kapton seam binding strips
    const seamH1 = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.02, 0.02), mats.amberKapton);
    seamH1.position.set(0, 0.11, 0.31);
    batteryGroup.add(seamH1);
    const seamH2 = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.02, 0.02), mats.amberKapton);
    seamH2.position.set(0, 0.11, -0.31);
    batteryGroup.add(seamH2);

    // 24 Specular Quartz Thermal Mirror Tiles on top of each battery (4 rows x 6 columns)
    // Reflects deep vacuum space and catches glancing sunlight with brilliant realistic glints!
    const mirrorTileGeo = new THREE.BoxGeometry(0.075, 0.008, 0.085);
    for (let r = -2; r <= 3; r++) {
      for (let c = -1; c <= 2; c++) {
        const mirrorTile = new THREE.Mesh(mirrorTileGeo, mats.quartzMirror);
        mirrorTile.position.set((c - 0.5) * 0.088, 0.115, (r - 0.5) * 0.098);
        batteryGroup.add(mirrorTile);
      }
    }

    // Propped open thermal radiator cover hinged at the outer edge
    const coverGeo = new THREE.BoxGeometry(0.58, 0.015, 0.64);
    const cover = new THREE.Mesh(coverGeo, mats.betaCloth);
    cover.position.set(bx > 0 ? 0.06 : -0.06, 0.18, 0);
    cover.rotation.z = bx > 0 ? 0.35 : -0.35;
    batteryGroup.add(cover);

    forwardGroup.add(batteryGroup);
  });

  // 2c. Central Electronics Compartment (Signal Processing Unit & Directional Gyro)
  const spuGeo = new THREE.BoxGeometry(0.24, 0.18, 0.42);
  const spuMesh = new THREE.Mesh(spuGeo, mats.amberKapton);
  spuMesh.position.set(0, 0.52, 1.18);
  spuMesh.castShadow = true;
  forwardGroup.add(spuMesh);

  // Directional Gyro (DG) canister with cooling fins
  const dgGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.16, 16);
  const dgMesh = new THREE.Mesh(dgGeo, mats.blackInconel);
  dgMesh.position.set(0, 0.62, 1.18);
  forwardGroup.add(dgMesh);

  // Braided Amphenol electrical wiring harnesses routing to forward chassis
  [-0.08, 0.08].forEach((wx) => {
    const harness = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8), mats.blackInconel);
    harness.position.set(wx, 0.45, 0.92);
    harness.rotation.x = -0.45;
    forwardGroup.add(harness);
  });

  // Forward Electric Steering Actuator & Recirculating Ball Linkage
  const steerBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.14), mats.aluminum);
  steerBox.position.set(0, 0.38, 1.25);
  forwardGroup.add(steerBox);

  // Steering tie rods to front wheel knuckles
  [-0.45, 0.45].forEach((tx) => {
    const tieRod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8), mats.springSteel);
    tieRod.position.set(tx > 0 ? 0.38 : -0.38, 0.38, 1.24);
    tieRod.rotation.z = tx > 0 ? 0.08 : -0.08;
    forwardGroup.add(tieRod);
  });

  // =========================================================================
  // 3. SUSPENSION & 4 WOVEN WIRE-MESH WHEELS (Museum-Grade Detail)
  // =========================================================================
  const wheelBaseX = 0.915; // 1.83m track / 2
  const wheelBaseZ = 1.145; // 2.29m wheelbase / 2
  const wheelRadius = 0.405; // 32-inch diameter / 2
  const wheelWidth = 0.23;

  const wheelPositions = [
    { x: -wheelBaseX, y: wheelRadius, z: wheelBaseZ, side: 'front-left', isRepairedFender: false },
    { x: wheelBaseX, y: wheelRadius, z: wheelBaseZ, side: 'front-right', isRepairedFender: false },
    { x: -wheelBaseX, y: wheelRadius, z: -wheelBaseZ, side: 'rear-left', isRepairedFender: false },
    { x: wheelBaseX, y: wheelRadius, z: -wheelBaseZ, side: 'rear-right', isRepairedFender: true } // Apollo 17 iconic taped lunar map repair!
  ];

  wheelPositions.forEach((wp) => {
    const hubGroup = new THREE.Group();
    hubGroup.position.set(wp.x, wp.y, wp.z);

    // 3a. Outer GM Woven Zinc-Coated Steel Wire-Mesh Tire with Titanium Chevrons
    // Uses alpha-tested open wire weave so you can see right through the tire lattice!
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 48, 2, true);
    const tire = new THREE.Mesh(tireGeo, mats.lrvWheel);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    hubGroup.add(tire);

    // 3b. Internal Flexible Titanium Bumper Ring (Tire Core Bump Stop)
    // Visible through the transparent wire-mesh lattice!
    const innerRingGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.16, 32, 1, true);
    const innerRing = new THREE.Mesh(innerRingGeo, mats.titaniumCleat);
    innerRing.rotation.z = Math.PI / 2;
    hubGroup.add(innerRing);

    // 16 Radial Titanium Leaf-Spring Shock Ribs supporting bumper ring from the hub
    for (let s = 0; s < 16; s++) {
      const sAng = (s * Math.PI) / 8;
      const springRib = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.16, 0.14), mats.titaniumCleat);
      springRib.position.set(
        0,
        Math.sin(sAng) * 0.22,
        Math.cos(sAng) * 0.22
      );
      springRib.rotation.x = -sAng;
      hubGroup.add(springRib);
    }

    // 3c. Spun Aluminum Center Hub Cone & Hub Cap
    const hubConeGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.05, 24);
    const hubCone = new THREE.Mesh(hubConeGeo, mats.aluminum);
    hubCone.rotation.z = Math.PI / 2;
    hubCone.position.x = wp.x > 0 ? 0.07 : -0.07;
    hubGroup.add(hubCone);

    const greaseCapGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16);
    const greaseCap = new THREE.Mesh(greaseCapGeo, mats.springSteel);
    greaseCap.rotation.z = Math.PI / 2;
    greaseCap.position.x = wp.x > 0 ? 0.105 : -0.105;
    hubGroup.add(greaseCap);

    // 8 Wheel Mounting Hex Lug Bolts
    for (let b = 0; b < 8; b++) {
      const bAng = (b * Math.PI) / 4;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), mats.springSteel);
      bolt.position.set(
        wp.x > 0 ? 0.098 : -0.098,
        Math.sin(bAng) * 0.095,
        Math.cos(bAng) * 0.095
      );
      bolt.rotation.z = Math.PI / 2;
      hubGroup.add(bolt);
    }

    // 3d. 0.25 HP DC Traction Drive Motor Housing with Harmonic Drive Gearbox
    const motorGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.17, 16);
    const motor = new THREE.Mesh(motorGeo, mats.blackInconel);
    motor.rotation.z = Math.PI / 2;
    motor.position.x = wp.x > 0 ? -0.07 : 0.07;
    hubGroup.add(motor);

    // Motor Gold Kapton thermal wrap stripe
    const motorTape = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.06, 16), mats.goldKapton);
    motorTape.rotation.z = Math.PI / 2;
    motorTape.position.x = wp.x > 0 ? -0.07 : 0.07;
    hubGroup.add(motorTape);

    // Harmonic drive reduction gearbox casing with cooling fins
    const gearboxGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20);
    const gearbox = new THREE.Mesh(gearboxGeo, mats.aluminum);
    gearbox.rotation.z = Math.PI / 2;
    gearbox.position.x = wp.x > 0 ? -0.015 : 0.015;
    hubGroup.add(gearbox);

    // Armored electrical motor power cable
    const motorCable = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.28, 8), mats.blackInconel);
    motorCable.position.set(wp.x > 0 ? -0.12 : 0.12, 0.08, 0);
    motorCable.rotation.z = wp.x > 0 ? 0.45 : -0.45;
    hubGroup.add(motorCable);

    // 3e. Double Wishbone Suspension A-Arms & Coil-Over Damper Spring
    const wishboneUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), mats.aluminum);
    wishboneUpper.position.set(wp.x > 0 ? -0.14 : 0.14, 0.08, 0);
    wishboneUpper.rotation.z = wp.x > 0 ? 0.35 : -0.35;
    hubGroup.add(wishboneUpper);

    const wishboneLower = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), mats.aluminum);
    wishboneLower.position.set(wp.x > 0 ? -0.14 : 0.14, -0.06, 0);
    wishboneLower.rotation.z = wp.x > 0 ? 0.35 : -0.35;
    hubGroup.add(wishboneLower);

    // Shock absorber damper strut with helical steel spring
    const shockStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.26, 10), mats.springSteel);
    shockStrut.position.set(wp.x > 0 ? -0.11 : 0.11, 0.14, 0);
    hubGroup.add(shockStrut);

    // 3f. Contoured Fiberglass Wheel Fenders
    const fenderGeo = new THREE.CylinderGeometry(wheelRadius + 0.065, wheelRadius + 0.065, 0.27, 24, 1, true, 0, Math.PI * 0.65);
    const fender = new THREE.Mesh(fenderGeo, mats.betaCloth);
    fender.rotation.z = Math.PI / 2;
    fender.rotation.x = -Math.PI * 0.32;
    fender.position.set(0, 0.05, 0);
    fender.castShadow = true;
    hubGroup.add(fender);

    // Rubber dust flap at bottom rear of fender
    const flapGeo = new THREE.BoxGeometry(0.24, 0.08, 0.008);
    const dustFlap = new THREE.Mesh(flapGeo, mats.blackInconel);
    dustFlap.position.set(0, 0.06, -0.42);
    dustFlap.rotation.x = -0.35;
    hubGroup.add(dustFlap);

    // 3g. APOLLO 17 ICONIC TAPED LUNAR MAP EXTENSION REPAIR!
    // On EVA-2, Gene Cernan and Jack Schmitt taped together 4 laminated lunar maps with gray duct tape
    // and clamped them to the broken right-rear fender using 2 spring clamps from the LM cabin.
    if (wp.isRepairedFender) {
      // 4 Laminated Lunar Photo Maps taped together
      const mapExtensionGeo = new THREE.BoxGeometry(0.26, 0.012, 0.34);
      const mapExtension = new THREE.Mesh(mapExtensionGeo, mats.tapedFender);
      mapExtension.position.set(0, 0.34, -0.34);
      mapExtension.rotation.x = -0.46;
      hubGroup.add(mapExtension);

      // Two Apollo gray duct tape seam bands
      [-0.07, 0.07].forEach((tx) => {
        const tapeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.36), mats.blackInconel);
        tapeStrip.position.set(tx, 0.34, -0.34);
        tapeStrip.rotation.x = -0.46;
        hubGroup.add(tapeStrip);

        // Stainless steel spring clamps taken from the Apollo 17 LM cabin!
        const clampBody = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.045, 0.035), mats.aluminum);
        clampBody.position.set(tx, 0.44, -0.22);
        hubGroup.add(clampBody);

        const clampHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8), mats.springSteel);
        clampHandle.position.set(tx, 0.48, -0.21);
        clampHandle.rotation.x = 0.55;
        hubGroup.add(clampHandle);
      });
    }

    lrvGroup.add(hubGroup);

    // 3h. Contact Shadow and Displaced Regolith Berm Under Wheels
    const bermTex = createFootpadBermTexture();
    const bermGeo = new THREE.PlaneGeometry(0.75, 0.75);
    bermGeo.rotateX(-Math.PI / 2);
    const bermMat = new THREE.MeshBasicMaterial({
      map: bermTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });
    const bermMesh = new THREE.Mesh(bermGeo, bermMat);
    bermMesh.position.set(wp.x, 0.015, wp.z);
    root.add(bermMesh);
  });

  // =========================================================================
  // 4. CREW STATION: DUAL FOLDING SEATS ("Lawn-Chair" Design with PLSS Cutouts)
  // =========================================================================
  const seatGroup = new THREE.Group();
  seatGroup.name = 'crew_seats';
  lrvGroup.add(seatGroup);

  // Left Seat (Commander Cernan / Scott / Young) & Right Seat (LMP Schmitt / Irwin / Duke)
  [-0.38, 0.38].forEach((sx) => {
    const singleSeat = new THREE.Group();
    singleSeat.position.set(sx, 0.44, -0.05);

    // Tubular Aluminum Seat Frame Perimeter
    const seatBaseTube = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.03, 0.46), mats.aluminum);
    seatBaseTube.position.set(0, 0.22, 0);
    singleSeat.add(seatBaseTube);

    // Horizontal seat bottom nylon webbing straps
    for (let s = -0.18; s <= 0.18; s += 0.065) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.008, 0.045), mats.seatWebbing);
      strap.position.set(0, 0.238, s);
      singleSeat.add(strap);
    }

    // Tilted Backrest Tubular Frame (Reclined 16° for bulky Apollo A7LB EVA spacesuits)
    const backFrame = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.58, 0.03), mats.aluminum);
    backFrame.position.set(0, 0.50, -0.24);
    backFrame.rotation.x = -0.22;
    singleSeat.add(backFrame);

    // Backrest Woven Nylon Straps with Central Cutout for the Apollo PLSS Backpack
    for (let b = 0.28; b <= 0.74; b += 0.075) {
      // Split into left and right strap sections so the astronaut PLSS backpack fits!
      [-0.14, 0.14].forEach((wx) => {
        const bStrap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.008), mats.seatWebbing);
        bStrap.position.set(wx, b, -0.24 - (b - 0.50) * 0.22);
        bStrap.rotation.x = -0.22;
        singleSeat.add(bStrap);
      });
    }

    // Outer Side Armrest / EVA Suit Grab Bar
    const armrestX = sx > 0 ? 0.26 : -0.26;
    const armrestTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), mats.aluminum);
    armrestTube.position.set(armrestX, 0.38, -0.05);
    armrestTube.rotation.x = Math.PI / 2;
    singleSeat.add(armrestTube);

    // Bright Nylon Astronaut Lap Safety Belts & Stainless Steel Aircraft Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 0.055), mats.seatWebbing);
    belt.position.set(0, 0.32, 0.05);
    singleSeat.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.025, 0.075), mats.aluminum);
    buckle.position.set(0, 0.33, 0.05);
    singleSeat.add(buckle);

    seatGroup.add(singleSeat);
  });

  // =========================================================================
  // 5. CENTER CONTROL CONSOLE & T-HANDLE FLIGHT CONTROLLER
  // =========================================================================
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0, 0.44, 0.36);
  lrvGroup.add(consoleGroup);

  // Pedestal Console Mounting Mast
  const pedestalGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.58, 12);
  const pedestal = new THREE.Mesh(pedestalGeo, mats.aluminum);
  pedestal.position.set(0, 0.30, 0);
  pedestal.castShadow = true;
  consoleGroup.add(pedestal);

  // Display & Control (D&C) Instrument Panel (Tilted 45° toward astronaut helmets)
  // Uses our authentic Apollo instrument texture (Sun Compass, 8-ball, Speedometer, Battery meters)
  const panelGeo = new THREE.BoxGeometry(0.40, 0.34, 0.045);
  const panel = new THREE.Mesh(panelGeo, mats.lrvConsole);
  panel.position.set(0, 0.64, 0.08);
  panel.rotation.x = -0.48;
  panel.castShadow = true;
  consoleGroup.add(panel);

  // Physical 3D Toggle Switches with Wire Switch Guards
  [-0.12, -0.04, 0.04, 0.12].forEach((tx) => {
    const swGuard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI), mats.springSteel);
    swGuard.position.set(tx, 0.54, 0.13);
    swGuard.rotation.x = Math.PI / 2 - 0.48;
    consoleGroup.add(swGuard);

    const toggle = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.025, 6), mats.aluminum);
    toggle.position.set(tx, 0.54, 0.13);
    toggle.rotation.x = Math.PI / 2 - 0.48;
    consoleGroup.add(toggle);
  });

  // T-Handle 4-Way Flight Controller (Throttle, Dynamic Brake, Reverse, Ackerman Steering)
  const stickGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.34, 10);
  const stick = new THREE.Mesh(stickGeo, mats.aluminum);
  stick.position.set(0, 0.68, -0.08);
  stick.rotation.x = -0.28;
  consoleGroup.add(stick);

  // Horizontal T-Bar Contoured Handgrip
  const tBarGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.22, 12);
  const tBar = new THREE.Mesh(tBarGeo, mats.blackInconel);
  tBar.position.set(0, 0.83, -0.12);
  tBar.rotation.z = Math.PI / 2;
  consoleGroup.add(tBar);

  // Reverse Lockout Ring Trigger on T-Handle
  const reverseRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 16), mats.aluminum);
  reverseRing.position.set(0, 0.80, -0.11);
  reverseRing.rotation.x = Math.PI / 2;
  consoleGroup.add(reverseRing);

  // Folding Sun Compass Shadow Gnomon Needle (Top of panel)
  const sunCompassMast = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), mats.springSteel);
  sunCompassMast.position.set(0, 0.81, 0.02);
  consoleGroup.add(sunCompassMast);

  // =========================================================================
  // 6. HIGH-GAIN UMBRELLA ANTENNA & RCA COLOR TV CAMERA
  // =========================================================================
  const commGroup = new THREE.Group();
  commGroup.name = 'forward_communications';
  lrvGroup.add(commGroup);

  // 6a. Steerable 0.85m High-Gain S-Band Parabolic Umbrella Mesh Dish Antenna
  const antennaGroup = new THREE.Group();
  antennaGroup.position.set(0.48, 0.46, 1.25);

  // Tubular Mounting Mast & Support Struts
  const antMast = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.18, 12), mats.aluminum);
  antMast.position.y = 0.59;
  antMast.castShadow = true;
  antennaGroup.add(antMast);

  // Diagonal mast support strut
  const antBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.65, 8), mats.aluminum);
  antBrace.position.set(-0.15, 0.35, -0.15);
  antBrace.rotation.set(-0.45, 0.45, 0);
  antennaGroup.add(antBrace);

  // Azimuth & Elevation Gimbal Mount
  const gimbalSphere = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), mats.blackInconel);
  gimbalSphere.position.y = 1.18;
  antennaGroup.add(gimbalSphere);

  // Dish Assembly (Oriented toward Earth)
  const dishHead = new THREE.Group();
  dishHead.position.set(0, 1.18, 0);
  dishHead.rotation.x = 0.48;
  dishHead.rotation.y = -0.38;

  // Parabolic Umbrella Dish (0.85m diameter golden wire mesh reflector)
  const dishGeo = new THREE.CylinderGeometry(0.425, 0.08, 0.15, 32, 1, true);
  const dishMesh = new THREE.Mesh(dishGeo, mats.goldDishMesh);
  dishMesh.castShadow = true;
  dishHead.add(dishMesh);

  // 16 Radial Umbrella Structural Ribs
  for (let r = 0; r < 16; r++) {
    const rAng = (r * Math.PI) / 8;
    const ribGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.42, 6);
    const rib = new THREE.Mesh(ribGeo, mats.springSteel);
    rib.position.set(
      Math.sin(rAng) * 0.22,
      0.075,
      Math.cos(rAng) * 0.22
    );
    rib.rotation.y = rAng;
    rib.rotation.z = Math.PI / 2.8;
    dishHead.add(rib);
  }

  // Central Telescoping Dipole Feed Horn with Amber Kapton Wrap
  const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.38, 10), mats.amberKapton);
  feedHorn.position.y = 0.20;
  dishHead.add(feedHorn);

  const subReflector = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16), mats.aluminum);
  subReflector.position.y = 0.38;
  dishHead.add(subReflector);

  // Optical Sighting Peep-Sight Scope (Used by astronauts to sight Earth!)
  const sightScope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10), mats.blackInconel);
  sightScope.position.set(0.18, 0.08, 0);
  sightScope.rotation.x = Math.PI / 2;
  dishHead.add(sightScope);

  antennaGroup.add(dishHead);
  commGroup.add(antennaGroup);

  // 6b. Low-Gain S-Band Omnidirectional Whip Antenna (Left Mast)
  const whipGroup = new THREE.Group();
  whipGroup.position.set(-0.55, 0.46, 1.28);

  const whipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 10), mats.aluminum);
  whipBase.position.y = 0.08;
  whipGroup.add(whipBase);

  const whipSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 10), mats.springSteel);
  whipSpring.position.y = 0.22;
  whipGroup.add(whipSpring);

  const whipRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.002, 1.48, 8), mats.springSteel);
  whipRod.position.set(0, 0.96, -0.05);
  whipRod.rotation.x = -0.06;
  whipGroup.add(whipRod);
  commGroup.add(whipGroup);

  // 6c. RCA Ground-Commanded Color Television Camera (GCTA)
  // Filmed the Apollo 17 ascent stage launch from the lunar surface!
  const tvCamGroup = new THREE.Group();
  tvCamGroup.position.set(-0.25, 0.56, 1.34);

  // Motorized Pan/Tilt Cradle Pedestal
  const tvPanTilt = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.18, 12), mats.blackInconel);
  tvPanTilt.position.y = 0.09;
  tvCamGroup.add(tvPanTilt);

  // Camera Electronics Body wrapped in crinkled Gold Kapton MLI blanket
  const tvBodyGeo = new THREE.BoxGeometry(0.22, 0.20, 0.32);
  const tvBody = new THREE.Mesh(tvBodyGeo, mats.goldKapton);
  tvBody.position.set(0, 0.27, 0);
  tvBody.rotation.x = 0.22;
  tvCamGroup.add(tvBody);

  // Top Thermal Quartz Radiator Mirror on Camera Body
  const camMirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.24), mats.quartzMirror);
  camMirror.position.set(0, 0.38, -0.02);
  camMirror.rotation.x = 0.22;
  tvCamGroup.add(camMirror);

  // Motorized Optical Zoom Lens Barrel with Ribbed Rings
  const tvLensGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.22, 18);
  const tvLens = new THREE.Mesh(tvLensGeo, mats.blackInconel);
  tvLens.position.set(0, 0.32, 0.22);
  tvLens.rotation.x = Math.PI / 2 + 0.22;
  tvCamGroup.add(tvLens);

  // Coated Glass Front Optical Lens Element
  const lensGlassGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.015, 18);
  const lensGlass = new THREE.Mesh(lensGlassGeo, mats.opticalLens);
  lensGlass.position.set(0, 0.34, 0.325);
  lensGlass.rotation.x = Math.PI / 2 + 0.22;
  tvCamGroup.add(lensGlass);

  // Video & Power Coaxial Cable Loop
  const tvCable = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.44, 8), mats.blackInconel);
  tvCable.position.set(0.07, 0.15, -0.06);
  tvCable.rotation.x = -0.55;
  tvCamGroup.add(tvCable);

  commGroup.add(tvCamGroup);

  // =========================================================================
  // 7. AFT GEOLOGICAL TOOL PALLET & SAMPLING EQUIPMENT
  // =========================================================================
  const toolGroup = new THREE.Group();
  toolGroup.name = 'geological_tool_pallet';
  toolGroup.position.set(0, 0.45, -1.05);
  lrvGroup.add(toolGroup);

  // Tubular Pallet Gate Frame (Hinged at vehicle rear)
  const palletFrameGeo = new THREE.BoxGeometry(1.35, 0.48, 0.035);
  const palletFrame = new THREE.Mesh(palletFrameGeo, mats.aluminum);
  palletFrame.position.set(0, 0.24, 0);
  toolGroup.add(palletFrame);

  // Apollo Lunar Surface Drill (ALSD) Rack with 2 Spiral Titanium Core Drive Tubes
  [-0.06, 0.06].forEach((tx) => {
    const drillTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.68, 12), mats.titaniumCleat);
    drillTube.position.set(0.18 + tx, 0.24, -0.06);
    drillTube.castShadow = true;
    toolGroup.add(drillTube);
  });

  // Apollo Lunar Rake (Comb tines for collecting 1-3 cm gravel fragments)
  const rakeGroup = new THREE.Group();
  rakeGroup.position.set(-0.45, 0.22, -0.06);
  const rakePole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.84, 8), mats.aluminum);
  rakePole.position.y = 0.15;
  rakeGroup.add(rakePole);
  const rakeComb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.07), mats.springSteel);
  rakeComb.position.y = 0.56;
  rakeGroup.add(rakeComb);
  toolGroup.add(rakeGroup);

  // Lunar Sampling Tongs (Long spring-action gripper tool)
  const tongGroup = new THREE.Group();
  tongGroup.position.set(-0.16, 0.25, -0.06);
  const tongRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.78, 8), mats.aluminum);
  tongGroup.add(tongRod);
  const tongJaws = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.035), mats.springSteel);
  tongJaws.position.y = 0.40;
  tongGroup.add(tongJaws);
  toolGroup.add(tongGroup);

  // Gnomon (Tripod calibration target with vertical gimbal rod)
  const gnomonGroup = new THREE.Group();
  gnomonGroup.position.set(-0.28, 0.22, -0.07);
  const gnomonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.52, 6), mats.aluminum);
  gnomonGroup.add(gnomonRod);
  const gnomonChart = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.01), mats.aluminum);
  gnomonChart.position.y = 0.22;
  gnomonGroup.add(gnomonChart);
  toolGroup.add(gnomonGroup);

  // Sample Collection Bag (SCB) Beta Cloth Pouches with Anodized Handles
  const scbPouch = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.22), mats.betaCloth);
  scbPouch.position.set(0.44, 0.22, -0.12);
  scbPouch.castShadow = true;
  toolGroup.add(scbPouch);

  // =========================================================================
  // 8. GROUND CONTACT, CHEVRON TRACKS & REGOLITH DEBRIS
  // =========================================================================
  // 18-meter long twin herringbone tire tracks trailing behind the vehicle
  const trackGeo = new THREE.PlaneGeometry(2.1, 18.0, 1, 32);
  trackGeo.rotateX(-Math.PI / 2);
  const trackMaps = createLRVTracksTexture();
  const trackMat = new THREE.MeshStandardMaterial({
    map: trackMaps.map,
    normalMap: trackMaps.normal,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughness: 0.94,
    metalness: 0.04,
    transparent: true,
    opacity: 0.92,
    depthWrite: false
  });
  const tracksMesh = new THREE.Mesh(trackGeo, trackMat);
  tracksMesh.name = 'ground_tracks';
  tracksMesh.position.set(0, 0.012, -9.5);
  tracksMesh.receiveShadow = true;
  root.add(tracksMesh);

  // Scattered lunar regolith pebbles around vehicle contact zone
  const pebbleGeo = new THREE.DodecahedronGeometry(0.05, 1);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x484b52,
    roughness: 0.95,
    metalness: 0.05
  });
  const pebbleCount = 16;
  for (let i = 0; i < pebbleCount; i++) {
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
    const px = (Math.random() - 0.5) * 3.0;
    const pz = (Math.random() - 0.5) * 3.8;
    const s = 0.5 + Math.random() * 1.5;
    pebble.scale.set(s, s * 0.5, s);
    pebble.position.set(px, 0.02 * s, pz);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    root.add(pebble);
  }

  // Reference anchor for inspection callouts
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(0.48, 1.25, 0.85);
  root.add(beaconGroup);

  root.userData = {
    beacon: beaconGroup
  };

  return root;
}
