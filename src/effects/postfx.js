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

// Custom Cinema Shader: Grain, Vignette, and Glitch Burst
const CinemaShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainAmount: { value: 0.015 },
    uVignetteDarkness: { value: 0.75 },
    uVignetteOffset: { value: 1.15 },
    uGlitchIntensity: { value: 0.0 }
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
    varying vec2 vUv;

    // Pseudo-random noise generator
    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233) + uTime * 10.0)) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Signal Glitch displacement
      if (uGlitchIntensity > 0.001) {
        float sliceY = floor(uv.y * 30.0);
        float noiseSlice = sin(sliceY * 13.0 + uTime * 45.0);
        if (noiseSlice > 0.4) {
          uv.x += (sin(uTime * 30.0) * 0.03 + 0.01) * uGlitchIntensity;
        }
      }

      // Chromatic aberration split during glitch
      vec4 baseColor;
      if (uGlitchIntensity > 0.001) {
        float split = 0.012 * uGlitchIntensity;
        float r = texture2D(tDiffuse, uv + vec2(split, 0.0)).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv - vec2(split, 0.0)).b;
        baseColor = vec4(r, g, b, 1.0);
      } else {
        baseColor = texture2D(tDiffuse, uv);
      }

      // Film Grain
      float noise = (random(uv) - 0.5) * uGrainAmount;
      vec3 color = baseColor.rgb + noise;

      // Soft Vignette
      vec2 coord = (uv - 0.5) * vec2(1.0, 1.0);
      float rf = length(coord);
      float vig = smoothstep(uVignetteOffset, uVignetteOffset - 0.45, rf * uVignetteDarkness);
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

  // 2. Unreal Bloom Pass (High threshold so ONLY emissive beacons & lasers bloom)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    isMobile ? 0.35 : 0.55, // strength
    0.15,                  // radius
    0.85                   // threshold (critical: prevents blur on terrain and UI)
  );
  composer.addPass(bloomPass);

  // 3. Cinema Shader Pass (Grain, Vignette, Telemetry Glitch)
  const cinemaPass = new ShaderPass(CinemaShader);
  composer.addPass(cinemaPass);

  // 4. Output Tone-mapping Pass
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Glitch trigger controller
  let glitchStartTime = 0;
  let glitchDuration = 0;
  let isGlitching = false;

  function triggerGlitch(duration = 0.35) {
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

  function render(time) {
    cinemaPass.uniforms.uTime.value = time;

    // Update glitch burst decay
    if (isGlitching) {
      const elapsed = performance.now() - glitchStartTime;
      if (elapsed > glitchDuration) {
        isGlitching = false;
        cinemaPass.uniforms.uGlitchIntensity.value = 0.0;
      } else {
        const progress = elapsed / glitchDuration;
        cinemaPass.uniforms.uGlitchIntensity.value = Math.sin(progress * Math.PI) * 1.0;
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
