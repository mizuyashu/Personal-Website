// Falling ash in the void: drifts down (not up), sways, and is caught by sudden gusts that
// throw whole bands sideways. Wraps bottom to top. Shares embers.frag for its look.
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute float aSeed;

varying float vSeed;
varying float vFlicker;

void main() {
  vec3 p = position;
  float speed = 0.12 + aSeed * 0.35;
  p.y = mod(p.y + 8.0 - uTime * speed, 16.0) - 8.0;
  // Sway, plus gusts: a slow pulse that sweeps through height bands.
  float gust = pow(max(0.0, sin(uTime * 0.21 + p.y * 0.35 + aSeed * 1.5)), 8.0);
  p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.35 + gust * (1.5 + aSeed * 2.5);
  p.z += cos(uTime * 0.3 + aSeed * 17.0) * 0.3;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.3 + aSeed * 0.9) / -mv.z;

  vSeed = aSeed;
  vFlicker = 0.35 + 0.35 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 50.0) + gust * 0.3;
}
