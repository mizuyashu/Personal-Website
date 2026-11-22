// Palette tokens (docs/vision.md §5). Mirrored as CSS variables in app/globals.css;
// change both together. Use these in 3D/shader code; use the CSS variables in styles.
export const palette = {
  cobalt: "#2342C8", // STEM, interactive (Projects)
  gold: "#F2C45A", // radiance, titles, the sun
  ivory: "#FFF6E3", // light ground, endings
  ink: "#0B0A0A", // suspense, the void
  sky: "#7CC8F2", // calm, learning (Education)
  ember: "#C8231E", // souls fire; RARE accent
  crimsonViolet: "#4A1630", // bridge fire <-> blue
  violet: "#6B4FD8", // energy, cathedral at night
  lavender: "#B9B4E8",
  navy: "#1B2340", // depth in blue scenes
  rose: "#F2A7B8", // personal accent, sparing
  teal: "#3FB8B0", // rest, crystal glow
} as const;

export type PaletteName = keyof typeof palette;

/** The CSS variable for a palette colour, e.g. "crimsonViolet" → "var(--crimson-violet)". */
export function cssVar(name: PaletteName) {
  return `var(--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`;
}
