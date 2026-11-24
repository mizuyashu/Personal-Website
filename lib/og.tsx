// Generated images (next/og): the share card and the Apple touch icon. Both are drawn here from
// the master symbol (8-point compass star in a ring) and the palette, never from saved art.
// Rendered at build time; nothing is fetched per visit.

import { palette } from "@/lib/palette";

/** The 8-point compass star as an SVG polygon in a 100 × 100 box (same as ui/CompassStar). */
export function starPoints(long = 46, mid = 28, inner = 11) {
  return Array.from({ length: 16 }, (_, k) => {
    const angle = (k * Math.PI) / 8 - Math.PI / 2;
    const radius = k % 4 === 0 ? long : k % 2 === 0 ? mid : inner;
    return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

export function CompassMark({ size, ring = palette.gold, star = palette.gold }: { size: number; ring?: string; star?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="35" fill="none" stroke={ring} strokeWidth="3.2" />
      <polygon points={starPoints()} fill={star} />
      <circle cx="50" cy="50" r="3.4" fill={palette.ivory} />
    </svg>
  );
}

/**
 * A Google font as TTF for next/og (satori reads TTF/OTF/WOFF, not WOFF2), subset to `text`.
 * Returns null when offline, so the image falls back to the default font instead of failing the build.
 */
export async function googleFont(family: string, weight: number, text: string, italic = false): Promise<ArrayBuffer | null> {
  try {
    const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${axis}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const font = await fetch(src);
    return font.ok ? await font.arrayBuffer() : null;
  } catch {
    return null;
  }
}
