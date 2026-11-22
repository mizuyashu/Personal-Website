// Stylised bonfire flame: a teardrop shape eaten by rising noise; ember red at the edges,
// gold in the body, ivory at the core.
uniform float uTime;
uniform float uOpacity;
// 1 = the settled wild fire; more during the ignition pop (faster, taller, more broken tongues).
uniform float uWild;
// Offsets the noise so stacked layers flicker independently.
uniform float uSeed;
uniform vec3 uEmber;
uniform vec3 uGold;
uniform vec3 uIvory;

varying vec2 vUv;

// Sin-free hash (Dave Hoskins). The classic fract(sin(x) * 43758.5) amplifies tiny rounding
// differences on some GPUs (ANGLE / D3D), so neighbouring noise cells disagree at their shared
// corners and the flame shows hard stair-steps.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  // Sway: the flame bends more toward its top.
  float sway = (fbm(vec2(uv.y * 2.5 - uTime * 0.9 + uSeed, uTime * 0.35 + uSeed * 1.7)) - 0.5) * (0.2 + uWild * 0.2) * uv.y;
  vec2 q = vec2(uv.x + sway, uv.y);

  // Teardrop envelope, then rising noise splits it into tongues that break up near the top.
  // Widest a little above the base, rounded underneath (no flat bottom edge).
  float width = mix(0.34, 0.0, pow(uv.y, 0.8)) * sqrt(smoothstep(0.0, 0.2, uv.y));
  float edge = abs(q.x - 0.5) / max(width, 0.001);
  // Soft at the base too, so the plane's bottom edge never shows.
  float envelope = (1.0 - smoothstep(0.35, 1.0, edge)) * smoothstep(0.0, 0.12, uv.y);
  float n = fbm(vec2(q.x * (5.0 + uWild * 2.0) + uSeed * 3.1, q.y * 3.5 - uTime * (1.6 + uWild * 1.6)));
  float heat = clamp(envelope * (n * (1.2 + uWild * 0.5) - uv.y * (1.0 - uWild * 0.25) + 0.25), 0.0, 1.0);

  vec3 colour = mix(uEmber, uGold, smoothstep(0.1, 0.45, heat));
  colour = mix(colour, uIvory, smoothstep(0.72, 1.0, heat));
  gl_FragColor = vec4(colour, smoothstep(0.04, 0.3, heat) * uOpacity);
  #include <colorspace_fragment>
}
