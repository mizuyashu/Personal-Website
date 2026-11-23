import { notFound } from "next/navigation";
import SubPage from "@/components/subpage/SubPage";
import { education } from "@/content/education";

// An education year opened from the journey: shown over it (docs/vision.md §18).
export default async function YearModal({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  if (!education.timeline.some((t) => t.id === year)) notFound();
  return <SubPage kind="year" id={year} mode="modal" />;
}
