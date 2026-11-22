"use client";

// Tells the loader when the 3D world has started. Later chapters can add asset progress here.
let worldReady = false;
const waiting = new Set<() => void>();

export function markWorldReady() {
  if (worldReady) return;
  worldReady = true;
  waiting.forEach((resolve) => resolve());
  waiting.clear();
}

export function whenWorldReady(): Promise<void> {
  if (worldReady) return Promise.resolve();
  return new Promise((resolve) => waiting.add(resolve));
}
