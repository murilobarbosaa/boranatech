// A LINHA DE BAIXO DO CARD "RECEITA EM RISCO" (D21).
//
// Mora fora do `Admin.tsx` por um motivo só: ela tem TRÊS caminhos (breakdown
// completo, uma família só, e a resposta antiga sem breakdown nenhum), e caminho
// que só existe na janela de deploy é exatamente o que ninguém exercita à mão.
// Aqui ele tem teste.

export type RiscoDoCard = {
  count: number;
  mrrCents: number;
  saindo?: { count: number; mrrCents: number };
  emAtraso?: { count: number; mrrCents: number };
  percentOfMrr?: number | null;
};

function plural(n: number, um: string, muitos: string): string {
  return n === 1 ? um : muitos;
}

/**
 * "20 saindo + 1 em atraso", com as degradações declaradas.
 *
 * BACKEND ANTIGO NA JANELA DE DEPLOY: `saindo` e `emAtraso` nasceram na rodada
 * 8, e uma aba aberta desde antes do deploy segue recebendo a resposta sem eles.
 * Nesse caso a frase cai para a genérica, que continua VERDADEIRA (só menos
 * específica) em vez de imprimir "undefined saindo". Este é o caso que o
 * `janelaDeDeployInversa.test.ts` trava para a base inteira.
 *
 * FAMÍLIA VAZIA SOME da frase em vez de virar "0 em atraso": zero itens de uma
 * família não é informação, é ruído, e "20 saindo + 0 em atraso" faz alguém
 * procurar o que não existe.
 */
export function detalheDeRisco(risco: RiscoDoCard | null | undefined): string {
  if (!risco || typeof risco.count !== "number") {
    return "Sem dados de risco.";
  }

  const saindo = risco.saindo?.count;
  const atraso = risco.emAtraso?.count;

  // Resposta antiga: nenhum dos dois campos existe. A frase genérica é o que o
  // card dizia antes desta rodada, e continua correta.
  if (typeof saindo !== "number" && typeof atraso !== "number") {
    return `${risco.count} ${plural(risco.count, "assinatura", "assinaturas")} em risco`;
  }

  const partes: string[] = [];
  if (typeof saindo === "number" && saindo > 0) partes.push(`${saindo} saindo`);
  if (typeof atraso === "number" && atraso > 0) {
    partes.push(`${atraso} em atraso`);
  }

  // As duas famílias vazias com `count` zero: é o estado bom, e ele merece uma
  // frase própria em vez de uma string vazia com cara de campo faltando.
  if (partes.length === 0) return "Nenhuma assinatura em risco";

  return partes.join(" + ");
}
