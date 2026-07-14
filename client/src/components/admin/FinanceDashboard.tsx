import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste bloco (titulos, labels dos cards,
// nota de receita adiantada, cabecalhos do extrato, botoes e estados).

type Deferred = {
  deferredCents: number;
  consideredCount: number;
  unmappedCount: number;
};

type FinanceSummary = {
  from: string;
  to: string;
  receitaBrutaCents: number;
  reembolsosCents: number;
  taxasStripeCents: number;
  receitaLiquidaCents: number;
  despesasCents: number;
  lucroCents: number;
  margemPercent: number | null;
  despesasPorCategoria: Array<{ category: string; cents: number }>;
  receitaPorPlano: Array<{ planCode: string; cents: number }>;
  deferred: Deferred;
};

type TimeseriesPoint = {
  month: string;
  receitaLiquidaCents: number;
  despesasCents: number;
  lucroCents: number;
};

type FinanceTx = {
  id: string;
  stripe_charge_id: string | null;
  type: string;
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  currency: string;
  occurred_at: string;
  plan_code: string | null;
};

type TxListData = {
  rows: FinanceTx[];
  total: number;
  page: number;
  pageSize: number;
};

type Preset = "current_month" | "last_3" | "last_12" | "custom";

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "current_month", label: "Mês atual" },
  { id: "last_3", label: "Últimos 3 meses" },
  { id: "last_12", label: "Últimos 12 meses" },
  { id: "custom", label: "Personalizado" },
];

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function fmtCents(cents: number): string {
  return brl.format(cents / 100);
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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

const TX_TYPE_LABEL: Record<string, string> = {
  charge: "Cobrança",
  refund: "Reembolso",
  adjustment: "Ajuste",
  dispute: "Disputa",
  payout: "Repasse",
};

function ResultCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "profit" | "loss";
}) {
  const valueClass =
    tone === "loss"
      ? "text-rose-700"
      : tone === "profit"
        ? "text-emerald-700"
        : "text-slate-950";
  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-[4px_4px_0_#0f172a]">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`font-display mt-1 text-3xl font-black ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export function FinanceDashboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [preset, setPreset] = useState<Preset>("last_3");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [txData, setTxData] = useState<TxListData | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  // Range memoizado: o `now` do preset e calculado UMA vez por combinacao de
  // [preset, customFrom, customTo], nao a cada render. Assim a identidade do
  // objeto (e o valor de `to`) so muda quando o usuario muda o filtro, o que
  // quebra o loop de requisicoes (antes `to = now.toISOString()` mudava todo
  // render, recriando loadResult e redisparando o effect indefinidamente).
  const range = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const loadResult = useCallback(async () => {
    if (!range) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const [summaryJson, seriesJson]: [
        { data: FinanceSummary },
        { data: TimeseriesPoint[] },
      ] = await Promise.all([
        adminFetch(`/finance/summary?${params.toString()}`),
        adminFetch(`/finance/timeseries?${params.toString()}`),
      ]);
      setSummary(summaryJson.data);
      setSeries(Array.isArray(seriesJson.data) ? seriesJson.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar o resultado.",
      );
      setSummary(null);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadResult();
  }, [loadResult, refreshKey, localRefresh]);

  useEffect(() => {
    let cancelled = false;
    async function loadTx() {
      setTxLoading(true);
      setTxError(null);
      try {
        const json: { data: TxListData } = await adminFetch(
          `/finance/transactions?page=${txPage}&pageSize=25`,
        );
        if (cancelled) return;
        setTxData(json.data);
      } catch (err) {
        if (cancelled) return;
        setTxError(
          err instanceof Error ? err.message : "Erro ao carregar o extrato.",
        );
        setTxData(null);
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    }
    void loadTx();
    return () => {
      cancelled = true;
    };
  }, [txPage, refreshKey, localRefresh]);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      await adminFetch("/finance/sync", { method: "POST" });
      setLocalRefresh((k) => k + 1);
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "Falha ao sincronizar com a Stripe.",
      );
    } finally {
      setSyncing(false);
    }
  }

  const chartData = series.map((p) => ({
    month: p.month,
    receita: p.receitaLiquidaCents / 100,
    despesa: p.despesasCents / 100,
    lucro: p.lucroCents / 100,
  }));

  const txRows = txData?.rows ?? [];
  const txTotal = txData?.total ?? 0;
  const txCanPrev = txPage > 1;
  const txCanNext = txPage * 25 < txTotal;

  return (
    <div className="space-y-6">
      {/* Seletor de periodo */}
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

      {/* Bloco RESULTADO */}
      {loading ? (
        <LoadingBlock label="Carregando resultado..." />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : !summary ? (
        <LoadingBlock label="Carregando resultado..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ResultCard
              label="Receita líquida"
              value={fmtCents(summary.receitaLiquidaCents)}
            />
            <ResultCard
              label="Despesas"
              value={fmtCents(summary.despesasCents)}
            />
            <ResultCard
              label="Lucro"
              value={fmtCents(summary.lucroCents)}
              tone={summary.lucroCents < 0 ? "loss" : "profit"}
            />
            {summary.margemPercent === null ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase text-slate-500">
                  Margem
                </p>
                <p className="font-display mt-1 text-lg font-black text-slate-700">
                  Dados insuficientes
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Sem receita líquida positiva no período.
                </p>
              </div>
            ) : (
              <ResultCard
                label="Margem"
                value={`${summary.margemPercent.toFixed(1)}%`}
                tone={summary.margemPercent < 0 ? "loss" : "profit"}
              />
            )}
          </div>

          {/* Detalhe menor: bruto, taxas, reembolsos */}
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
            <span>Receita bruta: {fmtCents(summary.receitaBrutaCents)}</span>
            <span>Taxas Stripe: {fmtCents(summary.taxasStripeCents)}</span>
            <span>Reembolsos: {fmtCents(summary.reembolsosCents)}</span>
          </div>

          {/* Nota de receita adiantada */}
          {summary.deferred.deferredCents > 0 ? (
            <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
              {/* TODO(Ana): copy final da nota de receita adiantada. */}
              <p className="text-sm font-black text-amber-900">
                {fmtCents(summary.deferred.deferredCents)} do seu caixa se refere
                a meses futuros já pagos (planos semestrais/anuais em vigência).
              </p>
              {summary.deferred.unmappedCount > 0 ? (
                <p className="mt-1 text-xs font-semibold text-amber-800">
                  {summary.deferred.unmappedCount} assinatura(s) sem cobrança
                  mapeada ainda; não estimadas.
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Grafico entrada x saida + linha de lucro */}
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#0f172a]">
            <p className="mb-3 text-xs font-black uppercase text-slate-600">
              Entrada x saída por mês
            </p>
            {chartData.length === 0 ? (
              <p className="p-6 text-center text-sm font-bold text-slate-500">
                Sem dados no período.
              </p>
            ) : (
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => brl.format(Number(value))} />
                    <Legend />
                    <Bar
                      dataKey="receita"
                      name="Receita líquida"
                      fill="#059669"
                    />
                    <Bar dataKey="despesa" name="Despesas" fill="#e11d48" />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      name="Lucro"
                      stroke="#7c3aed"
                      strokeWidth={3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bloco EXTRATO (transacoes da Stripe) */}
      <div className="rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-900 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase text-slate-600">
            Extrato da Stripe
          </p>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_#0f172a] disabled:opacity-50"
          >
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        </div>
        {syncError ? (
          <div className="p-4">
            <ErrorBlock message={syncError} />
          </div>
        ) : null}
        {txLoading && !txData ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Carregando extrato...
          </p>
        ) : txError ? (
          <div className="p-4">
            <ErrorBlock message={txError} />
          </div>
        ) : txRows.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Nenhuma transação sincronizada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Data</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Tipo</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Bruto</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Taxa</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Líquido</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Plano</th>
                </tr>
              </thead>
              <tbody>
                {txRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(row.occurred_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {TX_TYPE_LABEL[row.type] ?? row.type}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {fmtCents(row.gross_cents)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fmtCents(row.fee_cents)}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">
                      {fmtCents(row.net_cents)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {row.plan_code ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {txTotal > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t-2 border-slate-900 px-4 py-3">
            <p className="text-xs font-bold text-slate-500">
              {Math.min((txPage - 1) * 25 + 1, txTotal)} a{" "}
              {Math.min(txPage * 25, txTotal)} de {txTotal}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!txCanPrev || txLoading}
                onClick={() => setTxPage((p) => Math.max(p - 1, 1))}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={!txCanNext || txLoading}
                onClick={() => setTxPage((p) => p + 1)}
                className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
