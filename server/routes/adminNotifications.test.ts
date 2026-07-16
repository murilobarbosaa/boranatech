import { describe, expect, it } from "vitest";

import { mapProfileRowsToRecipients } from "./adminNotifications";

// Regressao do bug de 2026-07-16: resolveRecipientEmails inseria profiles.id
// (uuid local) em notification_recipients.user_id, que referencia
// auth.users(id) via profiles.user_id. O mapeamento e puro e testavel: linhas
// sem user valido viram unmatched, nunca 500.

describe("mapProfileRowsToRecipients", () => {
  it("email com cadastro vira matched e o user_id (auth) vai pro insert", () => {
    const result = mapProfileRowsToRecipients(
      ["ana@exemplo.com", "sem-conta@exemplo.com"],
      [{ user_id: "auth-user-1", email: "ana@exemplo.com" }],
    );
    expect(result.matched).toEqual(["ana@exemplo.com"]);
    expect(result.unmatched).toEqual(["sem-conta@exemplo.com"]);
    expect(result.userIds).toEqual(["auth-user-1"]);
  });

  it("email sem cadastro vira unmatched", () => {
    const result = mapProfileRowsToRecipients(["ninguem@exemplo.com"], []);
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual(["ninguem@exemplo.com"]);
    expect(result.userIds).toEqual([]);
  });

  it("perfil sem user_id valido (orfao hipotetico) vira unmatched, sem estourar", () => {
    const result = mapProfileRowsToRecipients(
      ["orfao@exemplo.com"],
      [{ user_id: null, email: "orfao@exemplo.com" }],
    );
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual(["orfao@exemplo.com"]);
    expect(result.userIds).toEqual([]);
  });

  it("dois emails do mesmo usuario nao duplicam o user_id", () => {
    const result = mapProfileRowsToRecipients(
      ["a@exemplo.com", "b@exemplo.com"],
      [
        { user_id: "auth-user-1", email: "a@exemplo.com" },
        { user_id: "auth-user-1", email: "b@exemplo.com" },
      ],
    );
    expect(result.matched).toEqual(["a@exemplo.com", "b@exemplo.com"]);
    expect(result.userIds).toEqual(["auth-user-1"]);
  });

  it("email do banco e normalizado pra lowercase no confronto", () => {
    const result = mapProfileRowsToRecipients(
      ["ana@exemplo.com"],
      [{ user_id: "auth-user-1", email: "Ana@Exemplo.com" }],
    );
    expect(result.matched).toEqual(["ana@exemplo.com"]);
    expect(result.unmatched).toEqual([]);
  });
});
