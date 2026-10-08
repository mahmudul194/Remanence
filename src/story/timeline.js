/**
 * GSAP ScrollTrigger & Story Timeline Engine
 * Controls CatmullRomCurve3 camera flight path, dynamic sub-scene isolation,
 * editorial SplitType typography reveals, atmospheric soundscapes,
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
    // Exact 3D trajectory waypoints (16 Stations) - physically calibrated to terrain elevations
    const camPoints = [
      new THREE.Vector3(0, 6, 54),          // 0: Hero / Opening (Earth orbit)
      new THREE.Vector3(0, 6, 50),          // 1: Earth overview
      new THREE.Vector3(3.8, -8.3, -174),   // 2: Apollo 11 Lunar Module (grounded at y = -10.0)
      new THREE.Vector3(17.8, -8.8, -194),  // 3: ALSEP Station (grounded at y = -9.92)
      new THREE.Vector3(41.5, -12.9, -231), // 4: Lunar Roving Vehicle (grounded in crater at y = -14.16)
      new THREE.Vector3(31.4, -12.0, -250.2),// 5: Hammer & Feather (grounded intimate view at y = -12.62)
      new THREE.Vector3(-36.8, -12.4, -270),// 6: Surveyor 3 in crater slope (grounded at y = -13.55)
      new THREE.Vector3(12, 38, 240),       // 7: Interplanetary Transit Void
      new THREE.Vector3(-18.5, -11.8, 620), // 8: Mars Descent Debris (grounded in furrow at y = -13.18)
      new THREE.Vector3(3.5, -8.2, 656),    // 9: Viking 1 on Mars ridge (grounded at y = -9.55)
      new THREE.Vector3(40.5, -8.8, 714),   // 10: Pathfinder & Sojourner (grounded at y = -9.74)
      new THREE.Vector3(-33.5, -10.5, 779), // 11: Spirit in Troy Sand (grounded at y = -11.81)
      new THREE.Vector3(14.5, -10.4, 848),  // 12: Opportunity in Twilight (grounded at y = -11.79)
      new THREE.Vector3(-26.2, -7.2, 914),  // 13: Ingenuity at Valinor Hills (grounded at y = -7.93)
      new THREE.Vector3(17.2, -8.4, -131),  // 14: Finale - Retroreflector Laser (grounded at y = -9.13)
      new THREE.Vector3(26.0, 4.0, -100)    // 15: Archive & Sources wide view
    ];

    // Look-at focal targets for each station
    const lookPoints = [
      new THREE.Vector3(0, 0, 0),           // 0: Center Earth
      new THREE.Vector3(0, 0, 0),           // 1: Center Earth
      new THREE.Vector3(0, -8.8, -180),     // 2: Apollo 11 Descent Stage
      new THREE.Vector3(14, -9.4, -200),    // 3: ALSEP Station
      new THREE.Vector3(38, -13.6, -235),   // 4: LRV Rover body and tracks
      new THREE.Vector3(30, -12.55, -252),  // 5: Hammer & Feather on lunar regolith
      new THREE.Vector3(-40, -12.6, -275),  // 6: Surveyor 3
      new THREE.Vector3(40, -10, 420),      // 7: Mars approaching in distance
      new THREE.Vector3(-15, -12.8, 615),   // 8: Mars Descent Debris & Parachute
      new THREE.Vector3(0, -8.9, 650),      // 9: Viking 1 body
      new THREE.Vector3(38, -9.3, 710),     // 10: Pathfinder & Sojourner
      new THREE.Vector3(-36, -11.2, 775),   // 11: Spirit wheels in sand
      new THREE.Vector3(12, -11.2, 845),    // 12: Opportunity rover
      new THREE.Vector3(-28, -7.6, 910),    // 13: Ingenuity rotor hub & damaged blade
      new THREE.Vector3(15, -8.8, -135),    // 14: Retroreflector array
      new THREE.Vector3(15, -9.0, -135)     // 15: Retroreflector array & Moon horizon
    ];

    this.camCurve = new THREE.CatmullRomCurve3(camPoints, false, 'catmullrom', 0.2);
    this.lookCurve = new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.2);
  }

  initScrollTrigger() {
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.story-section');

    // Track scroll progress along the flight curve
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.25,
      onUpdate: (self) => {
        this.updateCameraFlight(self.progress);
      }
    });

    // Individual section triggers for typographic reveals & audio atmosphere
    sections.forEach((sec, idx) => {
      ScrollTrigger.create({
        trigger: sec,
        start: idx === 0 ? 'top top' : 'top 65%',
        end: idx === 0 ? 'bottom 20%' : 'bottom 35%',
        onEnter: () => this.onSectionActive(idx),
        onEnterBack: () => this.onSectionActive(idx),
        onLeave: () => this.onSectionLeave(idx),
        onLeaveBack: () => {
          // Never hide Section 0 when scrolling back to the top of the page
          if (idx === 0) {
            this.onSectionActive(0);
          } else {
            this.onSectionLeave(idx);
          }
        }
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
          const intensity = Math.sin(self.progress * Math.PI);
          if (this.app.marsScene && this.app.marsScene.setStormDarkness) {
            this.app.marsScene.setStormDarkness(intensity);
          }
          if (this.particles) {
            this.particles.setDustStormIntensity(1.0 + intensity * 3.5);
          }
          const overlay = document.getElementById('storm-overlay');
          if (overlay) {
            overlay.style.opacity = (intensity * 0.95).toFixed(2);
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

    this.initReadMoreToggles();
  }

  initReadMoreToggles() {
    const buttons = document.querySelectorAll('.btn-read-more');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = btn.closest('.machine-panel');
        if (!panel) return;
        const isExpanded = panel.classList.toggle('is-expanded');
        btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        btn.textContent = isExpanded ? 'Read less −' : 'Read more +';
        ScrollTrigger.refresh();
      });
    });
  }

  updateCameraFlight(progress) {
    if (!this.camCurve || !this.lookCurve) return;

    // Clamp progress
    const t = Math.min(Math.max(progress, 0.0), 0.9999);

    // Isolate sub-scenes dynamically so planes never clip across other planetary views
    this.updateSceneVisibility(t);

    // Ensure Section 0 is always active when user scrolls near top
    if (t <= 0.02 && this.currentSectionIndex !== 0) {
      this.onSectionActive(0);
    }

    // Update chapter rail thumb position
    const railThumb = document.getElementById('rail-thumb');
    if (railThumb) {
      railThumb.style.top = `${t * 220}px`;
    }

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
    if (!this.app.spaceScene || !this.app.moonScene) return;

    let showSpace = false;
    let showMoon = false;
    let showMars = false;

    if (t < 0.125) {
      showSpace = true;
    } else if (t < 0.445) {
      showMoon = true;
    } else if (t < 0.515) {
      showSpace = true;
    } else if (t < 0.925) {
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
    if (this.app.marsScene && this.app.marsScene.group.visible !== showMars) {
      this.app.marsScene.group.visible = showMars;
    }
  }

  onSectionActive(index) {
    if (this.currentSectionIndex === index) return;
    this.currentSectionIndex = index;

    const sectionData = STORY_DATA.sections[index];
    if (!sectionData) return;

    // 0. Explicit Scene Isolation by Section
    const isEarth = (index <= 1 || index === 7);
    const isMoon = ((index >= 2 && index <= 6) || index >= 14);
    const isMars = (index >= 8 && index <= 13);
    if (this.app.spaceScene) this.app.spaceScene.group.visible = isEarth;
    if (this.app.moonScene) this.app.moonScene.group.visible = isMoon;
    if (this.app.marsScene) this.app.marsScene.group.visible = isMars;

    // Trigger lazy loading of Mars if user reaches the Moon
    if (index >= 2 && this.app.loadMarsSceneIfNeeded) {
      this.app.loadMarsSceneIfNeeded();
    }

    // 1. Signal Glitch Burst between stories
    if (index > 1) {
      this.postfx.triggerGlitch(0.25);
      audio.playGlitch();
    }

    // 2. Audio Atmosphere Adaptation
    if (index <= 1) {
      audio.setAtmosphere('earth');
    } else if (index >= 2 && index <= 6) {
      audio.setAtmosphere('moon');
    } else if (index === 7) {
      audio.setAtmosphere('transit');
      audio.playHeartbeat();
    } else if (index >= 8 && index <= 11) {
      audio.setAtmosphere('mars');
    } else if (index === 12) {
      audio.setAtmosphere('storm');
    } else if (index === 13) {
      audio.setAtmosphere('mars');
    } else if (index >= 14) {
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

    // 3.5. Interactive Inspection Hotspots & Weathering Controls (Apollo 11)
    if (this.app.inspection) {
      if (index === 2 && this.app.moonScene && this.app.moonScene.machines.apollo11) {
        this.app.inspection.setActiveMachine(this.app.moonScene.machines.apollo11, true);
      } else {
        this.app.inspection.setActiveMachine(null, false);
      }
    }

    // 3.6 Update Navbar Chapter Indicator (Clean plain language, no //)
    const chapterEl = document.getElementById('chapter-indicator');
    if (chapterEl) {
      const chNum = String(index).padStart(2, '0');
      const machineName = sectionData.title || sectionData.machineTitle || 'Origin';
      chapterEl.textContent = `Chapter ${chNum} · ${machineName}`;
      chapterEl.classList.add('active');
    }

    const dimmer = document.getElementById('scene-dimmer');
    if (dimmer) {
      dimmer.classList.toggle('active', index >= 1 && index <= 14);
    }

    // 4. Update Mission Control HUD telemetry (Clean text)
    this.updateHUD(sectionData);

    // 5. Trigger Letter-by-Letter Typewriter / Masked word animation on active moment
    this.animateStoryMoment(index);
  }

  onSectionLeave(index) {
    // Never hide Section 0 if the user is at the top of the page
    if (index === 0 && window.scrollY < 80) return;

    const sections = document.querySelectorAll('.story-section');
    const section = sections[index];
    if (!section) return;
    const moment = section.querySelector('.moment-wrap, .hero-wrap');
    if (!moment) return;

    gsap.killTweensOf(moment);
    gsap.to(moment, {
      opacity: 0,
      y: -18,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        moment.classList.remove('active');
        moment.dataset.animated = 'false';
      }
    });

    const chapterEl = document.getElementById('chapter-indicator');
    if (chapterEl) chapterEl.classList.remove('active');
  }

  getMachineForSection(id) {
    if (!this.app.moonScene) return null;
    switch (id) {
      case 'apollo11': return this.app.moonScene.machines.apollo11;
      case 'alsep': return this.app.moonScene.machines.alsep;
      case 'lrv': return this.app.moonScene.machines.lrv;
      case 'hammer_feather': return this.app.moonScene.machines.hammer_feather;
      case 'surveyor3': return this.app.moonScene.machines.surveyor;
      case 'descent_debris': return this.app.marsScene ? this.app.marsScene.machines.descent_debris : null;
      case 'viking1': return this.app.marsScene ? this.app.marsScene.machines.viking1 : null;
      case 'pathfinder': return this.app.marsScene ? this.app.marsScene.machines.pathfinder : null;
      case 'spirit': return this.app.marsScene ? this.app.marsScene.machines.spirit : null;
      case 'opportunity': return this.app.marsScene ? this.app.marsScene.machines.opportunity : null;
      case 'ingenuity': return this.app.marsScene ? this.app.marsScene.machines.ingenuity : null;
      case 'retroreflector': return this.app.moonScene.machines.retroreflector;
      default: return null;
    }
  }

  updateHUD(data) {
    const coordsEl = document.getElementById('hud-coords');
    const targetEl = document.getElementById('hud-target');
    const dsnEl = document.getElementById('hud-dsn');

    if (coordsEl && data.coordinates) coordsEl.textContent = data.coordinates;
    if (targetEl && (data.machineTitle || data.title)) targetEl.textContent = `${data.machineTitle || data.title}`;
    if (dsnEl) {
      dsnEl.textContent = data.status === 'Silent' ? 'Silent' : 'Active';
      dsnEl.className = data.status === 'Silent' ? 'meta-value status-silent' : 'meta-value status-active';
    }
  }

  animateStoryMoment(index) {
    const sections = document.querySelectorAll('.story-section');
    const section = sections[index];
    if (!section) return;

    const moment = section.querySelector('.moment-wrap, .hero-wrap');
    if (!moment) return;

    // 1. Immediately kill any exit tweens on moment and animate to full opacity
    gsap.killTweensOf(moment);
    moment.classList.add('active');
    gsap.to(moment, {
      opacity: 1,
      y: 0,
      duration: 0.65,
      ease: 'power2.out',
      overwrite: true
    });

    // Update chapter rail indicators
    const railDots = document.querySelectorAll('.rail-dot');
    railDots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(moment, { opacity: 1, y: 0 });
      return;
    }

    // SECTION 0: HERO OPENING (REMANENCE)
    if (index === 0) {
      const heroTitle = moment.querySelector('.hero-title');
      if (heroTitle) {
        gsap.killTweensOf(heroTitle);
        gsap.fromTo(
          heroTitle,
          { opacity: 0, y: 22, letterSpacing: '0.18em' },
          { opacity: 1, y: 0, letterSpacing: '0.12em', duration: 1.1, ease: 'power3.out' }
        );
      }

      const heroElements = moment.querySelectorAll('.kicker-label, .hero-tagline, .hero-definition, .scroll-affordance');
      if (heroElements.length > 0) {
        gsap.killTweensOf(heroElements);
        gsap.fromTo(
          heroElements,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, delay: 0.15, ease: 'power2.out' }
        );
      }
      return;
    }

    // CHAPTER SECTIONS (1-12)
    // 1. Title reveal with masked lines or clean fade-rise
    const titleEl = moment.querySelector('.moment-title');
    if (titleEl) {
      gsap.killTweensOf(titleEl);
      let titleLines = titleEl.querySelectorAll('.title-line');
      if (titleLines.length === 0) {
        try {
          const splitTitle = new SplitType(titleEl, { types: 'lines', lineClass: 'title-line' });
          if (splitTitle.lines && splitTitle.lines.length > 0) {
            splitTitle.lines.forEach((line) => {
              if (!line.parentElement.classList.contains('line-mask')) {
                const mask = document.createElement('div');
                mask.className = 'line-mask';
                mask.style.overflow = 'hidden';
                mask.style.display = 'block';
                line.parentNode.insertBefore(mask, line);
                mask.appendChild(line);
              }
            });
            titleLines = titleEl.querySelectorAll('.title-line');
          }
        } catch (e) {}
      }

      if (titleLines && titleLines.length > 0) {
        gsap.killTweensOf(titleLines);
        gsap.fromTo(
          titleLines,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, stagger: 0.08, duration: 1.0, ease: 'power3.out' }
        );
      } else {
        gsap.fromTo(titleEl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' });
      }
    }

    // 2. Machine info panel reveal
    const panel = moment.querySelector('.machine-panel');
    if (panel) {
      gsap.killTweensOf(panel);
      gsap.fromTo(
        panel,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.85, delay: 0.2, ease: 'power2.out' }
      );
    }

    // 3. Body text word-by-word reveal
    const narrative = moment.querySelector('.moment-narrative');
    if (narrative) {
      gsap.killTweensOf(narrative);
      let words = narrative.querySelectorAll('.word');
      if (words.length === 0) {
        try {
          new SplitType(narrative, { types: 'words' });
          words = narrative.querySelectorAll('.word');
        } catch (e) {}
      }

      if (words && words.length > 0) {
        gsap.killTweensOf(words);
        gsap.fromTo(
          words,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, stagger: 0.03, duration: 0.7, delay: 0.25, ease: 'power2.out' }
        );
      } else {
        gsap.fromTo(
          narrative,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.25, ease: 'power2.out' }
        );
      }
    }
  }
}
