"use client";

import { useSyncExternalStore } from "react";

// Full / Lite quality (CLAUDE.md "Quality modes").
// Auto: Full on desktop, Lite on phones; steps down once if the frame rate drops.
// Manual: the visitor's choice, saved in localStorage.

export type Quality = "full" | "lite";
export type QualityMode = "auto" | "manual";
export type QualityState = { quality: Quality; mode: QualityMode };

const STORAGE_KEY = "quality";
const SERVER_STATE: QualityState = { quality: "full", mode: "auto" };

let state: QualityState | null = null;
let autoSteppedDown = false;
const listeners = new Set<() => void>();

function readSaved(): Quality | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "full" || value === "lite" ? value : null;
  } catch {
    return null;
  }
}

function save(value: Quality | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode etc.): the choice lasts for this visit only.
  }
}

function isPhone() {
  return window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches;
}

function compute(): QualityState {
  const saved = readSaved();
  if (saved) return { quality: saved, mode: "manual" };
  return { quality: autoSteppedDown || isPhone() ? "lite" : "full", mode: "auto" };
}

function emit() {
  state = compute();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): QualityState {
  state ??= compute();
  return state;
}

export function useQuality(): QualityState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

/** Manual choice from the corner menu. */
export function setQuality(quality: Quality) {
  save(quality);
  emit();
}

/** Back to automatic. */
export function setAutoQuality() {
  save(null);
  emit();
}

/** Called by the performance monitor when the frame rate drops; only acts in Auto. */
export function stepDownAuto() {
  if (getSnapshot().mode !== "auto" || autoSteppedDown) return;
  autoSteppedDown = true;
  emit();
}
