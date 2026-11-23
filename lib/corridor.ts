import { projects } from "@/content/projects";
import { clamp01 } from "@/lib/intro";

// Beats of chapter II, as progress through the Projects chapter (0–1). The chapter is
// PROJECTS_SCREENS long: round the corner into the nave → hold (read II) → walk the nave → tilt up at the crossing → the lift: a slow,
// heavy creep, then it surges up the lantern tower toward the skylight → arrive: blinding light
// that turns into the blueprint → hold while the projects scroll past → rise through the
// skylight into the open sky (chapter III).
export const PROJECTS_SCREENS = 10;

export const CORRIDOR = {
  /** Along the narthex and round the corner (to the left) into the nave. */
  cornerEnd: 0.095,
  /** Standing at the head of the nave, reading the numeral II before the walk. */
  entryHold: 0.13,
  walkEnd: 0.26,
  /** Standing on the lift, looking up the tower. The medallion; then the lift starts. */
  tiltEnd: 0.295,
  /** End of the slow creep; the lift surges from here. */
  liftSurge: 0.335,
  /** The lift reaches the top: the skylight fills the view and turns into the blueprint. */
  arrive: 0.47,
  riseEnd: 0.495,
  exitStart: 0.93,
} as const;

/** Screens of the blueprint hold, where the projects HTML lives. */
export const BLUEPRINT_SCREENS = (CORRIDOR.exitStart - CORRIDOR.riseEnd) * PROJECTS_SCREENS;

/**
 * Rows of the blueprint hold (CSS grid fr units): the header, the card index, then one per
 * project. Projects.tsx sets the grid from this, so the 3D reveals below line up with the HTML.
 */
export const BLUEPRINT_ROWS = [0.95, 1.1, ...projects.map(() => 1.1)];

/** Hold progress (0–1) where the gap before row `row` crosses the middle of the screen. */
function rowGapAt(row: number) {
  const total = BLUEPRINT_ROWS.reduce((a, b) => a + b, 0);
  const top = BLUEPRINT_ROWS.slice(0, row).reduce((a, b) => a + b, 0) / total;
  return top - 0.5 / BLUEPRINT_SCREENS;
}

/** Centres of the reveal before each project (chapter II progress), and their half-width. */
export const PROJECT_REVEALS = projects.map((_, i) => CORRIDOR.riseEnd + rowGapAt(2 + i) * (CORRIDOR.exitStart - CORRIDOR.riseEnd));
const REVEAL_HALF = 0.055;

/**
 * The reveal before a project at chapter II progress `u`: which one (index into projects, or -1)
 * and how far into it (0 → 1 → 0, peaking as the gap between panels crosses the screen).
 */
export function projectReveal(u: number): { index: number; amount: number; phase: number } {
  for (let i = 0; i < PROJECT_REVEALS.length; i++) {
    const phase = clamp01((u - (PROJECT_REVEALS[i] - REVEAL_HALF)) / (2 * REVEAL_HALF));
    if (phase > 0 && phase < 1) return { index: i, amount: Math.sin(Math.PI * phase) ** 2, phase };
  }
  return { index: -1, amount: 0, phase: 0 };
}
