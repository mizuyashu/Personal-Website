// Short glowing lines in the void: each blinks on and off on its own rhythm.
uniform float uTime;

attribute float aSeed;

varying float vAlpha;

void main() {
  // Slow, rare blinks: each line is dark most of the time.
  float wave = sin(uTime * (0.25 + aSeed * 0.5) + aSeed * 60.0);
  vAlpha = smoothstep(0.8, 1.0, wave);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
