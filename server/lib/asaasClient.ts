import { env } from "./env";
import { createError } from "../middleware/error";

/**
 * Cliente HTTP do Asaas. Fino de proposito: o SDK oficial nao e usado porque
 * sao tres endpoints, e uma dependencia a mais no caminho do dinheiro custa mais
 * do que resolve.
 *
 * TETO POR REQUISICAO. `fetch` nativo nao tem timeout, e sem ele uma trava do
 * lado do Asaas segura o handler indefinidamente. Mesmo motivo e mesmo valor do
 * `supabaseAdmin` (server/lib/supabaseAdmin.ts).
 */
const ASAAS_FETCH_TIMEOUT_MS = 15_000;

/** Erro do Asaas ja traduzido, com o corpo preservado para diagnostico. */
export type AsaasErro = {
  status: number;
  /** Codigo do primeiro erro do corpo, quando o Asaas manda um. */
  code: string | null;
  message: string;
};

function mensagemDeErro(corpo: unknown, status: number): AsaasErro {
  // O Asaas devolve { errors: [{ code, description }] } nos 4xx. Ler o primeiro
  // e o suficiente para o log; o corpo inteiro vai para o `cause`.
  if (corpo && typeof corpo === "object" && "errors" in corpo) {
    const errors = (corpo as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const primeiro = errors[0] as { code?: unknown; description?: unknown };
      return {
        status,
        code: typeof primeiro.code === "string" ? primeiro.code : null,
        message:
          typeof primeiro.description === "string"
            ? primeiro.description
            : `HTTP ${status}`,
      };
    }
  }
  return { status, code: null, message: `HTTP ${status}` };
}

/**
 * Requisicao autenticada ao Asaas.
 *
 * FAIL-CLOSED: sem configuracao completa, lanca ANTES de qualquer rede. O guard
 * repete a checagem que a rota ja faz de proposito, pelo mesmo motivo que
 * `logAiUsage` guarda por dentro: guarda escrita so no chamador some no primeiro
 * chamador que alguem esquecer de escrever.
 */
export async function asaasFetch<T>(
  caminho: string,
  init: { method: string; body?: unknown } = { method: "GET" },
): Promise<T> {
  if (!env.asaasEnabled) {
    throw createError(
      503,
      "asaas_disabled",
      "Pagamento por Pix indisponível no momento.",
    );
  }

  const url = `${env.asaasApiUrl.replace(/\/+$/, "")}${caminho}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: init.method,
      headers: {
        // Header de autenticacao do Asaas. NUNCA logado, em lugar nenhum.
        access_token: env.asaasApiKey,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(ASAAS_FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    // Rede, DNS ou timeout: nao ha resposta para interpretar. Distinguir isto de
    // um 4xx importa, porque falha de transporte pode ter criado a cobranca do
    // outro lado sem devolver o id.
    throw createError(502, "asaas_unreachable", "Falha ao falar com o Asaas.", {
      cause: err,
    });
  }

  const texto = await resposta.text();
  let corpo: unknown = null;
  if (texto) {
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = null;
    }
  }

  if (!resposta.ok) {
    const erro = mensagemDeErro(corpo, resposta.status);
    throw createError(
      502,
      "asaas_error",
      "O provedor de pagamento recusou a operação.",
      { cause: erro, context: { asaas_status: erro.status, asaas_code: erro.code } },
    );
  }

  return corpo as T;
}
