"use client";

import type { CSSProperties, ReactNode } from "react";
import { cssVar } from "@/lib/palette";
import { useReducedMotion } from "@/lib/motion";
import { scrollToId } from "@/lib/scroll";
import styles from "./TarotCard.module.css";

type Props = {
  numeral: string;
  title: string;
  tagline: string;
  status: string;
  frame: "cobalt" | "gold" | "teal" | "violet";
  emblem: ReactNode;
  /** Element id to scroll to when the card is chosen. */
  target: string;
};

// Tarot project card (vision §7): number in a hex badge, own frame colour, shared ornate frame.
// Hovering one lifts it into colour while the others go grey.
export default function TarotCard({ numeral, title, tagline, status, frame, emblem, target }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <button
      type="button"
      className={styles.card}
      style={{ "--card-frame": cssVar(frame) } as CSSProperties}
      onClick={() => scrollToId(target, reducedMotion, 72)}
    >
      <svg className={styles.frame} viewBox="0 0 140 240" aria-hidden focusable="false" preserveAspectRatio="none">
        <rect x="4" y="4" width="132" height="232" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="120" height="220" rx="2" fill="none" stroke="currentColor" strokeWidth="0.6" />
        {[
          [10, 10, 1, 1],
          [130, 10, -1, 1],
          [10, 230, 1, -1],
          [130, 230, -1, -1],
        ].map(([x, y, sx, sy]) => (
          <path
            key={`${x}${y}`}
            d={`M${x} ${y + sy * 18} Q${x} ${y} ${x + sx * 18} ${y} M${x + sx * 5} ${y + sy * 5} l${sx * 4} ${sy * 4}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>
      <span className={styles.badge} aria-hidden>
        <svg viewBox="0 0 40 44" focusable="false">
          <polygon points="20,2 38,12 38,32 20,42 2,32 2,12" fill="var(--ivory)" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className={styles.numeral}>{numeral}</span>
      </span>
      <span className={styles.emblem} aria-hidden>
        {emblem}
      </span>
      <span className={styles.title}>{title}</span>
      <span className={styles.tagline}>{tagline}</span>
      <span className={styles.status}>{status}</span>
    </button>
  );
}
