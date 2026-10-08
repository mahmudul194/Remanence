/**
 * GSAP ScrollTrigger & Story Timeline Engine
 * Controls camera spline flight path, Section transitions,
 * UI mission card typewriter effect, audio atmospheric transitions,
 * radar pulse triggers, and Opportunity dust-storm blackout.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import SplitType from 'split-type';
import { STORY_DATA } from './data.js';
import { audio } from '../audio.js';

gsap.registerPlugin(ScrollTrigger);

export class StoryTimeline {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.scene = app.scene;
    this.postfx = app.postfx;
    this.pingManager = app.pingManager;
    this.particles = app.particles;

    this.currentSectionIndex = -1;
    this.lookAtTarget = new THREE.Vector3(0, 0, 0);

    // Spline curve points definition
    this.initCurves();
    this.initScrollTrigger();
    this.updateSceneVisibility(0.0);
  }

  initCurves() {
    // Exact 3D trajectory waypoints (Camera positions)
    const camPoints = [
      new THREE.Vector3(0, 0.2, 24),        // 0: Loading / Opening (close beacon)
      new THREE.Vector3(0, 6, 52),          // 1: Earth overview
      new THREE.Vector3(3.8, -8.3, -174),   // 2: Apollo 11 Lunar Module
      new THREE.Vector3(41.5, -8.7, -231),  // 3: Lunar Roving Vehicle
      new THREE.Vector3(-36.8, -12.4, -270),// 4: Surveyor 3 in crater
      new THREE.Vector3(12, 38, 240),       // 5: Interplanetary Transit Void
      new THREE.Vector3(3.5, -8.2, 656),    // 6: Viking 1 on Mars
      new THREE.Vector3(40.5, -8.8, 714),   // 7: Pathfinder & Sojourner
      new THREE.Vector3(-33.5, -9.1, 779),  // 8: Spirit in Troy Sand
      new THREE.Vector3(14.5, -8.4, 848),   // 9: Opportunity in Twilight
      new THREE.Vector3(-26.2, -8.8, 914),  // 10: Ingenuity at Valinor Hills
      new THREE.Vector3(16.5, -9.2, -132)   // 11: Finale - Retroreflector Laser
    ];

    // Look-at focal targets for each station
    const lookPoints = [
      new THREE.Vector3(0, 0, 0),           // 0: Center beacon
      new THREE.Vector3(0, 0, 0),           // 1: Center Earth
      new THREE.Vector3(0, -8.8, -180),     // 2: Apollo 11 Descent Stage
      new THREE.Vector3(38, -9.6, -235),    // 3: LRV Rover body
      new THREE.Vector3(-40, -13.2, -275),  // 4: Surveyor 3
      new THREE.Vector3(40, -10, 420),      // 5: Mars approaching in distance
      new THREE.Vector3(0, -9.2, 650),      // 6: Viking 1 body
      new THREE.Vector3(38, -9.6, 710),     // 7: Pathfinder & Sojourner
      new THREE.Vector3(-36, -10.2, 775),   // 8: Spirit wheels in sand
      new THREE.Vector3(12, -9.6, 845),     // 9: Opportunity rover
      new THREE.Vector3(-28, -9.6, 910),    // 10: Ingenuity rotor hub
      new THREE.Vector3(15, -9.8, -135)     // 11: Retroreflector array
    ];

    this.camCurve = new THREE.CatmullRomCurve3(camPoints, false, 'catmullrom', 0.2);
    this.lookCurve = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.2);
  }

  initScrollTrigger() {
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.story-section');
    const totalSections = sections.length;

    // Track scroll progress along the flight curve
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: (self) => {
        this.updateCameraFlight(self.progress);
      }
    });

    // Individual section triggers for typewriter mission cards & atmospheric sound
    sections.forEach((sec, idx) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this.onSectionActive(idx),
        onEnterBack: () => this.onSectionActive(idx)
      });
    });

    // Opportunity Dust Storm Day-to-Night Dimming Trigger
    const oppySection = document.getElementById('section-opportunity');
    if (oppySection) {
      ScrollTrigger.create({
        trigger: oppySection,
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: true,
        onUpdate: (self) => {
          // Bell curve: smoothly rises, peaks in middle of Opportunity, then fades out completely
          const intensity = Math.sin(self.progress * Math.PI);
          if (this.app.marsScene && this.app.marsScene.setStormDarkness) {
            this.app.marsScene.setStormDarkness(intensity);
          }
          if (this.particles) {
            this.particles.setDustStormIntensity(1.0 + intensity * 3.5);
          }
          const overlay = document.getElementById('storm-overlay');
          if (overlay) {
            overlay.style.opacity = (intensity * 0.9).toFixed(2);
          }
        },
        onLeave: () => {
          const overlay = document.getElementById('storm-overlay');
          if (overlay) overlay.style.opacity = '0';
          if (this.app.marsScene && this.app.marsScene.setStormDarkness) {
            this.app.marsScene.setStormDarkness(0);
          }
          if (this.particles) {
            this.particles.setDustStormIntensity(1.0);
          }
        },
        onLeaveBack: () => {
          const overlay = document.getElementById('storm-overlay');
          if (overlay) overlay.style.opacity = '0';
          if (this.app.marsScene && this.app.marsScene.setStormDarkness) {
            this.app.marsScene.setStormDarkness(0);
          }
          if (this.particles) {
            this.particles.setDustStormIntensity(1.0);
          }
        }
      });
    }
  }

  updateCameraFlight(progress) {
    if (!this.camCurve || !this.lookCurve) return;

    // Clamp progress
    const t = Math.min(Math.max(progress, 0.0), 0.9999);

    // Isolate sub-scenes dynamically so planes never clip across other planetary views
    this.updateSceneVisibility(t);

    // Camera position from spline
    const pos = this.camCurve.getPoint(t);
    const target = this.lookCurve.getPoint(t);

    // Apply mouse parallax smoothly
    const mouse = this.particles ? this.particles.mouse : { x: 0, y: 0 };
    pos.x += mouse.x * 0.8;
    pos.y += mouse.y * -0.5;

    this.camera.position.copy(pos);
    this.lookAtTarget.copy(target);
    this.camera.lookAt(this.lookAtTarget);
  }

  updateSceneVisibility(t) {
    if (!this.app.spaceScene || !this.app.moonScene || !this.app.marsScene) return;

    // Spline parameter t spans 0.0 to 1.0
    // 0.0 - 0.13: Earth intro & overview
    // 0.14 - 0.40: Moon Apollo landing sites
    // 0.41 - 0.50: Transit Void (Earth & Mars in deep space)
    // 0.51 - 0.94: Mars surface stations
    // 0.95 - 1.00: Finale Retroreflectors on Moon

    let showSpace = false;
    let showMoon = false;
    let showMars = false;

    if (t < 0.135) {
      showSpace = true;
    } else if (t < 0.405) {
      showMoon = true;
    } else if (t < 0.505) {
      showSpace = true;
    } else if (t < 0.955) {
      showMars = true;
    } else {
      showMoon = true;
    }

    if (this.app.spaceScene.group.visible !== showSpace) {
      this.app.spaceScene.group.visible = showSpace;
    }
    if (this.app.moonScene.group.visible !== showMoon) {
      this.app.moonScene.group.visible = showMoon;
    }
    if (this.app.marsScene.group.visible !== showMars) {
      this.app.marsScene.group.visible = showMars;
    }
  }

  onSectionActive(index) {
    if (this.currentSectionIndex === index) return;
    this.currentSectionIndex = index;

    const sectionData = STORY_DATA.sections[index];
    if (!sectionData) return;

    // 0. Explicit Scene Isolation by Section
    const isEarth = (index <= 1 || index === 5);
    const isMoon = ((index >= 2 && index <= 4) || index >= 11);
    const isMars = (index >= 6 && index <= 10);
    if (this.app.spaceScene) this.app.spaceScene.group.visible = isEarth;
    if (this.app.moonScene) this.app.moonScene.group.visible = isMoon;
    if (this.app.marsScene) this.app.marsScene.group.visible = isMars;

    // 1. Apollo 404 Glitch Burst between stories
    if (index > 1) {
      this.postfx.triggerGlitch(0.32);
      audio.playGlitch();
    }

    // 2. Audio Atmosphere Adaptation
    if (index <= 1) {
      audio.setAtmosphere('earth');
    } else if (index >= 2 && index <= 4) {
      audio.setAtmosphere('moon');
    } else if (index === 5) {
      audio.setAtmosphere('transit');
      audio.playHeartbeat();
    } else if (index >= 6 && index <= 8) {
      audio.setAtmosphere('mars');
    } else if (index === 9) {
      audio.setAtmosphere('storm');
    } else if (index >= 10) {
      audio.setAtmosphere('finale');
      if (sectionData.laserActive) {
        audio.playLaserPulse();
      }
    }

    // 3. Radar-style "Last Ping" Ring & Beacon Remanence Fade
    const currentMachine = this.getMachineForSection(sectionData.id);
    if (currentMachine) {
      const worldPos = new THREE.Vector3();
      currentMachine.getWorldPosition(worldPos);

      // Trigger expanding radar ring
      this.pingManager.triggerPing(worldPos, sectionData.glowColor || 0x4df0ff, 38, 3.2);

      // Beacon fade to remanence
      if (currentMachine.userData && currentMachine.userData.beacon) {
        this.pingManager.fadeBeaconToRemanence(currentMachine.userData.beacon, 3.5);
      }
    }

    // 4. Update Mission Control HUD telemetry
    this.updateHUD(sectionData);

    // 5. Trigger Letter-by-Letter Typewriter animation on active card
    this.animateMissionCard(index);
  }

  getMachineForSection(id) {
    if (!this.app.moonScene || !this.app.marsScene) return null;
    switch (id) {
      case 'apollo11': return this.app.moonScene.machines.apollo11;
      case 'lrv': return this.app.moonScene.machines.lrv;
      case 'surveyor3': return this.app.moonScene.machines.surveyor;
      case 'viking1': return this.app.marsScene.machines.viking1;
      case 'pathfinder': return this.app.marsScene.machines.pathfinder;
      case 'spirit': return this.app.marsScene.machines.spirit;
      case 'opportunity': return this.app.marsScene.machines.opportunity;
      case 'ingenuity': return this.app.marsScene.machines.ingenuity;
      case 'retroreflector': return this.app.moonScene.machines.retroreflector;
      default: return null;
    }
  }

  updateHUD(data) {
    const coordsEl = document.getElementById('hud-coords');
    const targetEl = document.getElementById('hud-target');
    const dsnEl = document.getElementById('hud-dsn');

    if (coordsEl && data.coordinates) coordsEl.textContent = data.coordinates;
    if (targetEl && (data.machine || data.title)) targetEl.textContent = (data.machine || data.title).toUpperCase();
    if (dsnEl) {
      dsnEl.textContent = data.status === 'SILENT' ? 'DSN: CARRIER LOST' : `DSN: ${data.status || 'TRACKING'}`;
      dsnEl.style.color = data.status === 'SILENT' ? '#ff4d4d' : '#4df0ff';
    }
  }

  animateMissionCard(index) {
    const card = document.querySelector(`.story-section:nth-child(${index + 1}) .mission-card`);
    if (!card || card.dataset.animated === 'true') return;

    card.dataset.animated = 'true';

    // Smooth card entry
    gsap.fromTo(card, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

    // SplitType letter-by-letter animation on machine title
    const titleEl = card.querySelector('.machine-title');
    if (titleEl) {
      try {
        const split = new SplitType(titleEl, { types: 'chars' });
        if (split.chars && split.chars.length > 0) {
          gsap.fromTo(
            split.chars,
            { opacity: 0, display: 'none' },
            {
              opacity: 1,
              display: 'inline-block',
              stagger: 0.025,
              duration: 0.05,
              ease: 'none',
              onStart: () => audio.playKeyClick()
            }
          );
        }
      } catch (e) {
        // Fallback
      }
    }

    // Typewriter line revelation
    const lines = card.querySelectorAll('.typewriter-line:not(.machine-title)');
    gsap.fromTo(
      lines,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: 'power2.out',
        onStart: () => audio.playKeyClick()
      }
    );
  }
}
