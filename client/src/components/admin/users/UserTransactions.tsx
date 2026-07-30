import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBlock } from "@/components/admin/StateBlocks";

import { fmtBrl, fmtDate } from "./userFormat";
import type { TransactionItem, TransactionsPayload } from "./types";

// Rotulos de tipo de transacao, com resolver de fallback: um tipo novo do
// mapeamento da Stripe (server/lib/stripeSync.ts TYPE_MAP) nao pode derrubar a
// secao. Desconhecido mostra o valor cru.
const TIPO_META: Record<string, { label: string; className: string }> = {
  charge: {
    label: "Cobrança",
    className: "border-emerald-600 bg-emerald-50 text-emerald-800",
  },
  refund: {
    label: "Reembolso",
    className: "border-amber-500 bg-amber-50 text-amber-800",
  },
  dispute: {
    label: "Chargeback",
    className: "border-rose-500 bg-rose-50 text-rose-800",
  },
  adjustment: {
    label: "Ajuste",
    className: "border-slate-400 bg-slate-100 text-slate-600",
  },
};

const TIPO_DESCONHECIDO = "border-slate-400 bg-slate-100 text-slate-600";

export function tipoDeTransacaoOf(type: string): {
  label: string;
  className: string;
} {
  return TIPO_META[type] ?? { label: type, className: TIPO_DESCONHECIDO };
}

// Mesma grade no cabecalho e nas linhas: empilha no mobile, colunas a partir de
// sm. Mesma solucao da lista de usuarios, pelo mesmo motivo (o admin e usado no
// celular e <table> a 380px so funciona com rolagem horizontal).
const GRID =
  "grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] sm:items-center";

function Linha({ item }: { item: TransactionItem }) {
  const tipo = tipoDeTransacaoOf(item.type);
  const negativo = item.gross_cents < 0;

  return (
    <div
      className={`${GRID} border-b-2 border-slate-100 px-4 py-3 last:border-b-0`}
    >
      <span className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex w-fit items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-black uppercase ${tipo.className}`}
        >
          {tipo.label}
        </span>
        <span className="text-xs font-bold text-slate-500">
          {fmtDate(item.occurred_at)}
        </span>
      </span>

      <span className="flex flex-col">
        {item.plan_code ? (
          <span className="text-sm font-bold text-slate-700">
            {item.plan_code}
          </span>
        ) : null}
        {item.refunded_cents > 0 ? (
          <span className="text-xs font-black uppercase tracking-wide text-amber-700">
            {fmtBrl(item.refunded_cents)} reembolsados
          </span>
        ) : null}
        {item.disputed ? (
          <span className="text-xs font-black uppercase tracking-wide text-rose-700">
            {fmtBrl(item.disputed_cents)} em chargeback
          </span>
        ) : null}
        {item.stripe_charge_id ? (
          <span className="font-mono text-[11px] text-slate-400">
            {item.stripe_charge_id}
          </span>
        ) : null}
      </span>

      {/* O SINAL e explicito: reembolso e chargeback sao saida de dinheiro, e
          mostrar o modulo faria uma devolucao parecer uma cobranca. */}
      <span
        className={`font-display text-base font-black sm:text-right ${
          negativo ? "text-rose-700" : "text-slate-950"
        }`}
      >
        {fmtBrl(item.gross_cents)}
      </span>
    </div>
  );
}

function ExtratoSkeleton() {
  return (
    <div className="space-y-2 p-4" data-testid="user-transactions-skeleton">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-28 bg-slate-200" />
          <Skeleton className="h-4 w-40 bg-slate-200" />
          <Skeleton className="h-5 w-20 bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function UserTransactions({
  loading,
  error,
  payload,
}: {
  loading: boolean;
  error: string | null;
  payload: TransactionsPayload | null;
}) {
  if (loading) return <ExtratoSkeleton />;
  // Erro de CARREGAMENTO fica inline, junto da regiao que ficou vazia (criterio
  // da Fatia 3). So resultado de ACAO vira toast, e aqui nao ha nenhuma acao.
  if (error) return <ErrorBlock message={error} />;
  if (!payload) return <ExtratoSkeleton />;

  // Resposta sem `items` nao derruba o modal. Nao e paranoia: na janela de
  // deploy (Vercel sobe antes do Railway) o frontend novo fala com o backend
  // antigo, que nao conhece esta rota. O 404 cai no ramo de erro acima, mas um
  // payload de shape diferente chegaria ate aqui, e `payload.items.length`
  // estouraria o render inteiro do detalhe.
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (items.length === 0) {
    return (
      <p className="px-4 py-3 text-sm font-medium text-slate-400">
        Nenhuma compra registrada.
      </p>
    );
  }

  return (
    <div>
      <div
        className={`${GRID} hidden border-b-2 border-slate-900 bg-[#f6f0df] px-4 py-2 sm:grid`}
      >
        {["Tipo", "Detalhe", "Valor"].map((coluna, i) => (
          <span
            key={coluna}
            className={`text-xs font-black uppercase tracking-[0.14em] text-slate-600 ${
              i === 2 ? "sm:text-right" : ""
            }`}
          >
            {coluna}
          </span>
        ))}
      </div>

      {items.map((item) => (
        <Linha key={item.id} item={item} />
      ))}

      {/* Truncamento AVISADO: corte silencioso faria o total parecer completo
          sendo parcial. */}
      {payload.truncated ? (
        <p className="border-t-2 border-amber-500 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-800">
          Mostrando as primeiras {payload.limit} transações. Há mais no
          histórico.
        </p>
      ) : null}
    </div>
  );
}
