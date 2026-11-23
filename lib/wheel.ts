"use client";

import { ScrollSmoother } from "@/lib/gsap";
import { blockedByGate, gateY } from "@/lib/medallion";
import { roam } from "@/lib/roam";

// The wheel governor: mouse-wheel (and trackpad) scrolling moves the page at most about as fast
// as holding an arrow key, so a hard flick can't race through several scenes at once (which is
// what made fast scrolling stutter). Wheel input is taken over (preventDefault), collected, and
// released a little each frame at a capped speed. Keyboard, touch, the compass and other jumps
// are untouched. Not used with reduced motion (native scroll there).

/** Top speed, in screens per second (holding an arrow key is roughly 1). */
const MAX_SCREENS_PER_SECOND = 1.15;
/** Most scroll that can be queued ahead (screens): a big flick doesn't turn into a long ride. */
const MAX_QUEUED_SCREENS = 1.25;

function currentY() {
  return ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
}

function setY(y: number) {
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTop(y);
  else window.scrollTo(0, y);
}

/** Wheel delta in pixels, whatever the device reports in. */
function pixels(e: WheelEvent) {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
  return e.deltaY;
}

/** Elements that scroll on their own (menus, sub-page panels) keep native wheel scrolling. */
function ownsScroll(target: EventTarget | null) {
  return target instanceof Element && target.closest("[data-own-scroll]") !== null;
}

export function installWheelGovernor() {
  let queued = 0;
  let frame = 0;
  let last = 0;

  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const max = MAX_SCREENS_PER_SECOND * window.innerHeight * dt;
    const move = Math.max(-max, Math.min(max, queued));
    queued -= move;
    let target = Math.max(0, currentY() + move);
    // The lift waits for the medallion: scrolling down stops at the gate.
    if (move > 0 && blockedByGate(target)) {
      target = Math.max(currentY(), gateY());
      queued = 0;
    }
    setY(target);
    if (Math.abs(queued) > 0.5) frame = requestAnimationFrame(step);
    else {
      queued = 0;
      frame = 0;
    }
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || ownsScroll(e.target) || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    // Free roam: the wheel doesn't scroll the journey.
    if (roam.active) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const cap = MAX_QUEUED_SCREENS * window.innerHeight;
    queued = Math.max(-cap, Math.min(cap, queued + pixels(e)));
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  // Page Up / Page Down go through the same speed limit (a screen each), instead of jumping.
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "PageDown" && e.key !== "PageUp") return;
    if (roam.active || e.altKey || e.ctrlKey || e.metaKey || ownsScroll(e.target)) return;
    e.preventDefault();
    const cap = MAX_QUEUED_SCREENS * window.innerHeight;
    queued = Math.max(-cap, Math.min(cap, queued + (e.key === "PageDown" ? 1 : -1) * window.innerHeight * 0.9));
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    cancelAnimationFrame(frame);
  };
}
