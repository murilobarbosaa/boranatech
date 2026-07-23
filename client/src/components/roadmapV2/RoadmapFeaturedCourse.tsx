import { ExternalLink, Sparkles } from "lucide-react";
import type { CursoParceiro } from "@/lib/parceiros";

// Destaque de curso parceiro no topo da trilha. Recebe o parceiro por prop
// (a decisao de QUAL parceiro / SE aparece vive em RoadmapsV2, lendo
// cursosParceiros por roadmapSlugs). Fundo escuro premium (gradiente diagonal
// slate-950 -> teal petroleo) com glow ciano discreto e deslocado atras da
// logo, pra nao competir com o glow proprio da arte circular. Mantem borda e
// sombra flat neo-brutalistas do design system no card, no badge e no CTA.
export default function RoadmapFeaturedCourse({
  curso,
}: {
  curso: CursoParceiro;
}) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-[14px] border-[2.5px] border-slate-900 bg-[linear-gradient(135deg,#020617_0%,#07171b_55%,#0b1f24_100%)] p-6 pt-5 shadow-[4px_4px_0_#0f172a] sm:p-8 sm:pt-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-14 h-56 w-56 -translate-x-[65%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_70%)] blur-2xl"
      />

      <span className="absolute left-6 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a] sm:left-8 sm:top-6">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Parceiro
      </span>

      <div className="relative mt-10 flex flex-col items-center text-center sm:mt-0">
        <img
          src={curso.logo}
          alt={`Logo ${curso.titulo}`}
          loading="lazy"
          width={128}
          height={128}
          className="h-28 w-28 object-contain sm:h-32 sm:w-32"
        />

        <div className="mt-5">
          <span className="text-xs font-black uppercase tracking-wide text-cyan-300">
            {curso.autor}
          </span>
          <h2 className="font-display text-2xl font-black leading-tight text-white">
            {curso.titulo}
          </h2>
        </div>

        <p className="mx-auto mt-5 max-w-prose text-sm font-medium leading-relaxed text-slate-300">
          {curso.descricao}
        </p>

        <a
          href={curso.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
        >
          Acessar
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
