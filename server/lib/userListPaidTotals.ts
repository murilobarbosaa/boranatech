import {
  totalPagoCents,
  type DeclaredRefund,
  type FinanceRow,
} from "./userTransactions";

// TOTAL PAGO por linha da LISTA de usuarios.
//
// POR PAGINA e em NUMERO FIXO DE CONSULTAS. A pagina tem ate 100 linhas, e a
// forma obvia (somar o extrato de cada usuario) seriam 200 idas ao banco por
// request, duas por linha. Aqui sao DUAS, sempre: uma por fonte, com
// `.in(user_ids)`, e o agrupamento acontece em memoria.
//
// DUAS FONTES, e nao uma, porque a conta canonica precisa das duas:
// `finance_transactions` tem os pagamentos sincronizados da Stripe (refund e
// dispute ja entram com `gross_cents` negativo), e `admin_refunds` tem as
// devolucoes DECLARADAS, que nao produzem linha nenhuma na Stripe e por isso
// entram subtraindo. Somar so a primeira daria um total bruto, maior que o
// real, exatamente no caso em que alguem devolveu dinheiro por fora.
//
// A CONTA E EMPRESTADA, nao reescrita. `totalPagoCents` e a mesma funcao do
// extrato e do modal de detalhe, e o cabecalho dela registra por que: ate
// 2026-07-30 o detalhe tinha o proprio `reduce`, e duas somas da mesma coisa
// divergiram no primeiro caso real (uma devolucao externa fazia o extrato dizer
// "reembolsada" e o total dizer que o dinheiro ficou). Reimplementar a soma
// aqui, mesmo "simples", recriaria a divergencia numa terceira tela.

/** O que este modulo precisa de uma linha financeira: o resto nao e lido. */
export type LinhaFinanceira = Pick<FinanceRow, "type" | "gross_cents"> & {
  user_id: string | null;
};

export type DeclaracaoDeDevolucao = DeclaredRefund & {
  user_id: string | null;
};

/**
 * Total pago (centavos) por usuario, a partir das linhas JA carregadas.
 *
 * ZERO E AFIRMACAO. Usuario sem nenhuma linha nas duas fontes recebe `0`, e
 * isso quer dizer "nunca pagou", que e um fato sobre ele. O caso em que NAO se
 * sabe (uma das consultas falhou) nao chega aqui: a rota nem chama esta funcao
 * e manda `null` para a linha inteira, para a tela poder dizer que nao olhou em
 * vez de dizer que nao houve.
 */
export function totaisPagosPorUsuario(
  userIds: string[],
  linhas: LinhaFinanceira[],
  declaracoes: DeclaracaoDeDevolucao[],
): Map<string, number> {
  const linhasPorUsuario = new Map<string, LinhaFinanceira[]>();
  for (const linha of linhas) {
    if (!linha.user_id) continue;
    const lista = linhasPorUsuario.get(linha.user_id);
    if (lista) lista.push(linha);
    else linhasPorUsuario.set(linha.user_id, [linha]);
  }

  const declaracoesPorUsuario = new Map<string, DeclaracaoDeDevolucao[]>();
  for (const declaracao of declaracoes) {
    if (!declaracao.user_id) continue;
    const lista = declaracoesPorUsuario.get(declaracao.user_id);
    if (lista) lista.push(declaracao);
    else declaracoesPorUsuario.set(declaracao.user_id, [declaracao]);
  }

  const totais = new Map<string, number>();
  for (const uid of userIds) {
    totais.set(
      uid,
      totalPagoCents(
        linhasPorUsuario.get(uid) ?? [],
        declaracoesPorUsuario.get(uid) ?? [],
      ),
    );
  }
  return totais;
}
