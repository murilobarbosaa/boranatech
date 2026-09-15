import { useEffect, useState } from "react";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { adminFetch } from "@/lib/adminApi";
import { providerLabelOf } from "@/lib/providerMeta";
import {
  type AdminFinanceContract,
  type FinanceAvailability,
  type FinanceCountMetric,
  type FinanceMoneyMetric,
} from "@shared/adminFinance";
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
};

const PRESETS: Array<{ id: FinancePeriodFilter["preset"]; label: string }> = [
  { id: "30d", label: "Últimos 30 dias completos" },
  { id: "90d", label: "Últimos 90 dias completos" },
  { id: "previous_month", label: "Mês anterior" },
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
  payout: "Repasse excluído",
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
  const [txData, setTxData] = useState<TxListData | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [txCurrency, setTxCurrency] = useState("");
  const [txType, setTxType] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const {
    data,
    loading,
    error,
    refreshing,
    reload,
    params: periodQuery,
  } = useHonestFinance({ preset, customFrom, customTo }, { refreshKey });

  useEffect(() => {
    setTxPage(1);
  }, [preset, customFrom, customTo, txCurrency, txType]);

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
    setTxLoading(true);
    setTxError(null);
    adminFetch(`/finance/transactions?${params.toString()}`)
      .then((json: { data?: TxListData }) => {
        if (cancelled) return;
        if (
          !json.data ||
          !Array.isArray(json.data.rows) ||
          !Number.isSafeInteger(json.data.total)
        ) {
          throw new Error("Contrato do extrato financeiro incompatível.");
        }
        setTxData(json.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTxData(null);
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
  }, [data, txCurrency, txPage, txType, refreshKey, view]);

  const currencies = data?.cash.currencies.map((item) => item.currency) ?? [];
  const txRows = txData?.rows;
  const txTotal = txData?.total;

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
            onClick={() => void reload(true)}
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
                      Movimentos presentes em finance_transactions. Não
                      representa faturamento contábil nem garante cobertura
                      integral.
                    </p>
                  </div>
                  <StatusBadge status={data.cash.status} />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <HonestCard
                    label="Pagamentos registrados"
                    value={formatCountMetric(data.cash.registeredPayments)}
                    explanation="Mesma elegibilidade e identidade canônica da Visão (ADM-001)."
                    status={data.cash.registeredPayments.status}
                  />
                  <HonestCard
                    label="Pessoas identificadas nos pagamentos"
                    value={formatCountMetric(data.cash.registeredPaymentPeople)}
                    explanation="user_id distintos nas cobranças canônicas; não é contagem de clientes pagantes."
                    status={data.cash.registeredPaymentPeople.status}
                  />
                  <HonestCard
                    label="Pagamentos sem pessoa"
                    value={formatCountMetric(
                      data.cash.registeredPaymentsWithoutPerson,
                    )}
                    explanation="Cobranças canônicas sem user_id persistido."
                    status={data.cash.registeredPaymentsWithoutPerson.status}
                  />
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
                          label="Entradas positivas registradas"
                          value={formatMoneyMetric(bucket.positiveEntries)}
                          explanation="Soma do bruto de charges positivas deduplicadas."
                          status={bucket.positiveEntries.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Reembolsos registrados"
                          value={formatMoneyMetric(bucket.refunds)}
                          explanation="Somente refunds presentes no ledger; devolução externa fica fora."
                          status={bucket.refunds.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Taxas registradas"
                          value={formatMoneyMetric(bucket.fees)}
                          explanation="Soma assinada de fee_cents das movimentações aceitas."
                          status={bucket.fees.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Líquido calculável registrado"
                          value={formatMoneyMetric(bucket.calculableNet)}
                          explanation="Soma de net_cents de entradas, refunds, ajustes e disputas."
                          status={bucket.calculableNet.status}
                        />
                        <HonestCard
                          headingLevel={4}
                          label="Transações sem pessoa"
                          value={formatCountMetric(
                            bucket.transactionsWithoutPerson,
                          )}
                          explanation="Movimentos aceitos sem user_id persistido."
                          status={bucket.transactionsWithoutPerson.status}
                        />
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                  <p>
                    Excluídas por dado inválido ou conflito econômico:{" "}
                    <strong>
                      {formatCountMetric(data.cash.excludedTransactions)}
                    </strong>
                    . Identidades conflitantes:{" "}
                    <strong>
                      {formatCountMetric(data.cash.conflictingIdentities)}
                    </strong>
                    .
                  </p>
                  <p className="mt-1 text-xs">
                    Duplicatas equivalentes ignoradas:{" "}
                    {data.cash.coverage.duplicateRowsIgnored}. A leitura não
                    infere reembolsos externos ausentes.
                  </p>
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-black">
                      Ver exclusões por motivo
                    </summary>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
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
                      Estado operacional atual de subscriptions, sem afirmar
                      pagamento ou obrigação futura.
                    </p>
                  </div>
                  <StatusBadge status={data.accesses.status} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <HonestCard
                    label="Automáticos ativos"
                    value={formatCountMetric(data.accesses.automaticActive)}
                    explanation="Acessos com renewal_type auto; ainda não prova contrato pago."
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
                  <HonestCard
                    label="Pessoas com acessos conflitantes"
                    value={formatCountMetric(data.accesses.conflictingPeople)}
                    explanation="Mais de uma subscription atual: nenhuma é escolhida silenciosamente."
                    status={data.accesses.conflictingPeople.status}
                  />
                  <HonestCard
                    label="Cancelamento agendado"
                    value={formatCountMetric(
                      data.accesses.scheduledCancellation,
                    )}
                    explanation="Acesso ainda atual até o fim do período; renovação futura não presumida."
                    status={data.accesses.scheduledCancellation.status}
                  />
                </div>
                {data.accesses.catalogMonthlyValues.map((bucket) => (
                  <div
                    key={bucket.currency}
                    className="rounded-2xl border-2 border-slate-900 bg-white p-4"
                  >
                    <h3 className="font-display text-lg font-black text-slate-950">
                      Valores mensais de catálogo em {bucket.currency}
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                        onChange={(event) => setTxCurrency(event.target.value)}
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
                        onChange={(event) => setTxType(event.target.value)}
                        className="ml-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                      >
                        <option value="">Todos</option>
                        <option value="charge">Entrada</option>
                        <option value="refund">Reembolso</option>
                        <option value="adjustment">Ajuste</option>
                        <option value="dispute">Disputa</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white">
                  {txLoading && !txRows ? (
                    <LoadingBlock label="Carregando movimentos..." />
                  ) : txError ? (
                    <div className="p-4">
                      <ErrorBlock message={txError} />
                    </div>
                  ) : txTotal === 0 ? (
                    <p className="p-5 text-sm font-semibold text-slate-600">
                      Nenhum movimento local registrado neste filtro.
                    </p>
                  ) : txRows ? (
                    <div className="overflow-x-auto">
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
                              </td>
                              <td className="px-4 py-3">
                                {formatCents(row.gross_cents, row.currency)}
                              </td>
                              <td className="px-4 py-3">
                                {formatCents(row.fee_cents, row.currency)}
                              </td>
                              <td className="px-4 py-3 font-black">
                                {formatCents(row.net_cents, row.currency)}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {row.plan_code ?? "Não atribuído"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="p-5 text-sm font-semibold text-slate-600">
                      Extrato indisponível.
                    </p>
                  )}
                  {typeof txTotal === "number" && txTotal > 0 ? (
                    <div className="flex items-center justify-between border-t-2 border-slate-900 px-4 py-3">
                      <span className="text-xs font-bold text-slate-500">
                        Página {txPage} · {txTotal} movimentos
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={txPage === 1 || txLoading}
                          onClick={() =>
                            setTxPage((page) => Math.max(1, page - 1))
                          }
                          className="rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black disabled:opacity-40"
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          disabled={txPage * 25 >= txTotal || txLoading}
                          onClick={() => setTxPage((page) => page + 1)}
                          className="rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black disabled:opacity-40"
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
