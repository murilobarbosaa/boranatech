import { describe, expect, it, vi } from "vitest";

import { lerSessaoDeBoleto, estadoDeBoleto } from "./boletoSession";

/**
 * Estado do boleto pendente, lido da Checkout Session.
 *
 * Um caminho só: o cron `expire-pending-boletos` e o detalhe do admin fazem a
 * MESMA leitura. Dois caminhos divergiriam na primeira mudança, e eles decidem
 * sobre a mesma coisa (o cron decide se mata a linha, a tela decide o que
 * mostrar).
 *
 * A leitura NUNCA derruba quem chama. Falha de rede vira estado
 * 'indisponivel', e cabe a cada chamador decidir: o cron mantém a linha viva
 * (fail-safe, não cancela na dúvida), a tela mostra o que tem no banco e avisa
 * que não pôde verificar.
 */

function sessaoFalsa(over: Record<string, unknown> = {}) {
  return {
    id: "cs_1",
    payment_status: "unpaid",
    amount_total: 15540,
    currency: "brl",
    payment_intent: {
      id: "pi_1",
      next_action: {
        boleto_display_details: { expires_at: 1785000000 },
      },
    },
    ...over,
  };
}

describe("estadoDeBoleto: normalização pura", () => {
  it("extrai valor, payment_status e vencimento do boleto", () => {
    const e = estadoDeBoleto(sessaoFalsa());
    expect(e).toMatchObject({
      estado: "ok",
      payment_status: "unpaid",
      amount_cents: 15540,
      pago: false,
    });
    expect(e.estado === "ok" && e.expires_at).toBe(
      new Date(1785000000 * 1000).toISOString(),
    );
  });

  it("payment_status paid marca pago", () => {
    const e = estadoDeBoleto(sessaoFalsa({ payment_status: "paid" }));
    expect(e.estado === "ok" && e.pago).toBe(true);
  });

  it("sem next_action o vencimento é null, e o resto continua vindo", () => {
    // Boleto já pago perde o next_action. Não é erro: é o estado normal depois
    // da compensação, e o valor e o payment_status continuam úteis.
    const e = estadoDeBoleto(
      sessaoFalsa({ payment_status: "paid", payment_intent: { id: "pi_1" } }),
    );
    expect(e).toMatchObject({ estado: "ok", pago: true, expires_at: null });
  });

  it("payment_intent como string (não expandido) não quebra", () => {
    const e = estadoDeBoleto(sessaoFalsa({ payment_intent: "pi_1" }));
    expect(e).toMatchObject({ estado: "ok", expires_at: null });
  });

  it("sessão nula vira indisponível, não exceção", () => {
    expect(estadoDeBoleto(null).estado).toBe("indisponivel");
  });
});

describe("lerSessaoDeBoleto: a leitura em si", () => {
  it("expande o payment_intent: sem isso não há vencimento", () => {
    const retrieve = vi.fn().mockResolvedValue(sessaoFalsa());
    return lerSessaoDeBoleto("cs_1", {
      checkout: { sessions: { retrieve } },
    } as never).then(() => {
      expect(retrieve).toHaveBeenCalledWith("cs_1", {
        expand: ["payment_intent"],
      });
    });
  });

  it("falha da Stripe vira estado indisponível, nunca exceção", async () => {
    const e = await lerSessaoDeBoleto("cs_1", {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockRejectedValue(new Error("rede caiu")),
        },
      },
    } as never);
    expect(e.estado).toBe("indisponivel");
    expect(e.estado === "indisponivel" && e.motivo).toContain("rede caiu");
  });

  it("id vazio não chega a chamar a Stripe", async () => {
    const retrieve = vi.fn();
    const e = await lerSessaoDeBoleto("", {
      checkout: { sessions: { retrieve } },
    } as never);
    expect(retrieve).not.toHaveBeenCalled();
    expect(e.estado).toBe("indisponivel");
  });
});
