"use client";

import { useId, useState } from "react";
import { chapters } from "@/content/chapters";
import { ui } from "@/content/site";
import { useReducedMotion } from "@/lib/motion";
import { scrollToChapter, useActiveChapter } from "@/lib/scroll";
import CompassStar from "./CompassStar";
import styles from "./ui.module.css";

// Compass-star jump nav stub (M1): opens a list of chapters; the current one is marked.
export default function CompassNav() {
  const [open, setOpen] = useState(false);
  const active = useActiveChapter();
  const reducedMotion = useReducedMotion();
  const listId = useId();

  return (
    <nav className={`${styles.corner} ${styles.bottomRight}`} aria-label={ui.compass}>
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
      <button
        type="button"
        className={styles.compassButton}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? ui.closeCompass : ui.compass}
        onClick={() => setOpen(!open)}
      >
        <CompassStar className={styles.compassIcon} />
      </button>
    </nav>
  );
}
