"use client";

import { useEffect, useRef } from "react";
import { contact } from "@/content/contact";
import { education } from "@/content/education";
import { controls, ui } from "@/content/site";
import { BONFIRE } from "@/lib/bonfire";
import { gsap } from "@/lib/gsap";
import { smoothstep } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { earnStar } from "@/lib/ownStar";
import { onJourneyPosition, scrollToChapter } from "@/lib/scroll";
import styles from "./Ending.module.css";

const CHAPTER = 4;

/** The sword's tip (viewBox 200 × 300). */
const TIP: [number, number] = [100, 44];
/**
 * Your constellation (docs/vision.md §17): the skill constellation from chapter III, mapped into
 * the sky above the sword. The first line fires from the tip to its first star; then the
 * constellation's own lines fire in order.
 */
const STARS: [number, number][] = education.skills.map((s) => [26 + s.x * 1.48, 2 + s.y * 0.6]);
const LINES: [number, number][] = education.edges;

// The ending, fixed over the bonfire: a golden flash, then the sword: a beat of stillness, a fast
// draw-and-raise (overshoot, a gleam down the blade), lines firing from the tip into your
// constellation, its stars bursting in. A timed burst triggered when the scroll reaches it, played
// back if you scroll up (docs/vision.md §17: swift, like reaching flow). Then a fade to ivory and
// a way back to the start. When the sword's constellation is complete, your star turns radiant.
// TODO(content): the figure "standing above the fire" (vision §9 beat 14) is not built; the sword stands alone.
export default function Ending() {
  const flash = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const sword = useRef<SVGGElement>(null);
  const gleam = useRef<SVGLineElement>(null);
  const spark = useRef<SVGLineElement>(null);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const stars = useRef<(SVGGElement | null)[]>([]);
  const ivory = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // The burst, built once (paused) and played or reversed as the scroll crosses the beat.
    const tl = gsap.timeline({ paused: true, onComplete: () => earnStar(2) });
    tl.set(sword.current, { y: 140, opacity: 0 })
      .set([spark.current, ...lines.current], { strokeDashoffset: 1 })
      .set(stars.current, { scale: 0, opacity: 0, transformOrigin: "50% 50%" })
      .set(gleam.current, { strokeDashoffset: 1 })
      .to(sword.current, { opacity: 1, duration: 0.12 })
      // Stillness, then the draw: fast, overshooting, settling clean.
      .to(sword.current, { y: 0, duration: 0.55, ease: "back.out(1.7)" }, ">0.2")
      .to(gleam.current, { strokeDashoffset: -0.25, duration: 0.42, ease: "power2.in" }, "-=0.2")
      // Lines fire from the tip.
      .to(spark.current, { strokeDashoffset: 0, duration: 0.14, ease: "power4.in" }, "-=0.1")
      .to(stars.current[0], { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(3)" })
      .addLabel("constellation", "-=0.1");
    LINES.forEach(([, to], i) => {
      const at = `constellation+=${i * 0.08}`;
      tl.to(lines.current[i], { strokeDashoffset: 0, duration: 0.12, ease: "power4.in" }, at);
      tl.to(stars.current[to], { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(3)" }, `${at}+=0.1`);
    });
    let played = false;
    const stop = onJourneyPosition((p) => {
      const t = p - CHAPTER;
      const show = (el: HTMLElement | null, v: number) => {
        if (!el) return;
        el.style.opacity = v.toFixed(3);
        el.style.visibility = v > 0.001 ? "visible" : "hidden";
      };
      const flashV = smoothstep(BONFIRE.flashStart, BONFIRE.flashPeak, t) * (1 - smoothstep(BONFIRE.flashPeak, BONFIRE.swordIn + 0.06, t));
      show(flash.current, reducedMotion ? 0 : flashV);
      show(scene.current, smoothstep(BONFIRE.flashPeak, BONFIRE.swordIn + 0.04, t));
      const reached = t >= BONFIRE.swordIn;
      if (reducedMotion) {
        tl.progress(reached ? 1 : 0);
      } else if (reached && !played) {
        played = true;
        tl.timeScale(1).play();
      } else if (!reached && played && t < BONFIRE.swordIn - 0.01) {
        played = false;
        tl.timeScale(2.5).reverse();
      }
      show(ivory.current, smoothstep(BONFIRE.ivoryStart, BONFIRE.ivoryEnd, t));
    });
    return () => {
      stop();
      tl.kill();
    };
  }, [reducedMotion]);

  return (
    <>
      <div ref={scene} className={styles.scene} aria-hidden>
        <svg className={styles.sword} viewBox="0 0 200 300" focusable="false">
          {/* The first line fires from the sword's tip to your constellation's first star */}
          <line ref={spark} x1={TIP[0]} y1={TIP[1]} x2={STARS[0][0]} y2={STARS[0][1]} pathLength={1} className={styles.line} />
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
            <g
              key={i}
              ref={(g) => {
                stars.current[i] = g;
              }}
              className={styles.starGroup}
            >
              <path d={`M${x} ${y - 4} L${x + 1} ${y - 1} L${x + 4} ${y} L${x + 1} ${y + 1} L${x} ${y + 4} L${x - 1} ${y + 1} L${x - 4} ${y} L${x - 1} ${y - 1} Z`} className={styles.star} />
            </g>
          ))}
          {/* The sword, point up: blade, fuller, guard, grip, pommel, and the gleam that runs up it */}
          <g ref={sword}>
            <path d="M100 44 L106 60 L106 200 L94 200 L94 60 Z" className={styles.blade} />
            <line x1="100" y1="64" x2="100" y2="196" className={styles.fuller} />
            <line ref={gleam} x1="100" y1="198" x2="100" y2="46" pathLength={1} className={styles.gleam} />
            <path d="M70 200 Q100 192 130 200 L130 206 Q100 200 70 206 Z" className={styles.metal} />
            <rect x="96" y="206" width="8" height="40" rx="2" className={styles.metal} />
            <circle cx="100" cy="252" r="7" className={styles.metal} />
          </g>
        </svg>
      </div>
      <div ref={flash} className={styles.flash} aria-hidden />
      <div ref={ivory} className={styles.ivory}>
        <p className={styles.closing}>{contact.ending}</p>
        <button type="button" className={styles.again} onClick={() => scrollToChapter("intro", reducedMotion)}>
          {ui.beginAgain}
        </button>
        {/* Desktop: tell visitors who reached the end that they can explore with the controls. */}
        <div className={styles.controls}>
          <p className={styles.controlsTitle}>{controls.endTitle}</p>
          <ul className={styles.controlsList}>
            {controls.keyboard.map((row) => (
              <li key={row.action}>
                {row.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
                <span>{row.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
