import { useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { BntSelect } from "@/components/shared/BntSelect";

// TODO(Ana): revisar TODA a copy visivel deste bloco (labels do formulario,
// categorias, cabecalhos da tabela, mensagens de estado e o aviso de cambio).

type Expense = {
  id: string;
  description: string;
  category: string;
  vendor: string | null;
  kind: string;
  amount_cents: number;
  currency: string;
  amount_brl_cents: number;
  fx_rate: number | null;
  fx_date: string | null;
  incurred_on: string;
  recurrence_start: string | null;
  recurrence_end: string | null;
  recurrence_interval: string | null;
  notes: string | null;
};

type ExpenseListData = {
  rows: Expense[];
  total: number;
  page: number;
  pageSize: number;
};

const CATEGORIES = [
  { value: "infra", label: "Infra" },
  { value: "ia", label: "IA" },
  { value: "email", label: "E-mail" },
  { value: "marketing", label: "Marketing" },
  { value: "juridico", label: "Jurídico" },
  { value: "contabil", label: "Contábil" },
  { value: "ferramentas", label: "Ferramentas" },
  { value: "dominio", label: "Domínio" },
  { value: "outros", label: "Outros" },
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
function fmtBrlCents(cents: number): string {
  return brl.format(cents / 100);
}

type FormState = {
  description: string;
  category: string;
  vendor: string;
  kind: "one_off" | "recurring";
  amount: string; // na moeda original, ex "50.00"
  currency: "BRL" | "USD";
  incurred_on: string;
  recurrence_start: string;
  recurrence_end: string;
  recurrence_interval: "monthly" | "yearly";
  notes: string;
};

const EMPTY_FORM: FormState = {
  description: "",
  category: "infra",
  vendor: "",
  kind: "one_off",
  amount: "",
  currency: "BRL",
  incurred_on: "",
  recurrence_start: "",
  recurrence_end: "",
  recurrence_interval: "monthly",
  notes: "",
};

function amountToCents(amount: string): number | null {
  const n = Number(amount.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function ExpensesManager({ onChanged }: { onChanged?: () => void }) {
  const [data, setData] = useState<ExpenseListData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxDate, setFxDate] = useState<string | null>(null);
  const [fxError, setFxError] = useState<string | null>(null);

  const [breakdown, setBreakdown] = useState<
    Array<{ category: string; cents: number }>
  >([]);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json: { data: ExpenseListData } = await adminFetch(
        `/finance/expenses?page=${page}&pageSize=25`,
      );
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar despesas.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadBreakdown = useCallback(async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: now.toISOString(),
      });
      const json: { data: { despesasPorCategoria: Array<{ category: string; cents: number }> } } =
        await adminFetch(`/finance/summary?${params.toString()}`);
      setBreakdown(json.data.despesasPorCategoria ?? []);
      setBreakdownError(null);
    } catch (err) {
      // Erro vira estado de erro visivel, nunca vazio mascarando falha.
      setBreakdown([]);
      setBreakdownError(
        err instanceof Error ? err.message : "Erro ao carregar o breakdown.",
      );
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);
  useEffect(() => {
    void loadBreakdown();
  }, [loadBreakdown]);

  // Busca a cotacao PTAX que SERA usada quando a moeda for USD (preview).
  useEffect(() => {
    let cancelled = false;
    if (form.currency !== "USD") {
      setFxRate(null);
      setFxDate(null);
      setFxError(null);
      return;
    }
    setFxError(null);
    adminFetch(`/finance/fx-preview?currency=USD`)
      .then((json: { data: { rate: number; quoteDate: string | null } }) => {
        if (cancelled) return;
        setFxRate(json.data.rate);
        setFxDate(json.data.quoteDate);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFxRate(null);
        setFxDate(null);
        setFxError(
          err instanceof Error ? err.message : "Cotação indisponível agora.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [form.currency]);

  const amountCents = amountToCents(form.amount);
  const previewBrlCents =
    form.currency === "USD" && amountCents !== null && fxRate !== null
      ? Math.round(amountCents * fxRate)
      : form.currency === "BRL" && amountCents !== null
        ? amountCents
        : null;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(exp: Expense) {
    setEditingId(exp.id);
    setForm({
      description: exp.description,
      category: exp.category,
      vendor: exp.vendor ?? "",
      kind: exp.kind === "recurring" ? "recurring" : "one_off",
      amount: (exp.amount_cents / 100).toFixed(2),
      currency: exp.currency === "USD" ? "USD" : "BRL",
      incurred_on: exp.incurred_on,
      recurrence_start: exp.recurrence_start ?? "",
      recurrence_end: exp.recurrence_end ?? "",
      recurrence_interval:
        exp.recurrence_interval === "yearly" ? "yearly" : "monthly",
      notes: exp.notes ?? "",
    });
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const cents = amountToCents(form.amount);
    if (cents === null) {
      setFormError("Valor inválido."); // TODO(Ana)
      return;
    }
    if (!form.description.trim()) {
      setFormError("Descrição obrigatória."); // TODO(Ana)
      return;
    }
    if (!form.incurred_on) {
      setFormError("Data de competência obrigatória."); // TODO(Ana)
      return;
    }
    const payload = {
      description: form.description.trim(),
      category: form.category,
      vendor: form.vendor.trim() || null,
      kind: form.kind,
      amount_cents: cents,
      currency: form.currency,
      incurred_on: form.incurred_on,
      recurrence_start:
        form.kind === "recurring"
          ? form.recurrence_start || form.incurred_on
          : null,
      recurrence_end:
        form.kind === "recurring" && form.recurrence_end
          ? form.recurrence_end
          : null,
      recurrence_interval:
        form.kind === "recurring" ? form.recurrence_interval : null,
      notes: form.notes.trim() || null,
    };
    setSaving(true);
    try {
      if (editingId) {
        await adminFetch(`/finance/expenses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch(`/finance/expenses`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await Promise.all([loadList(), loadBreakdown()]);
      onChanged?.();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao salvar despesa.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await adminFetch(`/finance/expenses/${id}`, { method: "DELETE" });
      await Promise.all([loadList(), loadBreakdown()]);
      onChanged?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover despesa.",
      );
    }
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const canPrev = page > 1;
  const canNext = page * 25 < total;
  const breakdownTotal = breakdown.reduce((sum, b) => sum + b.cents, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      {/* Formulario de lancamento */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="card-brutal rounded-3xl bg-white p-6"
      >
        <h3 className="font-display text-2xl font-black text-slate-950">
          {editingId ? "Editar despesa" : "Nova despesa"}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black uppercase text-slate-600 sm:col-span-2">
            Descrição
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            Categoria
            <BntSelect
              accent="gold"
              label="Categoria"
              className="mt-1"
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={CATEGORIES}
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            Fornecedor
            <input
              value={form.vendor}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendor: e.target.value }))
              }
              placeholder="Railway, OpenAI, Meta Ads..."
              className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            Tipo
            <BntSelect
              accent="gold"
              label="Tipo"
              className="mt-1"
              value={form.kind}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  kind: v === "recurring" ? "recurring" : "one_off",
                }))
              }
              options={[
                { value: "one_off", label: "Pontual" },
                { value: "recurring", label: "Recorrente" },
              ]}
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            Competência
            <input
              type="date"
              value={form.incurred_on}
              onChange={(e) =>
                setForm((f) => ({ ...f, incurred_on: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            Valor
            <input
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              placeholder="0,00"
              inputMode="decimal"
              className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            Moeda
            <BntSelect
              accent="gold"
              label="Moeda"
              className="mt-1"
              value={form.currency}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  currency: v === "USD" ? "USD" : "BRL",
                }))
              }
              options={[
                { value: "BRL", label: "BRL" },
                { value: "USD", label: "USD" },
              ]}
            />
          </label>

          {form.kind === "recurring" ? (
            <>
              <label className="text-xs font-black uppercase text-slate-600">
                Recorrência
                <BntSelect
                  accent="gold"
                  label="Recorrência"
                  className="mt-1"
                  value={form.recurrence_interval}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      recurrence_interval: v === "yearly" ? "yearly" : "monthly",
                    }))
                  }
                  options={[
                    { value: "monthly", label: "Mensal" },
                    { value: "yearly", label: "Anual" },
                  ]}
                />
              </label>
              <label className="text-xs font-black uppercase text-slate-600">
                Início
                <input
                  type="date"
                  value={form.recurrence_start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recurrence_start: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                />
              </label>
              <label className="text-xs font-black uppercase text-slate-600">
                Fim (opcional)
                <input
                  type="date"
                  value={form.recurrence_end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recurrence_end: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
                />
              </label>
            </>
          ) : null}

          <label className="text-xs font-black uppercase text-slate-600 sm:col-span-2">
            Notas
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 block w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold"
            />
          </label>
        </div>

        {/* Preview de cambio (antes de salvar) */}
        {form.currency === "USD" ? (
          <div className="mt-4 rounded-2xl border-2 border-slate-900 bg-violet-50 p-3 text-sm font-bold text-slate-700">
            {fxError ? (
              <span className="text-rose-700">
                {/* TODO(Ana) */}
                Câmbio indisponível: {fxError}. Não dá para salvar em USD agora.
              </span>
            ) : fxRate !== null ? (
              <span>
                {/* TODO(Ana): copy do aviso de cambio */}
                PTAX {fxRate.toFixed(4)}
                {fxDate ? ` (cotação de ${fxDate})` : ""} ·{" "}
                {previewBrlCents !== null
                  ? `${fmtBrlCents(previewBrlCents)} serão congelados`
                  : "informe o valor"}
              </span>
            ) : (
              <span>Buscando cotação PTAX...</span>
            )}
          </div>
        ) : null}

        {formError ? (
          <div className="mt-3">
            <ErrorBlock message={formError} />
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={saving || (form.currency === "USD" && fxRate === null)}
            className="rounded-full border-2 border-slate-900 bg-yellow-300 px-5 py-2 text-sm font-black shadow-[3px_3px_0_#0f172a] disabled:opacity-50"
          >
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Lançar despesa"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border-2 border-slate-900 bg-white px-5 py-2 text-sm font-black"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {/* Breakdown por categoria (ultimos 12 meses, com recorrencia expandida) */}
      <div className="card-brutal rounded-3xl bg-white p-6">
        <h3 className="font-display text-2xl font-black text-slate-950">
          Por categoria (12 meses)
        </h3>
        <div className="mt-4 space-y-3">
          {breakdownError ? (
            <ErrorBlock message={breakdownError} />
          ) : breakdown.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
              Nenhuma despesa no período.
            </p>
          ) : (
            breakdown
              .slice()
              .sort((a, b) => b.cents - a.cents)
              .map((b) => {
                const pct =
                  breakdownTotal > 0
                    ? Math.round((b.cents / breakdownTotal) * 100)
                    : 0;
                return (
                  <div key={b.category}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>{CATEGORY_LABEL[b.category] ?? b.category}</span>
                      <span>{fmtBrlCents(b.cents)}</span>
                    </div>
                    <div className="mt-1 h-3 rounded-full border-2 border-slate-900 bg-white">
                      <div
                        className="h-full rounded-full bg-violet-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Tabela de despesas */}
      <div className="xl:col-span-2">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]">
          {loading && !data ? (
            <div className="p-4">
              <LoadingBlock label="Carregando despesas..." />
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorBlock message={error} />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm font-semibold text-slate-600">
              Nenhuma despesa lançada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-50">
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Descrição</th>
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Categoria</th>
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Tipo</th>
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Valor</th>
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Em BRL</th>
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Competência</th>
                    <th className="px-4 py-3 font-black uppercase text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-slate-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {exp.description}
                        {exp.vendor ? (
                          <span className="block text-xs font-normal text-slate-500">
                            {exp.vendor}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {CATEGORY_LABEL[exp.category] ?? exp.category}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {exp.kind === "recurring"
                          ? `Recorrente (${exp.recurrence_interval === "yearly" ? "anual" : "mensal"})`
                          : "Pontual"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {exp.currency === "BRL"
                          ? fmtBrlCents(exp.amount_cents)
                          : `${(exp.amount_cents / 100).toFixed(2)} ${exp.currency}`}
                      </td>
                      <td className="px-4 py-3 font-black text-slate-950">
                        {fmtBrlCents(exp.amount_brl_cents)}
                        {exp.fx_rate ? (
                          <span className="block text-xs font-normal text-slate-500">
                            PTAX {exp.fx_rate}
                            {exp.fx_date ? ` · ${exp.fx_date}` : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(exp.incurred_on).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(exp)}
                            className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(exp.id)}
                            className="rounded-full border-2 border-slate-900 bg-rose-100 px-3 py-1 text-xs font-black text-rose-800"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {total > 0 ? (
            <div className="flex items-center justify-between gap-3 border-t-2 border-slate-900 px-4 py-3">
              <p className="text-xs font-bold text-slate-500">
                {Math.min((page - 1) * 25 + 1, total)} a{" "}
                {Math.min(page * 25, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!canPrev || loading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!canNext || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
