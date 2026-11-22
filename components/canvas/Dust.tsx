"use client";

import { useMemo } from "react";
import { palette } from "@/lib/palette";
import { CAMERA_START_Z, CHAPTER_SPACING, seededRandom } from "./layout";

type Props = { count: number; chapterCount: number };

// Placeholder particle field along the whole route; its count is the Full/Lite test load.
export default function Dust({ count, chapterCount }: Props) {
  const positions = useMemo(() => {
    const random = seededRandom(137);
    const depth = chapterCount * CHAPTER_SPACING + 20;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (random() - 0.5) * 30;
      array[i * 3 + 1] = (random() - 0.35) * 26;
      array[i * 3 + 2] = CAMERA_START_Z - random() * depth;
    }
    return array;
  }, [count, chapterCount]);

  return (
    <points key={count}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={palette.gold} size={0.06} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}
