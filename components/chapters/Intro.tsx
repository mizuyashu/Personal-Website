"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { INTRO, flashAmount, smoothstep } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { onJourneyPosition } from "@/lib/scroll";
import Filigree from "./Filigree";
import styles from "./Intro.module.css";

// Chapter I overlay, fixed over the canvas: the flash to white, then the name mark
// (two-tier glowing serif between filigree rules, epithet box) over the compass-star sun.
// Driven by the master scroll position; it has no ScrollTrigger of its own.
export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const tier = useRef<HTMLParagraphElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const epithet = useRef<HTMLParagraphElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (!root.current || !name.current) return;
      const split = SplitText.create(name.current, { type: "chars" });
      const reveal = gsap
        .timeline({ paused: true })
        .from(`.${styles.rule}`, { scaleX: 0, opacity: 0, duration: 1.1, ease: "power3.out" })
        .from(tier.current, { opacity: 0, y: 12, duration: 0.7, ease: "power2.out" }, 0.1)
        .from(split.chars, { opacity: 0, yPercent: 35, filter: "blur(8px)", duration: 0.9, stagger: 0.06, ease: "power3.out" }, 0.15)
        .from(epithet.current, { opacity: 0, y: 12, duration: 0.7, ease: "power2.out" }, "-=0.45");

      let shown = false;
      reveal.progress(0);
      return onJourneyPosition((p) => {
        const el = root.current;
        if (!el) return;
        el.style.opacity = String(1 - smoothstep(INTRO.fadeOutStart, 1, p));
        el.style.visibility = p >= 1 ? "hidden" : "visible";
        if (flash.current) flash.current.style.opacity = reducedMotion ? "0" : String(flashAmount(p));

        const next = p >= INTRO.flashPeak;
        if (next === shown) return;
        shown = next;
        if (reducedMotion) reveal.progress(next ? 1 : 0);
        else if (next) reveal.timeScale(1).play();
        else reveal.timeScale(2).reverse();
      });
    },
    { scope: root, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <>
      <div ref={root} className={styles.overlay}>
        <div className={styles.mark}>
          <Filigree className={styles.rule} />
          <p ref={tier} className={styles.tier}>
            {site.nameTier}
          </p>
          <h1 ref={name} className={styles.name}>
            {site.name}
          </h1>
          <Filigree className={styles.rule} />
          <p ref={epithet} className={styles.epithet}>
            {site.epithet}
          </p>
        </div>
      </div>
      <div ref={flash} className={styles.flash} aria-hidden />
    </>
  );
}
