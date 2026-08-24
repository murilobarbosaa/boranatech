import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tag `auth_error_kind`: o refinamento do `http_status: "none"`.
 *
 * A rodada 2 pos `http_status` como tag e mediu o que faltava: no caminho de
 * `profile_fetch_exhausted`, DOIS desfechos sem relacao chegam como "none".
 * `profileService.getMyProfile` lanca em tres situacoes:
 *
 *   1. HTTP nao-ok            -> `profileError(res.status, ...)`, status numerico
 *   2. 200 com corpo invalido -> `profileError(null, ...)`, status null
 *   3. rede (fetch rejeita)   -> TypeError cru, SEM propriedade `status`
 *
 * 2 e 3 colapsam, porque `AuthContext` faz `?.status ?? null` e presente-com-null
 * fica igual a ausente. "A API respondeu 200 com lixo" e "o navegador nem
 * conseguiu falar com a API" sao problemas diferentes, com donos diferentes.
 *
 * POR QUE O TIPO VEM DA ORIGEM. A alternativa seria olhar o TEXTO da mensagem
 * ("resposta vazia ou invalida") dentro de `sentryTagsDeAuth`. Isso e um parser
 * sobre a saida de outro trecho nosso: quebra em silencio quando alguem edita a
 * copy do `profileService`, e falha PASSANDO (classifica tudo como rede e
 * ninguem percebe). Quem sabe o tipo e quem lanca, entao quem lanca declara, em
 * CAMPO. A ausencia do campo tambem e informacao: se o erro nao veio do nosso
 * `profileError`, ele nao e nosso, e o unico jeito de o fetch falhar sem passar
 * por la e a requisicao nao completar.
 */

const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/react", () => ({ captureMessage: sentrySpy.captureMessage }));

const posthogSpy = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { capture: posthogSpy.capture } }));

import {
  authErrorKindOf,
  buildAuthFailurePayload,
  reportAuthFailure,
  sentryTagsDeAuth,
} from "./authTelemetry";

const ENV = {
  hostname: "boranatech.com.br",
  pathname: "/perfil",
  userAgent: "Mozilla/5.0",
};

function erroDoProfileService(kind: string, status: number | null) {
  return Object.assign(new Error("falhou"), { status, authErrorKind: kind });
}

function tagsDe(over: Parameters<typeof buildAuthFailurePayload>[0]) {
  return sentryTagsDeAuth(buildAuthFailurePayload(over, ENV));
}

beforeEach(() => {
  sentrySpy.captureMessage.mockClear();
  posthogSpy.capture.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("authErrorKindOf: categoria estrutural do erro", () => {
  it("HTTP nao-ok do profileService vira http", () => {
    expect(authErrorKindOf(erroDoProfileService("http", 503))).toBe("http");
  });

  it("200 com corpo invalido vira invalid_body, e nao se confunde com rede", () => {
    expect(authErrorKindOf(erroDoProfileService("invalid_body", null))).toBe(
      "invalid_body",
    );
  });

  it("TypeError do fetch, sem marcador, vira network", () => {
    expect(authErrorKindOf(new TypeError("Failed to fetch"))).toBe("network");
  });

  /**
   * O CONTROLE NEGATIVO CENTRAL DO ITEM: os dois casos que hoje sao ambos
   * `http_status: "none"` precisam sair DIFERENTES. Sem esta assercao, uma
   * implementacao que devolvesse "unknown" para os dois passaria nos testes
   * acima e o item inteiro nao teria feito nada.
   */
  it("CONTROLE NEGATIVO: corpo invalido e rede NAO colapsam", () => {
    const corpoInvalido = authErrorKindOf(
      erroDoProfileService("invalid_body", null),
    );
    const rede = authErrorKindOf(new TypeError("Load failed"));

    expect(corpoInvalido).not.toBe(rede);
    expect([corpoInvalido, rede]).toEqual(["invalid_body", "network"]);
  });

  it("erro irreconhecivel vira unknown, nunca undefined nem vazio", () => {
    for (const caso of [null, undefined, {}, "texto", 42]) {
      expect(authErrorKindOf(caso)).toBe("unknown");
    }
  });

  /**
   * CONTROLE NEGATIVO da uniao fechada. O marcador e um campo em um objeto de
   * erro, ou seja, qualquer coisa pode aparecer ali. Valor de fora da uniao nao
   * pode virar tag: seria cardinalidade sem limite vinda de dado nao confiavel.
   */
  it("CONTROLE NEGATIVO: kind fora da uniao nao vaza para a saida", () => {
    expect(authErrorKindOf(erroDoProfileService("qualquer_coisa", null))).toBe(
      "unknown",
    );
    expect(
      authErrorKindOf(Object.assign(new Error("x"), { authErrorKind: 7 })),
    ).toBe("unknown");
  });

  it("status numerico sem marcador ainda vira http", () => {
    expect(authErrorKindOf({ status: 500, message: "erro" })).toBe("http");
  });
});

describe("sentryTagsDeAuth: a tag auth_error_kind", () => {
  it("emite a categoria recebida no payload", () => {
    expect(
      tagsDe({
        stage: "profile",
        method: "oauth_redirect",
        errorCode: "profile_fetch_exhausted",
        errorKind: "invalid_body",
      }).auth_error_kind,
    ).toBe("invalid_body");
  });

  it("separa os dois desfechos que hoje sao ambos http_status none", () => {
    const corpoInvalido = tagsDe({
      stage: "profile",
      method: "oauth_redirect",
      errorCode: "profile_fetch_exhausted",
      errorKind: "invalid_body",
    });
    const rede = tagsDe({
      stage: "profile",
      method: "oauth_redirect",
      errorCode: "profile_fetch_exhausted",
      errorKind: "network",
    });

    // O que o item existe para provar: mesmo http_status, kind diferente.
    expect(corpoInvalido.http_status).toBe("none");
    expect(rede.http_status).toBe("none");
    expect(corpoInvalido.auth_error_kind).not.toBe(rede.auth_error_kind);
  });

  it("payload sem kind vira unknown, nunca undefined nem string vazia", () => {
    const tags = tagsDe({ stage: "provider", method: "oauth_redirect" });

    expect(tags.auth_error_kind).toBe("unknown");
    expect(tags.auth_error_kind).not.toBe("");
  });

  /**
   * CONTROLE NEGATIVO: a guarda mora DENTRO da funcao, entao vale para todo
   * chamador, inclusive os que ainda nao existem. Um kind invalido injetado
   * direto no payload nao chega na tag.
   */
  it("CONTROLE NEGATIVO: kind invalido no payload nao vira tag", () => {
    const payload = buildAuthFailurePayload(
      { stage: "provider", method: "oauth_redirect" },
      ENV,
    );

    expect(
      sentryTagsDeAuth({ ...payload, error_kind: "inventado" }).auth_error_kind,
    ).toBe("unknown");
  });

  it("toda tag continua sendo string (o painel nao aceita outra coisa)", () => {
    const tags = tagsDe({
      stage: "profile",
      method: "oauth_redirect",
      errorKind: "http",
      httpStatus: 500,
    });

    for (const valor of Object.values(tags)) {
      expect(typeof valor).toBe("string");
    }
  });
});

/**
 * A tag NAO parte issue nenhuma, e isso e verificavel, nao so afirmavel.
 *
 * O agrupamento default do Sentry para `captureMessage` vem da MENSAGEM; tag
 * nao entra no fingerprint default, e `reportAuthFailure` nao passa
 * `fingerprint` nenhum. Mesma justificativa da rodada 2, agora com as duas
 * pontas asseridas: a mensagem nao muda com o kind, e nao ha fingerprint nas
 * opcoes do capture.
 */
describe("auth_error_kind nao altera agrupamento", () => {
  it("kinds diferentes produzem a MESMA mensagem", () => {
    reportAuthFailure({
      stage: "profile",
      method: "oauth_redirect",
      errorCode: "profile_fetch_exhausted",
      errorKind: "invalid_body",
    });
    reportAuthFailure({
      stage: "profile",
      method: "oauth_redirect",
      errorCode: "profile_fetch_exhausted",
      errorKind: "network",
    });

    const [primeira, segunda] = sentrySpy.captureMessage.mock.calls;
    expect(primeira[0]).toBe("auth profile failure: profile_fetch_exhausted");
    expect(segunda[0]).toBe(primeira[0]);
  });

  it("CONTROLE NEGATIVO: nenhum fingerprint e passado ao captureMessage", () => {
    reportAuthFailure({
      stage: "profile",
      method: "oauth_redirect",
      errorCode: "profile_fetch_exhausted",
      errorKind: "network",
    });

    const opcoes = sentrySpy.captureMessage.mock.calls[0][1];
    expect(opcoes).not.toHaveProperty("fingerprint");
    expect(opcoes.tags.auth_error_kind).toBe("network");
  });
});
