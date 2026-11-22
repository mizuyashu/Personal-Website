// Lantern tower walls: pass the world height so the pattern lines up across all four walls.
varying vec2 vUv;
varying float vY;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vY = world.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
