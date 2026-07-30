import type Stripe from "stripe";

import { getStripe } from "./stripeClient";

/**
 * Estado de um boleto pendente, lido da Checkout Session.
 *
 * UM CAMINHO SO. O cron `expire-pending-boletos` (server/routes/cron.ts) e o
 * detalhe do admin (GET /users/:id) fazem a MESMA leitura, por aqui. Dois
 * caminhos divergiriam na primeira mudanca, e os dois decidem sobre a mesma
 * coisa: o cron decide se mata a linha, a tela decide o que mostrar. Se um
 * passasse a expandir o payment_intent e o outro nao, a tela mostraria
 * vencimento e o cron continuaria cego.
 *
 * A leitura NUNCA lanca. Falha de rede, chave errada ou sessao inexistente
 * viram `indisponivel`, e cada chamador decide o que fazer com a incerteza:
 * o cron mantem a linha VIVA (nao cancela na duvida), a tela mostra o que tem
 * no banco e avisa que nao pode verificar. Colapsar incerteza em "nao pago"
 * mataria boleto bom; colapsar em erro derrubaria o modal inteiro por causa de
 * um bloco informativo.
 */

export type EstadoDeBoleto =
  | {
      estado: "ok";
      payment_status: string | null;
      amount_cents: number | null;
      currency: string | null;
      /** Vencimento do BOLETO (nao da sessao), ISO. Null quando ja compensou. */
      expires_at: string | null;
      pago: boolean;
    }
  | { estado: "indisponivel"; motivo: string };

type SessaoParcial = {
  payment_status?: unknown;
  amount_total?: unknown;
  currency?: unknown;
  payment_intent?: unknown;
} | null;

/**
 * Onde mora o vencimento do boleto.
 *
 * NAO e `session.expires_at`: aquele e o prazo para COMPLETAR o checkout (24h),
 * e ele ja passou em toda sessao que gerou boleto, porque o checkout foi
 * completado. Medido em producao: a unica linha pending tem a sessao com
 * expires_at vencido desde ontem e o boleto vencendo depois de amanha. Usar o
 * campo errado mostraria "vencido" para um boleto vivo.
 *
 * O prazo real e `payment_intent.next_action.boleto_display_details.expires_at`,
 * e por isso a leitura precisa expandir o payment_intent.
 */
function vencimentoDoBoleto(paymentIntent: unknown): string | null {
  if (!paymentIntent || typeof paymentIntent !== "object") return null;
  const nextAction = (paymentIntent as { next_action?: unknown }).next_action;
  if (!nextAction || typeof nextAction !== "object") return null;
  const detalhes = (nextAction as { boleto_display_details?: unknown })
    .boleto_display_details;
  if (!detalhes || typeof detalhes !== "object") return null;
  const expires = (detalhes as { expires_at?: unknown }).expires_at;
  if (typeof expires !== "number" || !Number.isFinite(expires)) return null;
  return new Date(expires * 1000).toISOString();
}

/** Normalizacao pura, sem rede. Separada para poder ser testada sozinha. */
export function estadoDeBoleto(sessao: SessaoParcial): EstadoDeBoleto {
  if (!sessao || typeof sessao !== "object") {
    return { estado: "indisponivel", motivo: "Sessão não encontrada." };
  }
  const paymentStatus =
    typeof sessao.payment_status === "string" ? sessao.payment_status : null;
  return {
    estado: "ok",
    payment_status: paymentStatus,
    amount_cents:
      typeof sessao.amount_total === "number" ? sessao.amount_total : null,
    currency: typeof sessao.currency === "string" ? sessao.currency : null,
    expires_at: vencimentoDoBoleto(sessao.payment_intent),
    pago: paymentStatus === "paid",
  };
}

/**
 * Le a sessao na Stripe e normaliza. `stripe` e injetavel para teste; em
 * producao usa o cliente do projeto.
 */
export async function lerSessaoDeBoleto(
  sessionId: string | null | undefined,
  stripe?: Stripe,
): Promise<EstadoDeBoleto> {
  if (!sessionId) {
    return { estado: "indisponivel", motivo: "Assinatura sem sessão." };
  }
  try {
    const cliente = stripe ?? getStripe();
    const sessao = await cliente.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    return estadoDeBoleto(sessao as SessaoParcial);
  } catch (err) {
    return {
      estado: "indisponivel",
      motivo:
        err instanceof Error ? err.message : "Erro ao consultar a Stripe.",
    };
  }
}
