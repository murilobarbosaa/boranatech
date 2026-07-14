import { useEffect, useMemo, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste bloco (titulos, labels do funil,
// aviso de amostra pequena, nota de historico, ranking de gates e estados).

type ProGateRank = {
  feature: string;
  hits: number;
  people: number;
  subscribers: number;
};

// Espelha o shape estendido de server/lib/posthog.ts.
type PosthogStats = {
  totalPageviews: number;
  uniqueUsers: number;
  pages: Array<{ page: string; views: number }>;
  events: {
    user_signed_up: number;
    user_signed_in: number;
    checkout_started: number;
    checkout_abandoned: number;
    subscription_completed: number;
    quiz_completed: number;
  };
  proGates: ProGateRank[];
  acquisition: Array<{ channel: string; users: number }>;
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

// Denominador abaixo disso: a taxa e pouco confiavel (mostra o absoluto em
// destaque e sinaliza "amostra pequena").
const SMALL_SAMPLE_THRESHOLD = 20;

const numberFmt = new Intl.NumberFormat("pt-BR");
function fmtCount(n: number): string {
  return numberFmt.format(n);
}

// Estabiliza o range: o `now` e calculado UMA vez por combinacao de deps, nao a
// cada render (evita o loop de requisicoes que aconteceu no FinanceDashboard).
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

// Taxa com aviso de amostra pequena. rate = null quando o denominador e 0
// (ausencia, nao 0%). small = denominador < limiar (taxa pouco confiavel).
function rateOf(
  numerator: number,
  denominator: number,
): { rate: number | null; small: boolean } {
  if (denominator <= 0) return { rate: null, small: true };
  return {
    rate: (numerator / denominator) * 100,
    small: denominator < SMALL_SAMPLE_THRESHOLD,
  };
}

function RatePill({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) {
  const { rate, small } = rateOf(numerator, denominator);
  if (rate === null) {
    return (
      <span className="text-xs font-bold text-slate-400">sem base</span>
    );
  }
  // Amostra pequena: taxa em cinza + rotulo. Nunca "50%" nu quando e 1 de 2.
  // TODO(Ana): copy do aviso de amostra pequena.
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-black ${small ? "text-slate-400" : "text-violet-700"}`}
      title={small ? "Amostra pequena: taxa pouco confiável." : undefined}
    >
      {rate.toFixed(1)}%
      {small ? (
        <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[10px] font-black uppercase text-slate-500">
          amostra pequena
        </span>
      ) : null}
    </span>
  );
}

function FunnelStep({
  label,
  value,
  fromValue,
  detail,
}: {
  label: string;
  value: number;
  fromValue?: number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-violet-700">{label}</p>
          <p className="font-display text-3xl font-black text-slate-950">
            {fmtCount(value)}
          </p>
        </div>
        {typeof fromValue === "number" ? (
          <RatePill numerator={value} denominator={fromValue} />
        ) : null}
      </div>
      {detail ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function ConversionDashboard() {
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
        const params = new URLSearchParams({
          from: range!.from,
          to: range!.to,
        });
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
      {/* Seletor de periodo (mesmo padrao do FinanceDashboard) */}
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

      {/* Nota de honestidade do historico */}
      {/* TODO(Ana): copy da nota de instrumentacao recente. */}
      <p className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
        Os eventos do funil (checkout_started, checkout_abandoned,
        subscription_completed, pro_gate_hit) começaram a ser instrumentados
        recentemente. O funil reflete o período desde a instrumentação, não todo
        o histórico da plataforma.
      </p>

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
      ) : !state.hasData || !stats ? (
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
          <p className="font-display text-lg font-black text-slate-700">
            PostHog conectado
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Sem eventos neste período.
          </p>
        </div>
      ) : (
        <>
          {/* Funil: visitante -> cadastro -> checkout iniciado -> assinatura */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FunnelStep
              label="Visitantes únicos"
              value={stats.uniqueUsers}
              detail="Base do funil (pageviews distintos)"
            />
            <FunnelStep
              label="Cadastros"
              value={stats.events.user_signed_up}
              fromValue={stats.uniqueUsers}
              detail="dos visitantes únicos"
            />
            <FunnelStep
              label="Checkout iniciado"
              value={stats.events.checkout_started}
              fromValue={stats.events.user_signed_up}
              detail="dos cadastros"
            />
            <FunnelStep
              label="Assinatura concluída"
              value={stats.events.subscription_completed}
              fromValue={stats.events.checkout_started}
              detail="dos checkouts iniciados"
            />
          </div>

          {/* Abandono de checkout */}
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-violet-700">
                  Abandono de checkout
                </p>
                <p className="font-display text-3xl font-black text-slate-950">
                  {fmtCount(stats.events.checkout_abandoned)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {/* TODO(Ana): copy da taxa de abandono. */}
                  voltas da Stripe sem concluir
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase text-slate-500">
                  Taxa de abandono
                </p>
                <RatePill
                  numerator={stats.events.checkout_abandoned}
                  denominator={stats.events.checkout_started}
                />
              </div>
            </div>
          </div>

          {/* Ranking de gates Pro */}
          <article className="card-brutal rounded-3xl bg-white p-6">
            <h3 className="font-display text-2xl font-black text-slate-950">
              Gates Pro que mais empurram para assinar
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {/* TODO(Ana): copy do ranking de gates. */}
              De quem bateu no gate, quantos assinaram (overlap de pessoa no
              período).
            </p>
            <div className="mt-4 overflow-x-auto">
              {stats.proGates.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
                  Nenhum gate Pro batido neste período.
                </p>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-50">
                      <th className="px-4 py-3 font-black uppercase text-slate-600">
                        Recurso (gate)
                      </th>
                      <th className="px-4 py-3 font-black uppercase text-slate-600">
                        Batidas
                      </th>
                      <th className="px-4 py-3 font-black uppercase text-slate-600">
                        Pessoas
                      </th>
                      <th className="px-4 py-3 font-black uppercase text-slate-600">
                        Assinaram
                      </th>
                      <th className="px-4 py-3 font-black uppercase text-slate-600">
                        Conversão
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.proGates.map((gate) => (
                      <tr
                        key={gate.feature}
                        className="border-b border-slate-200 last:border-0"
                      >
                        <td className="px-4 py-3 font-black text-slate-900">
                          {gate.feature}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {fmtCount(gate.hits)}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-950">
                          {fmtCount(gate.people)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {fmtCount(gate.subscribers)}
                        </td>
                        <td className="px-4 py-3">
                          <RatePill
                            numerator={gate.subscribers}
                            denominator={gate.people}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </article>
        </>
      )}
    </div>
  );
}
