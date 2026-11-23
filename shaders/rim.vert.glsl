// Rim-lit silhouettes (void planets and ruins): pass the view-space normal and position.
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
