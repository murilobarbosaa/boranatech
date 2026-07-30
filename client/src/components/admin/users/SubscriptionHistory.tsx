import {
  PAYMENT_METHOD_LABELS,
  fmtDate,
  planLabelOf,
  subscriptionStatusLabelOf,
} from "./userFormat";
import type { SubscriptionHistoryItem } from "./types";

/**
 * Assinaturas ANTERIORES da pessoa. Compacta de propósito: a vigente e a secao
 * de cima, com selo, valor pago e acoes; esta aqui responde outra pergunta,
 * que e "desde quando" e "o que veio antes".
 *
 * Todo valor de servidor passa por resolver com fallback (plano, status, meio):
 * um codigo novo aparece cru em vez de derrubar o modal.
 */
export function SubscriptionHistory({
  items,
}: {
  items: SubscriptionHistoryItem[];
}) {
  // Shape inesperado na janela de deploy (front novo, backend antigo) nao pode
  // estourar o render do detalhe inteiro.
  const lista = Array.isArray(items) ? items : [];
  if (lista.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
      {lista.map((item, i) => {
        const meio = item.payment_method
          ? (PAYMENT_METHOD_LABELS[item.payment_method] ?? item.payment_method)
          : null;
        return (
          <div
            key={`${item.created_at ?? "sem-data"}-${i}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-slate-100 px-4 py-2.5 last:border-b-0"
          >
            <span className="font-display text-sm font-black text-slate-950">
              {planLabelOf(item.plan_code)}
            </span>
            <span className="inline-flex w-fit items-center rounded-full border-2 border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase text-slate-600">
              {subscriptionStatusLabelOf(item.status)}
            </span>
            {meio ? (
              <span className="text-xs font-bold text-slate-500">{meio}</span>
            ) : null}
            <span className="text-xs font-bold text-slate-500">
              {fmtDate(item.created_at)}
              {item.current_period_end
                ? ` ate ${fmtDate(item.current_period_end)}`
                : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
