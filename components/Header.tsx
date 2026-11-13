type Props = {
  label: string;
  title: string;
  intro?: string;
};

export default function PageHeader({ label, title, intro }: Props) {
  return (
    <section className="bg-[#f5f1ea] px-8 py-24">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="h-0.5 w-12 bg-red-600" />
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#0a2a52]">
              {label}
            </span>
          </div>
          <h1 className="text-4xl font-black leading-[0.95] text-[#0a2a52]">
            {title}
          </h1>
        </div>
        {intro && <p className="text-2xl font-bold text-[#0a2a52]">{intro}</p>}
      </div>
    </section>
  );
}