import { supabaseAdmin } from "../lib/supabaseAdmin";

// Regra de "primeira compra" compartilhada entre os providers: o usuario nao tem
// nenhuma subscription que ja tenha sido ativada (current_period_start
// preenchido). Fonte unica para o desconto de afiliado nao divergir entre Asaas
// e Stripe (o desconto de cupom so vale na primeira compra).
export async function isFirstPurchase(userId: string): Promise<boolean> {
  const { data: priorActivated } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .not("current_period_start", "is", null)
    .limit(1)
    .maybeSingle();
  return !priorActivated;
}
