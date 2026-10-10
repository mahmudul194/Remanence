/**
 * REMANENCE: Interactive 360° Hardware Inspection & Engineering Telemetry
 * Enables full 360-degree interactive rotation (up, down, left, right) for all
 * Moon and Mars hardware models via direct 3D canvas clicks or card buttons.
 * Includes weathering chronology, 3D technical hotspots, and zero-cut camera transitions.
 */

import * as THREE from 'three';
import { setLunarWeathering } from '../materials/weatheringShader.js';
import { audio } from '../audio.js';
import { SHOTS } from '../story/shots.js';

export const INSPECTABLE_MACHINES = {
  apollo11: {
    id: 'apollo11',
    name: 'Apollo 11 Lunar Module ("Eagle")',
    kicker: '1969 · MARE TRANQUILLITATIS',
    site: '0.6741° N, 23.4730° E · Tranquility Base',
    defaultRadius: 8.5,
    minRadius: 4.2,
    maxRadius: 18.0,
    centerOffset: new THREE.Vector3(0, 2.6, 0),
    hasWeathering: true,
    getGroup: (app) => app.moonScene?.machines?.apollo11
  },
  alsep: {
    id: 'alsep',
    name: 'ALSEP Scientific Station',
    kicker: '1971 · FIVE APOLLO SITES',
    site: 'Nuclear SNAP-27 RTG · Central Transmitter',
    defaultRadius: 4.2,
    minRadius: 2.0,
    maxRadius: 9.0,
    centerOffset: new THREE.Vector3(0, 0.7, 0),
    getGroup: (app) => app.moonScene?.machines?.alsep
  },
  lrv: {
    id: 'lrv',
    name: 'Lunar Roving Vehicle (LRV-001)',
    kicker: '1971 · HADLEY-APENNINE',
    site: '26.1322° N, 3.6339° E · Apollo 15 Site',
    defaultRadius: 5.2,
    minRadius: 2.4,
    maxRadius: 11.5,
    centerOffset: new THREE.Vector3(0, 0.9, 0),
    getGroup: (app) => app.moonScene?.machines?.lrv
  },
  hammer_feather: {
    id: 'hammer_feather',
    name: 'The Hammer & The Feather Memorial',
    kicker: '1971 · HADLEY RILLE',
    site: 'Galileo Equivalence Experiment · Apollo 15',
    defaultRadius: 2.2,
    minRadius: 0.8,
    maxRadius: 4.8,
    centerOffset: new THREE.Vector3(0, 0.45, 0),
    getGroup: (app) => app.moonScene?.machines?.hammer_feather
  },
  surveyor3: {
    id: 'surveyor3',
    alias: 'surveyor',
    name: 'Surveyor 3 Crater Lander',
    kicker: '1967 / 1969 · OCEANUS PROCELLARUM',
    site: '3.015° S, 23.418° W · Surveyor Crater',
    defaultRadius: 5.6,
    minRadius: 2.6,
    maxRadius: 12.0,
    centerOffset: new THREE.Vector3(0, 1.4, 0),
    getGroup: (app) => app.moonScene?.machines?.surveyor || app.moonScene?.machines?.surveyor3
  },
  retroreflector: {
    id: 'retroreflector',
    name: 'Lunar Laser Ranging Retroreflector',
    kicker: '1969–PRESENT · CONTINUOUS SIGNAL',
    site: '100 Fused-Silica Corner-Cube Prisms · Laser Return',
    defaultRadius: 2.8,
    minRadius: 1.2,
    maxRadius: 6.5,
    centerOffset: new THREE.Vector3(0, 0.55, 0),
    getGroup: (app) => app.moonScene?.machines?.retroreflector
  },
  descent_debris: {
    id: 'descent_debris',
    name: 'Mars Descent Debris & Parachute',
    kicker: '1997–2021 · MULTIPLE LANDING PLAINS',
    site: 'Disk-Gap-Band Parachute · Charred Conical Backshell',
    defaultRadius: 8.5,
    minRadius: 3.8,
    maxRadius: 18.0,
    centerOffset: new THREE.Vector3(0, 1.1, 0),
    getGroup: (app) => app.marsScene?.machines?.descent_debris
  },
  viking1: {
    id: 'viking1',
    name: 'Viking 1 Lander (Thomas Mutch Memorial)',
    kicker: '1976 · CHRYSE PLANITIA',
    site: '22.697° N, 48.222° W · Plain of Gold',
    defaultRadius: 5.8,
    minRadius: 2.6,
    maxRadius: 13.0,
    centerOffset: new THREE.Vector3(0, 1.3, 0),
    getGroup: (app) => app.marsScene?.machines?.viking1
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder & Sojourner Micro-Rover',
    kicker: '1997 · ARES VALLIS',
    site: '19.33° N, 33.55° W · Carl Sagan Memorial Station',
    defaultRadius: 5.2,
    minRadius: 2.2,
    maxRadius: 11.5,
    centerOffset: new THREE.Vector3(0, 0.75, 0),
    getGroup: (app) => app.marsScene?.machines?.pathfinder
  },
  spirit: {
    id: 'spirit',
    name: 'Spirit MER-A Mars Exploration Rover',
    kicker: '2004 · GUSEV CRATER',
    site: '14.5684° S, 175.4726° E · Pure Silica Trench at Troy',
    defaultRadius: 4.8,
    minRadius: 2.2,
    maxRadius: 11.0,
    centerOffset: new THREE.Vector3(0, 0.95, 0),
    getGroup: (app) => app.marsScene?.machines?.spirit
  },
  opportunity: {
    id: 'opportunity',
    name: 'Opportunity MER-B in Sol 5111 Twilight',
    kicker: '2004–2018 · ENDEAVOUR CRATER',
    site: '2.327° S, 354.673° E · 45.16 km Marathon & Blueberries',
    defaultRadius: 4.8,
    minRadius: 2.2,
    maxRadius: 11.0,
    centerOffset: new THREE.Vector3(0, 0.95, 0),
    getGroup: (app) => app.marsScene?.machines?.opportunity
  },
  ingenuity: {
    id: 'ingenuity',
    name: 'Ingenuity Mars Helicopter ("Ginny")',
    kicker: '2021–2024 · JEZERO CRATER',
    site: '18.445° N, 77.451° E · Valinor Hills Airfield',
    defaultRadius: 3.6,
    minRadius: 1.4,
    maxRadius: 8.0,
    centerOffset: new THREE.Vector3(0, 0.85, 0),
    getGroup: (app) => app.marsScene?.machines?.ingenuity
  }
};

export class InspectionManager {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.scene = app.scene;

    // 360° Inspector State
    this.machines = INSPECTABLE_MACHINES;
    this.is360Active = false;
    this.currentMachineKey = null;
    this.currentMachineConfig = null;
    this.currentMachineGroup = null;
    this.machineCenter = new THREE.Vector3();

    // Spherical Orbit Camera State
    this.theta = 0.65;          // Azimuth (yaw: 360° unrestricted)
    this.targetTheta = 0.65;
    this.phi = 0.32;            // Elevation (pitch: clamped 0.06 to 1.46 rad)
    this.targetPhi = 0.32;
    this.radius = 8.0;          // Distance
    this.targetRadius = 8.0;

    // User Interaction
    this.isDragging = false;
    this.pointerStart = { x: 0, y: 0 };
    this.lastPointer = { x: 0, y: 0 };
    this.hasMovedPointer = false;
    this.autoRotate = true;
    this.lastInteractionTime = performance.now();

    // Transition State
    this.transitionProgress = 1.0;
    this.transitionFromPos = new THREE.Vector3();
    this.transitionFromLook = new THREE.Vector3();
    this.savedScrollY = 0;

    // Raycaster for 3D model click & hover detection
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2(-100, -100);
    this.hoveredMachineKey = null;

    // Weathering State
    this.weatheringValue = 0.58;

    // Active Hotspots
    this.activeHotspots = [];

    this.initDOM();
    this.initEventListeners();
  }

  initDOM() {
    // 1. Hotspot Markers Overlay Layer
    let layer = document.getElementById('hotspots-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'hotspots-layer';
      layer.className = 'hotspots-layer';
      document.body.appendChild(layer);
    }
    this.container = layer;

    // 2. Technical Modal Dialog
    let overlay = document.getElementById('inspection-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'inspection-modal-overlay';
      overlay.className = 'modal-backdrop-overlay';
      overlay.setAttribute('aria-hidden', 'true');

      const card = document.createElement('div');
      card.id = 'inspection-card';
      card.className = 'modal-dialog inspection-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('aria-labelledby', 'card-title');
      card.setAttribute('tabindex', '-1');

      card.innerHTML = `
        <div class="card-inner">
          <div class="card-header">
            <span class="card-category" id="card-cat">PROPULSION</span>
            <button class="card-close" id="card-close" aria-label="Close dialog" title="Dismiss">✕</button>
          </div>
          <h3 class="card-title" id="card-title">Descent Propulsion System</h3>
          <p class="card-desc" id="card-desc">Gimbaled 10,500 lbf throttleable rocket engine.</p>
          <div class="card-footer">
            <span class="card-ref" id="card-ref">APOLLO 11 · NASA MSC-01855</span>
            <span class="card-status">ARTIFACT SECURED</span>
          </div>
        </div>
      `;
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeCard();
      });

      const closeBtn = card.querySelector('#card-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeCard();
        });
      }
      this.cardElement = card;
      this.modalOverlay = overlay;
    } else {
      this.modalOverlay = overlay;
      this.cardElement = document.getElementById('inspection-card');
    }

    // 3. 360° Hardware Inspector HUD Overlay
    let i360Overlay = document.getElementById('inspector-360-overlay');
    if (!i360Overlay) {
      i360Overlay = document.createElement('div');
      i360Overlay.id = 'inspector-360-overlay';
      i360Overlay.className = 'inspector-360-overlay';
      i360Overlay.setAttribute('aria-hidden', 'true');
      i360Overlay.innerHTML = `
        <div class="i360-header">
          <div class="i360-badge">
            <span class="i360-pulse"></span>
            <span>360° HARDWARE INSPECTION</span>
          </div>
          <h2 class="i360-title" id="i360-machine-title">APOLLO 11 LUNAR MODULE</h2>
          <p class="i360-subtitle" id="i360-machine-sub">Touchdown July 20, 1969 · Mare Tranquillitatis</p>
        </div>

        <button class="i360-btn-exit" id="i360-btn-exit" title="Return to flight tour (ESC)">
          <span>✕ RETURN TO TOUR</span>
          <span class="key-hint">ESC</span>
        </button>

        <div class="i360-footer">
          <div class="i360-hints">
            <span class="i360-hint-item">🖱 <strong>DRAG</strong> TO ROTATE 360°</span>
            <span class="i360-hint-sep">·</span>
            <span class="i360-hint-item">⚲ <strong>SCROLL</strong> TO ZOOM</span>
          </div>
          <div class="i360-actions">
            <button class="i360-ctrl-btn" id="i360-btn-reset" title="Reset viewing angle">⟲ RESET VIEW</button>
            <button class="i360-ctrl-btn" id="i360-btn-rotate" title="Toggle automatic turntable rotation">⏸ PAUSE ORBIT</button>
          </div>
          <div class="i360-weathering-wrap" id="i360-weathering-wrap">
            <div class="wc-header">
              <span class="wc-label">LUNAR SURFACE EXPOSURE</span>
              <span class="wc-state" id="i360-wc-state">TODAY (57 YRS IN VACUUM)</span>
            </div>
            <div class="wc-slider-row">
              <button class="wc-btn" id="i360-btn-1969">1969</button>
              <input type="range" min="0" max="100" value="58" id="i360-wc-slider" class="wc-slider" />
              <button class="wc-btn active" id="i360-btn-today">TODAY</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(i360Overlay);

      // Connect controls
      const exitBtn = i360Overlay.querySelector('#i360-btn-exit');
      if (exitBtn) exitBtn.addEventListener('click', () => this.close360View());

      const resetBtn = i360Overlay.querySelector('#i360-btn-reset');
      if (resetBtn) resetBtn.addEventListener('click', () => this.resetOrbitView());

      const rotateBtn = i360Overlay.querySelector('#i360-btn-rotate');
      if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
          this.autoRotate = !this.autoRotate;
          rotateBtn.textContent = this.autoRotate ? '⏸ PAUSE ORBIT' : '▶ AUTO-ROTATE';
          audio.playPing(750, 0.4);
        });
      }

      // Weathering controls inside 360 inspector
      const slider = i360Overlay.querySelector('#i360-wc-slider');
      const b1969 = i360Overlay.querySelector('#i360-btn-1969');
      const bToday = i360Overlay.querySelector('#i360-btn-today');
      const stateTxt = i360Overlay.querySelector('#i360-wc-state');

      if (slider && b1969 && bToday) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value) / 100;
          this.setWeathering(val);
          this.updateWeatheringUI(val, b1969, bToday, stateTxt);
        });
        b1969.addEventListener('click', () => {
          slider.value = '0';
          this.setWeathering(0.0);
          this.updateWeatheringUI(0.0, b1969, bToday, stateTxt);
        });
        bToday.addEventListener('click', () => {
          slider.value = '100';
          this.setWeathering(1.0);
          this.updateWeatheringUI(1.0, b1969, bToday, stateTxt);
        });
      }
    }
    this.inspectorOverlay = i360Overlay;

    // 4. Hover 3D Tooltip badge near cursor
    let tooltip = document.getElementById('model-hover-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'model-hover-tooltip';
      tooltip.className = 'model-hover-tooltip';
      tooltip.innerHTML = `<span>⟳ CLICK TO INSPECT 360°</span>`;
      document.body.appendChild(tooltip);
    }
    this.hoverTooltip = tooltip;
  }

  initEventListeners() {
    // Canvas pointer interaction for 360 drag and 3D object clicking
    window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerCancel(e));

    // Mouse wheel for 360 zoom
    window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Keyboard shortcuts: ESC to close 360 view, Arrow keys for rotation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.is360Active) {
          e.preventDefault();
          this.close360View();
        } else if (this.modalOverlay && this.modalOverlay.classList.contains('active')) {
          this.closeCard();
        }
      }
      if (this.is360Active) {
        if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
          this.targetTheta -= 0.12;
          this.lastInteractionTime = performance.now();
        } else if (e.key === 'ArrowRight' || e.key === 'KeyD') {
          this.targetTheta += 0.12;
          this.lastInteractionTime = performance.now();
        } else if (e.key === 'ArrowUp' || e.key === 'KeyW') {
          this.targetPhi = Math.min(1.46, this.targetPhi + 0.08);
          this.lastInteractionTime = performance.now();
        } else if (e.key === 'ArrowDown' || e.key === 'KeyS') {
          this.targetPhi = Math.max(0.06, this.targetPhi - 0.08);
          this.lastInteractionTime = performance.now();
        }
      }
    });

    // Delegate clicks on card ".btn-inspect-360" buttons across all stations
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-inspect-360');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const stationId = btn.dataset.station;
        if (stationId) {
          this.open360View(stationId);
        }
      }
    });
  }

  updateWeatheringUI(val, b1, b2, txt) {
    b1.classList.toggle('active', val < 0.2);
    b2.classList.toggle('active', val > 0.8);
    if (val < 0.15) {
      txt.textContent = '1969 TOUCHDOWN (PRISTINE)';
    } else if (val > 0.85) {
      txt.textContent = 'TODAY (57 YRS VACUUM EXPOSURE)';
    } else {
      txt.textContent = `AGE TRANSITION: ${Math.round(val * 57)} YEARS`;
    }
    audio.playPing(900, 0.3);
  }

  setWeathering(val) {
    this.weatheringValue = val;
    setLunarWeathering(val);
  }

  /**
   * Find machine key from an intersected Three.js object
   */
  findMachineKeyFromObject(obj) {
    let curr = obj;
    while (curr) {
      for (const [key, cfg] of Object.entries(INSPECTABLE_MACHINES)) {
        const group = cfg.getGroup(this.app);
        if (group && (curr === group || curr.name === group.name)) {
          return key;
        }
      }
      curr = curr.parent;
    }
    return null;
  }

  onPointerDown(e) {
    // Ignore UI elements
    if (e.target.closest('button, a, input, select, textarea, .modal-dialog, .i360-header, .i360-footer, .i360-btn-exit')) {
      return;
    }

    this.isDragging = true;
    this.hasMovedPointer = false;
    this.pointerStart.x = e.clientX;
    this.pointerStart.y = e.clientY;
    this.lastPointer.x = e.clientX;
    this.lastPointer.y = e.clientY;
    this.lastInteractionTime = performance.now();
  }

  onPointerMove(e) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // In 360 mode: Dragging orbits camera in 360 degrees
    if (this.is360Active) {
      if (this.isDragging) {
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.lastPointer.x = e.clientX;
        this.lastPointer.y = e.clientY;

        if (Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 4) {
          this.hasMovedPointer = true;
        }

        // Full 360° horizontal yaw rotation (left and right)
        this.targetTheta -= dx * 0.0055;

        // Vertical pitch rotation (up and down: looking from overhead to ground level)
        this.targetPhi = Math.max(0.06, Math.min(1.46, this.targetPhi - dy * 0.0055));

        this.lastInteractionTime = performance.now();
      }
      return;
    }

    // Not in 360 mode: Raycast against 3D machines for hover feedback
    this.mouseNDC.x = (e.clientX / width) * 2 - 1;
    this.mouseNDC.y = -(e.clientY / height) * 2 + 1;

    // Do not raycast if interacting with HTML cards
    if (e.target.closest('.moment-wrap, .hud-top, .chapter-rail, .cinematic-caption-wrap')) {
      this.clearHoverState();
      return;
    }

    this.checkModelHover(e.clientX, e.clientY);
  }

  checkModelHover(screenX, screenY) {
    if (!this.app.moonScene && !this.app.marsScene) return;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);

    // Collect all candidate inspectable machine groups
    const targets = [];
    for (const [key, cfg] of Object.entries(INSPECTABLE_MACHINES)) {
      const group = cfg.getGroup(this.app);
      if (group && group.visible !== false) {
        targets.push(group);
      }
    }

    if (targets.length === 0) {
      this.clearHoverState();
      return;
    }

    const hits = this.raycaster.intersectObjects(targets, true);

    if (hits.length > 0) {
      // Find which machine was hit
      const hitKey = this.findMachineKeyFromObject(hits[0].object);
      if (hitKey) {
        this.hoveredMachineKey = hitKey;
        const cfg = INSPECTABLE_MACHINES[hitKey];
        document.body.classList.add('cursor-model-hover');

        if (this.hoverTooltip) {
          this.hoverTooltip.innerHTML = `<span>⟳ 360° INSPECT: ${cfg.name}</span>`;
          this.hoverTooltip.style.left = `${screenX + 16}px`;
          this.hoverTooltip.style.top = `${screenY + 16}px`;
          this.hoverTooltip.classList.add('visible');
        }
        return;
      }
    }

    this.clearHoverState();
  }

  clearHoverState() {
    this.hoveredMachineKey = null;
    document.body.classList.remove('cursor-model-hover');
    if (this.hoverTooltip) {
      this.hoverTooltip.classList.remove('visible');
    }
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    // If pointer barely moved, treat as a direct click
    const dist = Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y);
    if (dist < 6 && !this.is360Active) {
      // Direct click on a 3D model in canvas
      if (this.hoveredMachineKey) {
        e.stopPropagation();
        this.open360View(this.hoveredMachineKey);
        this.clearHoverState();
      }
    }
  }

  onPointerCancel() {
    this.isDragging = false;
  }

  onWheel(e) {
    if (!this.is360Active) return;

    // In 360 mode, intercept wheel scroll to zoom the 3D model
    e.preventDefault();
    e.stopPropagation();

    const cfg = this.currentMachineConfig;
    const minR = cfg ? cfg.minRadius : 2.0;
    const maxR = cfg ? cfg.maxRadius : 18.0;

    const delta = Math.sign(e.deltaY) * 0.75;
    this.targetRadius = Math.max(minR, Math.min(maxR, this.targetRadius + delta));
    this.lastInteractionTime = performance.now();
  }

  resetOrbitView() {
    this.targetTheta = 0.65;
    this.targetPhi = 0.32;
    if (this.currentMachineConfig) {
      this.targetRadius = this.currentMachineConfig.defaultRadius;
    }
    this.lastInteractionTime = performance.now();
    audio.playPing(820, 0.4);
  }

  /**
   * Open full 360° Interactive Hardware Inspector for any Moon or Mars model
   */
  open360View(machineKey) {
    const key = (machineKey === 'surveyor' ? 'surveyor3' : machineKey);
    const cfg = INSPECTABLE_MACHINES[key];
    if (!cfg) {
      console.warn('[REMANENCE 360] Unknown machine key:', machineKey);
      return;
    }

    const group = cfg.getGroup(this.app);
    if (!group) {
      console.warn('[REMANENCE 360] Group not ready for machine:', machineKey);
      return;
    }

    // Ensure appropriate celestial body scene is visible and opposing body is hidden
    if (this.app.moonScene && key in { apollo11: 1, alsep: 1, lrv: 1, hammer_feather: 1, surveyor3: 1, retroreflector: 1 }) {
      this.app.moonScene.group.visible = true;
      if (this.app.marsScene) this.app.marsScene.group.visible = false;
      if (this.app.moonScene.lunarSun) this.app.moonScene.lunarSun.intensity = 1.5;
    }
    if (this.app.marsScene && key in { descent_debris: 1, viking1: 1, pathfinder: 1, spirit: 1, opportunity: 1, ingenuity: 1 }) {
      this.app.marsScene.group.visible = true;
      if (this.app.moonScene) this.app.moonScene.group.visible = false;
      if (this.app.marsScene.marsSun) this.app.marsScene.marsSun.intensity = 1.45;
    }

    this.is360Active = true;
    this.currentMachineKey = key;
    this.currentMachineConfig = cfg;
    this.currentMachineGroup = group;

    // Calculate true world center of machine hardware (excluding ground tracks, berms, trenches)
    group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    group.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const n = (child.name || '').toLowerCase();
        if (
          n.startsWith('ground_') ||
          n.includes('tracks') ||
          n.includes('berm') ||
          n.includes('furrow') ||
          n.includes('trench') ||
          n.includes('blueberries')
        ) {
          return;
        }
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) {
          const meshBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
          box.union(meshBox);
        }
      }
    });

    if (box.isEmpty()) {
      box.setFromObject(group);
    }
    box.getCenter(this.machineCenter);
    if (cfg.centerOffset) {
      this.machineCenter.add(cfg.centerOffset);
    }

    // Setup initial orbit spherical coordinates
    this.targetRadius = cfg.defaultRadius;
    this.radius = cfg.defaultRadius;
    this.targetTheta = 0.65;
    this.theta = 0.65;
    this.targetPhi = 0.34;
    this.phi = 0.34;

    // Save camera starting position for smooth fly-in
    this.transitionFromPos.copy(this.camera.position);
    this.transitionFromLook.copy(this.machineCenter);
    this.transitionProgress = 0.0;

    // Stop Lenis page scrolling during 360 inspection
    if (this.app.lenis) {
      this.app.lenis.stop();
    }

    // Update 360 HUD Overlay contents
    if (this.inspectorOverlay) {
      const titleEl = this.inspectorOverlay.querySelector('#i360-machine-title');
      const subEl = this.inspectorOverlay.querySelector('#i360-machine-sub');
      const weatherWrap = this.inspectorOverlay.querySelector('#i360-weathering-wrap');

      if (titleEl) titleEl.textContent = cfg.name;
      if (subEl) subEl.textContent = `${cfg.kicker} · ${cfg.site}`;
      if (weatherWrap) {
        weatherWrap.style.display = cfg.hasWeathering ? 'flex' : 'none';
      }

      this.inspectorOverlay.classList.add('active');
      this.inspectorOverlay.setAttribute('aria-hidden', 'false');
    }

    // Hide story timeline cards and captions
    document.body.classList.add('inspector-360-open');

    // Build technical hotspots for this machine in 360 mode
    this.build360Hotspots(key, group);

    audio.playPing(1050, 0.5);
    console.log(`[REMANENCE 360] Entered full 360° inspection: ${cfg.name}`);
  }

  /**
   * Close 360° inspector and smoothly resume guided flight
   */
  close360View() {
    if (!this.is360Active) return;

    this.is360Active = false;
    this.closeCard();

    if (this.inspectorOverlay) {
      this.inspectorOverlay.classList.remove('active');
      this.inspectorOverlay.setAttribute('aria-hidden', 'true');
    }

    document.body.classList.remove('inspector-360-open');

    // Clear 360 hotspots
    if (this.container) {
      this.container.innerHTML = '';
      this.activeHotspots = [];
    }

    // Resume Lenis smooth scroll
    if (this.app.lenis) {
      this.app.lenis.start();
    }

    audio.playPing(720, 0.4);
    console.log('[REMANENCE 360] Exited 360° inspection. Resumed flight.');
  }

  build360Hotspots(machineKey, group) {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.activeHotspots = [];

    // Find shot definition for hotspots
    const shot = SHOTS.find(s => s.id === machineKey || (machineKey === 'surveyor3' && s.id === 'surveyor3'));
    if (!shot || !shot.hotspots || shot.hotspots.length === 0) return;

    shot.hotspots.forEach((hs) => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker';
      el.innerHTML = `
        <div class="hs-ping"></div>
        <div class="hs-core"></div>
        <div class="hs-label">${hs.label || hs.title}</div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCard({
          category: hs.category,
          title: hs.label || hs.title,
          description: hs.desc || hs.description
        });
      });

      this.container.appendChild(el);
      this.activeHotspots.push({
        data: hs,
        element: el,
        pos3D: hs.localAnchor ? hs.localAnchor.clone() : new THREE.Vector3()
      });
    });
  }

  showCard(hs) {
    if (!this.cardElement) return;
    this.cardElement.querySelector('#card-cat').textContent = hs.category || 'TELEMETRY';
    this.cardElement.querySelector('#card-title').textContent = hs.title;
    this.cardElement.querySelector('#card-desc').textContent = hs.description;

    if (this.modalOverlay) {
      this.modalOverlay.classList.add('active');
      this.modalOverlay.setAttribute('aria-hidden', 'false');
    }
    this.cardElement.classList.add('visible');
    audio.playBeep();
  }

  closeCard() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('active');
      this.modalOverlay.setAttribute('aria-hidden', 'true');
    }
    if (this.cardElement) {
      this.cardElement.classList.remove('visible');
    }
  }

  /**
   * Backward-compatible helper for Apollo 11 timeline trigger
   */
  setActiveMachine(machineObject, isVisible = true) {
    if (this.is360Active) return;
    if (isVisible && machineObject) {
      this.build360Hotspots('apollo11', machineObject);
    } else {
      if (this.container) this.container.innerHTML = '';
      this.activeHotspots = [];
    }
  }

  /**
   * Called every frame in requestAnimationFrame loop
   */
  update() {
    const dt = 0.016;

    // 1. IN 360° INSPECTION MODE: Exclusive Camera Spherical Orbit Controls
    if (this.is360Active) {
      // Auto-rotation turntable when user is idle
      const now = performance.now();
      if (this.autoRotate && !this.isDragging && now - this.lastInteractionTime > 1800) {
        this.targetTheta += dt * 0.16; // Gentle 360° spin
      }

      // Smooth damping interpolation (luxurious, silky feel)
      this.theta += (this.targetTheta - this.theta) * 0.12;
      this.phi += (this.targetPhi - this.phi) * 0.12;
      this.radius += (this.targetRadius - this.radius) * 0.12;

      // Calculate 3D spherical position centered at machine
      const targetCamPos = new THREE.Vector3(
        this.machineCenter.x + this.radius * Math.sin(this.theta) * Math.cos(this.phi),
        this.machineCenter.y + this.radius * Math.sin(this.phi),
        this.machineCenter.z + this.radius * Math.cos(this.theta) * Math.cos(this.phi)
      );

      // Positive ground clearance safeguard
      const minAlt = this.app.flightController ? this.app.flightController.getMinTerrainAltitude(targetCamPos.x, targetCamPos.z) : -100;
      targetCamPos.y = Math.max(targetCamPos.y, minAlt + 1.15);

      // Smooth fly-in transition from previous position
      if (this.transitionProgress < 1.0) {
        this.transitionProgress = Math.min(1.0, this.transitionProgress + dt * 2.2);
        const ease = 1 - Math.pow(1 - this.transitionProgress, 3);
        this.camera.position.lerpVectors(this.transitionFromPos, targetCamPos, ease);
        this.camera.lookAt(this.machineCenter);
      } else {
        this.camera.position.copy(targetCamPos);
        this.camera.lookAt(this.machineCenter);
      }

      // Keep camera FOV focused
      this.camera.fov = 44;
      this.camera.updateProjectionMatrix();

      // Project 360 Hotspots to screen space
      this.updateHotspotsScreenPositions();
      return;
    }

    // 2. OUTSIDE 360 MODE: Update any active timeline hotspots
    if (this.activeHotspots.length > 0) {
      this.updateHotspotsScreenPositions();
    }
  }

  updateHotspotsScreenPositions() {
    if (this.activeHotspots.length === 0 || !this.currentMachineGroup) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const worldPos = new THREE.Vector3();
    const ndcPos = new THREE.Vector3();

    this.activeHotspots.forEach((hs) => {
      worldPos.copy(hs.pos3D);
      this.currentMachineGroup.localToWorld(worldPos);

      const dist = this.camera.position.distanceTo(worldPos);
      if (dist > 35 || dist < 0.6) {
        hs.element.style.display = 'none';
        return;
      }

      ndcPos.copy(worldPos).project(this.camera);

      // Frustum check
      if (ndcPos.z > 1.0 || ndcPos.z < -1.0 || Math.abs(ndcPos.x) > 1.05 || Math.abs(ndcPos.y) > 1.05) {
        hs.element.style.display = 'none';
        return;
      }

      const screenX = (ndcPos.x * 0.5 + 0.5) * width;
      const screenY = (-(ndcPos.y * 0.5) + 0.5) * height;

      hs.element.style.display = 'flex';
      hs.element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
    });
  }
}
