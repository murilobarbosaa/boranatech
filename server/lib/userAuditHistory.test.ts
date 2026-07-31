import { describe, expect, it } from "vitest";

import {
  CAMPOS_VISIVEIS_POR_ACTION,
  buildAuditHistory,
  camposVisiveis,
} from "./userAuditHistory";

/**
 * Histórico administrativo de UM usuário.
 *
 * Duas coisas em jogo, e as duas são sobre não mentir:
 *
 *  1. content_audit_logs é escrito ANTES da ação (fail-closed), então uma linha
 *     registra INTENÇÃO, não resultado. Mostrar intenção como fato mente
 *     exatamente onde o registro existe para não mentir.
 *  2. before_json/after_json guardam VALORES de campo. A renderização é por
 *     ALLOWLIST: campo novo no futuro não entra na tela por padrão.
 */

describe("camposVisiveis: allowlist, nunca blocklist", () => {
  it("update_email mostra os dois endereços: são o objeto da ação", () => {
    expect(camposVisiveis("update_email", { email: "velho@x.com" })).toEqual({
      email: "velho@x.com",
    });
  });

  it("update_profile mostra só os campos permitidos", () => {
    const visivel = camposVisiveis("update_profile", {
      name: "Ana",
      headline: "Dev",
      bio: "texto longo e pessoal",
    });
    expect(visivel).toEqual({ name: "Ana", headline: "Dev" });
  });

  it("campo NOVO não entra por padrão", () => {
    // O ponto da allowlist: se alguém acrescentar um campo editável amanhã, ele
    // NÃO aparece na tela até ser adicionado aqui de propósito.
    expect(
      camposVisiveis("update_profile", { campo_do_futuro: "segredo" }),
    ).toEqual({});
  });

  it("bio fica de fora: é texto livre e pessoal", () => {
    expect(camposVisiveis("update_profile", { bio: "x" })).toEqual({});
  });

  it("reveal não tem campo nenhum para mostrar", () => {
    // Medido: a rota grava before_json e after_json NULOS, e produção tem 0
    // linhas de reveal com json. Mesmo assim a allowlist é vazia, para o dia em
    // que alguém mudar a gravação.
    expect(camposVisiveis("reveal", { cpf: "39053344705" })).toEqual({});
    expect(CAMPOS_VISIVEIS_POR_ACTION.reveal).toEqual([]);
  });

  it("action desconhecida não mostra campo nenhum", () => {
    expect(camposVisiveis("acao_do_futuro", { qualquer: "coisa" })).toEqual({});
  });

  it("json nulo não quebra", () => {
    expect(camposVisiveis("update_profile", null)).toEqual({});
    expect(camposVisiveis("update_profile", undefined)).toEqual({});
  });

  it("valor não primitivo é descartado: nada de objeto aninhado na tela", () => {
    expect(
      camposVisiveis("update_profile", { name: { nested: "x" } as never }),
    ).toEqual({});
  });
});

describe("buildAuditHistory: intenção vs resultado", () => {
  function log(over: Record<string, unknown> = {}) {
    return {
      id: "a1",
      action: "refund",
      resource_type: "charge",
      resource_id: "u1",
      resource_slug: "ch_1",
      actor_user_id: "admin-1",
      before_json: null,
      after_json: { amount_cents: 5000, reason: "x" },
      created_at: "2026-07-30T12:00:00Z",
      ...over,
    };
  }

  it("reembolso com linha em admin_refunds fica CONFIRMADO", () => {
    const h = buildAuditHistory({
      logs: [log()],
      atores: new Map([["admin-1", "Ana"]]),
      refunds: [
        {
          stripe_charge_id: "ch_1",
          amount_cents: 5000,
          stripe_refund_id: "re_1",
          settlement: "stripe_api",
        },
      ],
      cancelamentos: [],
    });

    expect(h[0].outcome).toBe("confirmed");
    expect(h[0].outcome_detail).toContain("re_1");
    expect(h[0].actor_name).toBe("Ana");
  });

  it("reembolso SEM linha de resultado fica como INTENÇÃO, não como fato", () => {
    // É o caso real da Fatia 7: a Stripe aceitou mas admin_refunds não gravou,
    // ou a Stripe recusou depois do audit. A tela não pode afirmar que houve.
    const h = buildAuditHistory({
      logs: [log()],
      atores: new Map(),
      refunds: [],
      cancelamentos: [],
    });

    expect(h[0].outcome).toBe("unconfirmed");
  });

  it("valor diferente não conta como confirmação", () => {
    const h = buildAuditHistory({
      logs: [log()],
      atores: new Map(),
      refunds: [
        {
          stripe_charge_id: "ch_1",
          amount_cents: 9999,
          stripe_refund_id: "re_9",
          settlement: "stripe_api",
        },
      ],
      cancelamentos: [],
    });
    expect(h[0].outcome).toBe("unconfirmed");
  });

  it("cancelamento com linha em subscription_cancellations fica CONFIRMADO", () => {
    const h = buildAuditHistory({
      logs: [
        log({
          action: "cancel_subscription",
          resource_type: "subscription",
          resource_slug: null,
        }),
      ],
      atores: new Map(),
      refunds: [],
      cancelamentos: [
        {
          canceled_at: "2026-07-30T12:00:05Z",
          status: "scheduled",
          effective_at: "2027-01-01T00:00:00Z",
        },
      ],
    });
    expect(h[0].outcome).toBe("confirmed");
  });

  it("cancelamento registrado ANTES do log não conta: não é o mesmo evento", () => {
    // A linha de resultado precisa ser posterior à intenção; uma anterior é de
    // outro cancelamento.
    const h = buildAuditHistory({
      logs: [log({ action: "cancel_subscription", resource_slug: null })],
      atores: new Map(),
      refunds: [],
      cancelamentos: [
        {
          canceled_at: "2020-01-01T00:00:00Z",
          status: "scheduled",
          effective_at: null,
        },
      ],
    });
    expect(h[0].outcome).toBe("unconfirmed");
  });

  it("ações SEM tabela de resultado ficam explicitamente NÃO VERIFICÁVEIS", () => {
    // update_profile, update_email, reveal e influencer não têm tabela de
    // resultado. Dizer "confirmado" seria inventar; dizer "não confirmado"
    // sugeriria falha. O terceiro estado é a resposta honesta.
    for (const action of [
      "update_profile",
      "update_email",
      "reveal",
      "grant",
      "revoke",
    ]) {
      const h = buildAuditHistory({
        logs: [log({ action, resource_slug: null })],
        atores: new Map(),
        refunds: [],
        cancelamentos: [],
      });
      expect(h[0].outcome, action).toBe("not_verifiable");
    }
  });

  it("ator que não resolve mostra algo legível, não quebra", () => {
    const h = buildAuditHistory({
      logs: [log({ actor_user_id: "fantasma" })],
      atores: new Map(),
      refunds: [],
      cancelamentos: [],
    });
    expect(h[0].actor_name).toBe("Admin removido");
  });

  it("ator nulo também é legível", () => {
    const h = buildAuditHistory({
      logs: [log({ actor_user_id: null })],
      atores: new Map(),
      refunds: [],
      cancelamentos: [],
    });
    expect(h[0].actor_name).toBe("Admin removido");
  });

  it("campo fora da allowlist ainda aparece como NOME alterado, sem o valor", () => {
    // Filtrar o valor não pode virar esconder o evento. A tela precisa poder
    // dizer "a bio foi alterada" sem mostrar a bio.
    const h = buildAuditHistory({
      logs: [
        log({
          action: "update_profile",
          before_json: { bio: "antiga", name: "Ana" },
          after_json: { bio: "nova", name: "Ana Maria" },
        }),
      ],
      atores: new Map(),
      refunds: [],
      cancelamentos: [],
    });
    expect(h[0].campos_alterados.sort()).toEqual(["bio", "name"]);
    expect(h[0].after).toEqual({ name: "Ana Maria" });
  });

  it("os campos expostos passam pela allowlist", () => {
    const h = buildAuditHistory({
      logs: [
        log({
          action: "update_profile",
          after_json: { name: "Nova", bio: "pessoal" },
        }),
      ],
      atores: new Map(),
      refunds: [],
      cancelamentos: [],
    });
    expect(h[0].after).toEqual({ name: "Nova" });
  });

  it("ordena do mais recente para o mais antigo, com desempate por id", () => {
    const h = buildAuditHistory({
      logs: [
        log({ id: "b", created_at: "2026-01-01T00:00:00Z" }),
        log({ id: "c", created_at: "2026-07-01T00:00:00Z" }),
        log({ id: "a", created_at: "2026-07-01T00:00:00Z" }),
      ],
      atores: new Map(),
      refunds: [],
      cancelamentos: [],
    });
    expect(h.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });

  it("lista vazia devolve vazio", () => {
    expect(
      buildAuditHistory({
        logs: [],
        atores: new Map(),
        refunds: [],
        cancelamentos: [],
      }),
    ).toEqual([]);
  });

  it("cruzamento INDISPONÍVEL degrada para não-verificável, sem sumir com a entrada", () => {
    // Decisão: falha do cruzamento não derruba a resposta. Perder o histórico
    // inteiro por causa de uma tabela auxiliar seria pior que mostrar a
    // intenção dizendo que o estado não pôde ser checado.
    const h = buildAuditHistory({
      logs: [log()],
      atores: new Map(),
      refunds: null,
      cancelamentos: null,
    });
    expect(h).toHaveLength(1);
    expect(h[0].outcome).toBe("not_verifiable");
  });
});
