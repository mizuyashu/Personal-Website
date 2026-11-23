import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPage from "@/components/subpage/SubPage";
import { education } from "@/content/education";
import { site } from "@/content/site";

// An education year's own page, for direct links and reloads (docs/vision.md §18).
export function generateStaticParams() {
  return education.timeline.map((t) => ({ year: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await params;
  const item = education.timeline.find((t) => t.id === year);
  return { title: item ? `${item.when} · ${site.name}` : site.name };
}

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  if (!education.timeline.some((t) => t.id === year)) notFound();
  return <SubPage kind="year" id={year} mode="page" />;
}
