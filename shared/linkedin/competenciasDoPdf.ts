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
 * CRITERIO: POSICIONAL, nunca lexical.
 *
 * O export "Salvar como PDF" do LinkedIn lista exatamente TRES competencias na
 * secao "Principais competencias". Nos dados: 114 das 149 linhas tem exatamente
 * 3, 8 tem zero (secao ausente), e TODAS as demais passam de 3 por duas causas
 * que nao sao competencia nova:
 *
 *   (A) a competencia quebrou de linha no PDF e virou dois itens
 *       (`Retrieval-Augmented Generation` + `(RAG)`);
 *   (B) o corte da secao lateral passou do fim e engoliu identidade
 *       (nome, headline, cidade, estado, pais).
 *
 * As duas somem com o mesmo teto, e por isso o teto vem antes de qualquer
 * conserto de parser: cobre a causa conhecida e a que ainda nao foi vista.
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
 * O teto posicional NAO OLHA o texto. Por construcao, ele nao consegue
 * descartar `Kanban` por parecer nome, nem manter `Joana Silva` por nao
 * parecer: a decisao e o indice. E a propriedade que o teste
 * `competenciasDoPdf.test.ts` afirma diretamente.
 *
 * NAO E SILENCIOSO. Devolve o que descartou e por que, no molde de
 * `opcoesRenderizaveis` do BntSelect: descarte que some sem rastro vira "as
 * competencias sumiram e ninguem sabe por que" na primeira duvida.
 */

/**
 * Quantas competencias o export do LinkedIn realmente lista.
 *
 * Mudar este numero e ato deliberado: se o LinkedIn passar a exportar mais, o
 * teto passa a cortar competencia legitima, e o sinal disso e o `descartadas`
 * encher de termo tecnico em vez de nome e cidade.
 */
export const COMPETENCIAS_NO_EXPORT = 3;

export interface CompetenciasDoPdf {
  /** O que pode ser escrito no formulario. */
  aceitas: string[];
  /** O que ficou de fora, com o motivo, para o descarte ser rastreavel. */
  descartadas: { valor: string; motivo: string }[];
}

export function competenciasDoPdf(
  skillsPdf: readonly string[] | null | undefined,
): CompetenciasDoPdf {
  const lista = (skillsPdf ?? []).map((s) => s.trim()).filter((s) => s !== "");
  const aceitas: string[] = [];
  const descartadas: { valor: string; motivo: string }[] = [];

  lista.forEach((valor, indice) => {
    if (indice < COMPETENCIAS_NO_EXPORT) {
      aceitas.push(valor);
      return;
    }
    descartadas.push({
      valor,
      motivo: `alem das ${COMPETENCIAS_NO_EXPORT} competencias que o export lista (posicao ${indice + 1})`,
    });
  });

  return { aceitas, descartadas };
}
