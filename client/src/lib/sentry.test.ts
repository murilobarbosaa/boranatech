import { describe, expect, it } from "vitest";

import { amostrarPorOrigem, limparBreadcrumb } from "./sentry";

/** Trecho realista do que o usuário cola: tem telefone e e-mail no meio. */
const TEXTO_DE_PERFIL =
  "Ana Ferreira Moura | Full-Stack | ana.moura@exemplo.com | +55 11 91234-5678 | Campinas, São Paulo";

/**
 * O corte de amostragem por tipo de evento.
 *
 * Existe porque `sampleRate: 0.25` no init é cego ao conteúdo: ele decide antes
 * de haver tag para ler, e o efeito era que 3 de cada 4 telas quebradas ficavam
 * invisíveis. Ruído de extensão de browser pode ser amostrado; tela quebrada
 * não, porque é raro e cada ocorrência é o dado.
 *
 * `sortear` é injetado para o teste não depender de `Math.random`: um teste que
 * passa 3 de cada 4 vezes é pior que teste nenhum.
 */

describe("amostrarPorOrigem", () => {
  it("evento do boundary passa SEMPRE, mesmo no pior sorteio", () => {
    const evento = { tags: { origem: "error-boundary" } };
    expect(amostrarPorOrigem(evento, undefined, () => 0.99)).toBe(evento);
    expect(amostrarPorOrigem(evento, undefined, () => 1)).toBe(evento);
  });

  // Falha de login e rara e cada ocorrencia e o dado. Com amostragem, 3 de cada 4
  // relatos de "nao consegui entrar" ficariam invisiveis, que e exatamente o
  // problema que a instrumentacao de auth existe para resolver.
  it("evento de auth passa SEMPRE, mesmo no pior sorteio", () => {
    const evento = { tags: { origem: "auth" } };
    expect(amostrarPorOrigem(evento, undefined, () => 0.99)).toBe(evento);
    expect(amostrarPorOrigem(evento, undefined, () => 1)).toBe(evento);
  });

  it("evento comum continua amostrado a 0.25", () => {
    const evento = { tags: { origem: "outra-coisa" } };
    // Abaixo do corte passa.
    expect(amostrarPorOrigem(evento, undefined, () => 0.1)).toBe(evento);
    // Acima do corte é descartado.
    expect(amostrarPorOrigem(evento, undefined, () => 0.3)).toBeNull();
  });

  it("evento sem tag nenhuma é tratado como comum, não como boundary", () => {
    // Importa: se a ausência de tag caísse no caminho "sempre envia", qualquer
    // ruído de extensão passaria a ir 100% e estouraria a cota.
    const evento = {};
    expect(amostrarPorOrigem(evento, undefined, () => 0.3)).toBeNull();
    expect(amostrarPorOrigem(evento, undefined, () => 0.1)).toBe(evento);
  });

  it("a fronteira do corte é estrita", () => {
    const evento = { tags: { origem: "x" } };
    expect(amostrarPorOrigem(evento, undefined, () => 0.25)).toBeNull();
    expect(amostrarPorOrigem(evento, undefined, () => 0.2499)).toBe(evento);
  });
});

describe("limparBreadcrumb", () => {
  it("DESCARTA breadcrumb de console, que é por onde o perfil vazaria", () => {
    const crumb = {
      category: "console",
      message: `perfil recebido: ${TEXTO_DE_PERFIL}`,
      data: { arguments: [TEXTO_DE_PERFIL] },
    };
    expect(limparBreadcrumb(crumb)).toBeNull();
  });

  it("de fetch sobra método, caminho e status, e a query string SAI", () => {
    const limpo = limparBreadcrumb({
      category: "fetch",
      data: {
        method: "POST",
        url: "https://api.boranatech.com.br/api/linkedin/analyze?email=ana.moura@exemplo.com",
        status_code: 500,
        // Um dia alguém adiciona isto sem pensar. O filtro é allowlist, então
        // campo novo não passa por omissão.
        body: TEXTO_DE_PERFIL,
      },
    });

    expect(limpo?.data).toEqual({
      method: "POST",
      url: "https://api.boranatech.com.br/api/linkedin/analyze",
      status_code: 500,
    });
    expect(JSON.stringify(limpo)).not.toContain("ana.moura@exemplo.com");
  });

  it("breadcrumb de navegação e clique passa inteiro", () => {
    const crumb = { category: "ui.click", message: "button#analisar" };
    expect(limparBreadcrumb(crumb)).toBe(crumb);
  });

  it("URL sem query continua igual, e o fragmento também sai", () => {
    const limpo = limparBreadcrumb({
      category: "xhr",
      data: { method: "GET", url: "https://x/api/bookmarks/#ancora" },
    });
    expect(limpo?.data).toEqual({
      method: "GET",
      url: "https://x/api/bookmarks/",
    });
  });
});
