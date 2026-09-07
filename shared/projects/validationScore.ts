import type { RequisitoAvaliacao } from "../github/schema";

// Nota da validacao por IA (lote 06).
//
// Antes o veredito era binario e exigia 100%: um requisito "parcial" num
// projeto de dez reprovava tudo, e a pessoa via "reprovado" sem saber quanto
// faltava. A nota troca isso por "8 de 10", com corte em 80%.

/** Fracao minima de requisitos atendidos para valer como validado. */
export const VALIDATION_CUTOFF = 0.8;

export type NotaValidacao = {
  atendidos: number;
  total: number;
  /** Inteiro, arredondado PARA BAIXO. So para exibir. */
  percentual: number;
  /** Ids dos requisitos que nao contaram como atendidos, na ordem original. */
  pendentes: string[];
  validado: boolean;
  perfeito: boolean;
};

/**
 * Calcula a nota a partir dos requisitos DECLARADOS e da avaliacao da IA.
 *
 * A fonte da verdade e a lista de requisitos, nao a resposta da IA: requisito
 * sem item correspondente conta como pendente (a IA omitiu), e item repetido
 * nao conta duas vezes. Fail closed nos dois casos, porque os dois sao falha
 * do avaliador e nao merito de quem entregou.
 *
 * O corte compara a FRACAO, nunca o percentual arredondado: 7 de 9 e 0.777 e
 * nao valida, embora arredonde para 77 e alguem pudesse achar que "77 esta
 * perto". 8 de 10 e exatamente 0.8 e valida.
 */
export function calcularNota(
  requisitoIds: readonly string[],
  avaliacao: readonly RequisitoAvaliacao[],
): NotaValidacao {
  // Primeiro item de cada id vence: uma segunda avaliacao do mesmo requisito
  // nao pode melhorar a nota.
  const porId = new Map<string, RequisitoAvaliacao>();
  for (const item of avaliacao) {
    if (!porId.has(item.id)) porId.set(item.id, item);
  }

  const pendentes = requisitoIds.filter(
    (id) => porId.get(id)?.veredito !== "atende",
  );
  const total = requisitoIds.length;
  const atendidos = total - pendentes.length;
  const fracao = total === 0 ? 0 : atendidos / total;

  return {
    atendidos,
    total,
    percentual: Math.floor(fracao * 100),
    pendentes: [...pendentes],
    validado: total > 0 && fracao >= VALIDATION_CUTOFF,
    perfeito: total > 0 && atendidos === total,
  };
}
