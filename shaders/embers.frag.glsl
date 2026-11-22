// Soft round ember; most are gold, a rare few ember red.
uniform vec3 uGold;
uniform vec3 uEmber;
uniform float uOpacity;

varying float vSeed;
varying float vFlicker;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 colour = vSeed > 0.88 ? uEmber : uGold;
  gl_FragColor = vec4(colour, a * vFlicker * uOpacity);
  #include <colorspace_fragment>
}
