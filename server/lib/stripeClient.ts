import Stripe from "stripe";

import { env } from "./env";
import { createError } from "../middleware/error";

// apiVersion fixada explicitamente (a mesma pinada pelo SDK). Fixar evita que um
// upgrade do SDK mude o shape dos objetos sob os pes do codigo.
export const STRIPE_API_VERSION = "2026-06-24.dahlia";

// Client lazy COMPARTILHADO (provider de pagamento e sync financeiro). Instanciar
// com chave vazia lanca, entao so cria quando ha chamada real e a chave existe.
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    if (!env.stripeSecretKey) {
      throw createError(
        500,
        "config_error",
        "STRIPE_SECRET_KEY não configurada.",
      );
    }
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }
  return stripeClient;
}
