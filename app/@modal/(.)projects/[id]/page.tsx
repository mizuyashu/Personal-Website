import { notFound } from "next/navigation";
import SubPage from "@/components/subpage/SubPage";
import { projects } from "@/content/projects";

// A project page opened from the journey: shown over it (the journey stays mounted underneath),
// so closing returns exactly where you were (docs/vision.md §18).
export default async function ProjectModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!projects.some((p) => p.id === id)) notFound();
  return <SubPage kind="project" id={id} mode="modal" />;
}
