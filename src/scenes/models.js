/**
 * REMANENCE: 3D Hardware Model Orchestrator
 * Loads official NASA/JPL/Smithsonian 3D assets when provided,
 * and seamlessly provides museum-grade, physically authentic 3D reconstructions
 * for all lunar and Martian exploration hardware.
 *
 * Each asset features:
 * - Real-world meters scale and grounded contact berms / wheel tracks
 * - Multi-layer PBR materials (MeshPhysicalMaterial with normal/roughness/metalness)
 * - Authentic historical details (Kapton MLI, antennas, science packages, weathering)
 * - Calibrated subtle LED telemetry beacons (non-blinding, no blown-out bloom)
 */

import * as THREE from 'three';
import { modelLoader } from '../utils/loader.js';
import { createDetailedApolloLM } from './lunarModule.js';
import { createDetailedLRV } from './lunarRover.js';
import { createDetailedSurveyor } from './surveyorLander.js';
import { createDetailedRetroreflector } from './retroreflector.js';
import { createDetailedALSEP } from './alsepStation.js';
import { createDetailedHammerFeather } from './hammerFeather.js';
import { createDetailedViking } from './vikingLander.js';
import { createDetailedPathfinder } from './pathfinderRover.js';
import { createDetailedMERRover } from './marsRover.js';
import { createDetailedIngenuity } from './ingenuityHelicopter.js';
import { createDetailedDescentDebris } from './descentDebris.js';

/**
 * Creates a non-luminous reference anchor for inspection callouts.
 */
function createBeacon(colorHex, intensity = 0) {
  const beaconGroup = new THREE.Group();
  beaconGroup.userData = {
    baseColor: colorHex,
    baseIntensity: 0
  };
  return beaconGroup;
}

// 1. Apollo 11 Lunar Module Descent Stage
export function createApolloLM() {
  const group = createDetailedApolloLM();
  const beacon = createBeacon(0xffbf66, 0.45);
  beacon.position.set(0, 2.18, 0);
  group.add(beacon);
  group.userData.beacon = beacon;
  return group;
}

// 2. Apollo Lunar Roving Vehicle (LRV)
export function createLRV() {
  return createDetailedLRV();
}

// 3. Surveyor 3 Lunar Lander
export function createSurveyor() {
  return createDetailedSurveyor();
}

// 4. Apollo Lunar Surface Experiments Package (ALSEP)
export function createALSEP() {
  return createDetailedALSEP();
}

// 5. Apollo 15 Hammer & Feather Memorial
export function createHammerFeather() {
  return createDetailedHammerFeather();
}

// 6. Apollo Lunar Laser Ranging Retroreflector (LLRR)
export function createRetroreflector() {
  return createDetailedRetroreflector();
}

// 7. Viking 1 Mars Lander
export function createViking() {
  return createDetailedViking();
}

// 8. Mars Pathfinder & Sojourner Micro-Rover
export function createPathfinder() {
  return createDetailedPathfinder();
}

// 9. Mars Exploration Rovers (Spirit & Opportunity)
export function createMERRover(isOpportunity = false) {
  return createDetailedMERRover(isOpportunity);
}

// 10. Ingenuity Mars Helicopter
export function createIngenuity() {
  return createDetailedIngenuity();
}

// 11. Mars Descent Debris Field
export function createDescentDebris() {
  return createDetailedDescentDebris();
}

/**
 * Universal Loader and Factory for all REMANENCE Hardware
 */
export async function getOrCreateModel(modelType) {
  // Attempt to load external Draco/KTX2 .glb if present in /models/
  const glbUrl = `./models/${modelType}.glb`;
  const loadedModel = await modelLoader.loadModel(glbUrl);

  if (loadedModel) {
    const beacon = createBeacon(0x4df0ff, 0.5);
    beacon.position.set(0, 2, 0);
    loadedModel.add(beacon);
    loadedModel.userData.beacon = beacon;
    return loadedModel;
  }

  // Fallback to our handcrafted museum-grade architectural reconstructions
  switch (modelType) {
    case 'apollo_lm':
      return createApolloLM();
    case 'lrv_rover':
      return createLRV();
    case 'surveyor':
      return createSurveyor();
    case 'alsep':
      return createALSEP();
    case 'hammer_feather':
      return createHammerFeather();
    case 'retroreflector':
      return createRetroreflector();
    case 'viking_lander':
      return createViking();
    case 'pathfinder_sojourner':
      return createPathfinder();
    case 'mer_rover':
      return createMERRover(false);
    case 'mer_rover_oppy':
      return createMERRover(true);
    case 'ingenuity':
      return createIngenuity();
    case 'descent_debris':
      return createDescentDebris();
    default:
      return createApolloLM();
  }
}
