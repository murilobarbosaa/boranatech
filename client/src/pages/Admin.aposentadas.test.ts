import { describe, expect, it } from "vitest";

import { redirecionamentoDeSecao } from "./Admin";

/**
 * O redirect de `?section=bugs` nao e cortesia.
 *
 * Medido na auditoria da Fase 0: `admin_bugs` NUNCA teve identificador curto, e
 * os tres e-mails (bug novo, resolvido, reaberto) linkam para `?section=bugs`
 * sem parametro de bug. Ou seja, o link da aba e literalmente o unico caminho
 * externo que existiu, e ele esta em caixas de entrada que nao dao para editar.
 */

describe("secoes aposentadas", () => {
  it("?section=bugs vai para o quadro BUG, nao para a visao geral", () => {
    expect(redirecionamentoDeSecao("?section=bugs")).toBe(
      "/admin?section=tarefas&board=bugs",
    );
  });

  it("secao viva nao e redirecionada", () => {
    // CONTROLE: sem isto, "redireciona bugs" seria compativel com "redireciona
    // tudo", e a aba de tarefas cairia num laco.
    expect(redirecionamentoDeSecao("?section=tarefas")).toBeNull();
    expect(redirecionamentoDeSecao("?section=financeiro")).toBeNull();
  });

  it("sem section, ou com lixo, nao redireciona", () => {
    expect(redirecionamentoDeSecao("")).toBeNull();
    expect(redirecionamentoDeSecao("?section=")).toBeNull();
    expect(redirecionamentoDeSecao("?section=nao_existe")).toBeNull();
  });

  it("o destino carrega o quadro, e nao so a aba", () => {
    // Sem `board=bugs` o link cairia no primeiro quadro por posicao, que nao e o
    // de bugs. O TasksDashboard cai no primeiro se o slug nao resolver, entao o
    // redirect tem destino mesmo se o quadro for excluido.
    expect(redirecionamentoDeSecao("?section=bugs")).toContain("board=bugs");
  });
});
