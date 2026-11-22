"use client";

import { useEffect, useRef, useState } from "react";
import { education } from "@/content/education";
import { DAWN } from "@/lib/dawn";
import { smoothstep } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { onJourneyPosition } from "@/lib/scroll";
import StatusWindow from "@/components/ui/StatusWindow";
import styles from "./Constellation.module.css";

const CHAPTER = 2;
const { skills, edges } = education;

/** Stars lit once their first line has drawn (the first star is lit from the start). */
function litStars(linesDrawn: number) {
  const lit = new Set<number>([0]);
  edges.slice(0, linesDrawn).forEach(([, to]) => lit.add(to));
  return lit;
}

// Chapter III overlay, fixed over the dawn sky: the skill constellation draws itself line by
// line as you scroll, and each newly lit star announces itself in a status window.
// Driven by the master scroll position.
export default function Constellation() {
  const root = useRef<HTMLDivElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const [drawn, setDrawn] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(
    () =>
      onJourneyPosition((p) => {
        const el = root.current;
        if (!el) return;
        const local = p - CHAPTER;
        const shown = smoothstep(DAWN.skyIn - 0.04, DAWN.skyIn + 0.02, local) * (1 - smoothstep(DAWN.skyOut - 0.04, DAWN.skyOut, local));
        el.style.opacity = shown.toFixed(3);
        el.style.visibility = shown > 0 ? "visible" : "hidden";

        // Each line draws in its own slice of the draw window (reduced motion: all at once).
        const t = reducedMotion ? (local > DAWN.skyIn ? 1 : 0) : smoothstep(DAWN.drawStart, DAWN.drawEnd, local) * edges.length;
        lines.current.forEach((line, i) => {
          if (line) line.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, t - i)));
        });
        setDrawn(Math.floor(t + 1e-6));
      }),
    [reducedMotion],
  );

  const lit = litStars(drawn);
  const newest = edges
    .slice(0, drawn)
    .map(([, to]) => to)
    .slice(-3)
    .reverse();

  return (
    <div ref={root} className={styles.overlay} aria-label={education.constellationLabel}>
      <svg className={styles.sky} viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" role="img" aria-label={education.constellationLabel}>
        {edges.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            ref={(l) => {
              lines.current[i] = l;
            }}
            x1={skills[a].x}
            y1={skills[a].y}
            x2={skills[b].x}
            y2={skills[b].y}
            pathLength={1}
            className={styles.line}
          />
        ))}
        {skills.map((s, i) => (
          <g key={s.name} className={styles.star} data-lit={lit.has(i)}>
            <path d={`M${s.x} ${s.y - 2.2} L${s.x + 0.6} ${s.y - 0.6} L${s.x + 2.2} ${s.y} L${s.x + 0.6} ${s.y + 0.6} L${s.x} ${s.y + 2.2} L${s.x - 0.6} ${s.y + 0.6} L${s.x - 2.2} ${s.y} L${s.x - 0.6} ${s.y - 0.6} Z`} />
            <text x={s.x} y={s.y + 5.2} textAnchor="middle">
              {s.name}
            </text>
          </g>
        ))}
      </svg>
      <div className={styles.status}>
        {newest.map((i) => (
          <StatusWindow key={i} label={education.unlocked} text={skills[i].name} />
        ))}
      </div>
    </div>
  );
}
