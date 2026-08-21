import * as Sentry from "@sentry/node";

import {
  comPrazoDeBanco,
  PrazoDeBancoEstourado,
} from "../../shared/linkedin/prazos";
import { env } from "./env";
import { DEFAULT_MODEL } from "./openai";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Rate limit e log de uso de IA, compartilhados entre as rotas que chamam
 * a OpenAI (server/routes/ai.ts e server/routes/github.ts). Extraido sem
 * mudar a logica: mesma RPC, mesmos limites, mesmos campos. O rate limit e
 * FAIL-CLOSED (erro, null ou excecao na verificacao retornam allowed:false);
 * so o logAiUsage e nao-bloqueante (falha de log vira apenas console.warn).
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
/**
 * MODO DEGRADADO do limite diario.
 *
 * Sem a RPC `reserve_ai_usage_slot`, a verificacao volta a ser ler-depois-
 * escrever e a janela de corrida reabre. A escolha e deliberada: derrubar nove
 * ferramentas de IA porque uma migration nao foi aplicada e pior que a corrida,
 * que custa algumas chamadas a mais para quem dispara requisicoes paralelas.
 *
 * O que NAO pode acontecer e o modo degradado ser silencioso. Antes disto era
 * um `console.warn` no meio do log de producao, num sistema cuja postura
 * declarada para cota e fail-closed. Agora e `console.error` com a causa e um
 * evento de erro no Sentry.
 *
 * Como reconhecer em producao: procure `MODO DEGRADADO` no log, ou o evento
 * `ai-quota-degraded` no Sentry. Ver docs/limites-do-guard-de-migrations.md e
 * a migration 20260727150000_reserve_ai_usage_slot.sql.
 *
 * O aviso e emitido no MAXIMO uma vez a cada 5 minutos por processo. Sem o
 * corte, um sistema degradado gera um evento por requisicao e o alerta vira
 * ruido, que e outra forma de silencio.
 */
const INTERVALO_AVISO_MS = 5 * 60 * 1000;
let ultimoAvisoDegradado = 0;

function avisarModoDegradado(logScope: string, causa: string): void {
  const agora = Date.now();
  if (agora - ultimoAvisoDegradado < INTERVALO_AVISO_MS) return;
  ultimoAvisoDegradado = agora;
  const mensagem = `${logScope} MODO DEGRADADO do limite diario de IA: reserve_ai_usage_slot indisponivel, a cota voltou a ser verificada de forma NAO-ATOMICA e a corrida esta aberta. Causa: ${causa}. Aplique supabase/migrations/20260727150000_reserve_ai_usage_slot.sql.`;
  console.error(mensagem);
  try {
    Sentry.captureMessage(mensagem, {
      level: "error",
      tags: { area: "ai-quota", degraded: "true" },
      fingerprint: ["ai-quota-degraded"],
    });
  } catch {
    // Sentry desligado (DSN ausente) e no-op por desenho; o console.error acima
    // ja garante o rastro.
  }
}

export async function checkAiDailyLimit(
  userId: string,
  isPro: boolean,
  logScope = "[ai]",
  tool = "ai",
  /**
   * PRAZO PROPRIO por round-trip, em ms. Ausente = sem prazo, que e como as
   * outras oito ferramentas de IA chamam esta funcao e continuam chamando: o
   * unico teto delas segue sendo o global de 15s do `supabaseAdmin`.
   *
   * SEMANTICA DE ESTOURO AQUI: fail-closed sem cobranca. Os dois ramos abaixo
   * ja tratam falha de verificacao como `verificationFailed`, e o prazo entra
   * por eles, entao a analise nem comeca e nenhuma chamada de IA e paga. A RPC
   * pode aterrissar depois e criar a linha `reserved`; ela deixa de ocupar vaga
   * em 10 minutos pelo TTL de reserva orfa da propria migration
   * (`20260727150000_reserve_ai_usage_slot.sql`).
   */
  prazoBancoMs?: number,
): Promise<AiDailyLimitResult> {
  const limit = isPro ? env.aiDailyLimitPro : env.aiDailyLimitFree;

  // CAMINHO ATOMICO (reserva). Ver o cabecalho de
  // supabase/migrations/..._reserve_ai_usage_slot.sql.
  //
  // O desenho antigo era ler-depois-escrever: esta funcao contava as linhas do
  // dia e a rota so inseria a linha DEPOIS da chamada da OpenAI. Entre a
  // leitura e a escrita cabe qualquer numero de requisicoes do mesmo usuario, e
  // todas leem o mesmo contador e todas passam. Com limite 5, dez requisicoes
  // paralelas faziam dez chamadas pagas.
  //
  // Agora a contagem e a insercao acontecem na mesma transacao, serializada por
  // advisory lock do usuario, e o que a rota faz depois e CONFIRMAR a linha que
  // ja existe.
  try {
    const { data, error } = await comPrazoDeBanco(
      supabaseAdmin.rpc("reserve_ai_usage_slot", {
        p_user_id: userId,
        p_tool: tool,
        p_limit: limit,
      }),
      "reserva_atomica",
      prazoBancoMs,
    );
    const linha = Array.isArray(data) ? data[0] : data;
    if (!error && linha && typeof linha.allowed === "boolean") {
      return {
        allowed: linha.allowed,
        count: linha.usage_count ?? 0,
        limit,
      };
    }
    avisarModoDegradado(logScope, error?.message ?? "resposta inesperada");
  } catch (err) {
    avisarModoDegradado(
      logScope,
      err instanceof Error ? err.message : String(err),
    );
  }

  try {
    const { data: usageCount, error: usageError } = await comPrazoDeBanco(
      supabaseAdmin.rpc("get_ai_usage_today", {
        p_user_id: userId,
      }),
      "reserva_degradada",
      prazoBancoMs,
    );

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    console.warn(
      `${logScope} RPC de rate limit retornou erro/null para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    // Silencio (b) deliberado: fail-closed, ja logado, e indisponibilidade
    // transitoria da RPC viraria ruido de plantao sem acao possivel.
    console.warn(`${logScope} Falha ao verificar rate limit para`, userId);
    return { allowed: false, count: 0, limit, verificationFailed: true };
  }
}

// Chave de tool com que as mensagens do agente sao logadas em ai_usage_logs.
export const AGENT_CHAT_TOOL = "agent-chat";

/**
 * Rate limit do agente conversacional, separado das ferramentas de IA. O
 * contador existente get_ai_usage_today conta o TOTAL do dia entre TODAS as
 * tools, entao reusa-lo faria o chat consumir a quota das tools Pro e vice-versa.
 * Para dar um teto proprio ao agente sem sobrecarregar aquele contador, esta
 * funcao usa uma RPC dedicada por ferramenta: get_ai_usage_today_by_tool.
 *
 * IMPORTANTE: essa RPC ainda NAO existe no banco. Ela e proposta como migration
 * minima e aplicada manualmente no SQL Editor (regra do projeto), nunca via db
 * push. Enquanto nao aplicada, a RPC retorna erro e esta funcao e fail-closed
 * (verificationFailed -> 503), nunca liberando o acesso. SQL proposto:
 *
 *   create or replace function public.get_ai_usage_today_by_tool(
 *     p_user_id uuid, p_tool text
 *   ) returns integer language sql stable security definer as $$
 *     select count(*)::integer from public.ai_usage_logs
 *     where user_id = p_user_id and tool = p_tool and status = 'success'
 *       and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo');
 *   $$;
 */
export async function checkAgentDailyLimit(
  userId: string,
  isPro: boolean,
  logScope = "[agent]",
): Promise<AiDailyLimitResult> {
  const limit = isPro ? env.agentDailyLimitPro : env.agentDailyLimitFree;
  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc(
      "get_ai_usage_today_by_tool",
      { p_user_id: userId, p_tool: AGENT_CHAT_TOOL },
    );

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    console.warn(
      `${logScope} RPC de rate limit do agente retornou erro/null para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    // Silencio (b) deliberado: fail-closed, ja logado, e indisponibilidade
    // transitoria da RPC viraria ruido de plantao sem acao possivel.
    console.warn(
      `${logScope} Falha ao verificar rate limit do agente para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  }
}

// Chaves de tool com que a entrevista simulada loga em ai_usage_logs. A criacao
// de sessao conta 1 unidade na quota GLOBAL (get_ai_usage_today); os turnos tem
// teto proprio via get_ai_usage_today_by_tool, espelhando o agent-chat, e sao
// excluidos da global pela migration 20260707121000_split_interview_turn_quota.
export const INTERVIEW_SESSION_TOOL = "interview-session";
export const INTERVIEW_TURN_TOOL = "interview-turn";
// Geracoes de fala (TTS) da entrevista: teto proprio via a MESMA RPC generica;
// conta na quota global (sem exclusao; decisao consciente, sem migration).
export const INTERVIEW_TTS_TOOL = "interview-tts";

/**
 * Rate limit dos turnos da entrevista simulada, espelhando checkAgentDailyLimit:
 * mesma RPC generica por tool, mesma janela (dia America/Sao_Paulo via RPC),
 * mesmo fail-closed (erro/null/excecao = allowed:false + verificationFailed).
 * Sem variante free: a feature e Pro-only e o gate barra antes.
 */
export async function checkInterviewTurnDailyLimit(
  userId: string,
  logScope = "[interview]",
): Promise<AiDailyLimitResult> {
  const limit = env.interviewDailyTurnLimitPro;
  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc(
      "get_ai_usage_today_by_tool",
      { p_user_id: userId, p_tool: INTERVIEW_TURN_TOOL },
    );

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    console.warn(
      `${logScope} RPC de rate limit de turnos retornou erro/null para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    // Silencio (b) deliberado: fail-closed, ja logado, e indisponibilidade
    // transitoria da RPC viraria ruido de plantao sem acao possivel.
    console.warn(
      `${logScope} Falha ao verificar rate limit de turnos para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  }
}

/**
 * Rate limit das geracoes de fala (TTS) da entrevista, molde exato de
 * checkInterviewTurnDailyLimit: RPC generica por tool, mesma janela, mesmo
 * fail-closed. Sem variante free: a feature e Pro-only.
 */
export async function checkInterviewTtsDailyLimit(
  userId: string,
  logScope = "[interview]",
): Promise<AiDailyLimitResult> {
  const limit = env.interviewTtsDailyLimitPro;
  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc(
      "get_ai_usage_today_by_tool",
      { p_user_id: userId, p_tool: INTERVIEW_TTS_TOOL },
    );

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    console.warn(
      `${logScope} RPC de rate limit de TTS retornou erro/null para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    // Silencio (b) deliberado: fail-closed, ja logado, e indisponibilidade
    // transitoria da RPC viraria ruido de plantao sem acao possivel.
    console.warn(
      `${logScope} Falha ao verificar rate limit de TTS para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  }
}

// Chave de tool com que os turnos do chat de intake do plano de carreira logam
// em ai_usage_logs. Teto proprio via get_ai_usage_today_by_tool, espelhando
// agent-chat/interview-turn, e excluido da quota global pela migration
// 20260713150000_split_career_plan_chat_quota.
export const CAREER_PLAN_CHAT_TOOL = "career-plan-chat";

/**
 * Rate limit do chat de intake do plano de carreira, espelhando
 * checkInterviewTurnDailyLimit: mesma RPC generica por tool, mesma janela (dia
 * America/Sao_Paulo via RPC), mesmo fail-closed (erro/null/excecao =
 * allowed:false + verificationFailed). Sem variante free: a feature e Pro-only e
 * o gate barra antes.
 */
export async function checkCareerPlanChatDailyLimit(
  userId: string,
  logScope = "[career-plan-chat]",
): Promise<AiDailyLimitResult> {
  const limit = env.careerPlanChatDailyLimitPro;
  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc(
      "get_ai_usage_today_by_tool",
      { p_user_id: userId, p_tool: CAREER_PLAN_CHAT_TOOL },
    );

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    console.warn(
      `${logScope} RPC de rate limit do chat de intake retornou erro/null para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    // Silencio (b) deliberado: fail-closed, ja logado, e indisponibilidade
    // transitoria da RPC viraria ruido de plantao sem acao possivel.
    console.warn(
      `${logScope} Falha ao verificar rate limit do chat de intake para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  }
}

// Chave de tool com que os turnos do chat de intake do roadmap com IA logam em
// ai_usage_logs. Teto proprio via get_ai_usage_today_by_tool, espelhando
// agent-chat/interview-turn/career-plan-chat, e excluido da quota global pela
// migration 20260713160000_split_roadmap_intake_chat_quota.
export const ROADMAP_INTAKE_CHAT_TOOL = "roadmap-intake-chat";

/**
 * Rate limit do chat de intake do roadmap com IA, espelhando
 * checkCareerPlanChatDailyLimit: mesma RPC generica por tool, mesma janela (dia
 * America/Sao_Paulo via RPC), mesmo fail-closed (erro/null/excecao =
 * allowed:false + verificationFailed). Sem variante free: a feature e Pro-only e
 * o gate barra antes.
 */
export async function checkRoadmapIntakeChatDailyLimit(
  userId: string,
  logScope = "[roadmap-intake-chat]",
): Promise<AiDailyLimitResult> {
  const limit = env.roadmapIntakeChatDailyLimitPro;
  try {
    const { data: usageCount, error: usageError } = await supabaseAdmin.rpc(
      "get_ai_usage_today_by_tool",
      { p_user_id: userId, p_tool: ROADMAP_INTAKE_CHAT_TOOL },
    );

    if (!usageError && usageCount !== null) {
      return { allowed: usageCount < limit, count: usageCount, limit };
    }

    console.warn(
      `${logScope} RPC de rate limit do chat de intake retornou erro/null para`,
      userId,
    );
    return { allowed: false, count: 0, limit, verificationFailed: true };
  } catch {
    // Silencio (b) deliberado: fail-closed, ja logado, e indisponibilidade
    // transitoria da RPC viraria ruido de plantao sem acao possivel.
    console.warn(
      `${logScope} Falha ao verificar rate limit do chat de intake para`,
      userId,
    );
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
  /**
   * Detalhe POR TENTATIVA da chamada, gravado em `ai_usage_logs.attempt_details`.
   *
   * `readonly unknown[]` e nao um tipo concreto: `logAiUsage` serve nove
   * ferramentas e nao deve conhecer o formato de tentativa de nenhuma delas.
   * Quem monta o array e o dono do fluxo (hoje so a rota do analisador de
   * LinkedIn), e o array vai INTEGRO para o jsonb. Nao ha segunda serializacao
   * aqui: e o mesmo objeto que a rota ja tinha em maos.
   *
   * Ausente vira NULL na coluna, e NULL significa "esta linha nao registrou
   * detalhe". Array VAZIO e coisa diferente, e uma medicao: significa que a
   * chamada nao teve tentativa nenhuma (o atalho sem IA). Os dois nao podem
   * colapsar, e o reader abaixo e o que garante isso na volta.
   */
  attemptDetails?: readonly unknown[];
  /**
   * PRAZO PROPRIO por round-trip de banco desta gravacao, em ms. Ausente = sem
   * prazo, que e como as outras oito ferramentas chamam e continuam chamando.
   *
   * SEMANTICA DE ESTOURO AQUI: nao cancela a escrita, so para de esperar. Uma
   * confirmacao que aterrissa depois do prazo fecha a reserva com atraso, o que
   * e inofensivo (o painel le a linha ja confirmada). Uma que nunca aterrissa
   * deixa a linha em `reserved`, e o TTL de 10 minutos da reserva orfa a
   * devolve. Em nenhum dos dois a analise ja entregue e desfeita.
   */
  prazoBancoMs?: number;
}

/**
 * ESTADO NOMEADO da ausencia de detalhe, na leitura.
 *
 * String sentinela e nao `null`, pelo mesmo motivo de `CONTAGEM_INDISPONIVEL`
 * em `shared/linkedin/readQualitative.ts`: `null` convida `?? []`, e o primeiro
 * `?? []` transforma "nao sei" em "medi zero tentativa" em silencio. Com a
 * uniao, o TypeScript recusa iterar antes de checar, e o erro aparece no
 * `pnpm check` em vez de num painel que soma errado.
 */
export const DETALHE_DE_TENTATIVAS_INDISPONIVEL = "indisponivel";

export type DetalheDeTentativasLido =
  | readonly unknown[]
  | typeof DETALHE_DE_TENTATIVAS_INDISPONIVEL;

/**
 * Leitura FAIL-CLOSED do detalhe por tentativa.
 *
 * Toda linha gravada antes desta coluna existir tem NULL, e isso NAO e o mesmo
 * que "a chamada nao teve tentativa". Qualquer coisa que nao seja um array
 * (null, objeto, numero, jsonb corrompido) vira o estado nomeado; array vazio
 * passa como array vazio, porque ele e uma medicao legitima.
 */
export function lerDetalheDeTentativas(
  valor: unknown,
): DetalheDeTentativasLido {
  return Array.isArray(valor) ? valor : DETALHE_DE_TENTATIVAS_INDISPONIVEL;
}

/**
 * Insere uma linha em ai_usage_logs com os mesmos campos de sempre.
 * Nao lanca: falha de log so vira console.warn.
 */
/** Id da reserva mais antiga em voo deste usuario para esta ferramenta. */
async function acharReserva(
  userId: string,
  tool: string,
  prazoBancoMs?: number,
): Promise<string | null> {
  // O PRAZO EMBRULHA O `try`, e nao o contrario. O catch de dentro traduz
  // "consultei e nao achei" para `null`, e `null` manda `logAiUsage` INSERIR
  // uma linha nova. Estourar o prazo nao e "nao achei", e "nao sei": deixar o
  // `PrazoDeBancoEstourado` escapar por cima do catch e o que impede o chamador
  // de inserir uma segunda linha por cima de uma reserva que talvez exista, o
  // que dobraria a contagem do dia da pessoa.
  return comPrazoDeBanco(
    (async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from("ai_usage_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("tool", tool)
          .eq("status", "reserved")
          .order("created_at", { ascending: true })
          .limit(1);
        if (error || !data || data.length === 0) return null;
        return (data[0] as { id: string }).id;
      } catch {
        return null;
      }
    })(),
    "log_busca_reserva",
    prazoBancoMs,
  );
}

/**
 * Falha ao FECHAR uma reserva. Sobe para o Sentry, não fica em `console.warn`.
 *
 * Por que este merecia subir e os outros `warn` deste arquivo não: a reserva já
 * debitou a cota da pessoa. Se a confirmação falha, a linha fica `reserved`
 * para sempre, e o efeito é cobrança sem entrega, silenciosa. O passo 10 do
 * `docs/smoke-linkedin.md` procura exatamente essa órfã, mas só quando alguém
 * lembra de rodar; e `console.warn` NÃO vira issue, porque
 * `server/lib/sentry.ts` não instala integração de console. Ou seja: até aqui,
 * a única forma de descobrir era contar linhas no banco à mão.
 */
function avisarReservaOrfa(params: LogAiUsageParams, causa: string) {
  const mensagem = `[ai] Falha ao confirmar a reserva: a linha fica ORFA em 'reserved' e a cota foi debitada sem entrega. Causa: ${causa}`;
  console.error(mensagem);
  try {
    Sentry.captureMessage(mensagem, {
      level: "error",
      tags: { area: "ai-quota", orfa: "true", tool: params.tool },
      fingerprint: ["ai-reserva-orfa"],
    });
  } catch {
    // Sentry desligado (DSN ausente) e no-op por desenho; o console.error acima
    // ja garante o rastro. Mesmo padrao do avisarModoDegradado.
  }
}

export async function logAiUsage(params: LogAiUsageParams) {
  // CONFIRMA A RESERVA, se houver uma.
  //
  // Por que a busca e automatica e nao um id passado pela rota: sao NOVE rotas
  // chamando este par de funcoes. Exigir que cada uma carregue o id seria a
  // mesma classe de defeito que esta auditoria persegue, lista mantida a mao, e
  // aqui o custo de esquecer uma e pior que a corrida original: a linha fica
  // 'reserved' e consome cota da pessoa ate o fim do dia. Procurando a reserva
  // por (usuario, tool) nao ha como esquecer.
  //
  // A DEVOLUCAO tambem sai de graca: a rota ja chama esta funcao com status
  // 'error' quando a chamada falha, e o contador do dia so soma 'success' e
  // 'reserved'. Uma reserva que vira 'error' deixa de ocupar vaga sozinha.
  let reserva: string | null;
  try {
    reserva = await acharReserva(
      params.userId,
      params.tool,
      params.prazoBancoMs,
    );
  } catch (err) {
    // NAO SEI SE EXISTE RESERVA, entao nao escrevo nada. Cair no insert daqui
    // criaria uma segunda linha para a MESMA chamada (a reservada continua
    // 'reserved' e a nova entraria como 'success'), e o contador do dia soma as
    // duas: a pessoa perderia duas vagas por uma analise. Undercount e o erro
    // seguro nesta escolha, e a reserva em voo devolve a vaga pelo TTL.
    console.warn(
      "[ai] Prazo estourado ao procurar a reserva; nada foi gravado:",
      err instanceof Error ? err.message : String(err),
    );
    return;
  }
  if (reserva) {
    try {
      const { error } = await comPrazoDeBanco(
        supabaseAdmin
          .from("ai_usage_logs")
          .update({
            request_id: params.requestId,
            status: params.status,
            error_message: params.errorMessage || null,
            input_chars: params.inputChars || 0,
            output_chars: params.outputChars || 0,
            input_tokens: params.inputTokens || 0,
            output_tokens: params.outputTokens || 0,
            model: params.model || DEFAULT_MODEL,
            cost_estimate: params.costEstimate || 0,
            // `?? null` e nao `|| null`: array vazio e um valor legitimo (o
            // atalho sem IA nao tem tentativa) e `||` o converteria em NULL,
            // apagando a diferenca entre "medi zero" e "nao registrei".
            attempt_details: params.attemptDetails ?? null,
          })
          .eq("id", reserva),
        "log_grava_uso",
        params.prazoBancoMs,
      );
      if (!error) return;
      avisarReservaOrfa(params, error.message);
    } catch (err) {
      // PRAZO NAO E ORFANDADE, e confundir os dois enche o Sentry de alarme
      // falso. O update segue em voo e provavelmente aterrissa; se aterrissar,
      // a reserva fecha com atraso e nada se perde. Se nao aterrissar, o TTL de
      // 10 minutos devolve a vaga. Alarme so no caso em que a escrita realmente
      // FALHOU, que e o ramo do `error` acima e o `catch` de erro de verdade.
      if (err instanceof PrazoDeBancoEstourado) {
        console.warn(`[ai] ${err.message} Confirmacao da reserva em voo.`);
        return;
      }
      avisarReservaOrfa(
        params,
        err instanceof Error ? err.message : String(err),
      );
    }
    return;
  }
  try {
    await comPrazoDeBanco(
      supabaseAdmin.from("ai_usage_logs").insert({
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
        attempt_details: params.attemptDetails ?? null,
      }),
      "log_grava_uso",
      params.prazoBancoMs,
    );
  } catch (err) {
    console.warn("[ai] Falha ao registrar uso:", err);
  }
}
