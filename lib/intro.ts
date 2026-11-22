// Beats of chapter I, as progress through the intro (0–1). Read by the canvas and overlays.
export const INTRO = {
  /** Void: embers, short lines, the light rising. */
  voidEnd: 0.38,
  /** Flash to white peaks here; the ground turns ivory and the name appears. */
  flashPeak: 0.46,
  flashEnd: 0.58,
  /** Name and sun fade out from here into chapter II. */
  fadeOutStart: 0.85,
  /** Snap window: resting inside it scrolls to one side, so the flash is never left half-done. */
  snapFrom: 0.3,
  snapTo: 0.62,
} as const;

export function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** White flash strength (0–1) at journey position `p`. */
export function flashAmount(p: number) {
  if (p <= INTRO.voidEnd || p >= INTRO.flashEnd) return 0;
  return p < INTRO.flashPeak
    ? smoothstep(INTRO.voidEnd, INTRO.flashPeak, p)
    : 1 - smoothstep(INTRO.flashPeak, INTRO.flashEnd, p);
}

/** Opacity of the name mark and sun (0–1) at journey position `p`. */
export function radianceAmount(p: number) {
  if (p < INTRO.flashPeak) return 0;
  return 1 - smoothstep(INTRO.fadeOutStart, 1, p);
}
