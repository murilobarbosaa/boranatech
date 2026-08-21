import { describe, expect, it } from "vitest";

import { parseAuthError } from "./authCallback";

describe("parseAuthError", () => {
  it("le erro da query (fluxo PKCE)", () => {
    expect(
      parseAuthError(
        "?error=access_denied&error_code=access_denied&error_description=User+cancelled",
        "",
      ),
    ).toEqual({
      error: "access_denied",
      errorCode: "access_denied",
      description: "User cancelled",
    });
  });

  it("le erro do hash (fluxo implicit)", () => {
    expect(
      parseAuthError("", "#error=server_error&error_code=otp_expired"),
    ).toEqual({
      error: "server_error",
      errorCode: "otp_expired",
      description: null,
    });
  });

  it("devolve null quando nao ha erro", () => {
    expect(parseAuthError("?code=abc123", "")).toBeNull();
    expect(parseAuthError("", "")).toBeNull();
  });

  // Item 1.5, e este e o caso que importa: o hash do fluxo implicit carrega
  // access_token. A leitura e por allowlist de tres chaves, entao token nao pode
  // sair daqui nem por acidente. Uma implementacao que varresse os parametros
  // (Object.fromEntries) passaria nos testes acima e falharia neste.
  it("nunca devolve token presente no hash", () => {
    const parsed = parseAuthError(
      "",
      "#access_token=SEGREDO&refresh_token=SEGREDO2&error=server_error&error_code=x",
    );
    expect(parsed).toEqual({
      error: "server_error",
      errorCode: "x",
      description: null,
    });
    expect(JSON.stringify(parsed)).not.toContain("SEGREDO");
  });

  it("aceita error_code sem error e vice-versa", () => {
    expect(parseAuthError("?error_code=bad_oauth_state", "")).toEqual({
      error: null,
      errorCode: "bad_oauth_state",
      description: null,
    });
    expect(parseAuthError("?error=access_denied", "")).toEqual({
      error: "access_denied",
      errorCode: null,
      description: null,
    });
  });
});
