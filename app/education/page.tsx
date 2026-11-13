import Image from "next/image";

export default function Home() {
  return (
    <>
      <main>
        <section className="bg-[#f5f1ea] px-8 py-24">
          <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <span className="h-0.5 w-12 bg-red-600" />
                <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#0a2a52]">
                  About Me
                </span>
              </div>
              <h1 className="text-4xl font-black leading-[0.95] text-[#0a2a52]">
                First year at Queens University
              </h1>
            </div>
            <div className="space-y-4">
              <p className="text-2xl font-bold text-[#0a2a52]">Hi, my name is Michael. I am currently studying Computer Engineering at the University of Queens.</p>
              <p className="text-gray-600">Im currently in 4 design teams and one club for videography for engsoc</p>
            </div>
          </div>
        </section>
        <h1 className="text-5xl text-black font-bold">Hi</h1>
        <p className="text-lg text-black">Welcome to my personal website.</p>
        
          <div className="mx-auto columns-3xs max-w-10xl gap-10">
            {[
              ["Queens.jpg", "Queen's", "object-cover"],
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
      
      </main>
    </>
  )
}