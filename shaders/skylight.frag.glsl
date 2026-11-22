// The gridded skylight: bright ivory light behind gold mullions. As uBlueprint goes 0 → 1
// the mullions turn cobalt and a fine drafting grid fades in: the skylight becomes the blueprint.
uniform float uBlueprint;
// Grid density (1 = the original 6 panes across the skylight).
uniform float uCells;
uniform vec3 uIvory;
uniform vec3 uGold;
uniform vec3 uCobalt;

varying vec2 vUv;

// Antialiased grid lines every 1/cells, `width` in pixels.
float grid(vec2 uv, float cells, float width) {
  vec2 g = uv * cells;
  vec2 d = abs(fract(g - 0.5) - 0.5) / fwidth(g);
  return 1.0 - clamp(min(d.x, d.y) - width * 0.5 + 0.5, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv;
  float panes = grid(uv, 6.0 * uCells, 2.5);
  float frame = 1.0 - smoothstep(0.0, 0.012, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  float fine = grid(uv, 60.0 * uCells, 1.0) * 0.35 + grid(uv, 12.0 * uCells, 1.2) * 0.6;

  // Light: brighter toward the centre.
  float glow = 1.0 - length(uv - 0.5) * 0.35;
  vec3 colour = uIvory * mix(1.0, glow, 1.0 - uBlueprint);

  float lines = max(panes, frame);
  float goldFade = 1.0 - smoothstep(0.0, 0.5, uBlueprint);
  float cobaltFade = smoothstep(0.35, 1.0, uBlueprint);
  colour = mix(colour, uGold, lines * 0.9 * goldFade);
  colour = mix(colour, uCobalt, lines * 0.75 * cobaltFade);
  colour = mix(colour, uCobalt, fine * uBlueprint * 0.55);

  gl_FragColor = vec4(colour, 1.0);
  #include <colorspace_fragment>
}
