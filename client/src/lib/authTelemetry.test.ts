import { describe, expect, it } from "vitest";

import {
  authErrorFields,
  buildAuthFailurePayload,
  redactSensitive,
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
