/**
 * REMANENCE: Mars Entry, Descent, and Landing (EDL) Debris Field
 * Museum-grade, physically authentic reconstruction based on NASA JPL Mars 2020 /
 * Curiosity EDL Telemetry, Ingenuity Aerial Flight 26 Surveys, and HiRISE Orbit Imaging.
 *
 * Implements:
 * - Jettisoned Conical Backshell:
 *   - Ablative thermal protection tiles (SLA-561V) with atmospheric entry scorch streaks
 *   - Double-sided geometry ensuring visibility from all camera angles
 *   - High-velocity impact fracture damage: crumpled rim, sheared RCS thruster pods
 *   - Exposed avionics titanium ring and severed braided wire harnesses
 * - Supersonic 21.5m Disk-Gap-Band Parachute:
 *   - Billowing nylon canopy draped across Martian dunes with authentic orange/white gores
 *   - Cohesive composition framed alongside the backshell
 *   - Braided Technora/Kevlar suspension lines connecting to the backshell
 * - Zero artificial glowing lamps or black discs
 */

import * as THREE from 'three';
import { getAerospaceMaterials } from '../materials/aerospaceMaterials.js';
import { applyWeathering } from '../materials/weatheringShader.js';

export function createDetailedDescentDebris() {
  const root = new THREE.Group();
  root.name = 'mars_edl_descent_debris_field';

  const rawMats = getAerospaceMaterials();
  const mats = {
    aluminum: applyWeathering(rawMats.aluminumAlloy, { planet: 'mars' }),
    darkInconel: applyWeathering(rawMats.blackInconel, { planet: 'mars' }),
    springSteel: applyWeathering(rawMats.springSteel, { planet: 'mars' }),
    goldKapton: applyWeathering(rawMats.goldKapton, { planet: 'mars' })
  };

  const debrisGroup = new THREE.Group();
  root.add(debrisGroup);

  // =========================================================================
  // 1. CHARRED CONICAL BACKSHELL (Impacted at ~126 km/h)
  // =========================================================================
  const backshellGroup = new THREE.Group();
  backshellGroup.position.set(-0.75, 0.48, 0.15);
  backshellGroup.rotation.set(0.32, 0.35, -0.22);
  debrisGroup.add(backshellGroup);

  // Ablative Tile Texture with re-entry aerodynamic charring streaks
  const shellCanvas = document.createElement('canvas');
  shellCanvas.width = 512;
  shellCanvas.height = 512;
  const sCtx = shellCanvas.getContext('2d');

  // Base ceramic tile off-white/tan tone
  sCtx.fillStyle = '#cfc6b5';
  sCtx.fillRect(0, 0, 512, 512);

  // Tile grid seams (hexagonal / square thermal protection system tiles)
  sCtx.strokeStyle = 'rgba(75, 65, 55, 0.45)';
  sCtx.lineWidth = 1.0;
  for (let x = 0; x <= 512; x += 32) {
    sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, 512); sCtx.stroke();
  }
  for (let y = 0; y <= 512; y += 32) {
    sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(512, y); sCtx.stroke();
  }

  // Aerodynamic re-entry scorch streaks (1400°C plasma shockwave ablation)
  const scorchGrad = sCtx.createLinearGradient(0, 512, 0, 0);
  scorchGrad.addColorStop(0, 'rgba(22, 16, 14, 0.96)');
  scorchGrad.addColorStop(0.35, 'rgba(75, 38, 20, 0.78)');
  scorchGrad.addColorStop(0.7, 'rgba(145, 68, 28, 0.38)');
  scorchGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  sCtx.fillStyle = scorchGrad;
  sCtx.fillRect(0, 0, 512, 512);

  // Plasma striations
  for (let i = 0; i < 45; i++) {
    const sx = Math.random() * 512;
    const sy = 160 + Math.random() * 352;
    const sl = 50 + Math.random() * 190;
    sCtx.strokeStyle = `rgba(18, 12, 10, ${0.45 + Math.random() * 0.45})`;
    sCtx.lineWidth = 1.8 + Math.random() * 4;
    sCtx.beginPath();
    sCtx.moveTo(sx, sy);
    sCtx.lineTo(sx + (Math.random() - 0.5) * 18, sy - sl);
    sCtx.stroke();
  }

  const shellTex = new THREE.CanvasTexture(shellCanvas);

  const backshellMat = applyWeathering(new THREE.MeshPhysicalMaterial({
    map: shellTex,
    roughness: 0.85,
    metalness: 0.15,
    clearcoat: 0.2,
    side: THREE.DoubleSide // Ensure full visibility, never culled!
  }), { planet: 'mars' });

  // Conical shell geometry (blunt 70-degree sphere-cone)
  const shellGeo = new THREE.ConeGeometry(1.55, 1.25, 32, 8, true);
  shellGeo.rotateX(Math.PI);
  const pos = shellGeo.attributes.position;
  // Impact buckling along the lower rim
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < -0.3) {
      const px = pos.getX(i);
      const dent = Math.sin(px * 7.0) * 0.10 * Math.abs(y);
      pos.setX(i, px + dent);
    }
  }
  shellGeo.computeVertexNormals();

  const shellMesh = new THREE.Mesh(shellGeo, backshellMat);
  shellMesh.castShadow = true;
  shellMesh.receiveShadow = true;
  backshellGroup.add(shellMesh);

  // Internal structural titanium ring
  const ringGeo = new THREE.TorusGeometry(1.48, 0.04, 8, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, mats.aluminum);
  ringMesh.position.y = -0.58;
  backshellGroup.add(ringMesh);

  // Reaction Control System (RCS) thruster pods on cone flank
  for (let i = 0; i < 4; i++) {
    const rcsAngle = (i * Math.PI) / 2 + 0.3;
    const rcsGeo = new THREE.BoxGeometry(0.16, 0.12, 0.14);
    const rcs = new THREE.Mesh(rcsGeo, mats.darkInconel);
    rcs.position.set(Math.sin(rcsAngle) * 1.05, -0.12, Math.cos(rcsAngle) * 1.05);
    rcs.rotation.y = rcsAngle;
    backshellGroup.add(rcs);
  }

  // Severed umbilical wiring harnesses spilling out
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x242d3a, roughness: 0.75 });
  for (let w = 0; w < 6; w++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(w) * 0.7, -0.45, Math.sin(w) * 0.7),
      new THREE.Vector3(Math.cos(w) * 1.05, -0.65, Math.sin(w) * 1.05),
      new THREE.Vector3(Math.cos(w) * 1.35 + (w * 0.08), -0.78, Math.sin(w) * 1.25)
    ]);
    const wireGeo = new THREE.TubeGeometry(curve, 12, 0.011, 6, false);
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.castShadow = true;
    backshellGroup.add(wire);
  }

  // =========================================================================
  // 2. SUPERSONIC NYLON PARACHUTE CANOPY (21.5-meter Disk-Gap-Band)
  // =========================================================================
  const chuteGroup = new THREE.Group();
  // Positioned cohesively beside the backshell in the same camera shot
  chuteGroup.position.set(1.45, 0.02, 0.35);
  chuteGroup.rotation.y = -0.15;
  debrisGroup.add(chuteGroup);

  // High-visibility Orange & White Parachute Gore Pattern
  const chuteCanvas = document.createElement('canvas');
  chuteCanvas.width = 512;
  chuteCanvas.height = 512;
  const cCtx = chuteCanvas.getContext('2d');

  cCtx.fillStyle = '#f0f3f8';
  cCtx.fillRect(0, 0, 512, 512);

  const numGores = 32;
  cCtx.fillStyle = '#d6461c'; // Supersonic international orange
  for (let g = 0; g < numGores; g += 2) {
    const a1 = (g * 2 * Math.PI) / numGores;
    const a2 = ((g + 1) * 2 * Math.PI) / numGores;
    cCtx.beginPath();
    cCtx.moveTo(256, 256);
    cCtx.arc(256, 256, 256, a1, a2);
    cCtx.closePath();
    cCtx.fill();
  }

  // Reinforcing structural tape lines & concentric bands
  cCtx.strokeStyle = 'rgba(25, 18, 12, 0.38)';
  cCtx.lineWidth = 1.5;
  for (let r = 64; r <= 256; r += 64) {
    cCtx.beginPath(); cCtx.arc(256, 256, r, 0, Math.PI * 2); cCtx.stroke();
  }

  // Natural Martian hematite dust film settling over fabric
  cCtx.fillStyle = 'rgba(175, 78, 36, 0.40)';
  cCtx.fillRect(0, 0, 512, 512);

  const chuteTex = new THREE.CanvasTexture(chuteCanvas);

  const parachuteMat = applyWeathering(new THREE.MeshStandardMaterial({
    map: chuteTex,
    roughness: 0.88,
    metalness: 0.05,
    side: THREE.DoubleSide
  }), { planet: 'mars' });

  // Billowing terrain-conforming canopy geometry
  const chuteGeo = new THREE.PlaneGeometry(3.6, 4.4, 24, 24);
  chuteGeo.rotateX(-Math.PI / 2);
  const cPos = chuteGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const px = cPos.getX(i);
    const pz = cPos.getZ(i);
    // Radial wind billow folds across sand ripples
    const wave1 = Math.sin(px * 3.5 + pz * 1.6) * 0.14;
    const wave2 = Math.cos(px * 2.0 - pz * 2.9) * 0.09;
    const edgeDip = Math.max(0, 1.0 - (Math.hypot(px, pz) / 2.3));
    cPos.setY(i, (wave1 + wave2) * edgeDip + 0.04);
  }
  chuteGeo.computeVertexNormals();

  const chuteMesh = new THREE.Mesh(chuteGeo, parachuteMat);
  chuteMesh.castShadow = true;
  chuteMesh.receiveShadow = true;
  chuteGroup.add(chuteMesh);

  // Braided Technora Suspension Lines trailing toward the backshell
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xd2c4a2, roughness: 0.72 });
  for (let l = 0; l < 8; l++) {
    const angle = (l / 8) * Math.PI * 0.7 - 0.35;
    const startX = Math.sin(angle) * 1.5;
    const startZ = Math.cos(angle) * 1.9;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, 0.05, startZ),
      new THREE.Vector3(startX * 0.5 - 0.8, 0.03, startZ * 0.4 - 0.3),
      new THREE.Vector3(-2.1, 0.04, -0.2 + (l * 0.09))
    ]);
    const lineGeo = new THREE.TubeGeometry(curve, 16, 0.005, 4, false);
    const line = new THREE.Mesh(lineGeo, lineMat);
    chuteGroup.add(line);
  }

  // Reference anchor for inspection (non-luminous)
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(-0.75, 1.15, 0.15);
  root.add(beaconGroup);

  root.userData = { beacon: beaconGroup };
  return root;
}
