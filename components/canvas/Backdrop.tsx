"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Fog } from "three";
import { chapters } from "@/content/chapters";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";

const colours = chapters.map((c) => new Color(palette[c.background]));

/** How far into a chapter the blend to the next chapter's colour starts. */
const BLEND_START = 0.75;

// Scene background + matching fog: each chapter holds its colour, then blends into the
// next over its last quarter (placeholder colours). Fog hides shapes further down the route.
export default function Backdrop() {
  const background = useRef<Color>(null);
  const fog = useRef<Fog>(null);

  useFrame(() => {
    if (!background.current) return;
    const last = colours.length - 1;
    const chapter = Math.min(last, Math.floor(journey.position));
    const local = journey.position - chapter;
    const t = chapter < last ? Math.min(1, Math.max(0, (local - BLEND_START) / (1 - BLEND_START))) : 0;
    const eased = t * t * (3 - 2 * t);
    background.current.lerpColors(colours[chapter], colours[Math.min(chapter + 1, last)], eased);
    fog.current?.color.copy(background.current);
  });

  return (
    <>
      <color ref={background} attach="background" args={[palette.ink]} />
      <fog ref={fog} attach="fog" args={[palette.ink, 6, 30]} />
    </>
  );
}
