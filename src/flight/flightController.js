/**
 * REMANENCE: Master Flight Engine & Continuous Spacecraft Controller
 *
 * Implements:
 * - One unbroken CatmullRomCurve3 flight corridor through the entire solar system:
 *   Earth Orbit -> Translunar Cruise -> Moon Approach -> Lunar Surface Glide
 *   -> Lunar Ascent -> Interplanetary Cruise -> Mars Entry -> Mars Surface Glide
 *   -> Final Ascent & Retroreflector Pull-Back.
 * - Critically damped spring-damper physics for scroll inertia and spacecraft weight.
 * - Velocity tracking for speed-driven VFX, FOV kick, banking roll (up to 6°), and rumble.
 * - Perpetual orbital hover drift during HOLD phases (never a frozen frame).
 * - Look-at guidance with mouse look-around freedom (up to 12° spring smoothed).
 * - Optical view offset calculation ensuring zero card-hardware collision.
 */

import * as THREE from 'three';

export const FLIGHT_SEGMENTS = [
  { id: 'earth_orbit', name: 'Earth Orbit', start: 0.00, end: 0.06, type: 'orbit' },
  { id: 'translunar_cruise', name: 'Translunar Insertion', start: 0.06, end: 0.16, type: 'cruise' },
  { id: 'moon_approach', name: 'Moon Approach & Descent', start: 0.16, end: 0.20, type: 'descent' },
  { id: 'lunar_surface', name: 'Lunar Surface Glide', start: 0.20, end: 0.52, type: 'glide' },
  { id: 'lunar_ascent', name: 'Lunar Ascent', start: 0.52, end: 0.56, type: 'ascent' },
  { id: 'mars_cruise', name: 'Interplanetary Cruise', start: 0.56, end: 0.68, type: 'cruise' },
  { id: 'mars_entry', name: 'Martian Atmospheric Entry', start: 0.68, end: 0.74, type: 'descent' },
  { id: 'mars_surface', name: 'Martian Surface Glide', start: 0.74, end: 0.94, type: 'glide' },
  { id: 'final_pullback', name: 'Solar Pull-Back & Laser', start: 0.94, end: 1.00, type: 'ascent' }
];

export const FLIGHT_STATIONS = [
  { id: 'intro', s: 0.000, name: 'REMANENCE', cardSide: 'center', ndcX: 0.00, isHold: true },
  { id: 'earth', s: 0.055, name: 'Launch Site Earth', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'apollo11', s: 0.205, name: 'Apollo 11 Lunar Module', cardSide: 'right', ndcX: -0.38, isHold: true },
  { id: 'alsep', s: 0.275, name: 'ALSEP Station', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'lrv', s: 0.345, name: 'Lunar Roving Vehicle', cardSide: 'left', ndcX: 0.36, isHold: true },
  { id: 'hammer_feather', s: 0.415, name: 'The Hammer & The Feather', cardSide: 'right', ndcX: -0.42, isHold: true },
  { id: 'surveyor3', s: 0.485, name: 'Surveyor 3', cardSide: 'right', ndcX: -0.36, isHold: true },
  { id: 'transit', s: 0.620, name: 'The Crossing', cardSide: 'center', ndcX: 0.00, isHold: true },
  { id: 'descent_debris', s: 0.745, name: 'Mars Descent Debris', cardSide: 'right', ndcX: -0.38, isHold: true },
  { id: 'viking1', s: 0.795, name: 'Viking 1 Lander', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'pathfinder', s: 0.840, name: 'Pathfinder & Sojourner', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'spirit', s: 0.880, name: 'Spirit MER Rover', cardSide: 'right', ndcX: -0.35, isHold: true },
  { id: 'opportunity', s: 0.915, name: 'Opportunity in Twilight', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'ingenuity', s: 0.945, name: 'Ingenuity Helicopter', cardSide: 'right', ndcX: -0.35, isHold: true },
  { id: 'retroreflector', s: 0.975, name: 'The Answering Signal', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'sources', s: 1.000, name: 'Archive & Sources', cardSide: 'center', ndcX: 0.00, isHold: true }
];

export const POI_LOCATIONS = [
  { name: 'Earth Orbit', pos: new THREE.Vector3(0, 6, 50) },
  { name: 'Apollo 11 LM', pos: new THREE.Vector3(0, -10, -180) },
  { name: 'ALSEP Station', pos: new THREE.Vector3(14, -9.9, -200) },
  { name: 'Lunar Rover', pos: new THREE.Vector3(38, -14.1, -235) },
  { name: 'Hammer & Feather', pos: new THREE.Vector3(30, -12.6, -252) },
  { name: 'Surveyor 3', pos: new THREE.Vector3(-40, -13.5, -275) },
  { name: 'The Crossing', pos: new THREE.Vector3(22, 46, 250) },
  { name: 'Descent Debris', pos: new THREE.Vector3(-15, -12.8, 615) },
  { name: 'Viking 1 Lander', pos: new THREE.Vector3(0, -8.9, 650) },
  { name: 'Pathfinder', pos: new THREE.Vector3(38, -9.3, 710) },
  { name: 'Spirit MER', pos: new THREE.Vector3(-36, -11.2, 775) },
  { name: 'Opportunity', pos: new THREE.Vector3(12, -11.2, 845) },
  { name: 'Ingenuity', pos: new THREE.Vector3(-28, -7.6, 910) },
  { name: 'Retroreflector', pos: new THREE.Vector3(15, -8.8, -135) }
];

export class FlightController {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.scene = app.scene;

    // Critically damped spring physics state
    this.targetProgress = 0.0;
    this.currentProgress = 0.0;
    this.progressVelocity = 0.0;
    this.springK = 18.0;     // Spring stiffness
    this.dampingC = 8.5;     // Damping factor (critically damped)

    // Speed tracking
    this.speed = 0.0;             // meters / sec equivalent
    this.speedNormalized = 0.0;   // 0.0 to 1.0
    this.maxSpeed = 260.0;
    this.lastWorldPos = new THREE.Vector3();

    // Secondary flight dynamics
    this.bankAngle = 0.0;         // Banking roll around flight vector (radians)
    this.shakeOffset = new THREE.Vector3();
    this.driftAngle = 0.0;
    this.mouseLook = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.baseFov = 48;
    this.currentFov = 48;

    // Optical view offset
    this.currentNdcX = 0.0;
    this.currentNdcY = 0.0;

    // Free flight mode state
    this.isFreeFlight = false;
    this.freeCamPos = new THREE.Vector3();
    this.freeCamRot = new THREE.Euler(0, 0, 0, 'YXZ');
    this.freeCamVel = new THREE.Vector3();
    this.freeMoveKeys = {};
    this.freeSpeed = 22.0;

    this.initMasterSplines();
    this.initEventListeners();
  }

  initMasterSplines() {
    // 1. Master Flight Trajectory Waypoints (32 smoothly connected physical points)
    const camPoints = [
      // SEGMENT 0: Launch / Earth Orbit (s: 0.00 - 0.06)
      new THREE.Vector3(0, 6, 54),           // 0: Hero Title
      new THREE.Vector3(0, 6, 48),           // 1: Earth Overview

      // SEGMENT 1: Translunar Insertion & Cruise (s: 0.06 - 0.16)
      new THREE.Vector3(4, 10, 15),          // 2: Accelerating out of Earth orbit
      new THREE.Vector3(12, 16, -60),        // 3: Translunar cruise, Earth shrinking
      new THREE.Vector3(14, 12, -125),       // 4: Mid-course correction, Moon growing ahead

      // SEGMENT 2: Moon Approach & Descent (s: 0.16 - 0.20)
      new THREE.Vector3(8, 2, -155),         // 5: Moon orbital capture & braking
      new THREE.Vector3(4, -4, -166),        // 6: Descent toward Tranquility Base

      // SEGMENT 3: Lunar Surface Glide (s: 0.20 - 0.52)
      new THREE.Vector3(4.8, -7.8, -172),    // 7: Apollo 11 Lunar Module
      new THREE.Vector3(8, -8.6, -185),      // 8: Low surface glide over regolith
      new THREE.Vector3(17.8, -8.8, -194),   // 9: ALSEP Station
      new THREE.Vector3(26, -10.2, -212),    // 10: Skimming crater rim
      new THREE.Vector3(32.5, -12.4, -226.5),// 11: Lunar Roving Vehicle (3/4 perspective)
      new THREE.Vector3(36, -12.2, -240),    // 12: Along Hadley slope
      new THREE.Vector3(23.8, -11.9, -249.5),// 13: The Hammer & Feather
      new THREE.Vector3(0, -11.0, -262),     // 14: Entering Surveyor crater slope
      new THREE.Vector3(-36.8, -12.4, -270), // 15: Surveyor 3 Lander

      // SEGMENT 4: Lunar Ascent & Earth-Moon Pull (s: 0.52 - 0.56)
      new THREE.Vector3(-22, 18, -235),      // 16: Lunar liftoff thrusters firing
      new THREE.Vector3(-5, 34, -110),       // 17: Climbing above Moon horizon

      // SEGMENT 5: Interplanetary Cruise to Mars (s: 0.56 - 0.68)
      new THREE.Vector3(12, 42, 60),         // 18: Passing Earth in rearview
      new THREE.Vector3(22, 46, 250),        // 19: Deep space transit cruise (The Crossing)
      new THREE.Vector3(20, 36, 440),        // 20: Approaching red planet Mars

      // SEGMENT 6: Martian Atmospheric Entry & Descent (s: 0.68 - 0.74)
      new THREE.Vector3(10, 16, 560),        // 21: Upper atmospheric entry, plasma heating
      new THREE.Vector3(-6, -3, 595),        // 22: Deceleration into Chryse dust haze

      // SEGMENT 7: Martian Surface Glide (s: 0.74 - 0.94)
      new THREE.Vector3(-27.0, -10.8, 626),  // 23: EDL Descent Debris & Parachute
      new THREE.Vector3(-8, -9.5, 636),      // 24: Skimming Chryse sand dunes
      new THREE.Vector3(3.5, -8.2, 656),     // 25: Viking 1 Lander
      new THREE.Vector3(22, -8.6, 682),      // 26: Flight along Ares Vallis channel
      new THREE.Vector3(40.5, -8.8, 714),    // 27: Pathfinder & Sojourner
      new THREE.Vector3(2, -9.8, 746),       // 28: Low glide across basalt plains
      new THREE.Vector3(-33.5, -10.5, 779),  // 29: Spirit MER Rover
      new THREE.Vector3(-10, -10.4, 812),    // 30: Glide into twilight dusk storm
      new THREE.Vector3(15.5, -10.2, 850),   // 31: Opportunity in Twilight
      new THREE.Vector3(-6, -8.6, 882),      // 32: Climbing toward Valinor ridge
      new THREE.Vector3(-26.2, -7.2, 914),   // 33: Ingenuity Helicopter

      // SEGMENT 8: Final Ascent & Laser Signal (s: 0.94 - 1.00)
      new THREE.Vector3(0, 16, 520),         // 34: Rocketing out of Mars atmosphere
      new THREE.Vector3(18.5, -7.8, -129),   // 35: Retroreflector array & green laser beam
      new THREE.Vector3(26.0, 4.0, -100)     // 36: Wide cosmic solar archive view
    ];

    // 2. Master Look-at Targets (precisely aimed at planets, hardware, and forward flight vectors)
    const lookPoints = [
      // SEGMENT 0: Earth
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),

      // SEGMENT 1: Forward Moon vector
      new THREE.Vector3(0, -10, -100),
      new THREE.Vector3(0, -40, -210),
      new THREE.Vector3(0, -20, -195),

      // SEGMENT 2: Tranquility Base
      new THREE.Vector3(0, -9.5, -180),
      new THREE.Vector3(0, -9.0, -180),

      // SEGMENT 3: Lunar Hardware
      new THREE.Vector3(0, -8.8, -180),      // Apollo 11
      new THREE.Vector3(10, -9.2, -195),
      new THREE.Vector3(14, -9.4, -200),     // ALSEP
      new THREE.Vector3(30, -11.0, -225),
      new THREE.Vector3(38, -13.6, -235),    // LRV
      new THREE.Vector3(34, -12.8, -245),
      new THREE.Vector3(20.5, -12.55, -252), // Hammer & Feather
      new THREE.Vector3(-25, -12.2, -265),
      new THREE.Vector3(-40, -12.6, -275),   // Surveyor 3

      // SEGMENT 4: Ascent
      new THREE.Vector3(0, -50, -220),       // Curving Moon below
      new THREE.Vector3(0, 0, 0),            // Earth in distance

      // SEGMENT 5: Mars Transit
      new THREE.Vector3(0, -20, 650),
      new THREE.Vector3(0, -30, 660),
      new THREE.Vector3(0, -40, 670),

      // SEGMENT 6: Entry
      new THREE.Vector3(-10, -15, 620),
      new THREE.Vector3(-15, -12.8, 615),

      // SEGMENT 7: Martian Hardware
      new THREE.Vector3(-19.5, -12.8, 614),  // Descent Debris
      new THREE.Vector3(-4, -9.5, 640),
      new THREE.Vector3(0, -8.9, 650),       // Viking 1
      new THREE.Vector3(25, -9.1, 690),
      new THREE.Vector3(38, -9.3, 710),      // Pathfinder
      new THREE.Vector3(-15, -10.5, 750),
      new THREE.Vector3(-36, -11.2, 775),    // Spirit
      new THREE.Vector3(0, -10.8, 820),
      new THREE.Vector3(12, -11.2, 845),     // Opportunity
      new THREE.Vector3(-18, -8.5, 895),
      new THREE.Vector3(-28, -7.6, 910),     // Ingenuity

      // SEGMENT 8: Laser & Archive
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(15, -8.8, -135),     // Retroreflector array
      new THREE.Vector3(15, -9.0, -135)      // Cosmic archive wide
    ];

    this.camSpline = new THREE.CatmullRomCurve3(camPoints, false, 'centripetal', 0.25);
    this.lookSpline = new THREE.CatmullRomCurve3(lookPoints, false, 'centripetal', 0.25);
    this.splineLength = this.camSpline.getLength();
  }

  initEventListeners() {
    // Mouse movement for subtle look-around freedom (up to 12 degrees)
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      this.mouseLook.targetX = nx * 0.21; // ~12 degrees
      this.mouseLook.targetY = ny * 0.14; // ~8 degrees
    });

    // Free flight pointer drag for 360-degree camera rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    window.addEventListener('pointerdown', (e) => {
      if (this.isFreeFlight) {
        if (e.target.closest('button, a, .hud-top, .chapter-rail, .return-tour-pill')) return;
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isFreeFlight && isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;

        this.freeCamRot.y -= dx * 0.0035;
        this.freeCamRot.x = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, this.freeCamRot.x - dy * 0.0035));
      }
    });

    window.addEventListener('pointerup', () => { isDragging = false; });
    window.addEventListener('pointercancel', () => { isDragging = false; });

    // Free flight keyboard controls
    window.addEventListener('keydown', (e) => {
      this.freeMoveKeys[e.code] = true;
      if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.toggleFreeFlight();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.freeMoveKeys[e.code] = false;
    });

    // Free flight speed wheel
    window.addEventListener('wheel', (e) => {
      if (this.isFreeFlight) {
        this.freeSpeed = Math.max(5.0, Math.min(120.0, this.freeSpeed - Math.sign(e.deltaY) * 4.0));
      }
    }, { passive: true });

    // UI Buttons for Free Flight Mode
    const freeFlightBtn = document.getElementById('btn-free-flight');
    if (freeFlightBtn) {
      freeFlightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFreeFlight();
      });
    }

    const returnBtn = document.getElementById('btn-return-tour');
    if (returnBtn) {
      returnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.returnToTour();
      });
    }
  }

  setTargetProgress(progress) {
    this.targetProgress = Math.max(0.0, Math.min(0.9999, progress));
  }

  seekToProgress(progress) {
    this.targetProgress = Math.max(0.0, Math.min(0.9999, progress));
    this.currentProgress = this.targetProgress;
    this.progressVelocity = 0.0;
    const { station } = this.getClosestStation(this.currentProgress);
    if (station && window.innerWidth >= 768) {
      this.currentNdcX = station.ndcX || 0.0;
    }
    this.update(0.016);
  }

  findStationAtProgress(s = this.currentProgress) {
    return this.getClosestStation(s).station;
  }

  getCurrentSegment(s = this.currentProgress) {
    return FLIGHT_SEGMENTS.find(seg => s >= seg.start && s <= seg.end) || FLIGHT_SEGMENTS[0];
  }

  getClosestStation(s = this.currentProgress) {
    let closest = FLIGHT_STATIONS[0];
    let minDiff = Infinity;
    for (const st of FLIGHT_STATIONS) {
      const diff = Math.abs(st.s - s);
      if (diff < minDiff) {
        minDiff = diff;
        closest = st;
      }
    }
    return { station: closest, diff: minDiff, inHold: minDiff < 0.018 };
  }

  toggleFreeFlight() {
    this.isFreeFlight = !this.isFreeFlight;
    const btn = document.getElementById('btn-free-flight');
    const returnBtn = document.getElementById('btn-return-tour');

    if (this.isFreeFlight) {
      // Capture current camera pose
      this.freeCamPos.copy(this.camera.position);
      this.freeCamRot.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.freeCamVel.set(0, 0, 0);

      if (btn) btn.classList.add('active');
      if (returnBtn) returnBtn.classList.add('visible');
      console.log('[REMANENCE FlightController] Free flight ENABLED. Controls: WASD/Arrows, Shift, Q/E, Mouse.');
    } else {
      if (btn) btn.classList.remove('active');
      if (returnBtn) returnBtn.classList.remove('visible');
      console.log('[REMANENCE FlightController] Free flight DISABLED. Resuming guided flight.');
    }
    return this.isFreeFlight;
  }

  returnToTour() {
    if (!this.isFreeFlight) return;

    // Find nearest point on master spline to current free flight camera position
    let bestT = 0;
    let minDist = Infinity;
    const testSamples = 120;
    for (let i = 0; i <= testSamples; i++) {
      const t = i / testSamples;
      const pt = this.camSpline.getPoint(t);
      const d = pt.distanceTo(this.freeCamPos);
      if (d < minDist) {
        minDist = d;
        bestT = t;
      }
    }

    this.targetProgress = bestT;
    this.currentProgress = bestT;
    this.progressVelocity = 0;
    this.isFreeFlight = false;

    const btn = document.getElementById('btn-free-flight');
    const returnBtn = document.getElementById('btn-return-tour');
    if (btn) btn.classList.remove('active');
    if (returnBtn) returnBtn.classList.remove('visible');
  }

  update(delta) {
    const dt = Math.min(delta, 0.1);

    if (this.isFreeFlight) {
      this.updateFreeFlight(dt);
      return;
    }

    // 1. Critically Damped Spring-Damper Physics Integration
    const progressDiff = this.targetProgress - this.currentProgress;
    const springForce = progressDiff * this.springK;
    const dampingForce = -this.progressVelocity * this.dampingC;
    const accel = springForce + dampingForce;

    this.progressVelocity += accel * dt;
    this.currentProgress += this.progressVelocity * dt;
    this.currentProgress = Math.max(0.0, Math.min(0.9999, this.currentProgress));

    // 2. Physical Velocity & Speed Calculation
    const posCurrent = this.camSpline.getPoint(this.currentProgress);
    const posNext = this.camSpline.getPoint(Math.min(0.9999, this.currentProgress + 0.001));
    const forwardVec = posNext.clone().sub(posCurrent).normalize();

    const worldDistTraveled = Math.abs(this.progressVelocity) * this.splineLength;
    this.speed = worldDistTraveled;
    this.speedNormalized = Math.min(1.0, this.speed / this.maxSpeed);

    // 3. Dynamic Curvature & Banking Roll Angle (up to 6 degrees / 0.105 rad)
    const tAhead = Math.min(0.9999, this.currentProgress + 0.008);
    const posAhead = this.camSpline.getPoint(tAhead);
    const turnVector = posAhead.clone().sub(posCurrent).cross(new THREE.Vector3(0, 1, 0));
    const rawBank = -turnVector.y * this.speedNormalized * 0.105;
    this.bankAngle = THREE.MathUtils.lerp(this.bankAngle, rawBank, dt * 6.0);

    // 4. Engine Vibration / Micro-Turbulence (scaled by speed, 0 at rest)
    if (this.speedNormalized > 0.02) {
      const shakeMag = this.speedNormalized * 0.035;
      this.shakeOffset.set(
        (Math.random() - 0.5) * shakeMag,
        (Math.random() - 0.5) * shakeMag,
        (Math.random() - 0.5) * shakeMag
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // 5. Perpetual Hover Drift during HOLD phases (never a frozen frame)
    const { inHold } = this.getClosestStation();
    if (inHold && this.speedNormalized < 0.05) {
      this.driftAngle += dt * 0.45;
      const driftX = Math.sin(this.driftAngle) * 0.12;
      const driftY = Math.cos(this.driftAngle * 0.8) * 0.06;
      posCurrent.x += driftX;
      posCurrent.y += driftY;
    }

    // 6. Smooth Mouse Look-Around Offset (up to 12 degrees)
    this.mouseLook.x = THREE.MathUtils.lerp(this.mouseLook.x, this.mouseLook.targetX, dt * 5.0);
    this.mouseLook.y = THREE.MathUtils.lerp(this.mouseLook.y, this.mouseLook.targetY, dt * 5.0);

    // 7. Base Camera Position & LookAt
    const lookTarget = this.lookSpline.getPoint(this.currentProgress);

    this.camera.position.copy(posCurrent).add(this.shakeOffset);
    this.camera.lookAt(lookTarget);

    // Apply banking roll and pilot look offset to camera rotation
    this.camera.rotation.z += this.bankAngle;
    this.camera.rotation.y += this.mouseLook.x;
    this.camera.rotation.x += this.mouseLook.y;

    // 8. Dynamic FOV Kick (+12 degrees at peak velocity)
    const targetFov = this.baseFov + this.speedNormalized * 12.0;
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, dt * 8.0);
    this.camera.fov = this.currentFov;

    // 9. Dynamic Optical View Offset (Zero card-hardware collision)
    this.updateOpticalViewOffset(dt);

    // 10. Sync audio doppler whoosh with flight velocity
    if (this.app.audio && this.app.audio.setFlightVelocity) {
      this.app.audio.setFlightVelocity(this.speedNormalized);
    }

    // 11. Real-time Flight HUD Compass & Orientation
    this.updateCompass();
  }

  updateOpticalViewOffset(dt) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    // Calculate interpolated NDC X based on station offsets
    const stationCount = FLIGHT_STATIONS.length;
    let targetNdcX = 0.0;
    let targetNdcY = isMobile ? 0.28 : 0.0;

    for (let i = 0; i < stationCount - 1; i++) {
      const curr = FLIGHT_STATIONS[i];
      const next = FLIGHT_STATIONS[i + 1];
      if (this.currentProgress >= curr.s && this.currentProgress <= next.s) {
        const u = (this.currentProgress - curr.s) / (next.s - curr.s);
        const smoothU = u * u * (3 - 2 * u);
        targetNdcX = THREE.MathUtils.lerp(curr.ndcX, next.ndcX, smoothU);
        if (curr.cardSide === 'center' && next.cardSide === 'center') {
          targetNdcY = 0.0;
        }
        break;
      }
    }

    if (isMobile) {
      targetNdcX = 0.0; // Mobile always centers subject horizontally
    }

    this.currentNdcX = THREE.MathUtils.lerp(this.currentNdcX, targetNdcX, dt * 6.0);
    this.currentNdcY = THREE.MathUtils.lerp(this.currentNdcY, targetNdcY, dt * 6.0);

    if (Math.abs(this.currentNdcX) > 0.002 || Math.abs(this.currentNdcY) > 0.002) {
      this.camera.setViewOffset(
        width,
        height,
        -this.currentNdcX * (width * 0.5),
        this.currentNdcY * (height * 0.5),
        width,
        height
      );
    } else {
      this.camera.clearViewOffset();
    }
    this.camera.updateProjectionMatrix();
  }

  updateFreeFlight(dt) {
    // Free flight WASD + Arrow + Elevation (Q/E, Space/C) 6DOF control
    const moveDir = new THREE.Vector3();
    if (this.freeMoveKeys['KeyW'] || this.freeMoveKeys['ArrowUp']) moveDir.z -= 1;
    if (this.freeMoveKeys['KeyS'] || this.freeMoveKeys['ArrowDown']) moveDir.z += 1;
    if (this.freeMoveKeys['KeyA'] || this.freeMoveKeys['ArrowLeft']) moveDir.x -= 1;
    if (this.freeMoveKeys['KeyD'] || this.freeMoveKeys['ArrowRight']) moveDir.x += 1;
    if (this.freeMoveKeys['KeyQ'] || this.freeMoveKeys['KeyC']) moveDir.y -= 1;
    if (this.freeMoveKeys['KeyE'] || this.freeMoveKeys['Space'] || this.freeMoveKeys['KeySpace']) moveDir.y += 1;

    const isBoost = this.freeMoveKeys['ShiftLeft'] || this.freeMoveKeys['ShiftRight'];
    const currentSpeed = this.freeSpeed * (isBoost ? 2.5 : 1.0);

    moveDir.normalize();
    moveDir.applyEuler(this.freeCamRot);

    this.freeCamVel.lerp(moveDir.multiplyScalar(currentSpeed), dt * 7.0);
    this.freeCamPos.addScaledVector(this.freeCamVel, dt);

    // Collision safety: Terrain height clamping (never clip below ground)
    const minAltitude = this.getMinTerrainAltitude(this.freeCamPos.x, this.freeCamPos.z);
    if (this.freeCamPos.y < minAltitude + 2.5) {
      this.freeCamPos.y = minAltitude + 2.5;
      this.freeCamVel.y = 0;
    }

    this.camera.position.copy(this.freeCamPos);
    this.camera.rotation.copy(this.freeCamRot);
    this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();

    this.updateCompass();
  }

  updateCompass() {
    const compassEl = document.getElementById('flight-hud-compass');
    const poiEl = document.getElementById('compass-poi');
    if (!poiEl) return;

    let nearest = null;
    let minDist = Infinity;
    const camPos = this.camera.position;

    for (const poi of POI_LOCATIONS) {
      const d = camPos.distanceTo(poi.pos);
      if (d < minDist) {
        minDist = d;
        nearest = poi;
      }
    }

    if (nearest) {
      let heading = Math.round((-this.camera.rotation.y * 180 / Math.PI) % 360);
      if (heading < 0) heading += 360;
      const distStr = minDist < 1000 ? `${minDist.toFixed(0)}m` : `${(minDist / 1000).toFixed(1)}k km`;
      poiEl.textContent = `HDG ${String(heading).padStart(3, '0')}° · ${nearest.name.toUpperCase()} · ${distStr}`;
      if (compassEl) compassEl.classList.add('visible');
    }
  }

  getMinTerrainAltitude(x, z) {
    // Lunar terrain region
    if (z >= -350 && z <= -50 && Math.abs(x) < 180) {
      return -14.2;
    }
    // Martian terrain region
    if (z >= 500 && z <= 980 && Math.abs(x) < 220) {
      return -13.5;
    }
    return -50.0;
  }
}
