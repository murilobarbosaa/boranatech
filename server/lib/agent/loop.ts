import { fetchWithTimeout, isUpstreamTimeoutError } from "../http";
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
  // Usado pelo evento "conversation": comunica ao cliente em qual conversa do
  // historico (Pro) esta mensagem esta sendo salva. Ausente nos demais eventos.
  conversationId?: string;
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
  // Texto de snapshot do usuario JA resolvido pelo endpoint (contexto de
  // servidor). O loop NAO chama buildUserSnapshot nem conhece userId/Supabase:
  // recebe o texto pronto. So presente para Pro; ausente/vazio para free.
  userSnapshot?: string;
  // Bloco de fatos canonicos da plataforma (precos, limites, certificados,
  // suporte), JA montado pelo endpoint (buildPlatformFacts). Contexto factual
  // publico, igual para os dois tiers; ausente se a montagem falhou.
  platformFacts?: string;
}

export interface RunAgentResult {
  outputChars: number;
  inputTokens: number;
  outputTokens: number;
  // Texto final do assistente, identico ao que foi emitido em tokens (acumulado
  // ao longo das iteracoes). Usado para persistir a mensagem do assistente no
  // historico (so Pro); o streaming em si nao muda.
  assistantText: string;
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
    // headerTimeoutMs cobre a trava de connect; depois do primeiro byte o SSE
    // segue por design.
    response = await fetchWithTimeout(
      OPENAI_BASE_URL,
      {
        method: "POST",
        headers: buildOpenAIHeaders(apiKey),
        body: JSON.stringify(body),
      },
      { service: "openai-agent", headerTimeoutMs: 20_000 },
    );
  } catch (err) {
    console.error("[agent] OpenAI fetch error:", err);
    throw new AgentUpstreamError(
      isUpstreamTimeoutError(err) ? "timeout" : "network",
    );
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
// A nota tem duas versoes por tier: a FREE proibe assumir dados pessoais; a PRO
// nao pode repetir essa proibicao, senao ela mina o PRO_SYSTEM_PROMPT (que vem
// antes) e suprime o uso do snapshot e das tools de dados. Fail-closed igual ao
// endpoint: qualquer valor diferente de true recebe a versao FREE.
function buildRouteContextMessage(
  currentRoute: string | undefined,
  isPro: boolean,
): string | null {
  if (!currentRoute || !SAFE_ROUTE_RE.test(currentRoute)) {
    return null;
  }
  if (isPro === true) {
    // TODO(Ana): revisar esta copy de contexto de navegacao (Pro).
    return `Contexto de navegacao: o usuario esta atualmente na pagina ${currentRoute} do BoraNaTech. Use isso apenas como contexto de navegacao. Os dados pessoais do usuario disponiveis sao os do resumo de contexto e das ferramentas, conforme suas instrucoes principais.`;
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

  const routeNote = buildRouteContextMessage(ctx.currentRoute, ctx.isPro);
  const conversation: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    // Mensagem de contexto logo apos o system prompt principal, quando a rota e
    // valida. So ajuda de UX; nunca altera tier nem acesso (ver comentario acima).
    ...(routeNote ? [{ role: "system" as const, content: routeNote }] : []),
    // Fatos canonicos da plataforma (publicos, os dois tiers), montados pelo
    // endpoint ANTES do loop. Depois da nota de rota e antes do snapshot Pro.
    ...(params.platformFacts && params.platformFacts.length > 0
      ? [{ role: "system" as const, content: params.platformFacts }]
      : []),
    // Snapshot do usuario, montado pelo servidor ANTES do loop. Contexto factual
    // de servidor (nao vem do cliente) e NUNCA entrada de autorizacao. So entra
    // quando o endpoint o passou (apenas para Pro) e nao esta vazio.
    ...(params.userSnapshot && params.userSnapshot.length > 0
      ? [{ role: "system" as const, content: params.userSnapshot }]
      : []),
    ...params.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // DIAG: ligado so com AGENT_DIAG=1 (desligado em producao). So contagens e
  // booleanos, nunca conteudo de mensagem ou snapshot.
  if (process.env.AGENT_DIAG === "1") {
    console.log(
      "[agent/diag] system messages:",
      conversation.filter((m) => m.role === "system").length,
      "snapshot incluido?",
      Boolean(params.userSnapshot && params.userSnapshot.length > 0),
      "tamanho:",
      params.userSnapshot?.length ?? 0,
    );
  }

  let outputChars = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  // Acumula o texto emitido (igual ao que vira tokens para o cliente), para
  // persistir a resposta do assistente. Nao altera o streaming.
  let assistantText = "";

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const body = await fetchOpenAIStream(conversation, tools, apiKey);
    const turn = await consumeStream(body, emit);

    outputChars += turn.content.length;
    assistantText += turn.content;
    if (turn.inputTokens > 0) inputTokens = turn.inputTokens;
    outputTokens += turn.outputTokens;

    if (turn.toolCalls.length === 0) {
      // Mensagem final, sem tool calls. Fim do loop.
      return { outputChars, inputTokens, outputTokens, assistantText };
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
  return { outputChars, inputTokens, outputTokens, assistantText };
}
