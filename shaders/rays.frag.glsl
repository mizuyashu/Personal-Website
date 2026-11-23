// Soft rays from a low sun (chapter III): angular streaks that breathe slowly, fading outward.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c) * 2.0;
  float a = atan(c.y, c.x);
  float rays = 0.5 + 0.5 * sin(a * 18.0 + sin(a * 5.0 + uTime * 0.1) * 2.0);
  rays = pow(rays, 12.0) * (0.5 + 0.5 * sin(a * 7.0 - uTime * 0.07));
  float fade = (1.0 - smoothstep(0.1, 1.0, d)) * smoothstep(0.05, 0.2, d);
  gl_FragColor = vec4(uColor, rays * fade * 0.1 * uOpacity);
  #include <colorspace_fragment>
}
