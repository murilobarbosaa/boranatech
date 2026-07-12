// Gera o pool de perguntas de quiz de UMA trilha v2 em
// server/data/roadmapQuizzes/<slug>.ts, com uma chamada de gpt-4o-mini por
// SECAO da trilha: o orcamento de POOL_TARGET_PER_LEVEL perguntas por nivel
// e repartido entre as secoes do nivel proporcionalmente ao numero de folhas
// (piso de 1 por secao, teto de MAX_PER_FONTE por folha), garantindo que
// nenhuma secao fique sem cobertura. Rodar:
//   pnpm gen:quiz-pool <slug> [--force]
// Sem --force o script aborta se o pool ja existe. O pool contem o GABARITO
// e e server-only (ver server/data/roadmapQuizzes/README.md). Os ids das
// perguntas sao atribuidos pelo SCRIPT (formato <slug>-<ini|int|av>-NN,
// sequencial por nivel na ordem das secoes da trilha), nunca pela IA;
// regenerar com --force troca ids e invalida tentativas.
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

// Secoes de um nivel com suas folhas (byLanguage e ignorado de proposito,
// o quiz cobre o tronco comum da trilha).
interface SectionMaterial {
  title: string;
  leaves: LeafMaterial[];
}

function levelSections(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
): SectionMaterial[] {
  const out: SectionMaterial[] = [];
  for (const section of roadmap.sections) {
    if (section.level !== nivel) continue;
    const leaves: LeafMaterial[] = [];
    collectLeaves(section.children, leaves);
    out.push({ title: section.title, leaves });
  }
  return out;
}

// Orcamento do nivel: target repartido entre as secoes proporcionalmente ao
// numero de folhas, arredondamento determinista por maiores restos (empate
// resolve pela ordem das secoes na trilha), com piso de 1 pergunta por secao
// e teto de MAX_PER_FONTE por folha. Falha antes de chamar a IA se a soma
// nao fechar o target ou alguma cota estourar o teto.
function sectionQuotas(sections: SectionMaterial[], target: number): number[] {
  const totalLeaves = sections.reduce(
    (sum, section) => sum + section.leaves.length,
    0,
  );
  const raw = sections.map(
    (section) => (section.leaves.length / totalLeaves) * target,
  );
  const quotas = raw.map(Math.floor);
  let leftover = target - quotas.reduce((sum, quota) => sum + quota, 0);
  const byRemainder = raw
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  for (let i = 0; leftover > 0; i = (i + 1) % byRemainder.length) {
    quotas[byRemainder[i].index] += 1;
    leftover -= 1;
  }

  // Piso de 1: secao zerada rouba 1 da secao com maior cota (empate resolve
  // pela primeira na ordem da trilha).
  for (let i = 0; i < quotas.length; i += 1) {
    if (quotas[i] > 0) continue;
    const donor = quotas.indexOf(Math.max(...quotas));
    if (quotas[donor] <= 1) {
      throw new Error(
        `Orcamento insuficiente: ${sections.length} secoes para ${target} perguntas.`,
      );
    }
    quotas[donor] -= 1;
    quotas[i] += 1;
  }

  // Teto por folha: excedente migra pra primeira secao com folga.
  for (let i = 0; i < quotas.length; i += 1) {
    const cap = sections[i].leaves.length * MAX_PER_FONTE;
    while (quotas[i] > cap) {
      const receiver = sections.findIndex(
        (section, j) => quotas[j] < section.leaves.length * MAX_PER_FONTE,
      );
      if (receiver === -1) {
        throw new Error(
          `Orcamento impossivel: nivel nao comporta ${target} perguntas com teto de ${MAX_PER_FONTE} por folha.`,
        );
      }
      quotas[i] -= 1;
      quotas[receiver] += 1;
    }
  }

  const sum = quotas.reduce((a, b) => a + b, 0);
  if (sum !== target) {
    throw new Error(`Orcamento nao fecha ${target} (somou ${sum}).`);
  }
  quotas.forEach((quota, i) => {
    const cap = sections[i].leaves.length * MAX_PER_FONTE;
    if (quota < 1 || quota > cap) {
      throw new Error(
        `Cota invalida na secao "${sections[i].title}": ${quota} (limites 1 a ${cap}).`,
      );
    }
  });
  return quotas;
}

function buildQuestionSchema(leafIds: string[], count: number) {
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
      .min(count)
      .max(count),
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
  '- PROIBIDO o formato "qual e a forma correta" ou "qual e a melhor forma" quando mais de uma alternativa funciona na pratica. Se a pergunta e sobre boa pratica, o enunciado DEVE declarar explicitamente que quer a pratica recomendada e por qual criterio (ex: "seguindo a recomendacao da documentacao do React para listas dinamicas, qual key evita bugs de estado?"); nesse caso os distratores sao opcoes que FUNCIONAM mas violam o criterio declarado, e a explicacao diz por que a recomendada vence.',
  "- Toda alternativa incorreta precisa ser INEQUIVOCAMENTE incorreta sob o enunciado dado (falha, da erro ou produz comportamento diferente do pedido), OU o enunciado precisa declarar o criterio que a desqualifica.",
  "- Autoteste antes de emitir cada pergunta: um especialista poderia defender outra alternativa alem da correta? Se sim, reescreva o enunciado ate sobrar UMA unica resposta defensavel.",
  "- explicacao: 1 a 2 frases dizendo por que a alternativa correta esta certa.",
  "- fonte: o id EXATO do passo (da lista de ids validos fornecida) que originou a pergunta.",
  `- Distribua as perguntas entre os passos do material: no maximo ${MAX_PER_FONTE} perguntas por passo.`,
  "- Baseie tudo SOMENTE no material fornecido; nao use conhecimento de fora dele.",
  "- Proibido travessao e meia-risca em qualquer texto; use virgulas, pontos ou parenteses.",
].join("\n");

function buildUserPrompt(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
  section: SectionMaterial,
  quota: number,
  rebalanceNote: string | null,
) {
  const lines = [
    `Trilha: ${roadmap.title} (area ${roadmap.area})`,
    `Nivel desta rodada: ${nivel}`,
    `Secao desta rodada: ${section.title}`,
    `Gere exatamente ${quota} perguntas do nivel ${nivel} sobre o material desta secao.`,
    "",
    "Ids validos para o campo fonte:",
    ...section.leaves.map((leaf) => `- ${leaf.id}`),
    "",
    "Material (cada passo com id, titulo e conteudo):",
  ];
  for (const leaf of section.leaves) {
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

async function generateSection(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
  section: SectionMaterial,
  quota: number,
  usageLevel: Usage,
): Promise<GeneratedQuestion[]> {
  const schema = buildQuestionSchema(
    section.leaves.map((leaf) => leaf.id),
    quota,
  );
  const jsonSchema = toOpenAIStrictSchema(schema);
  const label = `${nivel} / ${section.title}`;

  let rebalanceNote: string | null = null;
  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const userPrompt = buildUserPrompt(
        roadmap,
        nivel,
        section,
        quota,
        rebalanceNote,
      );
      const { parsed, usage } = await callOpenAIOnce(
        SYSTEM_PROMPT,
        userPrompt,
        jsonSchema,
      );
      usageLevel.prompt_tokens += usage.prompt_tokens;
      usageLevel.completion_tokens += usage.completion_tokens;
      console.log(
        `[generateQuizPool] ${label} tentativa ${attempt}: ${usage.prompt_tokens} in / ${usage.completion_tokens} out tokens`,
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
        rebalanceNote = `Na tentativa anterior os passos a seguir originaram mais de ${MAX_PER_FONTE} perguntas cada: ${excedidos.join(", ")}. Gere as ${quota} perguntas de novo redistribuindo entre outros passos do material, respeitando o maximo de ${MAX_PER_FONTE} por passo.`;
        throw new Error(
          `Concentracao acima de ${MAX_PER_FONTE} por passo: ${excedidos.join(", ")}`,
        );
      }
      return validation.data.questions;
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(
        `[generateQuizPool] ${label} tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`,
      );
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Falha ao gerar a secao ${label}.`);
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
  const sections = levelSections(roadmap, nivel);
  if (sections.length === 0) {
    console.error(
      `[generateQuizPool] trilha ${slug} nao tem secoes do nivel ${nivel}; pool exige os tres niveis.`,
    );
    process.exit(1);
  }
  const quotas = sectionQuotas(sections, POOL_TARGET_PER_LEVEL);
  for (let i = 0; i < sections.length; i += 1) {
    console.log(
      `[generateQuizPool] orcamento ${nivel} / ${sections[i].title}: ${sections[i].leaves.length} folhas, cota ${quotas[i]}`,
    );
  }

  const usageLevel: Usage = { prompt_tokens: 0, completion_tokens: 0 };
  let seq = 0;
  for (let i = 0; i < sections.length; i += 1) {
    const generated = await generateSection(
      roadmap,
      nivel,
      sections[i],
      quotas[i],
      usageLevel,
    );
    for (const question of generated) {
      seq += 1;
      questions.push({
        id: `${slug}-${NIVEL_ABBR[nivel]}-${String(seq).padStart(2, "0")}`,
        nivel,
        pergunta: question.pergunta,
        alternativas: question.alternativas,
        correta: question.correta as QuizAlternativaId,
        explicacao: question.explicacao,
        fonte: question.fonte,
      });
    }
  }
  console.log(
    `[generateQuizPool] ${nivel}: ${usageLevel.prompt_tokens} in / ${usageLevel.completion_tokens} out tokens`,
  );
  usageTotal.prompt_tokens += usageLevel.prompt_tokens;
  usageTotal.completion_tokens += usageLevel.completion_tokens;
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
