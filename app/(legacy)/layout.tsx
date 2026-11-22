import type { ReactNode } from "react";
import "./legacy.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Old multi-page site. Deleted once the M1 journey replaces it (see CLAUDE.md).
export default function LegacyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f1ea] font-sans text-[#0a2a52]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
