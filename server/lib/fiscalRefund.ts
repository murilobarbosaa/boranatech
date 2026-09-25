// Efeito de um reembolso sobre a NOTA FISCAL ja emitida.
//
// A regra em uma frase: reembolso INTEGRAL cancela a nota; reembolso PARCIAL
// nao cancela nada e chama um humano.
//
// POR QUE O PARCIAL NAO E AUTOMATICO. Cancelar uma nota de R$222 porque R$50
// voltaram seria apagar o documento dos R$172 que o cliente de fato pagou. O
// certo nesse caso e SUBSTITUIR a nota por uma de valor menor, e substituicao
// depende do que o municipio permite, do prazo, e as vezes de carta de correcao.
// Nada disso e decidivel por regra fixa, e uma automacao que escolhesse errado
// erraria em documento fiscal ja transmitido. Entao a linha e marcada e aparece
// no admin.

import * as Sentry from "@sentry/node";

import { enqueueFiscalCancel } from "./fiscalQueue";
import { supabaseAdmin } from "./supabaseAdmin";

export type RefundExtent = "total" | "partial" | "none";

/**
 * Classifica a extensao do reembolso. FUNCAO PURA, exportada para teste.
 *
 * Compara o total JA REEMBOLSADO com o valor bruto, e nao o valor desta
 * devolucao isolada: dois parciais de R$111 numa cobranca de R$222 somam um
 * reembolso integral, e a segunda metade precisa disparar o cancelamento. Olhar
 * so a operacao corrente deixaria a nota valendo sobre dinheiro inteiramente
 * devolvido.
 *
 * `>=` e nao `===` de proposito: ajuste de disputa pode levar o acumulado a
 * passar do bruto, e um `===` deixaria esse caso sem classificacao nenhuma.
 */
export function classifyRefundExtent(
  grossCents: number,
  refundedTotalCents: number,
): RefundExtent {
  if (refundedTotalCents <= 0) return "none";
  if (grossCents <= 0) return "none";
  return refundedTotalCents >= grossCents ? "total" : "partial";
}

type NotaAlvo = {
  id: string;
  status: string;
  precisa_revisao: boolean;
  refunded_cents: number;
};

/**
 * Estados em que a nota AINDA NAO FOI EMITIDA e o valor dela ainda pode descer
 * (regra R5: valor = bruto menos estornos ate a emissao).
 *
 * 'processing' entra: o valor ja foi enviado, mas o acumulado gravado e o que
 * mostra ao admin que houve estorno depois do envio. 'issued' fica de fora
 * porque tem caminho proprio (cancelamento ou revisao, logo abaixo);
 * 'canceled' e 'skipped' sao terminais sem valor a corrigir.
 */
const ESTADOS_ANTES_DA_EMISSAO = new Set([
  "awaiting_batch",
  "pending",
  "processing",
  "failed",
  "blocked_missing_data",
]);

/**
 * Aplica o efeito do reembolso na nota daquela cobranca. NUNCA lanca.
 *
 * MESMO CONTRATO DOS GANCHOS DA FASE 1: reembolso e movimento de dinheiro que
 * ja aconteceu, e nada do lado fiscal pode travar, desfazer ou fazer parecer
 * que falhou. O que escapar daqui aparece no admin pela contagem de
 * `precisa_revisao`, ou pela nota que segue 'issued' com um reembolso integral
 * registrado.
 */
export async function applyRefundToFiscalInvoice(params: {
  /** `fiscal_invoices.charge_key` da cobranca reembolsada (`chargeKeyOf`). */
  chargeKey: string;
  grossCents: number;
  refundedTotalCents: number;
  /** Aparece na justificativa enviada a prefeitura. */
  origem: "webhook" | "admin";
}): Promise<void> {
  try {
    const extensao = classifyRefundExtent(
      params.grossCents,
      params.refundedTotalCents,
    );
    if (extensao === "none") return;

    const { data, error } = await supabaseAdmin
      .from("fiscal_invoices")
      .select("id, status, precisa_revisao, refunded_cents")
      .eq("charge_key", params.chargeKey)
      .maybeSingle();
    if (error) {
      throw new Error(`Falha ao buscar a nota da cobranca: ${error.message}`);
    }
    const nota = data as NotaAlvo | null;

    if (!nota) return;

    // NOTA AINDA NAO EMITIDA: registra o acumulado estornado na propria linha,
    // e e dele que o worker tira o valor liquido (ou a dispensa, se o estorno
    // for integral). Ate o lote FISCAL-REGRAS 01 este caso saia calado, e a
    // nota seria emitida pelo bruto de uma cobranca ja devolvida.
    //
    // So CRESCE: o update casa apenas quando o acumulado novo e maior. Um
    // evento antigo reentregue depois de um mais novo nao desfaz o valor.
    if (ESTADOS_ANTES_DA_EMISSAO.has(nota.status)) {
      if (params.refundedTotalCents <= (nota.refunded_cents ?? 0)) return;
      const { error: refundError } = await supabaseAdmin
        .from("fiscal_invoices")
        .update({ refunded_cents: params.refundedTotalCents })
        .eq("id", nota.id)
        .lt("refunded_cents", params.refundedTotalCents);
      if (refundError) {
        throw new Error(
          `Falha ao registrar o estorno na nota ${nota.id}: ${refundError.message}`,
        );
      }
      console.log(
        `[fiscal] estorno de ${params.refundedTotalCents} centavos registrado na nota ${nota.id} antes da emissao (${extensao}, origem ${params.origem}).`,
      );
      return;
    }

    // Cancelada ou dispensada: nao ha o que cancelar nem o que revisar.
    if (nota.status !== "issued") return;

    if (extensao === "total") {
      await enqueueFiscalCancel(
        params.chargeKey,
        "Reembolso integral ao tomador",
      );
      console.log(
        `[fiscal] cancelamento enfileirado para a nota ${nota.id} (reembolso integral, origem ${params.origem}).`,
      );
      return;
    }

    // PARCIAL: marca e para. Idempotente por pre-checagem, para nao reescrever
    // a mesma linha a cada evento de reembolso da mesma cobranca.
    if (nota.precisa_revisao) return;
    const { error: updateError } = await supabaseAdmin
      .from("fiscal_invoices")
      .update({
        precisa_revisao: true,
        error_code: "reembolso_parcial",
        error_message:
          "Reembolso parcial: a nota emitida pode precisar de substituicao. Decisao humana.",
      })
      .eq("id", nota.id);
    if (updateError) {
      throw new Error(
        `Falha ao marcar revisao da nota ${nota.id}: ${updateError.message}`,
      );
    }
    console.log(
      `[fiscal] nota ${nota.id} marcada para revisao (reembolso parcial, origem ${params.origem}).`,
    );
  } catch (err) {
    console.error(
      `[fiscal] falha ao aplicar reembolso na nota de ${params.chargeKey}; o REEMBOLSO nao foi afetado:`,
      err,
    );
    Sentry.captureException(err);
  }
}
