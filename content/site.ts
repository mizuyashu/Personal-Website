// Site-wide copy. Name-mark words and epithet are open (docs/vision.md §16 Q3).
export const site = {
  // TODO(content): final name-mark words.
  name: "Michael",
  // TODO(content): the small line above the name (two-tier name mark). "Eminence" is a candidate word.
  nameTier: "Toward Eminence",
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
  scrollHint: "Scroll",
  loading: "Loading",
  beginAgain: "Begin again",
  /** Free roam (components/ui/RoamHud.tsx): the corner menu's Explore switch and the HUD. */
  explore: "Explore",
  guided: "Guided",
  freeRoam: "Free roam",
  roamHint: "W S walk · A D turn · Q E step · drag to look",
  roamHintTouch: "Use the pad to walk · drag to look",
  roamExit: "Return to the journey",
} as const;

// Video-game controls (components/ui/GameControls.tsx): the prompt card's rows.
export const controls = {
  title: "Controls",
  /** Shown under "Begin again" at the end of the journey (desktop). */
  endTitle: "Explore again with the controls",
  keyboard: [
    { keys: ["W", "S"], action: "Move" },
    { keys: ["Q", "E"], action: "Chapter" },
    { keys: ["1–5"], action: "Jump" },
    { keys: ["H"], action: "Controls" },
  ],
  gamepad: [
    { keys: ["A", "B"], action: "Move" },
    { keys: ["LB", "RB"], action: "Chapter" },
    { keys: ["L-stick"], action: "Glide" },
    { keys: ["Start"], action: "Chapters" },
  ],
} as const;

// The medallion at the great lift (components/ui/Medallion.tsx).
export const medallionCopy = {
  label: "Raise the medallion",
  hintDesktop: "Hold Space or M, or click and hold",
  hintTouch: "Hold, or tap again and again",
} as const;
