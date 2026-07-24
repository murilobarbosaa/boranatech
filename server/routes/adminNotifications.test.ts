import { describe, expect, it } from "vitest";

import {
  buildRecipientRows,
  buildRecipientsResponse,
  insertRecipientsWithFallback,
  isEmailColumnMissing,
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

  // recipients guarda o par (user_id, email) que o insert grava, pra a lista
  // custom ser recuperavel ao reeditar (antes so o user_id ia pro banco).
  it("recipients traz o par user_id + email lowercased pro insert", () => {
    const result = mapProfileRowsToRecipients(
      ["Ana@Exemplo.com"],
      [{ user_id: "auth-user-1", email: "Ana@Exemplo.com" }],
    );
    expect(result.recipients).toEqual([
      { userId: "auth-user-1", email: "ana@exemplo.com" },
    ]);
  });

  it("dois emails do mesmo usuario geram um unico recipient (dedupe por user_id)", () => {
    const result = mapProfileRowsToRecipients(
      ["a@exemplo.com", "b@exemplo.com"],
      [
        { user_id: "auth-user-1", email: "a@exemplo.com" },
        { user_id: "auth-user-1", email: "b@exemplo.com" },
      ],
    );
    expect(result.recipients).toEqual([
      { userId: "auth-user-1", email: "a@exemplo.com" },
    ]);
  });
});

// Montagem do payload de insert (pura). withEmail=false e o shape legado usado
// no fallback quando a coluna email ainda nao existe.
describe("buildRecipientRows", () => {
  it("withEmail=true inclui o email em cada linha", () => {
    expect(
      buildRecipientRows(
        "notif-1",
        [{ userId: "u1", email: "a@x.com" }],
        { withEmail: true },
      ),
    ).toEqual([
      { notification_id: "notif-1", user_id: "u1", email: "a@x.com" },
    ]);
  });

  it("withEmail=false omite o email (shape legado do fallback)", () => {
    const rows = buildRecipientRows(
      "notif-1",
      [{ userId: "u1", email: "a@x.com" }],
      { withEmail: false },
    );
    expect(rows).toEqual([{ notification_id: "notif-1", user_id: "u1" }]);
    expect(rows[0]).not.toHaveProperty("email");
  });
});

// Montagem da resposta do GET (pura): email null (legado) nao entra em `emails`,
// e `missing` conta os que faltam pra a UI cair no comportamento legado.
describe("buildRecipientsResponse", () => {
  it("todas as linhas com email: missing 0", () => {
    expect(
      buildRecipientsResponse([{ email: "a@x.com" }, { email: "b@x.com" }]),
    ).toEqual({ emails: ["a@x.com", "b@x.com"], total: 2, missing: 0 });
  });

  it("mistura de email e legado: missing conta os nulos", () => {
    expect(
      buildRecipientsResponse([{ email: "a@x.com" }, { email: null }]),
    ).toEqual({ emails: ["a@x.com"], total: 2, missing: 1 });
  });

  it("todas legadas (schema antigo): emails vazio e missing = total", () => {
    expect(
      buildRecipientsResponse([{ email: null }, { email: null }]),
    ).toEqual({ emails: [], total: 2, missing: 2 });
  });
});

// Deteccao do erro de coluna inexistente nos dois formatos (insert PGRST204,
// select 42703), com guarda de mensagem pra nao mascarar outra coluna.
describe("isEmailColumnMissing", () => {
  it("PGRST204 do insert com 'email' na mensagem", () => {
    expect(
      isEmailColumnMissing({
        code: "PGRST204",
        message:
          "Could not find the 'email' column of 'notification_recipients' in the schema cache",
      }),
    ).toBe(true);
  });

  it("42703 do select com 'email' na mensagem", () => {
    expect(
      isEmailColumnMissing({
        code: "42703",
        message: "column notification_recipients.email does not exist",
      }),
    ).toBe(true);
  });

  it("outro erro (23505) nao e coluna ausente", () => {
    expect(
      isEmailColumnMissing({ code: "23505", message: "duplicate key" }),
    ).toBe(false);
  });

  it("PGRST204 de outra coluna nao dispara o fallback do email", () => {
    expect(
      isEmailColumnMissing({
        code: "PGRST204",
        message: "Could not find the 'foo' column",
      }),
    ).toBe(false);
  });
});

// Degradacao do insert: com email falha por coluna ausente -> refaz sem email e
// conclui. runInsert injetavel evita mockar o supabaseAdmin.
describe("insertRecipientsWithFallback", () => {
  const recipients = [{ userId: "u1", email: "a@x.com" }];

  it("coluna ausente: refaz sem email, conclui e avisa uma vez", async () => {
    const calls: Array<Array<Record<string, unknown>>> = [];
    let warned = 0;
    const runInsert = async (rows: Array<Record<string, unknown>>) => {
      calls.push(rows);
      return calls.length === 1
        ? {
            error: {
              code: "PGRST204",
              message:
                "Could not find the 'email' column of 'notification_recipients' in the schema cache",
            },
          }
        : { error: null };
    };

    await expect(
      insertRecipientsWithFallback("notif-1", recipients, runInsert, () => {
        warned += 1;
      }),
    ).resolves.toBeUndefined();

    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toHaveProperty("email", "a@x.com");
    expect(calls[1][0]).not.toHaveProperty("email");
    expect(warned).toBe(1);
  });

  it("sucesso na 1a tentativa: nao refaz nem avisa", async () => {
    const calls: Array<unknown> = [];
    let warned = 0;
    const runInsert = async (rows: Array<Record<string, unknown>>) => {
      calls.push(rows);
      return { error: null };
    };
    await insertRecipientsWithFallback(
      "notif-1",
      recipients,
      runInsert,
      () => {
        warned += 1;
      },
    );
    expect(calls).toHaveLength(1);
    expect(warned).toBe(0);
  });

  it("erro que nao e coluna ausente propaga (nao mascara)", async () => {
    const runInsert = async () => ({
      error: { code: "23505", message: "duplicate key" },
    });
    await expect(
      insertRecipientsWithFallback("notif-1", recipients, runInsert),
    ).rejects.toThrow("duplicate key");
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
