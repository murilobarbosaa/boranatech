import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { UserAuditHistory, acaoDeAuditoriaOf } from "./UserAuditHistory";
import type { AuditEntry, AuditPayload } from "./types";

afterEach(cleanup);

function entrada(over: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: "e1",
    action: "refund",
    resource_type: "charge",
    resource_slug: "ch_1",
    actor_user_id: "admin-1",
    actor_name: "Ana",
    created_at: "2026-07-30T12:00:00Z",
    before: {},
    after: { amount_cents: 5000, reason: "duplicidade" },
    campos_alterados: ["amount_cents", "reason"],
    outcome: "confirmed",
    outcome_detail: "Reembolso re_abc registrado.",
    ...over,
  };
}

function payload(over: Partial<AuditPayload> = {}): AuditPayload {
  return {
    entries: [entrada()],
    truncated: false,
    limit: 100,
    cross_reference_ok: true,
    ...over,
  };
}

function montar(over: Partial<AuditPayload> = {}) {
  render(
    <UserAuditHistory loading={false} error={null} payload={payload(over)} />,
  );
}

describe("acaoDeAuditoriaOf: resolver com fallback", () => {
  it("traduz as sete ações conhecidas", () => {
    const esperado: Record<string, string> = {
      reveal: "CPF revelado",
      grant: "Acesso de influencer concedido",
      revoke: "Acesso de influencer revogado",
      update_profile: "Cadastro editado",
      update_email: "E-mail alterado",
      cancel_subscription: "Assinatura cancelada",
      refund: "Reembolso",
    };
    for (const [action, label] of Object.entries(esperado)) {
      expect(acaoDeAuditoriaOf(action).label).toBe(label);
    }
  });

  it("ação desconhecida mostra o valor cru em vez de derrubar a seção", () => {
    // Convenção do projeto: acesso a mapa indexado por valor do servidor passa
    // por resolver com fallback neutro. Uma ação nova no banco não pode
    // quebrar o modal inteiro.
    expect(acaoDeAuditoriaOf("acao_do_futuro").label).toBe("acao_do_futuro");
  });
});

describe("UserAuditHistory: intenção nunca aparece como fato", () => {
  it("registro confirmado diz que foi confirmado, e por quê", () => {
    montar();
    expect(screen.getByText("Confirmado")).toBeTruthy();
    expect(screen.getByText(/re_abc/)).toBeTruthy();
  });

  it("registro SEM confirmação é sinalizado, não exibido como fato consumado", () => {
    montar({
      entries: [entrada({ outcome: "unconfirmed", outcome_detail: null })],
    });
    expect(screen.getByText("Sem confirmação")).toBeTruthy();
    expect(screen.queryByText("Confirmado")).toBeNull();
  });

  it("ação sem tabela de resultado é NÃO VERIFICÁVEL, um terceiro estado", () => {
    montar({
      entries: [
        entrada({ action: "update_profile", outcome: "not_verifiable" }),
      ],
    });
    expect(screen.getByText("Não verificável")).toBeTruthy();
    expect(screen.queryByText("Sem confirmação")).toBeNull();
  });

  it("cruzamento indisponível avisa: nada aqui foi checado contra o resultado", () => {
    montar({
      cross_reference_ok: false,
      entries: [entrada({ outcome: "not_verifiable" })],
    });
    expect(
      screen.getByText(/não foi possível checar o resultado/i),
    ).toBeTruthy();
  });

  it("cruzamento OK não mostra o aviso", () => {
    montar();
    expect(
      screen.queryByText(/não foi possível checar o resultado/i),
    ).toBeNull();
  });
});

describe("UserAuditHistory: o que aparece e o que não aparece", () => {
  it("valor permitido aparece", () => {
    montar({
      entries: [
        entrada({
          action: "update_email",
          before: { email: "velho@x.com" },
          after: { email: "novo@x.com" },
          campos_alterados: ["email"],
          outcome: "not_verifiable",
        }),
      ],
    });
    expect(screen.getByText(/velho@x\.com/)).toBeTruthy();
    expect(screen.getByText(/novo@x\.com/)).toBeTruthy();
  });

  it("campo alterado FORA da allowlist aparece pelo nome, sem o valor", () => {
    // O servidor já não manda o valor. A tela precisa mostrar que o campo
    // mudou, senão filtrar o valor vira esconder o evento.
    montar({
      entries: [
        entrada({
          action: "update_profile",
          before: {},
          after: {},
          campos_alterados: ["bio"],
          outcome: "not_verifiable",
        }),
      ],
    });
    expect(screen.getByText(/bio/)).toBeTruthy();
    expect(screen.getByText(/valor não exibido/i)).toBeTruthy();
  });

  it("quem fez aparece em toda entrada", () => {
    montar();
    expect(screen.getByText(/Ana/)).toBeTruthy();
  });

  it("nenhum botão de ação: a seção é leitura", () => {
    const { container } = render(
      <UserAuditHistory loading={false} error={null} payload={payload()} />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});

describe("UserAuditHistory: estados", () => {
  it("carregando mostra esqueleto", () => {
    render(<UserAuditHistory loading error={null} payload={null} />);
    expect(screen.getByTestId("user-audit-skeleton")).toBeTruthy();
  });

  it("erro fica inline, não engole o problema", () => {
    render(
      <UserAuditHistory
        loading={false}
        error="Erro ao buscar."
        payload={null}
      />,
    );
    expect(screen.getByText("Erro ao buscar.")).toBeTruthy();
  });

  it("histórico vazio diz que está vazio", () => {
    montar({ entries: [] });
    expect(
      screen.getByText(/nenhuma ação administrativa registrada/i),
    ).toBeTruthy();
  });

  it("truncamento AVISA que cortou", () => {
    montar({ truncated: true, limit: 100 });
    expect(screen.getByText(/primeiras 100/i)).toBeTruthy();
  });

  it("payload de shape inesperado não derruba o modal", () => {
    // Janela de deploy: front novo contra backend antigo, que não conhece a
    // rota. O 404 cai no ramo de erro, mas um payload de outro shape chegaria
    // até aqui e `entries.length` estouraria o render do detalhe inteiro.
    render(
      <UserAuditHistory
        loading={false}
        error={null}
        payload={{} as unknown as AuditPayload}
      />,
    );
    expect(
      screen.getByText(/nenhuma ação administrativa registrada/i),
    ).toBeTruthy();
  });
});
