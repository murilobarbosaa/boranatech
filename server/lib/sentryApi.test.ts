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
