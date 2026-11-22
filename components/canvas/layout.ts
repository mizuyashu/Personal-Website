import { CORRIDOR } from "@/lib/corridor";
import { smoothstep } from "@/lib/intro";

// Shared layout of the 3D journey: the camera dollies down -Z, one stretch per chapter,
// except chapter II, which walks the corridor, looks up, rises into the skylight and through it.
export const CAMERA_START_Z = 10;
export const CHAPTER_SPACING = 20;

/** Camera z for a journey position on the straight route (0 → chapter count). */
export function cameraZ(position: number) {
  return CAMERA_START_Z - position * CHAPTER_SPACING;
}

// Cathedral corridor (chapter II), in world units. Eye level is y = 0.
export const FLOOR_Y = -1.6;
export const CEILING_Y = 4.8;
export const CROSSING_Z = -27; // under the skylight
export const SKYLIGHT_SIZE = 6;
export const RISE_Y = 2.6; // how high the camera rises toward the skylight
export const SKY_Y = 8; // above the roof: chapters III–V fly at this height

export type CameraPose = { z: number; y: number; pitch: number };

/** Where the camera is, and how far it looks up, at a journey position. */
export function cameraPose(position: number, chapterCount: number): CameraPose {
  // Rest at the last chapter's midpoint so the closing scene stays in frame.
  const p = Math.min(position, chapterCount - 0.5);
  if (p < 1) return { z: cameraZ(p), y: 0, pitch: 0 };
  if (p >= 2) return { z: cameraZ(p), y: SKY_Y, pitch: 0 };

  const u = p - 1;
  const walk = smoothstep(0, CORRIDOR.walkEnd, u);
  const tilt = smoothstep(CORRIDOR.walkEnd, CORRIDOR.tiltEnd, u);
  const rise = smoothstep(CORRIDOR.tiltEnd, CORRIDOR.riseEnd, u);
  // Exit: keep rising through the skylight; once above the roof, level out toward the horizon.
  const exitRise = smoothstep(CORRIDOR.exitStart, 1, u);
  const level = smoothstep(CORRIDOR.exitStart + (1 - CORRIDOR.exitStart) * 0.5, 1, u);
  const walked = cameraZ(1) + (CROSSING_Z - cameraZ(1)) * walk;
  return {
    z: walked + (cameraZ(2) - walked) * level,
    y: rise * RISE_Y + (SKY_Y - RISE_Y) * exitRise,
    pitch: (tilt - level) * (Math.PI / 2),
  };
}

/** Still key frame per chapter for reduced motion (progress through each chapter). */
export const KEY_FRAMES = [0.6, 0.72, 0.5, 0.5, 0.5];

/** Small seeded random generator, so generated geometry is the same every render. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
