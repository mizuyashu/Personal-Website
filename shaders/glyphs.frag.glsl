// One glyph from the 8 × 8 atlas, tinted cobalt.
uniform sampler2D uAtlas;
uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;
varying float vGlyph;
varying float vEdge;

void main() {
  vec2 cell = vec2(mod(vGlyph, 8.0), floor(vGlyph / 8.0));
  vec2 uv = (cell + vUv) / 8.0;
  float a = texture2D(uAtlas, uv).a;
  gl_FragColor = vec4(uColor, a * vEdge * uOpacity);
  #include <colorspace_fragment>
}
