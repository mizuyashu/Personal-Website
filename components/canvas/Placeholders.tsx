"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { chapters } from "@/content/chapters";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import { CHAPTER_SPACING, SKY_Y, cameraZ } from "./layout";

// M1 stand-ins for chapters that don't have their real scene yet (Education → Contact).
// Each sits ahead of where the camera is at the chapter's midpoint, off to one side.
const shapes: Record<string, ReactNode> = {
  education: <octahedronGeometry args={[1.8, 0]} />,
  about: <torusGeometry args={[1.4, 0.45, 16, 48]} />,
  contact: <coneGeometry args={[1.4, 2.6, 8]} />,
};

const shapeChapters = chapters.flatMap((c, i) => (shapes[c.id] ? [i] : []));

type Props = { reducedMotion: boolean };

export default function Placeholders({ reducedMotion }: Props) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Each shows only as its chapter nears (keeps them out of the intro and the corridor).
    group.current.children.forEach((child, i) => {
      child.visible = journey.position > (shapeChapters[i] ?? 0) - 0.4;
    });
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
            position={[i % 2 === 0 ? -3 : 3, SKY_Y + (i % 2 === 0 ? 0.6 : -0.6), cameraZ(i + 0.5) - CHAPTER_SPACING * 0.4]}
          >
            {shapes[chapter.id]}
            <meshStandardMaterial
              color={palette[chapter.accent]}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
        ) : null,
      )}
    </group>
  );
}
