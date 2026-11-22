// Beats of chapter II, as progress through the Projects chapter (0–1). The chapter is
// PROJECTS_SCREENS long: walk the cathedral corridor → tilt up to the skylight → rise into it
// as the grid turns cobalt (the blueprint) → hold while the projects scroll past →
// rise through the skylight into the open sky (chapter III).
export const PROJECTS_SCREENS = 8;

export const CORRIDOR = {
  walkEnd: 0.22,
  tiltEnd: 0.3,
  riseEnd: 0.375,
  exitStart: 0.91,
} as const;

/** Screens of the blueprint hold, where the projects HTML lives. */
export const BLUEPRINT_SCREENS = (CORRIDOR.exitStart - CORRIDOR.riseEnd) * PROJECTS_SCREENS;
