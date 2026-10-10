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
import { getMarsTerrainElevation } from '../scenes/mars.js';

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
  { id: 'viking1', s: 0.795, name: 'Viking 1 Lander', cardSide: 'left', ndcX: 0.44, isHold: true },
  { id: 'pathfinder', s: 0.840, name: 'Pathfinder & Sojourner', cardSide: 'left', ndcX: 0.44, isHold: true },
  { id: 'spirit', s: 0.880, name: 'Spirit MER Rover', cardSide: 'right', ndcX: -0.48, isHold: true },
  { id: 'opportunity', s: 0.915, name: 'Opportunity in Twilight', cardSide: 'left', ndcX: 0.48, isHold: true },
  { id: 'ingenuity', s: 0.945, name: 'Ingenuity Helicopter', cardSide: 'right', ndcX: -0.42, isHold: true },
  { id: 'retroreflector', s: 0.975, name: 'The Answering Signal', cardSide: 'left', ndcX: 0.35, isHold: true },
  { id: 'sources', s: 1.000, name: 'Archive & Sources', cardSide: 'center', ndcX: 0.00, isHold: true }
];

export const POI_LOCATIONS = [
  { name: 'Earth Orbit', pos: new THREE.Vector3(0, 6, 50) },
  { name: 'Apollo 11 LM', pos: new THREE.Vector3(0, -10, -180) },
  { name: 'ALSEP Station', pos: new THREE.Vector3(14, -9.9, -200) },
  { name: 'Lunar Rover', pos: new THREE.Vector3(38, -14.1, -235) },
  { name: 'Hammer & Feather', pos: new THREE.Vector3(22, -11.214, -252) },
  { name: 'Surveyor 3', pos: new THREE.Vector3(-40, -13.5, -275) },
  { name: 'The Crossing', pos: new THREE.Vector3(22, 46, 250) },
  { name: 'Descent Debris', pos: new THREE.Vector3(-20, -13.20, 615) },
  { name: 'Viking 1 Lander', pos: new THREE.Vector3(0, -9.55, 650) },
  { name: 'Pathfinder', pos: new THREE.Vector3(38, -9.73, 710) },
  { name: 'Spirit MER', pos: new THREE.Vector3(-36, -11.49, 775) },
  { name: 'Opportunity', pos: new THREE.Vector3(12, -12.36, 845) },
  { name: 'Ingenuity', pos: new THREE.Vector3(-28, -8.30, 910) },
  { name: 'Retroreflector', pos: new THREE.Vector3(15, -8.8, -135) }
];

export const STATION_ORBIT_CONFIG = {
  apollo11: {
    s: 0.205,
    center: new THREE.Vector3(0, -9.0, -180),
    sweepSpan: 0.024,
    sweepAngle: 0.62
  },
  alsep: {
    s: 0.275,
    center: new THREE.Vector3(14, -9.4, -200),
    sweepSpan: 0.024,
    sweepAngle: 0.58
  },
  lrv: {
    s: 0.345,
    center: new THREE.Vector3(38, -13.8, -235),
    sweepSpan: 0.024,
    sweepAngle: 0.62
  },
  hammer_feather: {
    s: 0.415,
    center: new THREE.Vector3(22.0, -11.2, -252),
    sweepSpan: 0.022,
    sweepAngle: 0.55
  },
  surveyor3: {
    s: 0.485,
    center: new THREE.Vector3(-40, -12.8, -275),
    sweepSpan: 0.024,
    sweepAngle: 0.60
  },
  descent_debris: {
    s: 0.745,
    center: new THREE.Vector3(-19.5, -13.0, 615.0),
    sweepSpan: 0.024,
    sweepAngle: 0.65
  },
  viking1: {
    s: 0.795,
    center: new THREE.Vector3(0.0, -9.3, 650.0),
    sweepSpan: 0.024,
    sweepAngle: 0.62
  },
  pathfinder: {
    s: 0.840,
    center: new THREE.Vector3(38.0, -9.5, 710.0),
    sweepSpan: 0.024,
    sweepAngle: 0.62
  },
  spirit: {
    s: 0.880,
    center: new THREE.Vector3(-36.5, -11.4, 775.0),
    sweepSpan: 0.024,
    sweepAngle: 0.60
  },
  opportunity: {
    s: 0.915,
    center: new THREE.Vector3(12.0, -12.0, 845.0),
    sweepSpan: 0.024,
    sweepAngle: 0.64
  },
  ingenuity: {
    s: 0.945,
    center: new THREE.Vector3(-28.0, -7.7, 910.0),
    sweepSpan: 0.022,
    sweepAngle: 0.58
  },
  retroreflector: {
    s: 0.975,
    center: new THREE.Vector3(15.0, -8.8, -135.0),
    sweepSpan: 0.020,
    sweepAngle: 0.52
  }
};

export class TimedSpline {
  constructor(keyframes) {
    this.keyframes = keyframes.slice().sort((a, b) => a.s - b.s);
    this.tangents = this.computeCatmullRomTangents();
  }

  computeCatmullRomTangents() {
    const n = this.keyframes.length;
    const tangents = { pos: [], look: [] };
    for (let i = 0; i < n; i++) {
      const prev = this.keyframes[Math.max(0, i - 1)];
      const next = this.keyframes[Math.min(n - 1, i + 1)];
      const dt = Math.max(0.0001, next.s - prev.s);
      const mPos = next.pos.clone().sub(prev.pos).divideScalar(dt);
      const mLook = next.look.clone().sub(prev.look).divideScalar(dt);
      if (i === 0 || i === n - 1) {
        mPos.multiplyScalar(0.5);
        mLook.multiplyScalar(0.5);
      }
      tangents.pos.push(mPos);
      tangents.look.push(mLook);
    }
    return tangents;
  }

  evaluate(s) {
    s = Math.max(0, Math.min(0.9999, s));
    const kf = this.keyframes;
    const n = kf.length;
    let idx = 0;
    for (let i = 0; i < n - 1; i++) {
      if (s >= kf[i].s && s <= kf[i + 1].s) {
        idx = i;
        break;
      }
    }
    const p0 = kf[idx];
    const p1 = kf[idx + 1];
    const h = p1.s - p0.s;
    if (h < 1e-6) return { pos: p0.pos.clone(), look: p0.look.clone() };

    const u = (s - p0.s) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;

    const m0_pos = this.tangents.pos[idx];
    const m1_pos = this.tangents.pos[idx + 1];
    const m0_look = this.tangents.look[idx];
    const m1_look = this.tangents.look[idx + 1];

    const pos = p0.pos.clone().multiplyScalar(h00)
      .add(m0_pos.clone().multiplyScalar(h * h10))
      .add(p1.pos.clone().multiplyScalar(h01))
      .add(m1_pos.clone().multiplyScalar(h * h11));

    const look = p0.look.clone().multiplyScalar(h00)
      .add(m0_look.clone().multiplyScalar(h * h10))
      .add(p1.look.clone().multiplyScalar(h01))
      .add(m1_look.clone().multiplyScalar(h * h11));

    return { pos, look };
  }

  getPoint(s) {
    return this.evaluate(s).pos;
  }

  getLookAt(s) {
    return this.evaluate(s).look;
  }

  getLength() {
    let len = 0;
    let prev = this.evaluate(0).pos;
    const steps = 250;
    for (let i = 1; i <= steps; i++) {
      const curr = this.evaluate(i / steps).pos;
      len += prev.distanceTo(curr);
      prev = curr;
    }
    return len;
  }

  findClosestProgress(pos) {
    let bestS = 0;
    let minDist = Infinity;
    const samples = 160;
    for (let i = 0; i <= samples; i++) {
      const s = i / samples;
      const pt = this.evaluate(s).pos;
      const d = pt.distanceTo(pos);
      if (d < minDist) {
        minDist = d;
        bestS = s;
      }
    }
    return bestS;
  }
}

export const MASTER_FLIGHT_KEYFRAMES = [
  // Segment 0: Launch / Earth Orbit (s: 0.00 - 0.06)
  { s: 0.000, pos: new THREE.Vector3(0, 6, 54), look: new THREE.Vector3(0, 0, 0) },
  { s: 0.025, pos: new THREE.Vector3(0, 6, 50), look: new THREE.Vector3(0, 0, 0) },
  { s: 0.055, pos: new THREE.Vector3(0, 6, 48), look: new THREE.Vector3(0, 0, 0) },

  // Segment 1: Translunar Cruise (s: 0.06 - 0.16)
  { s: 0.100, pos: new THREE.Vector3(6, 12, 12), look: new THREE.Vector3(26, 20, -55) },
  { s: 0.140, pos: new THREE.Vector3(16, 16, -55), look: new THREE.Vector3(12, 6, -145) },
  { s: 0.170, pos: new THREE.Vector3(12, 8, -120), look: new THREE.Vector3(2, -4, -175) },

  // Segment 2: Moon Approach & Capture (s: 0.16 - 0.20)
  { s: 0.188, pos: new THREE.Vector3(6, 0, -155), look: new THREE.Vector3(0, -9, -180) },
  { s: 0.198, pos: new THREE.Vector3(2.5, -4.5, -168), look: new THREE.Vector3(0, -9.5, -180) },

  // Segment 3: Lunar Surface Glide (s: 0.20 - 0.52)
  // Apollo 11 Lunar Module
  { s: 0.205, pos: new THREE.Vector3(4.8, -7.8, -172), look: new THREE.Vector3(0, -8.8, -180) },
  { s: 0.240, pos: new THREE.Vector3(8, -8.6, -185), look: new THREE.Vector3(10, -9.2, -195) },
  // ALSEP Station
  { s: 0.275, pos: new THREE.Vector3(17.8, -8.2, -194), look: new THREE.Vector3(14, -9.4, -200) },
  { s: 0.310, pos: new THREE.Vector3(25.0, -6.8, -212.0), look: new THREE.Vector3(28, -10.5, -220) },
  // Lunar Roving Vehicle
  { s: 0.345, pos: new THREE.Vector3(34.0, -10.2, -236.0), look: new THREE.Vector3(38, -13.8, -235) },
  { s: 0.380, pos: new THREE.Vector3(28.0, -10.1, -244.0), look: new THREE.Vector3(25, -11.3, -248) },
  // Hammer & Feather Memorial (Museum macro framing)
  { s: 0.415, pos: new THREE.Vector3(22.8, -10.2, -251.2), look: new THREE.Vector3(22.0, -11.214, -252) },
  { s: 0.450, pos: new THREE.Vector3(3.5, -6.0, -263.0), look: new THREE.Vector3(2, -8.5, -262) },
  // Surveyor 3 Crater Lander
  { s: 0.485, pos: new THREE.Vector3(-36.8, -11.6, -273.0), look: new THREE.Vector3(-40, -12.8, -275) },

  // Segment 4: Lunar Ascent (s: 0.52 - 0.56)
  { s: 0.520, pos: new THREE.Vector3(-22, 18, -235), look: new THREE.Vector3(0, -50, -220) },
  { s: 0.550, pos: new THREE.Vector3(-5, 34, -110), look: new THREE.Vector3(0, 0, 0) },

  // Segment 5: Interplanetary Cruise (s: 0.56 - 0.68)
  { s: 0.580, pos: new THREE.Vector3(12, 42, 60), look: new THREE.Vector3(0, -20, 650) },
  // The Crossing
  { s: 0.620, pos: new THREE.Vector3(22, 46, 250), look: new THREE.Vector3(0, -30, 660) },
  { s: 0.660, pos: new THREE.Vector3(20, 36, 440), look: new THREE.Vector3(0, -40, 670) },

  // Segment 6: Mars Entry & Descent (s: 0.68 - 0.74)
  { s: 0.680, pos: new THREE.Vector3(14.0, 28.0, 520.0), look: new THREE.Vector3(0.0, -10.0, 650.0) },
  { s: 0.705, pos: new THREE.Vector3(8.0, 14.0, 565.0), look: new THREE.Vector3(-10.0, -12.0, 620.0) },
  { s: 0.725, pos: new THREE.Vector3(-8.0, -2.5, 595.0), look: new THREE.Vector3(-18.0, -12.0, 615.0) },

  // Segment 7: Mars Surface Glide (s: 0.74 - 0.94)
  // Station 06: Mars Descent Debris & Parachute
  { s: 0.745, pos: new THREE.Vector3(-16.2, -11.2, 621.5), look: new THREE.Vector3(-19.5, -13.0, 615.0) },
  { s: 0.770, pos: new THREE.Vector3(-6.0, -6.5, 636.0), look: new THREE.Vector3(-1.0, -8.0, 646.0) },
  // Station 08: Viking 1 Lander
  { s: 0.795, pos: new THREE.Vector3(3.2, -6.8, 655.2), look: new THREE.Vector3(0.0, -9.3, 650.0) },
  { s: 0.818, pos: new THREE.Vector3(20.0, -6.5, 682.0), look: new THREE.Vector3(30.0, -8.8, 700.0) },
  // Station 09: Pathfinder & Sojourner Micro-Rover
  { s: 0.840, pos: new THREE.Vector3(41.2, -7.2, 714.2), look: new THREE.Vector3(38.0, -9.5, 710.0) },
  { s: 0.860, pos: new THREE.Vector3(2.0, -6.8, 744.0), look: new THREE.Vector3(-18.0, -9.8, 765.0) },
  // Station 10: Spirit MER Rover & Silica Trench
  { s: 0.880, pos: new THREE.Vector3(-31.0, -9.2, 781.0), look: new THREE.Vector3(-36.5, -11.4, 775.0) },
  { s: 0.898, pos: new THREE.Vector3(-6.0, -6.5, 812.0), look: new THREE.Vector3(6.0, -10.0, 835.0) },
  // Station 11: Opportunity MER Rover in Sol 5111 Twilight
  { s: 0.915, pos: new THREE.Vector3(17.5, -9.6, 851.0), look: new THREE.Vector3(12.0, -12.0, 845.0) },
  { s: 0.925, pos: new THREE.Vector3(1.5, -4.2, 868.0), look: new THREE.Vector3(-12.0, -7.0, 890.0) },
  { s: 0.932, pos: new THREE.Vector3(-10.0, -4.2, 882.0), look: new THREE.Vector3(-22.0, -6.5, 902.0) },
  // Station 12: Ingenuity Mars Helicopter & Broken Blade Tip
  { s: 0.945, pos: new THREE.Vector3(-25.6, -5.8, 913.2), look: new THREE.Vector3(-28.0, -7.7, 910.0) },

  // Segment 8: Mars Liftoff & Retroreflector (s: 0.94 - 1.00)
  { s: 0.962, pos: new THREE.Vector3(0.0, 22.0, 640.0), look: new THREE.Vector3(0.0, -10.0, 650.0) },
  // Station 13: Retroreflector Array
  { s: 0.975, pos: new THREE.Vector3(18.5, -7.6, -128.5), look: new THREE.Vector3(15.0, -8.8, -135.0) },
  // Station 14: Sources Archive
  { s: 1.000, pos: new THREE.Vector3(26.0, 4.0, -100.0), look: new THREE.Vector3(15.0, -9.0, -135.0) }
];

export class FlightController {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.scene = app.scene;

    // Critically damped spring physics state (responsive, zero-lag flight coupling)
    this.targetProgress = 0.0;
    this.currentProgress = 0.0;
    this.progressVelocity = 0.0;
    this.springK = 45.0;     // Responsive spring stiffness
    this.dampingC = 13.5;    // Critically damped factor (smooth, zero overshoot)

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
    this.timedSpline = new TimedSpline(MASTER_FLIGHT_KEYFRAMES);
    this.splineLength = this.timedSpline.getLength();

    // Adapter interfaces for backward compatibility
    this.camSpline = {
      getPoint: (s) => this.timedSpline.getPoint(s),
      getLength: () => this.splineLength
    };
    this.lookSpline = {
      getPoint: (s) => this.timedSpline.getLookAt(s),
      getLength: () => this.splineLength
    };
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
    return { station: closest, diff: minDiff, inHold: minDiff < 0.024 };
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
    const bestT = this.timedSpline.findClosestProgress(this.freeCamPos);

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

    if (this.app.inspection && this.app.inspection.is360Active) {
      // 360° Hardware Inspector has exclusive camera orbit control
      return;
    }

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

    // 2. Physical Velocity & Speed Calculation from Timed Master Spline
    const pt = this.timedSpline.evaluate(this.currentProgress);
    let posCurrent = pt.pos.clone();
    let lookTarget = pt.look.clone();

    // 2b. Dynamic Orbital Flyby & Circling Camera Path during Station Arrival & Hold
    // Curves and sweeps around the hardware in an orbital arc driven by scroll progress
    let orbitalOffsetPos = null;
    let orbitalLookTarget = null;
    let orbitalBlend = 0.0;

    for (const key of Object.keys(STATION_ORBIT_CONFIG)) {
      const cfg = STATION_ORBIT_CONFIG[key];
      const diff = this.currentProgress - cfg.s;
      if (Math.abs(diff) < cfg.sweepSpan) {
        const u = diff / cfg.sweepSpan; // -1 to +1 across the station window
        // Smooth cosine bell curve: 1 at station center, 0 at outer edges
        orbitalBlend = 0.5 * (1 + Math.cos(u * Math.PI));

        // Base hero position from spline keyframe at s = cfg.s
        const heroPt = this.timedSpline.evaluate(cfg.s);
        const heroPos = heroPt.pos;
        const center = cfg.center;

        // Relative vector in horizontal plane
        const vx = heroPos.x - center.x;
        const vz = heroPos.z - center.z;
        const r = Math.hypot(vx, vz);
        const baseAngle = Math.atan2(vx, vz);

        // Orbital sweep driven by scrolling across the station
        // plus gentle idle drift when stopped
        const idleOrbit = (this.speedNormalized < 0.08) ? Math.sin(this.driftAngle) * 0.08 : 0.0;
        const currentAngle = baseAngle + u * cfg.sweepAngle + idleOrbit;

        orbitalOffsetPos = new THREE.Vector3(
          center.x + r * Math.sin(currentAngle),
          heroPos.y + (Math.sin(u * Math.PI * 0.5) * 0.35),
          center.z + r * Math.cos(currentAngle)
        );
        orbitalLookTarget = center.clone();
        break;
      }
    }

    if (orbitalOffsetPos && orbitalBlend > 0.001) {
      posCurrent.lerp(orbitalOffsetPos, orbitalBlend);
      lookTarget.lerp(orbitalLookTarget, orbitalBlend);
    }

    // Safety Terrain Elevation Check: Ensure positive clearance above surface everywhere
    const minAlt = this.getMinTerrainAltitude(posCurrent.x, posCurrent.z);
    if (posCurrent.y < minAlt + 1.25) {
      posCurrent.y = minAlt + 1.25;
    }

    const posNext = this.timedSpline.getPoint(Math.min(0.9999, this.currentProgress + 0.001));
    const forwardVec = posNext.clone().sub(posCurrent).normalize();

    const worldDistTraveled = Math.abs(this.progressVelocity) * this.splineLength;
    this.speed = worldDistTraveled;
    this.speedNormalized = Math.min(1.0, this.speed / this.maxSpeed);

    // 3. Dynamic Curvature & Banking Roll Angle (up to 6 degrees / 0.105 rad)
    const tAhead = Math.min(0.9999, this.currentProgress + 0.008);
    const posAhead = this.timedSpline.getPoint(tAhead);
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

    let targetNdcX = 0.0;
    let targetNdcY = isMobile ? 0.28 : 0.0;

    // Only apply optical offset when near a station hold; during in-transit flight keep centered
    const { station, diff } = this.getClosestStation();
    if (station && diff < 0.035) {
      const holdBlend = THREE.MathUtils.smoothstep(0.035 - diff, 0.0, 0.015);
      if (!isMobile) {
        targetNdcX = (station.ndcX || 0.0) * holdBlend;
      }
      if (station.cardSide === 'center') {
        targetNdcY = 0.0;
      }
    }

    if (isMobile) {
      targetNdcX = 0.0; // Mobile always centers subject horizontally
    }

    this.currentNdcX = THREE.MathUtils.lerp(this.currentNdcX, targetNdcX, dt * 6.0);
    this.currentNdcY = THREE.MathUtils.lerp(this.currentNdcY, targetNdcY, dt * 6.0);

    const hasOffset = Math.abs(this.currentNdcX) > 0.002 || Math.abs(this.currentNdcY) > 0.002;
    if (hasOffset) {
      this.camera.setViewOffset(
        width,
        height,
        -this.currentNdcX * (width * 0.5),
        this.currentNdcY * (height * 0.5),
        width,
        height
      );
      this.camera.updateProjectionMatrix();
    } else {
      if (this.camera.view && this.camera.view.enabled) {
        this.camera.clearViewOffset();
        this.camera.updateProjectionMatrix();
      }
    }
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
    // Martian terrain region (using exact procedural dune elevation)
    if (z >= 520 && z <= 980 && Math.abs(x) < 220) {
      const localX = x;
      const localZ = z - 650;
      return getMarsTerrainElevation(localX, localZ) - 10.0;
    }
    return -50.0;
  }
}
