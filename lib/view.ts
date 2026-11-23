"use client";

import { useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";

// Sub-pages (docs/vision.md §18): a project page or an education year opens over the journey.
// The camera flies from wherever you are to a dedicated 3D space high above the sky (the
// project's huge object off to one side, clean text on the other), and flies back on close.
// `view.t` is the flight (0 = the journey, 1 = the sub-page space); CameraRig, the space scene
// and the backdrop read it every frame.

export type SubView = { kind: "project" | "year" | "about"; id: string };

export const view: { current: SubView | null; t: number } = { current: null, t: 0 };

/** The flight there and back (seconds). */
const FLIGHT = 1.7;

const listeners = new Set<() => void>();
let snapshot: SubView | null = null;
function emit() {
  snapshot = view.current;
  listeners.forEach((l) => l());
}

export function useView(): SubView | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => snapshot,
    () => null,
  );
}

let flight: gsap.core.Tween | null = null;

/** While a sub-page is open the journey's own HTML fades out (globals.css: body[data-subpage]). */
function markOpen(open: boolean) {
  if (open) document.body.dataset.subpage = "open";
  else delete document.body.dataset.subpage;
}

/** Open a sub-page: fly there (instant for a direct load or reduced motion). */
export function openView(next: SubView, instant = false) {
  flight?.kill();
  view.current = next;
  markOpen(true);
  emit();
  if (instant) {
    view.t = 1;
    return;
  }
  flight = gsap.to(view, { t: 1, duration: FLIGHT, ease: "power3.inOut" });
}

/** Close: fly back to the journey, exactly where you were. */
export function closeView(instant = false) {
  flight?.kill();
  if (instant) {
    view.t = 0;
    view.current = null;
    markOpen(false);
    emit();
    return;
  }
  flight = gsap.to(view, {
    t: 0,
    duration: FLIGHT * 0.85,
    ease: "power3.inOut",
    onComplete: () => {
      view.current = null;
      markOpen(false);
      emit();
    },
  });
}
