import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * BUG-38: o fim do "unknown" cego.
 *
 * `authErrorFields` so entendia AuthError do supabase-js (`code` string). Todo o
 * resto (rejeicao de fetch, resposta HTTP sem corpo de erro, objeto estranho)
 * saia com `code: null`, e `reportAuthFailure` renderiza null como "unknown" na
 * mensagem. Resultado: uma issue "auth provider failure: unknown" onde cabem
 * causas que nao tem nada a ver uma com a outra, e que por isso nao se
 * diagnostica.
 *
 * A classificacao e por CAMPO, nunca pela mensagem. Nao e preciosismo: as tres
 * engines escrevem a MESMA falha de rede com tres frases diferentes ("Failed to
 * fetch", "Load failed", "NetworkError when attempting to fetch resource."), que
 * foi exatamente o que transformou um bug em tres issues no contador da home
 * (BUG-29/39/57). O que nao muda entre engines e o `name` do erro.
 *
 * CARDINALIDADE E O LIMITE DE PROJETO. Codigo de erro vira nome de issue, entao
 * um codigo derivado de texto livre abriria uma issue por variacao de frase, que
 * e pior que o "unknown" atual: em vez de um balde cego, mil baldes de um
 * evento. Dai o status so virar codigo dentro da faixa HTTP valida, e o `name`
 * passar por normalizacao com charset e comprimento fechados.
 */

const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/react", () => ({
  captureMessage: sentrySpy.captureMessage,
}));

const posthogSpy = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("posthog-js", () => ({ default: { capture: posthogSpy.capture } }));

import { authErrorFields, reportAuthFailure } from "./authTelemetry";

beforeEach(() => {
  sentrySpy.captureMessage.mockClear();
  posthogSpy.capture.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("authErrorFields: codigo de fallback quando nao ha code", () => {
  it("rejeicao de fetch (TypeError) vira network_error, nao unknown", () => {
    expect(authErrorFields(new TypeError("Failed to fetch")).code).toBe(
      "network_error",
    );
  });

  /**
   * As tres frases de engine tem que produzir o MESMO codigo. Sem esta
   * assercao, uma classificacao que lesse a mensagem passaria no teste acima e
   * abriria tres issues, que e o defeito que este item existe para nao repetir.
   */
  it("as tres frases de engine produzem o MESMO codigo", () => {
    const codigos = [
      "Failed to fetch",
      "Load failed",
      "NetworkError when attempting to fetch resource.",
    ].map((frase) => authErrorFields(new TypeError(frase)).code);

    expect(codigos).toEqual([
      "network_error",
      "network_error",
      "network_error",
    ]);
  });

  it("status numerico sem code vira http_<status>", () => {
    expect(authErrorFields({ status: 503, message: "indisponivel" }).code).toBe(
      "http_503",
    );
  });

  it("erro nomeado sem code e sem status usa o name normalizado", () => {
    const abort = new Error("cancelado");
    abort.name = "AbortError";

    expect(authErrorFields(abort).code).toBe("abort_error");
  });

  it("objeto irreconhecivel continua null (a mensagem segue 'unknown')", () => {
    expect(authErrorFields({}).code).toBeNull();
    expect(authErrorFields({ foo: "bar" }).code).toBeNull();
  });

  it("null, undefined e string continuam null", () => {
    expect(authErrorFields(null).code).toBeNull();
    expect(authErrorFields(undefined).code).toBeNull();
    expect(authErrorFields("deu erro").code).toBeNull();
  });

  /**
   * CONTROLE NEGATIVO da cardinalidade. `status` fora da faixa HTTP nao vira
   * codigo: sem isso, um campo `status` que signifique outra coisa (um enum
   * numerico de outra biblioteca, um timestamp) viraria uma issue por valor.
   */
  it("CONTROLE NEGATIVO: status fora da faixa HTTP nao vira codigo", () => {
    expect(authErrorFields({ status: 0 }).code).toBeNull();
    expect(authErrorFields({ status: 99999 }).code).toBeNull();
    expect(authErrorFields({ status: 1.5 }).code).toBeNull();
  });

  /**
   * CONTROLE NEGATIVO da cardinalidade, parte 2. `name` e texto que alguem pode
   * preencher com qualquer coisa. A normalizacao fecha charset e comprimento.
   */
  it("CONTROLE NEGATIVO: name livre e normalizado e truncado", () => {
    const bizarro = new Error("x");
    bizarro.name = "Erro Muito Estranho: " + "a".repeat(200);

    const code = authErrorFields(bizarro).code!;
    expect(code.length).toBeLessThanOrEqual(40);
    expect(code).toMatch(/^[a-z0-9_]+$/);
  });

  it("CONTROLE NEGATIVO: name generico 'Error' nao vira codigo", () => {
    // `new Error("x")` sem name proprio e o caso menos informativo que existe:
    // virar codigo "error" trocaria um balde cego por outro, com nome pior.
    expect(authErrorFields(new Error("x")).code).toBeNull();
  });
});

describe("authErrorFields: o que JA tinha code nao muda", () => {
  /**
   * CONTROLE NEGATIVO CRITICO DO ITEM.
   *
   * As issues em medicao (BUG-36 `profile_fetch_exhausted`, BUG-34
   * `bad_oauth_state`) agrupam pela MENSAGEM do `captureMessage`. Se a
   * classificacao vazasse para um evento que ja tem code, a issue se partiria no
   * meio da janela de observacao e a serie historica ficaria sem sentido.
   */
  it("code existente ganha precedencia sobre status", () => {
    expect(
      authErrorFields({
        code: "invalid_credentials",
        message: "Invalid login credentials",
        status: 400,
      }).code,
    ).toBe("invalid_credentials");
  });

  it("code existente ganha precedencia sobre name", () => {
    const err = Object.assign(new TypeError("Failed to fetch"), {
      code: "bad_oauth_state",
    });

    expect(authErrorFields(err).code).toBe("bad_oauth_state");
  });

  it.each([
    ["access_denied", "auth provider failure: access_denied"],
    ["bad_oauth_state", "auth provider failure: bad_oauth_state"],
    ["invalid_credentials", "auth provider failure: invalid_credentials"],
  ])("mensagem BYTE A BYTE identica para %s", (codigo, mensagemEsperada) => {
    reportAuthFailure({
      stage: "provider",
      method: "oauth_redirect",
      provider: "google",
      errorCode: codigo,
    });

    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    expect(sentrySpy.captureMessage.mock.calls[0][0]).toBe(mensagemEsperada);
  });

  it("mensagem BYTE A BYTE identica para profile_fetch_exhausted", () => {
    reportAuthFailure({
      stage: "profile",
      method: "oauth_redirect",
      errorCode: "profile_fetch_exhausted",
      httpStatus: null,
    });

    expect(sentrySpy.captureMessage.mock.calls[0][0]).toBe(
      "auth profile failure: profile_fetch_exhausted",
    );
  });

  it("sem code classificavel, a mensagem segue exatamente 'unknown'", () => {
    reportAuthFailure({
      stage: "provider",
      method: "oauth_redirect",
      errorCode: authErrorFields({}).code,
    });

    expect(sentrySpy.captureMessage.mock.calls[0][0]).toBe(
      "auth provider failure: unknown",
    );
  });
});
