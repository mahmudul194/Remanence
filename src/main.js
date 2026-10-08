/**
 * REMANENCE: What remains.
 * NASA Space Apps Challenge - Team Apollo 404
 * Main Application Orchestrator
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { createSpaceScene } from './scenes/space.js';
import { createMoonScene } from './scenes/moon.js';
import { createMarsScene } from './scenes/mars.js';
import { createParticleManager } from './effects/particles.js';
import { PingRingManager } from './effects/pingRing.js';
import { createPostProcessing } from './effects/postfx.js';
import { StoryTimeline } from './story/timeline.js';
import { STORY_DATA } from './story/data.js';
import { audio } from './audio.js';

class RemanenceApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.initWebGL();
    this.initLenis();
    this.initLoadingSequence();
  }

  initWebGL() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020306);
    this.scene.fog = new THREE.FogExp2(0x020306, 0.0018);

    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 2000);
    this.camera.position.set(0, 0.2, 24);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 3. Image-Based Lighting (IBL) Environment Map (Rolex watch standard)
    new RGBELoader().load('./textures/lobe.hdr', (envTexture) => {
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = envTexture;
      this.scene.environmentIntensity = 1.35;
    });

    // 4. Effects Managers
    this.pingManager = new PingRingManager(this.scene);
    this.particles = createParticleManager(this.scene);
    this.postfx = createPostProcessing(this.renderer, this.scene, this.camera);

    // Resize listener
    window.addEventListener('resize', () => this.onResize());
  }

  initLenis() {
    // Lenis Smooth Scroll synchronised with GSAP's ticker
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false
    });

    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  async initLoadingSequence() {
    const loaderBar = document.getElementById('loader-bar-fill');
    const loaderStatus = document.getElementById('loader-status');
    const loaderDef = document.getElementById('loader-definition');
    const btnEnter = document.getElementById('btn-enter');
    const loaderOverlay = document.getElementById('loader-overlay');

    // Simulated progress telemetry
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
      loaderBar.style.width = `${progress}%`;
    }, 120);

    // 1. Build Space and Moon Scene
    this.spaceScene = createSpaceScene();
    this.scene.add(this.spaceScene.group);

    this.moonScene = await createMoonScene();
    this.scene.add(this.moonScene.group);

    // 2. Build Mars Scene (lazy / parallel)
    this.marsScene = await createMarsScene();
    this.scene.add(this.marsScene.group);

    // Initial scene isolation: Only Space/Earth is visible. Moon and Mars terrain hidden.
    this.spaceScene.group.visible = true;
    this.moonScene.group.visible = false;
    this.marsScene.group.visible = false;

    // 3. Timeline & GSAP triggers
    this.timeline = new StoryTimeline(this);

    // Telemetry ping audio
    audio.playPing(1100, 0.4);

    // Telemetry text progression
    setTimeout(() => {
      loaderStatus.textContent = '> SIGNAL LOCKED. DEEP SPACE TELEMETRY VERIFIED.';
    }, 1000);

    setTimeout(() => {
      loaderDef.classList.add('show');
      btnEnter.classList.add('show');
    }, 1600);

    // User gesture unlock listener (Click, Enter, Space, or Wheel/Touch)
    const startJourney = () => {
      audio.unlock();
      loaderOverlay.classList.add('hidden');
      loaderOverlay.style.pointerEvents = 'none';

      setTimeout(() => {
        loaderOverlay.style.display = 'none';
      }, 1200);

      // Start and sync Lenis & ScrollTrigger now that content is visible
      this.lenis.start();
      this.lenis.resize();
      ScrollTrigger.refresh();

      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouch);
    };

    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') startJourney();
    };

    const onWheel = () => {
      if (btnEnter.classList.contains('show')) startJourney();
    };

    const onTouch = () => {
      if (btnEnter.classList.contains('show')) startJourney();
    };

    btnEnter.addEventListener('click', startJourney);
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });

    // Setup interactive card clicks and HUD actions
    this.initHUDControls();
    this.initCardInteractions();

    // Start render loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  initCardInteractions() {
    const sections = document.querySelectorAll('.story-section');
    sections.forEach((sec, idx) => {
      const card = sec.querySelector('.mission-card');
      if (!card) return;

      // Add clickable hint badge to card header
      const header = card.querySelector('.card-header');
      if (header && !header.querySelector('.card-hint')) {
        const hint = document.createElement('span');
        hint.className = 'card-hint';
        hint.textContent = '[ CLICK TO PING ]';
        header.appendChild(hint);
      }

      card.addEventListener('click', (e) => {
        audio.unlock();
        audio.playPing(780, 0.9);
        audio.playKeyClick();

        // Highlight card animation
        card.classList.add('ping-active');
        setTimeout(() => card.classList.remove('ping-active'), 800);

        // Smooth scroll right to this section
        this.lenis.scrollTo(sec, { offset: 0, duration: 1.2 });

        // Trigger in-scene 3D radar pulse
        const secData = STORY_DATA.sections[idx];
        if (secData && this.timeline) {
          const machine = this.timeline.getMachineForSection(secData.id);
          if (machine) {
            const worldPos = new THREE.Vector3();
            machine.getWorldPosition(worldPos);
            this.pingManager.triggerPing(worldPos, secData.glowColor || 0x4df0ff, 40, 3.2);
          }
        }
      });
    });

    // Make HUD bottom dock interactive
    const scrollDock = document.querySelector('.scroll-indicator');
    if (scrollDock) {
      scrollDock.style.cursor = 'pointer';
      scrollDock.style.pointerEvents = 'auto';
      scrollDock.title = 'Click to jump to next station';
      scrollDock.addEventListener('click', () => {
        const curIdx = this.timeline ? this.timeline.currentSectionIndex : 0;
        const nextIdx = Math.min(curIdx + 1, sections.length - 1);
        this.lenis.scrollTo(sections[nextIdx], { offset: 0, duration: 1.2 });
        audio.playKeyClick();
      });
    }

    const targetDock = document.querySelector('.target-item');
    if (targetDock) {
      targetDock.style.cursor = 'pointer';
      targetDock.style.pointerEvents = 'auto';
      targetDock.title = 'Click to focus on current station';
      targetDock.addEventListener('click', () => {
        const curIdx = Math.max(this.timeline ? this.timeline.currentSectionIndex : 0, 0);
        this.lenis.scrollTo(sections[curIdx], { offset: 0, duration: 1.0 });
        audio.playPing(920, 0.5);
      });
    }

    const coordsDock = document.querySelector('#hud-coords');
    if (coordsDock) {
      coordsDock.parentElement.style.cursor = 'pointer';
      coordsDock.parentElement.style.pointerEvents = 'auto';
      coordsDock.parentElement.title = 'Click to copy coordinates';
      coordsDock.parentElement.addEventListener('click', () => {
        navigator.clipboard.writeText(coordsDock.textContent);
        const originalText = coordsDock.textContent;
        coordsDock.textContent = 'COORDINATES COPIED!';
        audio.playKeyClick();
        setTimeout(() => {
          coordsDock.textContent = originalText;
        }, 1500);
      });
    }
  }

  initHUDControls() {
    // Audio toggle
    const btnAudio = document.getElementById('btn-audio');
    const audioIcon = document.getElementById('audio-icon');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        audio.unlock();
        const isMuted = audio.toggleMute();
        audioIcon.textContent = isMuted ? 'AUDIO: MUTED' : 'AUDIO: ON';
        btnAudio.style.borderColor = isMuted ? 'var(--red-silent)' : 'var(--cyan-telemetry)';
      });
    }

    // Quality toggle
    const btnQuality = document.getElementById('btn-quality');
    if (btnQuality) {
      btnQuality.addEventListener('click', () => {
        const currentHigh = this.postfx.isHighQuality;
        const newQuality = currentHigh ? 'low' : 'high';
        this.postfx.setQuality(newQuality);
        btnQuality.querySelector('.btn-label').textContent = `GFX: ${newQuality.toUpperCase()}`;
      });
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.postfx.resize(this.width, this.height);

    if (this.lenis) {
      this.lenis.resize();
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Update scenes
    if (this.spaceScene && this.spaceScene.update) {
      this.spaceScene.update(delta);
    }

    // Update particles & pulse rings
    if (this.particles && this.particles.update) {
      this.particles.update(delta);
    }
    if (this.pingManager && this.pingManager.update) {
      this.pingManager.update();
    }

    // Render through Post-processing pipeline
    this.postfx.render(elapsedTime);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new RemanenceApp();
});
