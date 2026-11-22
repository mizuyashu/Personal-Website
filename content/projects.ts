// Chapter II copy and project data. Everything marked TODO(content) is a placeholder:
// Michael fills it in once the site's structure is done. Never invent project details here.

export type SpecRow = { label: string; value: string };

export type Project = {
  id: string;
  /** Card number (Roman numeral in the hex badge). */
  numeral: string;
  title: string;
  /** Kind of build; decides the presentation format. */
  format: "device" | "exploded";
  /** Short line under the title on the card. */
  tagline: string;
  /** Status stamp on the card and panel. */
  status: string;
  /** Card frame colour (palette name). */
  frame: "cobalt" | "gold" | "teal" | "violet";
  summary: string;
  specs: SpecRow[];
  outcome: string;
  link?: { label: string; href: string };
};

export const projectsCopy = {
  intro: "TODO(content): one line introducing the projects.",
  pickCard: "Choose a card",
  specTitle: "Spec sheet",
  outcomeLabel: "Outcome",
  formatLabels: { device: "Device frame", exploded: "Exploded view" },
  screensPending: "TODO(content): screenshots",
  cadPending: "TODO(content): CAD export",
  close: "Close window",
  open: "Open window",
} as const;

const pendingSpecs: SpecRow[] = [
  { label: "Stack / materials", value: "TODO(content)" },
  { label: "Hours", value: "TODO(content)" },
  { label: "Tools", value: "TODO(content)" },
  { label: "What failed", value: "TODO(content)" },
  { label: "Lessons", value: "TODO(content)" },
];

export const projects: readonly Project[] = [
  {
    id: "website",
    numeral: "I",
    title: "The Website",
    format: "device",
    tagline: "Coding project",
    status: "In progress",
    frame: "cobalt",
    // TODO(content): Michael's separate website (unfinished). Link and write-up come later; no real source code is shown.
    summary: "TODO(content): what the website is and why it exists.",
    specs: pendingSpecs,
    outcome: "TODO(content)",
  },
  {
    id: "summer-build",
    numeral: "II",
    title: "The Summer Build",
    format: "exploded",
    tagline: "ESP32 · STM32 firmware",
    status: "Coming soon",
    frame: "gold",
    // Planned for summer, not started yet: show as upcoming only.
    summary: "Under construction. Planned for the summer.",
    specs: pendingSpecs,
    outcome: "Coming soon",
  },
];
