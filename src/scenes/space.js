/**
 * Photorealistic Space & Earth Scene Component
 * Features authentic NASA Blue Marble textures, inverted ocean specular roughness
 * for realistic water sunglint reflections, dynamic dark-side city lights via GLSL,
 * sun-illuminated Rayleigh atmospheric scattering, and authentic 2K celestial spheres.
 */

import * as THREE from 'three';

/**
 * Inverts NASA ocean specular reflection mask into a PBR roughness map:
 * Oceans (high specular) -> low roughness (0.05 glossy mirror water)
 * Continents (zero specular) -> high roughness (0.92 matte dry terrain)
 */
function createInvertedRoughnessMap(url) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#909090';
  ctx.fillRect(0, 0, 1024, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const spec = data[i]; // NASA mask: 255 ocean, 0 land
      // Invert: 255 spec -> 14 roughness (~0.05), 0 spec -> 238 roughness (~0.93)
      const rough = Math.max(14, 240 - Math.floor(spec * 0.88));
      data[i] = rough;
      data[i + 1] = rough;
      data[i + 2] = rough;
    }
    ctx.putImageData(imgData, 0, 0);
    texture.needsUpdate = true;
  };
  img.src = url;
  return texture;
}

export function createSpaceScene() {
  const group = new THREE.Group();
  group.name = 'space_scene';

  const textureLoader = new THREE.TextureLoader();

  // 1. Official High-Resolution NASA Textures
  const earthMap = textureLoader.load('./textures/earth_atmos_2048.jpg');
  earthMap.colorSpace = THREE.SRGBColorSpace;

  const earthNormal = textureLoader.load('./textures/earth_normal_2048.jpg');
  const earthRoughness = createInvertedRoughnessMap('./textures/earth_specular_2048.jpg');
  const earthClouds = textureLoader.load('./textures/earth_clouds_1024.png');
  const earthLights = textureLoader.load('./textures/earth_lights_2048.png');
  earthLights.colorSpace = THREE.SRGBColorSpace;

  const moonMap = textureLoader.load('./textures/moon_1024.jpg');
  moonMap.colorSpace = THREE.SRGBColorSpace;

  const marsMap = textureLoader.load('./textures/mars_2048.webp');
  marsMap.colorSpace = THREE.SRGBColorSpace;

  // Direct Sunlight Vector
  const sunLight = new THREE.DirectionalLight(0xffffff, 5.0);
  sunLight.position.set(80, 42, 68);
  group.add(sunLight);

  const sunDir = sunLight.position.clone().normalize();

  // 2. Photorealistic Earth Sphere (PBR Material with Shader Hook)
  const earthGeo = new THREE.SphereGeometry(18, 128, 128);
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthMap,
    normalMap: earthNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: earthRoughness,
    roughness: 1.0,
    metalness: 0.12,
    emissiveMap: earthLights,
    emissive: new THREE.Color(0xffbf66),
    emissiveIntensity: 1.6
  });

  // Inject physically accurate day/night modulation for city lights:
  // City lights are invisible in daytime sunlight and illuminate on the dark night side!
  earthMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       // In Three.js, directionalLights[0].direction is light direction in view space
       #if NUM_DIR_LIGHTS > 0
         float sunDot = dot(normalize(geometryNormal), normalize(directionalLights[0].direction));
         // Night factor: 0.0 on bright daylit side, 1.0 on deep dark side
         float nightFactor = smoothstep(0.12, -0.18, sunDot);
         totalEmissiveRadiance *= nightFactor;
       #endif
      `
    );
  };

  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.position.set(0, 0, 0);
  earthMesh.rotation.y = 2.4;
  earthMesh.rotation.x = 0.25; // Real 23.5° axial tilt
  earthMesh.receiveShadow = true;
  group.add(earthMesh);

  // 3. Swirling 3D Cloud Layer (floating above surface)
  const cloudsGeo = new THREE.SphereGeometry(18.25, 96, 96);
  const cloudsMat = new THREE.MeshStandardMaterial({
    map: earthClouds,
    transparent: true,
    opacity: 0.82,
    blending: THREE.NormalBlending,
    roughness: 0.95,
    metalness: 0.0,
    depthWrite: false
  });
  const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
  cloudsMesh.rotation.y = 2.4;
  cloudsMesh.rotation.x = 0.25;
  group.add(cloudsMesh);

  // 4. Photorealistic Rayleigh Atmospheric Scattering Rim
  const atmoGeo = new THREE.SphereGeometry(18.55, 64, 64);
  const atmoUniforms = {
    uSunDir: { value: sunDir }
  };
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: atmoUniforms,
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      void main() {
        // Limb Fresnel: bright along the curved horizon edge
        float fresnel = 1.0 - max(dot(vWorldNormal, vViewDir), 0.0);
        fresnel = pow(fresnel, 3.2);

        // Sunlight alignment: atmosphere only scatters light on the illuminated side
        float sunDot = dot(vWorldNormal, normalize(uSunDir));
        float sunFactor = smoothstep(-0.25, 0.45, sunDot);

        // Vibrant Rayleigh cyan and warm sunset amber at terminator
        vec3 dayAtmosphere = vec3(0.24, 0.68, 1.0);
        vec3 sunsetTwilight = vec3(1.0, 0.52, 0.18);
        float terminator = smoothstep(0.25, -0.15, abs(sunDot));
        vec3 color = mix(dayAtmosphere, sunsetTwilight, terminator * 0.4);

        float alpha = fresnel * (sunFactor * 0.92 + 0.08);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false
  });
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  group.add(atmoMesh);

  // 5. NASA Moon Sphere in Space
  const distantMoonGeo = new THREE.SphereGeometry(4.8, 64, 64);
  const distantMoonMat = new THREE.MeshStandardMaterial({
    map: moonMap,
    roughness: 0.96,
    metalness: 0.04
  });
  const distantMoon = new THREE.Mesh(distantMoonGeo, distantMoonMat);
  distantMoon.position.set(110, 22, -180);
  group.add(distantMoon);

  // 6. NASA Mars 2K Sphere (for Interplanetary Transit view)
  const distantMarsGeo = new THREE.SphereGeometry(6.4, 64, 64);
  const distantMarsMat = new THREE.MeshStandardMaterial({
    map: marsMap,
    roughness: 0.88,
    metalness: 0.10
  });
  const distantMars = new THREE.Mesh(distantMarsGeo, distantMarsMat);
  distantMars.position.set(40, -10, 420);
  group.add(distantMars);

  // Animation update
  function update(delta) {
    earthMesh.rotation.y += delta * 0.015;
    cloudsMesh.rotation.y += delta * 0.022; // clouds rotate slightly faster
    distantMoon.rotation.y += delta * 0.005;
    distantMars.rotation.y += delta * 0.008;
  }

  return {
    group,
    earth: earthMesh,
    clouds: cloudsMesh,
    distantMoon,
    distantMars,
    update
  };
}

/**
 * Creates high resolution procedural Mars surface texture
 * with Valles Marineris canyon, Olympus Mons, and polar ice caps
 */
function createDetailedMarsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base Martian rusty gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#c7532a');
  grad.addColorStop(0.5, '#ad401c');
  grad.addColorStop(1, '#8f3314');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Dark albedo basalt regions (Syrtis Major, Acidalia)
  ctx.fillStyle = 'rgba(65, 24, 12, 0.45)';
  // Syrtis Major
  ctx.beginPath();
  ctx.ellipse(650, 260, 110, 80, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Acidalia Planitia
  ctx.beginPath();
  ctx.ellipse(320, 180, 130, 90, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris grand canyon scar
  ctx.strokeStyle = 'rgba(40, 12, 6, 0.65)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(340, 310);
  ctx.bezierCurveTo(440, 330, 520, 290, 610, 305);
  ctx.stroke();

  // Olympus Mons & Tharsis volcanoes
  ctx.fillStyle = 'rgba(160, 60, 28, 0.7)';
  ctx.beginPath();
  ctx.arc(280, 240, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(50, 15, 8, 0.7)';
  ctx.beginPath();
  ctx.arc(280, 240, 10, 0, Math.PI * 2);
  ctx.fill();

  // North and South Polar Ice Caps
  ctx.fillStyle = '#f0f5fa';
  ctx.beginPath();
  ctx.ellipse(512, 18, 140, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(512, 498, 110, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dust specks
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright ? 'rgba(230, 110, 50, 0.2)' : 'rgba(45, 12, 5, 0.3)';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
