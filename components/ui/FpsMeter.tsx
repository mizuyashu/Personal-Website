"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuality } from "@/lib/quality";
import styles from "./FpsMeter.module.css";

// Temporary performance readout (remove before launch, docs/milestones.md M8): frames per
// second, the slowest frame, the canvas's real pixel density, and the quality mode. Top centre. F hides / shows it
// (remembered). Meant for testing on other machines (e.g. the M5 Pro report).

const STORAGE_KEY = "fps-meter";

function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "hidden";
  } catch {
    return false;
  }
}

export default function FpsMeter() {
  const { quality, mode } = useQuality();
  const hiddenOnLoad = useSyncExternalStore(
    () => () => {},
    readHidden,
    () => true,
  );
  const [toggled, setToggled] = useState<boolean | null>(null);
  const hidden = toggled ?? hiddenOnLoad;
  const fps = useRef<HTMLSpanElement>(null);
  const low = useRef<HTMLSpanElement>(null);
  const dpr = useRef<HTMLSpanElement>(null);

  // Count frames; update twice a second. Also track the worst frame in the window (stutter).
  useEffect(() => {
    if (hidden) return;
    let frames = 0;
    let worst = 0;
    let start = performance.now();
    let last = start;
    let raf = 0;
    const tick = (now: number) => {
      frames++;
      worst = Math.max(worst, now - last);
      last = now;
      if (now - start >= 500) {
        const value = Math.round((frames * 1000) / (now - start));
        if (fps.current) {
          fps.current.textContent = String(value);
          fps.current.dataset.level = value >= 55 ? "good" : value >= 30 ? "ok" : "bad";
        }
        if (low.current) low.current.textContent = `${Math.round(worst)} ms`;
        const canvas = document.querySelector("canvas");
        if (dpr.current && canvas && canvas.clientWidth) dpr.current.textContent = `${(canvas.width / canvas.clientWidth).toFixed(2)}×`;
        frames = 0;
        worst = 0;
        start = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hidden]);

  // F toggles it (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      setToggled((current) => {
        const next = !(current ?? readHidden());
        try {
          localStorage.setItem(STORAGE_KEY, next ? "hidden" : "shown");
        } catch {
          // Storage blocked: the choice lasts for this visit.
        }
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (hidden) return null;
  return (
    <div className={styles.meter} aria-hidden>
      <span ref={fps} className={styles.fps}>
        –
      </span>
      <span className={styles.unit}>fps</span>
      <span className={styles.sep}>·</span>
      <span ref={low} className={styles.detail} title="Slowest frame in the last half second">
        – ms
      </span>
      <span className={styles.sep}>·</span>
      <span ref={dpr} className={styles.detail}>
        –
      </span>
      <span className={styles.sep}>·</span>
      <span className={styles.detail}>
        {quality === "full" ? "Full" : "Lite"}
        {mode === "auto" ? " (auto)" : ""}
      </span>
      <span className={styles.hint}>F</span>
    </div>
  );
}
