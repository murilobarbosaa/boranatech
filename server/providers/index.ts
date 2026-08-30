// Provedores de pagamento. NAO ha seletor por env nem despacho dinamico: cada
// fluxo nomeia o provedor que usa, e cada webhook tem rota fixa e propria
// (POST /api/billing/webhook/stripe em billing.ts, POST /api/webhooks/asaas em
// webhooksAsaas.ts). Despacho por string viraria um mapa indexado por valor de
// fora, que e a forma de errar que este projeto ja documentou.

export { stripeProvider } from "./stripe";
export { asaasProvider } from "./asaas";
