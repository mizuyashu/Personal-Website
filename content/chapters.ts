import type { PaletteName } from "@/lib/palette";

// The journey, in order (docs/vision.md §8). Colours are M1 placeholders per chapter world.
export type Chapter = {
  id: string;
  numeral: string;
  title: string;
  world: string;
  background: PaletteName;
  foreground: PaletteName;
  accent: PaletteName;
};

export const chapters: readonly Chapter[] = [
  { id: "intro", numeral: "I", title: "Intro", world: "Void → radiance", background: "ink", foreground: "ivory", accent: "gold" },
  { id: "projects", numeral: "II", title: "Projects", world: "The blueprint", background: "ivory", foreground: "cobalt", accent: "cobalt" },
  { id: "education", numeral: "III", title: "Education", world: "The dawn", background: "sky", foreground: "navy", accent: "gold" },
  { id: "about", numeral: "IV", title: "About", world: "The embers", background: "ink", foreground: "ivory", accent: "ember" },
  { id: "contact", numeral: "V", title: "Contact", world: "Bonfire → ascent", background: "navy", foreground: "ivory", accent: "gold" },
];
