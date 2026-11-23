import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubPage from "@/components/subpage/SubPage";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

// A project's own page, for direct links and reloads (docs/vision.md §18). Opened from the
// journey, the intercepted version in app/@modal shows instead.
export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  return { title: project ? `${project.title} · ${site.name}` : site.name };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!projects.some((p) => p.id === id)) notFound();
  return <SubPage kind="project" id={id} mode="page" />;
}
