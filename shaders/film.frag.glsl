// Film pass (docs/vision.md §19 "shader feel"): halftone dots in the shadows, soft drifting light
// leaks (screen-blended), and grain. A postprocessing Effect (mainImage); `resolution` comes from
// the effect material. Strengths are set per chapter by components/canvas/Film.tsx.
uniform float uTime;
uniform float uLeak;
uniform float uHalftone;
uniform float uGrain;
uniform vec3 uLeakA;
uniform vec3 uLeakB;

float filmHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  vec2 px = uv * resolution;

  // Halftone: a 45° dot screen, dots growing as the image gets darker. In deep shadow the dots
  // lift the black a touch with the leak tint, like ink on paper catching light.
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float shadow = 1.0 - smoothstep(0.0, 0.3, l);
  vec2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071) * px / 5.0;
  vec2 f = fract(r) - 0.5;
  float radius = 0.48 * sqrt(shadow);
  float aa = 0.12;
  float dotMask = 1.0 - smoothstep(radius - aa, radius + aa, length(f));
  c = mix(c, c * 0.55 + uLeakA * 0.035, dotMask * shadow * uHalftone);

  // Light leaks: two large soft blobs drifting slowly at the edges, screen-blended.
  vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
  vec2 a = vec2(0.06 + 0.05 * sin(uTime * 0.07), 0.92 + 0.05 * cos(uTime * 0.05));
  vec2 b = vec2(0.96 + 0.04 * cos(uTime * 0.06), 0.12 + 0.06 * sin(uTime * 0.08));
  float la = exp(-pow(length((uv - a) * aspect) / 0.5, 2.0));
  float lb = exp(-pow(length((uv - b) * aspect) / 0.42, 2.0));
  vec3 leak = (uLeakA * la + uLeakB * lb) * uLeak;
  c = 1.0 - (1.0 - c) * (1.0 - clamp(leak, 0.0, 1.0));

  // Grain.
  float n = filmHash(px + fract(uTime * 13.0) * vec2(91.7, 37.3));
  c += (n - 0.5) * uGrain * 0.06;

  outputColor = vec4(c, inputColor.a);
}
