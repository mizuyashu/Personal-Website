"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { journey } from "@/lib/scroll";
import { cameraZ } from "./layout";

type Props = { chapterCount: number; reducedMotion: boolean };

// Reads the master scroll position and moves the camera. Never creates its own ScrollTrigger.
export default function CameraRig({ chapterCount, reducedMotion }: Props) {
  useFrame((state, delta) => {
    if (reducedMotion) {
      // Still key frame per chapter: hold the chapter's midpoint, no travel between.
      const chapter = Math.min(chapterCount - 1, Math.floor(journey.position));
      state.camera.position.z = cameraZ(chapter + 0.5);
      return;
    }
    // Rest at the last chapter's midpoint so the closing scene stays in frame.
    const target = cameraZ(Math.min(journey.position, chapterCount - 0.5));
    state.camera.position.z = MathUtils.damp(state.camera.position.z, target, 6, delta);
  });
  return null;
}
