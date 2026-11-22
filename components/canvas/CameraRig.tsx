"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, type PerspectiveCamera } from "three";
import { journey } from "@/lib/scroll";
import { KEY_FRAMES, cameraPose } from "./layout";

type Props = { chapterCount: number; reducedMotion: boolean };

const BASE_FOV = 50;
const MAX_FOV = 80;

/** Vertical field of view: 50° on landscape; wider on portrait so the sides of scenes stay in frame. */
function fovFor(aspect: number) {
  if (aspect >= 1) return BASE_FOV;
  const halfWidth = Math.tan(MathUtils.degToRad(BASE_FOV / 2)) * 0.95; // keep ~95% of the landscape width
  return Math.min(MAX_FOV, MathUtils.radToDeg(2 * Math.atan(halfWidth / aspect)));
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
      camera.position.set(0, pose.y, pose.z);
      camera.rotation.set(pose.pitch, 0, 0);
      return;
    }
    const pose = cameraPose(journey.position, chapterCount);
    camera.position.z = MathUtils.damp(camera.position.z, pose.z, 6, delta);
    camera.position.y = MathUtils.damp(camera.position.y, pose.y, 6, delta);
    camera.rotation.x = MathUtils.damp(camera.rotation.x, pose.pitch, 6, delta);
  });
  return null;
}
