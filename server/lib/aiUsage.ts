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
  // true quando NAO foi possivel verificar o uso (RPC com erro/null ou excecao).
  // Distingue "falha de verificacao" (503) de "limite real atingido" (429).
  verificationFailed?: boolean;
}

/**
 * Consulta o uso de IA do dia via RPC get_ai_usage_today e compara com o
 * limite (Pro ou Free). Fail-closed: se a RPC retornar erro/null ou lancar,
 * NAO libera a chamada e marca verificationFailed para o caller responder 503
 * (falha de verificacao), distinto do 429 de limite real atingido.
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

    console.warn(`${logScope} RPC de rate limit retornou erro/null para`, userId);
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    console.warn(`${logScope} Falha ao verificar rate limit para`, userId);
    return { allowed: false, count: 0, limit, verificationFailed: true };
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
