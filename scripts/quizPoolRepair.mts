// Reparo por pergunta de uma pool reprovada (pnpm gen:quiz-pool <slug>
// --repair <pool.ts>). So a pergunta com violacao volta ao modelo, uma de cada
// vez, com as violacoes dela, a evidencia de execucao literal e o material da
// fonte; a pergunta limpa nao e tocada e nenhum id muda. Existe porque tres
// geracoes da trilha de Python (Lotes 06c a 06e) reprovaram entre 38% e 61%
// das perguntas de codigo, e regenerar a secao inteira a cada tentativa fazia
// as violacoes trocarem de pergunta em vez de sumir.
// Puro em relacao a rede e ao disco: a chamada ao modelo e o executor entram
// por parametro, e o teste simula os dois.
import { toOpenAIStrictSchema } from "../server/lib/openaiStrictSchema";
import {
  isCodeQuestion,
  POOL_TARGET_PER_LEVEL,
  type QuizQuestion,
  type QuizTipo,
} from "../shared/roadmapQuiz/types";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import {
  buildQuestionSchema,
  codeLeafIds,
  codeQuotaFor,
  codeRuleViolations,
  codeTypeViolations,
  execViolations,
  type GateSection,
  levelSections,
  MAX_PER_FONTE,
  NIVEIS,
  normalizeGeneratedQuestion,
  type Rotulo,
  type SectionMaterial,
  sectionQuotas,
  toGeneratedQuestion,
} from "./quizPoolGeneration.mts";
import {
  type Execucao,
  type Executor,
  fillGap,
} from "./verifyQuizPoolByExecution.mts";

export const REPAIR_MAX_RODADAS = 3;

export interface Uso {
  prompt_tokens: number;
  completion_tokens: number;
}

export type ChamarModelo = (
  system: string,
  user: string,
  jsonSchema: Record<string, unknown>,
) => Promise<{ parsed: unknown; usage: Uso }>;

interface SecaoMontada {
  gate: GateSection;
  material: SectionMaterial;
}

// Secoes da pool reconstruidas a partir da trilha, com a MESMA conta de alvo e
// cotas da geracao (levelSections, alvo do nivel, sectionQuotas,
// codeQuotaFor): a pool lida do disco nao carrega as secoes, e o portao
// precisa delas para variedade, elegibilidade e aviso de cota. Pergunta cuja
// fonte nao cai em secao do nivel dela aborta, em vez de ficar fora da
// conferencia.
function montarSecoes(
  roadmap: RoadmapV2,
  questions: QuizQuestion[],
  maxPerSection?: number,
): SecaoMontada[] {
  const langs = roadmap.codeLanguages ?? [];
  const out: SecaoMontada[] = [];
  for (const nivel of NIVEIS) {
    const sections = levelSections(roadmap, nivel);
    if (sections.length === 0) continue;
    const levelLeaves = sections.reduce(
      (sum, section) => sum + section.leaves.length,
      0,
    );
    const levelTarget = Math.min(
      POOL_TARGET_PER_LEVEL,
      levelLeaves * MAX_PER_FONTE,
    );
    const quotas = sectionQuotas(sections, levelTarget, maxPerSection);
    sections.forEach((section, i) => {
      const folhas = new Set(section.leaves.map((leaf) => leaf.id));
      const eligible = codeLeafIds(section, langs);
      out.push({
        gate: {
          label: `${nivel} / ${section.title}`,
          codeQuota: codeQuotaFor(roadmap, quotas[i], eligible.length),
          ids: questions
            .filter(
              (question) =>
                question.nivel === nivel && folhas.has(question.fonte),
            )
            .map((question) => question.id),
          eligible,
        },
        material: section,
      });
    });
  }
  const cobertas = new Set(out.flatMap((secao) => secao.gate.ids));
  const orfas = questions.filter((question) => !cobertas.has(question.id));
  if (orfas.length > 0) {
    throw new Error(
      `[quizPoolRepair] perguntas cuja fonte nao cai em secao do nivel delas: ${orfas.map((question) => question.id).join(", ")}`,
    );
  }
  return out;
}

export function gateSectionsForPool(
  roadmap: RoadmapV2,
  questions: QuizQuestion[],
  maxPerSection?: number,
): GateSection[] {
  return montarSecoes(roadmap, questions, maxPerSection).map(
    (secao) => secao.gate,
  );
}

function formatarExecucao(r: Execucao): string {
  if (r.timeout) return "estourou o tempo limite";
  return `status ${r.status}; stdout ${JSON.stringify(r.stdout.trimEnd())}; erro ${JSON.stringify(r.erro)}`;
}

// O que o trecho realmente faz ao rodar, literal: em completar, com cada
// alternativa na lacuna; nos demais tipos, o trecho como esta. E a evidencia
// que a nota de execucao sozinha nao dava ("obtido=X correta=Y"), e sem ela a
// classe de execucao ficou em 8 violacoes finais nos Lotes 06d e 06e.
export function evidenciaDeExecucao(
  question: QuizQuestion,
  codeLanguages: string[],
  executarPor: ((linguagem: string) => Executor | null) | null,
): string[] {
  const codigo = question.codigo;
  if (
    !executarPor ||
    !codigo ||
    !isCodeQuestion(question) ||
    !codeLanguages.includes(codigo.linguagem)
  ) {
    return [];
  }
  const executar = executarPor(codigo.linguagem);
  if (!executar) return [];
  if (question.tipo === "completar") {
    return (["a", "b", "c", "d"] as const).map(
      (alt) =>
        `com a alternativa ${alt}${alt === question.correta ? " (a marcada como correta)" : ""} na lacuna: ${formatarExecucao(executar(fillGap(codigo.trecho, question.alternativas[alt])))}`,
    );
  }
  return [`o trecho como esta: ${formatarExecucao(executar(codigo.trecho))}`];
}

export function buildRepairPrompt(input: {
  roadmap: RoadmapV2;
  secao: string;
  material: SectionMaterial;
  atual: QuizQuestion;
  problemas: string[];
  evidencia: string[];
  tipoAlvo: QuizTipo | null;
  inelegivel: boolean;
  eligible: string[];
}): string {
  const { atual } = input;
  const folha = input.material.leaves.find((leaf) => leaf.id === atual.fonte);
  const tipo = atual.tipo ?? "conceito";
  const regraTipo = input.tipoAlvo
    ? `Reescreva esta pergunta como tipo ${input.tipoAlvo}, sobre a mesma fonte: a secao precisa desse tipo.`
    : input.inelegivel
      ? `Troque o tipo para conceito, mantendo a fonte, ou use como fonte um destes passos, que tem trecho autocontido: ${input.eligible.join(", ")}.`
      : `Mantenha o tipo ${tipo} e a fonte ${atual.fonte}.`;
  return [
    `Trilha: ${input.roadmap.title} (area ${input.roadmap.area})`,
    `Secao: ${input.secao}`,
    "Esta pergunta de quiz foi reprovada pela verificacao automatica. Devolva a MESMA pergunta corrigida: em questions, exatamente uma pergunta, sobre o mesmo assunto. Corrija SO o que esta listado abaixo e mantenha o resto.",
    regraTipo,
    "",
    "Pergunta atual (JSON):",
    JSON.stringify(toGeneratedQuestion(atual), null, 2),
    "",
    "Problemas encontrados:",
    ...input.problemas.map((problema) => `- ${problema}`),
    ...(input.evidencia.length > 0
      ? [
          "",
          "Evidencia de execucao (o que o trecho realmente faz ao rodar; a correta tem que bater com isto):",
          ...input.evidencia.map((linha) => `- ${linha}`),
        ]
      : []),
    "",
    `Material da fonte (${atual.fonte}):`,
    ...(folha
      ? [`### ${folha.id} | ${folha.title}`, folha.description, folha.content]
      : []),
  ]
    .filter((linha) => linha !== undefined)
    .join("\n");
}

// Tipo e fonte so mudam quando a violacao manda: variedade atribuida a esta
// pergunta (vira o tipo que falta na secao) ou fonte sem trecho autocontido
// (vira conceito, ou passa para uma fonte elegivel). Fora disso, o modelo
// "corrigir" trocando de tipo e fugir da pergunta, nao consertar.
function recusasDePermissao(
  original: QuizQuestion,
  candidata: QuizQuestion,
  ctx: { tipoAlvo: QuizTipo | null; inelegivel: boolean; eligible: string[] },
): string[] {
  const out: string[] = [];
  const tipos = new Set<string>([original.tipo ?? "conceito"]);
  if (ctx.tipoAlvo) tipos.add(ctx.tipoAlvo);
  if (ctx.inelegivel) tipos.add("conceito");
  const tipoNovo = candidata.tipo ?? "conceito";
  if (!tipos.has(tipoNovo)) {
    out.push(
      `o tipo tem que continuar ${[...tipos].join(" ou ")}; veio ${tipoNovo}`,
    );
  }
  const fontes = new Set<string>([original.fonte]);
  if (ctx.inelegivel) ctx.eligible.forEach((fonte) => fontes.add(fonte));
  if (!fontes.has(candidata.fonte)) {
    out.push(
      `a fonte tem que continuar ${original.fonte}${ctx.inelegivel ? " ou um passo com trecho autocontido" : ""}; veio ${candidata.fonte}`,
    );
  }
  return out;
}

export interface LinhaDeReparo {
  id: string;
  rodadas: number;
  antes: { regra: number; execucao: number; variedade: number };
  resultado: "reparada" | "suja" | "orcamento";
  // O que sobrou, quando nao reparada.
  pendencias: string[];
}

export async function repairPool(input: {
  roadmap: RoadmapV2;
  questions: QuizQuestion[];
  systemPrompt: string;
  callModel: ChamarModelo;
  executarPor: ((linguagem: string) => Executor | null) | null;
  custo: (uso: Uso) => number;
  orcamentoUsd: number;
  maxPerSection?: number;
  maxRodadas?: number;
  log?: (linha: string) => void;
}): Promise<{
  questions: QuizQuestion[];
  linhas: LinhaDeReparo[];
  uso: Uso;
  estourouOrcamento: boolean;
}> {
  const { roadmap, executarPor } = input;
  const langs = roadmap.codeLanguages ?? [];
  const maxRodadas = input.maxRodadas ?? REPAIR_MAX_RODADAS;
  const log = input.log ?? (() => {});
  const pool = [...input.questions];
  const indice = new Map(pool.map((question, i) => [question.id, i]));
  const secoes = montarSecoes(roadmap, pool, input.maxPerSection);
  const uso: Uso = { prompt_tokens: 0, completion_tokens: 0 };
  const linhas: LinhaDeReparo[] = [];
  let estourou = false;
  // A nota que vai ao modelo fala "desta pergunta": o id nao ajuda ele.
  const rotulo: Rotulo = () => "esta pergunta";

  const proprias = (question: QuizQuestion, gate: GateSection) => {
    const g = [toGeneratedQuestion(question)];
    return {
      regra: codeRuleViolations(g, langs, rotulo, gate.eligible),
      execucao: executarPor
        ? execViolations(g, langs, executarPor, rotulo)
        : [],
    };
  };
  const daPool = (id: string) => pool[indice.get(id) as number];
  const variedadeDa = (gate: GateSection, substituta?: QuizQuestion) =>
    codeTypeViolations(
      gate.ids.map((id) =>
        toGeneratedQuestion(
          substituta && substituta.id === id ? substituta : daPool(id),
        ),
      ),
      gate.codeQuota,
    );

  for (const { gate, material } of secoes) {
    const sujas = gate.ids.map(daPool).filter((question) => {
      const p = proprias(question, gate);
      return p.regra.length + p.execucao.length > 0;
    });
    // Variedade e da SECAO: so pode ser atribuida a uma pergunta que ja esta
    // suja, porque o reparo nunca toca pergunta limpa. Escolhe a de tipo mais
    // frequente, a ultima em caso de empate. Sem suja de codigo na secao, a
    // variedade fica para a mao.
    const variedadeInicial = variedadeDa(gate);
    let alvo: { id: string; tipo: QuizTipo } | null = null;
    if (variedadeInicial.length > 0) {
      const tipos = gate.ids
        .map(daPool)
        .filter((question) => isCodeQuestion(question))
        .map((question) => question.tipo as QuizTipo);
      const conta = (tipo: QuizTipo) => tipos.filter((t) => t === tipo).length;
      const faltando =
        (["completar", "erro", "saida"] as QuizTipo[]).find(
          (tipo) => conta(tipo) === 0,
        ) ?? (conta("completar") <= conta("erro") ? "completar" : "erro");
      const candidatas = sujas.filter(
        (question) => isCodeQuestion(question) && question.tipo !== faltando,
      );
      if (candidatas.length > 0) {
        const maior = Math.max(
          ...candidatas.map((question) => conta(question.tipo as QuizTipo)),
        );
        const escolhida = [...candidatas]
          .reverse()
          .find((question) => conta(question.tipo as QuizTipo) === maior);
        if (escolhida) alvo = { id: escolhida.id, tipo: faltando };
      } else {
        log(
          `${gate.label}: variedade sem pergunta suja para reparar (${variedadeInicial.join("; ")}); fica para a mao`,
        );
      }
    }

    for (const original of sujas) {
      const i = indice.get(original.id) as number;
      const p0 = proprias(original, gate);
      const tipoAlvo = alvo?.id === original.id ? alvo.tipo : null;
      const inelegivel =
        isCodeQuestion(original) &&
        !(gate.eligible ?? []).includes(original.fonte);
      const variedadeAntes = variedadeDa(gate);
      const linha: LinhaDeReparo = {
        id: original.id,
        rodadas: 0,
        antes: {
          regra: p0.regra.length,
          execucao: p0.execucao.length,
          variedade: tipoAlvo ? variedadeAntes.length : 0,
        },
        resultado: "suja",
        pendencias: [],
      };
      const schema = buildQuestionSchema(
        material.leaves.map((leaf) => leaf.id),
        1,
        gate.codeQuota > 0 ? 1 : 0,
      );
      const jsonSchema = toOpenAIStrictSchema(schema);
      let atual = original;
      let execucaoAtual = p0.execucao;
      let problemas = [
        ...p0.regra,
        ...p0.execucao,
        ...(tipoAlvo
          ? variedadeAntes.map((v) => `${v} (na secao ${gate.label})`)
          : []),
      ];
      for (let rodada = 1; rodada <= maxRodadas; rodada += 1) {
        if (estourou || input.custo(uso) >= input.orcamentoUsd) {
          estourou = true;
          linha.resultado = "orcamento";
          break;
        }
        linha.rodadas = rodada;
        const user = buildRepairPrompt({
          roadmap,
          secao: gate.label,
          material,
          atual,
          problemas,
          evidencia:
            execucaoAtual.length > 0
              ? evidenciaDeExecucao(atual, langs, executarPor)
              : [],
          tipoAlvo,
          inelegivel,
          eligible: gate.eligible ?? [],
        });
        let candidata: QuizQuestion;
        try {
          const { parsed, usage } = await input.callModel(
            input.systemPrompt,
            user,
            jsonSchema,
          );
          uso.prompt_tokens += usage.prompt_tokens;
          uso.completion_tokens += usage.completion_tokens;
          const validacao = schema.safeParse(parsed);
          if (!validacao.success) {
            problemas = [
              ...problemas,
              "a resposta anterior veio fora do schema: devolva exatamente uma pergunta",
            ];
            continue;
          }
          candidata = normalizeGeneratedQuestion(
            validacao.data.questions[0],
            original.id,
            original.nivel,
          );
        } catch (err) {
          const detalhe = err instanceof Error ? err.message : String(err);
          problemas = [...problemas, `a resposta anterior falhou: ${detalhe}`];
          continue;
        }
        const recusas = recusasDePermissao(original, candidata, {
          tipoAlvo,
          inelegivel,
          eligible: gate.eligible ?? [],
        });
        const p = proprias(candidata, gate);
        const variedadeDepois = variedadeDa(gate, candidata);
        const piorou = variedadeDepois.length > variedadeAntes.length;
        const naoResolveu =
          tipoAlvo !== null && variedadeDepois.length >= variedadeAntes.length;
        if (
          recusas.length === 0 &&
          p.regra.length === 0 &&
          p.execucao.length === 0 &&
          !piorou &&
          !naoResolveu
        ) {
          pool[i] = candidata;
          linha.resultado = "reparada";
          break;
        }
        // Resposta que trocou tipo ou fonte sem permissao nao vira base da
        // proxima rodada: o modelo recebe de novo a pergunta anterior.
        if (recusas.length === 0) {
          atual = candidata;
          execucaoAtual = p.execucao;
        }
        problemas = [
          ...recusas,
          ...p.regra,
          ...p.execucao,
          ...(piorou
            ? [
                `a troca piorou a variedade da secao: ${variedadeDepois.join("; ")}`,
              ]
            : []),
          ...(naoResolveu && !piorou
            ? variedadeDepois.map((v) => `${v} (na secao ${gate.label})`)
            : []),
        ];
      }
      if (linha.resultado !== "reparada") linha.pendencias = problemas;
      log(
        `${original.id}: ${linha.rodadas} rodada(s), antes regra ${linha.antes.regra} / execucao ${linha.antes.execucao} / variedade ${linha.antes.variedade}: ${linha.resultado}`,
      );
      linhas.push(linha);
    }
  }
  return { questions: pool, linhas, uso, estourouOrcamento: estourou };
}
