/**
 * PingRing Effect for REMANENCE
 * Simulates the "Last Ping" radar-style telemetry pulse ring expanding from machines,
 * and manages the beacon light flicker and slow fade leaving an enduring afterglow.
 */

import * as THREE from 'three';
import { audio } from '../audio.js';

export class PingRingManager {
  constructor(scene) {
    this.scene = scene;
    this.activeRings = [];

    // Shared ring geometry for instanced reuse
    this.ringGeo = new THREE.RingGeometry(0.85, 1.0, 64);
    this.ringGeo.rotateX(-Math.PI / 2);
  }

  /**
   * Spawns an expanding radar pulse ring from world coordinates
   */
  triggerPing(origin, colorHex = 0x4df0ff, maxRadius = 35, duration = 3.5) {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.copy(origin);
    mesh.position.y += 0.15; // slightly above ground
    this.scene.add(mesh);

    const ringData = {
      mesh,
      startTime: performance.now(),
      duration: duration * 1000,
      maxRadius,
      mat
    };

    this.activeRings.push(ringData);

    // Audio cue
    audio.playPing(colorHex === 0xff4422 ? 440 : 880);

    return ringData;
  }

  /**
   * Flickers a machine's beacon and fades it down to a faint afterglow
   */
  fadeBeaconToRemanence(beaconGroup, duration = 4.0) {
    if (!beaconGroup || !beaconGroup.userData) return;
    const { light, ledMat, baseIntensity } = beaconGroup.userData;
    if (!light) return;

    let startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / (duration * 1000);
      if (elapsed >= 1.0) {
        clearInterval(interval);
        // Residual afterglow: the remanence
        light.intensity = baseIntensity * 0.18;
        if (ledMat) ledMat.color.multiplyScalar(0.4);
      } else {
        // Flicker noise during signal fade
        const flicker = Math.random() > 0.3 ? 1.0 : 0.2;
        const fade = (1.0 - elapsed) * 0.82 + 0.18;
        light.intensity = baseIntensity * fade * flicker;
      }
    }, 50);
  }

  update() {
    const now = performance.now();
    for (let i = this.activeRings.length - 1; i >= 0; i--) {
      const ring = this.activeRings[i];
      const progress = (now - ring.startTime) / ring.duration;

      if (progress >= 1.0) {
        this.scene.remove(ring.mesh);
        ring.mat.dispose();
        this.activeRings.splice(i, 1);
      } else {
        // Ease out expansion
        const scale = 1.0 + (ring.maxRadius - 1.0) * Math.sin((progress * Math.PI) / 2);
        ring.mesh.scale.set(scale, 1, scale);
        // Fade opacity
        ring.mat.opacity = Math.pow(1.0 - progress, 1.8) * 0.9;
      }
    }
  }
}
