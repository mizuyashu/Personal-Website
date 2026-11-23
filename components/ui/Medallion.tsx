"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { medallionCopy } from "@/content/site";
import { CORRIDOR } from "@/lib/corridor";
import { blockedByGate, currentScrollY, endHold, gateY, interruptRide, medallion, setScrollY, startHold, tap, useMedallion } from "@/lib/medallion";
import { useReducedMotion } from "@/lib/motion";
import { onJourneyPosition } from "@/lib/scroll";
import CompassStar from "./CompassStar";
import styles from "./Medallion.module.css";

/** How long to wait at the gate before the hint fades in (ms). */
const HINT_DELAY = 2500;
/** A press shorter than this counts as a tap. */
const TAP_MS = 220;

// The medallion at the great lift (docs/vision.md §19, lib/medallion.ts): a game-style
// prompt and button that appear when you stand on the lift. The lift waits: scrolling down
// stops here until you raise the medallion (hold, or tap repeatedly). Not with reduced motion.
export default function Medallion() {
  const reducedMotion = useReducedMotion();
  const { progress, raised } = useMedallion();
  const [atGate, setAtGate] = useState(false);
  const [hint, setHint] = useState(false);
  const touch = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
  const pressedAt = useRef(0);

  // Show at the gate (standing on the lift), until raised.
  useEffect(() => {
    if (reducedMotion) return;
    const gate = 1 + CORRIDOR.tiltEnd;
    return onJourneyPosition((p) => {
      const here = p > gate - 0.02 && p < gate + 0.03;
      setAtGate(here);
      if (!here) setHint(false);
    });
  }, [reducedMotion]);

  useEffect(() => {
    if (!atGate || raised) return;
    const timer = window.setTimeout(() => setHint(true), HINT_DELAY);
    return () => window.clearTimeout(timer);
  }, [atGate, raised]);

  // The gate: scrolling down stops at the lift until the medallion is raised. ScrollSmoother
  // doesn't honour a cancelled wheel, so the gate also holds the line: if the visitor's own
  // input (wheel, touch, keys) carries the page past the gate from below, it settles back on the
  // gate (a few pixels; never toward the start). Jumps (compass, chapter keys) pass freely.
  useEffect(() => {
    if (reducedMotion) return;
    let touchY = 0;
    let lastInput = 0;
    let below = true;
    const stopAtGate = onJourneyPosition(() => {
      if (medallion.raised) return;
      const gate = gateY();
      const y = currentScrollY();
      if (below && y > gate + 1 && performance.now() - lastInput < 500) {
        setScrollY(gate);
        return;
      }
      below = y <= gate + 1;
    });
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) interruptRide();
      lastInput = performance.now();
      if (e.deltaY > 0 && blockedByGate(currentScrollY() + e.deltaY)) e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
      interruptRide();
    };
    const onTouchMove = (e: TouchEvent) => {
      lastInput = performance.now();
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y; // finger up = scroll down
      if (dy > 0 && blockedByGate(currentScrollY() + dy)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const atTheGate = !medallion.raised && Math.abs(currentScrollY() - gateY()) < window.innerHeight * 0.6;
      // Hold Space, M or Enter at the gate to raise the medallion.
      const raiseKey = e.key === " " || e.key === "Enter" || e.code === "KeyM";
      if (atTheGate && raiseKey && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        if (e.type === "keydown" && !e.repeat) startHold();
        if (e.type === "keyup") endHold();
        return;
      }
      if (e.type !== "keydown") return;
      if (["ArrowDown", "PageDown", "End", " "].includes(e.key)) {
        lastInput = performance.now();
        interruptRide();
        if (blockedByGate(currentScrollY() + window.innerHeight * 0.5)) e.preventDefault();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      stopAtGate();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;
  const shown = atGate && !raised;

  return (
    <div className={styles.wrap} data-shown={shown} data-raised={raised} aria-hidden={!shown}>
      <p className={styles.hint} data-shown={hint && shown}>
        {touch ? medallionCopy.hintTouch : medallionCopy.hintDesktop}
      </p>
      <button
        type="button"
        className={styles.medallion}
        tabIndex={shown ? 0 : -1}
        aria-label={medallionCopy.label}
        style={{ "--charge": progress } as React.CSSProperties}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pressedAt.current = performance.now();
          startHold();
        }}
        onPointerUp={() => {
          endHold();
          if (performance.now() - pressedAt.current < TAP_MS) tap();
        }}
        onPointerCancel={() => endHold()}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter" || e.code === "KeyM") && !e.repeat) {
            e.preventDefault();
            startHold();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter" || e.code === "KeyM") endHold();
        }}
      >
        <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden focusable="false">
          <circle cx="50" cy="50" r="46" className={styles.track} />
          <circle cx="50" cy="50" r="46" className={styles.fill} pathLength={1} />
        </svg>
        <CompassStar className={styles.star} />
      </button>
      <p className={styles.label}>{medallionCopy.label}</p>
    </div>
  );
}
