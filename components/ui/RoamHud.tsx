"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ui } from "@/content/site";
import { look, roam, stopRoam, useRoam } from "@/lib/roam";
import { useReducedMotion } from "@/lib/motion";
import styles from "./RoamHud.module.css";

// Free roam's controls and HUD (lib/roam.ts). Keyboard: W/S or ↑/↓ walk, A/D or ←/→ turn, Q/E
// step sideways, drag to look, Esc returns. Gamepad: left stick walks, right stick looks, B
// returns. Touch: an on-screen pad and drag to look. Only active while roaming.

type Hold = "forward" | "back" | "left" | "right";

export default function RoamHud() {
  const active = useRoam();
  const reducedMotion = useReducedMotion();
  const touch = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
  const held = useRef(new Set<string>());

  useEffect(() => {
    if (!active) return;
    const keys = held.current;
    const apply = () => {
      roam.forward = (keys.has("forward") ? 1 : 0) - (keys.has("back") ? 1 : 0);
      roam.turn = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
      roam.strafe = (keys.has("stepRight") ? 1 : 0) - (keys.has("stepLeft") ? 1 : 0);
    };
    const map: Record<string, string> = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "back",
      ArrowDown: "back",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      KeyQ: "stepLeft",
      KeyE: "stepRight",
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopRoam(reducedMotion);
        return;
      }
      const action = map[e.code];
      if (!action) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      keys.add(action);
      apply();
    };
    const onUp = (e: KeyboardEvent) => {
      const action = map[e.code];
      if (!action) return;
      keys.delete(action);
      apply();
    };
    // Drag to look (anywhere but on controls).
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest("button, a, input, [data-roam-ui]")) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      look(-(e.clientX - lastX) * 0.0045, -(e.clientY - lastY) * 0.0045);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    // Gamepad: left stick walks, right stick looks, B returns.
    let frame = 0;
    let last = performance.now();
    const poll = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
      if (pad) {
        const dead = (v: number) => (Math.abs(v) < 0.18 ? 0 : v);
        const lx = dead(pad.axes[0] ?? 0);
        const ly = dead(pad.axes[1] ?? 0);
        const rx = dead(pad.axes[2] ?? 0);
        const ry = dead(pad.axes[3] ?? 0);
        if (lx || ly) {
          roam.forward = -ly;
          roam.strafe = lx;
        } else if (!keys.size) {
          roam.forward = 0;
          roam.strafe = 0;
        }
        if (rx || ry) look(-rx * 2.2 * dt, -ry * 1.6 * dt);
        if (pad.buttons[1]?.pressed) stopRoam(reducedMotion);
      }
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      keys.clear();
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [active, reducedMotion]);

  if (!active) return null;

  // Touch pad buttons: held down while pressed.
  const pad = (dir: Hold, label: string) => (
    <button
      type="button"
      className={styles.padButton}
      data-dir={dir}
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        held.current.add(dir);
        roam.forward = (held.current.has("forward") ? 1 : 0) - (held.current.has("back") ? 1 : 0);
        roam.turn = (held.current.has("right") ? 1 : 0) - (held.current.has("left") ? 1 : 0);
      }}
      onPointerUp={() => {
        held.current.delete(dir);
        roam.forward = (held.current.has("forward") ? 1 : 0) - (held.current.has("back") ? 1 : 0);
        roam.turn = (held.current.has("right") ? 1 : 0) - (held.current.has("left") ? 1 : 0);
      }}
    >
      <span aria-hidden>{{ forward: "▲", back: "▼", left: "◀", right: "▶" }[dir]}</span>
    </button>
  );

  return (
    <div className={styles.hud} data-roam-ui>
      <div className={styles.card}>
        <span className={styles.title}>{ui.freeRoam}</span>
        <span className={styles.hint}>{touch ? ui.roamHintTouch : ui.roamHint}</span>
        <button type="button" className={styles.exit} onClick={() => stopRoam(reducedMotion)}>
          {ui.roamExit} {!touch && <kbd>Esc</kbd>}
        </button>
      </div>
      {touch && (
        <div className={styles.pad}>
          {pad("forward", "Walk forward")}
          {pad("left", "Turn left")}
          {pad("right", "Turn right")}
          {pad("back", "Walk back")}
        </div>
      )}
    </div>
  );
}
