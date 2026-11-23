// A far ridge against a crimson glow (chapter IV): a jagged silhouette (fbm height line), the
// glow rising behind it, a thin hot rim along the edge.
uniform float uOpacity;
uniform vec3 uGlow;
uniform vec3 uRim;
uniform vec3 uDark;

varying vec2 vUv;

// Sin-free 1D hash (see flame.frag.glsl for why sin-based hashes break on some GPUs).
float hash(float x) {
  x = fract(x * 0.1031);
  x *= x + 33.33;
  x *= x + x;
  return fract(x);
}

float noise1(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

void main() {
  float x = vUv.x * 9.0;
  float h = 0.18 + 0.16 * noise1(x) + 0.08 * noise1(x * 2.7 + 3.0) + 0.03 * noise1(x * 7.1 + 9.0);
  float y = vUv.y;
  float below = 1.0 - smoothstep(h - 0.002, h + 0.002, y);
  float glow = exp(-max(y - h, 0.0) * 7.0) * (1.0 - below) * (0.5 + 0.5 * smoothstep(0.0, 0.5, 1.0 - abs(vUv.x - 0.5) * 2.0));
  float rim = exp(-abs(y - h) * 300.0);
  vec3 colour = uDark * below + uGlow * glow + uRim * rim * 0.8;
  float alpha = max(below, max(glow * 0.75, rim));
  gl_FragColor = vec4(colour, alpha * uOpacity);
  #include <colorspace_fragment>
}
