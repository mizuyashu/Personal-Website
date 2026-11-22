"use client";

import { useFrame } from "@react-three/fiber";
import { Euler, MathUtils, Matrix4, Quaternion, Vector3, type PerspectiveCamera } from "three";
import { journey } from "@/lib/scroll";
import { BLUEPRINT_CENTRE, KEY_FRAMES, cameraPose, type CameraPose } from "./layout";

type Props = { chapterCount: number; reducedMotion: boolean };

const BASE_FOV = 50;
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

/** Orientation for a pose: pitched up, or aimed back at the blueprint during a pull-off. */
function orientation(pose: CameraPose, out: Quaternion) {
  if (pose.aim) return out.setFromRotationMatrix(aimMatrix.lookAt(eye.set(pose.x, pose.y, pose.z), centre, AIM_UP));
  return out.setFromEuler(euler.set(pose.pitch, 0, 0));
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
      camera.position.set(pose.x, pose.y, pose.z);
      orientation(pose, camera.quaternion);
      return;
    }
    const pose = cameraPose(journey.position, chapterCount);
    camera.position.x = MathUtils.damp(camera.position.x, pose.x, 6, delta);
    camera.position.y = MathUtils.damp(camera.position.y, pose.y, 6, delta);
    camera.position.z = MathUtils.damp(camera.position.z, pose.z, 6, delta);
    camera.quaternion.slerp(orientation(pose, target), 1 - Math.exp(-6 * delta));
  });
  return null;
}
