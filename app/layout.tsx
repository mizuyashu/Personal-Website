import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import WorldLoader from "@/components/canvas/WorldLoader";
import FpsMeter from "@/components/ui/FpsMeter";
import { Cinzel, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import { palette } from "@/lib/palette";
import "./globals.css";

// Titles and the name mark.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

// Body text. Placeholder until the body font is chosen (CLAUDE.md).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// STEM labels and coordinates.
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

// Absolute URLs for the share card: Vercel sets the production domain (the custom domain once
// it's attached); local builds fall back to localhost.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

// Icons and the share card are generated from the master symbol: app/icon.svg, app/apple-icon.tsx,
// app/opengraph-image.tsx (+ twitter-image).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.name,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name}: ${site.epithet}`,
    description: site.description,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: ${site.epithet}`,
    description: site.description,
  },
};

// The void's ink behind the browser's own UI (the mobile address bar).
export const viewport: Viewport = {
  themeColor: palette.ink,
};

// The one canvas lives here, so it stays alive on every route (the journey and its sub-pages).
// `modal` is the parallel-route slot where a sub-page opens over the journey (app/@modal).
export default function RootLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${jetbrains.variable}`}
    >
      <body>
        <WorldLoader />
        {children}
        {modal}
        {/* FPS meter: stays at launch (Michael, 2026-11-23); see docs/compatibility.md */}
        <FpsMeter />
      </body>
    </html>
  );
}
