"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Fog } from "three";
import { chapters } from "@/content/chapters";
import { CORRIDOR } from "@/lib/corridor";
import { INTRO, smoothstep } from "@/lib/intro";
import { palette } from "@/lib/palette";
import { journey } from "@/lib/scroll";
import { view } from "@/lib/view";

const grounds = chapters.map((c) => new Color(palette[c.background]));
// The void: ink, a touch colder (navy) — no warmth until the kindling.
const VOID = new Color(palette.ink).lerp(new Color(palette.navy), 0.12);
const CATHEDRAL = new Color(palette.lavender);

/** Where in each chapter the blend into the next chapter's ground starts. */
const BLEND_START = [INTRO.fadeOutStart, CORRIDOR.exitStart, 0.92, 0.9, 0.75];

const scratch = new Color();
/** The sub-page space's ground: the blueprint's ivory for projects, the dawn sky for years. */
const SPACE_GROUND = {
  project: new Color(palette.ivory),
  year: new Color(palette.sky).lerp(new Color(palette.ivory), 0.35),
  // About pages stay in the embers: near-black with a crimson-violet warmth.
  about: new Color(palette.ink).lerp(new Color(palette.crimsonViolet), 0.3),
};

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
    // A sub-page is open (or the camera is flying there): blend into its space; open the fog.
    if (view.t > 0 && view.current) {
      background.current.lerp(SPACE_GROUND[view.current.kind], view.t);
      if (fog.current) {
        fog.current.color.copy(background.current);
        fog.current.near += (40 - fog.current.near) * view.t;
        fog.current.far += (260 - fog.current.far) * view.t;
      }
    }
  });

  return (
    <>
      <color ref={background} attach="background" args={[palette.ink]} />
      <fog ref={fog} attach="fog" args={[palette.ink, 6, 30]} />
    </>
  );
}
