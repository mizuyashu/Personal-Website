// Shared layout of the 3D journey: the camera dollies down -Z, one stretch per chapter.
export const CAMERA_START_Z = 10;
export const CHAPTER_SPACING = 20;

/** Camera z for a journey position (0 → chapter count). */
export function cameraZ(position: number) {
  return CAMERA_START_Z - position * CHAPTER_SPACING;
}

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
