"use client";

import { useEffect, useRef, useState } from "react";
import { chapters } from "@/content/chapters";
import { controls } from "@/content/site";
import { ScrollSmoother } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";
import { journey, scrollToChapter } from "@/lib/scroll";
import styles from "./GameControls.module.css";

// Video-game controls for the journey, on top of normal scrolling (which keeps working).
// Keyboard: W/S step through the journey, Q/E previous/next chapter, 1–5 jump, H shows the card.
// Gamepad (browser Gamepad API): A/B or D-pad step, left stick glides, LB/RB chapters,
// Start opens the chapter compass, Back shows the card. A small prompt card in the game-UI
// style appears the first time a game input is used (or a pad connects), then fades.

type Device = "keyboard" | "gamepad";

/** One step: half a screen. */
const STEP = 0.5;
const STICK_DEADZONE = 0.2;
const STICK_SPEED = 1400; // px per second at full tilt

function currentScroll() {
  return ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
}

function scrollToY(y: number, smooth: boolean) {
  const top = Math.max(0, y);
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(top, smooth);
  else window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
}

function step(direction: 1 | -1, reducedMotion: boolean) {
  scrollToY(currentScroll() + direction * STEP * window.innerHeight, !reducedMotion);
}

/** Next/previous chapter. Back first returns to the start of the current chapter. */
function chapterStep(direction: 1 | -1, reducedMotion: boolean) {
  const index = Math.min(chapters.length - 1, Math.floor(journey.position));
  const progress = journey.position - index;
  const target = direction > 0 ? index + 1 : progress > 0.04 ? index : index - 1;
  const chapter = chapters[Math.max(0, Math.min(chapters.length - 1, target))];
  scrollToChapter(chapter.id, reducedMotion);
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export default function GameControls() {
  const reducedMotion = useReducedMotion();
  const [device, setDevice] = useState<Device>("keyboard");
  const [shown, setShown] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const announced = useRef(false);

  // Show the card for a few seconds (the first game input, a pad connecting, or H / Back).
  const show = useRef((next: Device, force = false) => {
    setDevice(next);
    if (announced.current && !force) return;
    announced.current = true;
    setShown(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShown(false), 5000);
  });

  // Keyboard.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      let handled = true;
      if (key === "s") step(1, reducedMotion);
      else if (key === "w") step(-1, reducedMotion);
      else if (key === "e") chapterStep(1, reducedMotion);
      else if (key === "q") chapterStep(-1, reducedMotion);
      else if (/^[1-9]$/.test(key) && Number(key) <= chapters.length) scrollToChapter(chapters[Number(key) - 1].id, reducedMotion);
      else if (key === "h") show.current("keyboard", true);
      else handled = false;
      if (!handled) return;
      event.preventDefault();
      if (key !== "h") show.current("keyboard");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reducedMotion]);

  // Gamepad: poll while one is connected.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const held = new Set<number>();

    const poll = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (!pad) {
        frame = 0;
        return;
      }
      const pressed = (i: number) => Boolean(pad.buttons[i]?.pressed);
      // Fire once per press.
      const tap = (i: number, action: () => void) => {
        if (pressed(i)) {
          if (!held.has(i)) {
            held.add(i);
            action();
            show.current("gamepad");
          }
        } else held.delete(i);
      };
      tap(0, () => step(1, reducedMotion)); // A
      tap(13, () => step(1, reducedMotion)); // D-pad down
      tap(1, () => step(-1, reducedMotion)); // B
      tap(12, () => step(-1, reducedMotion)); // D-pad up
      tap(5, () => chapterStep(1, reducedMotion)); // RB
      tap(4, () => chapterStep(-1, reducedMotion)); // LB
      tap(9, () => document.querySelector<HTMLButtonElement>("[data-compass-toggle]")?.click()); // Start
      tap(8, () => show.current("gamepad", true)); // Back / Select

      // Left stick glides (reduced motion: no continuous glide; steps still work).
      const y = pad.axes[1] ?? 0;
      if (!reducedMotion && Math.abs(y) > STICK_DEADZONE) {
        const speed = Math.sign(y) * ((Math.abs(y) - STICK_DEADZONE) / (1 - STICK_DEADZONE)) ** 2 * STICK_SPEED;
        const smoother = ScrollSmoother.get();
        const next = Math.max(0, currentScroll() + speed * dt);
        if (smoother) smoother.scrollTop(next);
        else window.scrollTo(0, next);
        show.current("gamepad");
      }
      frame = requestAnimationFrame(poll);
    };

    const start = () => {
      show.current("gamepad");
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(poll);
      }
    };
    window.addEventListener("gamepadconnected", start);
    if (Array.from(navigator.getGamepads?.() ?? []).some(Boolean)) start();
    return () => {
      window.removeEventListener("gamepadconnected", start);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const rows = device === "gamepad" ? controls.gamepad : controls.keyboard;
  return (
    <aside className={styles.card} data-shown={shown} aria-hidden={!shown} aria-label={controls.title}>
      <span className={styles.title}>{controls.title}</span>
      <ul className={styles.rows}>
        {rows.map((row) => (
          <li key={row.action} className={styles.row}>
            <span className={styles.keys}>
              {row.keys.map((k) => (
                <kbd key={k} className={styles.key}>
                  {k}
                </kbd>
              ))}
            </span>
            <span className={styles.action}>{row.action}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
