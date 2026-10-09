/**
 * REMANENCE — GPU Particle Text & Warp Engine
 * Award-level opening sequence:
 * 1. Swirls in a breathing orbit around a pulsing amber beacon.
 * 2. Morph-assembles into the typography "REMANENCE" with curl noise.
 * 3. Explodes outward into an infinite starfield as the camera dollies through.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export function createParticleText(scene) {
  const group = new THREE.Group();
  group.name = 'particle_text_group';
  group.position.set(0, 0, 0);

  // 1. Sample typographic coordinates from an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render "REMANENCE" in high-contrast Instrument Serif
  ctx.font = '400 130px "Instrument Serif", "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '14px';
  ctx.fillText('REMANENCE', canvas.width / 2, canvas.height / 2);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const validPoints = [];
  const step = 4; // Sample every 4th pixel for high density
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4;
      if (data[idx] > 140) {
        // Normalize coordinates to 3D world units (centered at origin)
        const wx = (x - canvas.width / 2) * 0.024;
        const wy = -(y - canvas.height / 2) * 0.024;
        validPoints.push({ x: wx, y: wy });
      }
    }
  }

  const count = validPoints.length;
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const scatters = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  // Colors: warm signal amber, moon white, ping cyan
  const colorAmber = new THREE.Color(0xffb84d);
  const colorWhite = new THREE.Color(0xf5f2ea);
  const colorCyan = new THREE.Color(0x6fe3ff);

  for (let i = 0; i < count; i++) {
    const pt = validPoints[i];

    // Stage 0: Swirling orbital vortex clustered around central beacon
    const orbitRadius = 0.4 + Math.random() * 2.2;
    const orbitAngle = Math.random() * Math.PI * 2;
    const orbitZ = (Math.random() - 0.5) * 1.5;
    positions[i * 3] = Math.cos(orbitAngle) * orbitRadius;
    positions[i * 3 + 1] = Math.sin(orbitAngle) * orbitRadius;
    positions[i * 3 + 2] = orbitZ;

    // Stage 1: Typographic target positions
    targets[i * 3] = pt.x;
    targets[i * 3 + 1] = pt.y;
    targets[i * 3 + 2] = (Math.random() - 0.5) * 0.15; // subtle depth

    // Stage 2: Radial explosion vectors (bursting into deep space stars)
    const scatterDir = new THREE.Vector3(
      pt.x + (Math.random() - 0.5) * 4.0,
      pt.y + (Math.random() - 0.5) * 4.0,
      (Math.random() - 0.5) * 10.0
    ).normalize();
    const scatterSpeed = 25.0 + Math.random() * 55.0;
    scatters[i * 3] = scatterDir.x * scatterSpeed;
    scatters[i * 3 + 1] = scatterDir.y * scatterSpeed;
    scatters[i * 3 + 2] = scatterDir.z * scatterSpeed - 30.0; // stream past camera

    phases[i] = Math.random();
    sizes[i] = 1.2 + Math.random() * 2.4;

    // Color gradient
    const tCol = Math.random();
    const col = tCol < 0.5
      ? colorAmber.clone().lerp(colorWhite, tCol * 2.0)
      : colorWhite.clone().lerp(colorCyan, (tCol - 0.5) * 2.0);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatters, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  // Custom Shader with Smooth Hermite Morphing & Curl Shimmer
  const uniforms = {
    uProgress: { value: 0.0 }, // 0.0 = orbit, 1.0 = assembled text, 2.0 = warp explosion
    uTime: { value: 0.0 },
    uOpacity: { value: 1.0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 aTarget;
      attribute vec3 aScatter;
      attribute float aPhase;
      attribute float aSize;
      attribute vec3 aColor;

      uniform float uProgress;
      uniform float uTime;
      uniform float uPixelRatio;

      varying vec3 vColor;
      varying float vAlpha;

      // Smooth cubic hermite curve
      float smoothEase(float t) {
        return t * t * (3.0 - 2.0 * t);
      }

      void main() {
        vColor = aColor;

        vec3 pos;
        float alpha = 1.0;

        if (uProgress <= 1.0) {
          // Morph from orbit to text
          float p = clamp((uProgress - aPhase * 0.25) / 0.75, 0.0, 1.0);
          float eased = smoothEase(p);

          // Subtle organic swirl noise during transition
          vec3 swirl = vec3(
            sin(uTime * 2.0 + aPhase * 6.28) * 0.25 * (1.0 - eased),
            cos(uTime * 2.0 + aPhase * 6.28) * 0.25 * (1.0 - eased),
            sin(uTime * 1.5 + aPhase * 3.14) * 0.15
          );

          pos = mix(position, aTarget, eased) + swirl;
          alpha = mix(0.45 + sin(uTime * 3.0 + aPhase * 6.28) * 0.35, 0.95, eased);
        } else {
          // Warp explosion: uProgress 1.0 -> 2.0
          float p = clamp(uProgress - 1.0, 0.0, 1.0);
          float eased = p * p; // quadratic acceleration
          pos = aTarget + aScatter * eased;
          alpha = 1.0 - smoothstep(0.4, 1.0, p);
        }

        vAlpha = alpha;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Size attenuation with perspective
        gl_PointSize = (aSize * uPixelRatio * 18.0) / -mvPosition.z;
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        // Soft gaussian circular disc
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        glow = pow(glow, 1.8);

        vec3 col = vColor * (1.0 + glow * 0.8); // bright core
        gl_FragColor = vec4(col, glow * vAlpha * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  group.add(points);
  scene.add(group);

  // Central pulsating amber beacon light
  const beaconGeo = new THREE.SphereGeometry(0.12, 32, 32);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.95
  });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.position.set(0, 0, 0);
  group.add(beaconMesh);

  // Glowing halo sprite for the beacon
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const haloCtx = haloCanvas.getContext('2d');
  const grad = haloCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 185, 75, 1.0)');
  grad.addColorStop(0.3, 'rgba(255, 150, 40, 0.5)');
  grad.addColorStop(0.7, 'rgba(255, 100, 20, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  haloCtx.fillStyle = grad;
  haloCtx.fillRect(0, 0, 128, 128);

  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.scale.set(1.8, 1.8, 1.8);
  group.add(haloSprite);

  function update(delta, time) {
    uniforms.uTime.value = time;

    // Breathing pulse on the amber heartbeat beacon
    if (uniforms.uProgress.value < 1.0) {
      const pulse = 1.0 + Math.sin(time * 3.2) * 0.28;
      beaconMesh.scale.setScalar(pulse);
      haloSprite.scale.setScalar(1.8 * pulse);
      beaconMat.opacity = 0.85 + Math.sin(time * 3.2) * 0.15;
    } else {
      // Fade central beacon as text crystallizes
      const fade = Math.max(0, 1.0 - (uniforms.uProgress.value - 1.0) * 3.0);
      beaconMesh.scale.setScalar(fade);
      haloSprite.scale.setScalar(1.8 * fade);
    }
  }

  // Smoothly assemble particles from swirling orbit into "REMANENCE"
  function assemble(duration = 2.8) {
    return gsap.to(uniforms.uProgress, {
      value: 1.0,
      duration,
      ease: 'power3.inOut'
    });
  }

  // Explode particles into starfield upon entering
  function explode(duration = 1.6) {
    gsap.to(beaconMat, { opacity: 0, duration: 0.5 });
    gsap.to(haloMat, { opacity: 0, duration: 0.5 });
    return gsap.to(uniforms.uProgress, {
      value: 2.0,
      duration,
      ease: 'power2.in',
      onComplete: () => {
        group.visible = false;
      }
    });
  }

  function resetHeroState() {
    group.visible = true;
    uniforms.uProgress.value = 1.0;
    if (uniforms.uOpacity) uniforms.uOpacity.value = 1.0;
    beaconMat.opacity = 0;
    haloMat.opacity = 0;
  }

  function dispose() {
    scene.remove(group);
    geometry.dispose();
    material.dispose();
    beaconGeo.dispose();
    beaconMat.dispose();
    haloTexture.dispose();
    haloMat.dispose();
  }

  return {
    group,
    uniforms,
    update,
    assemble,
    explode,
    resetHeroState,
    dispose
  };
}
