import type { PaletteName } from "@/lib/palette";

// The journey, in order (docs/vision.md §8). Colours are placeholders until each chapter's milestone.
export type Chapter = {
  id: string;
  numeral: string;
  title: string;
  world: string;
  /** Ground colour (chapter I starts in the void and turns to this after the flash). */
  background: PaletteName;
  foreground: PaletteName;
  accent: PaletteName;
  /** Scroll length in screens. */
  screens: number;
};

export const chapters: readonly Chapter[] = [
  { id: "intro", numeral: "I", title: "Intro", world: "Void → radiance", background: "ivory", foreground: "ivory", accent: "gold", screens: 3.5 },
  { id: "projects", numeral: "II", title: "Projects", world: "The blueprint", background: "ivory", foreground: "cobalt", accent: "cobalt", screens: 2 },
  { id: "education", numeral: "III", title: "Education", world: "The dawn", background: "sky", foreground: "navy", accent: "gold", screens: 2 },
  { id: "about", numeral: "IV", title: "About", world: "The embers", background: "ink", foreground: "ivory", accent: "ember", screens: 2 },
  { id: "contact", numeral: "V", title: "Contact", world: "Bonfire → ascent", background: "navy", foreground: "ivory", accent: "gold", screens: 2 },
];
