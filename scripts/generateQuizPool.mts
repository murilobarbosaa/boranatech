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
  codeQuotaWarnings,
  codeRuleViolations,
  codeTypeViolations,
  execViolations,
  type GateSection,
  type GeneratedQuestion,
  levelSections,
  MAX_PER_FONTE,
  MAX_QUOTA_PER_SECTION,
  missingCodeCount,
  NIVEIS,
  normalizeGeneratedQuestion,
  overusedFontes,
  poolGateViolations,
  type SectionMaterial,
  sectionQuotaWarnings,
  sectionQuotas,
  SYSTEM_PROMPT,
} from "./quizPoolGeneration.mts";
import { NIVEL_ABBR, validateQuizPool } from "./quizPoolValidation.mts";
import {
  type Executor,
  makeExecutor,
  runnerFor,
} from "./verifyQuizPoolByExecution.mts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUIZ_DIR = path.join(ROOT, "server", "data", "roadmapQuizzes");
// Destino do despejo de pool reprovada: fora do worktree de proposito, para
// nunca virar arquivo nao rastreado nem entrar num commit por engano.
const REJECTED_DIR = "/tmp";

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
  executarPor: ((linguagem: string) => Executor | null) | null,
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
  // O que ficou pendente na resposta guardada em bestValid, por classe, para
  // o fallback dizer o motivo real em vez de supor concentracao.
  let pendenciasBestValid: string[] = [];
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
      // As tres classes de violacao de codigo em separado, para o fallback
      // nomear a que ficou pendente; `violacoes` junta as tres na ordem de
      // sempre, entao a nota de rebalanceamento do retry nao muda.
      const regra =
        codeQuota > 0
          ? codeRuleViolations(
              validation.data.questions,
              roadmap.codeLanguages ?? [],
              undefined,
              codeLeaves,
            )
          : [];
      const variedade =
        codeQuota > 0
          ? codeTypeViolations(validation.data.questions, codeQuota)
          : [];
      const execucao =
        codeQuota > 0 && executarPor
          ? execViolations(
              validation.data.questions,
              roadmap.codeLanguages ?? [],
              executarPor,
            )
          : [];
      const violacoes = [...regra, ...variedade, ...execucao];
      pendenciasBestValid = [
        ...(excedidos.length > 0
          ? [
              `concentracao: passos acima de ${MAX_PER_FONTE} perguntas (${excedidos.join(", ")})`,
            ]
          : []),
        ...(faltamCodigo > 0
          ? [`cota de codigo: faltam ${faltamCodigo} de ${codeQuota}`]
          : []),
        ...regra.map((violacao) => `regra de codigo: ${violacao}`),
        // codeTypeViolations ja devolve cada linha com o prefixo "variedade:".
        ...variedade,
        ...execucao.map((violacao) => `execucao: ${violacao}`),
      ];
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
      `[generateQuizPool] ${label}: aceitando a ultima resposta valida no schema apos ${AI_MAX_ATTEMPTS} tentativas, com ${pendenciasBestValid.length} pendencia(s); o portao final da pool confere de novo:`,
    );
    for (const pendencia of pendenciasBestValid) {
      console.warn(`[generateQuizPool]     - ${pendencia}`);
    }
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
// --no-exec: nao executa os trechos de codigo dentro do retry (para ambiente
// sem o runner da linguagem). Com execucao ligada, um executor por linguagem
// com runner (js, python) e criado uma vez por rodada e reaproveitado; o
// dry-run nunca executa nada.
const noExec = args.includes("--no-exec");
const executores = new Map<string, Executor>();
const executarPor = (linguagem: string): Executor | null => {
  const runner = runnerFor(linguagem);
  if (!runner) return null;
  let executar = executores.get(linguagem);
  if (!executar) {
    executar = makeExecutor(runner);
    executores.set(linguagem, executar);
  }
  return executar;
};
const slug = args.find((arg) => !arg.startsWith("--"));

if (!slug) {
  console.error(
    "Uso: pnpm gen:quiz-pool <slug> [--force] [--dry-run [--schema]] [--no-exec]",
  );
  process.exit(1);
}
const roadmap = roadmapsV2.find((entry) => entry.slug === slug);
if (!roadmap) {
  console.error(`[generateQuizPool] slug "${slug}" nao existe no agregado.`);
  process.exit(1);
}
// Teto de cota por secao so em trilha com codeLanguages: as trilhas de area
// tem 40 combinacoes de nivel com duas secoes e 15 perguntas, e as pools
// delas ja publicadas foram geradas sem teto (medido no Lote 06b).
const maxPerSection =
  roadmap.codeLanguages && roadmap.codeLanguages.length > 0
    ? MAX_QUOTA_PER_SECTION
    : undefined;
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
    const quotas = sectionQuotas(sections, levelTarget, maxPerSection);
    for (const aviso of sectionQuotaWarnings(
      sections,
      levelTarget,
      maxPerSection,
    )) {
      // stderr de proposito: o stdout do dry-run entra em diff.
      console.error(`[generateQuizPool] [aviso] ${nivel}: ${aviso}`);
    }
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
const gateSections: GateSection[] = [];
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
  const quotas = sectionQuotas(sections, levelTarget, maxPerSection);
  for (const aviso of sectionQuotaWarnings(
    sections,
    levelTarget,
    maxPerSection,
  )) {
    console.warn(`[generateQuizPool] [aviso] ${nivel}: ${aviso}`);
  }
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
      noExec ? null : executarPor,
    );
    const ids: string[] = [];
    for (const question of generated) {
      seq += 1;
      const id = `${slug}-${NIVEL_ABBR[nivel]}-${String(seq).padStart(2, "0")}`;
      ids.push(id);
      questions.push(normalizeGeneratedQuestion(question, id, nivel));
    }
    // Cota de codigo da secao pela mesma conta de generateSection (e do
    // dry-run), para o portao final conferir a variedade no escopo do laco.
    gateSections.push({
      label: `${nivel} / ${sections[i].title}`,
      codeQuota: codeQuotaFor(
        roadmap,
        quotas[i],
        codeLeafIds(sections[i], roadmap.codeLanguages ?? []).length,
      ),
      ids,
      eligible: codeLeafIds(sections[i], roadmap.codeLanguages ?? []),
    });
  }
  console.log(
    `[generateQuizPool] ${nivel}: ${usageLevel.prompt_tokens} in / ${usageLevel.completion_tokens} out tokens`,
  );
  usageTotal.prompt_tokens += usageLevel.prompt_tokens;
  usageTotal.completion_tokens += usageLevel.completion_tokens;
}

// Conteudo do arquivo da pool. Serializador UNICO: o arquivo final e o
// despejo da pool reprovada saem daqui, entao o despejo copiado para
// server/data/roadmapQuizzes/ e byte a byte o que a geracao escreveria.
function poolFileContent(pool: QuizPool): string {
  return `// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool ${pool.slug}). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = ${JSON.stringify(pool, null, 2)};

export default pool;
`;
}

function custoLinha(): string {
  const cost =
    (usageTotal.prompt_tokens / 1_000_000) * PRICE_INPUT_PER_M +
    (usageTotal.completion_tokens / 1_000_000) * PRICE_OUTPUT_PER_M;
  return `tokens: ${usageTotal.prompt_tokens} in / ${usageTotal.completion_tokens} out; custo estimado USD ${cost.toFixed(4)}`;
}

const pool: QuizPool = { slug, questions };
const problems = validateQuizPool(pool, slug, roadmap);
// Portao final com a bateria completa do retry (poolGateViolations): o laco
// aceita resposta ainda violando pelo fallback, entao so a estrutura
// (validateQuizPool) deixaria passar correta errada por execucao, erro sem
// defeito e distrator equivalente. Roda mesmo quando a estrutura ja reprovou,
// para a lista de pendencias sair inteira de uma vez.
const violacoes = poolGateViolations(
  questions,
  gateSections,
  roadmap.codeLanguages ?? [],
  noExec ? null : executarPor,
);
// Cota de codigo por nivel: AVISO no stdout, nunca bloqueio. Bloquear
// obrigaria a autorar codigo a mao em toda secao que esgota tentativas; o
// aviso deixa a decisao com quem revisa. Ver codeQuotaWarnings.
for (const aviso of codeQuotaWarnings(questions, gateSections)) {
  console.log(`[portao] [aviso] ${aviso}`);
}
if (problems.length > 0 || violacoes.length > 0) {
  for (const problem of problems) {
    console.error(`[generateQuizPool] ${problem}`);
  }
  for (const violacao of violacoes) {
    console.error(`[generateQuizPool] ${violacao}`);
  }
  // Despejo da pool reprovada. O conteudo gerado custa dinheiro e tempo, e
  // reprovar nao pode significar perder tudo: com o arquivo no formato final
  // e a lista de violacoes por id, a correcao a mao mantendo os ids substitui
  // uma nova geracao (foi o que funcionou no Lote 04e, 12 perguntas).
  const rejeitada = path.join(REJECTED_DIR, `${slug}-rejeitada.ts`);
  const listaViolacoes = path.join(
    REJECTED_DIR,
    `${slug}-rejeitada-violacoes.txt`,
  );
  // Os problemas de validateQuizPool vem como "pool <slug>, pergunta <id>:";
  // tirar o prefixo deixa o id no inicio da linha. Problema da pool inteira
  // (contagem por nivel, cobertura de secao) nao tem id e fica como veio.
  const prefixoPergunta = `pool ${slug}, pergunta `;
  writeFileSync(rejeitada, poolFileContent(pool));
  writeFileSync(
    listaViolacoes,
    [
      ...problems.map((problem) =>
        problem.startsWith(prefixoPergunta)
          ? problem.slice(prefixoPergunta.length)
          : problem,
      ),
      ...violacoes,
    ].join("\n") + "\n",
  );
  console.error(`[generateQuizPool] ${custoLinha()}`);
  console.error(
    `[generateQuizPool] pool invalido, nada foi salvo em ${path.relative(ROOT, outFile)}.`,
  );
  console.error(`[generateQuizPool] pool reprovada: ${rejeitada}`);
  console.error(`[generateQuizPool] violacoes por id: ${listaViolacoes}`);
  console.error(
    `[generateQuizPool] O caminho e corrigir a mao mantendo os ids: copiar a pool reprovada para ${path.relative(ROOT, outFile)}, editar so as perguntas listadas e conferir com pnpm verify:quiz-pool ${slug}. Gerar de novo troca o conteudo inteiro e custa outra rodada.`,
  );
  process.exit(1);
}

mkdirSync(QUIZ_DIR, { recursive: true });
writeFileSync(outFile, poolFileContent(pool));

console.log(
  `[generateQuizPool] ${questions.length} perguntas -> ${path.relative(process.cwd(), outFile)}`,
);
console.log(`[generateQuizPool] ${custoLinha()}`);
