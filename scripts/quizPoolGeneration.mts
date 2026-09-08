// Logica PURA do gerador de pool de quiz (scripts/generateQuizPool.mts):
// material das folhas, secoes por nivel, orcamento por secao, schema da
// resposta, prompts e checagens de distribuicao. Nada aqui toca fetch, fs,
// env ou process, entao o modulo pode ser importado por teste sem disparar o
// gerador (o script executa codigo de topo ao ser importado). O texto dos
// prompts e o schema foram movidos do script sem alteracao: o dry-run das
// trilhas de area e identico antes e depois da extracao.
import { z } from "zod";
import type {
  QuizNivel,
  QuizQuestion,
  QuizTipo,
} from "../shared/roadmapQuiz/types";
import {
  CODE_MAX_LINE_LENGTH,
  CODE_MAX_LINES,
  CODE_PLACEHOLDER,
  CODE_QUESTION_TIPOS,
  isCodeQuestion,
} from "../shared/roadmapQuiz/types";
import type { RoadmapNode, RoadmapV2 } from "../shared/roadmapV2/types";

export const NIVEIS: QuizNivel[] = ["iniciante", "intermediario", "avancado"];
export const MAX_PER_FONTE = 3;

export interface LeafMaterial {
  id: string;
  title: string;
  description: string;
  content: string;
}

export function collectLeaves(nodes: RoadmapNode[], out: LeafMaterial[]) {
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
export interface SectionMaterial {
  title: string;
  leaves: LeafMaterial[];
}

export function levelSections(
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
export function sectionQuotas(
  sections: SectionMaterial[],
  target: number,
): number[] {
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

// Resposta de UMA pergunta como o modelo a devolve. Os tres campos de codigo
// so existem no schema quando a secao tem cota de codigo, e la a pergunta e
// uma uniao discriminada por `tipo` (buildQuestionSchema): conceito com
// `codigo` null, tipos de codigo com `codigo` objeto obrigatorio. Esta
// interface e o superconjunto dos dois ramos; `codigo` nulo so existe no ramo
// conceito.
export interface GeneratedQuestion {
  pergunta: string;
  alternativas: { a: string; b: string; c: string; d: string };
  correta: "a" | "b" | "c" | "d";
  explicacao: string;
  fonte: string;
  tipo?: QuizTipo;
  codigo?: { linguagem: string; trecho: string } | null;
  alternativasCodigo?: boolean;
}

export function buildQuestionSchema(
  leafIds: string[],
  count: number,
  codeQuota = 0,
): z.ZodType<{ questions: GeneratedQuestion[] }> {
  const base = {
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
  };
  // Com cota de codigo a pergunta e uma uniao discriminada por tipo, e nao um
  // objeto com `codigo` nullable: no 04c o modelo devolveu cinco vezes uma
  // pergunta de tipo erro com codigo null, que o schema antigo aceitava e a
  // normalizacao rejeitava. Aqui o estado invalido nao existe na forma que a
  // API obriga. z.union (e nao discriminatedUnion) porque o zod serializa a
  // primeira como anyOf, que e a forma que o strict mode da OpenAI aceita, e
  // a segunda como oneOf.
  const question =
    codeQuota > 0
      ? z.union([
          z.object({
            ...base,
            tipo: z.literal("conceito"),
            codigo: z.null(),
            alternativasCodigo: z.literal(false),
          }),
          z.object({
            ...base,
            tipo: z.enum(["completar", "erro", "saida"]),
            codigo: z.object({ linguagem: z.string(), trecho: z.string() }),
            alternativasCodigo: z.boolean(),
          }),
        ])
      : z.object(base);
  return z.object({
    questions: z.array(question).min(count).max(count),
  });
}

export const SYSTEM_PROMPT = [
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

// Proporcao de perguntas de codigo por tipo de trilha. Trilha sem kind, de
// carreira ou sem codeLanguages tem cota zero: as pools de area seguem
// identicas as de hoje.
export const CODE_SHARE_BY_KIND: Record<
  "linguagem" | "framework" | "ferramenta",
  number
> = {
  linguagem: 0.5,
  framework: 0.5,
  ferramenta: 0.4,
};

// Teto de perguntas de codigo por passo que tem cerca de codigo. Junto com
// MAX_PER_FONTE (3), um passo com codigo pode originar ate 3 perguntas, das
// quais no maximo 2 de codigo.
export const MAX_CODE_PER_LEAF = 2;

// Ids das folhas da secao cujo content tem pelo menos uma cerca markdown numa
// das linguagens da trilha (```js, ```ts...). Cerca de outra linguagem, como
// a ```json do package.json numa trilha de JavaScript, nao conta: o modelo
// so consegue escrever pergunta de codigo onde o material tem codigo.
export function codeLeafIds(
  section: SectionMaterial,
  codeLanguages: string[],
): string[] {
  if (codeLanguages.length === 0) return [];
  const langs = codeLanguages
    .map((lang) => lang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp("```(?:" + langs + ")[ \\t]*\\n");
  return section.leaves
    .filter((leaf) => re.test(leaf.content))
    .map((leaf) => leaf.id);
}

// Quantas das `quota` perguntas de uma secao devem ser de codigo. Zero para
// trilha sem kind, de carreira ou sem codeLanguages (as pools de area seguem
// identicas as de hoje) e zero quando nenhum passo da secao tem cerca de
// codigo na linguagem da trilha (codeLeafCount). Com share > 0 e quota >= 2,
// pelo menos 1; tetos de quota - 1 (uma secao nunca fica so com codigo) e de
// codeLeafCount x MAX_CODE_PER_LEAF (o modelo so tem de onde tirar codigo nos
// passos que o trazem).
export function codeQuotaFor(
  roadmap: Pick<RoadmapV2, "kind" | "codeLanguages">,
  quota: number,
  codeLeafCount: number,
): number {
  const { kind, codeLanguages } = roadmap;
  if (!kind || kind === "carreira") return 0;
  if (!codeLanguages || codeLanguages.length === 0) return 0;
  if (codeLeafCount <= 0) return 0;
  const share = CODE_SHARE_BY_KIND[kind];
  if (share <= 0 || quota < 2) return 0;
  const bruto = Math.round(quota * share);
  const porFolha = codeLeafCount * MAX_CODE_PER_LEAF;
  return Math.min(Math.max(bruto, 1), quota - 1, porFolha);
}

// Regras das perguntas de codigo, anexadas ao SYSTEM_PROMPT so quando a secao
// tem cota de codigo. O SYSTEM_PROMPT em si nao muda: trilha de area recebe
// byte a byte o prompt de sempre.
export function buildCodeRules(codeLanguages: string[]): string {
  return [
    "Regras adicionais para perguntas de CODIGO (esta trilha tem cota de perguntas de codigo):",
    "- Campo tipo em toda pergunta: conceito, completar, erro ou saida.",
    "- conceito: pergunta como as demais; codigo null e alternativasCodigo false.",
    `- completar: o trecho tem UMA lacuna ${CODE_PLACEHOLDER} e as quatro alternativas sao candidatas a preenche-la; alternativasCodigo true.`,
    "- erro: o trecho tem UM defeito real (compila ou roda, mas faz a coisa errada, ou falha de um jeito especifico); as alternativas descrevem o defeito e podem citar o numero da linha, sendo 1 a primeira linha; alternativasCodigo false.",
    "- saida: as alternativas sao o que o trecho imprime ou devolve; alternativasCodigo true. O trecho precisa ter saida deterministica: a regra de uma unica resposta defensavel vale dobrado aqui.",
    `- Trecho: codigo valido e autocontido na linguagem, no maximo ${CODE_MAX_LINES} linhas e ${CODE_MAX_LINE_LENGTH} caracteres por linha, indentado com dois espacos, sem comentario que entregue a resposta, sem ${CODE_PLACEHOLDER} fora do tipo completar.`,
    `- codigo.linguagem e obrigatoriamente uma destas: ${codeLanguages.join(", ")}; a primeira da lista e a principal.`,
    "- Distratores de codigo: erros reais de quem esta aprendendo (off-by-one, tipo errado, ordem de argumentos, escopo), nunca sintaxe absurda.",
    "- A pergunta NUNCA contem codigo nem cerca markdown: o trecho vai SOMENTE em codigo.trecho. A pergunta diz o que fazer com o trecho (por exemplo: O que este codigo imprime? Qual alternativa completa a lacuna para que a saida seja X? Qual e o defeito deste codigo?).",
    "- saida: cada alternativa e EXATAMENTE o texto que o terminal mostra, linha por linha separada por quebra de linha, sem frase em volta (escrever O codigo imprime 50. esta errado; escrever 50 esta certo) e sem virgula juntando linhas. A correta e a alternativa cujo texto e a saida real do trecho: confira a saida mentalmente, linha a linha, antes de escolher a letra.",
    "- erro: o trecho, executado, precisa lancar ou produzir resultado errado em relacao ao que a pergunta declara como intencao; a pergunta declara essa intencao (por exemplo: este codigo deveria somar a lista) e a correta descreve o defeito. Codigo correto com a pergunta qual e o erro e PROIBIDO. Pergunta de conceito com alternativas em codigo NAO e erro: e conceito.",
    `- completar: a lacuna ${CODE_PLACEHOLDER} substitui uma expressao, um token ou um argumento, nunca uma linha ou instrucao inteira; as alternativas sao SO o que entra na lacuna (sem repetir o resto da linha), em uma linha cada. Com a correta na lacuna o trecho roda; com cada errada, o trecho quebra ou produz outro resultado.`,
    "- Trecho autocontido: sem import, require, fetch, leitura de arquivo ou qualquer dependencia externa; so a linguagem e a biblioteca padrao. Sem entrada do usuario, sem aleatoriedade, sem data e hora.",
    "- Variedade: em secao com 3 ou mais perguntas de codigo, pelo menos uma de cada tipo (completar, erro e saida); com 2, tipos diferentes; saida nao pode passar da metade das perguntas de codigo da secao.",
  ].join("\n");
}

export function buildUserPrompt(
  roadmap: RoadmapV2,
  nivel: QuizNivel,
  section: SectionMaterial,
  quota: number,
  rebalanceNote: string | null,
  codeQuota = 0,
  codeLeafIdList: string[] = [],
) {
  const lines = [
    `Trilha: ${roadmap.title} (area ${roadmap.area})`,
    `Nivel desta rodada: ${nivel}`,
    `Secao desta rodada: ${section.title}`,
    `Gere exatamente ${quota} perguntas do nivel ${nivel} sobre o material desta secao.`,
    ...(codeQuota > 0
      ? [
          `Dessas ${quota}, exatamente ${codeQuota} devem ser de codigo (tipos completar, erro e saida, variando entre os tres) e ${quota - codeQuota} de conceito.`,
          `Baseie as perguntas de codigo nos passos que trazem codigo no material: ${codeLeafIdList.join(", ")}. Perguntas de conceito podem vir de qualquer passo.`,
        ]
      : []),
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

// Distribui a checagem de concentracao DENTRO do retry: resposta com mais de
// MAX_PER_FONTE perguntas no mesmo passo conta como tentativa falhada e a
// proxima tentativa recebe uma nota de rebalanceamento no prompt apontando
// os passos excedidos. Esgotadas as tentativas, o script falha com o
// relatorio da distribuicao (nao salva pool invalido).
export function overusedFontes(questions: GeneratedQuestion[]): string[] {
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.fonte, (counts.get(question.fonte) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > MAX_PER_FONTE)
    .map(([fonte, count]) => `${fonte} (${count})`);
}

// Quantas perguntas de codigo faltam para a cota da secao. Zero quando a
// secao nao tem cota. Entra no retry de generateSection ao lado de
// overusedFontes, como preferencia de qualidade: a validacao do pool e o
// sorteio com garantia fecham o resto.
export function missingCodeCount(
  questions: GeneratedQuestion[],
  codeQuota: number,
): number {
  if (codeQuota <= 0) return 0;
  const deCodigo = questions.filter((question) =>
    isCodeQuestion({ tipo: question.tipo }),
  ).length;
  return Math.max(codeQuota - deCodigo, 0);
}

const DASH_RE = /\u2014|\u2013/;

// Linguagens em que "trecho autocontido" significa sem import, require, fetch
// ou leitura de arquivo. Em trilha de ferramenta a regra nao cabe: um
// Dockerfile comeca com FROM e um script bash chama comandos externos por
// natureza, entao a checagem so roda quando codeLanguages tem alguma destas.
export const IMPORT_FREE_LANGUAGES = ["js", "ts", "python"];
const IMPORT_RE = /\b(import|require|fetch)\b|readFile|\bopen\(/;
// Heuristica de "alternativa de saida escrita como frase": a saida crua de um
// programa raramente contem a palavra imprime ou termina em letra seguida de
// ponto final; uma frase em portugues quase sempre. Pode dar falso positivo
// numa saida que seja uma frase de verdade; nesse caso o retry pede o ajuste
// e o modelo devolve a mesma resposta, e o fallback aceita.
const FRASE_RE = /imprime|[a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00e7]\.$/i;

// Violacoes das regras de codigo numa resposta do modelo, para o retry de
// generateSection corrigir ANTES da validacao final: sao as mesmas regras que
// quizPoolValidation.mts aplica ao trecho, em redacao curta, uma linha por
// violacao no formato "pergunta N (fonte X): problema". N e a posicao na
// resposta (1 e a primeira), porque o id so nasce depois.
export function codeRuleViolations(
  questions: GeneratedQuestion[],
  codeLanguages: string[],
): string[] {
  const out: string[] = [];
  questions.forEach((question, index) => {
    const rotulo = `pergunta ${index + 1} (fonte ${question.fonte})`;
    const ehCodigo = isCodeQuestion({ tipo: question.tipo });
    const codigo = question.codigo ?? null;
    if (ehCodigo && !codigo) {
      out.push(`${rotulo}: tipo ${question.tipo} sem codigo`);
      return;
    }
    if (!ehCodigo && codigo) {
      out.push(
        `${rotulo}: codigo so em pergunta ${CODE_QUESTION_TIPOS.join(", ")}`,
      );
      return;
    }
    if (!codigo) return;
    const trecho = codigo.trecho ?? "";
    if (trecho.trim().length === 0) {
      out.push(`${rotulo}: trecho vazio`);
      return;
    }
    const linhas = trecho.split("\n");
    if (linhas.length > CODE_MAX_LINES) {
      out.push(
        `${rotulo}: trecho com ${linhas.length} linhas (maximo ${CODE_MAX_LINES})`,
      );
    }
    const maisLonga = Math.max(...linhas.map((linha) => linha.length));
    if (maisLonga > CODE_MAX_LINE_LENGTH) {
      out.push(
        `${rotulo}: linha de ${maisLonga} caracteres (maximo ${CODE_MAX_LINE_LENGTH})`,
      );
    }
    if (DASH_RE.test(trecho)) {
      out.push(`${rotulo}: travessao ou meia-risca no trecho`);
    }
    const lacunas = trecho.split(CODE_PLACEHOLDER).length - 1;
    if (question.tipo === "completar" && lacunas !== 1) {
      out.push(
        `${rotulo}: completar exige exatamente uma lacuna ${CODE_PLACEHOLDER} (encontradas ${lacunas})`,
      );
    }
    if (question.tipo !== "completar" && lacunas > 0) {
      out.push(`${rotulo}: lacuna ${CODE_PLACEHOLDER} so em completar`);
    }
    if (!codeLanguages.includes(codigo.linguagem)) {
      out.push(
        `${rotulo}: codigo.linguagem "${codigo.linguagem}" fora de [${codeLanguages.join(", ")}]`,
      );
    }
    if (
      question.pergunta.includes("```") ||
      question.pergunta.includes(trecho.trim())
    ) {
      out.push(
        `${rotulo}: pergunta contem codigo (o trecho vai so em codigo.trecho)`,
      );
    }
    if (
      codeLanguages.some((lang) => IMPORT_FREE_LANGUAGES.includes(lang)) &&
      IMPORT_RE.test(trecho)
    ) {
      out.push(
        `${rotulo}: trecho depende de import, require, fetch ou arquivo (precisa ser autocontido)`,
      );
    }
    const alternativas = Object.values(question.alternativas);
    if (question.tipo === "completar") {
      if (linhas.some((linha) => linha.trim() === CODE_PLACEHOLDER)) {
        out.push(`${rotulo}: lacuna ocupa a linha inteira`);
      }
      if (alternativas.some((alt) => alt.includes("\n"))) {
        out.push(`${rotulo}: alternativa de completar com mais de uma linha`);
      }
      if (!question.alternativasCodigo) {
        out.push(`${rotulo}: completar exige alternativasCodigo true`);
      }
    }
    if (question.tipo === "saida") {
      if (!question.alternativasCodigo) {
        out.push(`${rotulo}: saida exige alternativasCodigo true`);
      }
      if (alternativas.some((alt) => FRASE_RE.test(alt.trim()))) {
        out.push(
          `${rotulo}: alternativa de saida escrita como frase (tem que ser a saida crua)`,
        );
      }
    }
    if (question.tipo === "erro" && question.alternativasCodigo) {
      out.push(`${rotulo}: erro exige alternativasCodigo false`);
    }
  });
  return out;
}

// Regra de variedade dos tipos de codigo numa secao: com 3 ou mais perguntas
// de codigo, pelo menos uma de cada tipo; com 2, tipos diferentes; saida nao
// passa da metade. Tratada no retry como as outras violacoes.
export function codeTypeViolations(
  questions: GeneratedQuestion[],
  codeQuota: number,
): string[] {
  if (codeQuota <= 0) return [];
  const tipos = questions
    .filter((question) => isCodeQuestion({ tipo: question.tipo }))
    .map((question) => question.tipo as QuizTipo);
  const out: string[] = [];
  const conta = (tipo: QuizTipo) => tipos.filter((t) => t === tipo).length;
  if (tipos.length >= 3) {
    for (const tipo of CODE_QUESTION_TIPOS) {
      if (conta(tipo) === 0) {
        out.push(
          `variedade: ${tipos.length} perguntas de codigo e nenhuma do tipo ${tipo}`,
        );
      }
    }
  } else if (tipos.length === 2 && tipos[0] === tipos[1]) {
    out.push(
      `variedade: as 2 perguntas de codigo precisam ser de tipos diferentes (vieram 2 de ${tipos[0]})`,
    );
  }
  if (tipos.length > 0 && conta("saida") > tipos.length / 2) {
    out.push(
      `variedade: saida nao pode passar da metade das perguntas de codigo (${conta("saida")} de ${tipos.length})`,
    );
  }
  return out;
}

// Pergunta final do pool a partir da resposta do modelo. Conceito (tipo
// ausente ou "conceito") sai sem tipo, codigo e alternativasCodigo, entao a
// pool de area continua sem esses campos. Tipo de codigo sem codigo e erro:
// nunca se salva pergunta de codigo sem trecho. Vindo da API esse estado e
// inalcancavel desde o schema discriminado (buildQuestionSchema); o throw
// fica como portao para pool montada ou editada a mao.
export function normalizeGeneratedQuestion(
  raw: GeneratedQuestion,
  id: string,
  nivel: QuizNivel,
): QuizQuestion {
  const base: QuizQuestion = {
    id,
    nivel,
    pergunta: raw.pergunta,
    alternativas: raw.alternativas,
    correta: raw.correta,
    explicacao: raw.explicacao,
    fonte: raw.fonte,
  };
  if (!isCodeQuestion({ tipo: raw.tipo })) return base;
  if (!raw.codigo) {
    throw new Error(
      `[generateQuizPool] pergunta ${id} e do tipo ${raw.tipo} mas veio sem codigo.`,
    );
  }
  return {
    ...base,
    tipo: raw.tipo,
    codigo: { linguagem: raw.codigo.linguagem, trecho: raw.codigo.trecho },
    ...(raw.alternativasCodigo ? { alternativasCodigo: true as const } : {}),
  };
}
