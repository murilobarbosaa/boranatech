import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste bloco (titulos, rotulos das
// faixas, linha de cobertura do PostHog, aviso de historico curto e nota de
// divergencia com "Usuarios em risco").

// Espelha o union do backend (server/lib/usageRetention.ts). O client nunca
// colapsa not_configured / error / ok numa tela so.
type LastAccessBand = {
  key: string;
  count: number;
  minDays: number;
  maxDays: number | null;
};
type FrequencyBand = { key: string; count: number };
type UsageRetentionData = {
  baseTotal: number;
  posthogKnown: number;
  posthogUnknown: number;
  historyDays: number;
  lastAccess: LastAccessBand[];
  frequency: FrequencyBand[];
};
type UsageRetentionState =
  | { state: "not_configured"; missing: string[] }
  | { state: "error"; reason: string; httpStatus?: number }
  | { state: "ok"; data: UsageRetentionData };

// TODO(Ana): rotulos das faixas de ultimo acesso.
const LAST_ACCESS_LABELS: Record<string, string> = {
  today: "Hoje",
  d1_3: "1 a 3 dias",
  d4_7: "4 a 7 dias",
  d8_14: "8 a 14 dias",
  d15_30: "15 a 30 dias",
  d30plus: "Mais de 30 dias",
};

// TODO(Ana): rotulos das faixas de frequencia.
const FREQUENCY_LABELS: Record<string, string> = {
  d1: "1 dia",
  d2: "2 dias",
  d3plus: "3 dias ou mais",
  nodata: "Sem dado de navegação",
};

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function DistributionRow({
  label,
  count,
  total,
  muted,
  note,
}: {
  label: string;
  count: number;
  total: number;
  muted?: boolean;
  note?: string;
}) {
  const percent = pct(count, total);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-sm font-black ${muted ? "text-slate-400" : "text-slate-800"}`}
        >
          {label}
        </span>
        {muted && note ? (
          <span className="text-xs font-bold italic text-slate-400">
            {note}
          </span>
        ) : (
          <span className="text-sm font-bold text-slate-600">
            {count}
            <span className="ml-2 font-black text-violet-700">{percent}%</span>
          </span>
        )}
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full border-2 border-slate-900 bg-white">
        <div
          className={`h-full ${muted ? "bg-slate-200" : "bg-violet-600"}`}
          style={{ width: muted ? "0%" : `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

export function UsageRetentionDashboard() {
  const [state, setState] = useState<UsageRetentionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminFetch("/usage-retention")
      .then((json) => {
        if (cancelled) return;
        setState(json.data as UsageRetentionState);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar retenção de uso.",
        );
        setState(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!state) return <LoadingBlock />;

  if (state.state === "not_configured") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
        {/* TODO(Ana): copy do estado nao configurado. */}
        <p className="font-display text-lg font-black text-amber-900">
          PostHog não configurado
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-800">
          Sem as credenciais do PostHog não dá para medir uso real. Faltando:{" "}
          {state.missing.length
            ? state.missing.join(", ")
            : "credenciais do PostHog"}
          .
        </p>
      </div>
    );
  }

  if (state.state === "error") {
    return (
      <ErrorBlock
        message={`Falha ao consultar o PostHog${
          typeof state.httpStatus === "number"
            ? ` (HTTP ${state.httpStatus})`
            : ""
        }: ${state.reason}`}
      />
    );
  }

  const { data } = state;
  const coveragePct = pct(data.posthogKnown, data.baseTotal);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-2xl font-black text-slate-950">
          {/* TODO(Ana): titulo do bloco de retencao de uso. */}
          Retenção de uso
        </h3>
        {/* TODO(Ana): copy da linha de cobertura do PostHog (o buraco visivel). */}
        <p className="mt-1 text-sm font-semibold text-slate-600">
          O PostHog conhece a navegação de{" "}
          <span className="font-black text-slate-900">
            {data.posthogKnown} de {data.baseTotal}
          </span>{" "}
          usuários ({coveragePct}%). Os outros {data.posthogUnknown} não têm dado
          de navegação: entraram na base antes do rastreio ou não navegaram
          logados. Não sabemos se sumiram, só que não temos como afirmar.
        </p>
      </div>

      {/* Bloco 1: dias desde o ultimo acesso. */}
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
        <p className="font-display text-lg font-black text-slate-950">
          {/* TODO(Ana): titulo do bloco de ultimo acesso. */}
          Dias desde o último acesso
        </p>
        {/* TODO(Ana): copy da explicacao da fonte cruzada. */}
        <p className="mt-1 text-xs font-bold text-slate-500">
          O mais recente entre o último login e a última navegação, por pessoa.
          Cobre os {data.baseTotal} da base.
        </p>
        <div className="mt-4 space-y-3">
          {data.lastAccess.map((band) => {
            const impossible = band.minDays > data.historyDays;
            return (
              <DistributionRow
                key={band.key}
                label={LAST_ACCESS_LABELS[band.key] ?? band.key}
                count={band.count}
                total={data.baseTotal}
                muted={impossible}
                // TODO(Ana): copy do selo de faixa sem historico ainda.
                note="sem histórico ainda"
              />
            );
          })}
        </div>
        {/* TODO(Ana): copy do aviso de historico curto. */}
        <p className="mt-4 text-xs font-bold italic text-slate-400">
          A plataforma tem {data.historyDays}{" "}
          {data.historyDays === 1 ? "dia" : "dias"} de dados. As faixas mais
          longas ainda não têm como existir: aparecem apagadas, não como zero.
        </p>
      </div>

      {/* Bloco 2: frequencia de uso. */}
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
        <p className="font-display text-lg font-black text-slate-950">
          {/* TODO(Ana): titulo do bloco de frequencia. */}
          Frequência de uso
        </p>
        {/* TODO(Ana): copy da explicacao da frequencia e do "sem dado". */}
        <p className="mt-1 text-xs font-bold text-slate-500">
          Em quantos dias distintos cada pessoa navegou. Percentuais sobre os{" "}
          {data.baseTotal} da base. "Sem dado de navegação" é ausência de
          informação, não afirmação de que a pessoa não usou.
        </p>
        <div className="mt-4 space-y-3">
          {data.frequency.map((band) => (
            <DistributionRow
              key={band.key}
              label={FREQUENCY_LABELS[band.key] ?? band.key}
              count={band.count}
              total={data.baseTotal}
              muted={band.key === "nodata"}
              // TODO(Ana): copy do rotulo de contagem quando nao ha dado.
              note={
                band.key === "nodata"
                  ? `${band.count} sem dado`
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* TODO(Ana): copy da nota de divergencia com "Usuarios em risco". */}
      <p className="text-xs font-bold text-slate-500">
        Nota: o bloco "Usuários em risco" usa só a data de login. Estes números
        cruzam login com navegação real, então quem usa logado sem relogar
        aparece ativo aqui e some de lá. É esperado que divirjam.
      </p>
    </div>
  );
}
