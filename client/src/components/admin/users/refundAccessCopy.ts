import type { RefundAccessOutcome } from "./types";

// O que a tela diz sobre o ACESSO depois de uma devolução.
//
// Vive num módulo próprio porque os dois diálogos (reembolso emitido e registro
// de devolução externa) precisam da MESMA frase para o MESMO desfecho. Duas
// cópias divergiriam, e o desfecho que mais importa é justamente o mais raro:
// dinheiro devolvido e acesso mantido.

export type TomDeAviso = "sucesso" | "atencao" | "neutro";

export type AvisoDeAcesso = {
  tom: TomDeAviso;
  mensagem: string;
  /**
   * O admin precisa fazer alguma coisa à mão. É o que decide se a tela usa o
   * toast de erro (que exige dispensa) em vez do de sucesso.
   */
  exigeAcaoManual: boolean;
};

/**
 * PREVISÃO da revogação, para o passo de confirmação.
 *
 * É aritmética de EXIBIÇÃO, e o servidor não confia nela: ele recomputa o teto
 * e decide sozinho (devolucaoZeraOSaldo em server/lib/proRevocation.ts). Existe
 * só para o texto do passo 2 poder avisar antes, porque a ação ficou mais
 * irreversível do que era e o texto tem que acompanhar.
 *
 * Se as duas discordarem, quem manda é o servidor e o toast diz o que de fato
 * aconteceu.
 */
export function vaiRevogar(
  valorEscolhido: number | null,
  refundableCents: number,
): boolean {
  if (valorEscolhido === null) return false;
  return valorEscolhido >= refundableCents;
}

/**
 * Traduz o desfecho do servidor numa frase.
 *
 * Resolver com fallback, não acesso direto a mapa: um `reason` novo no backend
 * não pode derrubar o diálogo. Desconhecido cai no ramo genérico, que é
 * construído a partir dos booleanos (`should_revoke`/`revoked`) e continua
 * dizendo a verdade mesmo sem conhecer o motivo.
 */
export function avisoDeAcesso(
  acesso: RefundAccessOutcome | null | undefined,
): AvisoDeAcesso | null {
  // Backend antigo na janela de deploy: sem o campo, a tela não inventa nada.
  if (!acesso) return null;

  if (!acesso.should_revoke) {
    return {
      tom: "neutro",
      mensagem:
        "Devolução parcial: o acesso Pro foi mantido, porque ainda há valor pago.",
      exigeAcaoManual: false,
    };
  }

  if (acesso.revoked) {
    return acesso.still_pro_via_influencer
      ? {
          tom: "atencao",
          mensagem:
            "Assinatura cancelada, mas a pessoa CONTINUA Pro pela concessão de influencer. Para tirar o acesso, revogue a concessão também.",
          exigeAcaoManual: true,
        }
      : {
          tom: "sucesso",
          mensagem: "Acesso Pro removido na hora.",
          exigeAcaoManual: false,
        };
  }

  if (acesso.reason === "no_active_subscription") {
    return {
      tom: "neutro",
      mensagem: "Não havia assinatura vigente para revogar.",
      exigeAcaoManual: false,
    };
  }

  // O desfecho que não pode passar despercebido.
  return {
    tom: "atencao",
    mensagem: `O ACESSO PRO NÃO FOI REMOVIDO e continua valendo.${
      acesso.detail ? ` ${acesso.detail}` : ""
    } Cancele a assinatura à mão. O registro aparece como "Sem confirmação" no histórico abaixo.`,
    exigeAcaoManual: true,
  };
}

/** Frase única para o toast, juntando o que aconteceu com o dinheiro e com o acesso. */
export function toastDeDevolucao(input: {
  acaoFeita: string;
  acesso: RefundAccessOutcome | null | undefined;
  extratoSincronizado: boolean;
}): { mensagem: string; erro: boolean } {
  const aviso = avisoDeAcesso(input.acesso);
  const partes = [input.acaoFeita];

  if (aviso) partes.push(aviso.mensagem);
  if (!input.extratoSincronizado) {
    partes.push("O extrato pode levar alguns minutos para atualizar.");
  }

  return {
    mensagem: partes.join(" "),
    // Toast de ERRO quando algo ficou por fazer: o de sucesso some sozinho, e
    // um estado meio-feito não pode depender de o admin estar olhando.
    erro: Boolean(aviso?.exigeAcaoManual),
  };
}
