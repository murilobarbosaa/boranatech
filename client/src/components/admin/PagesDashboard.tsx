import { useEffect, useMemo, useRef, useState } from "react";

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
type Failure = { query: string; code: string; httpStatus?: number };
type Group =
  | { state: "available" }
  | { state: "unavailable"; failures: Failure[] };
type PagesOk = {
  state: "ok";
  hasData: boolean;
  stats: PosthogStats;
  period: PagesPeriod;
  computedAt: string;
  availability: {
    pages: { state: "available" };
    timeScroll: Group;
    exitRate: Group;
  };
  coverage: {
    pages: "top_10";
    timeAndScroll: "$pageleave";
    exitRate: "session_last_page";
    complete: boolean;
  };
};

type PosthogState =
  | { state: "not_configured"; missing: string[]; period: PagesPeriod }
  | {
      state: "error";
      reason: string;
      code: "posthog_pages_core_unavailable";
      failures: Failure[];
      period: PagesPeriod;
      previous?: PagesOk;
    }
  | PagesOk;

type PagesPeriod = { from: string; to: string; timezone: "UTC" };

function validFailures(value: unknown): value is Failure[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;
      const failure = item as Record<string, unknown>;
      return (
        [
          "pageviews",
          "pages",
          "pageleave",
          "exit_last",
          "exit_sessions",
        ].includes(String(failure.query)) &&
        ["timeout", "http_error", "invalid_payload", "network_error"].includes(
          String(failure.code),
        ) &&
        (failure.httpStatus === undefined ||
          (Number.isInteger(failure.httpStatus) &&
            (failure.httpStatus as number) >= 100 &&
            (failure.httpStatus as number) <= 599))
      );
    })
  );
}
function validGroup(value: unknown): value is Group {
  if (!value || typeof value !== "object") return false;
  const group = value as Record<string, unknown>;
  return (
    (group.state === "available" && group.failures === undefined) ||
    (group.state === "unavailable" && validFailures(group.failures))
  );
}
function isPagesState(
  value: unknown,
  period: PagesPeriod,
  nested = false,
): value is PosthogState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  const range = state.period as Record<string, unknown> | undefined;
  if (
    !range ||
    range.from !== period.from ||
    range.to !== period.to ||
    range.timezone !== "UTC"
  )
    return false;
  if (state.state === "not_configured")
    return (
      Array.isArray(state.missing) &&
      state.missing.every((item) => typeof item === "string")
    );
  if (state.state === "error")
    return (
      !nested &&
      typeof state.reason === "string" &&
      state.code === "posthog_pages_core_unavailable" &&
      validFailures(state.failures) &&
      (state.previous === undefined ||
        (isPagesState(state.previous, period, true) &&
          (state.previous as Record<string, unknown>).state === "ok"))
    );
  if (
    state.state !== "ok" ||
    typeof state.hasData !== "boolean" ||
    typeof state.computedAt !== "string" ||
    !Number.isFinite(Date.parse(state.computedAt))
  )
    return false;
  const coverage = state.coverage as Record<string, unknown> | undefined;
  const availability = state.availability as
    | Record<string, unknown>
    | undefined;
  const stats = state.stats as Record<string, unknown> | undefined;
  if (
    !coverage ||
    coverage.pages !== "top_10" ||
    coverage.timeAndScroll !== "$pageleave" ||
    coverage.exitRate !== "session_last_page" ||
    typeof coverage.complete !== "boolean" ||
    !availability ||
    (availability.pages as Record<string, unknown> | undefined)?.state !==
      "available" ||
    !validGroup(availability.timeScroll) ||
    !validGroup(availability.exitRate) ||
    coverage.complete !==
      ((availability.timeScroll as Group).state === "available" &&
        (availability.exitRate as Group).state === "available") ||
    !stats ||
    !Number.isInteger(stats.totalPageviews) ||
    (stats.totalPageviews as number) < 0 ||
    !Array.isArray(stats.pages) ||
    stats.pages.length > 10 ||
    state.hasData !== (stats.totalPageviews as number) > 0
  )
    return false;
  const verifiedPages = stats.pages.every((page: unknown) => {
    if (!page || typeof page !== "object") return false;
    const row = page as Record<string, unknown>;
    return (
      typeof row.page === "string" &&
      Number.isInteger(row.views) &&
      (row.views as number) > 0 &&
      ["avgTimeSeconds", "avgScrollPercent", "exitRatePercent"].every(
        (key) =>
          row[key] === null ||
          (typeof row[key] === "number" && Number.isFinite(row[key])),
      )
    );
  });
  if (
    !verifiedPages ||
    ((stats.totalPageviews as number) === 0 && stats.pages.length > 0) ||
    ((stats.totalPageviews as number) > 0 && stats.pages.length === 0)
  )
    return false;
  const pages = stats.pages as PageStat[];
  if (
    pages.some(
      (page) =>
        ((availability.timeScroll as Group).state === "unavailable" &&
          (page.avgTimeSeconds !== null || page.avgScrollPercent !== null)) ||
        ((availability.exitRate as Group).state === "unavailable" &&
          page.exitRatePercent !== null),
    )
  )
    return false;
  const names = new Set(pages.map((page) => page.page));
  return (
    names.size === pages.length &&
    pages.reduce((sum, page) => sum + page.views, 0) <=
      (stats.totalPageviews as number)
  );
}

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
export function computeRange(
  preset: Preset,
  customFrom: string,
  customTo: string,
): PagesPeriod | null {
  const now = new Date();
  if (preset === "custom") {
    if (!customFrom || !customTo) return null;
    const from = new Date(`${customFrom}T00:00:00.000Z`);
    const to = new Date(`${customTo}T00:00:00.000Z`);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()))
      return null;
    to.setUTCDate(to.getUTCDate() + 1);
    return { from: from.toISOString(), to: to.toISOString(), timezone: "UTC" };
  }
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  let start: Date;
  if (preset === "current_month") start = new Date(Date.UTC(y, m, 1));
  else if (preset === "last_3") start = new Date(Date.UTC(y, m - 2, 1));
  else start = new Date(Date.UTC(y, m - 11, 1));
  // Dia UTC completo: a chave fica estável durante o dia e o limite efetivo é
  // declarado ao operador. O fim exclusivo do dia seguinte não corta eventos.
  const end = new Date(Date.UTC(y, m, now.getUTCDate() + 1));
  return { from: start.toISOString(), to: end.toISOString(), timezone: "UTC" };
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
function MetricCell({ text, small }: { text: string | null; small: boolean }) {
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
  const [lastValid, setLastValid] = useState<Extract<
    PosthogState,
    { state: "ok" }
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [stale, setStale] = useState(false);
  const refreshRequested = useRef(false);
  const requestRefresh = () => {
    refreshRequested.current = true;
    setRefreshCount((count) => count + 1);
  };

  const range = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo, refreshCount],
  );

  useEffect(() => {
    if (!range) {
      setLoading(false);
      setState(null);
      setStale(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const forceRefresh = refreshRequested.current;
    refreshRequested.current = false;
    const samePreviousPeriod =
      lastValid?.period.from === range.from &&
      lastValid?.period.to === range.to;
    async function load() {
      setLoading(true);
      setFetchError(null);
      setState(null);
      setStale(Boolean(samePreviousPeriod));
      try {
        const params = new URLSearchParams({
          from: range!.from,
          to: range!.to,
        });
        if (forceRefresh) params.set("refresh", "1");
        const json = await adminFetch(`/posthog-pages?${params.toString()}`, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!isPagesState(json?.data, range!))
          throw new Error(
            "Resposta de Páginas indisponível ou incompatível. Tente novamente.",
          );
        setState(json.data);
        if (json.data.state === "ok") {
          setLastValid(json.data);
          setStale(false);
        } else if (json.data.state === "error" && json.data.previous) {
          setLastValid(json.data.previous);
          setStale(true);
        } else if (json.data.state === "not_configured") {
          setStale(false);
        }
      } catch (err) {
        if (cancelled) return;
        setFetchError(
          typeof err === "object" &&
            err !== null &&
            "status" in err &&
            err.status === 404
            ? "Leitura de Páginas indisponível nesta versão do servidor. Tente novamente."
            : err instanceof Error
              ? err.message
              : "Erro ao consultar o PostHog.",
        );
        setState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // lastValid é a fotografia anterior capturada na abertura; sucesso não deve
    // iniciar uma segunda leitura para o mesmo período.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const sameValid =
    lastValid?.period.from === range?.from &&
    lastValid?.period.to === range?.to;
  const shown =
    state?.state === "ok"
      ? state
      : state?.state === "error" && state.previous
        ? state.previous
        : sameValid && stale
          ? lastValid
          : null;
  const stats = shown?.stats ?? null;
  const errorMessage =
    fetchError ||
    (state?.state === "error"
      ? `Falha ao consultar o PostHog: ${state.reason}`
      : null);

  return (
    <div className="min-w-0 space-y-6">
      {/* Seletor de periodo (mesmo padrao do ConversionDashboard) */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              aria-pressed={preset === p.id}
              className={`rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-black uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${
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
                className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
              />
            </label>
            <label className="text-xs font-black uppercase text-slate-600">
              Até
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
              />
            </label>
          </div>
        ) : null}
      </div>

      {range ? (
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
          <span>
            Período UTC: {range.from.slice(0, 10)} a{" "}
            {new Date(new Date(range.to).getTime() - 1)
              .toISOString()
              .slice(0, 10)}
          </span>
          <button
            type="button"
            onClick={requestRefresh}
            className="rounded-xl border-2 border-slate-900 bg-white px-3 py-2 font-black text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            Atualizar
          </button>
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-600">
          Selecione as duas datas do período.
        </p>
      )}

      {shown && !stale ? (
        <p className="text-xs font-semibold text-slate-500">
          Calculado em{" "}
          {new Date(shown.computedAt).toLocaleString("pt-BR", {
            timeZone: "UTC",
          })}{" "}
          UTC.
        </p>
      ) : null}

      {shown && stale ? (
        <div
          className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900"
          role="status"
        >
          Dados anteriores, calculados em{" "}
          {new Date(shown.computedAt).toLocaleString("pt-BR", {
            timeZone: "UTC",
          })}{" "}
          UTC.
          {loading ? " Atualizando…" : ""}
        </div>
      ) : null}
      {shown && !stale && !shown.coverage.complete ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900"
          role="status"
        >
          {shown.availability.timeScroll.state === "unavailable" ? (
            <span>Tempo e scroll indisponíveis.</span>
          ) : null}
          {shown.availability.exitRate.state === "unavailable" ? (
            <span>Taxa de saída indisponível.</span>
          ) : null}
          <button
            type="button"
            onClick={requestRefresh}
            className="rounded-xl border-2 border-amber-700 bg-white px-3 py-1 font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="space-y-2">
          <ErrorBlock message={errorMessage} />
          <button
            type="button"
            onClick={requestRefresh}
            className="rounded-xl border-2 border-rose-700 bg-white px-4 py-2 font-black text-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {loading && !shown ? (
        <LoadingBlock />
      ) : !state && !shown && !errorMessage && range ? (
        <LoadingBlock />
      ) : state?.state === "not_configured" ? (
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
      ) : !shown ? null : !shown.hasData ||
        !stats ||
        stats.pages.length === 0 ? (
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
            Tempo médio e profundidade de scroll vêm do evento de saída de
            página; a taxa de saída é a fração das sessões que terminam naquela
            página. Onde ainda não há sinal suficiente, a métrica aparece como
            sem dado.
          </p>
          <p className="text-xs font-semibold text-slate-600 sm:hidden">
            Deslize a tabela para ver as demais métricas.
          </p>
          <article className="card-brutal min-w-0 overflow-hidden rounded-3xl bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
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
                        ? Math.round((page.views / stats.totalPageviews) * 100)
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
                          {shown.availability.timeScroll.state ===
                          "unavailable" ? (
                            <span
                              className="text-slate-400"
                              aria-label="Tempo indisponível"
                            >
                              —
                            </span>
                          ) : (
                            <MetricCell
                              text={fmtTime(page.avgTimeSeconds)}
                              small={small}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {shown.availability.timeScroll.state ===
                          "unavailable" ? (
                            <span
                              className="text-slate-400"
                              aria-label="Scroll indisponível"
                            >
                              —
                            </span>
                          ) : (
                            <MetricCell
                              text={
                                page.avgScrollPercent === null
                                  ? null
                                  : `${Math.round(page.avgScrollPercent)}%`
                              }
                              small={small}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {shown.availability.exitRate.state ===
                          "unavailable" ? (
                            <span
                              className="text-slate-400"
                              aria-label="Taxa de saída indisponível"
                            >
                              —
                            </span>
                          ) : (
                            <MetricCell
                              text={
                                page.exitRatePercent === null
                                  ? null
                                  : `${page.exitRatePercent.toFixed(1)}%`
                              }
                              small={small}
                            />
                          )}
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
