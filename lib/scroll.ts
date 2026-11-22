"use client";

import { useSyncExternalStore } from "react";
import { ScrollSmoother } from "@/lib/gsap";

// Output of the one master scroll timeline (components/chapters/Journey.tsx).
// `position` runs 0 → chapter count: the integer part is the chapter, the fraction its progress.
// The camera rig and scenes read this every frame; they never make their own ScrollTriggers.
export const journey = { position: 0 };

let active = 0;
const listeners = new Set<() => void>();

export function setJourneyPosition(position: number, chapterCount: number) {
  journey.position = position;
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
  const target = document.getElementById(id);
  if (!target) return;
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(target, !reducedMotion, "top top");
  else target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}
