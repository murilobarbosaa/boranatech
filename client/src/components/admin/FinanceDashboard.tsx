import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { adminFetch } from "@/lib/adminApi";
import { providerLabelOf } from "@/lib/providerMeta";
import {
  type AdminFinanceContract,
  type FinanceAvailability,
  type FinanceCountMetric,
  type FinanceMoneyMetric,
} from "@shared/adminFinance";
import {
  PaymentMethodSummarySchema,
  type PaymentMethodSummary,
} from "@shared/adminFinanceMethods";
import { useHonestFinance } from "./useHonestFinance";

export type FinancePeriodFilter = {
  preset: AdminFinanceContract["period"]["preset"];
  customFrom: string;
  customTo: string;
};

type FinanceTx = {
  id: string;
  provider?: string | null;
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
  filterContractVersion?: number;
  appliedMethod?: string;
};

const PRESETS: Array<{ id: FinancePeriodFilter["preset"]; label: string }> = [
  { id: "30d", label: "Últimos 30 dias completos" },
  { id: "90d", label: "Últimos 90 dias completos" },
  { id: "previous_month", label: "Mês anterior" },
  { id: "all", label: "Todo histórico local" },
  { id: "custom", label: "Personalizado" },
];

const STATUS_LABEL: Record<FinanceAvailability, string> = {
  available: "Disponível",
  partial: "Parcial",
  unavailable: "Indisponível",
  not_collected: "Não coletado",
};

const TX_TYPE_LABEL: Record<string, string> = {
  charge: "Entrada",
  refund: "Reembolso",
  adjustment: "Ajuste",
  dispute: "Disputa",
  payout: "Repasse para conta bancária",
};

const EXCLUSION_LABELS: Record<
  keyof AdminFinanceContract["cash"]["exclusionsByReason"],
  string
> = {
  unsupportedType: "tipo não financeiro",
  unsupportedProvider: "provedor não suportado",
  missingIdentity: "identidade canônica ausente",
  invalidAmount: "valor inválido",
  invalidCurrency: "moeda inválida",
  invalidInstant: "instante inválido",
  outsidePeriod: "fora do período",
  economicConflict: "conflito econômico",
};

export function formatMoneyMetric(metric: FinanceMoneyMetric): string {
  if (metric.valueCents === null || metric.currency === null) {
    return STATUS_LABEL[metric.status];
  }
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: metric.currency,
    }).format(metric.valueCents / 100);
  } catch {
    return "Moeda indisponível";
  }
}

function formatCents(cents: number, currency: string): string {
  if (!Number.isSafeInteger(cents) || !/^[A-Z]{3}$/.test(currency)) {
    return "Dado inválido";
  }
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function formatCountMetric(metric: FinanceCountMetric): string {
  return metric.value === null
    ? STATUS_LABEL[metric.status]
    : new Intl.NumberFormat("pt-BR").format(metric.value);
}

function formatCivilDay(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : day;
}

function StatusBadge({ status }: { status: FinanceAvailability }) {
  return (
    <span className="rounded-full border border-amber-700 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">
      {STATUS_LABEL[status]}
    </span>
  );
}

function HonestCard({
  label,
  value,
  explanation,
  status,
  headingLevel = 3,
}: {
  label: string;
  value: string;
  explanation: string;
  status: FinanceAvailability;
  headingLevel?: 3 | 4;
}) {
  const Heading = `h${headingLevel}` as "h3" | "h4";
  return (
    <article className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]">
      <div className="flex items-start justify-between gap-2">
        <Heading className="text-xs font-black uppercase tracking-wide text-slate-600">
          {label}
        </Heading>
        {status !== "partial" ? <StatusBadge status={status} /> : null}
      </div>
      <p className="font-display mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{explanation}</p>
    </article>
  );
}

function FinanceMetadata({ data }: { data: AdminFinanceContract }) {
  const computed = new Date(data.computedAt).toLocaleString("pt-BR", {
    timeZone: data.period.timezone,
  });
  const fresh = data.cash.freshness
    ? new Date(data.cash.freshness).toLocaleString("pt-BR", {
        timeZone: data.period.timezone,
      })
    : "não coletada";
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
      <span>Cobertura {STATUS_LABEL[data.status].toLowerCase()}</span>
      <span aria-hidden="true">·</span>
      <strong>
        {formatCivilDay(data.period.startDay)} a{" "}
        {formatCivilDay(data.period.endDayInclusive)}
      </strong>
      <span aria-hidden="true">·</span>
      <span>Atualizado {computed}</span>
      <details className="relative">
        <summary className="cursor-pointer underline underline-offset-2">
          Sobre os dados
        </summary>
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[80vw] rounded-xl border border-slate-300 bg-white p-3 text-slate-700 shadow-lg">
          Fonte: finance_transactions. Última linha local observada em {fresh}.{" "}
          Fuso {data.period.timezone}. Paginação verificada por contagem, sem
          fotografia transacional e sem reconciliação com provedores.
        </div>
      </details>
    </div>
  );
}

export type FinanceDashboardView = "summary" | "transactions" | "subscriptions";

export function FinanceDashboard({
  refreshKey = 0,
  view = "summary",
  periodFilter,
  onPeriodFilterChange,
}: {
  refreshKey?: number;
  view?: FinanceDashboardView;
  periodFilter?: FinancePeriodFilter;
  onPeriodFilterChange?: (filter: FinancePeriodFilter) => void;
}) {
  const [localPeriodFilter, setLocalPeriodFilter] =
    useState<FinancePeriodFilter>({
      preset: "30d",
      customFrom: "",
      customTo: "",
    });
  const activePeriodFilter = periodFilter ?? localPeriodFilter;
  const { preset, customFrom, customTo } = activePeriodFilter;
  const setPeriodFilter = onPeriodFilterChange ?? setLocalPeriodFilter;
  const search = useSearch();
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(search);
  const [txData, setTxData] = useState<TxListData | null>(null);
  const requestedTxPage = Number(urlParams.get("financePage"));
  const txPage =
    Number.isSafeInteger(requestedTxPage) && requestedTxPage > 0
      ? requestedTxPage
      : 1;
  const txCurrency = urlParams.get("financeCurrency") ?? "";
  const txType = urlParams.get("financeType") ?? "";
  const txMethod =
    urlParams.get("paymentMethod") ?? urlParams.get("financeMethod") ?? "";
  function setTxFilter(changes: Record<string, string>, resetPage = true) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPage) params.delete("financePage");
    params.set("section", "financeiro");
    setLocation(`/admin?${params.toString()}`);
  }
  const [txLoading, setTxLoading] = useState(false);
  const [txDataKey, setTxDataKey] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [txErrorKey, setTxErrorKey] = useState("");
  const [methodData, setMethodData] = useState<PaymentMethodSummary | null>(
    null,
  );
  const [methodDataPeriod, setMethodDataPeriod] = useState("");
  const [methodError, setMethodError] = useState<string | null>(null);
  const [methodLoading, setMethodLoading] = useState(false);
  const [localFreshKey, setLocalFreshKey] = useState(0);
  const methodFreshUsed = useRef(0);
  const txFreshUsed = useRef(0);
  const {
    data,
    loading,
    error,
    refreshing,
    reload,
    params: periodQuery,
  } = useHonestFinance({ preset, customFrom, customTo }, { refreshKey });
  const currentMethodPeriod = data
    ? `${data.period.from}|${data.period.toExclusive}`
    : "";
  const visibleMethodData =
    methodDataPeriod === currentMethodPeriod ? methodData : null;
  const txQueryKey =
    data && view === "transactions"
      ? [
          data.period.from,
          data.period.toExclusive,
          data.computedAt,
          txCurrency,
          txType,
          txMethod,
          txPage,
          refreshKey,
        ].join("|")
      : "";
  const visibleTxData = txDataKey === txQueryKey ? txData : null;
  const visibleTxError = txErrorKey === txQueryKey ? txError : null;

  useEffect(() => {
    if (!data || view !== "summary") {
      setMethodData(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      from: data.period.from,
      toExclusive: data.period.toExclusive,
    });
    if (localFreshKey > methodFreshUsed.current) {
      methodFreshUsed.current = localFreshKey;
      params.set("fresh", "1");
    }
    setMethodLoading(true);
    setMethodError(null);
    adminFetch(`/finance/payment-methods?${params.toString()}`)
      .then((json: { data?: unknown }) => {
        if (cancelled) return;
        const parsed = PaymentMethodSummarySchema.parse(json.data);
        setMethodData(parsed);
        setMethodDataPeriod(`${data.period.from}|${data.period.toExclusive}`);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (
          err instanceof Error &&
          [
            "finance_method_scan_limit",
            "finance_method_evidence_limit",
          ].includes(String((err as Error & { code?: unknown }).code ?? ""))
        )
          setMethodData(null);
        setMethodError(
          err instanceof Error
            ? err.message
            : "Erro ao ler meios de pagamento.",
        );
      })
      .finally(() => {
        if (!cancelled) setMethodLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [data, refreshKey, localFreshKey, view]);

  useEffect(() => {
    if (!data || view !== "transactions") {
      setTxData(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      page: String(txPage),
      pageSize: "25",
      from: data.period.from,
      toExclusive: data.period.toExclusive,
    });
    if (txCurrency) params.set("currency", txCurrency);
    if (txType) params.set("type", txType);
    if (txMethod) params.set("method", txMethod);
    if (txMethod && localFreshKey > txFreshUsed.current) {
      txFreshUsed.current = localFreshKey;
      params.set("fresh", "1");
    }
    setTxLoading(true);
    setTxError(null);
    adminFetch(`/finance/transactions?${params.toString()}`)
      .then((json: { data?: TxListData }) => {
        if (cancelled) return;
        if (
          !json.data ||
          !Array.isArray(json.data.rows) ||
          !Number.isSafeInteger(json.data.total) ||
          json.data.total < 0 ||
          json.data.page !== txPage ||
          json.data.pageSize !== 25 ||
          json.data.rows.length !==
            Math.min(25, Math.max(0, json.data.total - (txPage - 1) * 25)) ||
          new Set(json.data.rows.map((row) => row.id)).size !==
            json.data.rows.length ||
          (txMethod &&
            (json.data.filterContractVersion !== 1 ||
              json.data.appliedMethod !== txMethod))
        ) {
          throw new Error("Contrato do extrato financeiro incompatível.");
        }
        setTxData(json.data);
        setTxDataKey(txQueryKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (
          err instanceof Error &&
          [
            "finance_method_scan_limit",
            "finance_method_evidence_limit",
          ].includes(String((err as Error & { code?: unknown }).code ?? ""))
        )
          setTxData(null);
        setTxErrorKey(txQueryKey);
        setTxError(
          err instanceof Error ? err.message : "Erro ao carregar o extrato.",
        );
      })
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    data,
    txCurrency,
    txPage,
    txType,
    txMethod,
    refreshKey,
    localFreshKey,
    view,
  ]);

  const currencies = data?.cash.currencies.map((item) => item.currency) ?? [];
  const txRows = visibleTxData?.rows;
  const txTotal = visibleTxData?.total;
  const effectiveTxLoading =
    txLoading ||
    (Boolean(txQueryKey) && txDataKey !== txQueryKey && !visibleTxError);

  return (
    <div className="space-y-6">
      <section aria-labelledby="finance-period-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="finance-period-title"
              className="font-display text-2xl font-black text-slate-950"
            >
              Período do financeiro
            </h2>
            <p className="text-sm font-semibold text-slate-600">
              Somente dias completos no fuso America/Sao_Paulo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalFreshKey((value) => value + 1);
              void reload(true);
            }}
            disabled={refreshing || !periodQuery}
            className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-50"
          >
            {refreshing ? "Atualizando leitura..." : "Atualizar leitura local"}
          </button>
        </div>
        <div aria-label="Filtros de período" className="flex flex-wrap gap-2">
          {PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={preset === option.id}
              onClick={() =>
                setPeriodFilter({ ...activePeriodFilter, preset: option.id })
              }
              className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase ${
                preset === option.id
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {preset === "custom" ? (
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-black uppercase text-slate-600">
              Primeiro dia completo
              <input
                aria-label="Primeiro dia completo"
                type="date"
                value={customFrom}
                onChange={(event) =>
                  setPeriodFilter({
                    ...activePeriodFilter,
                    customFrom: event.target.value,
                  })
                }
                className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
            <label className="text-xs font-black uppercase text-slate-600">
              Último dia completo
              <input
                aria-label="Último dia completo"
                type="date"
                value={customTo}
                onChange={(event) =>
                  setPeriodFilter({
                    ...activePeriodFilter,
                    customTo: event.target.value,
                  })
                }
                className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
              />
            </label>
          </div>
        ) : null}
      </section>

      <div aria-live="polite">
        {loading ? (
          <LoadingBlock label="Lendo fatos financeiros locais..." />
        ) : error ? (
          <ErrorBlock message={error} />
        ) : !periodQuery ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 p-5 text-sm font-bold text-slate-700">
            Informe o primeiro e o último dia completo.
          </div>
        ) : data ? (
          <div className="space-y-8">
            <FinanceMetadata data={data} />

            {view === "summary" ? (
              <section aria-labelledby="cash-title" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2
                      id="cash-title"
                      className="font-display text-3xl font-black text-slate-950"
                    >
                      Caixa registrado
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
                      Valores observados no registro local, separados por moeda.
                      Não representam faturamento contábil nem cobertura
                      integral.
                    </p>
                  </div>
                  <StatusBadge status={data.cash.status} />
                </div>

                {data.cash.status === "not_collected" ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 p-5">
                    <p className="font-display text-lg font-black text-slate-800">
                      Caixa não coletado para decisão
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Nenhuma linha local sustenta valores neste período e não
                      há manifesto de cobertura. Por isso os indicadores não são
                      exibidos como zero.
                    </p>
                  </div>
                ) : data.cash.currencies.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50 p-5">
                    <p className="font-display text-lg font-black text-slate-800">
                      Consulta local concluída sem movimentos agregáveis
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      A fonte respondeu para o período, mas nenhuma moeda possui
                      subtotal. Nenhum card monetário é fabricado como zero.
                    </p>
                  </div>
                ) : (
                  data.cash.currencies.map((bucket) => (
                    <div key={bucket.currency} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl font-black text-slate-950">
                          Movimentos em {bucket.currency}
                        </h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <HonestCard
                          headingLevel={4}
                          label="Caixa líquido calculável registrado"
                          value={formatMoneyMetric(bucket.calculableNet)}
                          explanation="Líquido dos movimentos locais aceitos; cobertura parcial."
                          status={bucket.calculableNet.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Entradas positivas registradas"
                          value={formatMoneyMetric(bucket.positiveEntries)}
                          explanation="Cobranças positivas locais deduplicadas."
                          status={bucket.positiveEntries.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Reembolsos registrados"
                          value={formatMoneyMetric(bucket.refunds)}
                          explanation="Somente devoluções presentes no registro local."
                          status={bucket.refunds.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Taxas registradas"
                          value={formatMoneyMetric(bucket.fees)}
                          explanation="Taxas observadas nos movimentos aceitos."
                          status={bucket.fees.status}
                        />
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-secondary">
                  <h3 className="font-display text-lg font-black text-slate-950">
                    Pagamentos e qualidade dos dados
                  </h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Pagamentos registrados", data.cash.registeredPayments],
                      [
                        "Pessoas identificadas",
                        data.cash.registeredPaymentPeople,
                      ],
                      [
                        "Pagamentos sem pessoa",
                        data.cash.registeredPaymentsWithoutPerson,
                      ],
                      ["Transações excluídas", data.cash.excludedTransactions],
                    ].map(([label, metric]) => (
                      <div key={label as string}>
                        <dt className="text-xs font-bold uppercase text-slate-600">
                          {label as string}
                        </dt>
                        <dd className="mt-1 text-xl font-black text-slate-950">
                          {formatCountMetric(metric as FinanceCountMetric)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-xs font-semibold">
                    As contagens usam a identidade canônica da Visão. Pessoas
                    identificadas não equivalem a clientes pagantes.
                  </p>
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-black">
                      Ver exclusões, conflitos e limitações
                    </summary>
                    <p className="mt-2">
                      Identidades conflitantes:{" "}
                      {formatCountMetric(data.cash.conflictingIdentities)}.
                      Duplicatas equivalentes ignoradas:{" "}
                      {data.cash.coverage.duplicateRowsIgnored}. Reembolsos
                      externos ausentes não são inferidos.
                    </p>
                    {data.cash.seriesDetail?.status === "unavailable" ? (
                      <p className="mt-1">
                        O total cobre todo o intervalo exibido. A série diária
                        detalhada não foi enviada{" "}
                        {data.cash.seriesDetail.reason ===
                        "daily_limit_exceeded"
                          ? `porque ultrapassa ${data.cash.seriesDetail.maxDailyPoints} pontos`
                          : "por falha restrita ao detalhe"}
                        ; nenhuma janela menor substituiu o histórico.
                      </p>
                    ) : null}
                    {data.cash.currencies.map((bucket) => (
                      <p key={bucket.currency} className="mt-1">
                        {bucket.currency}:{" "}
                        {formatCountMetric(bucket.transactionsWithoutPerson)}{" "}
                        transações aceitas sem pessoa.
                      </p>
                    ))}
                    <h4 className="mt-2 font-black">Exclusões por motivo</h4>
                    <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                      {Object.entries(data.cash.exclusionsByReason).map(
                        ([reason, quantity]) => (
                          <li key={reason}>
                            {EXCLUSION_LABELS[
                              reason as keyof typeof EXCLUSION_LABELS
                            ] ?? reason}
                            : {quantity}
                          </li>
                        ),
                      )}
                    </ul>
                  </details>
                </div>
                <section
                  aria-labelledby="payment-methods-title"
                  className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3
                        id="payment-methods-title"
                        className="font-display text-lg font-black text-slate-950"
                      >
                        Pagamentos por meio
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">
                        Pagamentos positivos confirmados no registro local; meio
                        comprovado pelo vínculo do pagamento.
                      </p>
                    </div>
                    {visibleMethodData ? (
                      <StatusBadge status={visibleMethodData.status} />
                    ) : null}
                  </div>
                  {methodError && visibleMethodData ? (
                    <p
                      className="mt-3 text-sm font-semibold text-amber-900"
                      role="status"
                    >
                      Última leitura válida deste período, desatualizada:{" "}
                      {methodError}
                    </p>
                  ) : null}
                  {methodLoading && !visibleMethodData ? (
                    <p className="mt-3 text-sm font-semibold">
                      Lendo meios registrados...
                    </p>
                  ) : methodError && !visibleMethodData ? (
                    <p className="mt-3 text-sm font-semibold text-rose-700">
                      Meios indisponíveis: {methodError}
                    </p>
                  ) : visibleMethodData?.status === "not_collected" ? (
                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Histórico local não coletado neste período; nenhuma
                      contagem é apresentada como zero.
                    </p>
                  ) : visibleMethodData ? (
                    <div className="mt-3 space-y-3">
                      {visibleMethodData.pix.length === 0 ? (
                        <p className="text-sm font-semibold text-slate-600">
                          Nenhum Pix comprovado nas linhas locais observadas
                          neste período.
                        </p>
                      ) : (
                        visibleMethodData.pix.map((bucket) => (
                          <div
                            key={bucket.currency}
                            className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-center"
                          >
                            <div>
                              <span className="text-xs font-bold uppercase text-slate-600">
                                Pix confirmado · {bucket.currency}
                              </span>
                              <p className="text-xl font-black">
                                {bucket.payments} pagamentos
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-bold uppercase text-slate-600">
                                Pessoas identificadas
                              </span>
                              <p className="text-xl font-black">
                                {bucket.people}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-bold uppercase text-slate-600">
                                Bruto recebido
                              </span>
                              <p className="text-xl font-black">
                                {formatCents(
                                  bucket.grossCents,
                                  bucket.currency,
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setTxFilter({
                                  financeView: "transacoes",
                                  paymentMethod: "pix",
                                  financeMethod: "",
                                  financeType: "charge",
                                  financeCurrency: bucket.currency,
                                })
                              }
                              className="rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black focus-visible:ring-2 focus-visible:ring-violet-500"
                            >
                              Ver movimentos Pix
                            </button>
                            {bucket.withoutPerson > 0 ? (
                              <p className="text-xs font-semibold text-amber-900 sm:col-span-4">
                                {bucket.withoutPerson} pagamento(s) sem pessoa
                                identificada.
                              </p>
                            ) : null}
                          </div>
                        ))
                      )}
                      {visibleMethodData.pix.some(
                        (bucket) => bucket.currency !== "BRL",
                      ) ? (
                        <p className="text-xs font-semibold text-amber-900">
                          Há pagamentos Pix em outras moedas; os valores
                          aparecem separados e não são somados.
                        </p>
                      ) : null}
                      <p className="text-xs font-semibold text-slate-600">
                        {visibleMethodData.paymentsWithoutMethod} pagamento(s)
                        sem meio identificado ·{" "}
                        {visibleMethodData.methodConflicts} conflito(s) de meio
                        · {visibleMethodData.excludedEconomicOrCurrency}{" "}
                        identidade(s) excluída(s) por conflito econômico ou
                        moeda. Cobertura histórica integral não verificável; sem
                        fotografia transacional.
                      </p>
                    </div>
                  ) : null}
                </section>
              </section>
            ) : null}

            {view !== "transactions" ? (
              <section aria-labelledby="access-title" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2
                      id="access-title"
                      className="font-display text-3xl font-black text-slate-950"
                    >
                      Acessos atuais
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
                      Estado operacional dos acessos atuais, sem afirmar
                      pagamento ou obrigação futura.
                    </p>
                  </div>
                  <StatusBadge status={data.accesses.status} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <HonestCard
                    label="Automáticos ativos"
                    value={formatCountMetric(data.accesses.automaticActive)}
                    explanation="Renovação automática informada; ainda não prova contrato pago."
                    status={data.accesses.automaticActive.status}
                  />
                  <HonestCard
                    label="Manuais pré-pagos ativos"
                    value={formatCountMetric(data.accesses.manualPrepaidActive)}
                    explanation="Separados da recorrência automática."
                    status={data.accesses.manualPrepaidActive.status}
                  />
                  <HonestCard
                    label="Em trial"
                    value={formatCountMetric(data.accesses.trialing)}
                    explanation="Trial não é cliente pagante."
                    status={data.accesses.trialing.status}
                  />
                </div>
                <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-secondary">
                  Pessoas com acessos conflitantes:{" "}
                  <strong>
                    {formatCountMetric(data.accesses.conflictingPeople)}
                  </strong>
                  {" · "}Cancelamentos agendados:{" "}
                  <strong>
                    {formatCountMetric(data.accesses.scheduledCancellation)}
                  </strong>
                  . Nenhum acesso conflitante é escolhido silenciosamente.
                </p>
                {data.accesses.catalogMonthlyValues.map((bucket) => (
                  <div key={bucket.currency} className="space-y-3">
                    <h3 className="font-display text-lg font-black text-slate-950">
                      Valores mensais de catálogo em {bucket.currency}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <HonestCard
                        headingLevel={4}
                        label="Acessos automáticos ativos"
                        value={formatMoneyMetric(bucket.automaticActive)}
                        explanation="Preço vigente mensalizado; não é dinheiro recebido nem obrigação contratual."
                        status={bucket.automaticActive.status}
                      />
                      <HonestCard
                        headingLevel={4}
                        label="Acessos manuais ativos"
                        value={formatMoneyMetric(bucket.manualPrepaidActive)}
                        explanation="Equivalente de catálogo do acesso pré-pago; não é receita recorrente."
                        status={bucket.manualPrepaidActive.status}
                      />
                    </div>
                  </div>
                ))}
                <p className="rounded-xl bg-slate-100 p-3 text-xs font-bold text-slate-700">
                  O valor de catálogo usa o preço vigente, não necessariamente o
                  contratado. Não serve para calcular ARR, churn ou retenção.
                </p>
              </section>
            ) : null}

            {view === "summary" ? (
              <section
                aria-labelledby="unavailable-title"
                className="rounded-2xl border border-slate-300 bg-slate-50 p-4"
              >
                <h2
                  id="unavailable-title"
                  className="font-display text-lg font-black text-slate-900"
                >
                  Métricas de recorrência ainda indisponíveis
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  O histórico atual ainda não permite calcular MRR, churn e
                  retenção contratual.
                </p>
                <details className="mt-2 text-sm text-slate-700">
                  <summary className="cursor-pointer font-black">
                    Ver limitações
                  </summary>
                  {data.unavailableIndicators.map((group) => (
                    <div key={group.names.join("|")} className="mt-3">
                      <StatusBadge status={group.status} />
                      <p className="mt-2 font-bold">
                        {group.names.join(" · ")}
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {group.limitations.join(" ")}
                      </p>
                    </div>
                  ))}
                </details>
              </section>
            ) : null}

            {view === "transactions" ? (
              <section aria-labelledby="ledger-title" className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2
                      id="ledger-title"
                      className="font-display text-2xl font-black text-slate-950"
                    >
                      Drill-down do ledger registrado
                    </h2>
                    <p className="text-sm font-semibold text-slate-600">
                      Rota administrativa protegida; sem nomes, emails ou ids
                      externos na interface.
                      <span className="block sm:hidden">
                        Arraste a tabela para ver os valores.
                      </span>
                    </p>
                  </div>
                  <div
                    aria-label="Filtros do extrato"
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="text-xs font-black uppercase text-slate-600">
                      Moeda
                      <select
                        aria-label="Filtrar extrato por moeda"
                        value={txCurrency}
                        onChange={(event) =>
                          setTxFilter({ financeCurrency: event.target.value })
                        }
                        className="ml-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                      >
                        <option value="">Todas, sem somar</option>
                        {currencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-black uppercase text-slate-600">
                      Tipo
                      <select
                        aria-label="Filtrar extrato por tipo"
                        value={txType}
                        onChange={(event) =>
                          setTxFilter({ financeType: event.target.value })
                        }
                        className="ml-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                      >
                        <option value="">Todos</option>
                        <option value="charge">Entrada</option>
                        <option value="refund">Reembolso</option>
                        <option value="adjustment">Ajuste</option>
                        <option value="dispute">Disputa</option>
                        <option value="payout">
                          Repasse para conta bancária
                        </option>
                      </select>
                    </label>
                    <label className="text-xs font-black uppercase text-slate-600">
                      Meio
                      <select
                        aria-label="Filtrar extrato por meio"
                        value={txMethod}
                        onChange={(event) =>
                          setTxFilter({
                            paymentMethod: event.target.value,
                            financeMethod: "",
                          })
                        }
                        className="ml-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                      >
                        <option value="">Todos</option>
                        <option value="pix">Pix comprovado</option>
                        <option value="card">Cartão comprovado</option>
                        <option value="boleto">Boleto comprovado</option>
                        <option value="unknown">Não identificado</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
                  {effectiveTxLoading && !txRows ? (
                    <LoadingBlock label="Carregando movimentos..." />
                  ) : visibleTxError && !txRows ? (
                    <div className="p-4">
                      <ErrorBlock message={visibleTxError} />
                    </div>
                  ) : txTotal === 0 ? (
                    <p className="p-5 text-sm font-semibold text-slate-600">
                      Nenhum movimento local registrado neste filtro.
                    </p>
                  ) : txRows ? (
                    <div>
                      {visibleTxError ? (
                        <p
                          className="px-4 pt-3 text-sm font-semibold text-amber-900"
                          role="status"
                        >
                          Último extrato válido deste filtro, desatualizado:{" "}
                          {visibleTxError}
                        </p>
                      ) : null}
                      <div className="overflow-x-auto touch-pan-x">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b-2 border-slate-900 bg-slate-50">
                              {[
                                "Data",
                                "Provedor",
                                "Tipo",
                                "Bruto",
                                "Taxa",
                                "Líquido",
                                "Plano",
                              ].map((heading) => (
                                <th
                                  key={heading}
                                  scope="col"
                                  className="px-4 py-3 text-xs font-black uppercase text-slate-600"
                                >
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {txRows.map((row) => (
                              <tr
                                key={row.id}
                                className="border-b border-slate-200"
                              >
                                <td className="px-4 py-3 text-slate-600">
                                  {new Date(row.occurred_at).toLocaleString(
                                    "pt-BR",
                                    {
                                      timeZone: data.period.timezone,
                                    },
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {providerLabelOf(row.provider)}
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                  {TX_TYPE_LABEL[row.type] ?? row.type}
                                  {row.type === "payout" ? (
                                    <span className="block text-xs font-medium text-slate-600">
                                      Transferência entre contas próprias; fora
                                      do líquido de pagamentos.
                                    </span>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3">
                                  {row.type === "payout"
                                    ? `Transferido: ${formatCents(Math.abs(row.gross_cents), row.currency)}`
                                    : formatCents(
                                        row.gross_cents,
                                        row.currency,
                                      )}
                                </td>
                                <td className="px-4 py-3">
                                  {formatCents(row.fee_cents, row.currency)}
                                </td>
                                <td className="px-4 py-3 font-black">
                                  {row.type === "payout"
                                    ? `Saída do saldo Stripe: ${formatCents(row.net_cents, row.currency)}`
                                    : formatCents(row.net_cents, row.currency)}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                  {row.plan_code ?? "Não atribuído"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="p-5 text-sm font-semibold text-slate-600">
                      Extrato indisponível.
                    </p>
                  )}
                  {typeof txTotal === "number" && txTotal > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-slate-900 px-4 py-3">
                      <span className="min-w-0 text-xs font-bold text-slate-500">
                        Página {txPage} · {txTotal} movimentos no conjunto
                        completo · {txRows?.length ?? 0} visíveis
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={txPage === 1 || effectiveTxLoading}
                          onClick={() =>
                            setTxFilter(
                              { financePage: String(Math.max(1, txPage - 1)) },
                              false,
                            )
                          }
                          className="min-h-10 rounded-full border-2 border-slate-900 px-3 py-2 text-xs font-black disabled:opacity-40"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          disabled={
                            txPage * 25 >= txTotal || effectiveTxLoading
                          }
                          onClick={() =>
                            setTxFilter(
                              { financePage: String(txPage + 1) },
                              false,
                            )
                          }
                          className="min-h-10 rounded-full border-2 border-slate-900 px-3 py-2 text-xs font-black disabled:opacity-40"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
