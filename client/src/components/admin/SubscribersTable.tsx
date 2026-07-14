import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";

// TODO(Ana): revisar TODA a copy visivel deste componente (titulos, labels de
// filtro, cabecalhos de coluna, badges de status/provider e mensagens de estado).

type SubscriberRow = {
  userId: string | null;
  email: string | null;
  planCode: string | null;
  planName: string | null;
  provider: string | null;
  status: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  affiliateCode: string | null;
  createdAt: string | null;
};

type SubscriberListData = {
  rows: SubscriberRow[];
  total: number;
  page: number;
  pageSize: number;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "border-emerald-600 bg-emerald-50 text-emerald-700" },
  trialing: { label: "Trial", className: "border-blue-500 bg-blue-50 text-blue-700" },
  past_due: { label: "Inadimplente", className: "border-amber-500 bg-amber-50 text-amber-700" },
  canceled: { label: "Cancelado", className: "border-slate-400 bg-slate-100 text-slate-600" },
  incomplete: { label: "Incompleto", className: "border-rose-400 bg-rose-50 text-rose-700" },
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "active", label: "Ativo" },
  { value: "trialing", label: "Trial" },
  { value: "past_due", label: "Inadimplente" },
  { value: "canceled", label: "Cancelado" },
  { value: "incomplete", label: "Incompleto" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "Todos os provedores" },
  { value: "stripe", label: "Stripe" },
  { value: "asaas", label: "Asaas (legado)" },
];

const PLAN_OPTIONS = [
  { value: "", label: "Todos os planos" },
  { value: "pro_monthly", label: "Mensal" },
  { value: "pro_semiannual", label: "Semestral" },
  { value: "pro_annual", label: "Anual" },
];

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  const meta = status ? STATUS_META[status] : undefined;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${
        meta?.className ?? "border-slate-300 bg-slate-50 text-slate-500"
      }`}
    >
      {meta?.label ?? status ?? "-"}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (provider === "stripe") {
    return (
      <span className="inline-flex rounded-full border-2 border-slate-900 bg-violet-100 px-2.5 py-0.5 text-xs font-black text-violet-800">
        Stripe
      </span>
    );
  }
  if (provider === "asaas") {
    return (
      <span className="inline-flex rounded-full border-2 border-slate-900 bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
        Asaas (legado)
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border-2 border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-black text-slate-500">
      {provider ?? "-"}
    </span>
  );
}

export function SubscribersTable() {
  const [data, setData] = useState<SubscriberListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const pageSize = 25;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (status) params.set("status", status);
        if (provider) params.set("provider", provider);
        if (planCode) params.set("planCode", planCode);
        if (search) params.set("search", search);
        const json: { data: SubscriberListData } = await adminFetch(
          `/subscribers?${params.toString()}`,
        );
        if (cancelled) return;
        setData(json.data);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar assinantes.",
        );
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, status, provider, planCode, search]);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  function resetToFirstPage(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-black uppercase text-slate-600">
          Status
          <select
            value={status}
            onChange={(event) => resetToFirstPage(setStatus, event.target.value)}
            className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-black uppercase text-slate-600">
          Provedor
          <select
            value={provider}
            onChange={(event) =>
              resetToFirstPage(setProvider, event.target.value)
            }
            className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-black uppercase text-slate-600">
          Plano
          <select
            value={planCode}
            onChange={(event) =>
              resetToFirstPage(setPlanCode, event.target.value)
            }
            className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="flex items-end gap-2"
        >
          <label className="text-xs font-black uppercase text-slate-600">
            Buscar e-mail
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="parte do e-mail"
              className="mt-1 block rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border-2 border-slate-900 bg-yellow-300 px-4 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a]"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]">
        {loading && !data ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Carregando assinantes...
          </p>
        ) : error ? (
          <p className="p-6 text-sm font-semibold text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm font-semibold text-slate-600">
            Nenhum assinante encontrado para estes filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="px-4 py-3 font-black uppercase text-slate-600">E-mail</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Plano</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Provedor</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Status</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Início período</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Fim período</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Cancelar no fim</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Afiliado</th>
                  <th className="px-4 py-3 font-black uppercase text-slate-600">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.userId ?? "sem-id"}-${index}`}
                    className="border-b border-slate-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.email ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.planName ?? row.planCode ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <ProviderBadge provider={row.provider} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.currentPeriodStart)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.currentPeriodEnd)}
                    </td>
                    <td className="px-4 py-3">
                      {row.cancelAtPeriodEnd ? (
                        <span className="inline-flex rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-700">
                          Agendado
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {row.affiliateCode ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">
            {Math.min((page - 1) * pageSize + 1, total)} a{" "}
            {Math.min(page * pageSize, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!canNext || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SubscribersSummary({ onSeeAll }: { onSeeAll?: () => void }) {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const json: { data: SubscriberListData } = await adminFetch(
          "/subscribers?page=1&pageSize=5",
        );
        if (cancelled) return;
        setRows(json.data.rows);
        setTotal(json.data.total);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar assinantes.",
        );
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-500">
        Carregando assinantes...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-700">
        {error}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white">
      <div className="flex items-center justify-between gap-2 border-b-2 border-slate-900 bg-slate-50 px-4 py-3">
        <p className="text-xs font-black uppercase text-slate-600">
          Assinantes recentes
        </p>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-black uppercase text-violet-700 hover:underline"
          >
            Ver todos ({total})
          </button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm font-semibold text-slate-600">
          Nenhum assinante ainda.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {rows.map((row, index) => (
            <li
              key={`${row.userId ?? "sem-id"}-${index}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {row.email ?? "-"}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {row.planName ?? row.planCode ?? "-"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ProviderBadge provider={row.provider} />
                <StatusBadge status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
