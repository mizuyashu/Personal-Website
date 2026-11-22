// Spark burst: each spark flies out along its own direction as uBurst goes 0 → 1,
// slows (ease-out), sags a little and dies out. Shares embers.frag for its look.
uniform float uBurst;
uniform float uSize;
uniform float uPixelRatio;

attribute vec3 aDir;
attribute float aSeed;

varying float vSeed;
varying float vFlicker;

void main() {
  float t = clamp(uBurst, 0.0, 1.0);
  float travel = 1.0 - pow(1.0 - t, 3.0);
  vec3 p = position + aDir * travel * (3.0 + aSeed * 6.0);
  p.y -= t * t * 1.2;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.5 + aSeed) * (1.0 - t * 0.6) / -mv.z;

  vSeed = aSeed;
  // Dead at rest (t = 0) and at the end (t = 1): only alive while flying.
  vFlicker = step(0.001, t) * (1.0 - smoothstep(0.55, 1.0, t)) * (0.7 + 0.3 * fract(aSeed * 91.0));
}
