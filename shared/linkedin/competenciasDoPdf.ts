/**
 * O que do bloco de competencias do PDF pode ser escrito no formulario.
 *
 * POR QUE EXISTE, e e a razao mais grave desta serie: o pre-preenchimento do
 * campo de competencias usa `skillsPdf` quando a pessoa deixa o campo vazio, e
 * `skillsPdf` as vezes carrega o BLOCO DE IDENTIDADE inteiro. Medido em
 * 2026-07-31 sobre as analises persistidas: das 149 linhas com competencias, 41
 * tinham mais de 3 itens, e cerca de 16 traziam nome, cidade, estado e pais.
 * Duas linhas reais, anonimizadas na fixture deste modulo, tinham o nome
 * proprio, a headline em pedacos e a localizacao dentro da lista.
 *
 * O efeito nao e nota errada: e o produto escrevendo o NOME e a CIDADE da
 * pessoa num campo que ela submete como competencia profissional, e esse campo
 * vai para o prompt da OpenAI. Dado de identidade viajando como declaracao de
 * skill e de outra natureza que ponto a mais ou a menos.
 *
 * CRITERIO: a origem estrutural e responsabilidade do parser, nunca da
 * quantidade nem de uma tentativa lexical de adivinhar nomes de pessoas.
 *
 * O produto comunica e aceita até CINCO competências extraídas. Uma seção
 * legítima pode ter seis, dez ou mais itens: o teto só limita o prefill e não
 * tenta classificar a lista como anômala. A fronteira da identidade é resolvida
 * em `parse.ts`, usando posição de cabeçalhos e da headline detectada.
 *
 * POR QUE NAO O CRITERIO LEXICAL. A primeira tentativa perguntava "isto parece
 * nome de pessoa?" (2 a 4 palavras capitalizadas, sem digito, fora de um
 * catalogo de termos tecnicos). Sobre as mesmas 149 linhas ele acusou 64,
 * incluindo `Vector Databases`, `Microsoft Word`, `Modelagem de Teste` e
 * `Auditoria de TI`. A pergunta e inrespondivel por forma: `Kanban` e uma
 * palavra japonesa, `Bootstrap` e um substantivo comum, e um nome proprio
 * dentro de uma competencia legitima e regra, nao excecao. Um filtro que le o
 * CONTEUDO vai errar nos dois sentidos para sempre.
 *
 * Este helper recebe a lista já delimitada e só deduplica, limpa e limita a
 * cinco itens. Se a origem estrutural estiver inconclusiva, o parser deve
 * produzir uma lista conservadora para revisão; comprimento não é evidência.
 *
 * NAO E SILENCIOSO. Devolve o que descartou e por que, no molde de
 * `opcoesRenderizaveis` do BntSelect: descarte que some sem rastro vira "as
 * competencias sumiram e ninguem sabe por que" na primeira duvida.
 */

/**
 * Máximo de competências válidas que o produto extrai para o formulário.
 */
export const COMPETENCIAS_NO_EXPORT = 5;

export interface CompetenciasDoPdf {
  /** O que pode ser escrito no formulario. */
  aceitas: string[];
  /** O que ficou de fora, com o motivo, para o descarte ser rastreavel. */
  descartadas: { valor: string; motivo: string }[];
}

export function competenciasDoPdf(
  skillsPdf: readonly string[] | null | undefined,
  origemConfiavel = true,
): CompetenciasDoPdf {
  const lista = (skillsPdf ?? []).map((s) => s.trim()).filter((s) => s !== "");
  if (!origemConfiavel) {
    return {
      aceitas: [],
      descartadas: lista.map((valor, indice) => ({
        valor,
        motivo: `fronteira estrutural da seção inconclusiva (posição ${indice + 1}); exige revisão manual`,
      })),
    };
  }
  const aceitas: string[] = [];
  const descartadas: { valor: string; motivo: string }[] = [];

  lista.forEach((valor, indice) => {
    if (indice < COMPETENCIAS_NO_EXPORT) {
      aceitas.push(valor);
      return;
    }
    descartadas.push({
      valor,
      motivo: `além das ${COMPETENCIAS_NO_EXPORT} competências oferecidas para revisão (posição ${indice + 1})`,
    });
  });

  return { aceitas, descartadas };
}
