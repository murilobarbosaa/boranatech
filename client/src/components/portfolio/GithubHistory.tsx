import { History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { GithubAnalysisSummary } from "@/lib/githubClient";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { AREA_LABELS, isAreaSlug } from "@shared/areas";

const ac = getPageAccentUi("violet");

// Historico de analises de GitHub, no molde do LinkedinHistory: lista com
// nota/faixa/area/data e reabertura na mesma tela de resultado. O delta de
// nota por MESMO alvo e exibido junto do resultado (na pagina), nao aqui.

interface GithubHistoryProps {
  analyses: GithubAnalysisSummary[];
  onOpen: (id: string) => void;
  loadingId: string | null;
}

// TODO(Ana): revisar os textos do historico de analises de GitHub.
const COPY = {
  title: "Minhas análises",
  modePerfil: "Perfil",
  modeRepo: "Repositório",
  open: "Ver análise salva",
  openFree: "não usa IA",
} as const;

function areaLabel(area: string | null): string {
  if (!area) return "Geral";
  return isAreaSlug(area) ? AREA_LABELS[area] : area;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function GithubHistory({
  analyses,
  onOpen,
  loadingId,
}: GithubHistoryProps) {
  if (analyses.length === 0) return null;

  return (
    <div className={cn("card-brutal rounded-2xl border-slate-950 bg-white p-6", ac.liftShadow)}>
      <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-black text-slate-950">
        <History className="h-5 w-5 text-violet-700" />
        {COPY.title}
      </h3>

      <ul className="space-y-2">
        {analyses.map((analysis) => (
          <li key={analysis.id}>
            <button
              type="button"
              onClick={() => onOpen(analysis.id)}
              disabled={loadingId !== null}
              className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-colors hover:border-violet-400 hover:bg-violet-50 disabled:opacity-60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {analysis.mode === "repo" ? COPY.modeRepo : COPY.modePerfil}
                  {analysis.raw_input ? ` · ${analysis.raw_input}` : ""}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {formatDate(analysis.created_at)} · {areaLabel(analysis.area)}
                  {analysis.faixa ? ` · ${analysis.faixa}` : ""}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-3">
                <span className="hidden text-right sm:block">
                  <span className="block text-xs font-black text-violet-800">
                    {COPY.open}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    {COPY.openFree}
                  </span>
                </span>
                <span className="font-display text-2xl font-black text-slate-950">
                  {analysis.score ?? "?"}
                </span>
                {loadingId === analysis.id ? (
                  <Spinner className="h-4 w-4" />
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
