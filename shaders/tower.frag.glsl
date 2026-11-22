// Lantern tower walls (the lift shaft): stone courses, a gold string course every storey, and
// tall lit windows between them. Darker and lavender-shaded low down, brightening toward the
// skylight. Self-lit, so the climb streams with light without any scene lights.
uniform float uBottom;
uniform float uTop;
uniform float uStorey;
uniform vec3 uStone;
uniform vec3 uShade;
uniform vec3 uGold;
uniform vec3 uLight;

varying vec2 vUv;
varying float vY;

// Antialiased band of `width` (world units) around every multiple of `period`.
float bands(float x, float period, float width) {
  float d = abs(fract(x / period + 0.5) - 0.5) * period;
  float aa = fwidth(x) * 0.75;
  return 1.0 - smoothstep(width * 0.5 - aa, width * 0.5 + aa, d);
}

void main() {
  float h = clamp((vY - uBottom) / (uTop - uBottom), 0.0, 1.0);

  // Stone: lavender shade low down, warm ivory up high; masonry courses every 0.8 units.
  vec3 colour = mix(uShade, uStone, smoothstep(0.05, 0.8, h)) * mix(0.55, 1.0, smoothstep(0.0, 0.9, h));
  colour *= 1.0 - bands(vY, 0.8, 0.03) * 0.12;
  // Pilaster shading toward the corners.
  float corner = min(vUv.x, 1.0 - vUv.x);
  colour *= mix(0.78, 1.0, smoothstep(0.0, 0.12, corner));

  // Three tall windows per wall in each storey, lit from outside, with rounded heads.
  float storeyY = fract((vY - uBottom) / uStorey);
  float slotX = abs(fract(vUv.x * 3.0) - 0.5);
  float halfWidth = 0.08;
  float head = 0.68; // where the round head starts (fraction of the storey)
  float shaft = (1.0 - smoothstep(halfWidth - 0.01, halfWidth, slotX)) * smoothstep(0.2, 0.22, storeyY) * (1.0 - step(head, storeyY));
  // Semicircular head: a circle of radius halfWidth centred at the head line (x stretched to world-ish units).
  vec2 headUv = vec2(slotX / halfWidth, (storeyY - head) * uStorey / (halfWidth * 8.0 / 3.0));
  float archHead = (1.0 - smoothstep(0.92, 1.0, length(headUv))) * step(head, storeyY);
  float window = max(shaft, archHead);
  // A dark stone reveal around each window, so they read as openings rather than glowing bars.
  float revealShaft = (1.0 - smoothstep(halfWidth + 0.02, halfWidth + 0.03, slotX)) * smoothstep(0.18, 0.2, storeyY) * (1.0 - step(head, storeyY));
  vec2 revealUv = vec2(slotX / (halfWidth + 0.03), (storeyY - head) * uStorey / ((halfWidth + 0.03) * 8.0 / 3.0));
  float revealHead = (1.0 - smoothstep(0.95, 1.0, length(revealUv))) * step(head, storeyY);
  colour = mix(colour, colour * 0.55, max(revealShaft, revealHead) * (1.0 - window));
  // Mullion and transom.
  float mullion = 1.0 - smoothstep(0.006, 0.012, slotX);
  float transom = 1.0 - smoothstep(0.004, 0.008, abs(storeyY - 0.46));
  window *= 1.0 - max(mullion, transom) * 0.85;
  vec3 lit = mix(uGold, uLight, 0.35 + 0.65 * h);
  colour = mix(colour, lit, window);

  // Gold string course at each storey line, with a thin shadow under it.
  float course = bands(vY - uBottom, uStorey, 0.14);
  float under = bands(vY - uBottom - 0.16, uStorey, 0.1);
  colour = mix(colour, colour * 0.7, under);
  colour = mix(colour, uGold, course * 0.9);

  // Light pours down from the sky: the top of the tower glows.
  colour = mix(colour, uLight, smoothstep(0.82, 1.0, h) * 0.65);

  gl_FragColor = vec4(colour, 1.0);
  #include <colorspace_fragment>
}
