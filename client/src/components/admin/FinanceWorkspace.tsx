import { useRef, type ReactNode } from "react";
import { useLocation, useSearch } from "wouter";

import { ExpensesManager } from "@/components/admin/ExpensesManager";
import {
  FinanceDashboard,
  type FinancePeriodFilter,
} from "@/components/admin/FinanceDashboard";
import { FiscalInvoicesDashboard } from "@/components/admin/FiscalInvoicesDashboard";
import { OrphanPaymentsPanel } from "@/components/admin/OrphanPaymentsPanel";
import { SubscribersTable } from "@/components/admin/SubscribersTable";

export const FINANCE_VIEWS = [
  "resumo",
  "transacoes",
  "assinaturas",
  "despesas",
  "fiscal",
] as const;
export type FinanceView = (typeof FINANCE_VIEWS)[number];

const LABELS: Record<FinanceView, string> = {
  resumo: "Resumo",
  transacoes: "Transações",
  assinaturas: "Assinaturas",
  despesas: "Despesas",
  fiscal: "Fiscal",
};

export function financeViewFromSearch(search: string): FinanceView {
  const raw = new URLSearchParams(search).get("financeView");
  return FINANCE_VIEWS.includes(raw as FinanceView)
    ? (raw as FinanceView)
    : "resumo";
}

const FINANCE_PERIODS = [
  "30d",
  "90d",
  "previous_month",
  "custom",
  "all",
] as const;

export function financePeriodFromSearch(search: string): FinancePeriodFilter {
  const params = new URLSearchParams(search);
  const raw = params.get("financePeriod");
  const preset = FINANCE_PERIODS.includes(raw as FinancePeriodFilter["preset"])
    ? (raw as FinancePeriodFilter["preset"])
    : "30d";
  const filter = {
    preset,
    customFrom: params.get("financeFrom") ?? "",
    customTo: params.get("financeTo") ?? "",
  };
  if (
    filter.preset === "custom" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(filter.customFrom) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(filter.customTo) ||
      filter.customFrom > filter.customTo)
  ) {
    return { preset: "30d", customFrom: "", customTo: "" };
  }
  return filter;
}

function FinancePanel({
  active,
  children,
  view,
}: {
  active: boolean;
  children: ReactNode;
  view: FinanceView;
}) {
  return (
    <div
      id={`finance-panel-${view}`}
      role="tabpanel"
      aria-labelledby={`finance-tab-${view}`}
      hidden={!active}
    >
      {children}
    </div>
  );
}

export function FinanceWorkspace({
  refreshKey = 0,
  onExpenseChanged,
}: {
  refreshKey?: number;
  onExpenseChanged?: () => void;
}) {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const view = financeViewFromSearch(search);
  const periodFilter = financePeriodFromSearch(search);
  const visitedViews = useRef(new Set<FinanceView>());
  visitedViews.current.add(view);

  function selectView(next: FinanceView) {
    const params = new URLSearchParams(window.location.search);
    params.set("section", "financeiro");
    if (next === "resumo") params.delete("financeView");
    else params.set("financeView", next);
    setLocation(`/admin?${params.toString()}`);
  }

  function selectPeriod(next: FinancePeriodFilter) {
    const params = new URLSearchParams(window.location.search);
    if (next.preset === "30d") params.delete("financePeriod");
    else params.set("financePeriod", next.preset);
    if (next.customFrom) params.set("financeFrom", next.customFrom);
    else params.delete("financeFrom");
    if (next.customTo) params.set("financeTo", next.customTo);
    else params.delete("financeTo");
    setLocation(`/admin?${params.toString()}`);
  }

  function moveTab(current: FinanceView, direction: -1 | 1) {
    const currentIndex = FINANCE_VIEWS.indexOf(current);
    const nextIndex =
      (currentIndex + direction + FINANCE_VIEWS.length) % FINANCE_VIEWS.length;
    const next = FINANCE_VIEWS[nextIndex];
    selectView(next);
    requestAnimationFrame(() => {
      document.getElementById(`finance-tab-${next}`)?.focus();
    });
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Seções do financeiro"
        className="sticky top-16 z-30 -mx-1 overflow-x-auto border-b border-slate-300 bg-background/95 px-1 py-2 backdrop-blur"
      >
        <div role="tablist" className="flex min-w-max gap-1">
          {FINANCE_VIEWS.map((item) => (
            <button
              key={item}
              id={`finance-tab-${item}`}
              type="button"
              role="tab"
              aria-selected={view === item}
              aria-controls={`finance-panel-${item}`}
              tabIndex={view === item ? 0 : -1}
              onClick={() => selectView(item)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveTab(item, 1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveTab(item, -1);
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? FINANCE_VIEWS[0]
                      : FINANCE_VIEWS[FINANCE_VIEWS.length - 1];
                  selectView(next);
                  requestAnimationFrame(() => {
                    document.getElementById(`finance-tab-${next}`)?.focus();
                  });
                }
              }}
              className={`rounded-full border px-4 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                view === item
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-600"
              }`}
            >
              {LABELS[item]}
            </button>
          ))}
        </div>
      </nav>

      {visitedViews.current.has("resumo") ? (
        <FinancePanel view="resumo" active={view === "resumo"}>
          <div className="space-y-5">
            <FinanceDashboard
              refreshKey={refreshKey}
              view="summary"
              periodFilter={periodFilter}
              onPeriodFilterChange={selectPeriod}
            />
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("section", "afiliados");
                params.delete("financeView");
                setLocation(`/admin?${params.toString()}`);
              }}
              className="text-sm font-black text-violet-700 underline underline-offset-4"
            >
              Ver gestão de afiliados e comissões
            </button>
          </div>
        </FinancePanel>
      ) : null}

      {visitedViews.current.has("transacoes") ? (
        <FinancePanel view="transacoes" active={view === "transacoes"}>
          <FinanceDashboard
            refreshKey={refreshKey}
            view="transactions"
            periodFilter={periodFilter}
            onPeriodFilterChange={selectPeriod}
          />
        </FinancePanel>
      ) : null}

      {visitedViews.current.has("assinaturas") ? (
        <FinancePanel view="assinaturas" active={view === "assinaturas"}>
          <div className="space-y-8">
            <FinanceDashboard
              refreshKey={refreshKey}
              view="subscriptions"
              periodFilter={periodFilter}
              onPeriodFilterChange={selectPeriod}
            />
            <OrphanPaymentsPanel />
            <section aria-labelledby="finance-subscribers-title">
              <h2
                id="finance-subscribers-title"
                className="font-display text-2xl font-black text-slate-950"
              >
                Assinantes
              </h2>
              <p className="mb-4 mt-1 text-sm font-semibold text-slate-600">
                Lista operacional com filtros e paginação próprios.
              </p>
              <SubscribersTable />
            </section>
          </div>
        </FinancePanel>
      ) : null}

      {visitedViews.current.has("despesas") ? (
        <FinancePanel view="despesas" active={view === "despesas"}>
          <section aria-labelledby="finance-expenses-title">
            <div className="mb-5">
              <h2
                id="finance-expenses-title"
                className="font-display text-2xl font-black text-slate-950"
              >
                Despesas
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Resumo por categoria e lançamentos paginados.
              </p>
            </div>
            <ExpensesManager onChanged={onExpenseChanged} />
          </section>
        </FinancePanel>
      ) : null}

      {visitedViews.current.has("fiscal") ? (
        <FinancePanel view="fiscal" active={view === "fiscal"}>
          <section aria-labelledby="finance-fiscal-title">
            <div className="mb-5">
              <h2
                id="finance-fiscal-title"
                className="font-display text-2xl font-black text-slate-950"
              >
                Situação fiscal
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Pendências e histórico de NFS-e já registrados.
              </p>
            </div>
            <FiscalInvoicesDashboard />
          </section>
        </FinancePanel>
      ) : null}
    </div>
  );
}
