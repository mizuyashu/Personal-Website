"use client";

import { useSyncExternalStore } from "react";
import { CORRIDOR } from "@/lib/corridor";
import { gsap, ScrollSmoother } from "@/lib/gsap";

// The medallion at the great lift (docs/vision.md §19). The lift waits for you: at the gate
// (standing on the lift, chapter II) scrolling down stops until you raise the medallion: hold
// (a key, the mouse, a finger, gamepad A) or tap repeatedly. When it registers, the lift
// carries you up on its own (any scroll input takes control back). The gate never moves the
// visitor anywhere; jumps (compass, chapter keys, Begin again) pass it. Once raised, it stays
// raised for the visit. The canvas reads `medallion.progress` / `raised` every frame.

export const medallion = { progress: 0, raised: false, holding: false };

/** Hold this long to raise it (seconds); each tap adds TAP. */
const HOLD_SECONDS = 0.9;
const TAP = 0.34;
/** Released early, the charge drains at this rate (per second). */
const DRAIN = 0.7;
/** The ride up, from the gate to the blueprint (seconds). The scroll curve gives creep then surge. */
const RIDE_SECONDS = 7;

const listeners = new Set<() => void>();
let snapshot = { progress: 0, raised: false };
function emit() {
  snapshot = { progress: medallion.progress, raised: medallion.raised };
  listeners.forEach((l) => l());
}

export function useMedallion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => snapshot,
    () => snapshot,
  );
}

/** Scroll offset (px) of a point in chapter II, from the section's layout box. */
function chapterIIOffset(progress: number) {
  const section = document.getElementById("projects");
  if (!section) return Infinity;
  return section.offsetTop + progress * section.offsetHeight;
}

/** Scroll offset of the gate: standing on the lift, just after the tilt up. */
export function gateY() {
  return chapterIIOffset(CORRIDOR.tiltEnd + 0.004);
}

export function currentScrollY() {
  return ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
}

export function setScrollY(y: number) {
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTop(y);
  else window.scrollTo(0, y);
}

/** Is a move to `targetY` blocked by the waiting lift? */
export function blockedByGate(targetY: number) {
  if (medallion.raised) return false;
  const gate = gateY();
  return currentScrollY() <= gate + 4 && targetY > gate;
}

let ride: gsap.core.Tween | null = null;
let ticking = false;

/** The lift takes you up: glide from here to the arrival at the blueprint. */
function startRide() {
  const from = currentScrollY();
  const to = chapterIIOffset(CORRIDOR.riseEnd);
  if (!(to > from)) return;
  const proxy = { y: from };
  ride = gsap.to(proxy, {
    y: to,
    duration: RIDE_SECONDS,
    ease: "none",
    onUpdate: () => setScrollY(proxy.y),
    onComplete: () => {
      ride = null;
    },
  });
}

/** Any scroll input during the ride takes control back. */
export function interruptRide() {
  ride?.kill();
  ride = null;
}

function raise() {
  medallion.raised = true;
  medallion.progress = 1;
  medallion.holding = false;
  emit();
  startRide();
}

function tick() {
  let last = performance.now();
  ticking = true;
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (medallion.raised) {
      ticking = false;
      return;
    }
    if (medallion.holding) medallion.progress = Math.min(1, medallion.progress + dt / HOLD_SECONDS);
    else medallion.progress = Math.max(0, medallion.progress - dt * DRAIN);
    emit();
    if (medallion.progress >= 1) return raise();
    if (medallion.holding || medallion.progress > 0) requestAnimationFrame(step);
    else ticking = false;
  };
  requestAnimationFrame(step);
}

export function startHold() {
  if (medallion.raised) return;
  medallion.holding = true;
  if (!ticking) tick();
}

export function endHold() {
  medallion.holding = false;
}

/** A quick tap (mobile: repeated taps raise it too). */
export function tap() {
  if (medallion.raised) return;
  medallion.progress = Math.min(1, medallion.progress + TAP);
  emit();
  if (medallion.progress >= 1) raise();
  else if (!ticking) tick();
}
