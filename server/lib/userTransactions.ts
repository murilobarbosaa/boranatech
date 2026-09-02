// Extrato de compras de UM usuario, com o estado de reembolso por cobranca.
//
// ATENCAO ANTES DE "SIMPLIFICAR": refunded_cents, disputed_cents e
// refundable_cents sao os campos dos quais a emissao de reembolso (Fatia 7)
// depende para (a) nao deixar reembolsar duas vezes e (b) saber o teto do valor.
// A agregacao e feita AQUI, no servidor, de proposito: uma soma feita no
// navegador so enxerga as linhas que couberam na resposta, e um teto calculado
// sobre pagina incompleta autoriza reembolso a mais.
//
// DUAS FONTES, UM PONTO DE JUNCAO. finance_transactions e sincronizado
// EXCLUSIVAMENTE da Stripe (ver a migration 20260714130000) e continua assim:
// nada aqui escreve nela. Mas existe dinheiro devolvido que a Stripe nunca
// soube (boleto devolvido por PIX ou TED da conta da empresa), e esse vive em
// admin_refunds com settlement='external'. As duas fontes se encontram AQUI, em
// memoria, e em lugar nenhum mais.
//
// O "em lugar nenhum mais" nao e estilo: o "Valor pago (total)" do modal
// (server/routes/admin.ts) somava por conta propria, e duas somas da mesma coisa
// divergem no primeiro caso real. Por isso a rota de detalhe passou a chamar
// totalPagoCents em vez de fazer o proprio reduce.

/** Tipos que representam dinheiro do USUARIO (payout e adjustment sao da conta Stripe). */
const TIPOS_DE_PAGAMENTO = new Set(["charge", "refund", "dispute"]);

/**
 * Linha de admin_refunds, como a agregacao precisa dela.
 *
 * O chamador passa TODAS as linhas do usuario, nao so as externas: o filtro por
 * `settlement` mora DENTRO desta funcao. Guarda escrita no chamador precisa ser
 * repetida em cada chamador e some no primeiro que alguem esquecer; escrita
 * aqui, ela cobre os chamadores que ainda nao existem.
 */
export type DeclaredRefund = {
  stripe_charge_id: string | null;
  amount_cents: number;
  settlement: string;
};

/**
 * Quais declaracoes CONTAM na agregacao do extrato.
 *
 * So 'external'. As outras duas correspondem a um objeto Refund que existe na
 * Stripe, e a balance transaction dele vira linha de `refund` em
 * finance_transactions pelo syncBalanceTransactions. Soma-las aqui contaria o
 * mesmo dinheiro duas vezes e o extrato passaria a mentir na direcao oposta.
 *
 * Valor DESCONHECIDO nao conta: settlement novo que este codigo ainda nao
 * conhece fica de fora em vez de entrar por padrao. Errar para menos numa soma
 * de devolucao mantem o teto de reembolso maior que o real (recusa a mais), que
 * e o lado seguro; errar para mais autorizaria devolver dinheiro que nao saiu.
 */
export function declaracaoContaNoExtrato(settlement: string): boolean {
  return settlement === "external";
}

export type FinanceRow = {
  id: string;
  /**
   * `stripe` | `asaas`. Opcional porque a coluna nasceu com default e uma linha
   * gravada na janela de deploy pode chegar sem ela; `providerDaLinha` resolve
   * a ausencia num lugar so.
   */
  provider?: string | null;
  /**
   * Identidade da transacao no provedor. Para a Stripe repete o id da balance
   * transaction; para o Asaas e o id do pagamento (ou do event, num estorno).
   * Opcional pelo mesmo motivo de `provider`.
   */
  provider_transaction_id?: string | null;
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

/**
 * Provedor da linha, com o MESMO default da coluna.
 *
 * Ausencia vira `stripe` e nao "desconhecido": a coluna tem `default 'stripe'`,
 * e a unica linha que chega sem o campo e a gravada entre a migration e o deploy
 * do codigo que o escreve, que e da Stripe por construcao. Tratar como
 * desconhecido a tiraria do teto de reembolso, ou seja, recusaria devolver
 * dinheiro de uma cobranca perfeitamente reembolsavel.
 */
export function providerDaLinha(row: Pick<FinanceRow, "provider">): string {
  return row.provider ?? "stripe";
}

export type TransactionItem = FinanceRow & {
  /**
   * Soma dos REEMBOLSOS ligados a esta cobranca, em MAGNITUDE positiva (as
   * linhas de refund tem gross_cents negativo; o agregado positivo le melhor:
   * "R$ 30 reembolsados"). Sempre 0 em linhas que nao sao charge.
   *
   * Inclui as devolucoes DECLARADAS que contam (settlement='external'), porque
   * para o admin devolucao externa e devolucao pela Stripe sao o mesmo fato: o
   * dinheiro voltou. O que difere e so o caminho da liquidacao, e quem precisa
   * dessa distincao le refunded_external_cents.
   */
  refunded_cents: number;
  /**
   * Quanto de refunded_cents veio de DECLARACAO externa, nao do sync da Stripe.
   * Existe para a tela poder dizer que aquele dinheiro nao tem contraparte na
   * Stripe (e portanto nao aparece no dashboard financeiro global) sem que o
   * numero principal precise mentir por omissao.
   */
  refunded_external_cents: number;
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
   * Dinheiro de Pix (Asaas) que AINDA ESTA CONOSCO, em centavos.
   *
   * Existe para a tela poder explicar por que o botao de reembolso da Stripe nao
   * cobre aquele valor: ele nao cobre porque a cobranca nao esta na Stripe. A
   * devolucao de Pix sai pelo Asaas e volta aqui como devolucao externa.
   *
   * E UM AGREGADO, e nao uma soma por cobranca, e a limitacao e estrutural: a
   * linha de estorno do Asaas tem como identidade o id do EVENT (ver
   * `montarEstornoAsaas`), nao o do pagamento, entao NAO existe hoje chave que
   * ligue um estorno a sua cobranca. Somar `charge` e `refund` do provedor da o
   * saldo certo no total, que e o numero que a frase da tela precisa; dizer qual
   * cobranca especifica ainda esta em aberto exigiria uma coluna de vinculo.
   *
   * Nunca negativo: devolver mais do que entrou nao e um saldo, e um erro de
   * dado, e um numero negativo na tela seria lido como credito.
   */
  pix_sem_reembolso_na_stripe_cents: number;
  /**
   * Soma de gross_cents das linhas charge/refund/dispute, com sinal, MENOS as
   * devolucoes declaradas que contam. E exatamente a mesma conta do "Valor pago
   * (total)" do modal, porque agora e literalmente a mesma funcao
   * (totalPagoCents): os dois numeros aparecem na mesma tela, um embaixo do
   * outro, e divergir seria visivel.
   */
  total_paid_cents: number;
};

/**
 * "Valor pago (total)": o que sobrou depois de devolucao e chargeback.
 *
 * FONTE UNICA da soma, usada pelo extrato E pelo cabecalho do modal. Antes o
 * modal tinha o proprio reduce em server/routes/admin.ts; eram duas somas da
 * mesma coisa, e a primeira devolucao externa registrada as faria divergir na
 * mesma tela.
 *
 * gross_cents e NEGATIVO em refund e dispute (invariante declarada na coluna,
 * migration 20260714130000), entao as linhas sincronizadas ja entram com sinal.
 * As declaracoes externas nao tem linha nenhuma, entao entram SUBTRAINDO.
 */
export function totalPagoCents(
  // Só o que a conta usa: a rota de detalhe não precisa carregar o resto da
  // linha para somar, e pedir FinanceRow inteiro a obrigaria a selecionar
  // colunas que ela não lê.
  rows: Array<Pick<FinanceRow, "type" | "gross_cents">>,
  declaradas: DeclaredRefund[],
): number {
  const sincronizado = rows
    .filter((row) => TIPOS_DE_PAGAMENTO.has(row.type))
    .reduce((soma, row) => soma + (row.gross_cents ?? 0), 0);

  const externo = declaradas
    .filter((d) => declaracaoContaNoExtrato(d.settlement))
    .reduce((soma, d) => soma + Math.abs(d.amount_cents ?? 0), 0);

  return sincronizado - externo;
}

export function refundStateOf(
  grossCents: number,
  refundedCents: number,
): RefundState {
  if (refundedCents <= 0) return "none";
  if (refundedCents >= grossCents) return "full";
  return "partial";
}

type Agregado = { refunded: number; refundedExterno: number; disputed: number };

const AGREGADO_ZERO: Agregado = {
  refunded: 0,
  refundedExterno: 0,
  disputed: 0,
};

/**
 * Reembolsos e disputas por stripe_charge_id, das DUAS fontes. Linha sem
 * charge_id nao entra: nao ha a que ligar, e inventar um vinculo seria pior que
 * nao ter.
 */
function agregarPorCobranca(
  rows: FinanceRow[],
  declaradas: DeclaredRefund[],
): Map<string, Agregado> {
  const mapa = new Map<string, Agregado>();

  for (const row of rows) {
    if (row.type !== "refund" && row.type !== "dispute") continue;
    // SO A STRIPE agrega por cobranca. Este mapa alimenta `refundable_cents`,
    // que e o teto do que a rota de reembolso pode mandar a Stripe devolver, e
    // uma linha do Asaas nao tem `stripe_charge_id` a que se ligar. A condicao
    // fica explicita em vez de depender de o campo ser nulo por acaso.
    if (providerDaLinha(row) !== "stripe") continue;
    if (!row.stripe_charge_id) continue;
    const atual = mapa.get(row.stripe_charge_id) ?? { ...AGREGADO_ZERO };
    const magnitude = Math.abs(row.gross_cents ?? 0);
    if (row.type === "refund") atual.refunded += magnitude;
    else atual.disputed += magnitude;
    mapa.set(row.stripe_charge_id, atual);
  }

  for (const declarada of declaradas) {
    if (!declaracaoContaNoExtrato(declarada.settlement)) continue;
    if (!declarada.stripe_charge_id) continue;
    const atual = mapa.get(declarada.stripe_charge_id) ?? { ...AGREGADO_ZERO };
    const magnitude = Math.abs(declarada.amount_cents ?? 0);
    atual.refunded += magnitude;
    atual.refundedExterno += magnitude;
    mapa.set(declarada.stripe_charge_id, atual);
  }

  return mapa;
}

/**
 * `declaradas` e OBRIGATORIO, sem default, de proposito: um parametro opcional
 * faria um chamador esquecido somar a menos e devolver um teto de reembolso
 * MAIOR que o real, em silencio. Sem default, o compilador cobra a decisao de
 * cada call site, inclusive dos que ainda nao existem. Quem genuinamente nao
 * tem declaracoes passa [].
 */
export function buildTransactionList(
  rows: FinanceRow[],
  declaradas: DeclaredRefund[],
): TransactionList {
  const porCobranca = agregarPorCobranca(rows, declaradas);

  const items = rows.map<TransactionItem>((row) => {
    const ehCharge = row.type === "charge";
    // `refundable_cents` e o TETO que autoriza a rota de reembolso a mandar a
    // Stripe devolver dinheiro. Cobranca que nao esta na Stripe nao tem teto
    // nenhum ali, e o zero e a resposta certa.
    //
    // Sem esta condicao, uma cobranca Pix cairia no `AGREGADO_ZERO` por nao ter
    // `stripe_charge_id` e sairia com `refundable_cents === gross_cents`, ou
    // seja, um teto CHEIO que nunca desce, nem depois de um estorno. Teto que
    // nao desce e o lado inseguro: ele autoriza devolver o que ja voltou.
    const reembolsavelPelaStripe =
      ehCharge && providerDaLinha(row) === "stripe";
    const agregado =
      reembolsavelPelaStripe && row.stripe_charge_id
        ? (porCobranca.get(row.stripe_charge_id) ?? AGREGADO_ZERO)
        : AGREGADO_ZERO;

    return {
      ...row,
      refunded_cents: agregado.refunded,
      refunded_external_cents: agregado.refundedExterno,
      disputed_cents: agregado.disputed,
      disputed: agregado.disputed > 0,
      refund_state: ehCharge
        ? refundStateOf(row.gross_cents ?? 0, agregado.refunded)
        : "none",
      refundable_cents: reembolsavelPelaStripe
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

  return {
    items,
    total_paid_cents: totalPagoCents(rows, declaradas),
    pix_sem_reembolso_na_stripe_cents: saldoAsaasCents(rows),
  };
}

/**
 * Saldo do que entrou por Asaas e ainda nao voltou, em centavos.
 *
 * Soma `charge` e `refund` do provedor COM SINAL: a linha de estorno ja nasce
 * negativa (`montarEstornoAsaas`), entao a soma e o saldo, sem subtracao
 * separada. `dispute` fica de fora porque o Asaas nao tem chargeback de Pix.
 *
 * Piso em zero: estorno maior que a cobranca e erro de dado, e um negativo na
 * tela seria lido como credito ao cliente.
 */
export function saldoAsaasCents(
  rows: Array<Pick<FinanceRow, "provider" | "type" | "gross_cents">>,
): number {
  const soma = rows
    .filter(
      (r) =>
        providerDaLinha(r) === "asaas" &&
        (r.type === "charge" || r.type === "refund"),
    )
    .reduce((acc, r) => acc + (r.gross_cents ?? 0), 0);
  return Math.max(0, soma);
}
