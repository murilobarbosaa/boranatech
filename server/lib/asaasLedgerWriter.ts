import { createError } from "../middleware/error";
import type { LinhaLedger } from "./asaasLedger";
import { supabaseAdmin } from "./supabaseAdmin";
import { erroEncadeavel } from "./supabaseError";

/**
 * A ESCRITA do ledger do Asaas, separada das funcoes que montam a linha.
 *
 * O motivo da separacao esta no cabecalho de ./asaasLedger.ts: este arquivo
 * importa `supabaseAdmin`, e por tabela o SDK do Supabase, que nao importa
 * limpo em `.mts`. Quem so precisa MONTAR a linha (o backfill) importa de la e
 * nao paga por isto.
 */

/**
 * Grava a linha, uma vez.
 *
 * `ignoreDuplicates` sobre o indice `(provider, provider_transaction_id)`: a
 * fila do Asaas entrega at least once e o backfill roda sobre os mesmos events,
 * entao a segunda passada precisa ser no-op e nao sobrescrita. Sobrescrever
 * seria pior aqui do que no sync da Stripe: la o upsert reescrever `user_id` e o
 * mecanismo que conserta cobranca orfa sozinha, e aqui a linha ja nasce com o
 * dono resolvido pela row de `subscriptions`.
 */
export async function registrarNoLedger(linha: LinhaLedger): Promise<void> {
  const { error } = await supabaseAdmin
    .from("finance_transactions")
    .upsert(linha, {
      onConflict: "provider,provider_transaction_id",
      ignoreDuplicates: true,
    });

  if (error) {
    throw createError(
      500,
      "db_error",
      "Erro ao gravar a transacao do Asaas no ledger.",
      { cause: erroEncadeavel(error) },
    );
  }
}
