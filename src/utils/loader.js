/**
 * 3D Model Loader with DRACO decompression and procedural fallback.
 * Loads external .glb models from public/models/ if present;
 * otherwise signals fallback to high-fidelity procedural 3D models.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

class ModelLoader {
  constructor() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    this.dracoLoader.preload();

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.cache = new Map();
  }

  /**
   * Load a model by filename (e.g. 'apollo_lm.glb').
   * If not found or load fails, resolves to null so the procedural generator takes over.
   */
  async loadModel(url) {
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      return cached ? cached.clone() : null;
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.cache.set(url, model);
          console.log(`[REMANENCE] Successfully loaded 3D asset: ${url}`);
          resolve(model);
        },
        undefined,
        (error) => {
          // Gracefully fall back to procedural 3D mesh
          console.info(`[REMANENCE] Model "${url}" not found or failed to load. Using procedural NASA stand-in.`);
          this.cache.set(url, null);
          resolve(null);
        }
      );
    });
  }
}

export const modelLoader = new ModelLoader();
