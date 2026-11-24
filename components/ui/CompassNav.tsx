"use client";

import { useId, useRef, useState } from "react";
import { chapters } from "@/content/chapters";
import { ui } from "@/content/site";
import { useReducedMotion } from "@/lib/motion";
import { scrollToChapter, useActiveChapter } from "@/lib/scroll";
import { useEscapeToClose } from "@/lib/focus";
import CompassStar from "./CompassStar";
import styles from "./ui.module.css";

// Compass-star jump nav stub (M1): opens a list of chapters; the current one is marked.
export default function CompassNav() {
  const [open, setOpen] = useState(false);
  const active = useActiveChapter();
  const reducedMotion = useReducedMotion();
  const listId = useId();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEscapeToClose(open, () => setOpen(false), root, toggle);

  return (
    <nav ref={root} className={`${styles.corner} ${styles.bottomRight}`} aria-label={ui.compass}>
      <button
        ref={toggle}
        type="button"
        className={styles.compassButton}
        data-compass-toggle
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? ui.closeCompass : ui.compass}
        onClick={() => setOpen(!open)}
      >
        <CompassStar className={styles.compassIcon} />
      </button>
      {/* After the toggle in the DOM (Tab goes toggle → chapters); shown above it (ui.module.css). */}
      {open && (
        <ol id={listId} className={`${styles.panel} ${styles.chapterList}`}>
          {chapters.map((chapter, i) => (
            <li key={chapter.id}>
              <button
                type="button"
                className={styles.chapterLink}
                aria-current={i === active ? "step" : undefined}
                onClick={() => {
                  scrollToChapter(chapter.id, reducedMotion);
                  setOpen(false);
                }}
              >
                <span className={styles.chapterNumeral}>{chapter.numeral}</span>
                {chapter.title}
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
