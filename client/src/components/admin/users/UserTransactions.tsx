import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBlock } from "@/components/admin/StateBlocks";

import { PIX_REFUND_COPY } from "@shared/pixRefundCopy";
import { providerMetaOf, PROVIDER_ASAAS } from "@/lib/providerMeta";

import { fmtBrl, fmtDate, planLabelOf } from "./userFormat";
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

/**
 * Boleto: charge id com prefixo `py_`. Mesmo discriminador que o servidor usa
 * (server/routes/admin.ts), e ele decide qual das duas devolucoes a linha
 * oferece. A guarda de verdade esta nas rotas: as duas recusam o meio errado
 * com codigo proprio, entao um bundle desatualizado nao consegue emitir
 * reembolso de boleto nem declarar devolucao de cartao.
 */
function ehBoleto(chargeId: string | null): boolean {
  return Boolean(chargeId?.startsWith("py_"));
}

function Linha({
  item,
  onRefund,
  onExternalRefund,
}: {
  item: TransactionItem;
  onRefund?: (item: TransactionItem) => void;
  onExternalRefund?: (item: TransactionItem) => void;
}) {
  const tipo = tipoDeTransacaoOf(item.type);
  const negativo = item.gross_cents < 0;
  const boleto = ehBoleto(item.stripe_charge_id);
  // COBRANCA QUE NAO E DA STRIPE nao oferece acao nenhuma nesta tela, e o
  // motivo e que nenhuma das duas rotas a aceita: `/refunds` responde 409
  // `refund_provider_not_stripe` e `/external-refunds` responde 409
  // `external_refund_provider_not_supported`, porque as duas chaveiam por
  // `stripe_charge_id`. Desenhar um botao que so pode devolver erro seria
  // prometer uma acao que nao existe; a frase no rodape do bloco diz o que
  // fazer no lugar.
  const daStripe = providerMetaOf(item.provider);
  const ehAsaas = (item.provider ?? "stripe") === PROVIDER_ASAAS;
  const acao = ehAsaas ? undefined : boleto ? onExternalRefund : onRefund;
  // Backend antigo na janela de deploy nao manda o campo: sem o `?? 0` a
  // comparacao viraria `undefined > 0`, que e false, e a linha simplesmente nao
  // mostra o aviso. Degrada, nao quebra.
  const externo = item.refunded_external_cents ?? 0;

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
        {/* BADGE DE PROVEDOR so quando NAO e a Stripe. Marcar toda linha com
            "Stripe" acrescentaria uma palavra em cada uma das centenas de
            linhas antigas para informar o que ja era o unico caso possivel; o
            que a tela precisa destacar e a excecao. */}
        {ehAsaas ? (
          <span
            data-testid="provedor-badge"
            className="inline-flex w-fit items-center rounded-full border-2 border-teal-600 bg-teal-50 px-2 py-0.5 text-[11px] font-black uppercase text-teal-800"
          >
            {daStripe.label}
          </span>
        ) : null}
      </span>

      <span className="flex flex-col">
        {item.plan_code ? (
          <span className="text-sm font-bold text-slate-700">
            {planLabelOf(item.plan_code)}
          </span>
        ) : null}
        {item.refunded_cents > 0 ? (
          <span className="text-xs font-black uppercase tracking-wide text-amber-700">
            {fmtBrl(item.refunded_cents)} reembolsados
          </span>
        ) : null}
        {/* Dinheiro que voltou SEM contraparte na Stripe. Dizer isso na linha
            evita que alguem leia o numero acima como se fosse um reembolso
            processado, e e o unico lugar da tela onde a diferenca aparece. */}
        {externo > 0 ? (
          <span
            data-testid="devolucao-externa"
            className="text-xs font-bold text-amber-700"
          >
            {fmtBrl(externo)} por fora da Stripe, registrado pelo admin
          </span>
        ) : null}
        {item.disputed ? (
          <span className="text-xs font-black uppercase tracking-wide text-rose-700">
            {fmtBrl(item.disputed_cents)} em chargeback
          </span>
        ) : null}
        {/* O id que a linha TEM. Para a Stripe e o charge id, como sempre; para
            o Asaas e o id do pagamento, que e o unico que existe e o unico que
            serve para achar a cobranca no painel deles. Sem isto, toda linha de
            Pix aparecia sem identificacao nenhuma. */}
        {item.stripe_charge_id ?? item.provider_transaction_id ? (
          <span className="font-mono text-[11px] text-slate-400">
            {item.stripe_charge_id ?? item.provider_transaction_id}
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
        {/* Reembolso so aparece onde faz sentido: cobranca com teto > 0. Ja
            reembolsada por inteiro mostra o estado, nao um botao morto. */}
        {item.type === "charge" && acao ? (
          item.refundable_cents > 0 ? (
            <button
              type="button"
              onClick={() => acao(item)}
              className="mt-1 block rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-[11px] font-black uppercase transition hover:bg-yellow-50 sm:ml-auto dark:hover:bg-secondary"
            >
              {/* Verbos diferentes porque as acoes sao diferentes: uma devolve
                  dinheiro, a outra anota que alguem ja devolveu. */}
              {boleto ? "Registrar devolução" : "Reembolsar"}
            </button>
          ) : (
            <span
              data-testid="sem-reembolso"
              className="mt-1 block text-[11px] font-bold uppercase text-slate-400"
            >
              {item.refund_state === "full"
                ? "Reembolsada"
                : "Sem saldo a reembolsar"}
            </span>
          )
        ) : null}
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
  onRefund,
  onExternalRefund,
}: {
  loading: boolean;
  error: string | null;
  payload: TransactionsPayload | null;
  onRefund?: (item: TransactionItem) => void;
  onExternalRefund?: (item: TransactionItem) => void;
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
        className={`${GRID} hidden border-b-2 border-slate-900 bg-[var(--brand-cream-deep)] px-4 py-2 sm:grid`}
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
        <Linha
          key={item.id}
          item={item}
          onRefund={onRefund}
          onExternalRefund={onExternalRefund}
        />
      ))}

      {/* PIX EM ABERTO: por que o botao de reembolso nao cobre este valor.
          A frase so aparece quando ha saldo Pix, e ela existe porque a linha de
          Pix e a UNICA do extrato sem botao nenhum: sem explicacao, a ausencia
          e lida como bug da tela em vez de limitacao do caminho.
          O `?? 0` cobre o backend antigo da janela de deploy.
          TODO(Ana) */}
      {(payload.pix_sem_reembolso_na_stripe_cents ?? 0) > 0 ? (
        <p
          data-testid="pix-sem-reembolso"
          className="border-t-2 border-teal-500 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-900"
        >
          {fmtBrl(payload.pix_sem_reembolso_na_stripe_cents ?? 0)} em aberto.{" "}
          {PIX_REFUND_COPY}
        </p>
      ) : null}

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
