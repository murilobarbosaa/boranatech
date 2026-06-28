import {
  buildOpenAIHeaders,
  DEFAULT_MODEL,
  OPENAI_BASE_URL,
} from "../openai";
import type { AgentContext, AgentTool } from "./types";

// Temperatura do agente. Ajustavel. // TODO: calibrar.
const AGENT_TEMPERATURE = 0.4;
// Teto de iteracoes do loop tool-call para evitar loop infinito. Ajustavel.
const MAX_ITERATIONS = 5;

// Erro de upstream da OpenAI. Tratado pelo endpoint do mesmo jeito que o ai.ts
// faz no modo stream: escreve um frame de erro e loga via aiUsage.
export class AgentUpstreamError extends Error {
  detail: string;
  constructor(detail: string) {
    super("agent_upstream_error");
    this.name = "AgentUpstreamError";
    this.detail = detail;
  }
}

// Eventos de status emitidos ao cliente (ex.: "buscando"). Separado de token e
// error para o frontend poder mostrar um indicador de progresso.
export interface AgentStatusEvent {
  event: string;
  tool?: string;
}

export interface AgentStreamEmitter {
  token(value: string): void;
  status(status: AgentStatusEvent): void;
  error(message: string): void;
}

export interface RunAgentParams {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  tools: AgentTool[];
  systemPrompt: string;
  ctx: AgentContext;
  apiKey: string;
  emit: AgentStreamEmitter;
}

export interface RunAgentResult {
  outputChars: number;
  inputTokens: number;
  outputTokens: number;
}

interface AssistantToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: AssistantToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface OpenAIToolCallDelta {
  index: number;
  id?: string;
  function?: { name?: string; arguments?: string };
}

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: { content?: string; tool_calls?: OpenAIToolCallDelta[] };
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

interface ConsumedTurn {
  content: string;
  toolCalls: Array<{ id: string; name: string; args: string }>;
  inputTokens: number;
  outputTokens: number;
}

async function fetchOpenAIStream(
  messages: ChatMessage[],
  tools: AgentTool[],
  apiKey: string,
): Promise<ReadableStream<Uint8Array>> {
  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    temperature: AGENT_TEMPERATURE,
    messages,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (tools.length > 0) {
    body.tools = tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
    body.tool_choice = "auto";
  }

  let response: globalThis.Response;
  try {
    response = await fetch(OPENAI_BASE_URL, {
      method: "POST",
      headers: buildOpenAIHeaders(apiKey),
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[agent] OpenAI fetch error:", err);
    throw new AgentUpstreamError("network");
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    console.error("[agent] OpenAI error:", response.status, text);
    throw new AgentUpstreamError(`status_${response.status}`);
  }

  return response.body;
}

// Le um turno do stream da OpenAI. Emite os deltas de conteudo como tokens em
// tempo real e acumula os deltas de tool_calls (que chegam fragmentados por
// index). Tambem captura a contagem de tokens do include_usage.
async function consumeStream(
  body: ReadableStream<Uint8Array>,
  emit: AgentStreamEmitter,
): Promise<ConsumedTurn> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let content = "";
  const toolAcc = new Map<number, { id: string; name: string; args: string }>();
  let inputTokens = 0;
  let outputTokens = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const events = pending.split("\n\n");
    pending = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;
        let parsed: OpenAIStreamChunk;
        try {
          parsed = JSON.parse(payload) as OpenAIStreamChunk;
        } catch {
          continue;
        }
        const choice = parsed.choices?.[0];
        const contentDelta = choice?.delta?.content;
        if (typeof contentDelta === "string" && contentDelta.length > 0) {
          content += contentDelta;
          emit.token(contentDelta);
        }
        const toolDeltas = choice?.delta?.tool_calls;
        if (toolDeltas) {
          for (const tcDelta of toolDeltas) {
            const slot = toolAcc.get(tcDelta.index) ?? { id: "", name: "", args: "" };
            if (tcDelta.id) slot.id = tcDelta.id;
            if (tcDelta.function?.name) slot.name = tcDelta.function.name;
            if (tcDelta.function?.arguments) slot.args += tcDelta.function.arguments;
            toolAcc.set(tcDelta.index, slot);
          }
        }
        if (parsed.usage) {
          inputTokens = parsed.usage.prompt_tokens ?? inputTokens;
          outputTokens = parsed.usage.completion_tokens ?? outputTokens;
        }
      }
    }
  }

  const toolCalls = Array.from(toolAcc.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, slot]) => slot)
    .filter((slot) => slot.name.length > 0 && slot.id.length > 0);

  return { content, toolCalls, inputTokens, outputTokens };
}

// currentRoute vem do cliente, entao e NAO confiavel. So vira contexto se casar
// esta regex estrita: comeca com barra, apenas caracteres de caminho, sem espaco
// e sem quebra de linha, no maximo 64 chars. Essa restricao torna injecao de
// prompt por esse campo inviavel.
const SAFE_ROUTE_RE = /^\/[A-Za-z0-9/_-]{0,63}$/;

// Monta a mensagem de contexto de rota, ou null se a rota for invalida.
// IMPORTANTE: currentRoute e DICA DE UX, NUNCA entrada de autorizacao. Nenhuma
// decisao de acesso ou tier pode depender dele (o tier vem so do req.isPro; as
// tools usam ctx.userId do JWT). Aqui ele so vira um texto factual de navegacao.
function buildRouteContextMessage(currentRoute?: string): string | null {
  if (!currentRoute || !SAFE_ROUTE_RE.test(currentRoute)) {
    return null;
  }
  // TODO(Ana): revisar esta copy de contexto de navegacao.
  return `Contexto de navegacao: o usuario esta atualmente na pagina ${currentRoute} do BoraNaTech. Voce pode usar isso para ajudar na navegacao, mas nao assuma mais nada sobre o usuario nem afirme acessar dados pessoais dele.`;
}

// Loop principal do agente: chama a OpenAI em modo stream com a toolset do tier.
// Acumula conteudo (emitido como tokens) e tool_calls; quando o modelo pede
// tools, emite status, executa cada uma pelo registry com o AgentContext, anexa
// os resultados como mensagens role "tool" e continua ate uma mensagem final sem
// tool calls ou ate o teto de iteracoes.
export async function runAgentLoop(
  params: RunAgentParams,
): Promise<RunAgentResult> {
  const { tools, systemPrompt, ctx, apiKey, emit } = params;

  const routeNote = buildRouteContextMessage(ctx.currentRoute);
  const conversation: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    // Mensagem de contexto logo apos o system prompt principal, quando a rota e
    // valida. So ajuda de UX; nunca altera tier nem acesso (ver comentario acima).
    ...(routeNote ? [{ role: "system" as const, content: routeNote }] : []),
    ...params.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let outputChars = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const body = await fetchOpenAIStream(conversation, tools, apiKey);
    const turn = await consumeStream(body, emit);

    outputChars += turn.content.length;
    if (turn.inputTokens > 0) inputTokens = turn.inputTokens;
    outputTokens += turn.outputTokens;

    if (turn.toolCalls.length === 0) {
      // Mensagem final, sem tool calls. Fim do loop.
      return { outputChars, inputTokens, outputTokens };
    }

    conversation.push({
      role: "assistant",
      content: turn.content.length > 0 ? turn.content : null,
      tool_calls: turn.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.args },
      })),
    });

    for (const tc of turn.toolCalls) {
      emit.status({ event: "tool_start", tool: tc.name });
      const tool = tools.find((t) => t.name === tc.name);
      let result: string;

      if (!tool) {
        // Defesa: modelo pediu uma tool fora da toolset do tier. Nao executa.
        result = JSON.stringify({
          ok: false,
          message: "Ferramenta indisponivel para este usuario.",
        });
      } else {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = tc.args
            ? (JSON.parse(tc.args) as Record<string, unknown>)
            : {};
        } catch {
          parsedArgs = {};
        }
        try {
          result = await tool.execute(parsedArgs, ctx);
        } catch (err) {
          console.warn("[agent] tool execution failed:", tc.name, err);
          // Falha de execucao de tool. O modelo NAO pode inventar resultado.
          // TODO(Ana): texto de falha de tool exposto via resposta do modelo.
          result = JSON.stringify({
            ok: false,
            message:
              "A execucao da ferramenta falhou. Nao invente resultado; avise que houve falha e sugira tentar de novo.",
          });
        }
      }

      emit.status({ event: "tool_end", tool: tc.name });
      conversation.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  // Estourou o teto de iteracoes sem mensagem final.
  // TODO(Ana): texto de teto de iteracoes exposto ao usuario.
  emit.error("Nao consegui concluir agora. Tente reformular sua pergunta.");
  return { outputChars, inputTokens, outputTokens };
}
