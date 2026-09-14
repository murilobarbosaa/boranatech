import { useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

import { cancellationReasonLabelOf } from "@/components/admin/users/userFormat";
import {
  attentionActionUrl,
  type AttentionContractV3,
  type AttentionItem,
  type AttentionSource,
} from "@shared/adminAttention";

const GROUP_TITLES: Record<AttentionItem["kind"], string> = {
  subscription_local_past_due: "Estados locais past_due",
  subscription_scheduled_exit: "Saídas agendadas",
  orphan_payment_open: "Casos órfãos abertos",
  ai_cost_spike: "Custo estimado de IA",
  previous_month_without_expense: "Mês sem despesa local",
  influencer_active_access: "Influencers com outro acesso local",
  influencer_trial_access: "Influencers com trial local",
  manual_subscription_ending: "Assinaturas manuais próximas do fim",
};

const SOURCE_STATUS: Record<AttentionSource["status"], string> = {
  available: "Disponível",
  partial: "Parcial",
  unavailable: "Indisponível",
  not_collected: "Não coletada",
};

function actionLabel(item: AttentionItem): string {
  if (item.action.type === "open_user") return "Abrir usuário";
  if (item.action.type === "open_orphan") return "Abrir caso órfão";
  if (item.action.section === "financeiro") return "Abrir Financeiro";
  if (item.action.section === "ia") return "Abrir IA";
  return "Abrir Usuários";
}

function formatValue(item: AttentionItem): string | null {
  if (!item.value) return null;
  return (item.value.minorUnits / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: item.value.currency,
  });
}

type Group = { kind: AttentionItem["kind"]; items: AttentionItem[] };

export function groupAttentionItems(items: AttentionItem[]): Group[] {
  const groups = new Map<AttentionItem["kind"], AttentionItem[]>();
  for (const item of items)
    groups.set(item.kind, [...(groups.get(item.kind) ?? []), item]);
  return Array.from(groups).map(([kind, grouped]) => ({
    kind,
    items: grouped,
  }));
}

function aggregateValue(items: AttentionItem[]): string | null {
  if (!items.length || items.some((item) => !item.value)) return null;
  const first = items[0].value!;
  if (
    items.some(
      (item) =>
        item.value!.currency !== first.currency ||
        item.value!.semantics !== first.semantics,
    )
  )
    return null;
  const total = items.reduce((sum, item) => sum + item.value!.minorUnits, 0);
  return (total / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: first.currency,
  });
}

function ItemView({ item }: { item: AttentionItem }) {
  return (
    <li className="rounded-xl border-2 border-slate-200 bg-white/70 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-black text-slate-900">{item.title}</p>
        {formatValue(item) ? (
          <span className="text-xs font-black text-slate-600">
            {formatValue(item)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600">{item.detail}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">
        Fonte: {item.source}
        {item.stateUpdatedAt
          ? ` · estado atualizado em ${new Date(item.stateUpdatedAt).toLocaleString("pt-BR")}`
          : item.occurredAt
            ? ` · observado em ${new Date(item.occurredAt).toLocaleString("pt-BR")}`
            : " · instante não registrado"}
      </p>
      {item.declaredReason ? (
        <p className="mt-1 text-xs font-bold text-slate-600">
          Motivo declarado: {cancellationReasonLabelOf(item.declaredReason)}
        </p>
      ) : null}
      <a
        href={attentionActionUrl(item.action)}
        data-testid="attention-action"
        className="mt-2 inline-flex rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-900"
      >
        {actionLabel(item)}
      </a>
    </li>
  );
}

function GroupView({ group }: { group: Group }) {
  const [open, setOpen] = useState(
    group.items.some((item) => item.severity === "critical"),
  );
  const single = group.items.length === 1;
  const total = aggregateValue(group.items);
  return (
    <section
      data-testid="attention-group"
      className={`rounded-2xl border-2 p-4 ${
        group.items.some((item) => item.severity === "critical")
          ? "border-rose-500 bg-[var(--bnt-alert-rose)]"
          : "border-amber-400 bg-[var(--bnt-alert-amber)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-black text-slate-950">
          {GROUP_TITLES[group.kind]} · {group.items.length}
        </h3>
        {total ? <span className="text-sm font-black">{total}</span> : null}
      </div>
      {!single ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-2 text-xs font-black uppercase text-violet-700"
        >
          {open ? "Ocultar itens" : "Ver itens"}
        </button>
      ) : null}
      {single || open ? (
        <ul className="mt-3 space-y-2">
          {group.items.map((item) => (
            <ItemView key={item.key} item={item} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function AttentionPanel({
  data,
  loading,
  error,
  onRefresh,
}: {
  data: AttentionContractV3 | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}) {
  const groups = data ? groupAttentionItems(data.items) : [];
  return (
    <article className="card-brutal rounded-3xl bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-2xl font-black text-slate-950">
          <AlertTriangle className="h-6 w-6" /> Atenção necessária
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>
      {loading && !data ? (
        <p className="mt-5 text-sm font-bold text-slate-500">Carregando…</p>
      ) : error ? (
        <p
          data-testid="attention-error"
          className="mt-5 rounded-2xl border-2 border-rose-300 bg-[var(--bnt-alert-rose)] p-4 text-sm font-black text-rose-800"
        >
          {error}
        </p>
      ) : data ? (
        <div className="mt-5 space-y-4">
          <p className="text-xs font-bold text-slate-500">
            Calculado em {new Date(data.computedAt).toLocaleString("pt-BR")}. As
            leituras não compartilham uma fotografia transacional.
          </p>
          <div data-testid="attention-sources" className="space-y-2">
            {data.sources
              .filter((source) => source.status !== "available")
              .map((source) => (
                <p
                  key={source.source}
                  className="rounded-xl border-2 border-amber-300 bg-[var(--bnt-alert-amber)] p-2 text-xs font-bold text-amber-900"
                >
                  {SOURCE_STATUS[source.status]}: {source.source}.{" "}
                  {source.detail}
                </p>
              ))}
          </div>
          {groups.length ? (
            groups.map((group) => <GroupView key={group.kind} group={group} />)
          ) : data.sources.some(
              (source) =>
                source.status === "unavailable" || source.status === "partial",
            ) ? (
            <p className="text-sm font-black text-amber-900">
              Não foi possível concluir todas as leituras monitoradas.
            </p>
          ) : (
            <p
              data-testid="attention-empty"
              className="flex items-center gap-2 rounded-2xl border-2 border-emerald-300 bg-[var(--bnt-alert-emerald)] p-4 text-sm font-black text-emerald-800"
            >
              <CheckCircle2 className="h-5 w-5" /> Nenhuma pendência encontrada
              nas fontes locais monitoradas.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
