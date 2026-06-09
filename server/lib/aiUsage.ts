import { env } from "./env";
import { DEFAULT_MODEL } from "./openai";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Rate limit e log de uso de IA, compartilhados entre as rotas que chamam
 * a OpenAI (server/routes/ai.ts e server/routes/github.ts). Extraido sem
 * mudar a logica: mesma RPC, mesmos limites, mesmo fail-open, mesmos campos.
 */

export interface AiDailyLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

/**
 * Consulta o uso de IA do dia via RPC get_ai_usage_today e compara com o
 * limite (Pro ou Free). Fail-open: se a RPC retornar erro/null ou lancar,
 * libera a chamada (allowed true). O console.warn so acontece quando a RPC
 * lanca, igual ao comportamento original.
 */
export async function checkAiDailyLimit(
  userId: string,
  isPro: boolean,
  logScope = "[ai]",
): Promise<AiDailyLimitResult> {
  const limit = isPro ? env.aiDailyLimitPro : env.aiDailyLimitFree;
  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc("get_ai_usage_today", {
      p_user_id: userId,
    });

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    return { allowed: true, count: 0, limit };
  } catch {
    console.warn(`${logScope} Falha ao verificar rate limit para`, userId);
    return { allowed: true, count: 0, limit };
  }
}

export interface LogAiUsageParams {
  userId: string;
  tool: string;
  requestId: string;
  status: string;
  errorMessage?: string;
  inputChars?: number;
  outputChars?: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  costEstimate?: number;
}

/**
 * Insere uma linha em ai_usage_logs com os mesmos campos de sempre.
 * Nao lanca: falha de log so vira console.warn.
 */
export async function logAiUsage(params: LogAiUsageParams) {
  try {
    await supabaseAdmin.from("ai_usage_logs").insert({
      user_id: params.userId,
      tool: params.tool,
      request_id: params.requestId,
      status: params.status,
      error_message: params.errorMessage || null,
      input_chars: params.inputChars || 0,
      output_chars: params.outputChars || 0,
      input_tokens: params.inputTokens || 0,
      output_tokens: params.outputTokens || 0,
      model: params.model || DEFAULT_MODEL,
      cost_estimate: params.costEstimate || 0,
    });
  } catch (err) {
    console.warn("[ai] Falha ao registrar uso:", err);
  }
}
