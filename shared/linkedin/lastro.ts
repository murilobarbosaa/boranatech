import { numeraisSemLastro, removerNumeralSemLastro } from "./numeralLastro";

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
 *     texto da experiência daquele bloco, nunca contra o perfil inteiro.
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
  | "bullet_sem_origem";

export interface Violacao {
  tipo: TipoViolacao;
  campo: "headlines" | "bulletsReescritos";
  contexto: string;
  termo: string;
}

/**
 * Remove de um texto uma tecnologia sem lastro, preservando a frase.
 *
 * Cuida do separador que sobra: numa headline `A | B | C`, tirar `B` não pode
 * deixar `A |  | C`.
 */
export function removerTermoSemLastro(texto: string, termo: string): string {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return texto
    .replace(new RegExp(`\\s*\\b${escapado}\\b\\s*`, "gi"), " ")
    .replace(/\s*\|\s*(?=\|)/g, "")
    .replace(/^\s*\|\s*/, "")
    .replace(/\s*\|\s*$/, "")
    .replace(/\s*,\s*(?=,)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}
