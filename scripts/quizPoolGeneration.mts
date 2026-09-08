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
import { conferirCodigo, type Executor } from "./verifyQuizPoolByExecution.mts";

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

// Teto de perguntas numa unica secao, PREFERENCIA e nao regra dura. E a maior
// cota que o modelo cumpriu de forma confiavel nesta serie: com cota 10
// (nivel avancado da trilha de Python, duas secoes) ele devolveu menos
// perguntas nas CINCO tentativas e uma delas truncou o JSON, e a geracao
// abortou sem salvar nada (registro do Lote 06). Nao aborta quando o nivel
// nao comporta, pelo mesmo motivo de MAX_PER_FONTE e do bestValid: cota alta
// com aviso e melhor que trilha que nao gera. Aplicado so a trilha com
// codeLanguages: nas trilhas de area, 40 combinacoes de nivel tem duas
// secoes e 15 perguntas, e duas secoes no teto comportam 14 (medido no
// Lote 06b, com as pools ja publicadas).
export const MAX_QUOTA_PER_SECTION = 7;

// Orcamento do nivel: target repartido entre as secoes proporcionalmente ao
// numero de folhas, arredondamento determinista por maiores restos (empate
// resolve pela ordem das secoes na trilha), com piso de 1 pergunta por secao
// e teto de MAX_PER_FONTE por folha. Falha antes de chamar a IA se a soma
// nao fechar o target ou alguma cota estourar o teto por folha.
// `maxPerSection` e opcional: sem ele o resultado e identico ao de sempre
// (as pools de area foram geradas assim); com ele, o excedente das secoes
// acima do teto migra para as demais enquanto houver folga, e o que nao
// couber FICA, sinalizado por sectionQuotaWarnings.
export function sectionQuotas(
  sections: SectionMaterial[],
  target: number,
  maxPerSection?: number,
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

  // Teto por secao (opcional): excedente migra pra primeira secao com folga
  // nos DOIS tetos, na mesma ordem deterministica. Sem receptor, para: a cota
  // alta fica e vira aviso, nunca aborto.
  if (maxPerSection !== undefined) {
    const capOf = (i: number) =>
      Math.min(sections[i].leaves.length * MAX_PER_FONTE, maxPerSection);
    for (let i = 0; i < quotas.length; i += 1) {
      while (quotas[i] > capOf(i)) {
        const receiver = quotas.findIndex((quota, j) => quota < capOf(j));
        if (receiver === -1) break;
        quotas[i] -= 1;
        quotas[receiver] += 1;
      }
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

// Secoes que ficaram acima de `maxPerSection` porque o nivel nao comportava a
// redistribuicao. Canal separado de sectionQuotas para os call sites nao
// mudarem de forma (eles seguem lendo `quotas[i]`); o gerador imprime cada
// aviso com prefixo [aviso] e segue.
export function sectionQuotaWarnings(
  sections: SectionMaterial[],
  target: number,
  maxPerSection?: number,
): string[] {
  if (maxPerSection === undefined) return [];
  const quotas = sectionQuotas(sections, target, maxPerSection);
  const out: string[] = [];
  quotas.forEach((quota, i) => {
    if (quota > maxPerSection) {
      out.push(
        `secao "${sections[i].title}" com cota ${quota}, acima do teto de ${maxPerSection} (o nivel tem ${sections.length} secoes para ${target} perguntas; dividir a secao maior daria uma cota menor).`,
      );
    }
  });
  return out;
}

// Resposta de UMA pergunta como o modelo a devolve. Os tres campos de codigo
// so existem no schema quando a secao tem cota de codigo, e la a pergunta e
// uma uniao discriminada por `tipo` (buildQuestionSchema): conceito com
// `codigo` null, erro com `codigo` que traz `saidaEsperada`, completar e
// saida com `codigo` sem ela. Esta interface e o superconjunto dos tres
// ramos; `codigo` nulo so existe no ramo conceito e `saidaEsperada` so no
// ramo erro.
export interface GeneratedQuestion {
  pergunta: string;
  alternativas: { a: string; b: string; c: string; d: string };
  correta: "a" | "b" | "c" | "d";
  explicacao: string;
  fonte: string;
  tipo?: QuizTipo;
  codigo?: { linguagem: string; trecho: string; saidaEsperada?: string } | null;
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
  // API obriga. Tres ramos: conceito; erro, que exige saidaEsperada (o que o
  // codigo deveria imprimir, para o verificador por execucao) e
  // alternativasCodigo false; completar e saida, sem saidaEsperada e com
  // alternativasCodigo true (as regras ja exigiam, agora o schema obriga).
  // z.union (e nao discriminatedUnion) porque o zod serializa a primeira
  // como anyOf, que e a forma que o strict mode da OpenAI aceita, e a
  // segunda como oneOf.
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
            tipo: z.literal("erro"),
            codigo: z.object({
              linguagem: z.string(),
              trecho: z.string(),
              saidaEsperada: z.string(),
            }),
            alternativasCodigo: z.literal(false),
          }),
          z.object({
            ...base,
            tipo: z.enum(["completar", "saida"]),
            codigo: z.object({ linguagem: z.string(), trecho: z.string() }),
            alternativasCodigo: z.literal(true),
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
// Em linguagem de IMPORT_FREE_LANGUAGES a cerca so conta se o codigo dela
// NAO depender de nada de fora (dependsOnExternal): o prompt aponta o modelo
// para essas folhas e a regra de trecho autocontido proibe isso, entao apontar para
// uma folha cujo unico codigo depende disso e pedir uma pergunta impossivel,
// e o modelo respondeu com codigo nulo em vez de recusar (registro do 04c,
// secao Assincronia, folha assincrono.fetch, cinco tentativas). Em bash ou
// dockerfile a exclusao nao se aplica.
export function codeLeafIds(
  section: SectionMaterial,
  codeLanguages: string[],
): string[] {
  if (codeLanguages.length === 0) return [];
  const langs = codeLanguages
    .map((lang) => lang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp("```(?:" + langs + ")[ \\t]*\\n([\\s\\S]*?)```", "g");
  return section.leaves
    .filter((leaf) =>
      Array.from(leaf.content.matchAll(re)).some(
        (m) => !dependsOnExternal(m[1], codeLanguages),
      ),
    )
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
// O exemplo de completar sai na linguagem principal da trilha: um exemplo em
// sintaxe de JavaScript numa trilha de Python contradiz a regra de que o
// trecho e valido na linguagem (registro do Lote 06).
function completarExemplo(codeLanguages: string[]): string {
  if (codeLanguages[0] === "python") return `x = ${CODE_PLACEHOLDER}`;
  return `const x = ${CODE_PLACEHOLDER};`;
}

function completarErrado(codeLanguages: string[]): string {
  if (codeLanguages[0] === "python") return "x = 1";
  return "const x = 1;";
}

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
    "- erro traz codigo.saidaEsperada: o stdout cru que o codigo DEVERIA produzir se estivesse certo, linha por linha, sem frase em volta (escrever 8 esta certo; escrever O codigo imprime 8. esta errado). O trecho com defeito precisa lancar ou imprimir algo diferente disso; se ele roda limpo e imprime exatamente a saidaEsperada, nao tem defeito e a pergunta e invalida.",
    `- completar: a lacuna ${CODE_PLACEHOLDER} substitui uma expressao, um token ou um argumento, nunca uma linha ou instrucao inteira; as alternativas sao SO o que entra na lacuna (sem repetir o resto da linha), em uma linha cada. Com a correta na lacuna o trecho roda; com cada errada, o trecho quebra ou produz outro resultado.`,
    "- Trecho autocontido: sem import, require, fetch, leitura de arquivo ou qualquer dependencia externa; so a linguagem e a biblioteca padrao. Sem entrada do usuario, sem aleatoriedade, sem data e hora.",
    ...(codeLanguages.includes("python")
      ? [
          `- Em Python, import so da biblioteca padrao desta lista: ${PYTHON_STDLIB_ALLOWED.join(", ")}; nada de random, datetime, os, sys ou arquivo.`,
        ]
      : []),
    "- Variedade: em secao com 3 ou mais perguntas de codigo, pelo menos uma de cada tipo (completar, erro e saida); com 2, tipos diferentes; saida nao pode passar da metade das perguntas de codigo da secao.",
    `- Exemplo de completar: trecho ${completarExemplo(codeLanguages)} com alternativas 1, 2, 3 e 4. NUNCA ${completarErrado(codeLanguages)} como alternativa: a alternativa e so o que entra na lacuna, sem o resto da linha.`,
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
// export entra na lista pelo outro lado da mesma dependencia: um trecho que
// so exporta roda em silencio e so faz sentido com um importador, e foi a
// cerca de export de modulos.esm que manteve a folha como material no 04d,
// com o modelo escrevendo import em todas as cinco tentativas da secao.
export const IMPORT_FREE_LANGUAGES = ["js", "ts", "python"];
// Em Python, import da biblioteca padrao e legitimo num trecho autocontido,
// e a regra unica de "sem import" (Lote 05) proibia a palavra. Lista fechada
// de modulos deterministas e sem ambiente: fora dela ficam random, datetime,
// time, os, sys, pathlib e urllib, que quebram determinismo ou tocam o
// ambiente, e qualquer pacote instalado por pip.
export const PYTHON_STDLIB_ALLOWED = [
  "json",
  "math",
  "re",
  "collections",
  "itertools",
  "functools",
  "string",
  "typing",
  "dataclasses",
  "decimal",
  "fractions",
  "statistics",
  "enum",
  "textwrap",
];
const EXTERNAL_RE = /\b(export|require|fetch)\b|readFile|\bopen\(/;
const RELATIVE_IMPORT_RE = /\b(?:import|from)\s+['"]\.\.?\//;
const PYTHON_IMPORT_RE =
  /^\s*(?:import\s+([\w.]+(?:\s*,\s*[\w.]+)*)|from\s+([\w.]+)\s+import\b)/;

// Um trecho depende de algo de fora quando toca rede, arquivo, modulo
// relativo ou pacote externo. Em bash e dockerfile nunca (a checagem so vale
// para linguagens de IMPORT_FREE_LANGUAGES). Em js e ts qualquer import e
// externo; em python, import e from X import so sao aceitos quando cada
// modulo (primeiro segmento) esta em PYTHON_STDLIB_ALLOWED.
export function dependsOnExternal(
  code: string,
  codeLanguages: string[],
): boolean {
  if (!codeLanguages.some((lang) => IMPORT_FREE_LANGUAGES.includes(lang))) {
    return false;
  }
  if (EXTERNAL_RE.test(code) || RELATIVE_IMPORT_RE.test(code)) return true;
  const python = codeLanguages.includes("python");
  for (const linha of code.split("\n")) {
    if (!python) {
      if (/\bimport\b/.test(linha)) return true;
      continue;
    }
    const m = PYTHON_IMPORT_RE.exec(linha);
    if (!m) continue;
    const modulos = (m[1] ?? m[2]).split(",").map((nome) => nome.trim());
    for (const modulo of modulos) {
      const raiz = modulo.split(/\s+as\s+/)[0].split(".")[0];
      if (!PYTHON_STDLIB_ALLOWED.includes(raiz)) return true;
    }
  }
  return false;
}
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
    if (dependsOnExternal(trecho, codeLanguages)) {
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
      // Alternativa que repete o resto da linha da lacuna: 3 das 7 CORRIGIR
      // do 04d eram isso (preenchida, a linha virava "const x = const x =").
      // Prefixo curto (menos de 4 caracteres) e sufixo que e so ";" nao
      // contam, porque coincidem com alternativa legitima.
      const linhaLacuna = linhas.find((linha) =>
        linha.includes(CODE_PLACEHOLDER),
      );
      if (linhaLacuna) {
        const [prefixo, sufixo] = linhaLacuna
          .split(CODE_PLACEHOLDER)
          .map((parte) => parte.trim());
        const sufixoUtil = sufixo.replace(/;/g, "").length;
        const repete = alternativas.some(
          (alt) =>
            (prefixo.length >= 4 && alt.includes(prefixo)) ||
            (sufixoUtil >= 2 && alt.trim().endsWith(sufixo)),
        );
        if (repete) {
          out.push(
            `${rotulo}: alternativa de completar repete o resto da linha (so o que entra na lacuna)`,
          );
        }
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
    if (question.tipo === "erro") {
      const saidaEsperada = codigo.saidaEsperada ?? "";
      if (saidaEsperada.trim().length === 0) {
        out.push(
          `${rotulo}: erro exige codigo.saidaEsperada (stdout cru que o codigo deveria produzir)`,
        );
      } else if (FRASE_RE.test(saidaEsperada.trim())) {
        out.push(
          `${rotulo}: saidaEsperada escrita como frase (tem que ser a saida crua)`,
        );
      }
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

// Violacoes por EXECUCAO dos trechos de uma resposta do modelo, no mesmo
// formato de codeRuleViolations, para o retry corrigir antes da validacao
// final: saida cujo stdout nao bate com a correta, completar com distrator
// equivalente ou correta que lanca, erro que roda limpo e imprime a
// saidaEsperada (sem defeito). `executarPor` devolve o executor da linguagem
// ou null quando nao ha runner (bash, dockerfile), e nesse caso a pergunta
// nao gera violacao nenhuma. Pura em relacao ao executor recebido.
export function execViolations(
  questions: GeneratedQuestion[],
  codeLanguages: string[],
  executarPor: (linguagem: string) => Executor | null,
): string[] {
  const out: string[] = [];
  questions.forEach((question, index) => {
    if (!isCodeQuestion({ tipo: question.tipo }) || !question.codigo) return;
    if (!codeLanguages.includes(question.codigo.linguagem)) return;
    const executar = executarPor(question.codigo.linguagem);
    if (!executar) return;
    const r = conferirCodigo(
      {
        tipo: question.tipo,
        codigo: question.codigo,
        alternativas: question.alternativas,
        correta: question.correta,
      },
      executar,
    );
    if (r.veredito === "CORRIGIR") {
      out.push(
        `pergunta ${index + 1} (fonte ${question.fonte}): ${r.resultado}`,
      );
    }
  });
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
    codigo: {
      linguagem: raw.codigo.linguagem,
      trecho: raw.codigo.trecho,
      ...(raw.tipo === "erro" && raw.codigo.saidaEsperada !== undefined
        ? { saidaEsperada: raw.codigo.saidaEsperada }
        : {}),
    },
    ...(raw.alternativasCodigo ? { alternativasCodigo: true as const } : {}),
  };
}
