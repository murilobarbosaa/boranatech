import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: {
      ...real.env,
      sentryAuthToken: "token-de-teste",
      sentryOrgSlug: "boranatech",
    },
  };
});

import { listSentryIssues } from "./sentryApi";

/**
 * O painel enumera a ORGANIZACAO, nao um projeto.
 *
 * O que este arquivo impede de voltar: `SENTRY_PROJECT_SLUG` era singular, e no
 * dia em que nasceu o projeto de browser a tela "Erros capturados pelo Sentry"
 * passaria a listar metade dos erros, sem erro e sem aviso.
 *
 * Nao da para testar "projeto novo aparece" com rede de verdade sem criar um
 * projeto de verdade. O que da para testar, e e a afirmacao que importa, e que
 * NENHUM nome de projeto entra na URL: se o conjunto e escolhido pelo servidor
 * do Sentry (`project=-1`), nao existe lista local para ficar desatualizada.
 */

let urlsChamadas: string[] = [];

beforeEach(() => {
  urlsChamadas = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    urlsChamadas.push(String(input));
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listSentryIssues", () => {
  it("consulta a ORGANIZACAO, com project=-1", async () => {
    await listSentryIssues();

    expect(urlsChamadas).toHaveLength(1);
    const url = new URL(urlsChamadas[0]);
    expect(url.pathname).toBe("/api/0/organizations/boranatech/issues/");
    expect(url.searchParams.get("project")).toBe("-1");
  });

  /**
   * O filtro de level (BUG-69).
   *
   * `info` e rastro deliberado de SUCESSO. O caso que motivou: o
   * `[account-deletion] assinaturas encerradas`, um `captureMessage` que
   * registra o cancelamento bem-sucedido antes da exclusao da conta, virou card
   * na fila de bugs porque a query default nao olhava level nenhum.
   *
   * O SEGUNDO ASSERT E O QUE IMPORTA: `warning` NAO pode ser excluido junto. As
   * series de telemetria (`chunk_import_failed`, `vite_preload_error`,
   * `ai_lastro_violado`) sao warning e devem virar card se o volume explodir.
   * Um filtro largo demais aqui apagaria a fila inteira e o sintoma seria a
   * AUSENCIA de cards, que nao se nota.
   */
  it("exclui level info da ingestao, e NAO exclui warning", async () => {
    await listSentryIssues();

    const query = new URL(urlsChamadas[0]).searchParams.get("query") ?? "";
    expect(query).toContain("is:unresolved");
    expect(query).toContain("!level:info");
    expect(query).not.toContain("!level:warning");
    expect(query).not.toContain("!level:error");
  });

  it("query explicita do chamador vence o default", async () => {
    // O default so vale quando ninguem passa nada: o dry-run e as consultas
    // pontuais precisam poder pedir outra coisa.
    await listSentryIssues({ query: "is:resolved" });

    expect(
      new URL(urlsChamadas[urlsChamadas.length - 1]).searchParams.get("query"),
    ).toBe("is:resolved");
  });

  it("NENHUM slug de projeto aparece na URL", async () => {
    await listSentryIssues();

    // A assercao central: nao ha nome de projeto embutido, entao nao ha o que
    // atualizar quando a org ganhar o proximo.
    expect(urlsChamadas[0]).not.toContain("node-express");
    expect(urlsChamadas[0]).not.toContain("boranatech-front");
    expect(urlsChamadas[0]).not.toContain("/projects/");
  });

  it("nao exige mais SENTRY_PROJECT_SLUG para estar configurado", async () => {
    // O mock de env acima NAO define sentryProjectSlug. Antes, isto devolvia
    // `not_configured` e o painel mostrava "faltam variaveis".
    const r = await listSentryIssues();
    expect(r.state).not.toBe("not_configured");
  });
});
