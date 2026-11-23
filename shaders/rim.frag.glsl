// A dark body seen only by a thin rim of light (the dying sun behind things in the void): almost
// black, with a fresnel rim, brighter on the side facing the light. uGlow flares with kindling.
uniform vec3 uBody;
uniform vec3 uRim;
uniform vec3 uLightPos; // view space: the dying sun
uniform float uPower;
uniform float uGlow;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

void main() {
  vec3 n = normalize(vNormal);
  float facing = abs(dot(n, normalize(vView)));
  float rim = pow(1.0 - facing, uPower);
  float lit = 0.25 + 0.75 * smoothstep(-0.2, 0.8, dot(n, normalize(uLightPos - vPos)));
  vec3 colour = uBody + uRim * rim * lit * (0.6 + uGlow);
  gl_FragColor = vec4(colour, uOpacity);
  #include <colorspace_fragment>
}
