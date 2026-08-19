import { History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AREA_LABELS, isAreaSlug } from "@shared/areas";
import {
  FAIXA_LABELS,
  type LinkedinAnalysisSummary,
} from "@shared/linkedin/schema";

interface LinkedinHistoryProps {
  analyses: LinkedinAnalysisSummary[];
  onOpen: (id: string) => void;
  loadingId: string | null;
  status: "loading" | "success_empty" | "success_with_data" | "error";
  openError?: string;
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

/**
 * Rotulo da faixa numa linha do historico.
 *
 * "A confirmar" SO a partir da v7, que e a versao que introduziu o conceito.
 * Uma analise da v1 a v6 nao tinha `notaIncompleta`, foi calculada por uma
 * regua que nao conhecia pendencia, e a faixa que a pessoa viu na epoca era a
 * dela: marcar retroativamente reescreveria a historia de uma medicao honesta.
 *
 * O `>= 7` e explicito de proposito, e nao "tem o campo": uma linha futura sem
 * o campo (payload truncado, bug de escrita) deve cair na faixa calculada, nao
 * virar "a confirmar" por ausencia. Ausencia nao e valor.
 */
function rotuloDaFaixa(analysis: LinkedinAnalysisSummary): string {
  const versao = analysis.deterministicVersion ?? 1;
  if (versao >= 7 && analysis.notaIncompleta === true) return "A confirmar";
  return FAIXA_LABELS[analysis.faixa];
}

export default function LinkedinHistory({
  analyses,
  onOpen,
  loadingId,
  status,
  openError = "",
}: LinkedinHistoryProps) {
  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 text-slate-900 shadow-[3px_3px_0_#0f172a]"
      >
        <p className="font-black">
          Não conseguimos carregar seu histórico agora.
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Sua análise atual continua disponível. Tente novamente ao recarregar a
          página.
        </p>
      </div>
    );
  }
  if (status === "loading") {
    return (
      <p role="status" className="text-sm font-bold text-slate-600">
        Carregando análises anteriores...
      </p>
    );
  }
  if (status === "success_empty" || analyses.length === 0) return null;

  // O delta de nota e responsabilidade da pagina (banner e hero do
  // resultado), como no molde do GitHub; aqui e so a lista.
  return (
    <div className="space-y-3">
      {openError ? (
        <div
          role="alert"
          className="rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm font-bold text-slate-900"
        >
          {openError}
        </div>
      ) : null}
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
                  {formatDate(analysis.created_at)} · {rotuloDaFaixa(analysis)}
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
    </div>
  );
}
