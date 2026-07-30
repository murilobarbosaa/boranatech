// Extrato de compras de UM usuario, com o estado de reembolso por cobranca.
//
// ATENCAO ANTES DE "SIMPLIFICAR": refunded_cents, disputed_cents e
// refundable_cents sao os campos dos quais a emissao de reembolso (Fatia 7)
// depende para (a) nao deixar reembolsar duas vezes e (b) saber o teto do valor.
// A agregacao e feita AQUI, no servidor, de proposito: uma soma feita no
// navegador so enxerga as linhas que couberam na resposta, e um teto calculado
// sobre pagina incompleta autoriza reembolso a mais.

/** Tipos que representam dinheiro do USUARIO (payout e adjustment sao da conta Stripe). */
const TIPOS_DE_PAGAMENTO = new Set(["charge", "refund", "dispute"]);

export type FinanceRow = {
  id: string;
  type: string;
  gross_cents: number;
  fee_cents: number | null;
  net_cents: number | null;
  currency: string | null;
  occurred_at: string;
  stripe_charge_id: string | null;
  stripe_invoice_id: string | null;
  plan_code: string | null;
};

export type RefundState = "none" | "partial" | "full";

export type TransactionItem = FinanceRow & {
  /**
   * Soma dos REEMBOLSOS ligados a esta cobranca, em MAGNITUDE positiva (as
   * linhas de refund tem gross_cents negativo; o agregado positivo le melhor:
   * "R$ 30 reembolsados"). Sempre 0 em linhas que nao sao charge.
   */
  refunded_cents: number;
  /**
   * Soma das DISPUTAS (chargebacks), tambem em magnitude positiva. Separada de
   * refunded_cents de proposito: chargeback nao e reembolso voluntario, e a
   * acao correta diante dele e contestar, nao reembolsar. Se os dois fossem a
   * mesma conta, a UI diria "ja reembolsado" para dinheiro que saiu por
   * contestacao.
   */
  disputed_cents: number;
  disputed: boolean;
  /** Estado considerando SO reembolsos. Disputa nao muda este campo. */
  refund_state: RefundState;
  /**
   * TETO do que ainda da para reembolsar: bruto menos reembolsos menos
   * disputas. A disputa entra AQUI, mesmo ficando fora do refund_state, porque
   * o dinheiro ja saiu: tentar reembolsar por cima seria pedir a Stripe algo
   * que ela recusa. Nunca negativo.
   */
  refundable_cents: number;
};

export type TransactionList = {
  items: TransactionItem[];
  /**
   * Soma de gross_cents das linhas charge/refund/dispute, com sinal. E
   * exatamente a mesma conta do "Valor pago (total)" do modal
   * (server/routes/admin.ts): os dois numeros aparecem na mesma tela, um
   * embaixo do outro, e divergir seria visivel.
   */
  total_paid_cents: number;
};

export function refundStateOf(
  grossCents: number,
  refundedCents: number,
): RefundState {
  if (refundedCents <= 0) return "none";
  if (refundedCents >= grossCents) return "full";
  return "partial";
}

type Agregado = { refunded: number; disputed: number };

/**
 * Reembolsos e disputas por stripe_charge_id. Linha sem charge_id nao entra:
 * nao ha a que ligar, e inventar um vinculo seria pior que nao ter.
 */
function agregarPorCobranca(rows: FinanceRow[]): Map<string, Agregado> {
  const mapa = new Map<string, Agregado>();
  for (const row of rows) {
    if (row.type !== "refund" && row.type !== "dispute") continue;
    if (!row.stripe_charge_id) continue;
    const atual = mapa.get(row.stripe_charge_id) ?? {
      refunded: 0,
      disputed: 0,
    };
    const magnitude = Math.abs(row.gross_cents ?? 0);
    if (row.type === "refund") atual.refunded += magnitude;
    else atual.disputed += magnitude;
    mapa.set(row.stripe_charge_id, atual);
  }
  return mapa;
}

export function buildTransactionList(rows: FinanceRow[]): TransactionList {
  const porCobranca = agregarPorCobranca(rows);

  const items = rows.map<TransactionItem>((row) => {
    const ehCharge = row.type === "charge";
    const agregado =
      ehCharge && row.stripe_charge_id
        ? (porCobranca.get(row.stripe_charge_id) ?? {
            refunded: 0,
            disputed: 0,
          })
        : { refunded: 0, disputed: 0 };

    return {
      ...row,
      refunded_cents: agregado.refunded,
      disputed_cents: agregado.disputed,
      disputed: agregado.disputed > 0,
      refund_state: ehCharge
        ? refundStateOf(row.gross_cents ?? 0, agregado.refunded)
        : "none",
      refundable_cents: ehCharge
        ? Math.max(
            0,
            (row.gross_cents ?? 0) - agregado.refunded - agregado.disputed,
          )
        : 0,
    };
  });

  // Mais recente primeiro, com desempate por id (chave unica): sem ele a ordem
  // entre linhas do mesmo instante nao e estavel entre requisicoes.
  items.sort((a, b) => {
    const diff =
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
    if (diff !== 0) return diff;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });

  const total_paid_cents = rows
    .filter((row) => TIPOS_DE_PAGAMENTO.has(row.type))
    .reduce((soma, row) => soma + (row.gross_cents ?? 0), 0);

  return { items, total_paid_cents };
}
