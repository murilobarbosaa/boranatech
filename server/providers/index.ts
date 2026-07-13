// Seletor do provider de pagamento por env (PAYMENT_PROVIDER). Escolhe a
// implementacao dos fluxos de saida (checkout/cancel/reactivate) sem que as
// rotas mudem. Os webhooks NAO passam por aqui: cada provider tem rota fixa
// (POST /webhook para Asaas, POST /webhook/stripe para Stripe).

import { env } from "../lib/env";
import { asaasProvider } from "./asaas";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  switch (env.paymentProvider) {
    case "asaas":
      return asaasProvider;
    // case "stripe": entra na Fase 4 quando providers/stripe.ts existir.
    default:
      // Valor nao suportado ainda (ex.: "stripe" antes da Fase 4): cai no
      // provider padrao para nao quebrar o boot nem os fluxos existentes.
      return asaasProvider;
  }
}

export { asaasProvider };
