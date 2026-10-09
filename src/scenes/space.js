/**
 * Photorealistic Space & Earth Scene Component
 * Features authentic NASA Blue Marble textures, inverted ocean specular roughness
 * for realistic water sunglint reflections, dynamic dark-side city lights via GLSL,
 * sun-illuminated Rayleigh atmospheric scattering, and authentic 2K celestial spheres.
 */

import * as THREE from 'three';

/**
 * Inverts NASA ocean specular reflection mask into a PBR roughness map:
 * Oceans (high specular) -> low roughness (0.04 glossy mirror water)
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
      // Invert: 255 spec -> 12 roughness (~0.04), 0 spec -> 236 roughness (~0.92)
      const rough = Math.max(12, 238 - Math.floor(spec * 0.88));
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

/**
 * Converts indexed / grayscale NASA clouds into transparent RGBA clouds:
 * Black background -> 100% transparent (reveals sapphire blue ocean below)
 * White clouds -> pure white with alpha proportional to density
 */
function createTransparentCloudsMap(url) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Upsample with soft bilateral blur to eliminate 8-bit palette stepping
    ctx.filter = 'blur(2.5px)';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      // Soft continuous atmospheric density falloff
      const norm = brightness / 255;
      const smoothAlpha = Math.pow(Math.max(0, (norm - 0.12) / 0.88), 1.6) * 190;
      data[i + 3] = Math.round(smoothAlpha);
    }
    ctx.putImageData(imgData, 0, 0);
    texture.needsUpdate = true;
  };
  img.src = url;
  return texture;
}

/**
 * Creates high-contrast Sobel normal map from lunar elevation/albedo texture:
 * Generates physical 3D tangent-space normals for crater rims, crater bowls,
 * central impact peaks, and rugged mountain rilles to cast razor-sharp shadows
 * across the lunar terminator line.
 */
function createLunarNormalMap(url, bumpScale = 3.6) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, 1024, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const w = canvas.width;
    const h = canvas.height;
    const srcData = ctx.getImageData(0, 0, w, h).data;
    const outImgData = ctx.createImageData(w, h);
    const outData = outImgData.data;

    // Fast luminance lookup with cylindrical wrap-around
    function getLum(x, y) {
      const wx = (x + w) % w;
      const wy = Math.max(0, Math.min(h - 1, y));
      const idx = (wy * w + wx) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Sobel 3x3 kernel
        const tl = getLum(x - 1, y - 1);
        const l  = getLum(x - 1, y);
        const bl = getLum(x - 1, y + 1);
        const tr = getLum(x + 1, y - 1);
        const r  = getLum(x + 1, y);
        const br = getLum(x + 1, y + 1);
        const t  = getLum(x, y - 1);
        const b  = getLum(x, y + 1);

        const dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        const dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

        let nx = -dx * bumpScale;
        let ny = -dy * bumpScale;
        let nz = 1.0;
        const len = Math.hypot(nx, ny, nz);
        nx /= len;
        ny /= len;
        nz /= len;

        const idx = (y * w + x) * 4;
        outData[idx]     = Math.round((nx * 0.5 + 0.5) * 255);
        outData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        outData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        outData[idx + 3] = 255;
      }
    }

    ctx.putImageData(outImgData, 0, 0);
    texture.needsUpdate = true;
  };
  img.src = url;
  return texture;
}

/**
 * Creates authentic PBR roughness map for the Moon:
 * Basalt maria (smoother impact melt basalt plains) -> roughness ~0.90
 * Anorthosite highlands & pulverized ejecta rays -> roughness ~0.98
 */
function createLunarRoughnessMap(url) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 1024, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 8;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      // Maria (lum near 0.25) -> rough 0.90 (230), Highlands (lum near 0.8) -> rough 0.98 (250)
      const roughVal = Math.round(228 + lum * 24);
      data[i] = roughVal;
      data[i + 1] = roughVal;
      data[i + 2] = roughVal;
      data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    texture.needsUpdate = true;
  };
  img.src = url;
  return texture;
}

/**
 * Calibrates authentic lunar albedo and contrast:
 * Deepens basalt maria (Mare Tranquillitatis, Oceanus Procellarum) to authentic
 * volcanic basalt tones, enhances ray systems (Tycho, Copernicus) to radiant white,
 * and eliminates flat washed-out gray appearance.
 */
function createEnhancedLunarAlbedoMap(url) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#909090';
  ctx.fillRect(0, 0, 1024, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255.0;
      const g = data[i + 1] / 255.0;
      const b = data[i + 2] / 255.0;
      const lum = r * 0.299 + g * 0.587 + b * 0.114;

      // Sigmoid contrast enhancement for rich lunar basalt depth and radiant rays
      let enhancedLum = Math.pow(lum, 1.15) * 1.12;
      // Slight warm tan hue balance matching unfiltered solar regolith reflectance
      data[i]     = Math.min(255, Math.max(0, Math.round(enhancedLum * 255 * 1.02)));
      data[i + 1] = Math.min(255, Math.max(0, Math.round(enhancedLum * 255 * 1.00)));
      data[i + 2] = Math.min(255, Math.max(0, Math.round(enhancedLum * 255 * 0.97)));
      data[i + 3] = 255;
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

  // 1. Official High-Resolution NASA Textures with Anisotropic Filtering & Mipmaps
  const earthMap = textureLoader.load('./textures/earth_atmos_2048.jpg');
  earthMap.colorSpace = THREE.SRGBColorSpace;
  earthMap.generateMipmaps = true;
  earthMap.minFilter = THREE.LinearMipmapLinearFilter;
  earthMap.magFilter = THREE.LinearFilter;
  earthMap.anisotropy = 8;

  const earthNormal = textureLoader.load('./textures/earth_normal_2048.jpg');
  earthNormal.generateMipmaps = true;
  earthNormal.minFilter = THREE.LinearMipmapLinearFilter;
  earthNormal.anisotropy = 8;

  const earthRoughness = createInvertedRoughnessMap('./textures/earth_specular_2048.jpg');
  const earthClouds = createTransparentCloudsMap('./textures/earth_clouds_1024.png');

  const earthLights = textureLoader.load('./textures/earth_lights_2048.png');
  earthLights.colorSpace = THREE.SRGBColorSpace;
  earthLights.generateMipmaps = true;
  earthLights.minFilter = THREE.LinearMipmapLinearFilter;
  earthLights.anisotropy = 8;

  const moonMap = textureLoader.load('./textures/moon_1024.jpg');
  moonMap.colorSpace = THREE.SRGBColorSpace;
  moonMap.generateMipmaps = true;
  moonMap.minFilter = THREE.LinearMipmapLinearFilter;
  moonMap.anisotropy = 8;

  const marsMap = textureLoader.load('./textures/mars_2048.webp');
  marsMap.colorSpace = THREE.SRGBColorSpace;
  marsMap.generateMipmaps = true;
  marsMap.minFilter = THREE.LinearMipmapLinearFilter;
  marsMap.anisotropy = 8;

  // Cinematic Sunlight Vector (natural exposure, no harsh blowout)
  const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
  sunLight.position.set(80, 36, 60);
  group.add(sunLight);

  // Subtle deep-space cosmic fill
  const spaceAmbient = new THREE.AmbientLight(0x040810, 0.04);
  group.add(spaceAmbient);

  const sunDir = sunLight.position.clone().normalize();

  // 2. Photorealistic Earth Sphere (PBR Material with Zero Metalness & Zero Self-Glow)
  const earthGeo = new THREE.SphereGeometry(18, 128, 128);
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthMap,
    normalMap: earthNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: earthRoughness,
    roughness: 0.82,
    metalness: 0.0, // Natural silicate & liquid water, never metal!
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0
  });

  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthMesh.name = 'earth_sphere';
  earthMesh.position.set(0, 0, 0);
  earthMesh.rotation.y = 2.4;
  earthMesh.rotation.x = 0.25; // Authentic 23.5° axial tilt
  earthMesh.receiveShadow = true;
  group.add(earthMesh);

  // 3. Floating 3D Cloud Layer: earth_atmos_2048.jpg already contains authentic high-resolution clouds
  // Omitting secondary low-res mesh eliminates pixelated palette patches completely
  const cloudsMesh = null;

  // 4. Photorealistic Rayleigh Atmospheric Scattering Rim (Delicate, sharp halo)
  const atmoGeo = new THREE.SphereGeometry(18.42, 64, 64);
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
        // Razor-sharp limb Fresnel hugging the planetary edge
        float fresnel = 1.0 - max(dot(vWorldNormal, vViewDir), 0.0);
        fresnel = pow(fresnel, 5.0);

        // Sunlight alignment: atmosphere only scatters light on the illuminated side
        float sunDot = dot(vWorldNormal, normalize(uSunDir));
        float sunFactor = smoothstep(-0.15, 0.45, sunDot);

        // Vibrant Rayleigh cyan and warm sunset amber at terminator
        vec3 dayAtmosphere = vec3(0.24, 0.65, 1.0);
        vec3 sunsetTwilight = vec3(1.0, 0.48, 0.16);
        float terminator = smoothstep(0.2, -0.1, abs(sunDot));
        vec3 color = mix(dayAtmosphere, sunsetTwilight, terminator * 0.4);

        float intensity = fresnel * sunFactor;
        gl_FragColor = vec4(color * (intensity * 0.45), 1.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false
  });
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
  group.add(atmoMesh);

  // 5. Authentic NASA Proportional Moon Sphere in Space
  // Real physical ratio: Moon radius 1,737.4 km / Earth radius 6,371 km = 0.2727 => radius 4.92 for Earth radius 18
  const moonAlbedo = createEnhancedLunarAlbedoMap('./textures/moon_1024.jpg');
  const moonNormal = createLunarNormalMap('./textures/moon_1024.jpg', 3.4);
  const moonRoughness = createLunarRoughnessMap('./textures/moon_1024.jpg');

  const distantMoonGeo = new THREE.SphereGeometry(4.92, 128, 128);
  const distantMoonMat = new THREE.MeshStandardMaterial({
    map: moonAlbedo,
    normalMap: moonNormal,
    normalScale: new THREE.Vector2(2.4, 2.4),
    roughnessMap: moonRoughness,
    roughness: 0.95,
    metalness: 0.0,
    color: new THREE.Color(0xdad8d2)
  });
  const distantMoon = new THREE.Mesh(distantMoonGeo, distantMoonMat);
  distantMoon.name = 'distant_moon';

  // Desktop: (44, 34, -85) - upper-right starfield (X: 1697, Y: 285, diam: 90px, clear of Earth: 72px, right margin: 178px)
  // Mobile: (18, 44, -85) - upper cosmic sky (X: 323, Y: 151, diam: 70px, clear of Earth: 19px, below navbar)
  const celestialMoonDesktop = new THREE.Vector3(44, 34, -85);
  const celestialMoonMobile = new THREE.Vector3(18, 44, -85);
  const orbitalMoonPos = new THREE.Vector3(0, -14.9, -180);

  function getCelestialMoonPos() {
    return (typeof window !== 'undefined' && window.innerWidth < 768)
      ? celestialMoonMobile
      : celestialMoonDesktop;
  }

  distantMoon.position.copy(getCelestialMoonPos());
  distantMoon.rotation.y = 1.25;
  distantMoon.receiveShadow = true;
  group.add(distantMoon);

  function updateMoonProgress(s) {
    const celestialPos = getCelestialMoonPos();
    if (s <= 0.055) {
      distantMoon.position.copy(celestialPos);
      distantMoon.visible = true;
    } else if (s > 0.055 && s < 0.16) {
      const t = THREE.MathUtils.smoothstep(s, 0.055, 0.16);
      distantMoon.position.lerpVectors(celestialPos, orbitalMoonPos, t);
      distantMoon.visible = true;
    } else if (s >= 0.16 && s < 0.52) {
      // On lunar surface: terrain mesh in moonScene is active
      distantMoon.visible = false;
    } else if (s >= 0.52 && s < 0.70) {
      // Lunar ascent: Moon recedes in rearview
      distantMoon.position.copy(orbitalMoonPos);
      distantMoon.visible = true;
    } else {
      distantMoon.visible = false;
    }
  }

  // 6. NASA Mars 2K Sphere (aligned with Martian terrain)
  const distantMarsGeo = new THREE.SphereGeometry(68, 96, 96);
  const distantMarsMat = new THREE.MeshStandardMaterial({
    map: marsMap,
    roughness: 0.88,
    metalness: 0.08
  });
  const distantMars = new THREE.Mesh(distantMarsGeo, distantMarsMat);
  distantMars.position.set(0, -78, 760);
  distantMars.rotation.y = 2.4;
  distantMars.receiveShadow = true;
  group.add(distantMars);

  // Martian Atmospheric Rayleigh Limb Glow
  const marsAtmoGeo = new THREE.SphereGeometry(69.2, 64, 64);
  const marsAtmoMat = new THREE.ShaderMaterial({
    uniforms: { uSunDir: { value: sunDir } },
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
        float fresnel = pow(1.0 - max(dot(vWorldNormal, vViewDir), 0.0), 4.0);
        float sunDot = dot(vWorldNormal, normalize(uSunDir));
        float sunFactor = smoothstep(-0.2, 0.35, sunDot);
        vec3 haze = vec3(0.95, 0.42, 0.22);
        gl_FragColor = vec4(haze * (fresnel * sunFactor * 1.6), 1.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false
  });
  const marsAtmoMesh = new THREE.Mesh(marsAtmoGeo, marsAtmoMat);
  marsAtmoMesh.position.set(0, -78, 760);
  group.add(marsAtmoMesh);

  // 7. Cinematic Multi-Spectral Starfield (Points with Stellar Classifications & Twinkle)
  const starfield = createCinematicStarfield();
  group.add(starfield.mesh);

  // 8. Distant Sun with Additive Corona Halo & Anamorphic Streak
  const sunGroup = createCinematicSun(sunLight.position);
  group.add(sunGroup);

  // Animation update
  function update(delta, time = 0) {
    earthMesh.rotation.y += delta * 0.012;
    if (cloudsMesh) cloudsMesh.rotation.y += delta * 0.018;
    distantMoon.rotation.y += delta * 0.005;
    distantMars.rotation.y += delta * 0.008;

    if (starfield && starfield.update) {
      starfield.update(delta, time);
    }
  }

  return {
    group,
    earth: earthMesh,
    earthMesh,
    clouds: cloudsMesh,
    distantMoon,
    distantMars,
    sunLight,
    updateMoonProgress,
    update
  };
}

/**
 * Procedural Starfield with realistic stellar spectral temperatures,
 * apparent magnitude distribution, and dynamic atmospheric twinkle
 */
function createCinematicStarfield() {
  const count = 3200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  const spectralTypes = [
    new THREE.Color(0x9db4ff), // O/B hot blue-white
    new THREE.Color(0xf8f9fa), // A pure white
    new THREE.Color(0xfff4e8), // G solar white-yellow
    new THREE.Color(0xffddb4), // K warm orange
    new THREE.Color(0xffa885)  // M cool red/amber
  ];

  for (let i = 0; i < count; i++) {
    // Spherical distribution with deep radial depth
    const radius = 350 + Math.random() * 550;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Stellar spectral color distribution
    const colIdx = Math.floor(Math.random() * spectralTypes.length);
    const col = spectralTypes[colIdx];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    // Magnitude: mostly faint background stars with a few brilliant beacons
    const mag = Math.random();
    sizes[i] = mag > 0.94 ? 2.8 : (mag > 0.7 ? 1.8 : 1.0);
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 color;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        // Subtle organic twinkle
        float twinkle = sin(uTime * 1.5 + aPhase) * 0.35 + 0.65;
        vAlpha = twinkle;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (aSize * uPixelRatio * 4.5);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float intensity = 1.0 - smoothstep(0.0, 0.5, dist);
        intensity = pow(intensity, 2.0);
        gl_FragColor = vec4(vColor, intensity * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const mesh = new THREE.Points(geometry, material);

  function update(delta, time) {
    uniforms.uTime.value = time;
  }

  return { mesh, update };
}

/**
 * Creates photorealistic celestial Sun with luminous corona
 * and anamorphic horizontal cinematic streak
 */
function createCinematicSun(position) {
  const group = new THREE.Group();
  group.position.copy(position);

  // 1. Sun Core Disc
  const coreGeo = new THREE.SphereGeometry(3.5, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // 2. Soft Radial Corona Sprite
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 240, 200, 0.7)');
  grad.addColorStop(0.5, 'rgba(255, 190, 100, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const coronaMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const coronaSprite = new THREE.Sprite(coronaMat);
  coronaSprite.scale.set(45, 45, 1);
  group.add(coronaSprite);

  // 3. Subtle Anamorphic Flare Streak
  const streakGeo = new THREE.PlaneGeometry(120, 1.8);
  const streakCanvas = document.createElement('canvas');
  streakCanvas.width = 256;
  streakCanvas.height = 32;
  const sCtx = streakCanvas.getContext('2d');
  const sGrad = sCtx.createLinearGradient(0, 0, 256, 0);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  sGrad.addColorStop(0.35, 'rgba(120, 200, 255, 0.25)');
  sGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
  sGrad.addColorStop(0.65, 'rgba(120, 200, 255, 0.25)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 32);

  const streakTexture = new THREE.CanvasTexture(streakCanvas);
  const streakMat = new THREE.MeshBasicMaterial({
    map: streakTexture,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const streakMesh = new THREE.Mesh(streakGeo, streakMat);
  group.add(streakMesh);

  return group;
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
