"use client";

import { useEffect, useRef } from "react";
import { INTRO, smoothstep } from "@/lib/intro";
import { onJourneyPosition } from "@/lib/scroll";
import styles from "./VoidVeil.module.css";

// Chapter I, the void (docs/vision.md §17): a heavy vignette that crushes the edges to black,
// and film grain, over the canvas. It lifts as the fire catches and is gone by the flash.
export default function VoidVeil() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onJourneyPosition((p) => {
        const el = root.current;
        if (!el) return;
        const shown = 1 - smoothstep(INTRO.voidEnd - 0.06, INTRO.flashPeak, p);
        el.style.opacity = shown.toFixed(3);
        el.style.visibility = shown > 0 ? "visible" : "hidden";
      }),
    [],
  );

  return (
    <div ref={root} className={styles.veil} aria-hidden>
      <div className={styles.grain} />
    </div>
  );
}
