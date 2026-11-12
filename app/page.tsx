import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar/>
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
        
        <div className="columns-3xs gap-4">
          <Image className="aspect-3/2 w-full object-cover mb-4" src="/logo/Queens.jpg" alt="queens" width={600} height={400}/>
          <Image className="aspect-3/2 w-full object-cover mb-4" src="/logo/qvex.jpg" alt="qvex" width={600} height={400}/>
          <Image className="aspect-3/2 w-full object-cover mb-4" src="/logo/QSDT_Logo-1.jpg" alt="solar" width={600} height={400} />
          <Image className="aspect-3/2 w-full object-cover mb-4" src="/logo/QBMET_Logo-1.jpg" alt="qbmet" width={600} height={400} />
          <Image src="/logos/qret.jpg" alt="qret" width={600} height={400} />
          <Image className="aspect-3/2 w-full object-cover mb-4" src="/logo/engsoc.jpg" alt="engsoc" width={600} height={400} />
        
        </div> 
      
        <section className="bg-[#031d3a] px-8 py-24 text-white">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-5xl font-black">Current projects Im working on.</h2>
            <div className="grid gap-px md:grid-cols-2">
              <div className="bg-[#052a50] p-10">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-300">ESP32</p>
                <p className="mt-8 text-7xl font-black">ESP 32 hopefully in the future</p>
              </div>
              <div className="bg-[#0b3a66] p-10">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-300">STM32</p>
                <p className="mt-8 text-7xl font-black">Hopefully some work with firmware</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f1ea] px-8 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-6xl font-black text-[#0a2a52]">
              Something here.
              <br />
              <span className="text-red-600">Another thing ig.</span>
            </h2>
            <p className="flex justify-end mt-10 max-w-2xl text-gray-600 md:ml-auto">Paragraph pushed to the right.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}