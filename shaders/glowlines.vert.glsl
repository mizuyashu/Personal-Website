// Short glowing lines in the void: each blinks on and off on its own rhythm.
uniform float uTime;

attribute float aSeed;

varying float vAlpha;

void main() {
  float wave = sin(uTime * (0.4 + aSeed * 0.9) + aSeed * 60.0);
  vAlpha = smoothstep(0.55, 1.0, wave);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
