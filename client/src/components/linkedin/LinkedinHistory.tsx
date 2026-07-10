import { History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AREA_LABELS, isAreaSlug } from "@shared/areas";
import {
  FAIXA_LABELS,
  type LinkedinAnalysisSummary,
  type LinkedinFaixa,
} from "@shared/linkedin/schema";

interface LinkedinHistoryProps {
  analyses: LinkedinAnalysisSummary[];
  onOpen: (id: string) => void;
  loadingId: string | null;
}

function areaLabel(area: string): string {
  return isAreaSlug(area) ? AREA_LABELS[area] : area;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LinkedinHistory({
  analyses,
  onOpen,
  loadingId,
}: LinkedinHistoryProps) {
  if (analyses.length === 0) return null;

  // O delta de nota e responsabilidade da pagina (banner e hero do
  // resultado), como no molde do GitHub; aqui e so a lista.
  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
      <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-black text-slate-950">
        <History className="h-5 w-5 text-sky-700" />
        Minhas análises
      </h3>

      <ul className="space-y-2">
        {analyses.map((analysis) => (
          <li key={analysis.id}>
            <button
              type="button"
              onClick={() => onOpen(analysis.id)}
              disabled={loadingId !== null}
              className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-colors hover:border-sky-400 hover:bg-sky-50 disabled:opacity-60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {areaLabel(analysis.area)}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {formatDate(analysis.created_at)} ·{" "}
                  {FAIXA_LABELS[analysis.faixa as LinkedinFaixa] ??
                    analysis.faixa}
                </p>
              </div>
              <span className="flex items-center gap-2">
                <span className="font-display text-2xl font-black text-slate-950">
                  {analysis.score}
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
