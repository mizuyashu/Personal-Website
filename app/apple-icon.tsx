import { ImageResponse } from "next/og";
import { CompassMark } from "@/lib/og";
import { palette } from "@/lib/palette";

// Home-screen icon (iOS): the master symbol on ink, full-bleed (iOS rounds the corners itself).
// The browser-tab icon is app/icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 50% 50%, ${palette.navy} 0%, ${palette.ink} 72%)`,
        }}
      >
        <CompassMark size={148} />
      </div>
    ),
    size,
  );
}
