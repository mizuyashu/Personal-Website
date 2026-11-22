// Broken constellation lines between dying stars: some segments dashed (cracked), and each
// one drops out and comes back on its own irregular rhythm.
uniform float uTime;

attribute float aSeed;
attribute float aAlong; // 0 at one end of the segment, 1 at the other

varying float vAlong;
varying float vAlpha;
varying float vDashed;

void main() {
  vAlong = aAlong;
  vDashed = step(0.55, aSeed);
  // On most of the time; out for a while now and then.
  float cycle = sin(uTime * (0.15 + aSeed * 0.35) + aSeed * 70.0);
  vAlpha = (1.0 - smoothstep(0.55, 0.9, cycle)) * (0.55 + 0.45 * sin(uTime * (1.3 + aSeed * 2.0) + aSeed * 11.0));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
