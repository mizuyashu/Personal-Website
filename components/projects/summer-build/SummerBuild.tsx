"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { projectsCopy } from "@/content/projects";
import { smoothstep } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { onJourneyPosition } from "@/lib/scroll";
import styles from "./SummerBuild.module.css";

const LAYERS = 3;

// Physical build → exploded view that opens as it scrolls through the screen.
// Placeholder plates until the CAD export exists (M4 real version: GLB from CAD, in the canvas).
export default function SummerBuild() {
  const root = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return onJourneyPosition(() => {
      const rect = el.getBoundingClientRect();
      const t = reducedMotion ? 1 : smoothstep(0.95, 0.35, rect.top / window.innerHeight);
      el.style.setProperty("--explode", t.toFixed(3));
    });
  }, [reducedMotion]);

  return (
    <figure ref={root} className={styles.exploded} aria-label={projectsCopy.formatLabels.exploded}>
      <svg viewBox="0 0 300 260" focusable="false" aria-hidden>
        {Array.from({ length: LAYERS }, (_, i) => (
          <g key={i} className={styles.layer} style={{ "--i": i - 1 } as CSSProperties}>
            <polygon points="150,60 260,115 150,170 40,115" className={styles.plate} />
            <line x1="260" y1="115" x2="290" y2="115" className={styles.leader} />
            <text x="292" y="112" className={styles.label} textAnchor="end">
              {`L0${LAYERS - i}`}
            </text>
          </g>
        ))}
        <line x1="150" y1="20" x2="150" y2="240" className={styles.axis} />
      </svg>
      <figcaption className={styles.caption}>{projectsCopy.cadPending}</figcaption>
    </figure>
  );
}

/** Card emblem: stacked plates (an exploded view in miniature). */
export function SummerBuildEmblem() {
  return (
    <svg viewBox="0 0 64 56" focusable="false">
      {[8, 22, 36].map((y) => (
        <polygon key={y} points={`32,${y} 58,${y + 8} 32,${y + 16} 6,${y + 8}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
