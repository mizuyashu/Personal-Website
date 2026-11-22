// Dawn horizon band: warm gold at the bottom fading through ivory into the sky above.
uniform vec3 uWarm;
uniform vec3 uLight;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float h = vUv.y;
  vec3 colour = mix(uWarm, uLight, smoothstep(0.0, 0.6, h));
  float alpha = (1.0 - smoothstep(0.15, 1.0, h)) * 0.85;
  gl_FragColor = vec4(colour, alpha * uOpacity);
  #include <colorspace_fragment>
}
