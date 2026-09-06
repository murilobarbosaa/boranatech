import { Check } from "lucide-react";

import type { ProjetoEtapa } from "@shared/projects/v2/types";

function dataCurta(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function ProjetoEtapas({
  etapas,
  marcadas,
  indiceAtual,
  onToggleEtapa,
}: {
  etapas: ProjetoEtapa[];
  marcadas: Record<string, string>;
  indiceAtual: number;
  onToggleEtapa: (etapaId: string) => void;
}) {
  return (
    <ol className="relative mt-4">
      <span
        className="absolute bottom-6 left-[21px] top-6 w-0.5 bg-border"
        aria-hidden
      />
      {etapas.map((etapa, i) => {
        const feita = etapa.id in marcadas;
        const atual = i === indiceAtual;
        return (
          <li
            key={etapa.id}
            id={`etapa-${etapa.id}`}
            className="relative mb-3 grid grid-cols-[44px_minmax(0,1fr)] gap-3 scroll-mt-24"
          >
            <span
              className={`z-[1] flex h-11 w-11 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                feita
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : atual
                    ? "border-ink bg-[var(--brand-yellow)] text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
                    : "border-border bg-card text-muted-foreground"
              }`}
              aria-hidden
            >
              {feita ? <Check className="h-5 w-5" strokeWidth={3.5} /> : i + 1}
            </span>
            <div
              className={`rounded-xl bg-card p-4 ${
                atual ? "card-brutal" : "border-2 border-border"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-base font-bold text-foreground">
                  {etapa.titulo}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {etapa.tempo}
                  {feita && ` · feito em ${dataCurta(marcadas[etapa.id])}`}
                </span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {etapa.oQueFazer.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <p className="mt-3 border-t border-dashed border-border pt-2 text-sm text-muted-foreground">
                <span className="font-bold text-foreground">
                  Pronto quando:
                </span>{" "}
                {etapa.prontoQuando}
              </p>
              <button
                type="button"
                role="checkbox"
                aria-checked={feita}
                aria-label={etapa.titulo}
                onClick={() => onToggleEtapa(etapa.id)}
                className={`mt-3 inline-flex items-center gap-2 rounded-[10px] border-2 px-3 py-1.5 text-sm font-bold ${
                  feita
                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : atual
                      ? "border-ink bg-card text-foreground"
                      : "border-border bg-card text-foreground"
                }`}
              >
                {feita ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3.5} /> Feita
                  </>
                ) : (
                  "Marcar como feita"
                )}
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
