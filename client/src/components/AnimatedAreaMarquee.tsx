import { Link } from "wouter";
import { areasTI } from "@/lib/data";

export default function AnimatedAreaMarquee() {
  const items = [...areasTI, ...areasTI];

  return (
    <section className="overflow-hidden border-y-2 border-slate-950 bg-violet-100 py-4 text-slate-950">
      <div className="animate-marquee-left flex w-max gap-3">
        {items.map((area, index) => (
          <Link
            key={`${area.id}-${index}`}
            href={`/areas/${area.slug}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-5 py-2 text-sm font-black text-slate-950 shadow-[4px_4px_0_#facc15] transition-transform hover:-translate-y-1"
          >
            <span>{area.emoji}</span>
            {area.nome}
          </Link>
        ))}
      </div>
    </section>
  );
}
