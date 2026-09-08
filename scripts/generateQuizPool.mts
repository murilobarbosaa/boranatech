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
import {
  POOL_MIN_PER_LEVEL,
  POOL_TARGET_PER_LEVEL,
  type QuizNivel,
  type QuizPool,
  type QuizQuestion,
} from "../shared/roadmapQuiz/types";
import { roadmapsV2 } from "../shared/roadmapV2/content";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import { env } from "../server/lib/env";
import {
  buildOpenAIHeaders,
  DEFAULT_MODEL,
  OPENAI_BASE_URL,
} from "../server/lib/openai";
import { toOpenAIStrictSchema } from "../server/lib/openaiStrictSchema";
import {
  buildCodeRules,
  buildQuestionSchema,
  buildUserPrompt,
  codeLeafIds,
  codeQuotaFor,
  codeRuleViolations,
  codeTypeViolations,
  type GeneratedQuestion,
  levelSections,
  MAX_PER_FONTE,
  missingCodeCount,
  NIVEIS,
  normalizeGeneratedQuestion,
  overusedFontes,
  type SectionMaterial,
  sectionQuotas,
  SYSTEM_PROMPT,
} from "./quizPoolGeneration.mts";
import { NIVEL_ABBR, validateQuizPool } from "./quizPoolValidation.mts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUIZ_DIR = path.join(ROOT, "server", "data", "roadmapQuizzes");

const AI_MAX_ATTEMPTS = 5;
const AI_BACKOFF_MS = [400, 800, 800, 800];
const AI_TEMPERATURE = 0.4;
const AI_MAX_TOKENS = 4000;
// Precos do gpt-4o-mini (USD por 1M tokens), so pro log de custo.
const PRICE_INPUT_PER_M = 0.15;
const PRICE_OUTPUT_PER_M = 0.6;

// System prompt da secao: o de sempre, mais as regras de codigo quando a
// secao tem cota de codigo (so trilha com kind e codeLanguages chega aqui com
// cota > 0; trilha de area recebe SYSTEM_PROMPT byte a byte).
function systemPromptFor(roadmap: RoadmapV2, codeQuota: number): string {
  if (codeQuota <= 0 || !roadmap.codeLanguages) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n${buildCodeRules(roadmap.codeLanguages)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function generateSection(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
  section: SectionMaterial,
  quota: number,
  usageLevel: Usage,
): Promise<GeneratedQuestion[]> {
  const codeLeaves = codeLeafIds(section, roadmap.codeLanguages ?? []);
  const codeQuota = codeQuotaFor(roadmap, quota, codeLeaves.length);
  const schema = buildQuestionSchema(
    section.leaves.map((leaf) => leaf.id),
    quota,
    codeQuota,
  );
  const jsonSchema = toOpenAIStrictSchema(schema);
  const systemPrompt = systemPromptFor(roadmap, codeQuota);
  const label = `${nivel} / ${section.title}`;

  let rebalanceNote: string | null = null;
  let lastError: unknown;
  // Melhor resposta schema-valida ate agora, usada como fallback se o teto por
  // fonte nao for atingido em nenhuma tentativa. O teto (MAX_PER_FONTE) e uma
  // preferencia de qualidade, nao uma regra de validacao do pool: em secoes
  // finas (2-3 folhas) o modelo as vezes nao distribui o suficiente, e abortar
  // a trilha inteira por isso seria pior que aceitar leve concentracao. A
  // cobertura por secao continua garantida pela validacao do pool.
  let bestValid: GeneratedQuestion[] | null = null;
  // Ultima resposta schema-valida SEM violacao de regra de codigo. Se as
  // tentativas acabarem com bestValid ainda violando, esta e preferida: uma
  // resposta limpa com concentracao residual vale mais que uma concentrada
  // certa com trecho fora da regra (a validacao final reprovaria a segunda).
  let bestClean: GeneratedQuestion[] | null = null;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      const userPrompt = buildUserPrompt(
        roadmap,
        nivel,
        section,
        quota,
        rebalanceNote,
        codeQuota,
        codeLeaves,
      );
      const { parsed, usage } = await callOpenAIOnce(
        systemPrompt,
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
      bestValid = validation.data.questions;
      const excedidos = overusedFontes(validation.data.questions);
      const faltamCodigo = missingCodeCount(
        validation.data.questions,
        codeQuota,
      );
      const violacoes =
        codeQuota > 0
          ? [
              ...codeRuleViolations(
                validation.data.questions,
                roadmap.codeLanguages ?? [],
              ),
              ...codeTypeViolations(validation.data.questions, codeQuota),
            ]
          : [];
      if (violacoes.length === 0) {
        bestClean = validation.data.questions;
      }
      if (
        excedidos.length === 0 &&
        faltamCodigo === 0 &&
        violacoes.length === 0
      ) {
        return validation.data.questions;
      }
      // Notas de rebalanceamento: concentracao por fonte e, quando a secao
      // tem cota de codigo, perguntas de codigo a menos. Mesma filosofia do
      // teto por fonte: preferencia de qualidade, com bestValid de fallback.
      const notas: string[] = [];
      if (excedidos.length > 0) {
        notas.push(
          `Na tentativa anterior estes passos passaram do limite: ${excedidos.join(", ")}. REGRA DURA: nenhum passo pode originar mais de ${MAX_PER_FONTE} perguntas. Distribua as ${quota} perguntas o mais uniformemente possivel entre os ${section.leaves.length} passos do material (cerca de ${Math.ceil(quota / section.leaves.length)} por passo), cobrindo todos. Antes de responder, conte quantas perguntas voce colocou em cada fonte e corrija se alguma passar de ${MAX_PER_FONTE}.`,
        );
      }
      if (faltamCodigo > 0) {
        notas.push(
          `Na tentativa anterior vieram ${codeQuota - faltamCodigo} perguntas de codigo; precisam ser exatamente ${codeQuota}.`,
        );
      }
      if (violacoes.length > 0) {
        notas.push(
          `Na tentativa anterior estas perguntas violaram as regras de codigo; corrija SO elas e mantenha as demais como estao:\n${violacoes.map((v) => `- ${v}`).join("\n")}`,
        );
      }
      rebalanceNote = notas.join("\n");
      console.error(
        `[generateQuizPool] ${label} tentativa ${attempt}/${AI_MAX_ATTEMPTS}: ${[
          excedidos.length > 0
            ? `concentracao acima de ${MAX_PER_FONTE} (${excedidos.join(", ")})`
            : "",
          faltamCodigo > 0 ? `faltam ${faltamCodigo} de codigo` : "",
          violacoes.length > 0
            ? `${violacoes.length} violacao(oes) de regra de codigo`
            : "",
        ]
          .filter(Boolean)
          .join(", ")}, reequilibrando.`,
      );
      for (const violacao of violacoes) {
        console.error(`[generateQuizPool]     - ${violacao}`);
      }
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
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
  // Esgotou as tentativas sem atingir o teto. Prefere a ultima resposta sem
  // violacao de regra de codigo, se houve alguma; senao aceita o ultimo
  // resultado schema-valido com aviso; so falha se nenhuma resposta foi
  // schema-valida. A validacao final do pool continua sendo o portao.
  if (bestClean && bestClean !== bestValid) {
    console.warn(
      `[generateQuizPool] ${label}: aceitando a ultima resposta sem violacao de regra de codigo apos ${AI_MAX_ATTEMPTS} tentativas (a mais recente ainda violava).`,
    );
    return bestClean;
  }
  if (bestValid) {
    console.warn(
      `[generateQuizPool] ${label}: aceitando com concentracao residual apos ${AI_MAX_ATTEMPTS} tentativas (secao fina, distribuicao ideal inatingivel).`,
    );
    return bestValid;
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Falha ao gerar a secao ${label}.`);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
// --dry-run: imprime o system prompt, o user prompt de cada secao de cada
// nivel (e, com --schema, o JSON Schema strict de cada secao) sem chamar a
// OpenAI, sem exigir OPENAI_API_KEY e sem escrever arquivo. Formato estavel
// para diff, e o que se roda antes da geracao real.
const dryRun = args.includes("--dry-run");
const withSchema = args.includes("--schema");
const slug = args.find((arg) => !arg.startsWith("--"));

if (!slug) {
  console.error(
    "Uso: pnpm gen:quiz-pool <slug> [--force] [--dry-run [--schema]]",
  );
  process.exit(1);
}
const roadmap = roadmapsV2.find((entry) => entry.slug === slug);
if (!roadmap) {
  console.error(`[generateQuizPool] slug "${slug}" nao existe no agregado.`);
  process.exit(1);
}
const outFile = path.join(QUIZ_DIR, `${slug}.ts`);
if (existsSync(outFile) && !force && !dryRun) {
  console.error(
    `[generateQuizPool] ${path.relative(ROOT, outFile)} ja existe. Use --force pra regenerar (isso troca os ids e invalida tentativas registradas).`,
  );
  process.exit(1);
}
if (dryRun) {
  // Mesma montagem de secoes, alvo e cotas do laco de geracao abaixo, so que
  // imprimindo em vez de chamar a IA. Nivel sem secao aborta igual.
  // As regras de codigo entram no SYSTEM se ALGUMA secao tiver cota de
  // codigo maior que zero, o mesmo criterio de generateSection secao a secao.
  const algumaCota = NIVEIS.some((nivel) =>
    levelSections(roadmap, nivel).some(
      (section) =>
        codeQuotaFor(
          roadmap,
          2,
          codeLeafIds(section, roadmap.codeLanguages ?? []).length,
        ) > 0,
    ),
  );
  const lines: string[] = [
    "### SYSTEM",
    systemPromptFor(roadmap, algumaCota ? 1 : 0),
  ];
  for (const nivel of NIVEIS) {
    const sections = levelSections(roadmap, nivel);
    if (sections.length === 0) {
      console.error(
        `[generateQuizPool] trilha ${slug} nao tem secoes do nivel ${nivel}; pool exige os tres niveis.`,
      );
      process.exit(1);
    }
    const levelLeaves = sections.reduce(
      (sum, section) => sum + section.leaves.length,
      0,
    );
    const levelTarget = Math.min(
      POOL_TARGET_PER_LEVEL,
      levelLeaves * MAX_PER_FONTE,
    );
    if (levelTarget < POOL_MIN_PER_LEVEL) {
      console.error(
        `[generateQuizPool] nivel ${nivel} de ${slug} comporta no maximo ${levelTarget} perguntas (${levelLeaves} folhas x ${MAX_PER_FONTE}), abaixo do minimo ${POOL_MIN_PER_LEVEL}.`,
      );
      process.exit(1);
    }
    const quotas = sectionQuotas(sections, levelTarget);
    for (let i = 0; i < sections.length; i += 1) {
      const codeLeaves = codeLeafIds(sections[i], roadmap.codeLanguages ?? []);
      const codeQuota = codeQuotaFor(roadmap, quotas[i], codeLeaves.length);
      lines.push(
        `### ${nivel} / ${sections[i].title} / cota ${quotas[i]}`,
        buildUserPrompt(
          roadmap,
          nivel,
          sections[i],
          quotas[i],
          null,
          codeQuota,
          codeLeaves,
        ),
      );
      if (withSchema) {
        const schema = buildQuestionSchema(
          sections[i].leaves.map((leaf) => leaf.id),
          quotas[i],
          codeQuota,
        );
        lines.push(
          `### SCHEMA ${nivel} / ${sections[i].title}`,
          JSON.stringify(toOpenAIStrictSchema(schema)),
        );
      }
    }
  }
  process.stdout.write(lines.join("\n") + "\n");
  process.exit(0);
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
  // Alvo do nivel adaptado a capacidade: um nivel com poucas folhas nao
  // comporta 15 perguntas com o teto de MAX_PER_FONTE por folha. Reduzimos o
  // alvo pra capacidade real (folhas x teto) em vez de estourar; abaixo do
  // minimo por nivel, aborta com aviso (o nivel e fino demais pra prova).
  const levelLeaves = sections.reduce(
    (sum, section) => sum + section.leaves.length,
    0,
  );
  const levelTarget = Math.min(
    POOL_TARGET_PER_LEVEL,
    levelLeaves * MAX_PER_FONTE,
  );
  if (levelTarget < POOL_MIN_PER_LEVEL) {
    console.error(
      `[generateQuizPool] nivel ${nivel} de ${slug} comporta no maximo ${levelTarget} perguntas (${levelLeaves} folhas x ${MAX_PER_FONTE}), abaixo do minimo ${POOL_MIN_PER_LEVEL}.`,
    );
    process.exit(1);
  }
  const quotas = sectionQuotas(sections, levelTarget);
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
      questions.push(
        normalizeGeneratedQuestion(
          question,
          `${slug}-${NIVEL_ABBR[nivel]}-${String(seq).padStart(2, "0")}`,
          nivel,
        ),
      );
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
