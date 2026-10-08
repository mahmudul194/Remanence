/**
 * In-scene 3D spatial captions using troika-three-text.
 * Renders glowing monospace coordinate markers and telemetry labels directly
 * in the 3D WebGL world above each machine.
 */

import { Text } from 'troika-three-text';

export function createSpatialCaption(captionText, colorHex = 0xffb84d) {
  const textMesh = new Text();
  textMesh.text = captionText;
  textMesh.fontSize = 0.22;
  textMesh.color = colorHex;
  textMesh.anchorX = 'center';
  textMesh.anchorY = 'bottom';
  textMesh.letterSpacing = 0.16;
  textMesh.outlineWidth = 0.035;
  textMesh.outlineColor = 0x05060a;
  textMesh.fillOpacity = 0.95;

  // Pre-sync glyph textures
  textMesh.sync();

  return textMesh;
}
