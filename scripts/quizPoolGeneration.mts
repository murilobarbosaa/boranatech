// Logica PURA do gerador de pool de quiz (scripts/generateQuizPool.mts):
// material das folhas, secoes por nivel, orcamento por secao, schema da
// resposta, prompts e checagens de distribuicao. Nada aqui toca fetch, fs,
// env ou process, entao o modulo pode ser importado por teste sem disparar o
// gerador (o script executa codigo de topo ao ser importado). O texto dos
// prompts e o schema foram movidos do script sem alteracao: o dry-run das
// trilhas de area e identico antes e depois da extracao.
import { z } from "zod";
import type { QuizNivel } from "../shared/roadmapQuiz/types";
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

export function buildQuestionSchema(leafIds: string[], count: number) {
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

export type GeneratedQuestion = z.infer<
  ReturnType<typeof buildQuestionSchema>
>["questions"][number];

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

export function buildUserPrompt(
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
