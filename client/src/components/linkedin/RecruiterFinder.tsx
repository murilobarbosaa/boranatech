import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LinkedinDeterministicResult,
  Mercado,
} from "@shared/linkedin/schema";

interface RecruiterFinderProps {
  deterministic: LinkedinDeterministicResult;
  mercado: Mercado;
}

const IA_EYEBROW =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-sky-300 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-[3px_3px_0_#0f172a]";

export default function RecruiterFinder({
  deterministic,
  mercado,
}: RecruiterFinderProps) {
  const { keywordsEncontradas, keywordsFaltantes, titulosIngles } =
    deterministic;
  const showIngles = mercado === "exterior" || mercado === "ambos";

  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
      <span className={IA_EYEBROW}>
        <Search className="h-3.5 w-3.5" />
        como um recrutador te encontra
      </span>

      <p className="mt-4 text-sm font-medium text-slate-600">
        Recrutadores filtram perfis por palavras-chave. As que já estão no seu
        perfil te colocam nas buscas certas. As que faltam são oportunidades,
        adicione só o que você realmente sabe.
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-black text-slate-900">
            No seu perfil ({keywordsEncontradas.length})
          </p>
          {keywordsEncontradas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywordsEncontradas.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                >
                  <Check className="h-3 w-3" />
                  {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhuma tecnologia-chave da área detectada ainda.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-black text-slate-900">
            Faltando ({keywordsFaltantes.length})
          </p>
          {keywordsFaltantes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywordsFaltantes.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                >
                  <X className="h-3 w-3 text-slate-400" />
                  {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Você cobre todas as tecnologias-chave da área.
            </p>
          )}
        </div>
      </div>

      {showIngles ? (
        <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-5">
          <p className="mb-2 text-sm font-black text-slate-900">
            Títulos que recrutadores buscam em inglês
          </p>
          <div className="flex flex-wrap gap-2">
            {titulosIngles.map((titulo) => (
              <span
                key={titulo.titulo}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-bold",
                  titulo.encontrado
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-300 bg-slate-50 text-slate-600",
                )}
              >
                {titulo.encontrado ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3 text-slate-400" />
                )}
                {titulo.titulo}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
