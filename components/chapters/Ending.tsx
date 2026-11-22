"use client";

import { useEffect, useRef } from "react";
import { contact } from "@/content/contact";
import { ui } from "@/content/site";
import { BONFIRE } from "@/lib/bonfire";
import { smoothstep } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { onJourneyPosition, scrollToChapter } from "@/lib/scroll";
import styles from "./Ending.module.css";

const CHAPTER = 4;

// Stars around the sword tip (viewBox 200 × 300) and the lines drawn between them.
const STARS: [number, number][] = [
  [100, 38], [62, 22], [138, 20], [40, 54], [160, 58], [78, 8], [124, 4],
];
const LINES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6], [5, 6],
];

// The ending, fixed over the bonfire: a golden flash, then a sword raised to the stars with
// constellation lines drawing from its tip, then a fade to ivory and a way back to the start.
// TODO(content): the figure "standing above the fire" (vision §9 beat 14) is not built; the sword stands alone.
export default function Ending() {
  const flash = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const ivory = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(
    () =>
      onJourneyPosition((p) => {
        const t = p - CHAPTER;
        const show = (el: HTMLElement | null, v: number) => {
          if (!el) return;
          el.style.opacity = v.toFixed(3);
          el.style.visibility = v > 0.001 ? "visible" : "hidden";
        };
        const flashV = smoothstep(BONFIRE.flashStart, BONFIRE.flashPeak, t) * (1 - smoothstep(BONFIRE.flashPeak, BONFIRE.swordIn + 0.06, t));
        show(flash.current, reducedMotion ? 0 : flashV);
        show(scene.current, smoothstep(BONFIRE.flashPeak, BONFIRE.swordIn + 0.04, t));
        const drawn = reducedMotion ? (t > BONFIRE.swordIn ? 1 : 0) : smoothstep(BONFIRE.linesStart, BONFIRE.linesEnd, t) * LINES.length;
        lines.current.forEach((line, i) => {
          if (line) line.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, drawn - i)));
        });
        show(ivory.current, smoothstep(BONFIRE.ivoryStart, BONFIRE.ivoryEnd, t));
      }),
    [reducedMotion],
  );

  return (
    <>
      <div ref={scene} className={styles.scene} aria-hidden>
        <svg className={styles.sword} viewBox="0 0 200 300" focusable="false">
          {LINES.map(([a, b], i) => (
            <line
              key={`${a}-${b}`}
              ref={(l) => {
                lines.current[i] = l;
              }}
              x1={STARS[a][0]}
              y1={STARS[a][1]}
              x2={STARS[b][0]}
              y2={STARS[b][1]}
              pathLength={1}
              className={styles.line}
            />
          ))}
          {STARS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 ? 3 : 1.8} className={styles.star} />
          ))}
          {/* The sword, point up: blade, fuller, guard, grip, pommel */}
          <path d="M100 44 L106 60 L106 200 L94 200 L94 60 Z" className={styles.blade} />
          <line x1="100" y1="64" x2="100" y2="196" className={styles.fuller} />
          <path d="M70 200 Q100 192 130 200 L130 206 Q100 200 70 206 Z" className={styles.metal} />
          <rect x="96" y="206" width="8" height="40" rx="2" className={styles.metal} />
          <circle cx="100" cy="252" r="7" className={styles.metal} />
        </svg>
      </div>
      <div ref={flash} className={styles.flash} aria-hidden />
      <div ref={ivory} className={styles.ivory}>
        <p className={styles.closing}>{contact.ending}</p>
        <button type="button" className={styles.again} onClick={() => scrollToChapter("intro", reducedMotion)}>
          {ui.beginAgain}
        </button>
      </div>
    </>
  );
}
