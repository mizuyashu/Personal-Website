import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="bg-[#f5f1ea] px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-6xl font-black text-[#0a2a52]">
            Hi, Im Michael.
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-600">
            Computer Engineering student at Queens University.
          </p>
          <Link href="/projects" className="mt-8 inline-block bg-red-600 px-6 py-3 font-bold text-white">
            See my projects
          </Link>
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="mx-auto columns-3xs max-w-10xl gap-10">
          {[
            ["Queens.jpg", "Queen's", "object-cover"],
            ["qvex.jpg", "QVEX", "object-cover"],
            ["QSDT_Logo-1.jpg", "Solar", "object-cover"],
            ["QBMET_Logo-1.jpg", "QBMET", "object-cover"],
            ["engsoc.jpg", "EngSoc", "object-cover"],
            ["qret.jpg", "QRET", "object-contain"],
          ].map(([file, alt, fit]) => (
            <Image
              key={file}
              className={`mb-4 aspect-3/2 w-full ${fit}`}
              src={`/logos/${file}`}
              alt={alt}
              width={600}
              height={400}
              unoptimized
            />
          ))}
        </div>
      </section>
    </>
  );
}