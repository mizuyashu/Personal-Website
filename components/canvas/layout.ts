import { CORRIDOR, projectReveal } from "@/lib/corridor";
import { clamp01, smoothstep } from "@/lib/intro";

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
export const CROSSING_Z = -27; // under the tower, the centre of the rotunda
/** The rotunda at the crossing (docs/vision.md §19): a big round hall with a gallery above. */
export const ROTUNDA_R = 10;
export const ROTUNDA_TOP = 16;
/** Where the nave opens into the rotunda. */
export const ROTUNDA_ENTRANCE_Z = CROSSING_Z + ROTUNDA_R;
/**
 * The narthex: the passage in front of the nave that you walk along before turning left into
 * it (scenes/Narthex.tsx). It runs along x; its front wall (z = front) opens onto the nave.
 */
export const NARTHEX = { left: -28, right: 6.8, front: -3, back: 1.8, spring: 5, bay: 4 };
/**
 * The sub-page space (docs/vision.md §18): where the camera flies when a project page or an
 * education year opens. High above everything, so the journey's scenes are far below.
 */
export const SUBPAGE_SPACE = { y: 260, eye: 14 };
/** The great lift: massive, as if giants once used it. */
export const LIFT_R = 3.6;
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
const ENTRY = { x: -23, z: -0.6, yaw: -Math.PI / 2, gaze: 0.1 };
/** Where the corner has been rounded: in the nave, facing down it, II just ahead. */
const CORNER = { x: -1.6, z: -1.2, gaze: 0.2 };

/** Centre of the blueprint (the skylight plate): what the camera looks back at during a pull-off. */
export const BLUEPRINT_CENTRE = [0, SKYLIGHT_Y, CROSSING_Z] as const;

/**
 * Where the cathedral appears (just before chapter II begins, as the name has faded): from here
 * the camera stands at the entry. Scenes in the cathedral use it for their visibility.
 */
export const CATHEDRAL_START = 0.985;

/** How far the camera swings out for a pull-off: to the side, down, and back. */
const PULL = { side: 2.8, drop: 2.6, back: 1.4 };

/** Base path for chapters III–V: their scenes follow this (not the camera), so the camera's
 * side and depth moves below show real parallax. */
export function basePath(position: number, chapterCount: number) {
  return { y: SKY_Y, z: cameraZ(Math.min(position, chapterCount - 0.5)) };
}

/** Rise and fall across [a, b]: eases in over the first 40%, out over the last 30%. */
function bump(t: number, a: number, b: number) {
  return smoothstep(a, a + (b - a) * 0.4, t) * (1 - smoothstep(b - (b - a) * 0.3, b, t));
}

/**
 * Chapters III–V: the dolly, plus moves in the language of the project pull-offs (swing out,
 * look back at the subject, settle): III pulls off to the right and down, looking back at the
 * low sun while the constellation draws; IV tracks slowly sideways through the embers; V swings
 * round the bonfire during the contact beat and settles before the golden flash.
 */
function skyPose(p: number): CameraPose {
  const chapter = Math.floor(p);
  const local = p - chapter;
  const pose: CameraPose = { x: 0, y: SKY_Y, z: cameraZ(p), pitch: 0, yaw: 0, aim: false };
  if (chapter === 2) {
    const b = bump(local, 0.16, 0.76);
    pose.x = 3.2 * b;
    pose.y -= 1.1 * b;
    pose.yaw = 0.17 * b;
    pose.pitch = -0.05 * b;
  } else if (chapter === 3) {
    const t = smoothstep(0.2, 0.96, local);
    const w = Math.sin(t * Math.PI * 1.5) * bump(local, 0.18, 0.98);
    pose.x = 2.6 * w;
    pose.yaw = -0.08 * w;
    pose.y -= 0.6 * Math.sin(t * Math.PI);
  } else if (chapter >= 4) {
    // Round the fire: the fire stands FIRE_DISTANCE ahead; the camera orbits it, always facing it.
    const s = clamp01((local - 0.06) / 0.42);
    const theta = 0.32 * Math.sin(2 * Math.PI * s) * bump(local, 0.04, 0.5);
    pose.x = Math.sin(theta) * FIRE_DISTANCE;
    pose.z += (1 - Math.cos(theta)) * FIRE_DISTANCE;
    pose.yaw = theta;
  }
  return pose;
}

/** How far ahead of the camera's base path the bonfire stands (scenes/Bonfire.tsx). */
export const FIRE_DISTANCE = 10;

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
  // Chapter I stays on its straight path while the name fades. At CATHEDRAL_START the cathedral
  // appears and the camera is placed at the entry directly (the rig cuts, no glide), so it never
  // shows the nave from the old path first.
  if (p < CATHEDRAL_START) return { x: 0, z: cameraZ(p), y: 0, pitch: 0, yaw: 0, aim: false };
  if (p >= 2) return skyPose(p);

  const u = Math.max(0, p - 1);
  // Round the corner: along the narthex, then turn left into the nave, which opens up all at
  // once. Hold there (read II just ahead), then walk down the nave to the lift.
  const along = smoothstep(0, CORRIDOR.cornerEnd, u);
  const turn = smoothstep(CORRIDOR.cornerEnd * 0.35, CORRIDOR.cornerEnd, u);
  const walk = smoothstep(CORRIDOR.entryHold, CORRIDOR.walkEnd, u);
  const gaze = ENTRY.gaze + (CORNER.gaze - ENTRY.gaze) * turn + (0.16 - CORNER.gaze) * walk;
  const tilt = smoothstep(CORRIDOR.walkEnd, CORRIDOR.tiltEnd, u);
  // Straighten to look directly up as the lift nears the top.
  const straighten = smoothstep(CORRIDOR.liftSurge + (CORRIDOR.arrive - CORRIDOR.liftSurge) * 0.4, CORRIDOR.arrive, u);
  // Exit: keep rising through the skylight; once above the roof, level out toward the horizon.
  const exitRise = smoothstep(CORRIDOR.exitStart, 1, u);
  const level = smoothstep(CORRIDOR.exitStart + (1 - CORRIDOR.exitStart) * 0.5, 1, u);
  const cornerX = ENTRY.x + (CORNER.x - ENTRY.x) * along;
  const cornerZ = ENTRY.z + (CORNER.z - ENTRY.z) * turn;
  const walked = cornerZ + (CROSSING_Z - cornerZ) * walk;
  const standing = gaze + (LIFT_PITCH - gaze) * tilt;
  const lookUp = standing + (Math.PI / 2 - standing) * straighten;
  // Before each project, swing off to the side (alternating) and look back at the blueprint
  // at an angle: an isometric-style view of the plate, then settle flat as the project arrives.
  const reveal = projectReveal(u);
  const side = reveal.index % 2 === 0 ? 1 : -1;
  return {
    x: cornerX * (1 - walk) + side * PULL.side * reveal.amount,
    z: walked + (cameraZ(2) - walked) * level + PULL.back * reveal.amount,
    y: liftHeight(u) + (SKY_Y - RISE_Y) * exitRise - PULL.drop * reveal.amount,
    pitch: lookUp * (1 - level),
    yaw: ENTRY.yaw * (1 - turn),
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
