# REMANENCE: What remains.
> **NASA Space Apps Challenge 2026 (Bangladesh Regional)**  
> **Challenge:** Abandoned but Not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars  
> **Team:** Apollo 404  

---

## 🛰️ About The Project
**Remanence** *(n.)* is the residual magnetism left in a material after the magnetizing force is removed. In our story, it stands for the physical and spiritual traces left behind by human machines that have gone silent across the Solar System.

From the golden descent stage of Apollo 11 sitting in the airless stillness of Mare Tranquillitatis to the dust-covered solar arrays of Opportunity beneath an Endeavour Crater dust storm, **REMANENCE** takes visitors on a scroll-driven, cinematic 3D journey through space and time.

---

## ⚡ Tech Stack
- **Core Framework**: Vite + Vanilla JavaScript (ES Modules)
- **3D Graphics Engine**: Three.js (r186) with procedural terrains, celestial lighting, and shadow mapping
- **Camera Spline & Animation**: GSAP + ScrollTrigger with smooth cubic Catmull-Rom curve camera flight (`CatmullRomCurve3`)
- **Smooth Inertia Scroll**: Lenis (Studio Freight) synchronized with GSAP's internal ticker
- **Post-Processing**: Three.js EffectComposer with `UnrealBloomPass`, custom `FilmGrainPass`, `VignettePass`, and the **Apollo 404 Glitch Burst** shader
- **In-Scene 3D Captions**: `troika-three-text` (SDF 3D monospace telemetry labels)
- **Telemetry HUD Typography**: `SplitType` for letter-by-letter typed mission logs
- **Sound Architecture**: Procedural Web Audio API synthesizer + Howler.js fallback for zero-dependency immediate space hum, Martian wind, radar sonar pings, and laser chirps
- **Asset Pipeline**: GLTFLoader + DRACOLoader with automatic fallback to high-detail procedural 3D models

---

## 📂 Project Structure
```text
Remanence/
├── index.html                 # Main HTML with loading screen, HUD, and mission cards
├── package.json               # ES module package manifest & scripts
├── vite.config.js             # Vite configuration with relative base paths
├── README.md                  # Team and project documentation
├── public/
│   ├── favicon.svg            # Radar pulse SVG icon
│   ├── models/                # NASA 3D .glb models (optional, with fallback)
│   ├── textures/              # Custom planetary textures (optional, with fallback)
│   └── sounds/                # Royalty-free audio tracks (optional, with fallback)
└── src/
    ├── main.js                # App entry point, WebGL canvas setup, and render loop
    ├── styles.css             # Mission-control CSS, ghost trail, glassmorphism
    ├── audio.js               # Procedural Web Audio engine & Howler coordinator
    ├── scenes/
    │   ├── space.js           # Earth with atmosphere, clouds, and celestial lighting
    │   ├── moon.js            # Lunar terrain, craters, Apollo 11, LRV, Surveyor 3
    │   ├── mars.js            # Martian dunes, Viking 1, Pathfinder, Spirit, Oppy, Ginny
    │   └── models.js          # 8 Procedural compound 3D models with telemetry beacons
    ├── effects/
    │   ├── postfx.js          # Bloom, Film grain, Vignette, Apollo 404 glitch
    │   ├── particles.js       # Starfield, regolith dust, reactive Martian sandstorm
    │   └── pingRing.js        # Expanding radar telemetry rings & beacon afterglow
    ├── story/
    │   ├── data.js            # NASA-verified mission dates, coordinates, and text
    │   └── timeline.js        # CatmullRomCurve3 flight path, ScrollTrigger, HUD logic
    └── utils/
        ├── loader.js          # GLTF + DRACO loader with procedural fallback
        └── caption.js         # Troika-three-text in-scene spatial label helper
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm (v9 or newer)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or the address printed in terminal).

### 3. Build for Production
```bash
npm run build
```
The optimized, minified bundle will be output to `/dist/`.

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## 🕹️ Controls & Features
- **Scroll (Wheel / Touchpad / Touch)**: Controls the camera along the 3D Catmull-Rom spline flight path from Earth to the Moon, across interplanetary transit, to Mars, and back to the active Lunar Retroreflector finale.
- **Mouse Movement**: Deflects floating dust particles and induces subtle cinematic camera parallax.
- **GFX Quality Button**: Toggles between High Quality (Bloom, Film Grain, Vignette, high pixel density) and Low Quality (optimized for mobile and entry-level laptops).
- **Audio Button**: Mutes/Unmutes the procedural space drone, Martian wind, and radar telemetry sounds.
- **Opportunity Dust Storm Climax**: As you scroll through Section 9 (Opportunity), the Martian sky progressively darkens from amber daylight into total night, simulating the catastrophic June 2018 global dust storm.

---

## 🛰️ Adding or Swapping 3D Models
REMANENCE is engineered with an **automatic procedural fallback**. If no `.glb` file is found, the application renders a multi-part compound procedural model with authentic materials, gold foil, and emissive beacons.

To swap in official NASA 3D models:
1. Download compressed `.glb` models from [NASA 3D Resources](https://nasa3d.arc.nasa.gov/).
2. Place the file inside `public/models/` using the following exact filenames:
   - `apollo_lm.glb` (Apollo 11 Lunar Module)
   - `lrv_rover.glb` (Apollo Lunar Rover)
   - `surveyor.glb` (Surveyor 3)
   - `viking_lander.glb` (Viking 1 Lander)
   - `pathfinder_sojourner.glb` (Pathfinder & Sojourner)
   - `mer_rover.glb` (Spirit Rover)
   - `mer_rover_oppy.glb` (Opportunity Rover)
   - `ingenuity.glb` (Ingenuity Mars Helicopter)
   - `retroreflector.glb` (Apollo Laser Retroreflector)

---

## 📝 Editing Mission Data & Stories
All historical dates, coordinates, and story paragraphs are centralized in:
```text
src/story/data.js
```
To update or translate a mission log, simply edit the corresponding entry in the `STORY_DATA.sections` array.

---

## 🌐 Deployment Instructions

### 1. Vercel
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your repository.
4. Set Build Command to `npm run build` and Output Directory to `dist`.
5. Click **Deploy**.

### 2. Netlify
1. Connect your repository on [Netlify](https://www.netlify.com/).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Click **Deploy Site**.

### 3. GitHub Pages
1. Build the project:
   ```bash
   npm run build
   ```
2. The `vite.config.js` is already configured with `base: './'`, allowing the `dist` folder to be deployed directly to the `gh-pages` branch.

---

## ✂️ What to Cut First if Time Runs Short (Competition Prioritization)
If presenting under strict time constraints or low hardware capacity:
1. **External `.glb` loading**: Keep the built-in procedural models—they load with zero latency and never 404.
2. **Post-Processing Bloom**: Toggle GFX to "Low" in the top HUD if presenting on an older laptop projector.
3. **Dust Storm Particle Density**: Can be dialed down in `src/effects/particles.js` (`marsDustCount = 800`).
4. **Never Cut**: The Catmull-Rom spline camera flight, the Opportunity day-to-night dimming, the expanding radar pulse, or the Apollo retroreflector finale story. They carry the emotional core of the project.

---

## 🏆 NASA Facts Verified
- **Apollo 11**: Landed July 20, 1969; descent stage shut down July 21, 1969. Plaque quote verified. Message disc verified.
- **LRV**: Driven on Apollo 15, 16, 17. Apollo 17 departure on Dec 14, 1972 was the last crewed lunar landing.
- **Surveyor 3**: Landed April 20, 1967; visited by Apollo 12 (Pete Conrad & Alan Bean) on Nov 19, 1969.
- **Viking 1**: Landed July 20, 1976; last contact Nov 11, 1982.
- **Pathfinder / Sojourner**: Landed July 4, 1997; last transmission Sept 27, 1997.
- **Spirit (MER-A)**: Sand-trapped at "Troy" in May 2009; last transmission March 22, 2010.
- **Opportunity (MER-B)**: Global dust storm tau > 10.8; power dropped to 22 Wh; last contact June 10, 2018. Record 45.16 km driven.
- **Ingenuity**: 72 flights completed; Flight 72 blade damage Jan 18, 2024; mission concluded Jan 25, 2024.
- **Retroreflectors**: Apollo 11, 14, 15 corner-cube retroreflectors remain active today, measuring Earth-Moon distance via photon lasers with no power requirements.
