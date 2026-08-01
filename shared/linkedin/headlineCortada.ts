/**
 * A headline lida do PDF tem assinatura de TRUNCAMENTO?
 *
 * Para o aviso do passo de revisao, que aparece ANTES de gastar cota: ali o
 * texto ainda esta na mao da pessoa e ela conserta de graca. Avisar depois da
 * analise so ofereceria reanalisar, que gasta outra cota.
 *
 * POR QUE MUDOU DE LUGAR, e a mudanca reverte um argumento anterior. Ate
 * 2026-08-01 este arquivo morava em `client/src/lib`, e o motivo escrito aqui
 * era que manter fora de `shared/` tornava ESTRUTURALMENTE impossivel um check
 * da regua passar a depender dele.
 *
 * O argumento caiu quando o `pendente` passou a ser PERSISTIDO: quem escreve o
 * bloco deterministico e o servidor, entao a deteccao tem de rodar la, e a
 * barreira por localizacao deixou de ser possivel. Preferiu-se mover o arquivo
 * a duplicar a regra nos dois lados, porque duas implementacoes da mesma regra
 * e a classe de defeito desta base.
 *
 * A garantia que sobra NAO e mais estrutural, e sim provada por DOIS testes,
 * que afirmam coisas diferentes:
 *
 *   `server/lib/linkedinDeteccaoNaoMoveNota.test.ts` prova AUSENCIA DE
 *   DEPENDENCIA: le `linkedinChecks.ts` da fonte, recorta o bloco dos
 *   avaliadores e afirma que nenhum deles consulta as funcoes deste arquivo;
 *   afirma o TOTAL de usos (exatamente um, o marcador) e que nenhuma linha que
 *   atribui `aprovado` menciona a deteccao. E o mais perto do que se perdeu:
 *   quebra na hora em que alguem importar, nao seis meses depois.
 *
 *   `shared/linkedin/reguaV2.pontosPendentes.test.ts` prova INERCIA DO
 *   RESULTADO: a flag nao move parcela nenhuma da decomposicao, com um teste de
 *   mutacao ao lado mostrando o que a implementacao errada produziria.
 *
 * Trocar barreira por asserção e uma piora real, e fica registrada aqui em vez
 * de sumir na diferenca de um commit.
 *
 * AS QUATRO ASSINATURAS, e o criterio de inclusao e ser INEQUIVOCA: nenhuma
 * pessoa escreve a headline assim de proposito. Medidas sobre as 162 analises
 * persistidas em 2026-07-31:
 *
 *   comeca em `|`          8 casos    a quebra cortou o inicio
 *   termina em `|`        14 casos    a quebra cortou o fim
 *   termina em `,`         1 caso     enumeracao aberta
 *   comeca em minuscula    4 casos    metade de uma frase de prosa
 *
 * FICA DE FORA, de proposito, a familia mais numerosa: "primeira secao com uma
 * palavra so" (39 casos). Ela casa `Student | Open to Internships` e
 * `Estudante | Analise e Desenvolvimento de Sistemas`, que sao headlines
 * legitimas e boas. Um aviso que erra queima a atencao que o aviso de verdade
 * vai precisar: a pessoa olha, nao ve nada errado, e aprende que o alerta e
 * ruido. Cobertura menor com precisao alta vale mais aqui.
 *
 * Tambem fica de fora "termina em conjuncao" (5 casos): depende de contexto e
 * nao deu para separar do legitimo na amostra.
 *
 * O QUE ISTO NAO E: nao e deteccao de todas as quebras. 86 das 156 headlines
 * antigas nao tem assinatura nenhuma, e uma headline truncada que por acaso
 * termine numa palavra e indetectavel aqui. O aviso pega o que da para pegar
 * sem errar; quem fecha o caso e a headline editavel.
 */

/** Comeca com separador orfao: o inicio da headline ficou na linha de cima. */
const COMECA_EM_SEPARADOR = /^\s*\|/;

/** Termina com separador orfao: a cauda ficou na linha de baixo. */
const TERMINA_EM_SEPARADOR = /\|\s*$/;

/** Enumeracao aberta em virgula. */
const TERMINA_EM_VIRGULA = /,\s*$/;

/**
 * Comeca em minuscula: e metade de uma frase, nao um comeco de headline.
 *
 * Sem `\p{Ll}`: o `target` do tsconfig nao aceita a flag `u`. Comparar com
 * `toLocaleLowerCase` cobre acentuada do mesmo jeito, e digito ou pontuacao nao
 * sao nem maiuscula nem minuscula (o que e o comportamento desejado: `.NET` e
 * `4Linux` nao disparam).
 */
function comecaEmMinuscula(valor: string): boolean {
  const c = valor.trim().charAt(0);
  return c !== "" && c === c.toLocaleLowerCase() && c !== c.toLocaleUpperCase();
}

/**
 * Qual assinatura casou, ou `null` se nenhuma.
 *
 * Existe separada do booleano por causa da telemetria: saber QUAL forma dispara
 * mais e o que permite decidir, depois, se alguma esta frouxa. Um booleano
 * agregado nao responde isso, e a alternativa seria recalcular no ponto de
 * captura, criando uma segunda implementacao da mesma regra.
 *
 * A ORDEM importa quando mais de uma casa (a headline da NTT DATA casa `inicio`
 * e `virgula` ao mesmo tempo): devolve a PRIMEIRA da lista, e a lista esta em
 * ordem de quanto a forma e conclusiva. Nao ha caso em que isso mude o
 * booleano, so o rotulo.
 */
export type AssinaturaDeCorte =
  | "inicio_pipe"
  | "fim_pipe"
  | "virgula"
  | "minuscula";

export function assinaturaDeCorte(
  headline: string | null | undefined,
): AssinaturaDeCorte | null {
  if (typeof headline !== "string") return null;
  const t = headline.trim();
  if (t === "") return null;
  if (COMECA_EM_SEPARADOR.test(t)) return "inicio_pipe";
  if (TERMINA_EM_SEPARADOR.test(t)) return "fim_pipe";
  if (TERMINA_EM_VIRGULA.test(t)) return "virgula";
  if (comecaEmMinuscula(t)) return "minuscula";
  return null;
}

export function headlineParecCortada(
  headline: string | null | undefined,
): boolean {
  return assinaturaDeCorte(headline) !== null;
}
