import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste bloco (titulos, cabecalhos da
// tabela, aviso de amostra pequena, estados e a nota de scroll/tempo).

type PageStat = {
  page: string;
  views: number;
  avgTimeSeconds: number | null;
  avgScrollPercent: number | null;
  exitRatePercent: number | null;
};

// Espelha o shape estendido de server/lib/posthog.ts (so o que esta aba usa).
type PosthogStats = {
  totalPageviews: number;
  pages: PageStat[];
};

type PosthogState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; hasData: boolean; stats: PosthogStats };

type Preset = "current_month" | "last_3" | "last_12" | "custom";

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "current_month", label: "Mês atual" },
  { id: "last_3", label: "Últimos 3 meses" },
  { id: "last_12", label: "Últimos 12 meses" },
  { id: "custom", label: "Personalizado" },
];

// Pageviews abaixo disso: medias (tempo/scroll/saida) sao instaveis. Mesmo
// limiar/espirito do ConversionDashboard.
const SMALL_SAMPLE_THRESHOLD = 20;

const numberFmt = new Intl.NumberFormat("pt-BR");
function fmtCount(n: number): string {
  return numberFmt.format(n);
}

// Estabiliza o range: `now` calculado UMA vez por combinacao de deps, nao a cada
// render (evita o loop de requisicoes que aconteceu no FinanceDashboard).
function computeRange(
  preset: Preset,
  customFrom: string,
  customTo: string,
): { from: string; to: string } | null {
  const now = new Date();
  if (preset === "custom") {
    if (!customFrom || !customTo) return null;
    return {
      from: new Date(`${customFrom}T00:00:00.000Z`).toISOString(),
      to: new Date(`${customTo}T23:59:59.999Z`).toISOString(),
    };
  }
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  let start: Date;
  if (preset === "current_month") start = new Date(Date.UTC(y, m, 1));
  else if (preset === "last_3") start = new Date(Date.UTC(y, m - 2, 1));
  else start = new Date(Date.UTC(y, m - 11, 1));
  return { from: start.toISOString(), to: now.toISOString() };
}

// Tempo legivel: "1m 23s" / "45s". null = sem dado (traco).
function fmtTime(seconds: number | null): string | null {
  if (seconds === null) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Celula de metrica derivada: distingue "sem dado" (null -> traco cinza) de zero
// real, e sinaliza amostra pequena (poucos pageviews) deixando o valor em cinza.
function MetricCell({
  text,
  small,
}: {
  text: string | null;
  small: boolean;
}) {
  if (text === null) {
    // TODO(Ana): copy do estado "sem dado" por pagina.
    return <span className="text-xs font-bold text-slate-400">sem dado</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-black ${small ? "text-slate-400" : "text-slate-800"}`}
      title={small ? "Amostra pequena: media pouco confiável." : undefined}
    >
      {text}
      {small ? (
        // TODO(Ana): copy do selo de amostra pequena.
        <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[10px] font-black uppercase text-slate-500">
          amostra pequena
        </span>
      ) : null}
    </span>
  );
}

export function PagesDashboard() {
  const [preset, setPreset] = useState<Preset>("last_3");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [state, setState] = useState<PosthogState | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const range = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  useEffect(() => {
    if (!range) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams({ from: range!.from, to: range!.to });
        const json = await adminFetch(`/posthog-stats?${params.toString()}`);
        if (cancelled) return;
        setState(json.data as PosthogState);
      } catch (err) {
        if (cancelled) return;
        setFetchError(
          err instanceof Error ? err.message : "Erro ao consultar o PostHog.",
        );
        setState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const stats = state?.state === "ok" ? state.stats : null;

  return (
    <div className="space-y-6">
      {/* Seletor de periodo (mesmo padrao do ConversionDashboard) */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase transition-colors ${
                preset === p.id
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-black uppercase text-slate-600">
              De
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="text-xs font-black uppercase text-slate-600">
              Até
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
          </div>
        ) : null}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : fetchError ? (
        <ErrorBlock message={fetchError} />
      ) : !state ? (
        <LoadingBlock />
      ) : state.state === "not_configured" ? (
        <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
          <p className="font-display text-lg font-black text-amber-900">
            PostHog não configurado
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-800">
            Faltando no servidor:{" "}
            {state.missing.length
              ? state.missing.join(", ")
              : "credenciais do PostHog"}
            .
          </p>
        </div>
      ) : state.state === "error" ? (
        <ErrorBlock
          message={`Falha ao consultar o PostHog${
            typeof state.httpStatus === "number"
              ? ` (HTTP ${state.httpStatus})`
              : ""
          }: ${state.reason}`}
        />
      ) : !state.hasData || !stats || stats.pages.length === 0 ? (
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
          <p className="font-display text-lg font-black text-slate-700">
            PostHog conectado
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Sem pageviews neste período.
          </p>
        </div>
      ) : (
        <>
          {/* TODO(Ana): copy da nota sobre tempo e scroll virem do $pageleave. */}
          <p className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
            Tempo médio e profundidade de scroll vêm do evento de saída de página;
            a taxa de saída é a fração das sessões que terminam naquela página.
            Onde ainda não há sinal suficiente, a métrica aparece como sem dado.
          </p>
          <article className="card-brutal overflow-hidden rounded-3xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs font-black uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Página</th>
                    <th className="px-4 py-3">Pageviews</th>
                    <th className="px-4 py-3">Participação</th>
                    <th className="px-4 py-3">Tempo médio</th>
                    <th className="px-4 py-3">Scroll</th>
                    <th className="px-4 py-3">Taxa de saída</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100">
                  {stats.pages.map((page) => {
                    const share =
                      stats.totalPageviews > 0
                        ? Math.round(
                            (page.views / stats.totalPageviews) * 100,
                          )
                        : 0;
                    const small = page.views < SMALL_SAMPLE_THRESHOLD;
                    return (
                      <tr key={page.page}>
                        <td className="px-4 py-3 font-black text-slate-950">
                          {page.page}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {fmtCount(page.views)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-violet-700">
                          {share}%
                        </td>
                        <td className="px-4 py-3">
                          <MetricCell
                            text={fmtTime(page.avgTimeSeconds)}
                            small={small}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <MetricCell
                            text={
                              page.avgScrollPercent === null
                                ? null
                                : `${Math.round(page.avgScrollPercent)}%`
                            }
                            small={small}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <MetricCell
                            text={
                              page.exitRatePercent === null
                                ? null
                                : `${page.exitRatePercent.toFixed(1)}%`
                            }
                            small={small}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
