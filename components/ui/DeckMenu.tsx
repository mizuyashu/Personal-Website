"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { projectsCopy, type Project } from "@/content/projects";
import { ScrollSmoother } from "@/lib/gsap";
import { cssVar } from "@/lib/palette";
import styles from "./DeckMenu.module.css";

type Props = {
  projects: readonly Project[];
  emblems: Record<string, ReactNode>;
  selected: number;
  onChoose: (index: number) => void;
  onClose: () => void;
};

// The deck's full menu (docs/vision.md §19): every card laid out like a game inventory, with
// filters made from the statuses the projects actually have. Arrow keys move, Enter draws the
// card (closes the menu and draws it in the deck), Esc closes. The page under it stops scrolling.
// Rendered into document.body: inside the smooth-scroll content (a transformed element) a
// position: fixed panel would be placed against the whole page instead of the screen.
export default function DeckMenu({ projects, emblems, selected, onChoose, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const statuses = useMemo(() => [...new Set(projects.map((p) => p.status))], [projects]);
  const shown = projects.map((p, i) => ({ p, i })).filter(({ p }) => !filter || p.status === filter);

  // Focus the chosen card on open; give focus back on close; stop the page scrolling meanwhile.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const smoother = ScrollSmoother.get();
    smoother?.paused(true);
    const start = cards.current[selected] ?? cards.current.find(Boolean);
    start?.focus();
    return () => {
      smoother?.paused(false);
      before?.focus?.();
    };
  }, [selected]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const order = shown.map(({ i }) => i);
    const current = order.indexOf(cards.current.findIndex((c) => c === document.activeElement));
    const columns = Math.max(1, Math.round((panel.current?.clientWidth ?? 600) / 200));
    const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[e.key];
    if (move !== undefined && order.length) {
      e.preventDefault();
      const next = order[Math.max(0, Math.min(order.length - 1, (current < 0 ? 0 : current) + move))];
      cards.current[next]?.focus();
    }
  };

  return createPortal(
    <div className={styles.backdrop} data-own-scroll onClick={onClose} onKeyDown={onKeyDown}>
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={projectsCopy.deckMenuTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <h3 className={styles.title}>{projectsCopy.deckMenuTitle}</h3>
          <div className={styles.filters} role="group" aria-label={projectsCopy.deckMenuTitle}>
            {[null, ...statuses].map((s) => (
              <button key={s ?? "all"} type="button" className={styles.filter} aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {s ?? projectsCopy.deckMenuAll}
              </button>
            ))}
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            {projectsCopy.deckMenuClose} <kbd>Esc</kbd>
          </button>
        </header>
        <ul className={styles.grid}>
          {shown.map(({ p, i }) => (
            <li key={p.id}>
              <button
                ref={(b) => {
                  cards.current[i] = b;
                }}
                type="button"
                className={styles.card}
                aria-current={i === selected}
                style={{ "--card-frame": cssVar(p.frame) } as CSSProperties}
                onClick={() => onChoose(i)}
              >
                <span className={styles.numeral}>{p.numeral}</span>
                <span className={styles.emblem} aria-hidden>
                  {emblems[p.id]}
                </span>
                <span className={styles.cardTitle}>{p.title}</span>
                <span className={styles.tagline}>{p.tagline}</span>
                <span className={styles.status}>{p.status}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>{projectsCopy.deckMenuHint}</p>
      </div>
    </div>,
    document.body,
  );
}
