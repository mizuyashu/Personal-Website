import Image from "next/image";
import PageHeader from "@/components/PageHeader";

export default function EducationPage() {
  return (
    <>
      <PageHeader label="Education" title="Computer Engineering at Queen’s University" />
      <section className="px-8 pb-16">
        <Image
          className="mx-auto aspect-3/2 w-full max-w-md object-cover"
          src="/logos/Queens.jpg"
          alt="Queen’s University"
          width={600}
          height={400}
        />
      </section>
    </>
  );
}
