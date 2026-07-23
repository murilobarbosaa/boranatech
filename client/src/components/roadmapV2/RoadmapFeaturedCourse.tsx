import { ExternalLink, Sparkles } from "lucide-react";
import type { CursoParceiro } from "@/lib/parceiros";

// Destaque de curso parceiro no topo da trilha. Recebe o parceiro por prop
// (a decisao de QUAL parceiro / SE aparece vive em RoadmapsV2, lendo
// cursosParceiros por roadmapSlugs). Card compacto: fundo escuro premium
// (gradiente diagonal slate-950 -> teal petroleo) com glow ciano discreto atras
// da logo. Duas colunas: esquerda (badge acima da logo) e direita (titulo +
// autor, descricao e CTA full-width). Empilha e centraliza no mobile. Mantem
// borda e sombra flat neo-brutalistas do design system no card, badge e CTA.
//
// O campo `autor` do dado ("PC (pctheone)") tambem alimenta o ParceiroCard da
// pagina Cursos, entao o formato "BY @PCTHEONE" e derivado so na apresentacao,
// sem tocar na fonte: extrai o handle entre parenteses e normaliza.
export default function RoadmapFeaturedCourse({
  curso,
}: {
  curso: CursoParceiro;
}) {
  const handle = curso.autor.match(/\(([^)]+)\)/)?.[1];
  const autorLabel = handle ? `BY @${handle.toUpperCase()}` : curso.autor;

  return (
    <div className="relative mt-6 overflow-hidden rounded-[14px] border-[2.5px] border-slate-900 bg-[linear-gradient(135deg,#020617_0%,#07171b_55%,#0b1f24_100%)] p-4 shadow-[4px_4px_0_#0f172a] sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-28 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_70%)] blur-2xl sm:left-8"
      />

      <div className="relative">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Parceiro
            </span>
            <img
              src={curso.logo}
              alt={`Logo ${curso.titulo}`}
              loading="lazy"
              width={112}
              height={112}
              className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-center">
              <h2 className="font-display text-xl font-black leading-tight text-white sm:text-2xl">
                {curso.titulo}
              </h2>
              <span className="mt-1 block text-xs font-black uppercase leading-none tracking-wide text-cyan-300">
                {autorLabel}
              </span>
            </div>
            <p className="mt-2 text-pretty text-xs font-medium leading-snug text-slate-300 text-center sm:indent-8 sm:text-sm sm:text-justify">
              {curso.descricao}
            </p>

            <a
              href={curso.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] border-[2.5px] border-slate-900 bg-[#FFB800] px-3 py-2 text-xs font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
            >
              Acessar
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
