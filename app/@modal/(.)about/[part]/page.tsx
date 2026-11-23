import { notFound } from "next/navigation";
import SubPage from "@/components/subpage/SubPage";
import { aboutPart } from "@/content/about";

// An About part opened from the journey: shown over it (the journey stays mounted underneath),
// so closing returns exactly where you were (docs/vision.md §18).
export default async function AboutModal({ params }: { params: Promise<{ part: string }> }) {
  const { part } = await params;
  if (!aboutPart(part)) notFound();
  return <SubPage kind="about" id={part} mode="modal" />;
}
