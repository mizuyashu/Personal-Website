"use client";

import { useEffect, useRef } from "react";
import { CORRIDOR } from "@/lib/corridor";
import { smoothstep } from "@/lib/intro";
import { onJourneyPosition } from "@/lib/scroll";
import styles from "./BlueprintHud.module.css";

const START = 1 + CORRIDOR.riseEnd - 0.02;
const END = 1 + CORRIDOR.exitStart;

// Drafting-sheet chrome over the blueprint (chapter II hold): plate label, live coordinates
// from the scroll, a scale bar and registration marks in the corners. Decorative.
export default function BlueprintHud() {
  const root = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      onJourneyPosition((p) => {
        const el = root.current;
        if (!el) return;
        const shown = smoothstep(START, START + 0.03, p) * (1 - smoothstep(END - 0.03, END, p));
        el.style.opacity = shown.toFixed(3);
        el.style.visibility = shown > 0 ? "visible" : "hidden";
        if (shown > 0 && coords.current) {
          const y = ((p - START) / (END - START)) * 1000;
          coords.current.textContent = `X 000.000  Y ${y.toFixed(3).padStart(7, "0")}  SCALE 1:1`;
        }
      }),
    [],
  );

  return (
    <div ref={root} className={styles.hud} aria-hidden>
      {["tl", "tr", "bl", "br"].map((corner) => (
        <span key={corner} className={`${styles.mark} ${styles[corner]}`} />
      ))}
      <span className={styles.plate}>Plate II · The Blueprint</span>
      <div className={styles.readout}>
        <span ref={coords}>X 000.000  Y 0000.000  SCALE 1:1</span>
        <span className={styles.scale}>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className={styles.scaleLabels}>
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4 m</span>
        </span>
      </div>
    </div>
  );
}
