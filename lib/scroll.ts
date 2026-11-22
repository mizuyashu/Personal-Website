"use client";

import { useSyncExternalStore } from "react";
import { ScrollSmoother } from "@/lib/gsap";

// Output of the one master scroll timeline (components/chapters/Journey.tsx).
// `position` runs 0 → chapter count: the integer part is the chapter, the fraction its progress.
// The camera rig and scenes read this every frame; they never make their own ScrollTriggers.
export const journey = { position: 0 };

// Dev only: lets browser tests read where the journey is (window.__journey.position) and
// jump to a scroll offset (window.__scrollToY(px)). Use with ?nosnap (see Journey.tsx).
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  Object.assign(window, {
    __journey: journey,
    __scrollToY: (y: number) => ScrollSmoother.get()?.scrollTo(y, false) ?? window.scrollTo(0, y),
  });
}

let active = 0;
const listeners = new Set<() => void>();
const positionListeners = new Set<(position: number) => void>();

/** Called on every position change (for HTML overlays that follow scroll). Returns an unsubscribe. */
export function onJourneyPosition(listener: (position: number) => void) {
  positionListeners.add(listener);
  listener(journey.position);
  return () => {
    positionListeners.delete(listener);
  };
}

export function setJourneyPosition(position: number, chapterCount: number) {
  journey.position = position;
  positionListeners.forEach((listener) => listener(position));
  const next = Math.min(chapterCount - 1, Math.max(0, Math.floor(position)));
  if (next !== active) {
    active = next;
    listeners.forEach((listener) => listener());
  }
}

/** 0–1 progress through chapter `index`. */
export function chapterProgress(index: number) {
  return Math.min(1, Math.max(0, journey.position - index));
}

/** Index of the chapter on screen; re-renders only when it changes. */
export function useActiveChapter(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => active,
    () => 0,
  );
}

/** Jump to a chapter (compass nav). */
export function scrollToChapter(id: string, reducedMotion: boolean) {
  scrollToId(id, reducedMotion);
}

/** Scroll so the element with this id sits at the top of the screen (`offset`: px of room above it). */
export function scrollToId(id: string, reducedMotion: boolean, offset = 0) {
  const target = document.getElementById(id);
  if (!target) return;
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(target, !reducedMotion, `top ${offset}px`);
  else target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}
