// The sea of clouds below the dawn (chapter III): soft fbm clouds drifting slowly, lit warm on
// the side toward the low sun, lavender-blue in shade, fading into the horizon haze.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uHaze;
uniform vec2 uSun; // sun direction in the xz plane (from the camera)
uniform vec2 uOrigin; // the base path's position in the xz plane (fade with distance from it)

varying vec2 vUv;
varying vec3 vWorld;

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
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vWorld.xz * 0.045 + vec2(uTime * 0.008, uTime * 0.004);
  float d = fbm(p);
  float cloud = smoothstep(0.38, 0.72, d);
  // Light: the sun-facing slopes of the noise are brighter (a cheap gradient toward the sun).
  float lit = clamp((fbm(p + uSun * 0.08) - d) * -6.0 + 0.5, 0.0, 1.0);
  vec3 colour = mix(uShade, uLit, lit * 0.8 + 0.2 * cloud);

  // Distance from the camera: near clouds clear, far ones melt into the horizon haze.
  float dist = length(vWorld.xz - uOrigin);
  float far = smoothstep(18.0, 110.0, dist);
  colour = mix(colour, uHaze, far * 0.85);
  float alpha = mix(cloud * 0.9, 0.85, far) * smoothstep(4.0, 12.0, dist);
  gl_FragColor = vec4(colour, alpha * uOpacity);
  #include <colorspace_fragment>
}
