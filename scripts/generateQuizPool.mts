// Gera o pool de perguntas de quiz de UMA trilha v2 em
// server/data/roadmapQuizzes/<slug>.ts, com uma chamada de gpt-4o-mini por
// nivel (iniciante, intermediario, avancado). Rodar:
//   pnpm gen:quiz-pool <slug> [--force]
// Sem --force o script aborta se o pool ja existe. O pool contem o GABARITO
// e e server-only (ver server/data/roadmapQuizzes/README.md). Os ids das
// perguntas sao atribuidos pelo SCRIPT (formato <slug>-<ini|int|av>-NN),
// nunca pela IA; regenerar com --force troca ids e invalida tentativas.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  POOL_TARGET_PER_LEVEL,
  type QuizAlternativaId,
  type QuizNivel,
  type QuizPool,
  type QuizQuestion,
} from "../shared/roadmapQuiz/types";
import { roadmapsV2 } from "../shared/roadmapV2/content";
import type { RoadmapNode, RoadmapV2 } from "../shared/roadmapV2/types";
import { env } from "../server/lib/env";
import {
  buildOpenAIHeaders,
  DEFAULT_MODEL,
  OPENAI_BASE_URL,
} from "../server/lib/openai";
import { toOpenAIStrictSchema } from "../server/lib/openaiStrictSchema";
import { NIVEL_ABBR, validateQuizPool } from "./quizPoolValidation.mts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUIZ_DIR = path.join(ROOT, "server", "data", "roadmapQuizzes");

const NIVEIS: QuizNivel[] = ["iniciante", "intermediario", "avancado"];
const MAX_PER_FONTE = 3;
const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];
const AI_TEMPERATURE = 0.4;
const AI_MAX_TOKENS = 4000;
// Precos do gpt-4o-mini (USD por 1M tokens), so pro log de custo.
const PRICE_INPUT_PER_M = 0.15;
const PRICE_OUTPUT_PER_M = 0.6;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface LeafMaterial {
  id: string;
  title: string;
  description: string;
  content: string;
}

function collectLeaves(nodes: RoadmapNode[], out: LeafMaterial[]) {
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      collectLeaves(node.children, out);
    } else {
      out.push({
        id: node.id,
        title: node.title,
        description: node.description ?? "",
        content: node.content ?? "",
      });
    }
  }
}

// Material de um nivel: folhas das secoes daquele level (byLanguage e
// ignorado de proposito, o quiz cobre o tronco comum da trilha).
function levelMaterial(roadmap: RoadmapV2, nivel: QuizNivel): LeafMaterial[] {
  const leaves: LeafMaterial[] = [];
  for (const section of roadmap.sections) {
    if (section.level !== nivel) continue;
    collectLeaves(section.children, leaves);
  }
  return leaves;
}

function buildQuestionSchema(leafIds: string[]) {
  return z.object({
    questions: z
      .array(
        z.object({
          pergunta: z.string(),
          alternativas: z.object({
            a: z.string(),
            b: z.string(),
            c: z.string(),
            d: z.string(),
          }),
          correta: z.enum(["a", "b", "c", "d"]),
          explicacao: z.string(),
          fonte: z.enum(leafIds as [string, ...string[]]),
        }),
      )
      .min(POOL_TARGET_PER_LEVEL)
      .max(POOL_TARGET_PER_LEVEL),
  });
}

type GeneratedQuestion = z.infer<
  ReturnType<typeof buildQuestionSchema>
>["questions"][number];

const SYSTEM_PROMPT = [
  "Voce cria perguntas de quiz de multipla escolha em portugues do Brasil para uma plataforma de carreira tech. Regras inegociaveis:",
  "- Perguntas de COMPREENSAO e APLICACAO de conceito, nunca decoreba de definicao literal.",
  '- Prefira mini cenarios curtos e praticos ("voce precisa de X, o que faz?") em vez de perguntas abstratas.',
  "- As 4 alternativas devem ser plausiveis; as erradas refletem erros reais de quem esta aprendendo, nunca absurdos obvios.",
  "- A correta NAO pode ser dedutivel por tamanho ou estilo: escreva as 4 alternativas com comprimento e tom parecidos.",
  "- Cada pergunta e autocontida: da pra entender e responder sem ver o material de origem.",
  "- explicacao: 1 a 2 frases dizendo por que a alternativa correta esta certa.",
  "- fonte: o id EXATO do passo (da lista de ids validos fornecida) que originou a pergunta.",
  `- Distribua as perguntas entre os passos do material: no maximo ${MAX_PER_FONTE} perguntas por passo.`,
  "- Baseie tudo SOMENTE no material fornecido; nao use conhecimento de fora dele.",
  "- Proibido travessao e meia-risca em qualquer texto; use virgulas, pontos ou parenteses.",
].join("\n");

function buildUserPrompt(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
  leaves: LeafMaterial[],
  rebalanceNote: string | null,
) {
  const lines = [
    `Trilha: ${roadmap.title} (area ${roadmap.area})`,
    `Nivel desta rodada: ${nivel}`,
    `Gere exatamente ${POOL_TARGET_PER_LEVEL} perguntas do nivel ${nivel}.`,
    "",
    "Ids validos para o campo fonte:",
    ...leaves.map((leaf) => `- ${leaf.id}`),
    "",
    "Material (cada passo com id, titulo e conteudo):",
  ];
  for (const leaf of leaves) {
    lines.push("", `### ${leaf.id} | ${leaf.title}`);
    if (leaf.description) lines.push(leaf.description);
    if (leaf.content) lines.push(leaf.content);
  }
  if (rebalanceNote) {
    lines.push("", rebalanceNote);
  }
  return lines.join("\n");
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

async function callOpenAIOnce(
  systemPrompt: string,
  userPrompt: string,
  jsonSchema: Record<string, unknown>,
): Promise<{ parsed: unknown; usage: Usage }> {
  const response = await fetch(OPENAI_BASE_URL, {
    method: "POST",
    headers: buildOpenAIHeaders(env.openaiApiKey),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: AI_TEMPERATURE,
      max_tokens: AI_MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quiz_pool_level",
          strict: true,
          schema: jsonSchema,
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
    usage?: Usage;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("A IA nao retornou conteudo.");

  return {
    parsed: JSON.parse(content),
    usage: payload.usage ?? { prompt_tokens: 0, completion_tokens: 0 },
  };
}

// Distribui a checagem de concentracao DENTRO do retry: resposta com mais de
// MAX_PER_FONTE perguntas no mesmo passo conta como tentativa falhada e a
// proxima tentativa recebe uma nota de rebalanceamento no prompt apontando
// os passos excedidos. Esgotadas as tentativas, o script falha com o
// relatorio da distribuicao (nao salva pool invalido).
function overusedFontes(questions: GeneratedQuestion[]): string[] {
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.fonte, (counts.get(question.fonte) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > MAX_PER_FONTE)
    .map(([fonte, count]) => `${fonte} (${count})`);
}

async function generateLevel(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
  usageTotal: Usage,
): Promise<GeneratedQuestion[]> {
  const leaves = levelMaterial(roadmap, nivel);
  if (leaves.length === 0) {
    throw new Error(
      `Trilha ${roadmap.slug} nao tem secoes do nivel ${nivel}; pool exige os tres niveis.`,
    );
  }
  const schema = buildQuestionSchema(leaves.map((leaf) => leaf.id));
  const jsonSchema = toOpenAIStrictSchema(schema);

  let rebalanceNote: string | null = null;
  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const userPrompt = buildUserPrompt(roadmap, nivel, leaves, rebalanceNote);
      const { parsed, usage } = await callOpenAIOnce(
        SYSTEM_PROMPT,
        userPrompt,
        jsonSchema,
      );
      usageTotal.prompt_tokens += usage.prompt_tokens;
      usageTotal.completion_tokens += usage.completion_tokens;
      console.log(
        `[generateQuizPool] ${nivel} tentativa ${attempt}: ${usage.prompt_tokens} in / ${usage.completion_tokens} out tokens`,
      );

      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        throw new Error(
          `Resposta fora do schema: ${validation.error.issues
            .slice(0, 3)
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")}`,
        );
      }
      const excedidos = overusedFontes(validation.data.questions);
      if (excedidos.length > 0) {
        rebalanceNote = `Na tentativa anterior os passos a seguir originaram mais de ${MAX_PER_FONTE} perguntas cada: ${excedidos.join(", ")}. Gere as ${POOL_TARGET_PER_LEVEL} perguntas de novo redistribuindo entre outros passos do material, respeitando o maximo de ${MAX_PER_FONTE} por passo.`;
        throw new Error(
          `Concentracao acima de ${MAX_PER_FONTE} por passo: ${excedidos.join(", ")}`,
        );
      }
      return validation.data.questions;
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[generateQuizPool] ${nivel} tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Falha ao gerar o nivel ${nivel}.`);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const slug = args.find((arg) => !arg.startsWith("--"));

if (!slug) {
  console.error("Uso: pnpm gen:quiz-pool <slug> [--force]");
  process.exit(1);
}
const roadmap = roadmapsV2.find((entry) => entry.slug === slug);
if (!roadmap) {
  console.error(`[generateQuizPool] slug "${slug}" nao existe no agregado.`);
  process.exit(1);
}
const outFile = path.join(QUIZ_DIR, `${slug}.ts`);
if (existsSync(outFile) && !force) {
  console.error(
    `[generateQuizPool] ${path.relative(ROOT, outFile)} ja existe. Use --force pra regenerar (isso troca os ids e invalida tentativas registradas).`,
  );
  process.exit(1);
}
if (!env.openaiApiKey) {
  console.error("[generateQuizPool] OPENAI_API_KEY ausente no ambiente.");
  process.exit(1);
}

const usageTotal: Usage = { prompt_tokens: 0, completion_tokens: 0 };
const questions: QuizQuestion[] = [];
for (const nivel of NIVEIS) {
  const generated = await generateLevel(roadmap, nivel, usageTotal);
  generated.forEach((question, index) => {
    questions.push({
      id: `${slug}-${NIVEL_ABBR[nivel]}-${String(index + 1).padStart(2, "0")}`,
      nivel,
      pergunta: question.pergunta,
      alternativas: question.alternativas,
      correta: question.correta as QuizAlternativaId,
      explicacao: question.explicacao,
      fonte: question.fonte,
    });
  });
}

const pool: QuizPool = { slug, questions };
const problems = validateQuizPool(pool, slug, roadmap);
if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`[generateQuizPool] ${problem}`);
  }
  console.error("[generateQuizPool] pool invalido, nada foi salvo.");
  process.exit(1);
}

const fileContent = `// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool ${slug}). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = ${JSON.stringify(pool, null, 2)};

export default pool;
`;

mkdirSync(QUIZ_DIR, { recursive: true });
writeFileSync(outFile, fileContent);

const cost =
  (usageTotal.prompt_tokens / 1_000_000) * PRICE_INPUT_PER_M +
  (usageTotal.completion_tokens / 1_000_000) * PRICE_OUTPUT_PER_M;
console.log(
  `[generateQuizPool] ${questions.length} perguntas -> ${path.relative(process.cwd(), outFile)}`,
);
console.log(
  `[generateQuizPool] tokens: ${usageTotal.prompt_tokens} in / ${usageTotal.completion_tokens} out; custo estimado USD ${cost.toFixed(4)}`,
);
