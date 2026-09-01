import { describe, expect, it } from "vitest";

import { metadadoTemMudanca } from "./sentryTaskDecisions";

/**
 * A VARREDURA NAO PODE PARECER ATIVIDADE.
 *
 * O defeito medido em 2026-08-31: o ramo "inalterado" de `manter()` gravava
 * sempre, com um payload que quase sempre so tinha `sentry_last_checked_at`.
 * `admin_tasks` tem o trigger `admin_tasks_set_updated_at` (migration
 * 20260727160000 linha 289), que roda `set_updated_at()` sem condicao nenhuma,
 * entao os 57 cards vinculados ganhavam `updated_at` novo a cada passada e
 * subiam juntos ao topo de qualquer ordenacao por atualizacao. Em 30/08 isso
 * pareceu reabertura em massa e custou uma investigacao inteira.
 *
 * Os controles negativos aqui sao a metade que importa. Uma regra que nunca
 * grava tambem "resolve" o ruido, e junto para de persistir `sentry_last_seen`,
 * que e o valor de que `decidirManutencao` depende para medir silencio. Sem
 * esses testes, a correcao poderia trocar um instrumento barulhento por um
 * instrumento cego, que e a troca ruim.
 */

describe("metadadoTemMudanca", () => {
  it("lastSeen NOVO e mudanca: grava", () => {
    expect(
      metadadoTemMudanca({
        lastSeenNovo: "2026-08-31T04:00:00Z",
        lastSeenPersistido: "2026-08-30T04:00:00Z",
        recoletouDetalhe: false,
      }),
    ).toBe(true);
  });

  it("primeiro lastSeen (nao havia persistido) e mudanca: grava", () => {
    expect(
      metadadoTemMudanca({
        lastSeenNovo: "2026-08-31T04:00:00Z",
        lastSeenPersistido: null,
        recoletouDetalhe: false,
      }),
    ).toBe(true);
  });

  it("recoleta de detalhe e mudanca, mesmo com lastSeen igual: grava", () => {
    expect(
      metadadoTemMudanca({
        lastSeenNovo: "2026-08-31T04:00:00Z",
        lastSeenPersistido: "2026-08-31T04:00:00Z",
        recoletouDetalhe: true,
      }),
    ).toBe(true);
  });

  it("CONTROLE NEGATIVO: lastSeen IDENTICO nao grava", () => {
    // Este e o caso de 55 dos 57 cards em uma passada tipica: a issue existe, o
    // Sentry devolve o mesmo lastSeen, e nada aconteceu.
    expect(
      metadadoTemMudanca({
        lastSeenNovo: "2026-08-31T04:00:00Z",
        lastSeenPersistido: "2026-08-31T04:00:00Z",
        recoletouDetalhe: false,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: issue ausente do lote nao grava", () => {
    // Sem lastSeen fresco nao ha o que persistir, e escrever o carimbo de
    // verificacao sozinho e exatamente o ruido que esta correcao remove.
    expect(
      metadadoTemMudanca({
        lastSeenNovo: undefined,
        lastSeenPersistido: "2026-08-30T04:00:00Z",
        recoletouDetalhe: false,
      }),
    ).toBe(false);
  });

  it("CONTROLE NEGATIVO: issue ausente E card sem lastSeen nao grava", () => {
    expect(
      metadadoTemMudanca({
        lastSeenNovo: undefined,
        lastSeenPersistido: null,
        recoletouDetalhe: false,
      }),
    ).toBe(false);
  });

  it("recoleta manda mesmo sem lastSeen no lote", () => {
    // A recoleta guarda `sentry_data` novo, que e conteudo de verdade. Deixar de
    // gravar por causa de um lastSeen ausente perderia a coleta que acabou de
    // custar uma requisicao ao Sentry.
    expect(
      metadadoTemMudanca({
        lastSeenNovo: undefined,
        lastSeenPersistido: null,
        recoletouDetalhe: true,
      }),
    ).toBe(true);
  });
});
