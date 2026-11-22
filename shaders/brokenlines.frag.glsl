uniform vec3 uColor;
uniform float uOpacity;

varying float vAlong;
varying float vAlpha;
varying float vDashed;

void main() {
  // Cracked segments: dashes; and every line fades toward its ends.
  float dash = mix(1.0, step(0.45, fract(vAlong * 7.0)), vDashed);
  float ends = smoothstep(0.0, 0.15, vAlong) * smoothstep(1.0, 0.85, vAlong);
  gl_FragColor = vec4(uColor, vAlpha * dash * ends * uOpacity);
  #include <colorspace_fragment>
}
