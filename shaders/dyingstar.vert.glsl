// Dying stars in the void sky: each one a tiny eclipse (dark disc, thin burning ring) that
// gutters, flares and sometimes collapses. aLife: 0 = dead ember, 1 = a cold, distant glint.
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute float aSeed;
attribute float aScale;
attribute float aLife;

varying float vSeed;
varying float vLife;
varying float vPulse;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aScale * uPixelRatio / -mv.z;
  vSeed = aSeed;
  vLife = aLife;
  // Irregular: two incommensurate flickers, and now and then a collapse to almost nothing.
  float f = 0.6 + 0.25 * sin(uTime * (0.7 + aSeed * 2.3) + aSeed * 40.0) + 0.15 * sin(uTime * (3.1 + aSeed * 5.0));
  float collapse = smoothstep(0.93, 1.0, sin(uTime * (0.11 + aSeed * 0.17) + aSeed * 90.0));
  vPulse = f * (1.0 - collapse * 0.9);
}
