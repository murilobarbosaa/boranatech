import { ExternalLink, Sparkles } from "lucide-react";
import type { CursoParceiro } from "@/lib/parceiros";

// Destaque de curso parceiro no topo da trilha. Recebe o parceiro por prop
// (a decisao de QUAL parceiro / SE aparece vive em RoadmapsV2, lendo
// cursosParceiros por roadmapSlugs). Fundo teal petroleo (tom da marca do
// parceiro) com texto claro; a logo fica num container claro porque seu fundo
// proprio e escuro e sumiria no card. Mantem borda e sombra neo-brutalistas.
export default function RoadmapFeaturedCourse({
  curso,
}: {
  curso: CursoParceiro;
}) {
  return (
    <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-[#0d5c5c] p-5 shadow-[4px_4px_0_#0f172a]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Parceiro
        </span>
        <span className="text-xs font-black uppercase tracking-wide text-amber-200">
          {curso.autor}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="grid shrink-0 place-items-center rounded-[10px] border-2 border-slate-900 bg-white p-2 shadow-[2px_2px_0_#0f172a]">
          <img
            src={curso.logo}
            alt={`Logo ${curso.titulo}`}
            loading="lazy"
            className="h-16 w-auto max-w-[140px] object-contain"
          />
        </div>
        <h2 className="font-display text-xl font-black leading-tight text-white">
          {curso.titulo}
        </h2>
      </div>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-100">
        {curso.descricao}
      </p>

      <a
        href={curso.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
      >
        Acessar
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}
