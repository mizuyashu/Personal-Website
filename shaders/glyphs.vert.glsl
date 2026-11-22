// "Code flow": lanes of invented glyphs streaming across the blueprint (never real code).
// Instanced quads lying flat under the plate; each slides along x with scroll (uFlow),
// wrapping, and fades out toward the plate's edges.
uniform float uFlow;
uniform float uWidth;
uniform float uSize;

attribute vec4 aLane; // x start, z, speed, glyph index (0–63)

varying vec2 vUv;
varying float vGlyph;
varying float vEdge;

void main() {
  float halfWidth = uWidth * 0.5;
  float x = mod(aLane.x + uFlow * aLane.z + halfWidth, uWidth) - halfWidth;
  vec3 p = vec3(x + position.x * uSize, position.y, aLane.y + position.z * uSize);
  vUv = uv;
  vGlyph = aLane.w;
  vEdge = 1.0 - smoothstep(halfWidth * 0.55, halfWidth * 0.85, abs(x));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
