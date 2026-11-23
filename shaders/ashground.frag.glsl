// The ash plain of the embers (chapter IV): near-black ground with ember veins glowing in the
// cracks (cell edges), breathing slowly; the far ground melts into the dark.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uAsh;
uniform vec3 uEmber;
uniform vec3 uGold;
uniform vec2 uOrigin; // the base path's position in the xz plane

varying vec2 vUv;
varying vec3 vWorld;

vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Distance to the nearest cell edge (cracks).
float cracks(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash2(i + g);
      float d = length(g + o - f);
      if (d < d1) {
        d2 = d1;
        d1 = d;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  return d2 - d1;
}

void main() {
  vec2 p = vWorld.xz * 0.2;
  // Warp the cells so the cracks wander (ash, not tiles).
  p += 0.45 * vec2(sin(p.y * 1.3 + 0.7), cos(p.x * 1.1 + 2.1)) + 0.2 * vec2(sin(p.y * 3.7), cos(p.x * 3.3));
  float edge = cracks(p);
  float line = 1.0 - smoothstep(0.0, 0.045, edge);
  // Only some cracks still burn: slow patches of heat; the rest are dark lines in the ash.
  float heat = smoothstep(0.55, 0.9, 0.5 + 0.5 * sin(p.x * 0.45 + 1.3) * cos(p.y * 0.38 - 0.4) + 0.25 * sin(p.x * 1.7 + p.y * 1.3));
  float vein = line * heat;
  // The veins breathe in slow waves rolling across the plain.
  float breathe = 0.55 + 0.45 * sin(uTime * 0.6 + p.x * 0.7 + p.y * 0.9);
  float dist = length(vWorld.xz - uOrigin);
  float near = 1.0 - smoothstep(10.0, 60.0, dist);
  vec3 glow = mix(uEmber, uGold, vein * vein * 0.6);
  vec3 colour = uAsh * (1.0 - line * 0.35) + glow * vein * breathe * near * 0.9;
  float alpha = (0.9 + vein * 0.1) * smoothstep(3.0, 8.0, dist) * (1.0 - smoothstep(45.0, 68.0, dist));
  gl_FragColor = vec4(colour, alpha * uOpacity);
  #include <colorspace_fragment>
}
