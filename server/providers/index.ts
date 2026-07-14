// Provider de pagamento unico: Stripe. Nao ha seletor por env; o webhook tem
// rota fixa (POST /webhook/stripe em billing.ts).

export { stripeProvider } from "./stripe";
