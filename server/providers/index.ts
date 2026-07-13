// Seletor do provider de pagamento por env (PAYMENT_PROVIDER). Escolhe a
// implementacao dos fluxos de saida (checkout/cancel/reactivate) sem que as
// rotas mudem. Os webhooks NAO passam por aqui: cada provider tem rota fixa
// (POST /webhook para Asaas, POST /webhook/stripe para Stripe).

import { env } from "../lib/env";
import { asaasProvider } from "./asaas";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  switch (env.paymentProvider) {
    case "stripe":
      return stripeProvider;
    case "asaas":
    default:
      return asaasProvider;
  }
}

export { asaasProvider, stripeProvider };
