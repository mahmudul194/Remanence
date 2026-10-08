/**
 * In-scene 3D spatial captions using troika-three-text.
 * Renders glowing monospace coordinate markers and telemetry labels directly
 * in the 3D WebGL world above each machine.
 */

import { Text } from 'troika-three-text';

export function createSpatialCaption(captionText, colorHex = 0x4df0ff) {
  const textMesh = new Text();
  textMesh.text = captionText;
  textMesh.fontSize = 0.22;
  textMesh.color = colorHex;
  textMesh.anchorX = 'center';
  textMesh.anchorY = 'bottom';
  textMesh.letterSpacing = 0.08;
  textMesh.outlineWidth = 0.015;
  textMesh.outlineColor = 0x030508;
  textMesh.fillOpacity = 0.85;

  // Pre-sync glyph textures
  textMesh.sync();

  return textMesh;
}
