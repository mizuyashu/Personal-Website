// Site-wide copy. Name-mark words and epithet are open (docs/vision.md §16 Q3).
export const site = {
  // TODO(content): final name-mark words.
  name: "Michael",
  // TODO(content): final epithet. "an engineer who builds worlds" is a placeholder.
  epithet: "an engineer who builds worlds",
  description:
    "Michael’s portfolio: a climb from the void into radiance, through engineering projects, education and the embers.",
} as const;

// Labels for the corner menu and compass nav.
export const ui = {
  menu: "Menu",
  closeMenu: "Close menu",
  quality: "Quality",
  qualityAuto: "Auto",
  qualityFull: "Full",
  qualityLite: "Lite",
  compass: "Chapters",
  closeCompass: "Close chapters",
} as const;
