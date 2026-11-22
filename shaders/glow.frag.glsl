// The light rising from something held: white-gold core, soft gold halo.
uniform vec3 uGold;
uniform vec3 uIvory;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5) * 2.0;
  float core = exp(-d * d * 30.0);
  float halo = exp(-d * 4.5) * 0.55;
  float edge = 1.0 - smoothstep(0.85, 1.0, d);
  vec3 colour = mix(uGold, uIvory, core);
  gl_FragColor = vec4(colour, (core + halo) * edge * uOpacity);
  #include <colorspace_fragment>
}
