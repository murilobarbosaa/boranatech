import crypto from "crypto";

import {
  AI_ROADMAP_SLUG_RE,
  RoadmapSectionContentSchema,
  RoadmapSkeletonModelSchema,
  type RoadmapIntake,
  type RoadmapSectionContentChild,
  type RoadmapSectionContentNode,
  type RoadmapSkeletonModel,
} from "../../../shared/aiRoadmap";
import { roadmapsV2 } from "../../../shared/roadmapV2/content";
import type { RoadmapNode, RoadmapV2 } from "../../../shared/roadmapV2/types";
import { env } from "../env";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "../openai";
import { toOpenAIStrictSchema } from "../openaiStrictSchema";
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
const AI_BACKOFF_MS = [400, 800];
// Tetos de saida por chamada. Ajustaveis. // TODO: calibrar.
const SKELETON_MAX_TOKENS = 2000;
const SECTION_MAX_TOKENS = 2500;
const AI_TEMPERATURE = 0.4;

const SKELETON_JSON_SCHEMA = toOpenAIStrictSchema(RoadmapSkeletonModelSchema);
const SECTION_JSON_SCHEMA = toOpenAIStrictSchema(RoadmapSectionContentSchema);

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
- De 5 a 9 secoes, em ordem de estudo, do fundamento ao avancado. Cada secao tem id (kebab-case, unico, curto), title, description (uma ou duas frases do que a pessoa vai dominar) e level (iniciante, intermediario ou avancado).
- area e a area de tecnologia do roadmap; title e o nome da trilha (pessoal, ex: citando o foco da pessoa); level e o nivel GERAL de partida; description resume a jornada em ate duas frases.
- Dimensione a jornada pelas horas semanais e pelo prazo informados no contexto: menos horas ou prazo curto pedem menos secoes e foco no essencial.
- Se o contexto mostrar trilhas ou conteudos que a pessoa ja avancou, NAO recomece do zero: parta do ponto em que ela esta e aproveite o que ja foi feito.
- NUNCA invente dados sobre a pessoa alem do contexto recebido.
- NUNCA gere URLs nem cite paginas, cursos ou produtos especificos de nenhuma plataforma. O conteudo e autocontido.
- Nunca use travessao nem meia-risca em nenhum texto. Use ponto, virgula ou parenteses. Hifen apenas em palavras compostas legitimas.

Responda apenas com o JSON do schema.`;

const SECTION_SYSTEM_PROMPT = `Voce e um mentor senior de carreira em tecnologia do BoraNaTech, plataforma brasileira que guia iniciantes do zero ate a primeira vaga. Sua tarefa e escrever o CONTEUDO de UMA secao de um roadmap de estudos personalizado, coerente com o esqueleto completo que voce vai receber.

REGRAS DO CONTEUDO:
- Escreva em portugues do Brasil, tom acolhedor, direto e claro.
- De 4 a 10 passos (children) para a secao pedida. Cada passo tem id (kebab-case, unico dentro do roadmap, prefixado pelo id da secao), title e, quando fizer sentido, description (uma frase), content (markdown pratico: o que estudar, em que ordem, como praticar, sinais de que pode avancar), project (um mini projeto pratico para fixar), estimatedTime (estimativa realista, ex: "1 semana", "4h a 6h") e optional (true apenas para aprofundamento que pode ser pulado).
- Um passo pode ter ate 5 sub-passos (children de segundo nivel, sem novos filhos), para quebrar um tema denso.
- Campos que nao se aplicam ao passo devem vir como null, nunca texto vazio.
- Calibre estimatedTime pelas horas semanais e pelo prazo do contexto; a soma da secao precisa ser realista.
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
function countLeaves(nodes: RoadmapNode[]): number {
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

// Monta o contexto textual da pessoa: intake (respostas do entendimento) +
// pool de contexto (fail-soft por fonte: o que nao veio simplesmente nao
// aparece; a IA e instruida a nunca inventar alem do contexto).
export async function buildGenerationContext(
  userId: string,
  intake: RoadmapIntake,
): Promise<string> {
  const pool = await fetchUserContextPool(userId);
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

  return lines.join("\n");
}

interface StructuredCallParams {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

// Uma chamada estruturada, sem retry (o retry fica em callStructured).
async function callStructuredOnce(
  params: StructuredCallParams,
): Promise<{ content: string; parsed: unknown }> {
  const response = await fetch(OPENAI_BASE_URL, {
    method: "POST",
    headers: buildOpenAIHeaders(env.openaiApiKey),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: AI_TEMPERATURE,
      max_tokens: params.maxTokens,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: params.schemaName,
          strict: true,
          schema: params.jsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A IA nao retornou conteudo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Resposta da IA nao veio em JSON valido: ${detail}.`);
  }

  return { content, parsed };
}

// Chamada estruturada com retry e validacao zod, molde dos analisadores. O
// safeParse roda DENTRO do retry: JSON fora do shape (min/max de itens, por
// exemplo) conta como tentativa falhada e tenta de novo.
async function callStructured<T>(
  params: StructuredCallParams,
  validate: (parsed: unknown) => { success: true; data: T } | { success: false; issues: string },
  logScope: string,
): Promise<GenerationResult<T>> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const { content, parsed } = await callStructuredOnce(params);
      const validation = validate(parsed);
      if (!validation.success) {
        throw new Error(
          `Resposta da IA nao bateu com o schema esperado: ${validation.issues}`,
        );
      }
      return {
        data: validation.data,
        inputChars: params.systemPrompt.length + params.userPrompt.length,
        outputChars: content.length,
      };
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `${logScope} IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gerar com a IA.");
}

function zodValidator<T>(schema: {
  safeParse: (value: unknown) =>
    | { success: true; data: T }
    | { success: false; error: { issues: unknown[] } };
}) {
  return (
    parsed: unknown,
  ): { success: true; data: T } | { success: false; issues: string } => {
    const validation = schema.safeParse(parsed);
    if (validation.success) {
      return { success: true, data: validation.data };
    }
    return {
      success: false,
      issues: JSON.stringify(validation.error.issues).slice(0, 300),
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

  // TODO(Ana): revisar copy do prompt de conteudo de secao.
  const userPrompt = `${context}

Roadmap: ${skeleton.title} (area ${skeleton.area}, nivel de partida ${skeleton.level}).
${skeleton.description}

Esqueleto completo, na ordem de estudo:
${outline}

Escreva o conteudo APENAS da secao ${sectionIndex + 1} ([${section.id}] ${section.title}). Nao repita conteudo das outras secoes; respeite a progressao do esqueleto.`;

  const result = await callStructured(
    {
      schemaName: "roadmap_section_content",
      jsonSchema: SECTION_JSON_SCHEMA,
      systemPrompt: SECTION_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: SECTION_MAX_TOKENS,
    },
    zodValidator<{ children: RoadmapSectionContentNode[] }>(
      RoadmapSectionContentSchema,
    ),
    "[roadmap-ia]",
  );

  return {
    data: toRoadmapNodes(result.data.children),
    inputChars: result.inputChars,
    outputChars: result.outputChars,
  };
}
