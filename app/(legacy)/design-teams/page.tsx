import Image from "next/image";
import PageHeader from "@/components/PageHeader";

const logos = [
  ["qvex.jpg", "QVEX", "object-cover"],
  ["QSDT_Logo-1.jpg", "Queen’s Solar Design Team", "object-cover"],
  ["QBMET_Logo-1.jpg", "QBMET", "object-cover"],
  ["engsoc.jpg", "EngSoc", "object-cover"],
  ["qret.jpg", "QRET", "object-contain"],
] as const;

export default function DesignTeamsPage() {
  return (
    <>
      <PageHeader label="Design Teams" title="Teams I’m part of">
        <p className="text-gray-600">
          I’m currently in 4 design teams and one club for videography for EngSoc.
        </p>
      </PageHeader>
      <section className="px-8 pb-16">
        <div className="mx-auto max-w-6xl columns-3xs gap-10">
          {logos.map(([file, alt, fit]) => (
            <Image
              key={file}
              className={`mb-4 aspect-3/2 w-full ${fit}`}
              src={`/logos/${file}`}
              alt={alt}
              width={600}
              height={400}
            />
          ))}
        </div>
      </section>
    </>
  );
}
