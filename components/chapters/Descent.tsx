"use client";

import { useEffect, useRef } from "react";
import { DESCENT } from "@/lib/embers";
import { clamp01, smoothstep } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { onJourneyPosition } from "@/lib/scroll";
import Filigree from "./Filigree";
import styles from "./Descent.module.css";

const CHAPTER = 3;

// Bokeh dots: fixed layout so they render the same every time.
const BOKEH = [
  [12, 18, 7], [28, 72, 11], [44, 30, 6], [61, 82, 9], [73, 22, 13], [86, 60, 8],
  [20, 45, 5], [52, 55, 10], [91, 35, 6], [36, 88, 7], [67, 46, 5], [8, 80, 9],
];

// Chapter IV's descent and letterbox, fixed over everything but the corner UI:
// a gold ornament frame appears → dissolves into bokeh → white → dark; letterbox bars
// close for the chapter. Halftone grit sits over the embers. Driven by scroll position.
export default function Descent() {
  const frame = useRef<HTMLDivElement>(null);
  const bokeh = useRef<HTMLDivElement>(null);
  const white = useRef<HTMLDivElement>(null);
  const bars = useRef<HTMLDivElement>(null);
  const grit = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(
    () =>
      onJourneyPosition((p) => {
        const t = p - CHAPTER;
        const set = (el: HTMLDivElement | null, opacity: number) => {
          if (!el) return;
          el.style.opacity = opacity.toFixed(3);
          el.style.visibility = opacity > 0.001 ? "visible" : "hidden";
        };
        const frameIn = smoothstep(DESCENT.frameIn - 0.04, DESCENT.frameFull, t);
        const dissolve = smoothstep(DESCENT.frameHold, DESCENT.bokeh, t);
        set(frame.current, frameIn * (1 - dissolve));
        if (frame.current) frame.current.style.setProperty("--dissolve", dissolve.toFixed(3));
        const bokehAmount = dissolve * (1 - smoothstep(DESCENT.bokeh + 0.02, DESCENT.whitePeak, t));
        set(bokeh.current, reducedMotion ? 0 : bokehAmount);
        if (bokeh.current) bokeh.current.style.setProperty("--rise", clamp01((t - DESCENT.frameFull) / (DESCENT.whitePeak - DESCENT.frameFull)).toFixed(3));
        const flash = smoothstep(DESCENT.bokeh, DESCENT.whitePeak, t) * (1 - smoothstep(DESCENT.whitePeak, DESCENT.dark, t));
        set(white.current, reducedMotion ? 0 : flash);
        const closed = smoothstep(DESCENT.dark, DESCENT.letterboxClosed, t) * (1 - smoothstep(DESCENT.letterboxOpen, 1.02, t));
        if (bars.current) {
          bars.current.style.setProperty("--closed", closed.toFixed(3));
          bars.current.style.visibility = closed > 0.001 ? "visible" : "hidden";
        }
        set(grit.current, closed * 0.5);
      }),
    [reducedMotion],
  );

  return (
    <>
      <div ref={grit} className={styles.grit} aria-hidden />
      <div ref={frame} className={styles.frame} aria-hidden>
        <Filigree className={`${styles.rule} ${styles.top}`} />
        <Filigree className={`${styles.rule} ${styles.bottom}`} />
      </div>
      <div ref={bokeh} className={styles.bokeh} aria-hidden>
        {BOKEH.map(([x, y, size], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, width: `${size}vmin`, height: `${size}vmin` }} />
        ))}
      </div>
      <div ref={white} className={styles.white} aria-hidden />
      <div ref={bars} className={styles.letterbox} aria-hidden>
        <span />
        <span />
      </div>
    </>
  );
}
