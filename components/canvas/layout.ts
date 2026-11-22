import { CORRIDOR, projectReveal } from "@/lib/corridor";
import { INTRO, clamp01, smoothstep } from "@/lib/intro";

// Shared layout of the 3D journey: the camera dollies down -Z, one stretch per chapter,
// except chapter II, which walks the nave, looks up at the crossing, rides the lift up the
// lantern tower into the skylight, and rises through it.
export const CAMERA_START_Z = 10;
export const CHAPTER_SPACING = 20;

/** Camera z for a journey position on the straight route (0 → chapter count). */
export function cameraZ(position: number) {
  return CAMERA_START_Z - position * CHAPTER_SPACING;
}

// Cathedral (chapter II), in world units. Eye level is y = 0.
export const FLOOR_Y = -1.6;
/** Where the nave's barrel vault springs from the colonnade (its crown is NAVE_HALF higher). */
export const VAULT_Y = 7.4;
/** Half-width of the nave (colonnade line) and of the lantern tower above the crossing. */
export const NAVE_HALF = 4;
export const CROSSING_Z = -27; // under the tower
/** The skylight is the whole top of the tower: overwhelmingly high, like flying at the sun. */
export const SKYLIGHT_SIZE = NAVE_HALF * 2;
export const SKYLIGHT_Y = 110;
export const RISE_Y = SKYLIGHT_Y - 2.2; // the lift stops here, the skylight filling the view
export const SKY_Y = SKYLIGHT_Y + 3.2; // above the roof: chapters III–V fly at this height
/** Camera pitch while standing on the lift, before it turns to look straight up. */
const LIFT_PITCH = 1.15;
/** How far the lift heaves during its slow start, before it surges. */
const CREEP_Y = 0.7;

/**
 * Camera pose. Normally the camera faces `yaw` (radians, + turns left) tilted up by `pitch`.
 * When `aim` is set it looks at the centre of the blueprint instead (the pull-offs to the side
 * before each project).
 */
export type CameraPose = { x: number; y: number; z: number; pitch: number; yaw: number; aim: boolean };

/**
 * Where chapter II begins: back left in the nave, a little behind the first portal, facing about
 * 20° to the right, gazing slightly up so the numeral II can be read before the walk.
 */
const ENTRY = { x: -3, z: -6, yaw: -0.35, gaze: 0.2 };

/** Centre of the blueprint (the skylight plate): what the camera looks back at during a pull-off. */
export const BLUEPRINT_CENTRE = [0, SKYLIGHT_Y, CROSSING_Z] as const;

/** How far the camera swings out for a pull-off: to the side, down, and back. */
const PULL = { side: 2.8, drop: 2.6, back: 1.4 };

/** Lift height (0 → RISE_Y) at chapter II progress `u`: slow heavy creep, then a surge that eases into the top. */
export function liftHeight(u: number) {
  if (u <= CORRIDOR.tiltEnd) return 0;
  if (u < CORRIDOR.liftSurge) return CREEP_Y * smoothstep(CORRIDOR.tiltEnd, CORRIDOR.liftSurge, u);
  const s = clamp01((u - CORRIDOR.liftSurge) / (CORRIDOR.arrive - CORRIDOR.liftSurge));
  // Accelerates for most of the way (s^1.6 front-loads the slowness), soft stop at the top.
  const surge = 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(s, 1.6));
  return CREEP_Y + (RISE_Y - CREEP_Y) * surge;
}

/** Where the camera is, and how far it looks up, at a journey position. */
export function cameraPose(position: number, chapterCount: number): CameraPose {
  // Rest at the last chapter's midpoint so the closing scene stays in frame.
  const p = Math.min(position, chapterCount - 0.5);
  if (p < 1) {
    // As the name fades, ease back and to the left into the entry pose (a slight pull back).
    const e = smoothstep(INTRO.fadeOutStart, 1, p);
    return {
      x: ENTRY.x * e,
      z: cameraZ(p) + (ENTRY.z - cameraZ(1)) * e,
      y: 0,
      pitch: ENTRY.gaze * e,
      yaw: ENTRY.yaw * e,
      aim: false,
    };
  }
  if (p >= 2) return { x: 0, z: cameraZ(p), y: SKY_Y, pitch: 0, yaw: 0, aim: false };

  const u = p - 1;
  // Hold at the entry (read II), then walk on a diagonal from back left to the crossing,
  // facing ~20° right, turning to face straight down the nave only near the end.
  const walk = smoothstep(CORRIDOR.entryHold, CORRIDOR.walkEnd, u);
  const square = smoothstep(0.6, 1, walk);
  const gaze = ENTRY.gaze * (1 - walk) + 0.16 * walk;
  const tilt = smoothstep(CORRIDOR.walkEnd, CORRIDOR.tiltEnd, u);
  // Straighten to look directly up as the lift nears the top.
  const straighten = smoothstep(CORRIDOR.liftSurge + (CORRIDOR.arrive - CORRIDOR.liftSurge) * 0.4, CORRIDOR.arrive, u);
  // Exit: keep rising through the skylight; once above the roof, level out toward the horizon.
  const exitRise = smoothstep(CORRIDOR.exitStart, 1, u);
  const level = smoothstep(CORRIDOR.exitStart + (1 - CORRIDOR.exitStart) * 0.5, 1, u);
  const walked = ENTRY.z + (CROSSING_Z - ENTRY.z) * walk;
  const standing = gaze + (LIFT_PITCH - gaze) * tilt;
  const lookUp = standing + (Math.PI / 2 - standing) * straighten;
  // Before each project, swing off to the side (alternating) and look back at the blueprint
  // at an angle: an isometric-style view of the plate, then settle flat as the project arrives.
  const reveal = projectReveal(u);
  const side = reveal.index % 2 === 0 ? 1 : -1;
  return {
    x: ENTRY.x * (1 - walk) + side * PULL.side * reveal.amount,
    z: walked + (cameraZ(2) - walked) * level + PULL.back * reveal.amount,
    y: liftHeight(u) + (SKY_Y - RISE_Y) * exitRise - PULL.drop * reveal.amount,
    pitch: lookUp * (1 - level),
    yaw: ENTRY.yaw * (1 - square),
    aim: reveal.amount > 0,
  };
}

/** Still key frame per chapter for reduced motion (progress through each chapter). */
// Chapter II holds the flat blueprint, before the first project reveal.
export const KEY_FRAMES = [0.6, 0.5, 0.5, 0.5, 0.5];

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
