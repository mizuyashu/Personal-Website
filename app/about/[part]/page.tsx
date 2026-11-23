import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPage from "@/components/subpage/SubPage";
import { aboutPart, aboutParts } from "@/content/about";
import { site } from "@/content/site";

// An About part's own page (games, music, the cat, moments), for direct links and reloads
// (docs/vision.md §18). Opened from the journey, the intercepted version in app/@modal shows instead.
export function generateStaticParams() {
  return aboutParts.map((part) => ({ part: part.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ part: string }> }): Promise<Metadata> {
  const { part } = await params;
  const found = aboutPart(part);
  return { title: found ? `${found.title} · ${site.name}` : site.name };
}

export default async function AboutPage({ params }: { params: Promise<{ part: string }> }) {
  const { part } = await params;
  if (!aboutPart(part)) notFound();
  return <SubPage kind="about" id={part} mode="page" />;
}
