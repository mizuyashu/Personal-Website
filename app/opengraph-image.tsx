import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { CompassMark, googleFont } from "@/lib/og";
import { palette } from "@/lib/palette";

// The share card (Open Graph; twitter-image re-exports it): the moment after the flash. The
// compass-star sun risen out of the void, the two-tier name mark under it. Generated at build
// from the palette and the master symbol, so it changes when site.ts does.

export const alt = `${site.name}: ${site.epithet}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A few far, faint stars (fixed, so the card never changes between builds).
const STARS = [
  [84, 92, 2], [212, 470, 1.5], [318, 140, 1.5], [402, 548, 2], [540, 64, 1.5], [688, 560, 1.5],
  [790, 118, 2], [930, 486, 1.5], [1030, 84, 1.5], [1118, 352, 2], [150, 300, 1.5], [1062, 566, 1.5],
] as const;

export default async function OpenGraphImage() {
  const title = site.name.toUpperCase();
  const tier = site.nameTier.toUpperCase();
  const [cinzel, cormorant] = await Promise.all([
    googleFont("Cinzel", 600, title + tier),
    googleFont("Cormorant Garamond", 500, site.epithet, true),
  ]);
  const fonts = [
    ...(cinzel ? [{ name: "Cinzel", data: cinzel, weight: 600 as const, style: "normal" as const }] : []),
    ...(cormorant ? [{ name: "Cormorant", data: cormorant, weight: 500 as const, style: "italic" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: `radial-gradient(ellipse 70% 85% at 50% 34%, #3a2a12 0%, ${palette.navy} 38%, ${palette.ink} 78%)`,
          color: palette.ivory,
        }}
      >
        {STARS.map(([x, y, r], i) => (
          <div
            key={i}
            style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: palette.ivory, opacity: 0.55 }}
          />
        ))}
        {/* The sun's halo behind the mark */}
        <div
          style={{
            position: "absolute",
            left: 600 - 210,
            top: 196 - 210,
            width: 420,
            height: 420,
            borderRadius: 210,
            background: `radial-gradient(circle, rgba(242,196,90,0.55) 0%, rgba(242,196,90,0.16) 38%, rgba(242,196,90,0) 70%)`,
          }}
        />
        <div style={{ display: "flex", marginTop: -24 }}>
          <CompassMark size={196} />
        </div>
        <div style={{ display: "flex", marginTop: 26, fontFamily: "Cinzel", fontSize: 22, letterSpacing: 9, color: palette.gold }}>{tier}</div>
        <div style={{ display: "flex", marginTop: 4, fontFamily: "Cinzel", fontSize: 92, fontWeight: 600, letterSpacing: 10 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 6, fontFamily: "Cormorant", fontStyle: "italic", fontSize: 34, color: palette.lavender }}>
          {site.epithet}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, display: "flex", background: palette.cobalt }} />
      </div>
    ),
    { ...size, fonts },
  );
}
