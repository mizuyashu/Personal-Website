// Void embers: points drifting upward with a slow sway, wrapping top to bottom.
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;

attribute float aSeed;

varying float vSeed;
varying float vFlicker;

void main() {
  vec3 p = position;
  float speed = 0.2 + aSeed * 0.45;
  p.y = mod(p.y + 8.0 + uTime * speed, 16.0) - 8.0;
  p.x += sin(uTime * 0.5 + aSeed * 40.0) * 0.3;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (0.4 + aSeed) / -mv.z;

  vSeed = aSeed;
  vFlicker = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 4.0) + aSeed * 100.0);
}
