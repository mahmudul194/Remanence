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

class RemanenceApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

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

    this.camera = new THREE.PerspectiveCamera(48, this.width / this.height, 0.1, 2000);
    this.camera.position.set(0, 0, 16); // Initial camera position facing the particle text

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
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false
    });

    this.lenis.stop(); // Keep scroll stopped until visitor clicks Enter

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
    const hoverables = 'button, a, .magnetic-btn-wrapper, .moment-wrap, .rail-dot, .hud-pill';
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
        enterBtn.querySelector('.magnetic-btn').style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      });
      enterBtn.addEventListener('mouseleave', () => {
        enterBtn.querySelector('.magnetic-btn').style.transform = `translate(0px, 0px) scale(1)`;
      });
    }
  }

  async initLoadingSequence() {
    const ringFill = document.getElementById('beacon-ring-fill');
    const introCopy = document.getElementById('intro-copy');
    const btnEnter = document.getElementById('btn-enter');
    const introScreen = document.getElementById('intro-screen');

    // 1. Create GPU Particle Text in scene
    this.particleText = createParticleText(this.scene);

    // 2. Build Space and Moon Scene
    this.spaceScene = createSpaceScene();
    this.scene.add(this.spaceScene.group);

    this.moonScene = await createMoonScene();
    this.scene.add(this.moonScene.group);

    // 3. Build Mars Scene
    this.marsScene = await createMarsScene();
    this.scene.add(this.marsScene.group);

    // Initial scene isolation: Only Space is visible. Moon and Mars terrain hidden.
    this.spaceScene.group.visible = true;
    this.moonScene.group.visible = false;
    this.marsScene.group.visible = false;

    // 4. Timeline & GSAP triggers
    this.timeline = new StoryTimeline(this);
    this.inspection = new InspectionManager(this);
    this.contrastGuard = new ContrastGuard(this.canvas, false);

    // Telemetry ping audio
    audio.playPing(1100, 0.4);

    // Simulated asset telemetry loading progress (updating SVG ring)
    let loadProgress = 0;
    const progressInterval = setInterval(() => {
      loadProgress += Math.floor(Math.random() * 14) + 6;
      if (loadProgress >= 100) {
        loadProgress = 100;
        clearInterval(progressInterval);

        // Morph swirling particles into the typography "REMANENCE"
        this.particleText.assemble(2.4);

        // Gracefully reveal definition & magnetic enter control
        setTimeout(() => {
          if (introCopy) introCopy.classList.add('visible');
        }, 800);
      }
      if (ringFill) {
        const offset = 465 - (loadProgress / 100) * 465;
        ringFill.style.strokeDashoffset = offset;
      }
    }, 110);

    // Launch opening flight upon clicking ENTER
    const startJourney = () => {
      audio.unlock();
      audio.playPing(880, 0.5);

      // 1. Explode particles into starfield
      this.particleText.explode(2.2);

      // 2. Dolly camera from particle text toward Earth overview
      gsap.to(this.camera.position, {
        x: 0,
        y: 6,
        z: 52,
        duration: 2.8,
        ease: 'power2.inOut',
        onComplete: () => {
          if (introScreen) {
            introScreen.classList.add('hidden');
            setTimeout(() => {
              introScreen.style.display = 'none';
            }, 1600);
          }

          // Enable smooth scroll now that journey begins
          this.lenis.start();
          this.lenis.resize();
          ScrollTrigger.refresh();
        }
      });
    };

    if (btnEnter) {
      btnEnter.addEventListener('click', startJourney);
    }

    // Keyboard shortcut (Enter or Space)
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && introCopy.classList.contains('visible')) {
        startJourney();
      }
    });

    // Setup interactive HUD controls and chapter navigation
    this.initHUDControls();
    this.initChapterRail();
    this.initMomentInteractions();

    // Start render loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  initChapterRail() {
    const sections = document.querySelectorAll('.story-section');
    const dots = document.querySelectorAll('.rail-dot');

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index, 10);
        if (sections[idx]) {
          this.lenis.scrollTo(sections[idx], { offset: 0, duration: 1.4 });
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
    // Audio toggle
    const btnAudio = document.getElementById('btn-audio');
    const audioIcon = document.getElementById('audio-icon');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        audio.unlock();
        const isMuted = audio.toggleMute();
        audioIcon.textContent = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
        btnAudio.style.borderColor = isMuted ? 'var(--signal-amber)' : 'rgba(245, 242, 234, 0.14)';
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

    // Render through Post-processing pipeline
    this.postfx.render(elapsedTime);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new RemanenceApp();
});
