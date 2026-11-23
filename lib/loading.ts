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

// The loader is gone and the page can scroll (it locks scrolling while it shows).
let loaderDone = false;
const afterLoader = new Set<() => void>();

export function markLoaderDone() {
  if (loaderDone) return;
  loaderDone = true;
  afterLoader.forEach((resolve) => resolve());
  afterLoader.clear();
}

export function whenLoaderDone(): Promise<void> {
  if (loaderDone) return Promise.resolve();
  return new Promise((resolve) => afterLoader.add(resolve));
}

export function whenWorldReady(): Promise<void> {
  if (worldReady) return Promise.resolve();
  return new Promise((resolve) => waiting.add(resolve));
}
