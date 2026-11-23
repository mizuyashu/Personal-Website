// Beats of chapter IV (About: the embers), as progress through the chapter (0–1).
// The descent opens it: a gold ornament frame (held a while) → dissolves into bokeh → white →
// dark, then the letterbox closes for the chapter and opens again as it ends.
// 2026-11-23: the frame and bokeh were lengthened (Michael likes that part); the chapter grew
// from 4.5 to 5 screens so the panels keep the same room.
export const ABOUT_SCREENS = 5;

export const DESCENT = {
  frameIn: 0.0,
  frameFull: 0.05,
  /** The frame holds, full, until here; then it dissolves into bokeh. */
  frameHold: 0.1,
  bokeh: 0.17,
  whitePeak: 0.215,
  dark: 0.27,
  letterboxClosed: 0.33,
  letterboxOpen: 0.96,
} as const;
