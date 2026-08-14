import { describe, expect, it } from "vitest";

import {
  authErrorFields,
  buildAuthFailurePayload,
  redactSensitive,
  nivelSentry,
  sentryTagsDeAuth,
  SENTRY_ORIGEM_AUTH,
} from "./authTelemetry";

const ENV = {
  hostname: "boranatech.com.br",
  pathname: "/perfil",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
};

describe("redactSensitive", () => {
  it("remove tokens nomeados em querystring e em JSON", () => {
    expect(redactSensitive("erro em access_token=abc.def.ghi&x=1")).not.toContain(
      "abc.def.ghi",
    );
    expect(redactSensitive('{"refresh_token":"zzz-yyy"}')).not.toContain(
      "zzz-yyy",
    );
    expect(redactSensitive("code_verifier=Xy_9-abc")).not.toContain("Xy_9-abc");
  });

  it("remove JWT solto, sem nome de campo por perto", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const out = redactSensitive(`falhou com ${jwt} no meio`);
    expect(out).not.toContain(jwt);
    expect(out).toContain("[redacted]");
  });

  // CONTROLE NEGATIVO: uma redacao que apagasse tudo passaria nos testes acima.
  it("preserva texto que nao e sensivel", () => {
    const msg = "invalid request: both auth code and code verifier should be non-empty";
    expect(redactSensitive(msg)).toBe(msg);
  });
});

describe("buildAuthFailurePayload", () => {
  it("monta os campos exigidos pelo item 1.1", () => {
    const payload = buildAuthFailurePayload(
      {
        stage: "session_unconfirmed",
        method: "oauth_redirect",
        provider: "google",
        errorCode: "pkce_exchange_unconfirmed",
        elapsedMs: 20_004,
      },
      ENV,
    );

    expect(payload).toMatchObject({
      stage: "session_unconfirmed",
      method: "oauth_redirect",
      provider: "google",
      error_code: "pkce_exchange_unconfirmed",
      hostname: "boranatech.com.br",
      callback_path: "/perfil",
      is_webview: false,
      webview_app: null,
      elapsed_ms: 20_004,
    });
  });

  it("separa estagio de provider de estagio de perfil (item 1.4)", () => {
    const provider = buildAuthFailurePayload(
      { stage: "provider", method: "oauth_redirect" },
      ENV,
    );
    const profile = buildAuthFailurePayload(
      { stage: "profile", method: "oauth_redirect", httpStatus: 500 },
      ENV,
    );
    expect(provider.stage).toBe("provider");
    expect(profile.stage).toBe("profile");
    expect(profile.http_status).toBe(500);
  });

  it("marca webview e o app quando o UA e de app embutido", () => {
    const payload = buildAuthFailurePayload(
      { stage: "provider", method: "oauth_redirect" },
      {
        ...ENV,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 329.0.0.13.97",
      },
    );
    expect(payload.is_webview).toBe(true);
    expect(payload.webview_app).toBe("instagram");
  });

  // Item 1.5. Esta e a assercao que travaria um vazamento: se alguem passar a
  // mandar a URL inteira em vez de hostname/pathname, ou deixar de redigir a
  // mensagem, o `code` e o token aparecem aqui.
  it("nunca carrega token, senha ou code_verifier", () => {
    const payload = buildAuthFailurePayload(
      {
        stage: "provider",
        method: "oauth_redirect",
        errorCode: "server_error",
        errorMessage:
          "falha ao trocar code_verifier=SEGREDO_VERIFIER e access_token=SEGREDO_TOKEN",
      },
      ENV,
    );

    const serializado = JSON.stringify(payload);
    expect(serializado).not.toContain("SEGREDO_VERIFIER");
    expect(serializado).not.toContain("SEGREDO_TOKEN");
    // E o payload nao tem campo de URL completa nem de query, por construcao.
    expect(Object.keys(payload)).not.toContain("url");
    expect(serializado).not.toContain("?");
  });

  it("trunca mensagem longa para nao virar payload gigante", () => {
    const payload = buildAuthFailurePayload(
      {
        stage: "provider",
        method: "email_password",
        errorMessage: "x".repeat(5_000),
      },
      ENV,
    );
    expect(payload.error_message!.length).toBeLessThanOrEqual(300);
  });
});

describe("authErrorFields", () => {
  it("le code, message e status de um AuthError do supabase", () => {
    expect(
      authErrorFields({
        code: "invalid_credentials",
        message: "Invalid login credentials",
        status: 400,
      }),
    ).toEqual({
      code: "invalid_credentials",
      message: "Invalid login credentials",
      status: 400,
    });
  });

  it("devolve null em vez de inventar codigo para erro de rede", () => {
    const fields = authErrorFields(new TypeError("Failed to fetch"));
    expect(fields.code).toBeNull();
    expect(fields.status).toBeNull();
    expect(fields.message).toBe("Failed to fetch");
  });

  it("aguenta null e string", () => {
    expect(authErrorFields(null).code).toBeNull();
    expect(authErrorFields("deu erro").message).toBe("deu erro");
  });
});

/**
 * Nivel do evento no Sentry (item 2 da Fase 4B).
 *
 * Senha errada e e-mail ja cadastrado sao produto funcionando. Somavam 19 dos
 * eventos de 24h como `error` e empurravam para baixo as duas falhas reais.
 * Rebaixados para `info`: saem da triagem de erro e a serie continua existindo,
 * porque pico de `invalid_credentials` e sinal de seguranca.
 */
describe("nivelSentry", () => {
  it("comportamento normal do produto vira info", () => {
    expect(nivelSentry("invalid_credentials")).toBe("info");
    expect(nivelSentry("user_already_exists")).toBe("info");
  });

  it("falha de verdade continua error", () => {
    expect(nivelSentry("profile_fetch_exhausted")).toBe("error");
    expect(nivelSentry("bad_oauth_state")).toBe("error");
    expect(nivelSentry("pkce_exchange_unconfirmed")).toBe("error");
  });

  it("codigo ausente ou desconhecido continua error, que e o default seguro", () => {
    expect(nivelSentry(null)).toBe("error");
    expect(nivelSentry("codigo_que_ainda_nao_existe")).toBe("error");
  });
});

/**
 * Tags do evento de auth no Sentry.
 *
 * POR QUE TAG E NAO SO `extra`. `extra` nao e agregavel: o painel nao filtra
 * nem quebra a contagem por ele. Com 200 eventos de `profile_fetch_exhausted`
 * (BORANATECH-FRONT-4) e 109 de `bad_oauth_state` (BORANATECH-FRONT-7), a
 * pergunta que decide o conserto e "quantos sao 5xx, quantos sao 401, quantos
 * sao rede?" e "quantos vieram de www e quantos do apex?". Nenhuma das duas se
 * responde com `extra`. O `extra` FICA, porque tag e para agregar e extra e
 * para ler o caso individual.
 *
 * O `?? "none"` nao e cosmetico. Tag com `undefined` some do evento, e tag com
 * string vazia agrupa como se fosse um valor. Nos dois casos o denominador da
 * conta fica errado em silencio: 200 eventos viram "150 tem status" e ninguem
 * sabe o que aconteceu com os outros 50. "none" e um valor explicito, contavel
 * e visivel no painel.
 */
describe("sentryTagsDeAuth", () => {
  function payloadCom(over: Partial<Parameters<typeof buildAuthFailurePayload>[0]>) {
    return buildAuthFailurePayload(
      {
        stage: "profile",
        method: "oauth_redirect",
        provider: null,
        errorCode: "profile_fetch_exhausted",
        ...over,
      },
      ENV,
    );
  }

  it("leva http_status e hostname para tag, como string", () => {
    const tags = sentryTagsDeAuth(payloadCom({ httpStatus: 503 }));

    expect(tags.http_status).toBe("503");
    expect(tags.hostname).toBe("boranatech.com.br");
  });

  it("distingue os hostnames que a hipotese www-vs-apex precisa separar", () => {
    const apex = sentryTagsDeAuth(
      buildAuthFailurePayload({ stage: "provider", method: "oauth_redirect" }, ENV),
    );
    const www = sentryTagsDeAuth(
      buildAuthFailurePayload(
        { stage: "provider", method: "oauth_redirect" },
        { ...ENV, hostname: "www.boranatech.com.br" },
      ),
    );

    expect(apex.hostname).toBe("boranatech.com.br");
    expect(www.hostname).toBe("www.boranatech.com.br");
  });

  // CONTROLE NEGATIVO: e o caso da falha de rede pura, que nao tem status. Sem
  // esta assercao, `undefined` passaria e a tag sumiria do evento justamente na
  // fatia que mais interessa distinguir.
  it("CONTROLE NEGATIVO: nenhuma tag sai undefined ou vazia quando o dado falta", () => {
    const tags = sentryTagsDeAuth(
      buildAuthFailurePayload(
        { stage: "profile", method: "oauth_redirect" },
        { hostname: null, pathname: null, userAgent: null },
      ),
    );

    expect(tags.http_status).toBe("none");
    expect(tags.hostname).toBe("none");
    for (const [chave, valor] of Object.entries(tags)) {
      expect(typeof valor, `tag ${chave}`).toBe("string");
      expect(valor.length, `tag ${chave}`).toBeGreaterThan(0);
    }
  });

  it("preserva as tags que ja existiam", () => {
    const tags = sentryTagsDeAuth(
      payloadCom({ method: "email_password", provider: "email" }),
    );

    expect(tags).toMatchObject({
      origem: SENTRY_ORIGEM_AUTH,
      auth_stage: "profile",
      auth_method: "email_password",
      auth_provider: "email",
      auth_is_webview: "false",
    });
  });
});
