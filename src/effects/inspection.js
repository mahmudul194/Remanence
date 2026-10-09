/**
 * REMANENCE: Interactive Hardware Inspection & Weathering Controls
 * Projects 3D technical hotspots to screen space, manages inspection HUD cards,
 * and orchestrates the 1969 As Landed vs Today (57 Yrs) weathering time-travel slider.
 */

import * as THREE from 'three';
import { setLunarWeathering } from '../materials/weatheringShader.js';
import { audio } from '../audio.js';

export class InspectionManager {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.activeHotspots = [];
    this.container = null;
    this.weatheringContainer = null;
    this.cardElement = null;
    this.currentMachine = null;
    this.weatheringValue = 0.58; // Default aged state
    this.isVisible = false;

    this.initDOM();
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

    // 2. Inspection Technical Modal Dialog
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

      // Close on backdrop click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeCard();
        }
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

    // 3. Weathering Chronology Slider Widget
    let wCtrl = document.getElementById('weathering-control');
    if (!wCtrl) {
      wCtrl = document.createElement('div');
      wCtrl.id = 'weathering-control';
      wCtrl.className = 'weathering-control';
      wCtrl.innerHTML = `
        <div class="wc-header">
          <span class="wc-label">CHRONOLOGY // EXPOSURE</span>
          <span class="wc-state" id="wc-state-text">TODAY (57 YRS IN VACUUM)</span>
        </div>
        <div class="wc-slider-row">
          <button class="wc-btn" id="btn-1969" title="Reset to touchdown">1969 LANDED</button>
          <input type="range" min="0" max="100" value="58" id="wc-slider" class="wc-slider" />
          <button class="wc-btn active" id="btn-today" title="Set to present day">TODAY</button>
        </div>
      `;
      document.body.appendChild(wCtrl);

      const slider = wCtrl.querySelector('#wc-slider');
      const btn1969 = wCtrl.querySelector('#btn-1969');
      const btnToday = wCtrl.querySelector('#btn-today');
      const stateText = wCtrl.querySelector('#wc-state-text');

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.setWeathering(val);
        this.updateButtons(val, btn1969, btnToday, stateText);
      });

      btn1969.addEventListener('click', () => {
        slider.value = '0';
        this.setWeathering(0.0);
        this.updateButtons(0.0, btn1969, btnToday, stateText);
      });

      btnToday.addEventListener('click', () => {
        slider.value = '100';
        this.setWeathering(1.0);
        this.updateButtons(1.0, btn1969, btnToday, stateText);
      });
    }
    this.weatheringContainer = wCtrl;

    // Set initial weathering state
    setLunarWeathering(this.weatheringValue);
  }

  updateButtons(val, b1, b2, txt) {
    b1.classList.toggle('active', val < 0.2);
    b2.classList.toggle('active', val > 0.8);

    if (val < 0.15) {
      txt.textContent = '1969 TOUCHDOWN (PRISTINE)';
    } else if (val > 0.85) {
      txt.textContent = 'TODAY (57 YRS VACUUM EXPOSURE)';
    } else {
      txt.textContent = `AGE TRANSITION: ${Math.round(val * 57)} YEARS`;
    }
    audio.playPing();
  }

  setWeathering(val) {
    this.weatheringValue = val;
    setLunarWeathering(val);
  }

  /**
   * Set active machine whose hotspots should be shown (e.g. Apollo 11)
   */
  setActiveMachine(machineObject, isVisible = true) {
    this.currentMachine = machineObject;
    this.isVisible = isVisible;

    // Clear old hotspot elements
    this.container.innerHTML = '';
    this.activeHotspots = [];

    if (!isVisible || !machineObject || !machineObject.hotspots) {
      if (this.weatheringContainer) this.weatheringContainer.classList.remove('visible');
      this.closeCard();
      return;
    }

    if (this.weatheringContainer) {
      this.weatheringContainer.classList.add('visible');
    }

    // Build DOM elements for each hotspot
    machineObject.hotspots.forEach((hs, idx) => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker';
      el.innerHTML = `
        <div class="hs-ping"></div>
        <div class="hs-core"></div>
        <div class="hs-label">${hs.title}</div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCard(hs);
      });

      this.container.appendChild(el);
      this.activeHotspots.push({
        data: hs,
        element: el,
        pos3D: hs.position.clone()
      });
    });
  }

  showCard(hs) {
    if (!this.cardElement) return;
    this.lastFocusedElement = document.activeElement;

    this.cardElement.querySelector('#card-cat').textContent = hs.category;
    this.cardElement.querySelector('#card-title').textContent = hs.title;
    this.cardElement.querySelector('#card-desc').textContent = hs.description;

    // Show backdrop overlay & dialog
    if (this.modalOverlay) {
      this.modalOverlay.classList.add('active');
      this.modalOverlay.setAttribute('aria-hidden', 'false');
    }
    this.cardElement.classList.add('visible');

    // Lock page scroll
    document.body.classList.add('modal-open');

    // Trap focus and set up Escape listener
    const closeBtn = this.cardElement.querySelector('#card-close');
    if (closeBtn) closeBtn.focus();

    this.onModalKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeCard();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = this.cardElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', this.onModalKeyDown);

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

    // Unlock page scroll
    document.body.classList.remove('modal-open');

    // Remove key listener
    if (this.onModalKeyDown) {
      window.removeEventListener('keydown', this.onModalKeyDown);
      this.onModalKeyDown = null;
    }

    // Restore focus
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
  }

  /**
   * Called every frame from requestAnimationFrame loop
   */
  update() {
    if (!this.isVisible || !this.currentMachine || this.activeHotspots.length === 0) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const worldPos = new THREE.Vector3();
    const ndcPos = new THREE.Vector3();

    this.activeHotspots.forEach((hs) => {
      // Calculate true world position using Three.js scene graph transformation
      worldPos.copy(hs.pos3D);
      this.currentMachine.localToWorld(worldPos);

      // Distance check for fading
      const dist = this.camera.position.distanceTo(worldPos);
      if (dist > 45 || dist < 0.8) {
        hs.element.style.display = 'none';
        return;
      }

      // Project into normalized device coordinates [-1, 1]
      ndcPos.copy(worldPos).project(this.camera);

      // Check if behind camera or outside frustum
      if (ndcPos.z > 1.0 || ndcPos.z < -1.0 || Math.abs(ndcPos.x) > 1.1 || Math.abs(ndcPos.y) > 1.1) {
        hs.element.style.display = 'none';
        return;
      }

      // Screen coordinates
      const screenX = (ndcPos.x * 0.5 + 0.5) * width;
      const screenY = (-(ndcPos.y * 0.5) + 0.5) * height;

      hs.element.style.display = 'flex';
      hs.element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
    });
  }
}
