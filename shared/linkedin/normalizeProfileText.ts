/**
 * Normalização do texto extraído do PDF, executada UMA vez no topo de
 * `parseLinkedinText`, antes de qualquer parser específico.
 *
 * Por que existe: o "Salvar como PDF" do LinkedIn quebra conteúdo no meio, e o
 * parser lia cada linha como unidade independente. Dois sintomas medidos num
 * export real:
 *
 *   Software Developer | Full-Stack Engineer | AI Agent Expert | React |
 *   Node
 *
 *   Retrieval-Augmented Generation
 *   (RAG)
 *
 * No primeiro, "Node" tem 4 caracteres e era descartado por `isHeadlineCandidate`
 * (mínimo 6), então a headline entregue terminava em barra órfã, o check
 * `headline-stack` reprovava dizendo "menos de 2 tecnologias", e a IA recebia
 * isso como FATO e recomendava adicionar Next.js e Tailwind. No segundo, uma
 * competência virava duas, e o fragmento "(RAG)" era contado no total.
 *
 * O mesmo módulo remove o rodapé de paginação, que antes só era limpo na
 * exibição: `Page 2 of 5` ficava dentro de títulos e descrições, contava no
 * limiar de 100 caracteres de `exp-descricoes` (check essencial) e, a partir de
 * 10 páginas, o número de dois dígitos fazia `exp-resultados` aprovar sozinho.
 *
 * A normalização é deliberadamente CONSERVADORA: na dúvida, não junta. Juntar
 * demais estraga o parse de experiências (título colado em data, bullets
 * fundidos), que é pior que a quebra original.
 */

/**
 * Rodapé de paginação, em PT e EN, tolerando o espaçamento múltiplo que o
 * pdfjs produz (`Page   1   of   5`).
 *
 * FONTE ÚNICA deste padrão no projeto. Antes existiam dois: o `PAGE_RE` do
 * parser (que só evitava escolher rodapé como headline) e o
 * `stripPdfPageNoise` do client (que limpava na exibição). Os dois foram
 * substituídos por este, porque o rodapé agora some antes do parse: quem
 * limpava depois não tem mais o que limpar.
 */
export const PAGE_FOOTER_RE = /^(?:page|p[aá]gina)\s+\d+\s+(?:of|de)\s+\d+$/i;

/** Cabeçalho de seção não é continuação de nada. Espelha SECTION_HEADERS. */
const SECTION_HEADER_LIKE =
  /^(?:contact|contato|summary|resumo|sobre|about|experience|experi[eê]ncia|experi[eê]ncia profissional|education|forma[cç][aã]o acad[eê]mica|forma[cç][aã]o|educa[cç][aã]o|top skills|principais compet[eê]ncias|skills|compet[eê]ncias|aptid[oõ]es|languages|idiomas|licenses & certifications|licen[cç]as e certificados|certifications|certifica[cç][oõ]es|certificados)$/i;

/** Linha que é só um intervalo de datas, tolerante o bastante para o guard. */
const DATE_LINE_LIKE =
  /(?:\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b)/i;

/** Bullet: marcador no início. Dois bullets nunca se fundem. */
const BULLET_START = /^\s*(?:[•·▪◦*-]|\d+[.)])\s+/;

/** Pontuação que fecha uma ideia: linha assim não continua na seguinte. */
const ENDS_CLOSED = /[.!?;:]$/;

/** Separador órfão no fim da linha: sinal FORTE de que a ideia continua. */
const ENDS_ORPHAN_SEPARATOR = /[|,/]$/;

/** Hifenização de quebra de página: "natural-" seguido de "language". */
const ENDS_HYPHEN = /[a-zà-ÿ]-$/i;

/** Continuação entre parênteses numa linha só: "(RAG)", "(Mobile)". */
const PARENTHETICAL_ONLY = /^\([^()]*\)$/;

/** Comprimento acima do qual uma linha é conteúdo próprio, não continuação. */
const MAX_CONTINUATION_LEN = 40;

/**
 * A linha `atual` é continuação da `anterior`?
 *
 * SÃO consideradas continuação:
 *   1. anterior termina em separador órfão (`|`, `,`, `/`), o caso da headline
 *      quebrada em "... | React |" + "Node";
 *   2. anterior termina em hífen de quebra ("natural-" + "language");
 *   3. atual é só um parêntese fechado e curto, o caso do "(RAG)";
 *   4. atual começa em minúscula, é curta e a anterior não fechou pontuação.
 *
 * NÃO são consideradas continuação, e o motivo de cada uma:
 *   - qualquer linha vazia: já foi filtrada antes;
 *   - cabeçalho de seção: é fronteira estrutural, juntar destrói a seção;
 *   - linha de data: juntar cola o título da experiência na data e o
 *     `parseExperiencias` perde a delimitação, que é pior que a quebra;
 *   - bullet: dois bullets curtos consecutivos são conteúdo independente;
 *   - anterior terminando em pontuação de fechamento: a ideia acabou;
 *   - atual começando com maiúscula sem nenhum dos sinais 1 a 3: é o caso de
 *     duas competências curtas legítimas em linhas separadas ("React" e "Vue"),
 *     onde juntar inventaria uma competência que não existe;
 *   - atual longa (acima de 40 caracteres): conteúdo próprio.
 */
function ehContinuacao(anterior: string, atual: string): boolean {
  if (!anterior || !atual) return false;
  if (SECTION_HEADER_LIKE.test(atual.trim())) return false;
  if (SECTION_HEADER_LIKE.test(anterior.trim())) return false;
  if (BULLET_START.test(atual)) return false;
  if (DATE_LINE_LIKE.test(atual) && atual.length <= 80) return false;

  // 3. parêntese solto: "(RAG)" continua "Retrieval-Augmented Generation".
  if (PARENTHETICAL_ONLY.test(atual.trim()) && atual.trim().length <= MAX_CONTINUATION_LEN) {
    return true;
  }
  // 1 e 2: a linha anterior ficou aberta.
  if (ENDS_ORPHAN_SEPARATOR.test(anterior.trim())) return true;
  if (ENDS_HYPHEN.test(anterior.trim())) return true;

  if (ENDS_CLOSED.test(anterior.trim())) return false;
  // 4. minúscula e curta: continuação de frase quebrada.
  if (atual.length <= MAX_CONTINUATION_LEN && /^[a-zà-ÿ]/.test(atual)) return true;

  return false;
}

/**
 * Junta duas linhas. No caso do hífen, o hífen é PRESERVADO e não entra espaço:
 * o export do LinkedIn quebra em hífen que já existia na palavra composta
 * ("natural-language", "full-stack"), não insere hífen de silabação. Remover o
 * hífen produziria "naturallanguage", que não é palavra nem casa com
 * tecnologia nenhuma no matching.
 */
function juntar(anterior: string, atual: string): string {
  const a = anterior.trimEnd();
  const b = atual.trimStart();
  if (ENDS_HYPHEN.test(a)) return `${a}${b}`;
  return `${a} ${b}`;
}

/** Barra ou vírgula órfã sobrando no fim, quando não houve o que juntar. */
function limparSeparadorOrfao(linha: string): string {
  return linha.replace(/\s*[|,/]\s*$/, "").trimEnd();
}

/**
 * Devolve as linhas já normalizadas: sem rodapé de paginação, sem linha vazia,
 * com continuações unidas e separadores órfãos limpos.
 */
export function normalizeProfileLines(text: string): string[] {
  const brutas = text
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    // Rodapé some ANTES do parse: não entra em título, descrição, contagem de
    // caracteres nem no regex de métricas.
    .filter((linha) => !PAGE_FOOTER_RE.test(linha));

  const saida: string[] = [];
  for (const linha of brutas) {
    const anterior = saida[saida.length - 1];
    if (anterior !== undefined && ehContinuacao(anterior, linha)) {
      saida[saida.length - 1] = juntar(anterior, linha);
      continue;
    }
    saida.push(linha);
  }

  return saida.map(limparSeparadorOrfao).filter((linha) => linha.length > 0);
}
