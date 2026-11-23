// Beats of chapter V (Contact: bonfire → ascent), as progress through the chapter (0–1).
export const CONTACT_SCREENS = 4;

export const BONFIRE = {
  /** The fire kindles as you arrive: a slow build-up and a gentle swell (not a pop), sparks lift. */
  igniteStart: 0,
  igniteEnd: 0.34,
  /** Golden sky flash. */
  flashStart: 0.5,
  flashPeak: 0.58,
  /** Sword to the stars; constellation lines draw from its tip. */
  swordIn: 0.6,
  linesStart: 0.64,
  linesEnd: 0.82,
  /** Fade to ivory: the journey ends in light. */
  ivoryStart: 0.86,
  ivoryEnd: 0.98,
} as const;

/** The bonfire's swell as it kindles (0 → ~0.15 → 0 across the ignition): gentle, late, no pop. */
export function kindleSwell(ignite: number) {
  const t = Math.min(1, Math.max(0, (ignite - 0.45) / 0.55));
  return Math.sin(Math.PI * t) * 0.15;
}
