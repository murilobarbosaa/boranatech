import { describe, expect, it } from "vitest";

import {
  avisoDeAcesso,
  ehRecuperacaoDeEstadoMeioFeito,
  toastDeDevolucao,
  vaiRevogar,
} from "./refundAccessCopy";
import type {
  RefundAccessOutcome,
  TransactionItem,
  TransactionsPayload,
} from "./types";

/**
 * O que a tela DIZ sobre o acesso depois de uma devolução.
 *
 * O desfecho que mais importa é o mais raro: dinheiro devolvido e acesso
 * mantido. Ele acontece quando a revogação falha DEPOIS de a Stripe já ter
 * aceitado o reembolso, e o pior resultado possível é ele passar despercebido.
 */

function acesso(over: Partial<RefundAccessOutcome> = {}): RefundAccessOutcome {
  return {
    should_revoke: true,
    revoked: true,
    reason: "revoked",
    detail: null,
    still_pro_via_influencer: false,
    ...over,
  };
}

describe("vaiRevogar (previsão para o texto do passo 2)", () => {
  it("valor igual ao teto revoga", () => {
    expect(vaiRevogar(20000, 20000)).toBe(true);
  });

  it("valor abaixo do teto não revoga", () => {
    expect(vaiRevogar(5000, 20000)).toBe(false);
  });

  it("sem valor escolhido não promete revogação", () => {
    // Campo vazio ou ilegível: prometer "o acesso será removido" com base em
    // null seria afirmar sobre uma operação que nem foi definida.
    expect(vaiRevogar(null, 20000)).toBe(false);
  });
});

describe("avisoDeAcesso", () => {
  it("sem o campo (backend antigo) não inventa nada", () => {
    // Janela de deploy: a Vercel sobe antes do Railway. Um aviso construído
    // sobre a ausência do campo afirmaria algo que ninguém apurou.
    expect(avisoDeAcesso(undefined)).toBeNull();
    expect(avisoDeAcesso(null)).toBeNull();
  });

  it("parcial: diz que o acesso foi mantido, e não exige ação", () => {
    const a = avisoDeAcesso(
      acesso({
        should_revoke: false,
        revoked: false,
        reason: "partial_refund",
      }),
    )!;
    expect(a.mensagem).toContain("mantido");
    expect(a.exigeAcaoManual).toBe(false);
  });

  it("revogado: sucesso, sem pendência", () => {
    const a = avisoDeAcesso(acesso())!;
    expect(a.tom).toBe("sucesso");
    expect(a.exigeAcaoManual).toBe(false);
  });

  it("revogado COM influencer: exige ação, porque a pessoa continua Pro", () => {
    const a = avisoDeAcesso(acesso({ still_pro_via_influencer: true }))!;
    expect(a.mensagem).toContain("CONTINUA Pro");
    expect(a.mensagem).toContain("influencer");
    expect(a.exigeAcaoManual).toBe(true);
  });

  it("sem assinatura: estado neutro, não falha", () => {
    const a = avisoDeAcesso(
      acesso({ revoked: false, reason: "no_active_subscription" }),
    )!;
    expect(a.exigeAcaoManual).toBe(false);
    expect(a.mensagem).toContain("Não havia assinatura");
  });

  it("REVOGAÇÃO FALHOU: diz que o acesso continua e manda revogar à mão", () => {
    const a = avisoDeAcesso(
      acesso({
        revoked: false,
        reason: "revoke_failed",
        detail: "A Stripe não cancelou a assinatura.",
      }),
    )!;
    expect(a.mensagem).toContain("NÃO FOI REMOVIDO");
    expect(a.mensagem).toContain("à mão");
    // O rastro DURÁVEL é o histórico; o toast some. A frase aponta para ele.
    expect(a.mensagem).toContain("Sem confirmação");
    expect(a.mensagem).toContain("A Stripe não cancelou a assinatura.");
    expect(a.exigeAcaoManual).toBe(true);
  });

  it("motivo DESCONHECIDO não derruba: cai no ramo genérico e continua verdadeiro", () => {
    // Regra do projeto: mapa indexado por valor do servidor nunca é acesso
    // direto. Um motivo novo no backend não pode quebrar o bundle em execução.
    const a = avisoDeAcesso(
      acesso({ revoked: false, reason: "motivo_que_ainda_nao_existe" }),
    )!;
    expect(a.mensagem).toContain("NÃO FOI REMOVIDO");
    expect(a.exigeAcaoManual).toBe(true);
  });
});

describe("toastDeDevolucao", () => {
  it("sempre começa afirmando que a devolução aconteceu", () => {
    // Nenhuma falha posterior pode sugerir o contrário: o admin tentaria de
    // novo, e a segunda tentativa cairia numa Idempotency-Key diferente,
    // devolvendo o dinheiro DE NOVO.
    const t = toastDeDevolucao({
      acaoFeita: "Reembolso emitido.",
      acesso: acesso({ revoked: false, reason: "revoke_failed" }),
      extratoSincronizado: false,
    });
    expect(t.mensagem.startsWith("Reembolso emitido.")).toBe(true);
    expect(t.mensagem).not.toContain("Nada foi devolvido");
  });

  it("revogação falhando vira toast de ERRO, não de sucesso", () => {
    // O de sucesso desaparece sozinho, e um estado meio-feito não pode depender
    // de quem estava olhando na hora.
    const t = toastDeDevolucao({
      acaoFeita: "Reembolso emitido.",
      acesso: acesso({ revoked: false, reason: "revoke_failed" }),
      extratoSincronizado: true,
    });
    expect(t.erro).toBe(true);
  });

  it("caminho feliz é toast normal", () => {
    const t = toastDeDevolucao({
      acaoFeita: "Reembolso emitido.",
      acesso: acesso(),
      extratoSincronizado: true,
    });
    expect(t.erro).toBe(false);
    expect(t.mensagem).toContain("Acesso Pro removido na hora.");
  });

  it("extrato dessincronizado é avisado SEM virar erro", () => {
    const t = toastDeDevolucao({
      acaoFeita: "Reembolso emitido.",
      acesso: acesso(),
      extratoSincronizado: false,
    });
    expect(t.erro).toBe(false);
    expect(t.mensagem).toContain("extrato pode levar alguns minutos");
  });

  it("as duas pendências aparecem juntas, nenhuma engole a outra", () => {
    const t = toastDeDevolucao({
      acaoFeita: "Devolução registrada.",
      acesso: acesso({ revoked: false, reason: "revoke_failed" }),
      extratoSincronizado: false,
    });
    expect(t.mensagem).toContain("Devolução registrada.");
    expect(t.mensagem).toContain("NÃO FOI REMOVIDO");
    expect(t.mensagem).toContain("extrato pode levar alguns minutos");
    expect(t.erro).toBe(true);
  });
});

describe("ehRecuperacaoDeEstadoMeioFeito", () => {
  function item(over: Partial<TransactionItem> = {}): TransactionItem {
    return {
      id: "ft1",
      type: "charge",
      gross_cents: 14874,
      fee_cents: 0,
      net_cents: 14874,
      currency: "BRL",
      occurred_at: "2026-07-01T12:00:00Z",
      stripe_charge_id: "ch_1",
      stripe_invoice_id: null,
      plan_code: "pro_annual",
      refunded_cents: 0,
      disputed_cents: 0,
      disputed: false,
      refund_state: "none",
      refundable_cents: 14874,
      ...over,
    };
  }

  function payload(
    over: Partial<TransactionsPayload> = {},
  ): TransactionsPayload {
    return {
      items: [item()],
      total_paid_cents: 14874,
      truncated: false,
      limit: 200,
      ...over,
    };
  }

  it("tudo devolvido e nada restou: é recuperação", () => {
    expect(
      ehRecuperacaoDeEstadoMeioFeito(
        payload({
          items: [item({ refunded_cents: 14874, refundable_cents: 0 })],
          total_paid_cents: 0,
        }),
      ),
    ).toBe(true);
  });

  it("nada devolvido: é o USO NORMAL da ação, não anomalia", () => {
    // Este é o caso que não pode ganhar destaque: sinalizar o uso normal como
    // anomalia treina o admin a ignorar o aviso quando ele importa.
    expect(ehRecuperacaoDeEstadoMeioFeito(payload())).toBe(false);
  });

  it("devolução PARCIAL não é recuperação: o acesso mantido é a regra funcionando", () => {
    expect(
      ehRecuperacaoDeEstadoMeioFeito(
        payload({
          items: [item({ refunded_cents: 5000, refundable_cents: 9874 })],
          total_paid_cents: 9874,
        }),
      ),
    ).toBe(false);
  });

  it("usuário SEM transação nenhuma não vira recuperação por somar zero", () => {
    // A trava da segunda condição: sem exigir que tenha havido devolução, todo
    // total zero cairia no destaque.
    expect(
      ehRecuperacaoDeEstadoMeioFeito(
        payload({ items: [], total_paid_cents: 0 }),
      ),
    ).toBe(false);
  });

  it("chargeback sozinho não conta como devolução", () => {
    // Chargeback não é reembolso voluntário, e `refunded_cents` não o inclui
    // (decisão de server/lib/userTransactions.ts). O total zera, mas ninguém
    // devolveu nada por decisão nossa.
    expect(
      ehRecuperacaoDeEstadoMeioFeito(
        payload({
          items: [
            item({
              disputed_cents: 14874,
              disputed: true,
              refundable_cents: 0,
            }),
          ],
          total_paid_cents: 0,
        }),
      ),
    ).toBe(false);
  });

  it("payload ausente ou de shape inesperado não derruba nem afirma", () => {
    // Janela de deploy: a Vercel sobe antes do Railway.
    expect(ehRecuperacaoDeEstadoMeioFeito(null)).toBe(false);
    expect(ehRecuperacaoDeEstadoMeioFeito(undefined)).toBe(false);
    expect(
      ehRecuperacaoDeEstadoMeioFeito({
        items: undefined,
      } as unknown as TransactionsPayload),
    ).toBe(false);
  });
});
