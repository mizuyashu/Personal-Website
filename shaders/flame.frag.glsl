// Stylised bonfire flame: a teardrop shape eaten by rising noise; ember red at the edges,
// gold in the body, ivory at the core.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uEmber;
uniform vec3 uGold;
uniform vec3 uIvory;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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
  float sway = (fbm(vec2(uv.y * 2.5 - uTime * 0.9, uTime * 0.35)) - 0.5) * 0.35 * uv.y;
  vec2 q = vec2(uv.x + sway, uv.y);

  // Teardrop envelope, then rising noise splits it into tongues that break up near the top.
  float width = mix(0.34, 0.0, pow(uv.y, 0.8));
  float edge = abs(q.x - 0.5) / max(width, 0.001);
  float envelope = (1.0 - smoothstep(0.35, 1.0, edge)) * smoothstep(0.0, 0.05, uv.y);
  float n = fbm(vec2(q.x * 6.0, q.y * 3.5 - uTime * 2.4));
  float heat = clamp(envelope * (n * 1.5 - uv.y * 0.85 + 0.25), 0.0, 1.0);

  vec3 colour = mix(uEmber, uGold, smoothstep(0.1, 0.45, heat));
  colour = mix(colour, uIvory, smoothstep(0.62, 0.95, heat));
  gl_FragColor = vec4(colour, smoothstep(0.04, 0.3, heat) * uOpacity);
  #include <colorspace_fragment>
}
