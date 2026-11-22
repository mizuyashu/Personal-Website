"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, type Points } from "three";
import { INTRO } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import { CAMERA_START_Z, CHAPTER_SPACING, SKY_Y, cameraZ, seededRandom } from "./layout";

type Props = { count: number; chapterCount: number };

/** Soft round dot, so the dust reads as specks of light rather than square pixels. */
function makeDot() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new CanvasTexture(canvas);
}

// Gold dust along the whole route; its count is also the Full/Lite test load.
// Hidden in the void (which has its own sparse embers) until the flash.
export default function Dust({ count, chapterCount }: Props) {
  const points = useRef<Points>(null);
  const dot = useMemo(() => makeDot(), []);
  useEffect(() => () => dot.dispose(), [dot]);

  const positions = useMemo(() => {
    const random = seededRandom(137);
    const depth = chapterCount * CHAPTER_SPACING + 20;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (random() - 0.5) * 30;
      const z = CAMERA_START_Z - random() * depth;
      // Chapters III–V fly high above the cathedral: their dust sits up there with them.
      array[i * 3 + 1] = (random() - 0.35) * 26 + (z < cameraZ(1.95) ? SKY_Y : 0);
      array[i * 3 + 2] = z;
    }
    return array;
  }, [count, chapterCount]);

  useFrame(() => {
    if (points.current) points.current.visible = journey.position >= INTRO.flashPeak;
  });

  return (
    <points ref={points} key={count} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dot} alphaTest={0.01} color={palette.gold} size={0.09} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
    </points>
  );
}
