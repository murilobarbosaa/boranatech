import { describe, expect, it } from "vitest";

import { limpaSeloDeReabertura } from "./sentryTaskPush";

/**
 * O SELO "Voltou" PRECISA SAIR QUANDO DEIXA DE SER VERDADE.
 *
 * O defeito medido em 2026-08-31: as duas escritas de `sentry_reopen_event_at`
 * (server/lib/sentryTaskIntake.ts:525 e :538) so preenchiam o campo, e nenhum
 * ponto do servidor o zerava. Concluir o card de novo gravava `completed_at` e
 * deixava o selo, entao ele passou a dizer "voltou alguma vez" em vez de "esta
 * reaberto". Doze cards o exibiam ao mesmo tempo, e um selo que quase todo card
 * tem nao e sinal, e textura de fundo.
 *
 * A regra tem DOIS lados, e os dois erram feio se invertidos: nao limpar deixa o
 * selo eterno (o defeito de hoje); limpar em qualquer escrita apaga o selo de um
 * card genuinamente reaberto no primeiro gesto que tocar nele, que e pior porque
 * some com o sinal certo. Por isso os controles negativos abaixo nao sao
 * decoracao: sao metade da regra.
 */

describe("limpaSeloDeReabertura", () => {
  it("reaberto que volta para concluido: LIMPA", () => {
    expect(
      limpaSeloDeReabertura({
        temSelo: true,
        origemEraTerminal: false,
        destinoEhTerminal: true,
      }),
    ).toBe(true);
  });

  it("reaberto que e arquivado: LIMPA (arquivar tambem e terminal)", () => {
    // Mesma forma da chamada da rota de arquivar, onde `origemEraTerminal` e
    // `Boolean(current.archived_at)` e `destinoEhTerminal` e `archived === true`.
    expect(
      limpaSeloDeReabertura({
        temSelo: true,
        origemEraTerminal: false,
        destinoEhTerminal: true,
      }),
    ).toBe(true);
  });

  it("CONTROLE NEGATIVO: reaberto que continua aberto MANTEM o selo", () => {
    expect(
      limpaSeloDeReabertura({
        temSelo: true,
        origemEraTerminal: false,
        destinoEhTerminal: false,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: terminal para terminal nao mexe", () => {
    // O card nao voltou a lugar nenhum, entao nao houve transicao a registrar.
    expect(
      limpaSeloDeReabertura({
        temSelo: true,
        origemEraTerminal: true,
        destinoEhTerminal: true,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: sair de terminal para aberto nao limpa", () => {
    // Esta e a direcao da REABERTURA manual. Limpar aqui apagaria o selo no
    // exato gesto que mais justifica te-lo.
    expect(
      limpaSeloDeReabertura({
        temSelo: true,
        origemEraTerminal: true,
        destinoEhTerminal: false,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: card SEM selo nunca gera escrita", () => {
    // Sem isto a rota emitiria `sentry_reopen_event_at: null` em toda conclusao,
    // escrevendo nulo por cima de nulo e sujando o `updated_at` de todo card
    // concluido, que e exatamente a classe de ruido que o Bloco D persegue.
    for (const origemEraTerminal of [true, false]) {
      for (const destinoEhTerminal of [true, false]) {
        expect(
          limpaSeloDeReabertura({
            temSelo: false,
            origemEraTerminal,
            destinoEhTerminal,
          }),
          `origem=${origemEraTerminal} destino=${destinoEhTerminal}`,
        ).toBe(false);
      }
    }
  });
});
