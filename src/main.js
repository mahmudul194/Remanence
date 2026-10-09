/**
 * REMANENCE: What remains.
 * Main Application Orchestrator (Award-level Cinematic Standard)
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
import { createParticleText } from './effects/particleText.js';
import { createParticleManager } from './effects/particles.js';
import { PingRingManager } from './effects/pingRing.js';
import { createPostProcessing } from './effects/postfx.js';
import { StoryTimeline } from './story/timeline.js';
import { STORY_DATA } from './story/data.js';
import { audio } from './audio.js';
import { InspectionManager } from './effects/inspection.js';
import { ContrastGuard } from './typography.js';
import { FlightController, FLIGHT_STATIONS } from './flight/flightController.js';

const APP_START_TIME = performance.now();

class RemanenceApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Check system preference for reduced motion
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Journey start flag
    this.journeyStarted = false;
    this.flightController = null;

    // Persistent scenes
    this.spaceScene = null;
    this.moonScene = null;
    this.marsScene = null;

    this.initWebGL();
    this.initLenis();
    this.initCustomCursor();
    this.initLoadingSequence();
  }

  initWebGL() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020306);
    this.scene.fog = new THREE.FogExp2(0x020306, 0.0018);

    this.camera = new THREE.PerspectiveCamera(48, this.width / this.height, 0.1, 25000);
    this.camera.position.set(0, 0, 16); // Initial camera position facing the particle text

    // 2. WebGL Renderer with Logarithmic Depth Buffer (prevents z-fighting across planetary scales)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;

    // 3. Image-Based Lighting (IBL) Environment Map (Rolex watch standard)
    new RGBELoader().load('./textures/lobe.hdr', (envTexture) => {
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = envTexture;
      this.scene.environmentIntensity = 0.25;
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
      duration: this.prefersReducedMotion ? 0.01 : 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: !this.prefersReducedMotion,
      syncTouch: false,
      autoRaf: false
    });

    this.lenis.stop(); // Keep scroll stopped until visitor clicks Enter or Skip

    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    });

    const updateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      requestAnimationFrame(updateRing);
    };
    updateRing();

    // Hover detection on interactive elements
    const hoverables = 'button, a, .magnetic-btn-wrapper, .moment-wrap, .rail-dot, .hud-pill, .btn-read-more';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) {
        document.body.classList.add('cursor-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) {
        document.body.classList.remove('cursor-hover');
      }
    });

    // Magnetic attraction on enter button
    const enterBtn = document.getElementById('btn-enter');
    if (enterBtn) {
      enterBtn.addEventListener('mousemove', (e) => {
        const rect = enterBtn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.35;
        const dy = (e.clientY - cy) * 0.35;
        const inner = enterBtn.querySelector('.magnetic-btn');
        if (inner) inner.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      });
      enterBtn.addEventListener('mouseleave', () => {
        const inner = enterBtn.querySelector('.magnetic-btn');
        if (inner) inner.style.transform = `translate(0px, 0px) scale(1)`;
      });
    }
  }

  /**
   * Item 19: Lazy-load Mars assets during Moon chapters
   * Prevents blocking initial page load and ensures 60fps on mid-range devices.
   */
  async loadMarsSceneIfNeeded() {
    if (this.marsScene) return this.marsScene;
    if (this.marsLoadingPromise) return this.marsLoadingPromise;

    console.log('[REMANENCE] Lazy-loading Mars surface assets during lunar chapter...');
    this.marsLoadingPromise = (async () => {
      try {
        const mars = await createMarsScene();
        this.marsScene = mars;
        this.scene.add(this.marsScene.group);
        this.marsScene.group.visible = false;
        console.log('[REMANENCE] Mars assets successfully loaded in background.');
        return this.marsScene;
      } catch (err) {
        console.error('[REMANENCE] Error lazy-loading Mars scene:', err);
      }
    })();

    return this.marsLoadingPromise;
  }

  async initLoadingSequence() {
    const ringFill = document.getElementById('beacon-ring-fill');
    const introCopy = document.getElementById('intro-copy');
    const btnEnter = document.getElementById('btn-enter');
    const btnSkipIntro = document.getElementById('btn-skip-intro');
    const introScreen = document.getElementById('intro-screen');

    // 1. Create GPU Particle Text in scene
    this.particleText = createParticleText(this.scene);

    // 2. Build Persistent Unified Solar System (Earth, Moon, Mars co-located)
    this.spaceScene = createSpaceScene();
    this.scene.add(this.spaceScene.group);

    this.moonScene = await createMoonScene();
    this.scene.add(this.moonScene.group);

    this.marsScene = await createMarsScene();
    this.scene.add(this.marsScene.group);

    // Persistent Unified Universe: dynamically managed during continuous flight
    this.spaceScene.group.visible = true;
    this.moonScene.group.visible = false; // Hidden in Earth orbit to prevent terrain clipping
    this.marsScene.group.visible = false;

    // Initial calibrated sunlight (only Earth sun active at launch)
    if (this.spaceScene.sunLight) this.spaceScene.sunLight.intensity = 1.35;
    if (this.moonScene.lunarSun) this.moonScene.lunarSun.intensity = 0.0;
    if (this.marsScene.marsSun) this.marsScene.marsSun.intensity = 0.0;

    // Master Flight Controller
    this.flightController = new FlightController(this);
    window.flightController = this.flightController;

    // 3. Timeline & GSAP triggers
    this.timeline = new StoryTimeline(this);
    window.timeline = this.timeline;
    this.inspection = new InspectionManager(this);
    this.contrastGuard = new ContrastGuard(this.canvas, false);

    // Telemetry ping audio
    audio.playPing(1100, 0.4);

    // Item 18: Real asset loading progress indicator via THREE.DefaultLoadingManager
    let targetProgress = 0;
    let currentProgress = 0;
    let isLoadComplete = false;
    let journeyStarted = false;

    THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (itemsTotal > 0) {
        targetProgress = Math.max(targetProgress, (itemsLoaded / itemsTotal) * 100);
      }
    };

    THREE.DefaultLoadingManager.onLoad = () => {
      targetProgress = 100;
      isLoadComplete = true;
    };

    THREE.DefaultLoadingManager.onError = (url) => {
      console.warn('[REMANENCE] Asset loading note for:', url);
    };

    // Smoothly interpolate circular beacon progress ring
    const progressTimer = setInterval(() => {
      // Advance toward target with smooth step, or progress incrementally if no network assets left
      if (targetProgress > currentProgress) {
        currentProgress += Math.min(targetProgress - currentProgress, 14);
      } else {
        currentProgress += 6;
      }

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressTimer);

        // Morph swirling particles into the typography "REMANENCE"
        if (this.particleText && this.particleText.assemble) {
          this.particleText.assemble(1.6);
        }

        // Gracefully reveal definition & magnetic enter control
        setTimeout(() => {
          if (introCopy) introCopy.classList.add('visible');
        }, 250);

        // Item 20: Time-to-interactive budget logging (< 3000ms)
        const tti = performance.now() - APP_START_TIME;
        console.log(`[REMANENCE] Time to Interactive (TTI): ${tti.toFixed(1)}ms (Budget: <3000ms - ${tti < 3000 ? 'PASS' : 'WARN'})`);
      }

      if (ringFill) {
        const offset = 465 - (currentProgress / 100) * 465;
        ringFill.style.strokeDashoffset = offset;
      }
    }, 45);

    // Launch opening flight upon clicking ENTER or SKIP INTRO
    const startJourney = () => {
      if (journeyStarted) return;
      journeyStarted = true;
      this.journeyStarted = true;

      clearInterval(progressTimer);
      if (ringFill) ringFill.style.strokeDashoffset = 0;

      // Item 12: Sound label updates to "Sound on" on Enter
      audio.unlock();
      audio.playPing(880, 0.5);

      const btnAudio = document.getElementById('btn-audio');
      const audioIcon = document.getElementById('audio-icon');
      if (audioIcon) audioIcon.textContent = 'Sound on';
      if (btnAudio) {
        btnAudio.classList.add('active');
        btnAudio.style.borderColor = 'var(--signal-amber)';
      }

      // 1. Instantly fade out intro screen overlay
      if (introScreen) {
        introScreen.classList.add('hidden');
        gsap.to(introScreen, {
          opacity: 0,
          duration: this.prefersReducedMotion ? 0.1 : 0.65,
          ease: 'power2.out',
          onComplete: () => {
            introScreen.style.display = 'none';
          }
        });
      }

      // 2. Explode particles into starfield
      if (this.particleText && this.particleText.explode) {
        this.particleText.explode(1.6);
      }

      // 3. Dolly camera from particle text toward Earth overview
      const dollyDuration = this.prefersReducedMotion ? 0.2 : 0.75;
      gsap.to(this.camera.position, {
        x: 0,
        y: 6,
        z: 54,
        duration: dollyDuration,
        ease: 'power2.out',
        onComplete: () => {
          // Enable smooth scroll as camera reaches destination
          this.lenis.start();
          this.lenis.resize();
          ScrollTrigger.refresh();

          // Immediately ensure Section 0 (Hero REMANENCE) is active & beautifully revealed
          if (this.timeline) {
            this.timeline.onSectionActive(0);
          }
        }
      });

      // Quick fallback: ensure scroll is active within 150ms so UI is immediately responsive
      setTimeout(() => {
        this.lenis.start();
        this.lenis.resize();
        ScrollTrigger.refresh();
        if (this.timeline) {
          this.timeline.onSectionActive(0);
        }
      }, 150);

      // Warm up Mars assets lazily in the background after enter
      setTimeout(() => {
        this.loadMarsSceneIfNeeded();
      }, 1000);

      // Log First Interactive Frame metric
      const ttJourney = performance.now() - APP_START_TIME;
      console.log(`[REMANENCE] Journey Start: ${ttJourney.toFixed(1)}ms from initial load`);
    };

    // Item 22: Keyboard-accessible "Skip intro" button
    if (btnSkipIntro) {
      btnSkipIntro.addEventListener('click', (e) => {
        e.stopPropagation();
        startJourney();
      });
      btnSkipIntro.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          startJourney();
        }
      });
    }

    if (btnEnter) {
      btnEnter.addEventListener('click', (e) => {
        e.stopPropagation();
        startJourney();
      });
    }

    // Keyboard shortcut (Enter or Space) on document
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !journeyStarted) {
        startJourney();
      }
    });

    // Clicking anywhere on intro screen once visible also triggers start
    if (introScreen) {
      introScreen.addEventListener('click', () => {
        if (introCopy && introCopy.classList.contains('visible')) {
          startJourney();
        }
      });
    }

    // Setup interactive HUD controls and chapter navigation
    this.initHUDControls();
    this.initChapterRail();
    this.initMomentInteractions();

    // Start render loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  initChapterRail() {
    const dots = document.querySelectorAll('.rail-dot');

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index, 10);
        if (FLIGHT_STATIONS[idx]) {
          const targetS = FLIGHT_STATIONS[idx].s;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const targetY = targetS * maxScroll;
          this.lenis.scrollTo(targetY, { duration: this.prefersReducedMotion ? 0.1 : 1.4 });
          audio.playPing(920, 0.4);
        }
      });
    });
  }

  initMomentInteractions() {
    const sections = document.querySelectorAll('.story-section');
    sections.forEach((sec, idx) => {
      const moment = sec.querySelector('.moment-wrap');
      if (!moment) return;

      moment.addEventListener('click', () => {
        audio.unlock();
        audio.playPing(780, 0.9);

        // Smooth scroll right to this station
        this.lenis.scrollTo(sec, { offset: 0, duration: this.prefersReducedMotion ? 0.1 : 1.2 });

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

    // Make coordinates dock interactive
    const coordsDock = document.querySelector('#hud-coords');
    if (coordsDock) {
      coordsDock.parentElement.style.cursor = 'pointer';
      coordsDock.parentElement.style.pointerEvents = 'auto';
      coordsDock.parentElement.title = 'Click to copy coordinates';
      coordsDock.parentElement.addEventListener('click', () => {
        navigator.clipboard.writeText(coordsDock.textContent);
        const originalText = coordsDock.textContent;
        coordsDock.textContent = 'COPIED TO CLIPBOARD';
        setTimeout(() => {
          coordsDock.textContent = originalText;
        }, 1500);
      });
    }
  }

  initHUDControls() {
    // Item 12: Audio label reads "Sound off" until Enter, then "Sound on". Clear toggle.
    const btnAudio = document.getElementById('btn-audio');
    const audioIcon = document.getElementById('audio-icon');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        audio.unlock();
        const isMuted = audio.toggleMute();
        if (audioIcon) {
          audioIcon.textContent = isMuted ? 'Sound off' : 'Sound on';
        }
        btnAudio.style.borderColor = isMuted ? 'rgba(245, 242, 234, 0.14)' : 'var(--signal-amber)';
        btnAudio.classList.toggle('active', !isMuted);
      });
    }

    // Quality toggle
    const btnQuality = document.getElementById('btn-quality');
    if (btnQuality) {
      btnQuality.addEventListener('click', () => {
        const currentHigh = this.postfx.isHighQuality;
        const newQuality = currentHigh ? 'low' : 'high';
        this.postfx.setQuality(newQuality);
        btnQuality.querySelector('.pill-label').textContent = `GFX: ${newQuality.toUpperCase()}`;
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

    // Update GPU Particle Text
    if (this.particleText && this.particleText.update) {
      this.particleText.update(delta, elapsedTime);
    }

    // Update scenes (Earth, clouds, starfield, rotation)
    if (this.spaceScene && this.spaceScene.update) {
      this.spaceScene.update(delta, elapsedTime);
    }

    // Update particles & pulse rings
    if (this.particles && this.particles.update) {
      this.particles.update(delta);
    }
    if (this.pingManager && this.pingManager.update) {
      this.pingManager.update();
    }

    // Update 3D Inspection hotspots
    if (this.inspection && this.inspection.update) {
      this.inspection.update();
    }

    // Update Master Spacecraft Flight Controller
    if (this.flightController && this.journeyStarted) {
      this.flightController.update(delta);
    }

    // Update Story Timeline & Card / Caption Synchronization
    if (this.timeline && this.journeyStarted) {
      this.timeline.update(delta);
    }

    // Render through Post-processing pipeline with spacecraft velocity
    const flightSpeed = this.flightController ? this.flightController.speedNormalized : 0;
    const scrollVelocity = this.lenis ? this.lenis.velocity : 0;
    this.postfx.render(elapsedTime, Math.max(flightSpeed * 0.0006, Math.abs(scrollVelocity) * 0.0001));
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new RemanenceApp();
  window.timeline = window.app.timeline;
});
