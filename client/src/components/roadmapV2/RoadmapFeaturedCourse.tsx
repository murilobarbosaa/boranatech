import { ExternalLink, Sparkles } from "lucide-react";
import type { CursoParceiro } from "@/lib/parceiros";

// Destaque de curso parceiro no topo da trilha. Recebe o parceiro por prop
// (a decisao de QUAL parceiro / SE aparece vive em RoadmapsV2, lendo
// cursosParceiros por roadmapSlugs). Fundo escuro premium (gradiente diagonal
// slate-950 -> teal petroleo) com glow ciano discreto atras da logo. Layout:
// duas colunas, esquerda (badge acima da logo) e direita (autor + titulo acima
// da descricao); o badge e o autor compartilham a linha de topo. CTA
// centralizado ao fim; empilha e centraliza no mobile. Mantem borda e sombra
// flat neo-brutalistas do design system no card, badge e CTA.
export default function RoadmapFeaturedCourse({
  curso,
}: {
  curso: CursoParceiro;
}) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-[14px] border-[2.5px] border-slate-900 bg-[linear-gradient(135deg,#020617_0%,#07171b_55%,#0b1f24_100%)] p-6 shadow-[4px_4px_0_#0f172a] sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-40 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_70%)] blur-2xl sm:left-8"
      />

      <div className="relative">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Parceiro
            </span>
            <img
              src={curso.logo}
              alt={`Logo ${curso.titulo}`}
              loading="lazy"
              width={160}
              height={160}
              className="mt-1 h-36 w-36 shrink-0 object-contain sm:mt-2 sm:h-40 sm:w-40"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-center">
              <span className="text-xs font-black uppercase leading-none tracking-wide text-cyan-300">
                {curso.autor}
              </span>
              <h2 className="mt-1 font-display text-3xl font-black leading-tight text-white sm:text-4xl">
                {curso.titulo}
              </h2>
            </div>
            <p className="mx-auto mt-2 max-w-[42ch] text-pretty text-sm font-medium leading-relaxed text-slate-300 text-center sm:indent-8 sm:text-justify">
              {curso.descricao}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href={curso.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
          >
            Acessar
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
