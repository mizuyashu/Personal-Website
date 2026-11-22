// A shaft of light: soft-edged band, brightest at its source (top of the quad), with slow drifting motes.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
  float band = smoothstep(0.0, 0.7, across);
  float fall = pow(vUv.y, 1.6);
  float motes = 0.85 + 0.15 * sin(vUv.y * 40.0 + uTime * 0.6 + vUv.x * 12.0);
  gl_FragColor = vec4(uColor, band * fall * motes * uOpacity);
  #include <colorspace_fragment>
}
