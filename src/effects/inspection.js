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

    // 2. Inspection Technical Card
    let card = document.getElementById('inspection-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'inspection-card';
      card.className = 'inspection-card';
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-header">
            <span class="card-category" id="card-cat">PROPULSION</span>
            <button class="card-close" id="card-close" title="Dismiss">✕</button>
          </div>
          <h3 class="card-title" id="card-title">Descent Propulsion System</h3>
          <p class="card-desc" id="card-desc">Gimbaled 10,500 lbf throttleable rocket engine.</p>
          <div class="card-footer">
            <span class="card-ref">APOLLO 11 // NASA MSC-01855</span>
            <span class="card-status">ARTIFACT SECURED</span>
          </div>
        </div>
      `;
      document.body.appendChild(card);

      const closeBtn = card.querySelector('#card-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeCard();
        });
      }
    }
    this.cardElement = card;

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
    this.cardElement.querySelector('#card-cat').textContent = hs.category;
    this.cardElement.querySelector('#card-title').textContent = hs.title;
    this.cardElement.querySelector('#card-desc').textContent = hs.description;
    this.cardElement.classList.add('visible');
    audio.playBeep();
  }

  closeCard() {
    if (this.cardElement) {
      this.cardElement.classList.remove('visible');
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
    const parentPos = this.currentMachine.parent
      ? this.currentMachine.parent.position
      : new THREE.Vector3();

    const tempV = new THREE.Vector3();

    this.activeHotspots.forEach((hs) => {
      // Calculate world position: hotspot local + machine local + moon scene group
      tempV.copy(hs.pos3D)
        .add(this.currentMachine.position)
        .add(parentPos);

      // Project into normalized device coordinates [-1, 1]
      tempV.project(this.camera);

      // Check if behind camera or outside frustum
      const isBehind = tempV.z > 1.0 || tempV.z < -1.0;
      if (isBehind) {
        hs.element.style.display = 'none';
        return;
      }

      // Screen coordinates
      const screenX = (tempV.x * 0.5 + 0.5) * width;
      const screenY = (-(tempV.y * 0.5) + 0.5) * height;

      // Distance check for fading
      const dist = this.camera.position.distanceTo(
        hs.pos3D.clone().add(this.currentMachine.position).add(parentPos)
      );

      if (dist > 35 || dist < 1.0) {
        hs.element.style.display = 'none';
      } else {
        hs.element.style.display = 'flex';
        hs.element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
      }
    });
  }
}
