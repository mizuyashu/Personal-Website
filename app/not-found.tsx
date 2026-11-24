import type { CSSProperties } from "react";
import Link from "next/link";
import { notFoundCopy, site } from "@/content/site";
import styles from "./not-found.module.css";

// The cat 404: a sitting cat drawn as a constellation, floating in the void (the one canvas
// keeps running behind it). Lines draw in, stars twinkle; with reduced motion it simply shows.
// Original drawing (no reference art). TODO(content): Michael's cat could replace or join it.

export const metadata = { title: `${notFoundCopy.code} · ${site.name}` };

/** Stars of the cat (200 × 200 box), sitting, facing left, tail curled round to the right. */
const STARS = {
  earL: [66, 34],
  notch: [84, 50],
  earR: [100, 32],
  cheekL: [58, 62],
  chin: [74, 82],
  cheekR: [104, 62],
  shoulder: [118, 92],
  back: [136, 124],
  haunch: [142, 160],
  base: [112, 172],
  paw: [80, 170],
  chest: [80, 122],
  tail1: [166, 160],
  tail2: [180, 140],
  tail3: [172, 120],
} as const;
type Star = keyof typeof STARS;

const LINES: [Star, Star][] = [
  ["earL", "notch"],
  ["notch", "earR"],
  ["earL", "cheekL"],
  ["cheekL", "chin"],
  ["earR", "cheekR"],
  ["cheekR", "shoulder"],
  ["shoulder", "back"],
  ["back", "haunch"],
  ["haunch", "base"],
  ["base", "paw"],
  ["paw", "chest"],
  ["chest", "chin"],
  ["haunch", "tail1"],
  ["tail1", "tail2"],
  ["tail2", "tail3"],
];

/** Brighter stars (the eye is its own gold star). */
const BRIGHT: Star[] = ["earL", "earR", "haunch", "tail3"];

export default function NotFound() {
  return (
    <main className={styles.page}>
      <svg className={styles.cat} viewBox="0 0 200 200" role="img" aria-label={notFoundCopy.label}>
        {LINES.map(([a, b], i) => {
          const [x1, y1] = STARS[a];
          const [x2, y2] = STARS[b];
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.line} style={{ "--i": i } as CSSProperties} />;
        })}
        {(Object.keys(STARS) as Star[]).map((name, i) => {
          const [cx, cy] = STARS[name];
          const bright = BRIGHT.includes(name);
          return <circle key={name} cx={cx} cy={cy} r={bright ? 2.6 : 1.7} className={styles.star} style={{ "--i": i } as CSSProperties} />;
        })}
        {/* The eye */}
        <circle cx={76} cy={62} r={2.2} className={styles.eye} />
      </svg>

      <p className={styles.code}>{notFoundCopy.code}</p>
      <h1 className={styles.title}>{notFoundCopy.title}</h1>
      <p className={styles.text}>{notFoundCopy.text}</p>
      <Link href="/" className={styles.back}>
        <span aria-hidden>←</span> {notFoundCopy.back}
      </Link>
    </main>
  );
}
