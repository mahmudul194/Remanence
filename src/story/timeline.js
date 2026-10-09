/**
 * REMANENCE: Continuous Story Timeline & Flight Synchronization Engine
 *
 * Implements:
 * - One unbroken continuous flight through one persistent solar system universe.
 * - Cards appear ONLY during HOLD phases (when the spacecraft slows down and orbits a machine).
 * - During flight between stations, cards are completely hidden.
 * - During flight, shows ONLY a single-sentence cinematic caption at the bottom of the screen.
 * - When arriving at a station: the camera glides into hold orbit, the caption fades out,
 *   and the machine card fades in on the appropriate side with zero machine-card overlap.
 * - When leaving a station: the card fades out before the camera accelerates away.
 * - Hero Section 0 (REMANENCE) scroll-back protection: always visible when near the top.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import SplitType from 'split-type';
import { STORY_DATA } from './data.js';
import { audio } from '../audio.js';
import { ShotManager } from './shots.js';
import { FLIGHT_STATIONS } from '../flight/flightController.js';

gsap.registerPlugin(ScrollTrigger);

export const SECTION_MAP = [
  { id: 'intro', elementId: 'section-intro' },
  { id: 'earth', elementId: 'section-earth' },
  { id: 'apollo11', elementId: 'section-apollo11' },
  { id: 'alsep', elementId: 'section-alsep' },
  { id: 'lrv', elementId: 'section-lrv' },
  { id: 'hammer_feather', elementId: 'section-hammer-feather' },
  { id: 'surveyor3', elementId: 'section-surveyor3' },
  { id: 'transit', elementId: 'section-transit' },
  { id: 'descent_debris', elementId: 'section-descent-debris' },
  { id: 'viking1', elementId: 'section-viking1' },
  { id: 'pathfinder', elementId: 'section-pathfinder' },
  { id: 'spirit', elementId: 'section-spirit' },
  { id: 'opportunity', elementId: 'section-opportunity' },
  { id: 'ingenuity', elementId: 'section-ingenuity' },
  { id: 'retroreflector', elementId: 'section-retroreflector' },
  { id: 'sources', elementId: 'section-sources' }
];

export function getFlightCaption(s) {
  if (s >= 0.00 && s < 0.055) {
    return 'Ascending above the blue marble · Low Earth Orbit insertion';
  } else if (s >= 0.055 && s < 0.150) {
    return 'Departing low Earth orbit for the translunar crossing · 384,400 km ahead';
  } else if (s >= 0.150 && s < 0.205) {
    return 'Lunar orbit capture · Decelerating over the Sea of Tranquility';
  } else if (s >= 0.205 && s < 0.275) {
    return 'Gliding across Tranquility Base · Skimming the silent regolith';
  } else if (s >= 0.275 && s < 0.345) {
    return 'Following astronaut tracks along the lunar plain';
  } else if (s >= 0.345 && s < 0.415) {
    return 'Traversing Hadley Rille foothills toward the Apennine front';
  } else if (s >= 0.415 && s < 0.485) {
    return 'Banking over crater rims into Oceanus Procellarum';
  } else if (s >= 0.485 && s < 0.540) {
    return 'Lunar ascent thrusters ignited · Breaking free of Moon gravity';
  } else if (s >= 0.540 && s < 0.620) {
    return 'Interplanetary cruise trajectory · Deep solar void · 225 million km to Mars';
  } else if (s >= 0.620 && s < 0.680) {
    return 'The Crossing · Total cosmic radio silence across the void';
  } else if (s >= 0.680 && s < 0.745) {
    return 'Martian atmospheric entry · Plasma sheath heating at hypersonic velocity';
  } else if (s >= 0.745 && s < 0.795) {
    return 'Descending into Chryse Planitia · Dune ridges rising through the haze';
  } else if (s >= 0.795 && s < 0.840) {
    return 'Gliding eastward across the ancient Ares Vallis flood channel';
  } else if (s >= 0.840 && s < 0.880) {
    return 'Crossing volcanic basalt plains toward Gusev Crater';
  } else if (s >= 0.880 && s < 0.915) {
    return 'Entering the twilight of Meridiani Planum as dust dims the sun';
  } else if (s >= 0.915 && s < 0.945) {
    return 'Rising along the rim of Jezero Crater toward Valinor Hills';
  } else if (s >= 0.945 && s < 0.975) {
    return 'Rocketing out of Mars atmosphere · Aligning with Earth laser observatories';
  } else {
    return 'Ascending into deep space · The solar system in perpetual remanence';
  }
}

export class StoryTimeline {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.scene = app.scene;
    this.postfx = app.postfx;
    this.pingManager = app.pingManager;
    this.particles = app.particles;

    this.shotManager = new ShotManager(app);
    this.currentSectionIndex = -1;
    this.currentHoldStation = null;
    this.currentCaption = '';

    this.initScrollTrigger();
    this.initReadMoreToggles();
  }

  initScrollTrigger() {
    const scrollContainer = document.querySelector('.scroll-container');

    // Master continuous spline flight trigger (NO PINNING - Silky smooth Lenis momentum scroll)
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.0,
      onUpdate: (self) => {
        this.updateCameraFlight(self.progress);
      }
    });
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
    if (!this.app.flightController) return;
    this.app.flightController.setTargetProgress(progress);
  }

  /**
   * Animation frame update synchronizing cards, in-flight captions, audio, and VFX
   * Driven directly by current flight progress.
   */
  update(delta) {
    if (!this.app.flightController) return;

    const fc = this.app.flightController;
    const s = fc.currentProgress;
    const isFree = fc.isFreeFlight;
    const { station, diff, inHold } = fc.getClosestStation(s);

    const captionWrap = document.getElementById('cinematic-caption-wrap');
    const captionText = document.getElementById('cinematic-caption-text');
    const railThumb = document.getElementById('rail-thumb');
    if (railThumb) {
      railThumb.style.top = `${s * 220}px`;
    }

    // Dynamic single-sun celestial lighting coordinator (zero irradiance stacking)
    this.updatePlanetaryLighting(s);

    // When in free flight, hide all cards and flight captions
    if (isFree) {
      this.hideAllCards();
      if (captionWrap) captionWrap.classList.remove('visible');
      return;
    }

    // Opportunity Dust Storm day-to-night dimming modulation (sol 5111 twilight)
    const stormOverlay = document.getElementById('storm-overlay');
    if (s >= 0.895 && s <= 0.935) {
      const stormIntensity = Math.sin(((s - 0.895) / 0.04) * Math.PI);
      if (this.app.marsScene && this.app.marsScene.setStormDarkness) {
        this.app.marsScene.setStormDarkness(stormIntensity);
      }
      if (this.particles) {
        this.particles.setDustStormIntensity(1.0 + stormIntensity * 3.5);
      }
      if (stormOverlay) {
        stormOverlay.style.opacity = (stormIntensity * 0.95).toFixed(2);
      }
    } else {
      if (this.app.marsScene && this.app.marsScene.setStormDarkness) {
        this.app.marsScene.setStormDarkness(0);
      }
      if (this.particles) {
        this.particles.setDustStormIntensity(1.0);
      }
      if (stormOverlay && stormOverlay.style.opacity !== '0') {
        stormOverlay.style.opacity = '0';
      }
    }

    // Mars Entry Glow modulation (s: 0.68 - 0.74)
    if (this.postfx && this.postfx.cinemaPass && this.postfx.cinemaPass.uniforms.uEntryGlow) {
      if (s >= 0.68 && s <= 0.74) {
        const entryIntensity = Math.sin(((s - 0.68) / 0.06) * Math.PI);
        this.postfx.cinemaPass.uniforms.uEntryGlow.value = entryIntensity;
      } else {
        this.postfx.cinemaPass.uniforms.uEntryGlow.value = 0.0;
      }
    }

    // Audio Atmosphere Modulation
    if (s < 0.16) {
      audio.setAtmosphere('earth');
    } else if (s >= 0.16 && s < 0.52) {
      audio.setAtmosphere('moon');
    } else if (s >= 0.52 && s < 0.68) {
      audio.setAtmosphere('transit');
    } else if (s >= 0.68 && s < 0.895) {
      audio.setAtmosphere('mars');
    } else if (s >= 0.895 && s < 0.935) {
      audio.setAtmosphere('storm');
    } else if (s >= 0.935 && s < 0.965) {
      audio.setAtmosphere('mars');
    } else if (s >= 0.965) {
      audio.setAtmosphere('finale');
    }

    // SECTION 0 HERO SPECIAL HANDLING (REMANENCE): guaranteed visible when near top
    const heroWrap = document.querySelector('.hero-wrap');
    if (s <= 0.035) {
      if (this.currentSectionIndex !== 0) {
        this.onSectionActive(0);
      }
      if (heroWrap) {
        heroWrap.classList.add('active');
        heroWrap.style.opacity = '1';
        heroWrap.style.transform = 'translateY(0)';
      }
      if (captionWrap) captionWrap.classList.remove('visible');
      return;
    }

    // HOLD vs IN-TRANSIT FLIGHT SYNCHRONIZATION
    if (inHold && station) {
      const targetIdx = SECTION_MAP.findIndex(item => item.id === station.id);
      if (targetIdx !== -1 && this.currentSectionIndex !== targetIdx) {
        this.onSectionActive(targetIdx);
      }

      // Hide in-flight caption during HOLD phase
      if (captionWrap) captionWrap.classList.remove('visible');

      // Update inspection hotspots on the machine
      if (this.shotManager) {
        this.shotManager.updateStation(station.id, 0.50);
      }
    } else {
      // IN FLIGHT BETWEEN STATIONS: HIDE ALL CARDS
      if (this.currentSectionIndex !== -1 && this.currentSectionIndex !== 0) {
        this.hideAllCards();
        this.currentSectionIndex = -1;
      }

      // SHOW IN-FLIGHT CINEMATIC CAPTION
      const caption = getFlightCaption(s);
      if (captionText && this.currentCaption !== caption) {
        this.currentCaption = caption;
        captionText.textContent = caption;
      }
      if (captionWrap) captionWrap.classList.add('visible');

      // Clear hotspots during flight
      if (this.shotManager && this.shotManager.hotspotsLayer) {
        this.shotManager.hotspotsLayer.innerHTML = '';
      }
    }
  }

  onSectionActive(index) {
    this.currentSectionIndex = index;
    const item = SECTION_MAP[index];
    const sectionData = STORY_DATA.sections[index];
    if (!sectionData || !item) return;

    if (this.app.flightController && FLIGHT_STATIONS[index]) {
      this.app.flightController.currentProgress = FLIGHT_STATIONS[index].s;
      this.app.flightController.targetProgress = FLIGHT_STATIONS[index].s;
      this.app.flightController.progressVelocity = 0;
    }

    // 1. Activate target section in DOM and deactivate all others
    const sections = document.querySelectorAll('.story-section');
    sections.forEach((sec, i) => {
      const isActive = i === index;
      sec.classList.toggle('active', isActive);
      const moment = sec.querySelector('.moment-wrap, .hero-wrap');
      if (moment) {
        if (isActive) {
          moment.classList.add('active');
          moment.style.opacity = '1';
          moment.style.transform = 'translateY(0)';
        } else {
          moment.classList.remove('active');
          moment.style.opacity = '0';
        }
      }
    });

    // Update chapter rail indicators
    const railDots = document.querySelectorAll('.rail-dot');
    railDots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });

    // 2. Audio Atmosphere & Glitch Burst
    if (index > 1) {
      this.postfx.triggerGlitch(0.25);
      audio.playGlitch();
    }

    if (index === 7) {
      audio.playHeartbeat();
    } else if (index >= 14 && sectionData.laserActive) {
      audio.playLaserPulse();
    }

    // 3. Radar-style "Last Ping" Ring & Beacon Remanence Fade
    const currentMachine = this.getMachineForSection(sectionData.id);
    if (currentMachine) {
      const worldPos = new THREE.Vector3();
      currentMachine.getWorldPosition(worldPos);

      this.pingManager.triggerPing(worldPos, sectionData.glowColor || 0x4df0ff, 38, 3.2);

      if (currentMachine.userData && currentMachine.userData.beacon) {
        this.pingManager.fadeBeaconToRemanence(currentMachine.userData.beacon, 3.5);
      }
    }

    // 4. Interactive Inspection Hotspots (Apollo 11)
    if (this.app.inspection) {
      if (index === 2 && this.app.moonScene && this.app.moonScene.machines.apollo11) {
        this.app.inspection.setActiveMachine(this.app.moonScene.machines.apollo11, true);
      } else {
        this.app.inspection.setActiveMachine(null, false);
      }
    }

    // 5. Update Navbar Chapter Indicator
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

    // 6. Update Mission Control HUD telemetry
    this.updateHUD(sectionData);

    // 7. Trigger Letter-by-Letter Typewriter animation
    this.animateStoryMoment(index);
  }

  hideAllCards() {
    const sections = document.querySelectorAll('.story-section');
    sections.forEach((sec) => {
      sec.classList.remove('active');
      const moment = sec.querySelector('.moment-wrap');
      if (moment) {
        moment.classList.remove('active');
        moment.style.opacity = '0';
      }
    });
    const chapterEl = document.getElementById('chapter-indicator');
    if (chapterEl) chapterEl.classList.remove('active');
  }

  onSectionLeave(index) {
    if (index === 0 && window.scrollY < window.innerHeight * 0.4) return;

    const sections = document.querySelectorAll('.story-section');
    const section = sections[index];
    if (!section) return;
    const moment = section.querySelector('.moment-wrap, .hero-wrap');
    if (!moment) return;

    section.classList.remove('active');
    gsap.killTweensOf(moment);
    gsap.to(moment, {
      opacity: 0,
      y: -18,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        moment.classList.remove('active');
      }
    });

    const chapterEl = document.getElementById('chapter-indicator');
    if (chapterEl) chapterEl.classList.remove('active');

    if (this.shotManager && this.shotManager.hotspotsLayer) {
      this.shotManager.hotspotsLayer.innerHTML = '';
    }
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

    // Immediately kill exit tweens and show
    gsap.killTweensOf(moment);
    moment.classList.add('active');
    gsap.to(moment, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power2.out',
      overwrite: true
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(moment, { opacity: 1, y: 0 });
      return;
    }

    // SECTION 0: HERO OPENING
    if (index === 0) {
      const heroTitle = moment.querySelector('.hero-title');
      if (heroTitle) {
        gsap.killTweensOf(heroTitle);
        gsap.fromTo(
          heroTitle,
          { opacity: 0, y: 22, letterSpacing: '0.18em' },
          { opacity: 1, y: 0, letterSpacing: '0.12em', duration: 1.0, ease: 'power3.out' }
        );
      }

      const heroElements = moment.querySelectorAll('.kicker-label, .hero-tagline, .hero-definition, .scroll-affordance');
      if (heroElements.length > 0) {
        gsap.killTweensOf(heroElements);
        gsap.fromTo(
          heroElements,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, delay: 0.15, ease: 'power2.out' }
        );
      }
      return;
    }

    // CHAPTER SECTIONS (1-15)
    // 1. Title reveal: unified element without SplitType line-masking
    const titleEl = moment.querySelector('.moment-title');
    if (titleEl) {
      gsap.killTweensOf(titleEl);
      gsap.fromTo(
        titleEl,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' }
      );
    }

    // 2. Machine info panel reveal
    const panel = moment.querySelector('.machine-panel');
    if (panel) {
      gsap.killTweensOf(panel);
      gsap.fromTo(
        panel,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.75, delay: 0.15, ease: 'power2.out' }
      );
    }

    // 3. Body text word reveal
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
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, stagger: 0.025, duration: 0.65, delay: 0.2, ease: 'power2.out' }
        );
      } else {
        gsap.fromTo(
          narrative,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.2, ease: 'power2.out' }
        );
      }
    }
  }

  /**
   * Dynamic Single-Sun Celestial Lighting Coordinator
   * Ensures only ONE primary celestial sun illuminates the scene depending on the
   * visitor's planetary flight progress, preventing irradiance stacking and bloom blowout.
   */
  updatePlanetaryLighting(s) {
    const spaceScene = this.app.spaceScene;
    const moonScene = this.app.moonScene;
    const marsScene = this.app.marsScene;

    if (!spaceScene || !moonScene) return;

    // Synchronize distant Moon celestial/orbital progression
    if (spaceScene.updateMoonProgress) {
      spaceScene.updateMoonProgress(s);
    }

    // 1. Earth Orbit (s <= 0.11)
    if (s <= 0.11) {
      if (spaceScene.sunLight) spaceScene.sunLight.intensity = 1.35;
      if (moonScene.lunarSun) moonScene.lunarSun.intensity = 0.0;
      if (marsScene && marsScene.marsSun) marsScene.marsSun.intensity = 0.0;

      // Keep Moon & Mars terrain hidden so they don't clip through Earth!
      moonScene.group.visible = false;
      if (marsScene) marsScene.group.visible = false;
      spaceScene.group.visible = true;
    }
    // 2. Approach to Moon (0.11 < s < 0.16)
    else if (s > 0.11 && s < 0.16) {
      const t = (s - 0.11) / 0.05;
      moonScene.group.visible = true;
      if (marsScene) marsScene.group.visible = false;
      spaceScene.group.visible = true;

      if (spaceScene.sunLight) spaceScene.sunLight.intensity = (1.0 - t) * 1.35;
      if (moonScene.lunarSun) moonScene.lunarSun.intensity = t * 1.5;
      if (marsScene && marsScene.marsSun) marsScene.marsSun.intensity = 0.0;
    }
    // 3. Moon Surface & Exploration (0.16 <= s < 0.52)
    else if (s >= 0.16 && s < 0.52) {
      moonScene.group.visible = true;
      if (marsScene) marsScene.group.visible = false;
      spaceScene.group.visible = true;

      if (spaceScene.sunLight) spaceScene.sunLight.intensity = 0.0;
      if (moonScene.lunarSun) moonScene.lunarSun.intensity = 1.5;
      if (marsScene && marsScene.marsSun) marsScene.marsSun.intensity = 0.0;
    }
    // 4. Departure Moon & The Crossing Transit (0.52 <= s < 0.68)
    else if (s >= 0.52 && s < 0.68) {
      const transitPhase = (s - 0.52) / 0.16;
      moonScene.group.visible = transitPhase < 0.25;
      if (marsScene) marsScene.group.visible = transitPhase > 0.65;
      spaceScene.group.visible = true;

      if (moonScene.lunarSun) moonScene.lunarSun.intensity = 0.0;
      if (marsScene && marsScene.marsSun) marsScene.marsSun.intensity = 0.0;
      if (spaceScene.sunLight) spaceScene.sunLight.intensity = 1.25;
    }
    // 5. Mars Approach & Surface Exploration (s >= 0.68)
    else {
      moonScene.group.visible = false;
      if (marsScene) marsScene.group.visible = true;
      spaceScene.group.visible = true;

      if (spaceScene.sunLight) spaceScene.sunLight.intensity = 0.0;
      if (moonScene.lunarSun) moonScene.lunarSun.intensity = 0.0;
      if (marsScene && marsScene.marsSun) {
        // Respect storm intensity if active
        if (s < 0.895 || s > 0.935) {
          marsScene.marsSun.intensity = 1.45;
        }
      }
    }
  }
}
