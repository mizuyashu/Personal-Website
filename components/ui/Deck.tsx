"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { projectsCopy, type Project } from "@/content/projects";
import { cssVar } from "@/lib/palette";
import { useReducedMotion } from "@/lib/motion";
import { useRouter } from "next/navigation";
import { onJourneyPosition } from "@/lib/scroll";
import CompassStar from "./CompassStar";
import DeckMenu from "./DeckMenu";
import TarotCard from "./TarotCard";
import styles from "./Deck.module.css";

/** At most this many cards are drawn (face up) at once (docs/vision.md §19). */
const MAX_DRAWN = 3;

type Props = { projects: readonly Project[]; emblems: Record<string, ReactNode> };

// The project deck (Balatro feeling, docs/vision.md §19): a big deck, the main focus, off to the
// right; clean text for the chosen card on the left. Cards deal from the pile (flipping face up)
// as you scroll the deck into view, or when you click the pile; numbers jump to a card. Click a
// drawn card to choose it; click the chosen card (or Open) to go to its project.
export default function Deck({ projects, emblems }: Props) {
  const reducedMotion = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [dealtByScroll, setDealtByScroll] = useState(0);
  const [dealtByHand, setDealtByHand] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const total = projects.length;
  const maxDrawn = Math.min(MAX_DRAWN, total);
  const dealt = reducedMotion ? maxDrawn : Math.max(dealtByScroll, dealtByHand, Math.min(maxDrawn, selected + 1));

  // Deal as the deck scrolls into view: one card per slice of the approach.
  useEffect(
    () =>
      onJourneyPosition(() => {
        const el = stage.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const progress = (window.innerHeight - rect.top) / (window.innerHeight * 0.7);
        setDealtByScroll(Math.max(0, Math.min(maxDrawn, Math.floor(progress * maxDrawn + 0.2))));
      }),
    [maxDrawn],
  );

  // The drawn window: up to 3 cards around the chosen one.
  const first = Math.max(0, Math.min(total - maxDrawn, selected - 1));
  const drawn = projects.slice(first, first + maxDrawn).map((p, k) => ({ project: p, index: first + k }));
  const current = projects[selected];

  const router = useRouter();
  // Open: the project's own page, over the journey (docs/vision.md §18); scroll stays put.
  const open = (index: number) => router.push(`/projects/${projects[index].id}`, { scroll: false });
  const choose = (index: number) => {
    setSelected(index);
    setDealtByHand((d) => Math.max(d, Math.min(maxDrawn, index - first + 1)));
  };
  // D opens the full menu while the deck is on screen (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "d" || e.ctrlKey || e.metaKey || e.altKey || menuOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const rect = root.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;
      e.preventDefault();
      setMenuOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const drawNext = () => {
    if (dealt < maxDrawn) setDealtByHand(dealt + 1);
    else setSelected((s) => (s + 1) % total);
  };

  return (
    <div ref={root} className={styles.deck} aria-label={projectsCopy.deckLabel}>
      <div className={styles.text} aria-live="polite">
        <p className={styles.numeral}>{current.numeral}</p>
        <h3 className={styles.title}>{current.title}</h3>
        <p className={styles.tagline}>{current.tagline}</p>
        <p className={styles.summary}>{current.summary}</p>
        <div className={styles.actions}>
          <span className={styles.status} style={{ "--card-frame": cssVar(current.frame) } as CSSProperties}>
            {current.status}
          </span>
          <button type="button" className={styles.open} onClick={() => open(selected)}>
            {projectsCopy.deckOpen} {current.numeral}
          </button>
        </div>
        <nav className={styles.numbers} aria-label={projectsCopy.deckNumbers}>
          {projects.map((p, i) => (
            <button key={p.id} type="button" aria-current={i === selected} className={styles.number} onClick={() => choose(i)}>
              {p.numeral}
            </button>
          ))}
          <button type="button" className={styles.all} aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
            {projectsCopy.deckMenu} <kbd>D</kbd>
          </button>
        </nav>
        {menuOpen && (
          <DeckMenu
            projects={projects}
            emblems={emblems}
            selected={selected}
            onChoose={(i) => {
              choose(i);
              setMenuOpen(false);
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      <div ref={stage} className={styles.stage} data-dealt={dealt}>
        <p className={styles.hint} data-shown={dealt > 0}>
          {projectsCopy.deckHint}
        </p>
        {/* The pile: card backs, stacked. Click to draw. */}
        <button type="button" className={styles.pile} onClick={drawNext} aria-label={projectsCopy.deckPile}>
          {[2, 1, 0].map((k) => (
            <span key={k} className={styles.back} style={{ "--k": k } as CSSProperties}>
              <CompassStar className={styles.backStar} />
            </span>
          ))}
        </button>
        {drawn.map(({ project, index }, slot) => {
          const isDealt = slot < dealt;
          const isSelected = index === selected;
          // Fan: spread around the centre of the drawn cards, the chosen one raised and forward.
          const offset = slot - (Math.min(dealt, drawn.length) - 1) / 2;
          return (
            <div
              key={project.id}
              className={styles.slot}
              data-dealt={isDealt}
              data-selected={isSelected}
              style={{ "--offset": offset, "--order": slot } as CSSProperties}
            >
              <div className={styles.flip}>
                <div className={styles.face}>
                  <TarotCard
                    numeral={project.numeral}
                    title={project.title}
                    tagline={project.tagline}
                    status={project.status}
                    frame={project.frame}
                    emblem={emblems[project.id]}
                    target={`project-${project.id}`}
                    selected={isSelected}
                    tabIndex={isDealt ? 0 : -1}
                    onClick={() => (isSelected ? open(index) : choose(index))}
                  />
                </div>
                <div className={styles.cardBack} aria-hidden>
                  <CompassStar className={styles.backStar} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
