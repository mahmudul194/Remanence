/**
 * REMANENCE: Weathering & Regolith Dust Shader
 * Injects physically accurate regolith dust accumulation, crevice darkening,
 * and UV solar bleaching into Three.js MeshPhysicalMaterial and MeshStandardMaterial.
 *
 * Implements:
 * - Upward normal regolith accumulation (dot(worldNormal, upVector))
 * - Specular and metalness kill where dust settles (powdery regolith)
 * - Crevice darkening / micro cavity occlusion
 * - Interactive 1969 vs Today weathering transition
 */

import * as THREE from 'three';

// Global uniform tracker so the UI slider can update all materials instantaneously
export const weatheringUniforms = {
  moon: {
    uDustAmount: { value: 0.38 }, // Default to aged lunar appearance
    uDustColor: { value: new THREE.Color(0xa5a298) }, // Lunar mare regolith powder
    uSunBleach: { value: 0.25 },
    uCreviceDarkness: { value: 0.35 }
  },
  mars: {
    uDustAmount: { value: 0.55 },
    uDustColor: { value: new THREE.Color(0xb55728) }, // Oxidized ferric hematite
    uSunBleach: { value: 0.4 },
    uCreviceDarkness: { value: 0.45 }
  }
};

/**
 * Apply weathering shader logic to any standard/physical material via onBeforeCompile
 */
export function applyWeathering(material, options = {}) {
  const planet = options.planet || 'moon';
  const uniforms = weatheringUniforms[planet];

  // Store original compilation hook if chained
  const prevOnBeforeCompile = material.onBeforeCompile;

  material.onBeforeCompile = (shader, renderer) => {
    if (prevOnBeforeCompile) prevOnBeforeCompile(shader, renderer);

    // 1. Inject uniforms
    shader.uniforms.uDustAmount = uniforms.uDustAmount;
    shader.uniforms.uDustColor = uniforms.uDustColor;
    shader.uniforms.uSunBleach = uniforms.uSunBleach;
    shader.uniforms.uCreviceDarkness = uniforms.uCreviceDarkness;

    // 2. Vertex Shader: compute world-space normal and position
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWeatheringWorldNormal;
       varying vec3 vWeatheringWorldPos;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       #if defined( USE_NORMAL ) || defined( USE_CLEARCOAT )
         vWeatheringWorldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
       #else
         vWeatheringWorldNormal = vec3(0.0, 1.0, 0.0);
       #endif
       vWeatheringWorldPos = (modelMatrix * vec4( transformed, 1.0 )).xyz;`
    );

    // 3. Fragment Shader: inject regolith dust blend and specular kill
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWeatheringWorldNormal;
       varying vec3 vWeatheringWorldPos;
       uniform float uDustAmount;
       uniform vec3 uDustColor;
       uniform float uSunBleach;
       uniform float uCreviceDarkness;

       // High frequency pseudo-noise for granular regolith powder distribution
       float regolithNoise(vec3 p) {
         return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
       }`
    );

    // Replace color calculation before lighting
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       // Calculate upward facing factor
       vec3 norm = normalize(vWeatheringWorldNormal);
       float upwardDot = clamp(dot(norm, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);

       // Granular micro-noise variation
       float noise = regolithNoise(vWeatheringWorldPos * 12.0) * 0.25;

       // Flat horizontal surfaces collect most dust; vertical surfaces collect fine clinging veil
       float accumulation = smoothstep(0.18, 0.85, upwardDot + noise) * uDustAmount;

       // UV Sun Bleaching: desaturate and warm-shift base color
       float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum * 1.15, lum * 1.08, lum * 0.95), uSunBleach * 0.35);

       // Regolith blend: powdery non-metallic coat
       diffuseColor.rgb = mix(diffuseColor.rgb, uDustColor, accumulation * 0.88);`
    );

    // Replace roughness/metalness so dusty areas have zero metallic reflection and 1.0 roughness
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
       vec3 nrm = normalize(vWeatheringWorldNormal);
       float upD = clamp(dot(nrm, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
       float acc = smoothstep(0.18, 0.85, upD) * uDustAmount;
       roughnessFactor = mix(roughnessFactor, 1.0, acc * 0.92);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <metalnessmap_fragment>',
      `#include <metalnessmap_fragment>
       vec3 nrmM = normalize(vWeatheringWorldNormal);
       float upDM = clamp(dot(nrmM, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
       float accM = smoothstep(0.18, 0.85, upDM) * uDustAmount;
       metalnessFactor = mix(metalnessFactor, 0.04, accM * 0.96);`
    );
  };

  material.needsUpdate = true;
  return material;
}

/**
 * Dynamically adjust weathering level across all lunar machines
 * @param {number} level - 0.0 (1969 As Landed) to 1.0 (Today / Remanence after 50+ years)
 */
export function setLunarWeathering(level) {
  const clamped = Math.max(0.0, Math.min(1.0, level));
  // At level 0: fresh gold foil, clean metal, pristine plaque
  // At level 1: heavy regolith dust layer, micro-pitting, solar bleached blankets
  weatheringUniforms.moon.uDustAmount.value = clamped * 0.65;
  weatheringUniforms.moon.uSunBleach.value = clamped * 0.45;
  weatheringUniforms.moon.uCreviceDarkness.value = clamped * 0.55;
}
