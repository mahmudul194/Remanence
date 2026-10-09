/**
 * Post-Processing Pipeline for REMANENCE
 * Includes UnrealBloom, Film Grain, Vignette, and Signal Glitch Burst.
 * Supports High / Low performance modes and mobile optimization.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// Custom Cinema Shader: Grain, Vignette, Telemetry Glitch, Velocity Aberration, Radial Blur, and Entry Plasma
const CinemaShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainAmount: { value: 0.012 },
    uVignetteDarkness: { value: 0.75 },
    uVignetteOffset: { value: 1.15 },
    uGlitchIntensity: { value: 0.0 },
    uChromaticOffset: { value: 0.0 },
    uRadialBlur: { value: 0.0 },
    uEntryGlow: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainAmount;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uGlitchIntensity;
    uniform float uChromaticOffset;
    uniform float uRadialBlur;
    uniform float uEntryGlow;
    varying vec2 vUv;

    // Pseudo-random noise generator
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233) + uTime * 10.0)) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 toCenter = uv - center;
      float distToCenter = length(toCenter);

      // Subtle signal glitch displacement
      if (uGlitchIntensity > 0.001) {
        float sliceY = floor(uv.y * 30.0);
        float noiseSlice = sin(sliceY * 13.0 + uTime * 45.0);
        if (noiseSlice > 0.4) {
          uv.x += (sin(uTime * 30.0) * 0.015 + 0.005) * uGlitchIntensity;
        }
      }

      // Chromatic aberration strictly capped at 0.0006; 0 during HOLD and rest
      float split = clamp(uChromaticOffset, 0.0, 0.0006);

      // Speed radial blur at screen edges
      vec4 baseColor = vec4(0.0);
      if (uRadialBlur > 0.001 && distToCenter > 0.3) {
        float blurAmt = uRadialBlur * (distToCenter - 0.3) * 0.45;
        vec2 blurDir = toCenter * blurAmt;
        baseColor += texture2D(tDiffuse, uv - blurDir * 2.0) * 0.15;
        baseColor += texture2D(tDiffuse, uv - blurDir) * 0.25;
        baseColor += texture2D(tDiffuse, uv) * 0.30;
        baseColor += texture2D(tDiffuse, uv + blurDir) * 0.20;
        baseColor += texture2D(tDiffuse, uv + blurDir * 2.0) * 0.10;
      } else if (split > 0.00001) {
        float r = texture2D(tDiffuse, uv + vec2(split, 0.0)).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv - vec2(split, 0.0)).b;
        baseColor = vec4(r, g, b, 1.0);
      } else {
        baseColor = texture2D(tDiffuse, uv);
      }

      // Atmospheric entry plasma heat glow (Mars entry)
      if (uEntryGlow > 0.01) {
        float heatEdge = smoothstep(0.42, 0.85, distToCenter);
        float streakNoise = sin(atan(toCenter.y, toCenter.x) * 24.0 + uTime * 40.0) * 0.15;
        float plasma = heatEdge * (uEntryGlow + streakNoise);
        vec3 plasmaColor = mix(vec3(1.0, 0.35, 0.08), vec3(1.0, 0.72, 0.22), streakNoise + 0.5);
        baseColor.rgb = mix(baseColor.rgb, baseColor.rgb + plasmaColor * 1.5, clamp(plasma, 0.0, 0.85));
      }

      // Film Grain
      float noise = (random(uv) - 0.5) * uGrainAmount;
      vec3 color = baseColor.rgb + noise;

      // Soft Vignette
      float vig = smoothstep(uVignetteOffset, uVignetteOffset - 0.45, distToCenter * uVignetteDarkness);
      color *= vig;

      gl_FragColor = vec4(color, baseColor.a);
    }
  `
};

export function createPostProcessing(renderer, scene, camera) {
  let isHighQuality = true;
  const isMobile = window.innerWidth < 768;

  // Use HalfFloatType for high dynamic range precision (prevents specular highlight clipping)
  const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      type: THREE.HalfFloatType
    }
  );
  const composer = new EffectComposer(renderer, renderTarget);

  // 1. Render Pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2. Unreal Bloom Pass (Strict threshold > 1.0 to prevent metallic models and terrain from ever blooming)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.05,                  // strength (delicate, never blows out metal surfaces)
    0.10,                  // radius
    1.25                   // threshold (strictly 1.25: only high-intensity lasers/LEDs bloom)
  );
  composer.addPass(bloomPass);

  // 3. Cinema Shader Pass (Grain, Vignette, Telemetry Glitch, Velocity Aberration)
  const cinemaPass = new ShaderPass(CinemaShader);
  composer.addPass(cinemaPass);

  // 4. Output Tone-mapping Pass
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Glitch trigger controller
  let glitchStartTime = 0;
  let glitchDuration = 0;
  let isGlitching = false;

  // Velocity-driven chromatic aberration tracking with 300ms decay
  let currentChromatic = 0.0;
  let lastScrollTime = performance.now();

  function triggerGlitch(duration = 0.25) {
    glitchStartTime = performance.now();
    glitchDuration = duration * 1000;
    isGlitching = true;
  }

  function setQuality(quality) {
    isHighQuality = quality === 'high';
    bloomPass.enabled = isHighQuality;
    cinemaPass.uniforms.uGrainAmount.value = isHighQuality ? 0.012 : 0.0;
    const pr = isHighQuality ? Math.min(window.devicePixelRatio, 2) : 1;
    renderer.setPixelRatio(pr);
    composer.setSize(window.innerWidth, window.innerHeight);
    return isHighQuality;
  }

  function resize(width, height) {
    composer.setSize(width, height);
    bloomPass.resolution.set(width, height);
  }

  function render(time, velocity = 0, entryGlow = 0) {
    cinemaPass.uniforms.uTime.value = time;

    // Map velocity to subtle chromatic split, capped strictly at 0.0006 (0 in hold/rest)
    const absVel = Math.abs(velocity || 0);
    if (absVel > 0.05) {
      currentChromatic = Math.min(0.0006, absVel * 0.0001);
      lastScrollTime = performance.now();
    } else {
      // Decay to 0 within 300ms when resting
      const elapsed = performance.now() - lastScrollTime;
      if (elapsed > 50) {
        const decay = Math.max(0.0, 1.0 - (elapsed - 50) / 250);
        currentChromatic *= decay;
        if (currentChromatic < 0.00001) currentChromatic = 0.0;
      }
    }
    cinemaPass.uniforms.uChromaticOffset.value = currentChromatic;
    cinemaPass.uniforms.uRadialBlur.value = Math.min(0.04, absVel * 0.04);
    cinemaPass.uniforms.uEntryGlow.value = entryGlow;

    // Update glitch burst decay
    if (isGlitching) {
      const elapsed = performance.now() - glitchStartTime;
      if (elapsed > glitchDuration) {
        isGlitching = false;
        cinemaPass.uniforms.uGlitchIntensity.value = 0.0;
      } else {
        const progress = elapsed / glitchDuration;
        cinemaPass.uniforms.uGlitchIntensity.value = Math.sin(progress * Math.PI) * 0.5;
      }
    }

    composer.render();
  }

  // Initial quality setup
  if (isMobile) {
    setQuality('low');
  }

  return {
    composer,
    bloomPass,
    cinemaPass,
    triggerGlitch,
    setQuality,
    resize,
    render,
    get isHighQuality() {
      return isHighQuality;
    }
  };
}
