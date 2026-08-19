/**
 * Detector de idioma, heurístico e local (Fase 2, lote 6).
 *
 * O prompt exige idioma por campo e por mercado, e até aqui NADA validava a
 * saída: um Sobre em inglês para quem busca emprego no Brasil atravessava
 * schema e lastro e chegava como texto para colar.
 *
 * Por que heurística própria e não uma biblioteca: o que se precisa aqui é
 * separar português de inglês em textos de uma a cinco frases, um problema
 * pequeno e fechado, e uma dependência nova custaria mais em auditoria e
 * bundle do que resolve. O detector NÃO tenta ser um classificador de idiomas:
 * ele responde `pt`, `en` ou `indeterminado`, e a terceira resposta é a mais
 * importante do desenho.
 *
 * REGRA DURA: `indeterminado` NUNCA reprova. Texto curto, misto ou carregado de
 * termos técnicos cai aqui, e o preço de reprovar por engano é uma chamada paga
 * a mais mais um texto correto substituído por um genérico. Errar para o lado
 * de deixar passar é o lado certo.
 *
 * Mora no server porque só a checagem de saída o usa; nada no client decide
 * idioma.
 */

/**
 * Palavras funcionais de cada língua. São ELAS que decidem, e não o vocabulário
 * técnico: "Desenvolvedora front-end com foco em React, Node.js e TypeScript"
 * tem quatro palavras em inglês e é uma frase portuguesa, e o que a denuncia
 * são o "com", o "em" e o "e". Por isso a lista é de palavras gramaticais, que
 * o texto técnico não substitui.
 */
const STOPWORDS_PT = [
  "de",
  "da",
  "do",
  "das",
  "dos",
  "com",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "que",
  "uma",
  "um",
  "os",
  "as",
  "e",
  "ou",
  "mais",
  "como",
  "meu",
  "minha",
  "seu",
  "sua",
  "voce",
  "sou",
  "atuo",
  "trabalho",
  "sobre",
  "nao",
  "ja",
  "ao",
  "aos",
];

const STOPWORDS_EN = [
  "the",
  "and",
  "with",
  "for",
  "you",
  "your",
  "of",
  "to",
  "in",
  "on",
  "at",
  "my",
  "i",
  "am",
  "is",
  "are",
  "was",
  "were",
  "have",
  "has",
  "would",
  "will",
  "this",
  "that",
  "from",
  "about",
  "as",
  "by",
  "not",
];

/**
 * Mínimo de palavras para arriscar um veredito.
 *
 * Abaixo disto o texto não tem sinal suficiente e vira `indeterminado`. Uma
 * headline ("Front-end | React | produto") fica exatamente nessa faixa, e é por
 * isso que headline em mercado de idioma único quase nunca reprova.
 */
const MIN_PALAVRAS = 6;

/** Mínimo de sinais da língua vencedora, para não decidir por uma palavra só. */
const MIN_SINAIS = 2;

/** Vantagem mínima da vencedora sobre a outra. Empate técnico é texto misto. */
const MARGEM_MINIMA = 2;

/**
 * Quantas vezes a vencedora precisa ter da perdedora para o veredito valer.
 *
 * Sem isto o detector puxava para o inglês em texto MISTO, e não por acaso: as
 * palavras funcionais do inglês são mais densas (artigo, pronome e verbo
 * auxiliar aparecem em quase toda oração), então um parágrafo meio a meio dava
 * sete sinais de inglês contra cinco de português e reprovava um texto que o
 * mercado "ambos" pede que seja misto. Medido nas duas frases de teste antes de
 * a regra existir. Com a dominância exigida, meio a meio vira `indeterminado`,
 * que é o que ele é.
 */
const FATOR_DOMINANCIA = 2;

export type IdiomaDetectado = "pt" | "en" | "indeterminado";

/** Diacríticos que só o português usa entre as duas línguas comparadas. */
const DIACRITICOS = /[áàâãéêíóôõúüç]/i;

function palavrasDe(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z]+/)
    .filter((p) => p.length > 0);
}

/**
 * Classifica o texto em `pt`, `en` ou `indeterminado`.
 *
 * Os diacríticos contam como sinal de português porque são estruturais (o
 * inglês não os usa), mas valem UM sinal no total, e não um por ocorrência:
 * uma única palavra acentuada não pode decidir um parágrafo inteiro.
 */
export function detectarIdioma(texto: string): IdiomaDetectado {
  const palavras = palavrasDe(texto);
  if (palavras.length < MIN_PALAVRAS) return "indeterminado";

  const conjuntoPt = new Set(STOPWORDS_PT);
  const conjuntoEn = new Set(STOPWORDS_EN);
  let pt = 0;
  let en = 0;
  for (const palavra of palavras) {
    if (conjuntoPt.has(palavra)) pt += 1;
    if (conjuntoEn.has(palavra)) en += 1;
  }
  if (DIACRITICOS.test(texto)) pt += 1;

  const vencedor = pt > en ? "pt" : "en";
  const maior = Math.max(pt, en);
  const menor = Math.min(pt, en);
  if (maior < MIN_SINAIS) return "indeterminado";
  if (maior - menor < MARGEM_MINIMA) return "indeterminado";
  if (maior < menor * FATOR_DOMINANCIA) return "indeterminado";
  return vencedor;
}
