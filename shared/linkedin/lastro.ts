/**
 * Camada ÚNICA de lastro do texto gerado pela IA.
 *
 * Três rodadas produziram três instâncias do mesmo mecanismo: competências
 * sugeridas sem lastro, numeral fabricado em bullet, e tecnologia sem lastro em
 * headline. A origem é sempre a mesma: a lista de tecnologias faltantes vai no
 * prompt e o modelo a lê como lista de coisas a usar. Em vez de uma verificação
 * por campo, esta é uma só, aplicada a todos os campos de texto gerado.
 *
 * CAMPOS COBERTOS:
 *   - `headlines`: lastro de TECNOLOGIA (contra keywordsEncontradas).
 *   - `bulletsReescritos`: lastro de TECNOLOGIA e de NUMERAL, os dois contra o
 *     texto da experiência daquele bloco, nunca contra o perfil inteiro. A
 *     experiência do bloco é identificada pelo `experienciaNumero` que o modelo
 *     devolve, o mesmo que o prompt numerou. Número fora do intervalo real
 *     descarta o bloco inteiro: não existe caminho que devolva bullet sem ter
 *     sido conferido contra uma experiência de verdade.
 *
 * CAMPOS NÃO COBERTOS, com o motivo:
 *   - `sobreReescrito`: parafraseia a seção Sobre, cuja fonte legítima é o
 *     perfil inteiro (headline, experiências, competências coladas). O critério
 *     de lastro é frouxo demais para virar remoção automática: apagar um termo
 *     do meio de um parágrafo corrido quebra a frase de um jeito que o leitor
 *     percebe, e o risco de falso positivo é maior que o dano do falso negativo.
 *     Fica com a instrução do prompt e com a leitura humana.
 *   - `resumo`, `pontosFortes`, `pontosFracos`, `melhorias`, `proximoPasso`:
 *     texto de conversa, avaliativo, não é afirmação factual copiável.
 *   - `skillsParaEstudar`: já tem origem fechada (só sai da lista de faltantes
 *     entregue no prompt); `skillsParaAdicionarAgora` é calculado em código.
 */

export type TipoViolacao =
  | "numeral_fabricado"
  | "numeral_tipo_trocado"
  | "tecnologia_sem_lastro"
  | "bullet_sem_origem"
  /**
   * O bloco aponta para um `experienciaNumero` que não existe na lista enviada
   * ao modelo. Tipo próprio, e não `bullet_sem_origem`, porque a causa é outra
   * e a leitura do painel muda: aqui o modelo inventou a ÂNCORA, não escreveu
   * bullet para uma experiência vazia. Era este o caso que, sob o casamento por
   * token, devolvia o bloco intacto.
   */
  | "bloco_experiencia_invalida";

export interface Violacao {
  tipo: TipoViolacao;
  campo: "headlines" | "bulletsReescritos";
  contexto: string;
  termo: string;
}
