"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { contact } from "@/content/contact";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";
import ContactLinks from "./ContactLinks";
import styles from "./ContactMenu.module.css";

// Fire-burn contact menu (vision §9 "always"): from the corner, a dark page burns open
// with a ragged ember edge and shows the compass of links. Escape or × closes it.
export default function ContactMenu({ buttonClassName }: { buttonClassName: string }) {
  const [open, setOpen] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const filterId = useId().replace(/:/g, "");

  useEffect(() => {
    const el = overlay.current;
    if (!el) return;
    const radius = { r: open ? 0 : 150 };
    const apply = () => el.style.setProperty("--r", `${radius.r}vmax`);
    if (open) {
      el.style.visibility = "visible";
      closeButton.current?.focus();
    }
    const tween = gsap.to(radius, {
      r: open ? 150 : 0,
      duration: reducedMotion ? 0 : open ? 1.1 : 0.7,
      ease: open ? "power2.in" : "power2.out",
      onUpdate: apply,
      onComplete: () => {
        if (!open) el.style.visibility = "hidden";
      },
    });
    apply();
    return () => {
      tween.kill();
    };
  }, [open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        opener.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button ref={opener} type="button" className={buttonClassName} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {contact.menuButton}
      </button>
      <svg className={styles.defs} aria-hidden focusable="false">
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="70" />
        </filter>
      </svg>
      <div
        ref={overlay}
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        style={{ "--burn-filter": `url(#${filterId})` } as CSSProperties}
      >
        <div className={styles.burn} aria-hidden />
        <div className={styles.page}>
          <button ref={closeButton} type="button" className={styles.close} onClick={() => setOpen(false)}>
            {contact.close} ×
          </button>
          <h2 id={titleId} className={styles.title}>
            {contact.menuTitle}
          </h2>
          <ContactLinks />
        </div>
      </div>
    </>
  );
}
