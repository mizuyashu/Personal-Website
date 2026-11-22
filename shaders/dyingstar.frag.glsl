// One dying star: a dark disc with a thin burning ring (pale ember), or, for the few still
// alive, a small cold glint of distant starlight that never reaches you.
uniform vec3 uRing;
uniform vec3 uCold;
uniform vec3 uDisc;
uniform float uOpacity;

varying float vSeed;
varying float vLife;
varying float vPulse;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;

  if (vLife > 0.85) {
    // Distant, cold starlight: a small soft point.
    float a = exp(-d * d * 18.0) * vPulse;
    gl_FragColor = vec4(uCold, a * uOpacity);
  } else {
    // Eclipse: dark disc, ring at r = 0.55, broken by an arc gap that depends on the seed.
    float angle = atan(c.y, c.x);
    float gap = smoothstep(0.2, 0.6, 0.5 + 0.5 * sin(angle * (1.0 + floor(vSeed * 3.0)) + vSeed * 20.0));
    float ring = exp(-pow((d - 0.55) / 0.08, 2.0)) * gap;
    float halo = exp(-max(d - 0.55, 0.0) * 6.0) * step(0.55, d) * 0.3;
    float disc = 1.0 - smoothstep(0.5, 0.55, d);
    float burn = (ring + halo) * vPulse * (0.4 + vLife);
    vec3 colour = mix(uDisc, uRing, clamp(burn * 1.5, 0.0, 1.0));
    float a = max(disc * 0.9, burn);
    gl_FragColor = vec4(colour, a * uOpacity);
  }
  #include <colorspace_fragment>
}
