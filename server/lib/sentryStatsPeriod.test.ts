import { describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({
  env: { sentryAuthToken: "token", sentryOrgSlug: "org" },
}));

import { listSentryIssues, PERIODOS_DE_LISTAGEM } from "./sentryApi";

/**
 * Trava a lista fechada de `statsPeriod`.
 *
 * Nasceu como validacao de querystring na rota de bugs. A rota saiu na Fase 5 e
 * a regra DESCEU para dentro de listSentryIssues, porque o dono dela sempre foi
 * este modulo: quem impoe o conjunto e a API do Sentry, e todo chamador esta
 * sujeito. Guarda no call site cobriria so o chamador que existia.
 *
 * Medido contra a API viva em 2026-07-31: '', '24h' e '14d' respondem 200;
 * '7d', '30d', '90d' e '1h' respondem 400. Os quatro invalidos sao
 * sintaticamente impecaveis, e e por isso que validar FORMATO deixaria passar.
 */

describe("statsPeriod da listagem", () => {
  it("o conjunto aceito e exatamente este", () => {
    // Afirma o TOTAL, nao a pertinencia.
    expect([...PERIODOS_DE_LISTAGEM]).toEqual(["", "24h", "14d"]);
  });

  it.each(["7d", "30d", "90d", "1h", "3w", "1m"])(
    "recusa %o SEM gastar uma requisicao",
    async (periodo) => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const r = await listSentryIssues({ statsPeriod: periodo });
      expect(r.state).toBe("error");
      if (r.state === "error") expect(r.reason).toContain(periodo);
      // Mandar um valor que sabemos invalido para receber um 400 previsivel
      // seria queimar orcamento de rate limit por nada.
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    },
  );

  it("aceita os validos e chega a chamar a API", async () => {
    // mockImplementation e nao mockResolvedValue: o body de um Response so pode
    // ser lido UMA vez, entao reusar o mesmo objeto faz a segunda chamada
    // estourar "body already read" e o teste falhar por motivo errado.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response("[]", { status: 200 }));
    for (const periodo of PERIODOS_DE_LISTAGEM) {
      const r = await listSentryIssues({ statsPeriod: periodo });
      expect(r.state).toBe("ok");
    }
    // CONTROLE: sem isto, "recusou os invalidos" seria compativel com "recusa
    // tudo", e o teste passaria com a funcao quebrada.
    expect(fetchSpy).toHaveBeenCalledTimes(PERIODOS_DE_LISTAGEM.length);
    fetchSpy.mockRestore();
  });

  it("sem statsPeriod, o padrao continua 14d", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response("[]", { status: 200 }));
    await listSentryIssues({});
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain("statsPeriod=14d");
    fetchSpy.mockRestore();
  });
});
