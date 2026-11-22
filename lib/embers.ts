// Beats of chapter IV (About: the embers), as progress through the chapter (0–1).
// The descent opens it: a gold ornament frame → dissolves into bokeh → white → dark,
// then the letterbox closes for the chapter and opens again as it ends.
export const ABOUT_SCREENS = 4.5;

export const DESCENT = {
  frameIn: 0.0,
  frameFull: 0.05,
  bokeh: 0.11,
  whitePeak: 0.15,
  dark: 0.21,
  letterboxClosed: 0.27,
  letterboxOpen: 0.96,
} as const;
