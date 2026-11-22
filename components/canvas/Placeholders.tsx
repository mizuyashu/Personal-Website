"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { chapters } from "@/content/chapters";
import { INTRO } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import { CHAPTER_SPACING, cameraZ } from "./layout";

// M1 stand-ins for chapters that don't have their real scene yet (Projects → Contact).
// Each sits ahead of where the camera is at the chapter's midpoint, off to one side.
const shapes: Record<string, ReactNode> = {
  projects: <boxGeometry args={[2.4, 2.4, 2.4]} />,
  education: <octahedronGeometry args={[1.8, 0]} />,
  about: <torusGeometry args={[1.4, 0.45, 16, 48]} />,
  contact: <coneGeometry args={[1.4, 2.6, 8]} />,
};

type Props = { reducedMotion: boolean };

export default function Placeholders({ reducedMotion }: Props) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Keep them out of the intro's name scene.
    group.current.visible = journey.position > INTRO.fadeOutStart;
    if (reducedMotion) return;
    for (const child of group.current.children) {
      child.rotation.x += delta * 0.2;
      child.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={group}>
      {chapters.map((chapter, i) =>
        shapes[chapter.id] ? (
          <mesh
            key={chapter.id}
            position={[i % 2 === 0 ? -3 : 3, i % 2 === 0 ? 0.6 : -0.6, cameraZ(i + 0.5) - CHAPTER_SPACING * 0.4]}
          >
            {shapes[chapter.id]}
            <meshStandardMaterial
              color={palette[chapter.accent]}
              wireframe={chapter.id === "projects"}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
        ) : null,
      )}
    </group>
  );
}
