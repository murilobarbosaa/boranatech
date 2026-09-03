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
  /** `stripe` | `asaas`. Ausente na linha antiga: `providerDaLinha` resolve. */
  provider?: string | null;
  /** Id da cobranca no provedor. Para Asaas e o unico vinculo que existe. */
  provider_transaction_id?: string | null;
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
  /**
   * Payload cru do provedor. Lido SO para ligar um estorno do Asaas a sua
   * cobranca (ver `pagamentoDoEstornoAsaas`); nenhuma outra leitura depende
   * dele. Opcional porque o backend antigo nao o seleciona nesta rota.
   */
  raw_payload?: unknown;
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
export function providerDaLinha(row: { provider?: string | null }): string {
  return row.provider ?? "stripe";
}

/**
 * Quanto foi PEDIDO de estorno por cobranca do Asaas, em magnitude positiva.
 *
 * Fonte: `admin_refunds` com `provider='asaas'`. Existe porque o estorno do
 * Asaas nao e sincrono: a rota pede, o provedor aceita, e a linha negativa do
 * ledger so chega quando o webhook `PAYMENT_REFUNDED` confirmar, segundos ou
 * minutos depois. Entre as duas coisas o teto precisa ja estar fechado, senao
 * um segundo clique manda estornar de novo o que ja esta a caminho.
 */
function solicitadoPorCobrancaAsaas(
  declaradas: DeclaredRefund[],
): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const d of declaradas) {
    if (providerDaLinha(d) !== "asaas") continue;
    const chave = d.provider_transaction_id;
    if (!chave) continue;
    mapa.set(chave, (mapa.get(chave) ?? 0) + Math.abs(d.amount_cents ?? 0));
  }
  return mapa;
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
  /**
   * Estorno de Pix PEDIDO e ainda nao confirmado pelo webhook, em centavos.
   *
   * Sempre 0 fora de cobranca do Asaas. Existe porque a linha do extrato tem
   * tres estados, nao dois: com saldo, sem saldo, e "pedi e estou esperando". O
   * terceiro dura de segundos a minutos e, sem ele, a tela diria "Sem saldo a
   * reembolsar" sobre um estorno que ninguem confirmou ainda.
   */
  estorno_pendente_cents: number;
};

export type TransactionList = {
  items: TransactionItem[];
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
    // SO A STRIPE agrega por este mapa, e a razao e a CHAVE, nao o provedor: ele
    // e indexado por `stripe_charge_id`, que uma linha do Asaas nao tem. O
    // agregado do Asaas e por `provider_transaction_id` e vive em
    // `devolvidoPorCobrancaAsaas`, logo abaixo.
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
 * Id do PAGAMENTO a que uma linha de estorno do Asaas se refere.
 *
 * O `provider_transaction_id` de um estorno do Asaas e o id do EVENT, nao o do
 * pagamento, e isso e deliberado: o id do pagamento ja identifica a linha de
 * `charge`, e reusa-lo faria o upsert do estorno colidir com a propria cobranca
 * no indice unico `(provider, provider_transaction_id)` e sumir em silencio (ver
 * `montarEstornoAsaas`, server/lib/asaasLedger.ts).
 *
 * A CONSEQUENCIA e que NAO existe coluna ligando estorno a cobranca, e o vinculo
 * tem de sair do payload: `raw_payload` de uma linha do Asaas e o objeto
 * `payment` do event, e o `id` dele e o pagamento estornado. Le-se o payload do
 * proprio provedor, nao um campo derivado por nos.
 *
 * `null` quando o payload nao tem a forma esperada, e o chamador trata isso como
 * "nao sei ligar", nunca como "nao houve estorno": a diferenca decide se o teto
 * de reembolso desce ou nao, e errar para o lado de nao descer autorizaria
 * devolver o que ja voltou. A funcao devolve `null` e quem chama fecha o teto.
 */
export function pagamentoDoEstornoAsaas(row: FinanceRow): string | null {
  const p = row.raw_payload;
  if (!p || typeof p !== "object") return null;
  const id = (p as { id?: unknown }).id;
  return typeof id === "string" && id !== "" ? id : null;
}

/**
 * Quanto JA VOLTOU por cobranca do Asaas, em magnitude positiva.
 *
 * SEPARADO de `agregarPorCobranca` porque a chave e outra e a origem dela
 * tambem: la e a coluna `stripe_charge_id`, aqui e o payload (ver acima).
 *
 * `dispute` NAO entra: o Asaas nao tem chargeback de Pix, e reservar o conceito
 * evita que uma linha de outro tipo entre aqui por descuido.
 */
function devolvidoPorCobrancaAsaas(rows: FinanceRow[]): {
  porPagamento: Map<string, number>;
  /** Estornos que existem e nao foi possivel ligar a cobranca nenhuma. */
  semVinculoCents: number;
} {
  const porPagamento = new Map<string, number>();
  let semVinculoCents = 0;
  for (const row of rows) {
    if (row.type !== "refund") continue;
    if (providerDaLinha(row) !== "asaas") continue;
    const magnitude = Math.abs(row.gross_cents ?? 0);
    const pagamento = pagamentoDoEstornoAsaas(row);
    if (!pagamento) {
      semVinculoCents += magnitude;
      continue;
    }
    porPagamento.set(
      pagamento,
      (porPagamento.get(pagamento) ?? 0) + magnitude,
    );
  }
  return { porPagamento, semVinculoCents };
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

  const asaasDevolvido = devolvidoPorCobrancaAsaas(rows);
  const asaasSolicitado = solicitadoPorCobrancaAsaas(declaradas);

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

    // TETO DA COBRANCA DO ASAAS, e ele olha DUAS fontes.
    //
    // `devolvido` e o que ja voltou (linha de refund no ledger, posta pelo
    // webhook). `solicitado` e o que ja foi PEDIDO por esta base (linha em
    // `admin_refunds`). O estorno do Asaas nao e sincrono, entao existe uma
    // janela em que o segundo e maior que o primeiro, e e nela que um duplo
    // clique estornaria de novo.
    //
    // `Math.max` E NAO SOMA, e a diferenca e o ponto: quando o webhook chega, as
    // duas fontes descrevem O MESMO estorno. Somar subtrairia duas vezes e o
    // teto ficaria negativo, o que o `Math.max(0, ...)` esconderia, mas o
    // `estorno_pendente_cents` viraria zero cedo demais e a tela diria
    // "confirmado" antes da hora.
    const ehAsaasCharge = ehCharge && providerDaLinha(row) === "asaas";
    const asaas = { refundable: 0, pendente: 0 };
    if (ehAsaasCharge) {
      const id = row.provider_transaction_id ?? "";
      const devolvido = id ? (asaasDevolvido.porPagamento.get(id) ?? 0) : 0;
      const solicitado = id ? (asaasSolicitado.get(id) ?? 0) : 0;
      const jaSaiu = Math.max(devolvido, solicitado);
      // Estorno que existe e nao foi possivel ligar a cobranca nenhuma FECHA o
      // teto de todas as cobrancas Asaas deste usuario. Fail-closed: recusar um
      // reembolso legitimo custa uma conversa; autorizar um segundo estorno do
      // mesmo dinheiro custa o dinheiro.
      asaas.refundable = asaasDevolvido.semVinculoCents
        ? 0
        : Math.max(0, (row.gross_cents ?? 0) - jaSaiu);
      asaas.pendente = Math.max(0, solicitado - devolvido);
    }
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
        : ehAsaasCharge
          ? asaas.refundable
          : 0,
      estorno_pendente_cents: ehAsaasCharge ? asaas.pendente : 0,
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
  };
}

