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
};

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
  stripeChargeId: string;
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
      .select("id, status, precisa_revisao")
      .eq("stripe_charge_id", params.stripeChargeId)
      .maybeSingle();
    if (error) {
      throw new Error(`Falha ao buscar a nota da cobranca: ${error.message}`);
    }
    const nota = data as NotaAlvo | null;

    // Sem nota emitida nao ha o que cancelar nem o que revisar. Nota em
    // 'pending' cujo reembolso chegou antes da emissao tambem cai aqui: ela
    // ainda vai ser emitida pela fila, e a proxima passagem do reembolso (ou a
    // reconciliacao) reavalia. Nao ha o que fazer AGORA.
    if (!nota || nota.status !== "issued") return;

    if (extensao === "total") {
      await enqueueFiscalCancel(
        params.stripeChargeId,
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
      `[fiscal] falha ao aplicar reembolso na nota de ${params.stripeChargeId}; o REEMBOLSO nao foi afetado:`,
      err,
    );
    Sentry.captureException(err);
  }
}
