"use client";

import { useSyncExternalStore } from "react";

// "Your own star" (docs/vision.md §17): the empty socket in the void's dying sky is yours.
// Finishing the skill constellation in chapter III earns it (stage 1: a cold point of starlight);
// the ending's sword raised to the stars, its lines fired into your constellation, makes it
// radiant (stage 2: gold). Remembered across visits, so "Begin again" (or coming back) shows the
// star you earned in the dying sky. The void reads `ownStarStage()` every frame.

export type StarStage = 0 | 1 | 2;
const STORAGE_KEY = "own-star";

let stage: StarStage = 0;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved === 1 || saved === 2) stage = saved;
  } catch {
    // Storage blocked: the star lasts for this visit.
  }
}

export function ownStarStage(): StarStage {
  load();
  return stage;
}

/** Raise the star to at least `next` (it never goes back down). */
export function earnStar(next: StarStage) {
  load();
  if (next <= stage) return;
  stage = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(stage));
  } catch {
    // Storage blocked: the star lasts for this visit.
  }
  listeners.forEach((l) => l());
}

export function useOwnStar(): StarStage {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    ownStarStage,
    () => 0,
  );
}
