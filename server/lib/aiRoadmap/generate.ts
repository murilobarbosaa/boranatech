import crypto from "crypto";

import {
  AI_ROADMAP_SLUG_RE,
  buildSectionContentSchema,
  RoadmapSkeletonModelSchema,
  type RoadmapIntake,
  type RoadmapSectionContentChild,
  type RoadmapSectionContentNode,
  type RoadmapSkeletonModel,
} from "../../../shared/aiRoadmap";
import { resolveAreaSelection } from "../../../shared/areas";
import { projetos } from "../../../shared/projects/catalog";
import { roadmapsV2 } from "../../../shared/roadmapV2/content";
import type { RoadmapNode, RoadmapV2 } from "../../../shared/roadmapV2/types";
import { env } from "../env";
import { fetchWithTimeout, isUpstreamTimeoutError } from "../http";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "../openai";
import { toOpenAIStrictSchema } from "../openaiStrictSchema";
import { supabaseAdmin } from "../supabaseAdmin";
import { fetchUserContextPool } from "../userContext/pool";

// Geracao do Roadmap com IA, no molde EXATO dos analisadores (linkedinAnalyze/
// githubAnalyze): fetch cru para a OpenAI, gpt-4o-mini, json_schema strict via
// toOpenAIStrictSchema, retry com backoff, JSON.parse em try/catch + safeParse.
//
// Duas etapas: generateSkeleton (a trilha sem children) e generateSectionContent
// (os children de UMA secao, chamada uma vez por secao pelo caller, que
// persiste incrementalmente). O slug NUNCA vem do modelo: e gerado aqui
// (ia-<8 hex>) e injetado no esqueleto depois do parse.
//
// v1 nao gera resources nem byLanguage; os prompts proibem URL e citacao de
// pagina ou curso especifico (conteudo autocontido).

const AI_MAX_ATTEMPTS = 3;
// Backoff entre tentativas. Falha de validacao/JSON/truncamento: retry rapido,
// porque o proximo prompt ja leva a correcao (nao adianta esperar). Falha de
// 429/5xx: exponencial com jitter, teto de 8s, ou o Retry-After do provedor
// quando vier (limitado para nao pendurar o SSE). O antigo [400, 800] era curto
// demais para o 429 da OpenAI.
const VALIDATION_RETRY_DELAY_MS = 300;
const BACKOFF_BASE_MS = 500;
const BACKOFF_CAP_MS = 8000;
const RETRY_AFTER_CAP_MS = 15_000;
// Tetos de saida por chamada. Ajustaveis. // TODO: calibrar.
const SKELETON_MAX_TOKENS = 2000;
const SECTION_MAX_TOKENS = 3500;
const AI_TEMPERATURE = 0.4;

const SKELETON_JSON_SCHEMA = toOpenAIStrictSchema(RoadmapSkeletonModelSchema);

// Slug do servidor: ia-<8 hex>. hex e subconjunto de [a-z0-9], casa com
// AI_ROADMAP_SLUG_RE e com o padrao /roadmaps/:slug do platformKnowledge.
export function generateAiRoadmapSlug(): string {
  return `ia-${crypto.randomBytes(4).toString("hex")}`;
}

export interface GenerationResult<T> {
  data: T;
  inputChars: number;
  outputChars: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO(Ana): revisar copy dos prompts de geracao (system e user builders).
const SKELETON_SYSTEM_PROMPT = `Voce e um mentor senior de carreira em tecnologia do BoraNaTech, plataforma brasileira que guia iniciantes do zero ate a primeira vaga. Sua tarefa e desenhar o ESQUELETO de um roadmap de estudos totalmente personalizado para UMA pessoa, a partir do contexto dela.

REGRAS DO ESQUELETO:
- Escreva em portugues do Brasil, tom acolhedor, direto e claro.
- De 7 a 10 secoes, em ordem de estudo, do fundamento ao avancado. Cada secao tem id (kebab-case, unico, curto), title, description (uma ou duas frases do que a pessoa vai dominar) e level (iniciante, intermediario ou avancado).
- area e a area de tecnologia do roadmap; title e o nome da trilha (pessoal, ex: citando o foco da pessoa); level e o nivel GERAL de partida; description resume a jornada em ate duas frases.
- Este e um produto pago: a jornada precisa ser completa e profunda, cobrindo do fundamento ao nivel que o objetivo pede, sem etapas superficiais.
- Dimensione a jornada pelas horas semanais e pelo prazo informados no contexto: menos horas ou prazo curto pedem menos secoes (perto de 7) e foco no essencial.
- Se o contexto mostrar trilhas ou conteudos que a pessoa ja avancou, NAO recomece do zero: parta do ponto em que ela esta e aproveite o que ja foi feito.
- NUNCA invente dados sobre a pessoa alem do contexto recebido.
- NUNCA gere URLs nem cite paginas, cursos ou produtos especificos de nenhuma plataforma. O conteudo e autocontido.
- Nunca use travessao nem meia-risca em nenhum texto. Use ponto, virgula ou parenteses. Hifen apenas em palavras compostas legitimas.

Responda apenas com o JSON do schema.`;

const SECTION_SYSTEM_PROMPT = `Voce e um mentor senior de carreira em tecnologia do BoraNaTech, plataforma brasileira que guia iniciantes do zero ate a primeira vaga. Sua tarefa e escrever o CONTEUDO de UMA secao de um roadmap de estudos personalizado, coerente com o esqueleto completo que voce vai receber.

REGRAS DO CONTEUDO:
- Escreva em portugues do Brasil, tom acolhedor, direto e claro.
- Mire de 6 a 8 passos (children) para a secao pedida, nunca menos de 4 nem mais de 10. Cada passo tem id (kebab-case, unico dentro do roadmap, prefixado pelo id da secao), title, description (uma frase), content, project e estimatedTime; optional e true apenas para aprofundamento que pode ser pulado.
- content e OBRIGATORIO em todo passo: markdown de 4 a 8 frases, estruturado em tres partes, nesta ordem: (1) o que dominar, nomeando os subtopicos concretos; (2) como praticar, com uma atividade clara; (3) um mini desafio pratico concreto para fechar o passo.
- estimatedTime e OBRIGATORIO em todo passo: estimativa realista, ex: "2 semanas", "10 horas", "4h a 6h". Calibre pelas horas semanais e pelo prazo do contexto; a soma da secao precisa ser realista.
- project: e o vinculo com o catalogo de projetos da plataforma e SO existe na ULTIMA secao do roadmap. Quando o prompt oferecer a lista de projetos do catalogo, escolha o mais coerente com a trilha e coloque o id EXATO dele no campo project de UM UNICO passo (o passo de projeto final da secao); em todos os outros passos, project e null. Em secoes que nao recebem lista de projetos, project e sempre null.
- Este e um produto pago: cada passo deve ensinar o suficiente para a pessoa saber exatamente o que estudar e como praticar hoje, sem citar cursos ou paginas especificas.
- Um passo pode ter ate 5 sub-passos (children de segundo nivel, sem novos filhos), para quebrar um tema denso.
- Campos nullable que nao se aplicam ao passo devem vir como null, nunca texto vazio.
- Se o contexto mostrar que a pessoa ja domina parte do tema, reconheca isso no content e foque no que falta.
- NUNCA invente dados sobre a pessoa alem do contexto recebido.
- NUNCA gere URLs nem cite paginas, cursos ou produtos especificos de nenhuma plataforma. Ensine o caminho e os conceitos; o conteudo e autocontido.
- Nunca use travessao nem meia-risca em nenhum texto (nem no markdown). Use ponto, virgula ou parenteses. Hifen apenas em palavras compostas legitimas.

Responda apenas com o JSON do schema.`;

// TODO(Ana): revisar os rotulos das faixas do intake exibidos a IA.
const HOURS_LABELS: Record<RoadmapIntake["hoursPerWeek"], string> = {
  "ate-5": "ate 5 horas por semana",
  "5-10": "de 5 a 10 horas por semana",
  "10-20": "de 10 a 20 horas por semana",
  "20-mais": "mais de 20 horas por semana",
};

const GOAL_LABELS: Record<RoadmapIntake["goal"], string> = {
  "primeira-vaga": "conquistar a primeira vaga em tecnologia",
  transicao: "fazer transicao de carreira para tecnologia",
  freela: "trabalhar como freelancer",
  aprofundar: "aprofundar conhecimentos na area atual",
};

const DEADLINE_LABELS: Record<RoadmapIntake["deadline"], string> = {
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  "sem-prazo": "sem prazo definido",
};

const FORMAT_LABELS: Record<RoadmapIntake["format"], string> = {
  video: "prefere aprender por video",
  texto: "prefere aprender por texto",
  projetos: "prefere aprender construindo projetos",
  misto: "gosta de misturar formatos de estudo",
};

// Total aproximado de passos de uma trilha estatica (folhas da arvore), para
// dar percentual de avanco a IA. Aproximacao: conta folhas, incluindo opcionais.
// Exportado para a rota de contexto visivel usar o MESMO percentual.
export function countLeaves(nodes: RoadmapNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      total += countLeaves(node.children);
    } else {
      total += 1;
    }
  }
  return total;
}

// Teto de titulos de etapas ja concluidas passados a IA (anti-repeticao).
const MAX_COMPLETED_TITLES = 40;
const MAX_PROGRESS_ROWS = 500;

// Indexa title por id em toda a arvore de um RoadmapV2 (secoes e nos).
function collectNodeTitles(
  roadmap: RoadmapV2,
  into: Map<string, string>,
): void {
  const walk = (nodes: RoadmapNode[]): void => {
    for (const node of nodes) {
      into.set(node.id, node.title);
      if (node.children && node.children.length > 0) walk(node.children);
    }
  };
  for (const section of roadmap.sections) {
    walk(section.children);
  }
}

// Titulos das etapas ja concluidas pelo usuario (trilhas v2 estaticas via
// conteudo em shared/roadmapV2 + roadmaps IA anteriores via ai_roadmaps),
// resolvidos de user_progress (item_key = slug:nodeId). Best-effort: qualquer
// falha degrada para lista vazia, nunca derruba a geracao.
async function fetchCompletedTopicTitles(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("item_key")
      .eq("user_id", userId)
      .eq("context", "course_progress")
      .limit(MAX_PROGRESS_ROWS);
    if (error) {
      console.warn("[roadmap-ia] leitura de progresso falhou:", error.message);
      return [];
    }

    const nodeIdsBySlug = new Map<string, string[]>();
    for (const row of (data ?? []) as Array<{ item_key: string }>) {
      const sep = row.item_key.indexOf(":");
      if (sep <= 0) continue;
      const slug = row.item_key.slice(0, sep);
      const nodeId = row.item_key.slice(sep + 1);
      const ids = nodeIdsBySlug.get(slug) ?? [];
      ids.push(nodeId);
      nodeIdsBySlug.set(slug, ids);
    }
    if (nodeIdsBySlug.size === 0) return [];

    const titlesById = new Map<string, string>();

    for (const trail of roadmapsV2) {
      if (nodeIdsBySlug.has(trail.slug)) collectNodeTitles(trail, titlesById);
    }

    const aiSlugs = Array.from(nodeIdsBySlug.keys()).filter((slug) =>
      AI_ROADMAP_SLUG_RE.test(slug),
    );
    if (aiSlugs.length > 0) {
      const { data: aiRows, error: aiError } = await supabaseAdmin
        .from("ai_roadmaps")
        .select("slug, roadmap")
        .eq("user_id", userId)
        .in("slug", aiSlugs);
      if (aiError) {
        console.warn(
          "[roadmap-ia] resolucao de ai_roadmaps para anti-repeticao falhou:",
          aiError.message,
        );
      } else {
        for (const row of (aiRows ?? []) as Array<{
          slug: string;
          roadmap: RoadmapV2;
        }>) {
          if (row.roadmap && Array.isArray(row.roadmap.sections)) {
            collectNodeTitles(row.roadmap, titlesById);
          }
        }
      }
    }

    const titles: string[] = [];
    const seen = new Set<string>();
    for (const nodeIds of Array.from(nodeIdsBySlug.values())) {
      for (const nodeId of nodeIds) {
        const title = titlesById.get(nodeId);
        if (!title || seen.has(title)) continue;
        seen.add(title);
        titles.push(title);
        if (titles.length >= MAX_COMPLETED_TITLES) return titles;
      }
    }
    return titles;
  } catch (err) {
    console.warn("[roadmap-ia] anti-repeticao indisponivel:", err);
    return [];
  }
}

// Monta o contexto textual da pessoa: intake (respostas do entendimento) +
// pool de contexto (fail-soft por fonte: o que nao veio simplesmente nao
// aparece; a IA e instruida a nunca inventar alem do contexto).
export async function buildGenerationContext(
  userId: string,
  intake: RoadmapIntake,
): Promise<string> {
  const [pool, completedTitles] = await Promise.all([
    fetchUserContextPool(userId),
    fetchCompletedTopicTitles(userId),
  ]);
  const lines: string[] = [];

  lines.push("Contexto da pessoa (fatos; nao invente alem disto):");
  lines.push(`- Disponibilidade: ${HOURS_LABELS[intake.hoursPerWeek]}.`);
  lines.push(`- Objetivo: ${GOAL_LABELS[intake.goal]}.`);
  lines.push(`- Prazo desejado: ${DEADLINE_LABELS[intake.deadline]}.`);
  lines.push(`- Formato: ${FORMAT_LABELS[intake.format]}.`);
  if (intake.stackFocus) {
    lines.push(`- Foco de stack pedido: ${intake.stackFocus}.`);
  }
  if (intake.extraContext) {
    lines.push(`- Contexto extra informado: ${intake.extraContext}`);
  }

  if (pool.quiz.ok && pool.quiz.data) {
    const quiz = pool.quiz.data;
    const parts = [
      quiz.area ? `area indicada ${quiz.area}` : null,
      quiz.level ? `nivel ${quiz.level}` : null,
      typeof quiz.confidence === "number"
        ? `confianca ${quiz.confidence}`
        : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0) {
      lines.push(`- Quiz de carreira: ${parts.join(", ")}.`);
    }
  }

  if (pool.skills.ok && pool.skills.data.length > 0) {
    const skills = pool.skills.data
      .map((s) => `${s.label} (${s.level})`)
      .join(", ");
    lines.push(`- Skills declaradas: ${skills}.`);
  }

  if (pool.courses.ok && pool.courses.data.length > 0) {
    for (const course of pool.courses.data) {
      const trail = roadmapsV2.find((r) => r.slug === course.courseSlug);
      if (trail) {
        const total = countLeaves(
          trail.sections.flatMap((section) => section.children),
        );
        const pct =
          total > 0
            ? Math.min(100, Math.round((course.completedItems / total) * 100))
            : 0;
        lines.push(
          `- Trilha em andamento: ${trail.title}, ${course.completedItems} passos concluidos (cerca de ${pct}%). Nao recomece o que ja avancou: aproveite essa base.`,
        );
      } else {
        lines.push(
          `- Trilha em andamento: ${course.courseSlug}, ${course.completedItems} passos concluidos. Nao recomece o que ja avancou: aproveite essa base.`,
        );
      }
    }
  }

  if (pool.studyDiary.ok && pool.studyDiary.data.totalMinutes30d > 0) {
    const diary = pool.studyDiary.data;
    lines.push(
      `- Ritmo real de estudo nos ultimos 30 dias: ${diary.totalMinutes30d} minutos em ${diary.activeDays30d} dias ativos.`,
    );
  }

  if (pool.profile.ok && pool.profile.data?.careerGoal) {
    lines.push(
      `- Objetivo de carreira declarado no perfil: ${pool.profile.data.careerGoal}`,
    );
  }

  if (pool.linkedin.ok && pool.linkedin.data) {
    const li = pool.linkedin.data;
    const parts = [
      li.area ? `area ${li.area}` : null,
      typeof li.score === "number" ? `nota ${li.score}` : null,
      li.faixa ? `faixa ${li.faixa}` : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0) {
      lines.push(`- Analise de LinkedIn mais recente: ${parts.join(", ")}.`);
    }
  }

  if (pool.github.ok && pool.github.data) {
    const gh = pool.github.data;
    const parts = [
      gh.area ? `area ${gh.area}` : null,
      typeof gh.score === "number" ? `nota ${gh.score}` : null,
      gh.faixa ? `faixa ${gh.faixa}` : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0) {
      lines.push(`- Analise de GitHub mais recente: ${parts.join(", ")}.`);
    }
  }

  if (pool.resumeAnalysis.ok && pool.resumeAnalysis.data) {
    const ra = pool.resumeAnalysis.data;
    const parts = [
      typeof ra.score === "number" ? `nota ${ra.score}` : null,
      ra.faixa ? `faixa ${ra.faixa}` : null,
      ra.targetRole ? `cargo alvo ${ra.targetRole}` : null,
    ].filter((p): p is string => p !== null);
    if (parts.length > 0) {
      lines.push(`- Analise de curriculo mais recente: ${parts.join(", ")}.`);
    }
  }

  if (pool.resumes.ok && pool.resumes.data.total > 0) {
    const r = pool.resumes.data;
    lines.push(
      `- Ja criou curriculo na plataforma: ${r.latestTitle ?? "sem titulo"}, em ${r.latestCreatedAt ? r.latestCreatedAt.slice(0, 10) : "data desconhecida"}.`,
    );
  }

  if (pool.interview.ok && pool.interview.data) {
    const i = pool.interview.data;
    lines.push(
      `- Ultima entrevista simulada: area ${i.area ?? "nao registrada"}, ${i.goodCount} de ${i.questionCount} respostas boas.`,
    );
  }

  if (pool.careerPlan.ok && pool.careerPlan.data) {
    const p = pool.careerPlan.data;
    lines.push(
      `- Plano de carreira ativo na plataforma: area ${p.area ?? "nao registrada"}${p.goal ? `, objetivo "${p.goal}"` : ""}. Use so como sinal de direcao; NAO reproduza o plano de carreira na trilha.`,
    );
  }

  if (completedTitles.length > 0) {
    lines.push(
      `- Etapas que a pessoa JA CONCLUIU na plataforma: ${completedTitles.join("; ")}.`,
    );
    lines.push(
      "- NAO crie etapas sobre topicos desta lista; se um topico for pre-requisito, cite-o como ja dominado.",
    );
  }

  return lines.join("\n");
}

interface StructuredCallParams {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

// Falha de UMA chamada, classificada, para o retry decidir espera e correcao.
// "validation": zod rejeitou; "truncated": finish_reason=length (o erro de
// validacao seguinte e consequencia, nao causa); "invalid_json": parse falhou;
// "upstream": HTTP nao-ok (carrega status e Retry-After); "no_content": vazio.
type StructuredErrorKind =
  | "validation"
  | "truncated"
  | "invalid_json"
  | "upstream"
  | "no_content";

class StructuredCallError extends Error {
  readonly kind: StructuredErrorKind;
  readonly status?: number;
  readonly retryAfterMs?: number | null;
  readonly feedback?: string;
  constructor(
    kind: StructuredErrorKind,
    message: string,
    extra?: { status?: number; retryAfterMs?: number | null; feedback?: string },
  ) {
    super(message);
    this.name = "StructuredCallError";
    this.kind = kind;
    this.status = extra?.status;
    this.retryAfterMs = extra?.retryAfterMs;
    this.feedback = extra?.feedback;
  }
}

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: string; feedback: string };

// Retry-After em segundos (numero) ou HTTP-date. Limitado para nao segurar o
// SSE por muito tempo; null quando ausente ou ilegivel.
function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds)) {
    return Math.min(RETRY_AFTER_CAP_MS, Math.max(0, asSeconds * 1000));
  }
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.min(RETRY_AFTER_CAP_MS, Math.max(0, asDate - Date.now()));
  }
  return null;
}

function backoffDelay(attempt: number): number {
  const base = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** (attempt - 1));
  return base + Math.floor(Math.random() * 250);
}

// TODO(Ana): revisar copy das mensagens de correcao enviadas ao modelo no retry.
const CORRECTION_TRUNCATED =
  "A sua resposta anterior foi cortada por exceder o tamanho maximo. Produza uma secao mais enxuta (mire de 4 a 6 passos, com content de 4 a 5 frases por passo) e responda com o JSON completo e valido do schema, sem texto fora do JSON.";
const CORRECTION_INVALID_JSON =
  "A sua resposta anterior nao era JSON valido (provavelmente incompleta). Responda apenas com o JSON completo e valido do schema, sem nenhum texto fora dele.";

function correctionForValidation(feedback: string): string {
  // TODO(Ana): revisar copy da mensagem de correcao de validacao.
  return `A sua resposta anterior nao passou na validacao do schema: ${feedback}. Corrija exatamente esses pontos e responda apenas com o JSON completo e valido do schema, sem texto fora do JSON.`;
}

// Traduz os issues do zod em linguagem direta pro modelo corrigir, sem vazar
// stack. Cobre os casos comuns (too_small, too_big, invalid_type) e cai no
// message do proprio issue no resto.
function summarizeIssuesForModel(rawIssues: unknown[]): string {
  const parts: string[] = [];
  for (const raw of rawIssues.slice(0, 6)) {
    const issue = (raw ?? {}) as Record<string, unknown>;
    const path =
      Array.isArray(issue.path) && issue.path.length > 0
        ? issue.path.join(".")
        : "raiz";
    const code = issue.code;
    if (code === "too_small") {
      parts.push(
        `'${path}' precisa de pelo menos ${String(issue.minimum)} itens ou caracteres`,
      );
    } else if (code === "too_big") {
      parts.push(
        `'${path}' pode ter no maximo ${String(issue.maximum)} itens ou caracteres`,
      );
    } else if (code === "invalid_type") {
      parts.push(`'${path}' esta com tipo invalido ou ausente`);
    } else {
      parts.push(
        `'${path}': ${typeof issue.message === "string" ? issue.message : String(code)}`,
      );
    }
  }
  return parts.join("; ");
}

// Decide, por tentativa, o motivo (para log), a espera e a mensagem de correcao
// a injetar na proxima tentativa (null quando nao ha o que corrigir no prompt).
function planRetry(
  err: unknown,
  attempt: number,
): { reason: string; detail: string; correction: string | null; delayMs: number } {
  const detail = err instanceof Error ? err.message : String(err);
  if (isUpstreamTimeoutError(err)) {
    return { reason: "timeout", detail, correction: null, delayMs: backoffDelay(attempt) };
  }
  if (err instanceof StructuredCallError) {
    if (err.kind === "validation") {
      return {
        reason: "validation",
        detail,
        correction: err.feedback
          ? correctionForValidation(err.feedback)
          : CORRECTION_INVALID_JSON,
        delayMs: VALIDATION_RETRY_DELAY_MS,
      };
    }
    if (err.kind === "truncated") {
      return {
        reason: "truncated",
        detail,
        correction: CORRECTION_TRUNCATED,
        delayMs: VALIDATION_RETRY_DELAY_MS,
      };
    }
    if (err.kind === "invalid_json") {
      return {
        reason: "invalid_json",
        detail,
        correction: CORRECTION_INVALID_JSON,
        delayMs: VALIDATION_RETRY_DELAY_MS,
      };
    }
    if (err.kind === "upstream") {
      return {
        reason: `upstream ${err.status ?? "?"}`,
        detail,
        correction: null,
        delayMs: err.retryAfterMs ?? backoffDelay(attempt),
      };
    }
    return { reason: err.kind, detail, correction: null, delayMs: backoffDelay(attempt) };
  }
  return { reason: "unknown", detail, correction: null, delayMs: backoffDelay(attempt) };
}

// Uma chamada estruturada, sem retry (o retry fica em callStructured). Recebe a
// correcao acumulada (null na primeira tentativa) e a injeta como mensagem
// adicional pro modelo saber o que corrigir.
async function callStructuredOnce(
  params: StructuredCallParams,
  correction: string | null,
): Promise<{ content: string; parsed: unknown }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: params.systemPrompt },
    { role: "user", content: params.userPrompt },
  ];
  if (correction) {
    messages.push({ role: "user", content: correction });
  }

  const response = await fetchWithTimeout(
    OPENAI_BASE_URL,
    {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: AI_TEMPERATURE,
        max_tokens: params.maxTokens,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: params.schemaName,
            strict: true,
            schema: params.jsonSchema,
          },
        },
      }),
    },
    { service: "openai", timeoutMs: 90_000 },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new StructuredCallError(
      "upstream",
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
      {
        status: response.status,
        retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
      },
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string | null;
    }>;
  };
  const choice = payload.choices?.[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new StructuredCallError("no_content", "A IA nao retornou conteudo.");
  }
  if (choice?.finish_reason === "length") {
    // Truncamento por teto de tokens: o erro de validacao/parse seguinte seria
    // consequencia disto. Sinaliza explicito para o retry corrigir com concisao.
    throw new StructuredCallError(
      "truncated",
      "resposta cortada por max_tokens (finish_reason=length)",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new StructuredCallError(
      "invalid_json",
      `Resposta da IA nao veio em JSON valido: ${detail}.`,
    );
  }

  return { content, parsed };
}

// Chamada estruturada com retry CORRETIVO: a tentativa seguinte recebe uma
// mensagem descrevendo o que deu errado (validacao, JSON invalido, truncamento)
// e o que corrigir, em vez de reenviar o mesmo prompt e colher o mesmo erro.
// 429/5xx respeitam Retry-After (ou backoff com jitter); cada falha loga o
// motivo classificado, pra o proximo diagnostico nao depender de investigacao.
async function callStructured<T>(
  params: StructuredCallParams,
  validate: (parsed: unknown) => ValidationResult<T>,
  logScope: string,
): Promise<GenerationResult<T>> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  let lastError: unknown;
  let correction: string | null = null;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const { content, parsed } = await callStructuredOnce(params, correction);
      const validation = validate(parsed);
      if (!validation.success) {
        throw new StructuredCallError(
          "validation",
          `Resposta da IA nao bateu com o schema esperado: ${validation.issues}`,
          { feedback: validation.feedback },
        );
      }
      return {
        data: validation.data,
        inputChars: params.systemPrompt.length + params.userPrompt.length,
        outputChars: content.length,
      };
    } catch (err) {
      lastError = err;
      const plan = planRetry(err, attempt);
      console.error(
        `${logScope} IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou [${plan.reason}]: ${plan.detail}`,
      );
      // Acumula a correcao (nunca limpa): se validou mal e depois deu 429, a
      // proxima tentativa ainda leva a correcao de conteudo.
      if (plan.correction) correction = plan.correction;
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(plan.delayMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar com a IA.");
}

function zodValidator<T>(schema: {
  safeParse: (
    value: unknown,
  ) =>
    | { success: true; data: T }
    | { success: false; error: { issues: unknown[] } };
}) {
  return (parsed: unknown): ValidationResult<T> => {
    const validation = schema.safeParse(parsed);
    if (validation.success) {
      return { success: true, data: validation.data };
    }
    return {
      success: false,
      issues: JSON.stringify(validation.error.issues).slice(0, 300),
      feedback: summarizeIssuesForModel(validation.error.issues),
    };
  };
}

// Converte o esqueleto validado no objeto RoadmapV2 persistivel: slug do
// SERVIDOR e children vazios (preenchidos secao a secao depois).
function skeletonToRoadmap(
  skeleton: RoadmapSkeletonModel,
  slug: string,
): RoadmapV2 {
  return {
    slug,
    area: skeleton.area,
    title: skeleton.title,
    level: skeleton.level,
    description: skeleton.description,
    sections: skeleton.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      level: section.level,
      children: [],
    })),
  };
}

// Remove os nulls do shape voltado a IA, devolvendo um RoadmapNode limpo no
// shape das trilhas v2 (campo null vira campo ausente).
function toRoadmapNode(
  node: RoadmapSectionContentChild,
  children?: RoadmapNode[],
): RoadmapNode {
  const out: RoadmapNode = { id: node.id, title: node.title };
  if (node.description !== null) out.description = node.description;
  if (node.content !== null) out.content = node.content;
  if (node.project !== null) out.project = node.project;
  if (node.estimatedTime !== null) out.estimatedTime = node.estimatedTime;
  if (node.optional !== null) out.optional = node.optional;
  if (children && children.length > 0) out.children = children;
  return out;
}

function toRoadmapNodes(nodes: RoadmapSectionContentNode[]): RoadmapNode[] {
  return nodes.map((node) =>
    toRoadmapNode(
      node,
      node.children === null
        ? undefined
        : node.children.map((child) => toRoadmapNode(child)),
    ),
  );
}

// Gera o esqueleto da trilha. O slug retornado e SEMPRE o gerado no servidor.
export async function generateSkeleton(
  context: string,
): Promise<GenerationResult<RoadmapV2>> {
  const slug = generateAiRoadmapSlug();
  // Cinto e suspensorio: o gerador local sempre produz um slug valido.
  if (!AI_ROADMAP_SLUG_RE.test(slug)) {
    throw new Error("Slug gerado invalido.");
  }

  // TODO(Ana): revisar copy do prompt de esqueleto.
  const userPrompt = `${context}\n\nDesenhe o esqueleto do roadmap personalizado para essa pessoa, seguindo as regras do sistema.`;

  const result = await callStructured(
    {
      schemaName: "roadmap_skeleton",
      jsonSchema: SKELETON_JSON_SCHEMA,
      systemPrompt: SKELETON_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: SKELETON_MAX_TOKENS,
    },
    zodValidator<RoadmapSkeletonModel>(RoadmapSkeletonModelSchema),
    "[roadmap-ia]",
  );

  return {
    data: skeletonToRoadmap(result.data, slug),
    inputChars: result.inputChars,
    outputChars: result.outputChars,
  };
}

// Gera os children de UMA secao do esqueleto. Recebe o esqueleto inteiro para
// coerencia (a IA ve a jornada completa) mas so escreve a secao pedida.
export async function generateSectionContent(
  context: string,
  skeleton: RoadmapV2,
  sectionIndex: number,
): Promise<GenerationResult<RoadmapNode[]>> {
  const section = skeleton.sections[sectionIndex];
  if (!section) {
    throw new Error(`Secao ${sectionIndex} inexistente no esqueleto.`);
  }

  const outline = skeleton.sections
    .map(
      (s, i) =>
        `${i + 1}. [${s.id}] ${s.title} (${s.level ?? "nivel nao definido"}): ${s.description ?? ""}`,
    )
    .join("\n");

  // Projeto do catalogo SO na ultima secao (fase 5c.2): oferece os projetos
  // Pro reais e o schema da chamada restringe project ao enum dos ids
  // oferecidos. skeleton.area e texto livre da IA, entao o filtro por area so
  // entra quando resolve num slug conhecido E existe projeto Pro daquela
  // area; senao a oferta e o catalogo Pro inteiro.
  const isLastSection = sectionIndex === skeleton.sections.length - 1;
  let offeredProjects: typeof projetos = [];
  if (isLastSection) {
    const proProjects = projetos.filter((p) => p.pro === true);
    const areaSlug = resolveAreaSelection(skeleton.area);
    const byArea =
      areaSlug !== "geral"
        ? proProjects.filter((p) => p.areaSlug === areaSlug)
        : [];
    offeredProjects = byArea.length > 0 ? byArea : proProjects;
  }
  const offerLines =
    offeredProjects.length > 0
      ? `\n\nProjetos Pro do catalogo pra fechar a trilha (escolha exatamente UM e coloque o id EXATO no campo project de UM UNICO passo desta secao; nos demais passos, project e null):\n${offeredProjects
          .map((p) => `- [${p.id}] ${p.nome}: ${p.objetivo}`)
          .join("\n")}`
      : "";

  // TODO(Ana): revisar copy do prompt de conteudo de secao.
  const userPrompt = `${context}

Roadmap: ${skeleton.title} (area ${skeleton.area}, nivel de partida ${skeleton.level}).
${skeleton.description}

Esqueleto completo, na ordem de estudo:
${outline}

Escreva o conteudo APENAS da secao ${sectionIndex + 1} ([${section.id}] ${section.title}). Nao repita conteudo das outras secoes; respeite a progressao do esqueleto.${offerLines}`;

  const sectionSchema = buildSectionContentSchema(
    isLastSection ? offeredProjects.map((p) => p.id) : null,
  );

  const result = await callStructured(
    {
      schemaName: "roadmap_section_content",
      jsonSchema: toOpenAIStrictSchema(sectionSchema),
      systemPrompt: SECTION_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: SECTION_MAX_TOKENS,
    },
    zodValidator<{ children: RoadmapSectionContentNode[] }>(sectionSchema),
    "[roadmap-ia]",
  );

  return {
    data: toRoadmapNodes(result.data.children),
    inputChars: result.inputChars,
    outputChars: result.outputChars,
  };
}
