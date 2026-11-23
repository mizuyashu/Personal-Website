import type { Metadata } from "next";
import type { ReactNode } from "react";
import WorldLoader from "@/components/canvas/WorldLoader";
import FpsMeter from "@/components/ui/FpsMeter";
import { Cinzel, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
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

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
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
