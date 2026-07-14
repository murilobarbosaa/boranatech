// Calculo deterministico da carga horaria de uma trilha (C1). Funcao pura, sem
// I/O e sem `any`: mesma entrada, mesma saida. A definicao de "leaf
// obrigatoria" NAO e reimplementada aqui; importamos requiredLeaves, a mesma
// usada em server/routes/roadmapCompletions.ts.
import { requiredLeaves } from "../roadmapV2/progress";
import type { RoadmapNode, RoadmapSection, RoadmapV2 } from "../roadmapV2/types";
import type { CertificateHours, SyllabusSection } from "./types";

const WORDS_PER_MINUTE = 150;
const MINUTES_PER_HOUR = 60;
const PRACTICE_HOURS_PER_REQUIRED_LEAF = 1.0;
const MIN_HOURS = 20;
const MAX_HOURS = 120;

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}

// Palavras de um unico no: title + description + content + o content de cada
// entrada byLanguage. NAO desce nos filhos (a recursao e feita por sectionWords).
function nodeWords(node: RoadmapNode): number {
  let total =
    wordCount(node.title) + wordCount(node.description) + wordCount(node.content);
  if (node.byLanguage) {
    for (const lang of Object.values(node.byLanguage)) {
      total += wordCount(lang.content);
    }
  }
  return total;
}

// Soma de nodeWords de TODOS os nos da secao (todos os descendentes, em
// qualquer profundidade). Titulo/descricao da propria secao nao entram: a
// regra conta nos.
function sectionWords(section: RoadmapSection): number {
  const walk = (nodes: RoadmapNode[]): number =>
    nodes.reduce(
      (sum, node) =>
        sum + nodeWords(node) + (node.children ? walk(node.children) : 0),
      0,
    );
  return walk(section.children);
}

function round5(value: number): number {
  return Math.round(value / 5) * 5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeHours(roadmap: RoadmapV2): CertificateHours {
  const raw = roadmap.sections.map((section) => {
    const readingHours = sectionWords(section) / WORDS_PER_MINUTE / MINUTES_PER_HOUR;
    const practiceHours =
      requiredLeaves(section).length * PRACTICE_HOURS_PER_REQUIRED_LEAF;
    return { section, rawSection: readingHours + practiceHours };
  });

  const rawTotal = raw.reduce((sum, entry) => sum + entry.rawSection, 0);
  const totalHours = clamp(round5(rawTotal), MIN_HOURS, MAX_HOURS);

  // Distribui totalHours proporcionalmente ao rawSection, em inteiros. rawTotal
  // == 0 (trilha sem palavras nem leafs obrigatorias) cai no reparto igual pra
  // evitar divisao por zero; o ajuste final na maior secao fecha a soma.
  const sections: SyllabusSection[] = raw.map((entry) => ({
    id: entry.section.id,
    title: entry.section.title,
    hours:
      rawTotal > 0
        ? Math.round((totalHours * entry.rawSection) / rawTotal)
        : Math.round(totalHours / raw.length),
  }));

  // A soma dos inteiros arredondados quase nunca bate exatamente com
  // totalHours; joga a diferenca na MAIOR secao (por rawSection) pra invariante
  // sum(sections.hours) === totalHours valer sempre.
  if (sections.length > 0) {
    const diff = totalHours - sections.reduce((sum, s) => sum + s.hours, 0);
    let largestIdx = 0;
    for (let i = 1; i < raw.length; i += 1) {
      if (raw[i].rawSection > raw[largestIdx].rawSection) largestIdx = i;
    }
    sections[largestIdx].hours += diff;
  }

  return { totalHours, sections };
}
