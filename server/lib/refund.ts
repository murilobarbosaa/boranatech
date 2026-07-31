// Emissão de reembolso pelo admin: as peças puras.
//
// É a única ação da demanda SEM DESFAZER. Dinheiro que sai não volta por botão,
// então as guardas aqui não são zelo: cada uma cobre um jeito conhecido de
// devolver a mais, devolver duas vezes ou devolver o que já saiu.

export type RefundReason = "duplicate" | "fraudulent" | "requested_by_customer";

/** Linha de charge já agregada por server/lib/userTransactions.ts. */
export type ChargeParaReembolso = {
  id: string;
  type: string;
  stripe_charge_id: string | null;
  gross_cents: number;
  refunded_cents: number;
  disputed_cents: number;
  refundable_cents: number;
  refund_state: string;
  /** Cobrança de boleto: sem reembolso nativo na Stripe. */
  is_boleto?: boolean;
};

export type RefundRequest = {
  amountCents?: number;
  reason: string;
  /** Marcação explícita do admin; ausente = requested_by_customer. */
  reasonKind?: RefundReason;
};

export type RefundValidation =
  | { ok: true; amountCents: number; reason: string }
  | { ok: false; error: { code: string; message: string } };

/**
 * Chave de idempotência.
 *
 * O problema real: dois reembolsos parciais LEGÍTIMOS do mesmo valor no mesmo
 * charge são operação válida (R$50 duas vezes numa cobrança de R$200). Uma
 * chave `charge+valor` bloquearia o segundo, e a Stripe devolveria o PRIMEIRO
 * reembolso como resposta — o admin veria sucesso e o dinheiro não teria saído.
 * Idempotência que mente sobre sucesso é pior que não ter idempotência.
 *
 * A saída é incluir o QUANTO JÁ FOI REEMBOLSADO no momento da operação: ele é
 * igual nas duas metades de um duplo clique e diferente entre dois parciais
 * legítimos em sequência.
 *
 * TRADEOFF ACEITO, na direção segura: se o primeiro reembolso já tiver saído
 * mas o nosso `refunded_cents` ainda não tiver atualizado, um segundo parcial
 * genuíno computaria a mesma chave e a Stripe o deduplicaria — bloqueando uma
 * operação válida em vez de permitir uma duplicada. Errar bloqueando é o lado
 * certo quando se trata de devolver dinheiro. Na prática a rota chama
 * syncBalanceTransactions logo após emitir, então a janela é curta.
 */
export function idempotencyKeyForRefund(
  chargeId: string,
  amountCents: number,
  refundedBeforeCents: number,
): string {
  const chave = `refund:${chargeId}:${amountCents}:${refundedBeforeCents}`;
  // O limite da Stripe é 255 caracteres. Truncar pelo FIM preservaria o
  // prefixo e perderia justamente os números que distinguem as operações;
  // então o corte é no id, que é o pedaço longo.
  if (chave.length <= 255) return chave;
  const sufixo = `:${amountCents}:${refundedBeforeCents}`;
  const espaco = 255 - "refund:".length - sufixo.length;
  return `refund:${chargeId.slice(0, espaco)}${sufixo}`;
}

const REASONS_VALIDAS = new Set<RefundReason>([
  "duplicate",
  "fraudulent",
  "requested_by_customer",
]);

/**
 * Enum da Stripe a partir do motivo do admin.
 *
 * O padrão é `requested_by_customer`, e o texto livre NUNCA é inspecionado para
 * inferir outro valor. O motivo é `fraudulent`: marcar assim faz a Stripe
 * adicionar o cartão e o e-mail às block lists do Radar, um efeito FORA do
 * nosso sistema e permanente. Isso é decisão deliberada de antifraude, não algo
 * a deduzir de uma palavra digitada num campo de texto.
 *
 * O texto completo do admin vai íntegro para a auditoria, para admin_refunds e
 * para metadata na Stripe; o enum é só o rótulo grosso que a API aceita.
 */
export function stripeReasonFor(
  _textoLivre: string,
  marcacao?: RefundReason,
): RefundReason {
  if (marcacao && REASONS_VALIDAS.has(marcacao)) return marcacao;
  return "requested_by_customer";
}

export type RefundValidationOptions = {
  /**
   * Libera cobrança de boleto.
   *
   * `false` (padrão) é a postura da rota que CHAMA refunds.create: a Stripe não
   * devolve boleto por API, então deixar passar produziria um erro dela, não um
   * reembolso. `true` é a postura da rota que REGISTRA um ato externo, onde o
   * boleto é justamente o caso de uso e nenhuma devolução é emitida por nós.
   *
   * O restante da validação (motivo obrigatório, teto recomputado, valor
   * inteiro e positivo) é IDÊNTICO nas duas, e é por isso que existe um
   * parâmetro em vez de uma segunda função: duas cópias do teto divergiriam, e
   * o teto é o que impede devolver mais do que entrou.
   */
  permitirBoleto?: boolean;
};

export function validateRefundRequest(
  charge: ChargeParaReembolso,
  pedido: RefundRequest,
  opcoes: RefundValidationOptions = {},
): RefundValidation {
  if (charge.type !== "charge") {
    return {
      ok: false,
      error: {
        code: "not_a_charge",
        message: "Só é possível reembolsar uma cobrança.",
      },
    };
  }

  if (charge.is_boleto && !opcoes.permitirBoleto) {
    return {
      ok: false,
      error: {
        code: "boleto_not_refundable",
        message:
          "Cobrança de boleto não tem reembolso automático: a devolução sai por transferência bancária e precisa ser tratada com o cliente.",
      },
    };
  }

  const reason = (pedido.reason ?? "").trim();
  if (!reason) {
    return {
      ok: false,
      error: {
        code: "reason_required",
        message: "Informe o motivo do reembolso.",
      },
    };
  }

  // TETO RECOMPUTADO. O valor que a UI mostrou pode ter minutos de idade, e
  // nesse intervalo pode ter entrado outro reembolso ou uma disputa.
  const teto = charge.refundable_cents;
  if (teto <= 0) {
    return {
      ok: false,
      error: {
        code: "nothing_refundable",
        message:
          charge.disputed_cents > 0
            ? "Não há valor reembolsável: esta cobrança tem chargeback."
            : "Esta cobrança já foi totalmente reembolsada.",
      },
    };
  }

  const amountCents = pedido.amountCents ?? teto;
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return {
      ok: false,
      error: {
        code: "invalid_amount",
        message: "Valor de reembolso inválido.",
      },
    };
  }
  if (amountCents > teto) {
    return {
      ok: false,
      error: {
        code: "amount_above_refundable",
        message: "O valor pedido é maior do que o disponível para reembolso.",
      },
    };
  }

  return { ok: true, amountCents, reason };
}

/**
 * Limitador de emissão de reembolso, por ator.
 *
 * Fábrica em vez de estado solto de módulo: assim ele é testável em isolamento
 * e o teto entra por parâmetro. O limiter global de app.ts é por IP e generoso
 * (existe para conter abuso anônimo); esta é a única rota que move dinheiro
 * para fora e sem desfazer, então tem teto próprio e bem menor.
 *
 * LIMITE CONHECIDO: memória do processo. Reinicia no deploy e não é
 * compartilhado entre instâncias. NÃO é a defesa principal — essa é a
 * Idempotency-Key mais o teto recomputado no servidor. É a que impede um
 * script de emitir dezenas de reembolsos legítimos-mas-errados em segundos.
 */
/**
 * Teto de reembolsos por ator, POR PROCESSO.
 *
 * O contador vive na memoria desta instancia. Com mais de um processo servindo
 * a API, o teto efetivo e `max x instancias`, nao `max`. Hoje o Railway roda
 * uma instancia so, entao o efeito e o pretendido; se isso mudar, o limite
 * afrouxa em silencio e sem aviso nenhum.
 *
 * Nao virou contador em Redis de proposito: seria estado compartilhado novo
 * para um limite que e a SEGUNDA barreira (a primeira e a idempotencia por
 * `charge + valor + reembolsado_antes`, que e do banco e da Stripe, e essa nao
 * depende de instancia).
 */
export function criarLimitadorDeReembolso(opcoes: {
  max: number;
  janelaMs: number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function excedeu(actorId: string, agora = Date.now()): boolean {
    const atual = hits.get(actorId);
    if (!atual || agora > atual.resetAt) {
      hits.set(actorId, { count: 1, resetAt: agora + opcoes.janelaMs });
      return false;
    }
    atual.count += 1;
    return atual.count > opcoes.max;
  };
}
