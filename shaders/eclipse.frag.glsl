// The dying sun of the void (docs/vision.md §17): a black disc with a thin, broken ring of
// burning around it, and the faint, cracked rays of the compass star (one point missing).
// uLife: 0 = nearly dead, 1 = rekindled (just before the flash). uKindle: the failed sparks.
uniform float uTime;
uniform float uLife;
uniform float uKindle;
uniform float uOpacity;
uniform vec3 uDisc;
uniform vec3 uCorona;
uniform vec3 uHot;
uniform vec3 uHaze;

varying vec2 vUv;

// Sin-free hash (see flame.frag.glsl for why).
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
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

const float PI = 3.14159265;
const float R = 0.34; // disc radius (uv units from the centre, 0.5 = plane edge)

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c);
  float angle = atan(c.y, c.x);
  // Seamless angular coordinate for noise (wraps around the ring).
  vec2 around = vec2(cos(angle), sin(angle));

  float life = clamp(uLife + uKindle * 0.6, 0.0, 1.0);

  // Corona: a thin ring, broken into arcs that gutter (dying), with flames licking outward.
  // Nearly dead, the ring is mostly gone: a few guttering arcs. Alive, it closes into a full ring.
  float arcs = smoothstep(0.5 - life * 0.25, 0.62 - life * 0.2, fbm(around * 2.6 + vec2(uTime * 0.05, -uTime * 0.04)) + life * 0.3);
  float flames = fbm(around * 5.0 + vec2(d * 7.0 - uTime * 0.35, uTime * 0.1));
  float outside = max(d - R, 0.0);
  float ring = exp(-pow(outside / (0.006 + 0.01 * life), 2.0)) * step(R - 0.004, d);
  float licks = exp(-outside / (0.02 + 0.09 * life * flames)) * flames * step(R, d);
  float corona = (ring * 1.2 + licks * 0.9) * arcs * (0.35 + 0.65 * life);
  // Irregular flicker: the star sputters.
  corona *= 0.75 + 0.25 * noise(vec2(uTime * 3.1, 0.0)) + uKindle * 0.8;

  // Cracked compass-star rays: 8 directions, alternating long/short, one point missing.
  float sector = angle / (PI / 4.0);
  float nearest = floor(sector + 0.5);
  float off = abs(sector - nearest) * (PI / 4.0) * d; // distance from the ray line (approx)
  float k = mod(nearest + 8.0, 8.0);
  float reach = mod(k, 2.0) < 0.5 ? 0.5 : 0.42;
  float ray = exp(-off * 260.0) * smoothstep(R, R + 0.02, d) * (1.0 - smoothstep(R, reach, d));
  ray *= k == 3.0 ? 0.0 : 1.0; // the missing point
  ray *= 0.25 + 0.75 * noise(vec2(k * 7.0, uTime * 0.6)); // rays flicker on and off
  ray *= 0.15 + 0.85 * life;

  // Faint crimson haze around it.
  float haze = exp(-outside * 6.0) * step(R, d) * 0.35 * (0.5 + 0.5 * life);

  vec3 glow = mix(uCorona, uHot, clamp(corona * 0.6 + uKindle, 0.0, 1.0));
  vec3 colour = uHaze * haze + glow * (corona + ray * 0.6);
  float alpha = clamp(haze + corona + ray * 0.6, 0.0, 1.0);

  // The disc itself: an opaque black hole in the sky, rimmed by the corona.
  float disc = 1.0 - smoothstep(R - 0.003, R, d);
  colour = mix(colour, uDisc, disc);
  alpha = max(alpha, disc);

  // Fade the plane's edge.
  alpha *= 1.0 - smoothstep(0.42, 0.5, d);
  gl_FragColor = vec4(colour, alpha * uOpacity);
  #include <colorspace_fragment>
}
