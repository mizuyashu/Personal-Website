// The compass-star sun: 8-point star in a double ring, a soft halo,
// and endless thin rays running out past the edge of the screen. Gold on ivory.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uGold;

varying vec2 vUv;

#define TAU 6.28318530718

// 1 on a hairline at distance 0, antialiased over `px`.
float hairline(float dist, float px) {
  return 1.0 - smoothstep(px * 0.5, px * 1.5, abs(dist));
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float px = length(fwidth(p)) * 0.7; // size of one pixel in plane units

  // Endless rays: alternating long and short, slowly turning.
  float rayCount = 128.0;
  float t = (a + uTime * 0.015) * rayCount / TAU;
  float cell = floor(t + 0.5);
  float angularPx = rayCount / TAU * px / max(r, 1e-3);
  float ray = 1.0 - smoothstep(angularPx * 0.5, angularPx * 1.5, abs(t - cell));
  float isLong = mod(cell, 2.0);
  float rayStart = mix(0.34, 0.24, isLong);
  ray *= smoothstep(rayStart, rayStart + 0.06, r) * (1.0 - smoothstep(0.75, 1.0, r));
  ray *= mix(0.22, 0.4, isLong);

  // 8-point star: long points on the compass directions, short on the diagonals.
  float sa = a - uTime * 0.01;
  float cardinal = pow(abs(cos(2.0 * sa)), 28.0);
  float diagonal = pow(abs(sin(2.0 * sa)), 28.0);
  float starR = 0.07 + 0.43 * cardinal + 0.2 * diagonal;
  float starEdge = hairline(r - starR, px * 1.6);
  float starFill = (1.0 - smoothstep(-px, px, r - starR)) * 0.1;

  // Double ring around the star, and a faint outer ring.
  float rings = hairline(r - 0.4, px * 1.4) + hairline(r - 0.425, px) * 0.8 + hairline(r - 0.6, px) * 0.35;

  // Soft halo behind the name.
  float halo = exp(-r * r * 7.0) * 0.28;

  float alpha = clamp(ray + starEdge * 0.85 + starFill + rings * 0.75 + halo, 0.0, 1.0);
  gl_FragColor = vec4(uGold, alpha * uOpacity);
  #include <colorspace_fragment>
}
