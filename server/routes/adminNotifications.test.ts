import { describe, expect, it } from "vitest";

import {
  isScheduledDue,
  mapProfileRowsToRecipients,
  validateScheduledFor,
} from "./adminNotifications";

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

// Agendamento: mesmas regras das campanhas de email (futuro com tolerancia de
// 60s, no maximo 30 dias a frente). Puro e testavel.
describe("validateScheduledFor", () => {
  const NOW = Date.parse("2026-07-20T12:00:00.000Z");

  it("data futura dentro da janela e aceita e devolve o ISO canonico", () => {
    const result = validateScheduledFor("2026-07-21T09:30:00.000Z", NOW);
    expect(result).toEqual({ ok: true, iso: "2026-07-21T09:30:00.000Z" });
  });

  it("agendamento no passado alem da tolerancia e rejeitado", () => {
    const result = validateScheduledFor("2026-07-20T11:58:00.000Z", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("O agendamento precisa ser no futuro.");
    }
  });

  it("dentro dos 60s de tolerancia no passado (clock skew) e aceito", () => {
    const result = validateScheduledFor("2026-07-20T11:59:30.000Z", NOW);
    expect(result.ok).toBe(true);
  });

  it("mais de 30 dias a frente e rejeitado", () => {
    const result = validateScheduledFor("2026-08-20T12:00:01.000Z", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(
        "O agendamento pode ser de no máximo 30 dias à frente.",
      );
    }
  });

  it("string invalida e rejeitada", () => {
    const result = validateScheduledFor("nao-e-data", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Data de agendamento inválida.");
    }
  });
});

// isScheduledDue espelha o WHERE do cron (status='scheduled' AND
// scheduled_for <= now): a agendada so vira published quando vencida.
describe("isScheduledDue", () => {
  const NOW = Date.parse("2026-07-20T12:00:00.000Z");

  it("scheduled_for no passado ou agora esta vencido (promove)", () => {
    expect(isScheduledDue("2026-07-20T11:59:59.000Z", NOW)).toBe(true);
    expect(isScheduledDue("2026-07-20T12:00:00.000Z", NOW)).toBe(true);
  });

  it("scheduled_for no futuro NAO esta vencido (nao promove)", () => {
    expect(isScheduledDue("2026-07-20T12:00:01.000Z", NOW)).toBe(false);
  });

  it("sem scheduled_for nunca esta vencido", () => {
    expect(isScheduledDue(null, NOW)).toBe(false);
  });
});
