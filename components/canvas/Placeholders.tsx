"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { chapters } from "@/content/chapters";
import { palette } from "@/lib/palette";
import { CHAPTER_SPACING, cameraZ } from "./layout";

// M1 stand-ins, one per chapter, replaced by the real scenes in M2–M7.
// Each sits ahead of where the camera is at the chapter's midpoint, off to one side.
const shapes = [
  <icosahedronGeometry key="intro" args={[1.6, 0]} />,
  <boxGeometry key="projects" args={[2.4, 2.4, 2.4]} />,
  <octahedronGeometry key="education" args={[1.8, 0]} />,
  <torusGeometry key="about" args={[1.4, 0.45, 16, 48]} />,
  <coneGeometry key="contact" args={[1.4, 2.6, 8]} />,
];

type Props = { reducedMotion: boolean };

export default function Placeholders({ reducedMotion }: Props) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (reducedMotion || !group.current) return;
    for (const child of group.current.children) {
      child.rotation.x += delta * 0.2;
      child.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={group}>
      {chapters.map((chapter, i) => (
        <mesh
          key={chapter.id}
          position={[i % 2 === 0 ? -3 : 3, i % 2 === 0 ? 0.6 : -0.6, cameraZ(i + 0.5) - CHAPTER_SPACING * 0.4]}
        >
          {shapes[i]}
          <meshStandardMaterial
            color={palette[chapter.accent]}
            wireframe={chapter.id === "projects"}
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
