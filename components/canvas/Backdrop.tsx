"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Fog } from "three";
import { chapters } from "@/content/chapters";
import { CORRIDOR } from "@/lib/corridor";
import { INTRO, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";

const grounds = chapters.map((c) => new Color(palette[c.background]));
// The void: ink, a touch colder (navy) — no warmth until the kindling.
const VOID = new Color(palette.ink).lerp(new Color(palette.navy), 0.12);
const CATHEDRAL = new Color(palette.lavender);

/** Where in each chapter the blend into the next chapter's ground starts. */
const BLEND_START = [INTRO.fadeOutStart, CORRIDOR.exitStart, 0.92, 0.9, 0.75];

const scratch = new Color();

/** Ground colour inside one chapter, before blending to the next. */
function groundIn(chapter: number, local: number, out: Color) {
  if (chapter === 0 && local < INTRO.flashPeak) return out.copy(VOID); // the void until the flash
  if (chapter === 1) {
    // Lavender cathedral, brightening to the blueprint's ivory as the lift arrives at the skylight.
    return out.lerpColors(CATHEDRAL, grounds[1], smoothstep(CORRIDOR.liftSurge, CORRIDOR.riseEnd, local));
  }
  return out.copy(grounds[chapter]);
}

// Scene background + matching fog. Each chapter holds its ground, then blends into the
// next chapter's opening ground at the end. Fog hides what's further down the route.
export default function Backdrop() {
  const background = useRef<Color>(null);
  const fog = useRef<Fog>(null);

  useFrame(() => {
    if (!background.current) return;
    const last = grounds.length - 1;
    const chapter = Math.min(last, Math.floor(journey.position));
    const local = journey.position - chapter;
    groundIn(chapter, local, background.current);
    if (chapter < last) {
      const t = smoothstep(BLEND_START[chapter] ?? 0.75, 1, local);
      if (t > 0) background.current.lerp(groundIn(chapter + 1, 0, scratch), t);
    }
    if (fog.current) {
      fog.current.color.copy(background.current);
      // Denser haze inside the cathedral (chapter II before the rise), open air elsewhere.
      const haze = chapter === 1 ? 1 - smoothstep(CORRIDOR.liftSurge, CORRIDOR.riseEnd, local) : 0;
      fog.current.near = 6 - haze * 3;
      fog.current.far = 30 - haze * 8;
    }
  });

  return (
    <>
      <color ref={background} attach="background" args={[palette.ink]} />
      <fog ref={fog} attach="fog" args={[palette.ink, 6, 30]} />
    </>
  );
}
