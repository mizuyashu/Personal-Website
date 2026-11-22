import PageHeader from "@/components/PageHeader";

export default function AboutPage() {
  return (
    <PageHeader label="About Me" title="First year at Queen’s University">
      <p className="text-2xl font-bold text-[#0a2a52]">
        Hi, my name is Michael. I’m currently studying Computer Engineering at
        Queen’s University.
      </p>
      <p className="text-gray-600">
        I’m currently in 4 design teams and one club for videography for EngSoc.
      </p>
    </PageHeader>
  );
}
