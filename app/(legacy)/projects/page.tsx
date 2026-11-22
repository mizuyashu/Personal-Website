import PageHeader from "@/components/PageHeader";

export default function ProjectsPage() {
  return (
    <>
      <PageHeader label="Projects" title="Current projects I’m working on" />
      <section className="bg-[#031d3a] px-8 py-24 text-white">
        <div className="mx-auto grid max-w-6xl gap-px md:grid-cols-2">
          <div className="bg-[#052a50] p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-300">ESP32</p>
            <p className="mt-8 text-7xl font-black">ESP32 hopefully in the future</p>
          </div>
          <div className="bg-[#0b3a66] p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-300">STM32</p>
            <p className="mt-8 text-7xl font-black">Hopefully some work with firmware</p>
          </div>
        </div>
      </section>
    </>
  );
}
