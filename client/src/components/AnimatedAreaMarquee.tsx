import { Link } from "wouter";
import { areasTI } from "@/lib/data";

export default function AnimatedAreaMarquee() {
  const items = [...areasTI, ...areasTI];

  return (
    <section className="relative overflow-hidden border-y-2 border-slate-950 bg-[#f8fbff] py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#f8fbff] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#f8fbff] to-transparent" />
      <div className="relative">
        <div className="animate-marquee-left flex w-max gap-3 px-3">
          {items.map((area, index) => (
            <Link
              key={`${area.id}-${index}`}
              href={`/areas/${area.slug}`}
              className="bnt-pressable inline-flex min-w-max items-center gap-2 rounded-2xl border-2 border-slate-950 bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-[4px_4px_0_#c4b5fd] transition hover:-translate-y-1 hover:bg-[#fff7d6] hover:shadow-[5px_5px_0_#FFB800]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-slate-200 bg-violet-50 text-base">{area.emoji}</span>
              {area.nome}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
