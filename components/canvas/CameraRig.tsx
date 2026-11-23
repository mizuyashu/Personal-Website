"use client";

import { useFrame } from "@react-three/fiber";
import { Euler, MathUtils, Matrix4, Quaternion, Vector3, type PerspectiveCamera } from "three";
import { journey } from "@/lib/scroll";
import { view } from "@/lib/view";
import { roam, stepRoam } from "@/lib/roam";
import { BLUEPRINT_CENTRE, KEY_FRAMES, SUBPAGE_SPACE, cameraPose, type CameraPose } from "./layout";

type Props = { chapterCount: number; reducedMotion: boolean };

const BASE_FOV = 50;
/** A pose this far from the camera is a cut (a scene change), not something to glide to. */
const CUT_DISTANCE = 6;
const MAX_FOV = 80;

/** Vertical field of view: 50° on landscape; wider on portrait so the sides of scenes stay in frame. */
function fovFor(aspect: number) {
  if (aspect >= 1) return BASE_FOV;
  const halfWidth = Math.tan(MathUtils.degToRad(BASE_FOV / 2)) * 0.95; // keep ~95% of the landscape width
  return Math.min(MAX_FOV, MathUtils.radToDeg(2 * Math.atan(halfWidth / aspect)));
}

const eye = new Vector3();
const centre = new Vector3(...BLUEPRINT_CENTRE);
// Looking straight up at the blueprint, the top of the screen points toward +Z, the same as the
// plain pitch-up pose, so aiming and pitching agree when the pull-off is at rest.
const AIM_UP = new Vector3(0, 0, 1);
const aimMatrix = new Matrix4();
const euler = new Euler();
const target = new Quaternion();
const journeyEye = new Vector3();
const journeyLook = new Quaternion();
const spaceEye = new Vector3(0, SUBPAGE_SPACE.y, SUBPAGE_SPACE.eye);
const spaceLook = new Quaternion();

/**
 * A sub-page is open (or opening/closing): fly between the journey pose and the sub-page space.
 * The flight rises in an arc high through the sky and turns to face the space on the way.
 */
function flySubpage(camera: PerspectiveCamera, pose: CameraPose) {
  const t = view.t;
  journeyEye.set(pose.x, pose.y, pose.z);
  orientation(pose, journeyLook);
  camera.position.lerpVectors(journeyEye, spaceEye, t);
  camera.position.y += Math.sin(Math.PI * t) * 28;
  camera.position.x += Math.sin(Math.PI * t) * 6;
  const turn = Math.min(1, Math.max(0, (t - 0.1) / 0.8));
  camera.quaternion.slerpQuaternions(journeyLook, spaceLook, turn * turn * (3 - 2 * turn));
}

const roamLook = new Quaternion();
const roamEuler = new Euler();
const guidedEye = new Vector3();
const guidedLook = new Quaternion();

/** Free roam (lib/roam.ts): walk, then blend between the guided pose and the walker's eyes. */
function roamCamera(camera: PerspectiveCamera, pose: CameraPose, delta: number) {
  if (roam.active) stepRoam(delta);
  guidedEye.set(pose.x, pose.y, pose.z);
  orientation(pose, guidedLook);
  roamLook.setFromEuler(roamEuler.set(roam.pitch, roam.yaw, 0, "YXZ"));
  camera.position.lerpVectors(guidedEye, eye.set(roam.x, 0, roam.z), roam.t);
  camera.quaternion.slerpQuaternions(guidedLook, roamLook, roam.t);
}

/** Orientation for a pose: pitched up, or aimed back at the blueprint during a pull-off. */
function orientation(pose: CameraPose, out: Quaternion) {
  if (pose.aim) return out.setFromRotationMatrix(aimMatrix.lookAt(eye.set(pose.x, pose.y, pose.z), centre, AIM_UP));
  // YXZ: turn to the heading first, then tilt up.
  return out.setFromEuler(euler.set(pose.pitch, pose.yaw, 0, "YXZ"));
}

// Reads the master scroll position and moves the camera. Never creates its own ScrollTrigger.
export default function CameraRig({ chapterCount, reducedMotion }: Props) {
  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const fov = fovFor(state.size.width / state.size.height);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    if (reducedMotion) {
      // Still key frame per chapter, no travel between.
      const chapter = Math.min(chapterCount - 1, Math.floor(journey.position));
      const pose = cameraPose(chapter + (KEY_FRAMES[chapter] ?? 0.5), chapterCount);
      if (view.t > 0) return flySubpage(camera, pose);
      if (roam.t > 0 || roam.active) return roamCamera(camera, pose, delta);
      camera.position.set(pose.x, pose.y, pose.z);
      orientation(pose, camera.quaternion);
      return;
    }
    const pose = cameraPose(journey.position, chapterCount);
    if (view.t > 0) return flySubpage(camera, pose);
    if (roam.t > 0 || roam.active) return roamCamera(camera, pose, delta);
    // A cut, not a glide, when the pose jumps (entering the cathedral at the start of chapter II).
    const jump = Math.hypot(pose.x - camera.position.x, pose.y - camera.position.y, pose.z - camera.position.z);
    if (jump > CUT_DISTANCE) {
      camera.position.set(pose.x, pose.y, pose.z);
      orientation(pose, camera.quaternion);
      return;
    }
    camera.position.x = MathUtils.damp(camera.position.x, pose.x, 6, delta);
    camera.position.y = MathUtils.damp(camera.position.y, pose.y, 6, delta);
    camera.position.z = MathUtils.damp(camera.position.z, pose.z, 6, delta);
    camera.quaternion.slerp(orientation(pose, target), 1 - Math.exp(-6 * delta));
  });
  return null;
}
