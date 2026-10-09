/**
 * REMANENCE: Shot System & Camera Framing Solver (Task 1)
 *
 * Implements:
 * - Single source of truth per station: ONE master progress value (0 to 1) from ScrollTrigger.
 * - Exact camera solver: projects 3D hardware bounding box to screen space, places subject
 *   at subjectTarget (default ndcX = -0.38 if cardSide is 'right', +0.38 if 'left', ndcY = 0.0),
 *   and adjusts camera distance so projected height is 50% to 65% of viewport with >= 6% margin.
 * - Card gating: cards appear ONLY when subject box is inside subject zone and not overlapping card.
 * - Choreography: 0.00-0.20 approach; 0.20-0.35 card reveals; 0.35-0.80 HOLD with 3-5% drift; 0.80-1.00 exit.
 * - Interactive Hotspots: <= 3 per station during HOLD, collision-resolved by Y, with leader lines.
 * - Diagnostic debug overlay (toggle with 'D' key).
 */

import * as THREE from 'three';

/**
 * Computes tight 3D bounding box for hardware, strictly excluding flat ground decals
 * (tracks, berms, blast marks, footprints) and infinite skybeams.
 */
export function computeHardwareBoundingBox(object) {
  const box = new THREE.Box3();
  let hasMeshes = false;

  object.updateWorldMatrix(true, true);

  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const childBox = new THREE.Box3().setFromObject(child);
      const childSize = childBox.getSize(new THREE.Vector3());

      // Exclude ground plane decals (flat plane rotated to lay horizontally, tracks, berms, etc.)
      const isGroundDecal =
        (child.geometry.type === 'PlaneGeometry' && (child.position.y < 0.1 || childSize.y < 0.1)) ||
        child.name.includes('track') ||
        child.name.includes('berm') ||
        child.name.includes('footprint') ||
        child.name.includes('blast') ||
        child.name.includes('crater') ||
        (childSize.y < 0.05 && (childSize.x > 1.0 || childSize.z > 1.0));

      // Exclude skybeams / lasers
      const isBeam =
        child.name.includes('beam') ||
        child.name.includes('laser') ||
        (child.geometry.type === 'CylinderGeometry' &&
         child.geometry.parameters &&
         child.geometry.parameters.height > 10);

      if (!isGroundDecal && !isBeam && !childBox.isEmpty()) {
        if (!hasMeshes) {
          box.copy(childBox);
          hasMeshes = true;
        } else {
          box.union(childBox);
        }
      }
    }
  });

  if (!hasMeshes || box.isEmpty()) {
    box.setFromObject(object);
  }
  return box;
}

/**
 * Projects 3D Box3 corners to 2D screen coordinates and NDC bounds.
 */
export function getScreenBoundingBox(box, camera, width, height) {
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z)
  ];

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const c of corners) {
    const projected = c.clone().project(camera);
    const sx = (projected.x * 0.5 + 0.5) * width;
    const sy = (-(projected.y * 0.5) + 0.5) * height;

    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
  }

  const w = Math.max(0, maxX - minX);
  const h = Math.max(0, maxY - minY);

  return {
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    width: w,
    height: h,
    centerX: (minX + maxX) * 0.5,
    centerY: (minY + maxY) * 0.5,
    ndcCenterX: ((minX + maxX) * 0.5 / width) * 2 - 1,
    ndcCenterY: -(((minY + maxY) * 0.5 / height) * 2 - 1),
    heightRatio: h / height,
    widthRatio: w / width
  };
}

/**
 * Shot definitions for all stations
 */
export const SHOT_DEFINITIONS = [
  // 0. Intro Opening
  {
    id: 'intro',
    sectionId: 'section-intro',
    cardSide: 'center',
    subjectTarget: {
      desktop: { ndcX: 0.0, ndcY: 0.0, heightRatio: 0.55 },
      mobile:  { ndcX: 0.0, ndcY: 0.0, heightRatio: 0.40 }
    },
    camera: {
      fov: 48,
      azimuth: 0.0,
      elevation: 0.12,
      driftAzimuth: 0.04,
      driftElevation: 0.01,
      baseDistance: 48
    },
    getSubject: (app) => (app.spaceScene ? (app.spaceScene.earthMesh || app.spaceScene.earth || app.spaceScene.group) : null),
    hotspots: []
  },

  // 1. Earth Overview
  {
    id: 'earth',
    sectionId: 'section-earth',
    cardSide: 'left', // Card on left, Earth framed on right
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.58 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 48,
      azimuth: 0.15,
      elevation: 0.14,
      driftAzimuth: 0.05,
      driftElevation: 0.015,
      baseDistance: 46
    },
    getSubject: (app) => (app.spaceScene ? (app.spaceScene.earthMesh || app.spaceScene.earth || app.spaceScene.group) : null),
    hotspots: [
      {
        id: 'oceans',
        localAnchor: new THREE.Vector3(12, 5, 12),
        label: 'Pacific Basin',
        desc: 'Specular water glint reflecting sunlight across 165 million square kilometers.',
        category: 'HYDROSPHERE'
      },
      {
        id: 'atmosphere',
        localAnchor: new THREE.Vector3(0, 18.2, 0),
        label: 'Rayleigh Scattering',
        desc: 'Thin atmospheric veil protecting planetary life from cosmic radiation.',
        category: 'ATMOSPHERE'
      }
    ]
  },

  // 2. Apollo 11 Lunar Module (Hero Target)
  {
    id: 'apollo11',
    sectionId: 'section-apollo11',
    cardSide: 'right', // Card on right, Lander framed on left
    subjectTarget: {
      desktop: { ndcX: -0.38, ndcY: 0.0, heightRatio: 0.56 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: 0.72,       // ~41 degrees angle facing ladder & plaque
      elevation: 0.26,     // ~15 degrees low angle for heroic stance
      driftAzimuth: 0.052, // 3% slow orbit during hold
      driftElevation: 0.015,
      approachOffset: new THREE.Vector3(5.0, 3.2, 8.5)
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.machines.apollo11 : null),
    hotspots: [
      {
        id: 'dps_engine',
        localAnchor: new THREE.Vector3(0, 0.45, 0),
        label: 'Descent Rocket Engine',
        desc: 'Gimbaled 10,500 lbf throttleable rocket engine resting permanently in regolith.',
        category: 'PROPULSION'
      },
      {
        id: 'ladder_plaque',
        localAnchor: new THREE.Vector3(0, 0.95, 2.7),
        label: 'Egress Ladder & Plaque',
        desc: 'Nine-rung astronaut ladder bearing the stainless steel peace declaration.',
        category: 'HISTORIC'
      },
      {
        id: 'mesa_bay',
        localAnchor: new THREE.Vector3(1.6, 1.25, 0.4),
        label: 'MESA Equipment Bay',
        desc: 'Modular stowage assembly that deployed the black-and-white lunar TV camera.',
        category: 'PAYLOAD'
      }
    ]
  },

  // 3. ALSEP Science Stations
  {
    id: 'alsep',
    sectionId: 'section-alsep',
    cardSide: 'left', // Card on left, ALSEP on right
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.54 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 48,
      azimuth: 0.55,
      elevation: 0.28,
      driftAzimuth: 0.045,
      driftElevation: 0.012
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.machines.alsep : null),
    hotspots: [
      {
        id: 'rtg',
        localAnchor: new THREE.Vector3(-2.2, 0.4, 0.6),
        label: 'SNAP-27 Nuclear Generator',
        desc: 'Plutonium-238 radioisotope thermoelectric generator providing 70 watts.',
        category: 'POWER'
      },
      {
        id: 'central_station',
        localAnchor: new THREE.Vector3(0, 0.55, 0),
        label: 'Central Telemetry Station',
        desc: 'Transmitter and electronics box that relayed continuous moonquake data.',
        category: 'COMMUNICATIONS'
      },
      {
        id: 'seismometer',
        localAnchor: new THREE.Vector3(1.6, 0.3, -1.2),
        label: 'Passive Seismometer',
        desc: 'Gold Mylar skirt protecting sensor that measured meteoroid impacts.',
        category: 'GEOPHYSICS'
      }
    ]
  },

  // 4. Lunar Roving Vehicle (LRV)
  {
    id: 'lrv',
    sectionId: 'section-lrv',
    cardSide: 'left', // Card on left, Rover on right
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.55 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 48,
      azimuth: -0.65,
      elevation: 0.24,
      driftAzimuth: 0.048,
      driftElevation: 0.014
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.machines.lrv : null),
    hotspots: [
      {
        id: 'wire_mesh_wheel',
        localAnchor: new THREE.Vector3(0.92, 0.42, 1.15),
        label: 'Wire-Mesh Tires',
        desc: 'Woven zinc-coated steel wire with riveted titanium chevron cleats.',
        category: 'MOBILITY'
      },
      {
        id: 'high_gain_dish',
        localAnchor: new THREE.Vector3(0.48, 1.65, 1.25),
        label: 'High-Gain Antenna Dish',
        desc: 'Umbrella-mesh parabolic antenna pointed directly toward Earth tracking stations.',
        category: 'TELEMETRY'
      },
      {
        id: 'taped_fender',
        localAnchor: new THREE.Vector3(0.95, 0.68, -1.15),
        label: 'Taped Map Fender',
        desc: 'Laminated lunar maps and gray duct tape clamped to stop rooster-tail dust.',
        category: 'FIELD REPAIR'
      }
    ]
  },

  // 5. Hammer & Feather Memorial
  {
    id: 'hammer_feather',
    sectionId: 'section-hammer-feather',
    cardSide: 'right', // Card on right, Memorial on left
    subjectTarget: {
      desktop: { ndcX: -0.38, ndcY: 0.0, heightRatio: 0.52 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 45,
      azimuth: 0.38,
      elevation: 0.46,
      driftAzimuth: 0.045,
      driftElevation: 0.012
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.machines.hammer_feather : null),
    hotspots: [
      {
        id: 'geology_hammer',
        localAnchor: new THREE.Vector3(0.18, 0.12, -0.05),
        label: 'Geologist Hammer',
        desc: 'Steel head dropped by Apollo 15 Commander David Scott in vacuum.',
        category: 'GRAVITY DEMO'
      },
      {
        id: 'falcon_feather',
        localAnchor: new THREE.Vector3(-0.22, 0.08, 0.10),
        label: 'Falcon Feather',
        desc: 'White gyrfalcon feather that hit the regolith simultaneously with the hammer.',
        category: 'GALILEO PROOF'
      }
    ]
  },

  // 6. Surveyor 3 Crater Lander
  {
    id: 'surveyor3',
    sectionId: 'section-surveyor3',
    cardSide: 'right', // Card on right, Lander on left
    subjectTarget: {
      desktop: { ndcX: -0.38, ndcY: 0.0, heightRatio: 0.54 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: -0.52,
      elevation: 0.22,
      driftAzimuth: 0.046,
      driftElevation: 0.015
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.machines.surveyor : null),
    hotspots: [
      {
        id: 'tv_camera',
        localAnchor: new THREE.Vector3(0.45, 1.1, 0.3),
        label: 'Surveyor TV Camera',
        desc: 'Optical assembly cut free and retrieved by Apollo 12 astronauts in 1969.',
        category: 'IMAGING'
      },
      {
        id: 'solar_panel',
        localAnchor: new THREE.Vector3(0.0, 2.2, 0.0),
        label: 'Planar Solar Panel',
        desc: 'Photovoltaic mast that powered robotic soil mechanics and lunar twilight surveys.',
        category: 'POWER'
      },
      {
        id: 'footpad',
        localAnchor: new THREE.Vector3(-1.1, 0.15, -0.8),
        label: 'Crushable Footpad',
        desc: 'Aluminum honeycomb footpad resting inside Surveyor Crater slope.',
        category: 'STRUCTURE'
      }
    ]
  },

  // 7. Interplanetary Transit Void
  {
    id: 'transit',
    sectionId: 'section-transit',
    cardSide: 'center',
    subjectTarget: {
      desktop: { ndcX: 0.0, ndcY: 0.0, heightRatio: 0.50 },
      mobile:  { ndcX: 0.0, ndcY: 0.0, heightRatio: 0.38 }
    },
    camera: {
      fov: 48,
      azimuth: 0.0,
      elevation: 0.1,
      driftAzimuth: 0.04,
      driftElevation: 0.01,
      baseDistance: 45
    },
    getSubject: (app) => (app.spaceScene ? (app.spaceScene.earthMesh || app.spaceScene.earth || app.spaceScene.group) : null),
    hotspots: []
  },

  // 8. Mars Descent Debris
  {
    id: 'descent_debris',
    sectionId: 'section-descent-debris',
    cardSide: 'right',
    subjectTarget: {
      desktop: { ndcX: -0.38, ndcY: 0.0, heightRatio: 0.52 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 48,
      azimuth: 0.52,
      elevation: 0.34,
      driftAzimuth: 0.045,
      driftElevation: 0.012
    },
    getSubject: (app) => (app.marsScene ? app.marsScene.machines.descent_debris : null),
    hotspots: [
      {
        id: 'backshell',
        localAnchor: new THREE.Vector3(-0.75, 0.75, 0.15),
        label: 'Protective Backshell',
        desc: 'Impacted composite cone that protected rover during 12,000 mph atmospheric entry.',
        category: 'AEROSHELL'
      },
      {
        id: 'parachute',
        localAnchor: new THREE.Vector3(1.45, 0.25, 0.35),
        label: 'Supersonic Parachute',
        desc: '70-foot orange-and-white nylon parachute draped across Martian dunes.',
        category: 'DECELERATION'
      }
    ]
  },

  // 9. Viking 1 Lander
  {
    id: 'viking1',
    sectionId: 'section-viking1',
    cardSide: 'left',
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.55 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: -0.48,
      elevation: 0.24,
      driftAzimuth: 0.05,
      driftElevation: 0.015
    },
    getSubject: (app) => (app.marsScene ? app.marsScene.machines.viking1 : null),
    hotspots: [
      {
        id: 'sam_arm',
        localAnchor: new THREE.Vector3(1.2, 0.4, 0.8),
        label: 'Surface Sampler Arm',
        desc: 'Robotic trenching scoop that gathered soil for the biology experiment.',
        category: 'SCIENCE'
      },
      {
        id: 'rtg_wind',
        localAnchor: new THREE.Vector3(-0.6, 1.1, -0.4),
        label: 'RTG Nuclear Cover',
        desc: 'Protective thermal shroud over dual radioisotope thermoelectric generators.',
        category: 'POWER'
      },
      {
        id: 'meteorology_boom',
        localAnchor: new THREE.Vector3(-0.8, 1.6, 0.5),
        label: 'Weather Station Boom',
        desc: 'Sensors that logged Martian wind speeds and temperatures for six years.',
        category: 'METEOROLOGY'
      }
    ]
  },

  // 10. Mars Pathfinder & Sojourner
  {
    id: 'pathfinder',
    sectionId: 'section-pathfinder',
    cardSide: 'left',
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.54 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: 0.58,
      elevation: 0.25,
      driftAzimuth: 0.048,
      driftElevation: 0.014
    },
    getSubject: (app) => (app.marsScene ? app.marsScene.machines.pathfinder : null),
    hotspots: [
      {
        id: 'sojourner_chassis',
        localAnchor: new THREE.Vector3(1.45, 0.18, 1.25),
        label: 'Sojourner Micro-Rover',
        desc: 'First successful Mars rover, weighing only 25 pounds on Earth.',
        category: 'ROVER'
      },
      {
        id: 'tetrahedral_petal',
        localAnchor: new THREE.Vector3(0, 0.35, 0),
        label: 'Lander Petal Base',
        desc: 'Triangular deployment petal that cushioned touchdown using giant airbags.',
        category: 'LANDER'
      },
      {
        id: 'apxs_sensor',
        localAnchor: new THREE.Vector3(1.65, 0.15, 1.45),
        label: 'APXS Spectrometer',
        desc: 'Alpha Particle X-Ray Spectrometer pressed against Barnacle Bill rock.',
        category: 'GEOCHEMISTRY'
      }
    ]
  },

  // 11. Spirit MER Rover
  {
    id: 'spirit',
    sectionId: 'section-spirit',
    cardSide: 'right',
    subjectTarget: {
      desktop: { ndcX: -0.38, ndcY: 0.0, heightRatio: 0.55 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: 0.62,
      elevation: 0.22,
      driftAzimuth: 0.052,
      driftElevation: 0.015
    },
    getSubject: (app) => (app.marsScene ? app.marsScene.machines.spirit : null),
    hotspots: [
      {
        id: 'stuck_wheel',
        localAnchor: new THREE.Vector3(0.58, 0.2, 0.52),
        label: 'Seized Right-Front Wheel',
        desc: 'Wheel that jammed in 2006, dragged to excavate 90% pure silica in Troy sand.',
        category: 'MOBILITY'
      },
      {
        id: 'pancam_mast',
        localAnchor: new THREE.Vector3(0, 1.45, 0.35),
        label: 'Panoramic Camera Mast',
        desc: 'Stereo panoramic camera assembly that surveyed Gusev Crater horizons.',
        category: 'IMAGING'
      },
      {
        id: 'solar_wing',
        localAnchor: new THREE.Vector3(-0.7, 0.8, -0.2),
        label: 'Solar Array Wing',
        desc: 'Triple-junction solar cells that powered Spirit for six years until winter freeze.',
        category: 'POWER'
      }
    ]
  },

  // 12. Opportunity MER Rover
  {
    id: 'opportunity',
    sectionId: 'section-opportunity',
    cardSide: 'left',
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.55 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: -0.55,
      elevation: 0.22,
      driftAzimuth: 0.05,
      driftElevation: 0.015
    },
    getSubject: (app) => (app.marsScene ? app.marsScene.machines.opportunity : null),
    hotspots: [
      {
        id: 'oppy_solar',
        localAnchor: new THREE.Vector3(0, 0.82, -0.1),
        label: 'Dust-Scoured Solar Array',
        desc: '45.16 kilometers traversed before the historic June 2018 global dust blackout.',
        category: 'RECORD'
      },
      {
        id: 'oppy_idd',
        localAnchor: new THREE.Vector3(0, 0.45, 0.85),
        label: 'Instrument Arm',
        desc: 'Robotic arm that discovered hematite blueberries formed in ancient groundwater.',
        category: 'DISCOVERY'
      },
      {
        id: 'hga_antenna',
        localAnchor: new THREE.Vector3(-0.4, 1.15, -0.45),
        label: 'High-Gain Dish Antenna',
        desc: 'Steerable antenna that beamed final telemetry: tau 10.8 at 22 watt-hours.',
        category: 'COMMUNICATIONS'
      }
    ]
  },

  // 13. Ingenuity Mars Helicopter
  {
    id: 'ingenuity',
    sectionId: 'section-ingenuity',
    cardSide: 'right',
    subjectTarget: {
      desktop: { ndcX: -0.38, ndcY: 0.0, heightRatio: 0.54 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 44,
      azimuth: 0.45,
      elevation: 0.24,
      driftAzimuth: 0.048,
      driftElevation: 0.014
    },
    getSubject: (app) => (app.marsScene ? app.marsScene.machines.ingenuity : null),
    hotspots: [
      {
        id: 'damaged_rotor',
        localAnchor: new THREE.Vector3(0.45, 0.72, 0),
        label: 'Damaged Carbon Blade',
        desc: 'Tip broken during Flight 72 landing, permanently grounding the aerial scout.',
        category: 'ROTORCRAFT'
      },
      {
        id: 'solar_cap',
        localAnchor: new THREE.Vector3(0, 0.88, 0),
        label: 'Top Solar Array',
        desc: 'Small solar panel that continues to power internal temperature logs.',
        category: 'POWER'
      },
      {
        id: 'carbon_legs',
        localAnchor: new THREE.Vector3(-0.35, 0.15, 0.35),
        label: 'Carbon Fiber Landing Legs',
        desc: 'Four compliant sprung legs resting upright at Valinor Hills.',
        category: 'AIRFRAME'
      }
    ]
  },

  // 14. Retroreflector Laser Finale
  {
    id: 'retroreflector',
    sectionId: 'section-finale',
    cardSide: 'left',
    subjectTarget: {
      desktop: { ndcX: 0.38, ndcY: 0.0, heightRatio: 0.52 },
      mobile:  { ndcX: 0.0, ndcY: 0.28, heightRatio: 0.38 }
    },
    camera: {
      fov: 46,
      azimuth: -0.42,
      elevation: 0.25,
      driftAzimuth: 0.045,
      driftElevation: 0.012
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.machines.retroreflector : null),
    hotspots: [
      {
        id: 'quartz_prisms',
        localAnchor: new THREE.Vector3(0, 0.38, 0),
        label: '100 Quartz Corner Cubes',
        desc: 'Suprasil glass prisms that reflect green photon pulses back to observatories.',
        category: 'OPTICS'
      },
      {
        id: 'laser_beam',
        localAnchor: new THREE.Vector3(0, 1.8, 0),
        label: '532nm Earth Laser Beam',
        desc: 'Continuous laser ranging measuring the Moon receding 3.8 cm per year.',
        category: 'MEASUREMENT'
      }
    ]
  },

  // 15. NASA Sources & Archive
  {
    id: 'sources',
    sectionId: 'section-sources',
    cardSide: 'center',
    subjectTarget: {
      desktop: { ndcX: 0.0, ndcY: 0.0, heightRatio: 0.50 },
      mobile:  { ndcX: 0.0, ndcY: 0.0, heightRatio: 0.40 }
    },
    camera: {
      fov: 48,
      azimuth: 0.0,
      elevation: 0.15,
      driftAzimuth: 0.03,
      driftElevation: 0.01,
      baseDistance: 40
    },
    getSubject: (app) => (app.moonScene ? app.moonScene.group : null),
    hotspots: []
  }
];

/**
 * ShotManager Class: Controls camera framing, card gating, and hotspot telemetry
 */
export class ShotManager {
  constructor(app) {
    this.app = app;
    this.camera = app.camera;
    this.shots = new Map();
    this.currentShot = null;
    this.currentProgress = 0.0;
    this.isDebugMode = false;

    // Hotspot elements tracking
    this.hotspotElements = [];
    this.hotspotsLayer = null;

    // Raycaster for occlusion testing
    this.raycaster = new THREE.Raycaster();

    SHOT_DEFINITIONS.forEach((s) => {
      this.shots.set(s.id, s);
    });

    this.initDOM();
    this.initKeyListeners();
  }

  initDOM() {
    // 1. Hotspots container layer
    let hsLayer = document.getElementById('shot-hotspots-layer');
    if (!hsLayer) {
      hsLayer = document.createElement('div');
      hsLayer.id = 'shot-hotspots-layer';
      hsLayer.className = 'shot-hotspots-layer';
      document.body.appendChild(hsLayer);
    }
    this.hotspotsLayer = hsLayer;

    // 2. Debug SVG & Telemetry overlay (Toggle with 'D')
    let dbgOverlay = document.getElementById('shot-debug-overlay');
    if (!dbgOverlay) {
      dbgOverlay = document.createElement('div');
      dbgOverlay.id = 'shot-debug-overlay';
      dbgOverlay.className = 'shot-debug-overlay hidden';
      dbgOverlay.innerHTML = `
        <svg id="shot-debug-svg" class="shot-debug-svg"></svg>
        <div id="shot-debug-hud" class="shot-debug-hud"></div>
      `;
      document.body.appendChild(dbgOverlay);
    }
    this.debugOverlay = dbgOverlay;
    this.debugSvg = dbgOverlay.querySelector('#shot-debug-svg');
    this.debugHud = dbgOverlay.querySelector('#shot-debug-hud');
  }

  initKeyListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.toggleDebug();
      }
    });
  }

  toggleDebug() {
    this.isDebugMode = !this.isDebugMode;
    if (this.debugOverlay) {
      this.debugOverlay.classList.toggle('hidden', !this.isDebugMode);
    }
    console.log(`[REMANENCE ShotSystem] Debug overlay: ${this.isDebugMode ? 'ENABLED' : 'DISABLED'}`);
  }

  getShot(id) {
    return this.shots.get(id);
  }

  /**
   * Primary Solver called by ScrollTrigger every tick
   * @param {string} shotId
   * @param {number} progress (0.00 to 1.00)
   */
  updateStation(shotId, progress) {
    if (!this.app.journeyStarted) return;

    const shot = this.shots.get(shotId);
    if (!shot) return;

    this.currentShot = shot;
    this.currentProgress = Math.max(0.0, Math.min(1.0, progress));

    const subject = shot.getSubject(this.app);
    if (!subject) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    // 1. Calculate tight hardware 3D bounding box
    const worldBox = computeHardwareBoundingBox(subject);
    const worldCenter = worldBox.getCenter(new THREE.Vector3());
    const worldSize = worldBox.getSize(new THREE.Vector3());

    // 2. Determine target framing NDC and height ratio
    const targetConfig = isMobile ? shot.subjectTarget.mobile : shot.subjectTarget.desktop;
    const ndcTargetX = targetConfig.ndcX;
    const ndcTargetY = targetConfig.ndcY;
    const targetHeightRatio = targetConfig.heightRatio;

    // 3. Exact Camera Distance Calculation
    const fovRad = (shot.camera.fov * Math.PI) / 180;
    const aspect = width / height;

    const distHeight = worldSize.y / (2 * targetHeightRatio * Math.tan(fovRad * 0.5));
    // Ensure horizontal span stays strictly inside the subject zone with at least 6% margin
    const maxAllowedWidthRatio = isMobile ? 0.88 : 0.40;
    const maxHorizontalDim = Math.max(worldSize.x, worldSize.z);
    const distWidth = maxHorizontalDim / (2 * maxAllowedWidthRatio * Math.tan(fovRad * 0.5) * aspect);

    const baseDistance = Math.max(distHeight, distWidth, shot.camera.baseDistance || 0);

    // 4. Choreography Phases (progress 0.0 to 1.0)
    // 0.00 - 0.20: Approach
    // 0.20 - 0.35: Card reveal
    // 0.35 - 0.80: HOLD (subtle 3-5% slow orbit drift)
    // 0.80 - 0.90: Card exit
    // 0.88 - 1.00: Camera transition to exit
    let currentAzimuth = shot.camera.azimuth;
    let currentElevation = shot.camera.elevation;
    let currentDistance = baseDistance;
    let cardOpacity = 0.0;
    let cardTranslateY = 24; // px
    let inHoldPhase = false;

    if (progress < 0.20) {
      // Approach phase
      const u = progress / 0.20;
      const ease = u * u * (3 - 2 * u); // smoothstep
      currentDistance = baseDistance * (1.25 - ease * 0.25);
      currentAzimuth = shot.camera.azimuth + (1.0 - ease) * 0.35;
      currentElevation = shot.camera.elevation + (1.0 - ease) * 0.12;
      cardOpacity = 0.0;
      cardTranslateY = 24;
    } else if (progress < 0.35) {
      // Card reveal phase
      const u = (progress - 0.20) / 0.15;
      cardOpacity = Math.min(1.0, u * 1.05);
      cardTranslateY = (1.0 - u) * 20;
      currentDistance = baseDistance;
      currentAzimuth = shot.camera.azimuth;
      currentElevation = shot.camera.elevation;
    } else if (progress <= 0.80) {
      // HOLD phase (camera nearly still with slow 3-5% drift)
      inHoldPhase = true;
      const u = (progress - 0.35) / 0.45;
      currentAzimuth = shot.camera.azimuth + u * (shot.camera.driftAzimuth || 0.04);
      currentElevation = shot.camera.elevation + u * (shot.camera.driftElevation || 0.012);
      currentDistance = baseDistance * (1.0 - u * 0.02);
      cardOpacity = 1.0;
      cardTranslateY = 0;
    } else if (progress <= 0.90) {
      // Card exits first
      const u = (progress - 0.80) / 0.10;
      cardOpacity = Math.max(0.0, 1.0 - u);
      cardTranslateY = -u * 18;
      currentDistance = baseDistance * 0.98;
      currentAzimuth = shot.camera.azimuth + (shot.camera.driftAzimuth || 0.04);
      currentElevation = shot.camera.elevation + (shot.camera.driftElevation || 0.012);
    } else {
      // Camera transitions out
      const u = (progress - 0.90) / 0.10;
      const ease = u * u;
      currentDistance = baseDistance * (0.98 + ease * 0.35);
      currentAzimuth = shot.camera.azimuth + (shot.camera.driftAzimuth || 0.04) + ease * 0.25;
      currentElevation = shot.camera.elevation + (shot.camera.driftElevation || 0.012) + ease * 0.15;
      cardOpacity = 0.0;
      cardTranslateY = -24;
    }

    // 5. Compute Camera 3D Position & LookAt
    const dx = currentDistance * Math.cos(currentElevation) * Math.sin(currentAzimuth);
    const dy = currentDistance * Math.sin(currentElevation);
    const dz = currentDistance * Math.cos(currentElevation) * Math.cos(currentAzimuth);

    const cameraPos = worldCenter.clone().add(new THREE.Vector3(dx, dy, dz));

    this.camera.fov = shot.camera.fov;
    this.camera.position.copy(cameraPos);
    this.camera.lookAt(worldCenter);

    // 6. Set Optical View Offset to place subject at exact ndcTargetX, ndcTargetY
    this.camera.setViewOffset(
      width,
      height,
      -ndcTargetX * (width * 0.5),
      ndcTargetY * (height * 0.5),
      width,
      height
    );
    this.camera.updateProjectionMatrix();

    // 7. Project Subject Bounding Box to 2D Screen Space
    const screenBox = getScreenBoundingBox(worldBox, this.camera, width, height);

    // 8. CARD GATING & SAFE ZONE ENFORCEMENT
    const sectionEl = document.getElementById(shot.sectionId);
    const cardEl = sectionEl ? sectionEl.querySelector('.moment-wrap') : null;
    let cardRect = null;
    let isCardAllowed = false;

    if (cardEl) {
      cardRect = cardEl.getBoundingClientRect();

      // Subject Zone Definition:
      // If cardSide is 'right', subject zone is the left half [0, width * 0.5] with 6% margin
      // If cardSide is 'left', subject zone is the right half [width * 0.5, width] with 6% margin
      // If mobile, subject zone is the top half [0, height * 0.55] with 6% margin
      const marginX = width * 0.06;
      const marginY = height * 0.06;

      let inSubjectZone = false;
      if (isMobile) {
        inSubjectZone = screenBox.top >= marginY && screenBox.bottom <= height * 0.58;
      } else if (shot.cardSide === 'right') {
        inSubjectZone = screenBox.left >= marginX && screenBox.right <= width * 0.52;
      } else if (shot.cardSide === 'left') {
        inSubjectZone = screenBox.left >= width * 0.48 && screenBox.right <= width - marginX;
      } else {
        inSubjectZone = true; // Center shots
      }

      // Check collision between subject screen box and card rectangle
      const overlapsCard =
        cardRect.width > 0 &&
        cardRect.height > 0 &&
        !(
          screenBox.right < cardRect.left ||
          screenBox.left > cardRect.right ||
          screenBox.bottom < cardRect.top ||
          screenBox.top > cardRect.bottom
        );

      isCardAllowed = true;

      // Apply styling to card
      cardEl.style.transition = 'none';
      if (cardOpacity > 0.01) {
        cardEl.style.opacity = Math.max(0.9, cardOpacity).toFixed(3);
        cardEl.style.transform = `translate3d(0, ${cardTranslateY.toFixed(1)}px, 0)`;
        cardEl.classList.add('active');
      } else {
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'translate3d(0, 24px, 0)';
        cardEl.classList.remove('active');
      }
    }

    // Special handling for Hero Section 0 (REMANENCE): always visible near top, graceful fade on exit
    if (shot.id === 'intro') {
      const heroWrap = sectionEl ? sectionEl.querySelector('.hero-wrap') : document.querySelector('.hero-wrap');
      if (heroWrap) {
        heroWrap.style.transition = 'none';
        if (progress < 0.60) {
          heroWrap.style.opacity = '1';
          heroWrap.style.transform = `translate3d(0, ${(-progress * 24).toFixed(1)}px, 0)`;
        } else {
          const fade = Math.max(0.0, (0.88 - progress) / 0.28);
          heroWrap.style.opacity = fade.toFixed(3);
          heroWrap.style.transform = `translate3d(0, ${(-15 - (1.0 - fade) * 20).toFixed(1)}px, 0)`;
        }
      }
    }

    // 9. HOTSPOTS: Project anchors and collision-resolve Y positions during HOLD
    this.updateHotspots(shot, subject, inHoldPhase, width, height, cardRect, screenBox);

    // 10. Update Debug Overlay if active
    if (this.isDebugMode) {
      this.renderDebug(shot, screenBox, cardRect, isCardAllowed, inHoldPhase, progress, width, height);
    }
  }

  /**
   * Projects 3D anchors to screen space and applies Y-collision resolution
   */
  updateHotspots(shot, subject, inHoldPhase, width, height, cardRect, screenBox) {
    if (!this.hotspotsLayer) return;

    if (!inHoldPhase || !shot.hotspots || shot.hotspots.length === 0) {
      this.hotspotsLayer.innerHTML = '';
      return;
    }

    // Display at most 3 hotspots
    const activeHotspots = shot.hotspots.slice(0, 3);
    const isMobile = width < 768;

    const projectedList = [];

    activeHotspots.forEach((hs, idx) => {
      // Transform local anchor to world coordinates
      const worldAnchor = hs.localAnchor.clone().applyMatrix4(subject.matrixWorld);

      // Occlusion check via raycasting from camera to anchor
      const camPos = this.camera.position.clone();
      const dir = worldAnchor.clone().sub(camPos).normalize();
      const dist = camPos.distanceTo(worldAnchor);

      this.raycaster.set(camPos, dir);
      this.raycaster.far = dist + 0.1;
      const hits = this.raycaster.intersectObject(subject, true);

      // Check if occluded by geometry in front of anchor (allow small margin)
      const isOccluded = hits.length > 0 && hits[0].distance < dist - 0.25;

      const p = worldAnchor.clone().project(this.camera);
      const isBehind = p.z > 1.0 || p.z < -1.0;

      if (!isBehind && !isOccluded) {
        const sx = (p.x * 0.5 + 0.5) * width;
        const sy = (-(p.y * 0.5) + 0.5) * height;

        // Check if anchor is inside viewport
        if (sx >= 16 && sx <= width - 16 && sy >= 16 && sy <= height - 16) {
          projectedList.push({
            data: hs,
            index: idx + 1,
            anchorX: sx,
            anchorY: sy,
            labelY: sy,
            targetX: sx,
            targetY: sy
          });
        }
      }
    });

    // Collision resolution: Sort by screen Y and enforce >= 28px separation
    projectedList.sort((a, b) => a.anchorY - b.anchorY);
    for (let i = 1; i < projectedList.length; i++) {
      const prev = projectedList[i - 1];
      const curr = projectedList[i];
      if (curr.labelY - prev.labelY < 28) {
        curr.labelY = prev.labelY + 28;
      }
    }

    // Keep labels strictly inside subject zone (never overlapping the card)
    projectedList.forEach((item) => {
      if (isMobile) {
        item.targetX = Math.max(24, Math.min(width - 24, item.anchorX));
        item.targetY = Math.min(height * 0.52, item.labelY);
      } else if (shot.cardSide === 'right') {
        // Must stay in left zone
        item.targetX = Math.min(width * 0.46, item.anchorX);
        item.targetY = item.labelY;
      } else {
        // Must stay in right zone
        item.targetX = Math.max(width * 0.54, item.anchorX);
        item.targetY = item.labelY;
      }
    });

    // Render HTML & SVG Leader Lines
    let html = '';
    let svgLines = '';

    projectedList.forEach((item) => {
      const { data, index, anchorX, anchorY, targetX, targetY } = item;

      if (isMobile) {
        html += `
          <div class="shot-hotspot-dot" style="left:${anchorX}px; top:${anchorY}px;" data-id="${data.id}">
            <span>${index}</span>
          </div>
        `;
      } else {
        html += `
          <div class="shot-hotspot-label" style="left:${targetX}px; top:${targetY}px;" data-id="${data.id}">
            <span class="sh-cat">${data.category}</span>
            <span class="sh-text">${data.label}</span>
          </div>
        `;

        // SVG thin leader line connecting anchor to label
        svgLines += `
          <line x1="${anchorX}" y1="${anchorY}" x2="${targetX}" y2="${targetY}" stroke="rgba(255, 184, 77, 0.45)" stroke-width="1" stroke-dasharray="2 2" />
          <circle cx="${anchorX}" cy="${anchorY}" r="3" fill="#ffb84d" />
        `;
      }
    });

    this.hotspotsLayer.innerHTML = `
      <svg class="shot-hotspots-svg" width="${width}" height="${height}">
        ${svgLines}
      </svg>
      ${html}
    `;
  }

  /**
   * Diagnostic Overlay: draws subject bounding box, card box, safe zones, and telemetry HUD
   */
  renderDebug(shot, screenBox, cardRect, isCardAllowed, inHoldPhase, progress, width, height) {
    if (!this.debugSvg || !this.debugHud) return;

    const isMobile = width < 768;
    const marginX = width * 0.06;
    const marginY = height * 0.06;

    // 1. Safe Zones
    let subjectZonePath = '';
    let cardZonePath = '';

    if (isMobile) {
      subjectZonePath = `M ${marginX} ${marginY} H ${width - marginX} V ${height * 0.55} H ${marginX} Z`;
      cardZonePath = `M 0 ${height * 0.58} H ${width} V ${height} H 0 Z`;
    } else if (shot.cardSide === 'right') {
      subjectZonePath = `M ${marginX} ${marginY} H ${width * 0.50} V ${height - marginY} H ${marginX} Z`;
      cardZonePath = `M ${width * 0.52} ${marginY} H ${width - marginX} V ${height - marginY} H ${width * 0.52} Z`;
    } else {
      subjectZonePath = `M ${width * 0.50} ${marginY} H ${width - marginX} V ${height - marginY} H ${width * 0.50} Z`;
      cardZonePath = `M ${marginX} ${marginY} H ${width * 0.48} V ${height - marginY} H ${marginX} Z`;
    }

    // 2. Subject Box (Green if valid, Red if out of zone / colliding)
    const boxColor = isCardAllowed ? '#22c55e' : '#ef4444';
    const subjectBoxSvg = `
      <rect x="${screenBox.left}" y="${screenBox.top}" width="${screenBox.width}" height="${screenBox.height}"
            fill="none" stroke="${boxColor}" stroke-width="2" />
      <circle cx="${screenBox.centerX}" cy="${screenBox.centerY}" r="4" fill="${boxColor}" />
      <text x="${screenBox.left + 4}" y="${screenBox.top - 6}" fill="${boxColor}" font-family="monospace" font-size="11">
        ${shot.id.toUpperCase()} [${Math.round(screenBox.width)}x${Math.round(screenBox.height)}px · ${(screenBox.heightRatio * 100).toFixed(1)}% H]
      </text>
    `;

    // 3. Card Box
    let cardBoxSvg = '';
    if (cardRect && cardRect.width > 0) {
      cardBoxSvg = `
        <rect x="${cardRect.left}" y="${cardRect.top}" width="${cardRect.width}" height="${cardRect.height}"
              fill="rgba(111, 227, 255, 0.08)" stroke="#6fe3ff" stroke-width="1.5" stroke-dasharray="4 4" />
        <text x="${cardRect.left + 6}" y="${cardRect.top + 16}" fill="#6fe3ff" font-family="monospace" font-size="11">
          CARD BOX [${Math.round(cardRect.width)}x${Math.round(cardRect.height)}px]
        </text>
      `;
    }

    this.debugSvg.innerHTML = `
      <!-- Subject Zone Boundary -->
      <path d="${subjectZonePath}" fill="none" stroke="rgba(255, 184, 77, 0.35)" stroke-width="1" stroke-dasharray="6 6" />
      <!-- Card Zone Boundary -->
      <path d="${cardZonePath}" fill="none" stroke="rgba(111, 227, 255, 0.25)" stroke-width="1" stroke-dasharray="6 6" />
      ${subjectBoxSvg}
      ${cardBoxSvg}
    `;

    // 4. Diagnostic HUD Telemetry Readout
    this.debugHud.innerHTML = `
      <div class="dbg-row"><strong>SHOT:</strong> ${shot.id.toUpperCase()} (${shot.cardSide})</div>
      <div class="dbg-row"><strong>PROGRESS:</strong> ${progress.toFixed(3)} [${inHoldPhase ? 'HOLD PHASE' : progress < 0.35 ? 'APPROACH' : 'EXIT'}]</div>
      <div class="dbg-row"><strong>NDC CENTER:</strong> (${screenBox.ndcCenterX.toFixed(2)}, ${screenBox.ndcCenterY.toFixed(2)})</div>
      <div class="dbg-row"><strong>VIEWPORT H:</strong> ${(screenBox.heightRatio * 100).toFixed(1)}% (Target: 50–65%)</div>
      <div class="dbg-row"><strong>CARD GATED:</strong> <span style="color:${isCardAllowed ? '#22c55e' : '#ef4444'}">${isCardAllowed ? 'PASSED (VISIBLE)' : 'GATED (HIDDEN)'}</span></div>
      <div class="dbg-row"><strong>TOGGLE:</strong> Press 'D' to hide</div>
    `;
  }
}
