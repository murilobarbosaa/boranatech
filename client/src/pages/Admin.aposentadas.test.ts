import { describe, expect, it } from "vitest";

import { redirecionamentoDeSecao, sectionFromSearch } from "./Admin";

/**
 * O redirect de `?section=bugs` nao e cortesia.
 *
 * Medido na auditoria da Fase 0: `admin_bugs` NUNCA teve identificador curto, e
 * os tres e-mails (bug novo, resolvido, reaberto) linkam para `?section=bugs`
 * sem parametro de bug. Ou seja, o link da aba e literalmente o unico caminho
 * externo que existiu, e ele esta em caixas de entrada que nao dao para editar.
 *
 * `seo` entrou depois, e trouxe junto a parte que o mecanismo nao aguentava: com
 * UMA entrada no mapa, `sectionFromSearch` podia cravar `"tarefas"` e acertar
 * sempre. Os casos de PRIMEIRO PAINT abaixo existem por isso, e o de bugs nao e
 * redundante com o de seo: ele e o controle que prova que generalizar a funcao
 * nao regrediu o precedente.
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

  it("?section=seo vai para paginas, a aba com o conteudo vizinho", () => {
    expect(redirecionamentoDeSecao("?section=seo")).toBe(
      "/admin?section=paginas",
    );
  });

  it("PRIMEIRO PAINT: seo ja renderiza paginas, sem piscar outra aba", () => {
    // O que quebrava com o nome cravado: a URL dizia seo, a tela abria Tarefas
    // e so depois o efeito reescrevia a barra de enderecos.
    expect(sectionFromSearch("?section=seo")).toBe("paginas");
  });

  it("PRIMEIRO PAINT: bugs continua abrindo Tarefas", () => {
    // CONTROLE do controle: a generalizacao tem de preservar o precedente. O
    // destino de bugs carrega parametro (`tarefas&board=bugs`), entao este caso
    // tambem prova que a secao e o trecho ANTES do `&`, e nao a string toda.
    expect(sectionFromSearch("?section=bugs")).toBe("tarefas");
  });

  it("PRIMEIRO PAINT: secao viva, lixo e ausencia seguem como antes", () => {
    expect(sectionFromSearch("?section=financeiro")).toBe("financeiro");
    expect(sectionFromSearch("?section=lixo")).toBe("visao-geral");
    expect(sectionFromSearch("")).toBe("visao-geral");
  });
});
