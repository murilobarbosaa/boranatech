// Varredura paginada robusta ao max-rows do PostgREST.
//
// O padrao antigo espalhado pelo projeto (`from += PAGE`, break em
// `rows.length < PAGE`) trunca silenciosamente quando o servidor devolve menos
// linhas que PAGE por pagina (db-max-rows abaixo de PAGE): a 1a pagina ja vem
// curta e o loop encerra achando que a origem acabou, e o incremento fixo ainda
// pula as linhas entre o max-rows e o PAGE. Aqui avancamos pelo tamanho REAL da
// pagina e so paramos numa pagina VAZIA, entao a varredura independe da config
// de max-rows. Custo: uma consulta vazia extra ao final de cada varredura cujo
// total nao e multiplo exato do pageSize (mesma ordem de grandeza do padrao
// antigo, que ja fazia a consulta extra nos multiplos exatos).
//
// Evolucao futura: paginacao keyset por (created_at, id) elimina a consulta
// extra e o custo de OFFSET grande, mas exige uma coluna de cursor estavel por
// chamada; mantido OFFSET por ser drop-in nas queries atuais (a ordenacao de
// cada chamada e preservada exatamente como esta).

const DEFAULT_PAGE_SIZE = 1000;

// Shape minimo de uma resposta do supabase-js suficiente pra paginar: data e o
// array da pagina (ou null), error carrega ao menos a mensagem. PostgrestResponse
// satisfaz isto estruturalmente (campos extras sao ignorados).
export type PaginatedPage<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

// Itera todas as linhas de uma origem paginada. `fetchPage` recebe o intervalo
// [from, to] INCLUSIVO (mesma semantica de PostgREST `.range(from, to)`) e
// devolve a pagina; a ordenacao/filtros ficam por conta do chamador, dentro do
// fetchPage. `errorLabel` prefixa a mensagem no throw (mesmo texto que cada
// chamada usava). Um `break` no `for await` do chamador encerra a varredura e
// fecha o gerador normalmente.
export async function* paginateRange<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PaginatedPage<T>>,
  options: { errorLabel: string; pageSize?: number },
): AsyncGenerator<T, void, unknown> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  for (let from = 0; ; ) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) {
      throw new Error(`${options.errorLabel}: ${error.message}`);
    }
    const rows = data ?? [];
    for (const row of rows) {
      yield row;
    }
    // Para so na pagina vazia (nunca em `rows.length < pageSize`): assim uma
    // pagina curta por max-rows nao encerra a varredura antes da hora.
    if (rows.length === 0) break;
    // Avanca pelo tamanho REAL da pagina (nao por pageSize fixo): se o servidor
    // capar abaixo do pageSize, a proxima pagina comeca onde esta parou, sem
    // pular linhas.
    from += rows.length;
  }
}

/**
 * Varre TUDO e devolve um array. Erro PROPAGA.
 *
 * Para código de lib que já propaga (billingMetrics, financeMetrics): a exceção
 * sobe e ninguém recebe um agregado parcial achando que é o total.
 *
 * Sempre ORDENE dentro do `fetchPage`. Paginação por OFFSET sem ORDER BY tem
 * ordem indefinida no Postgres, e duas páginas podem repetir ou pular linhas —
 * o que produziria exatamente o erro silencioso que a paginação existe para
 * evitar, só que mais difícil de perceber.
 */
export async function coletarTudo<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PaginatedPage<T>>,
  errorLabel: string,
): Promise<T[]> {
  const linhas: T[] = [];
  for await (const row of paginateRange<T>(fetchPage, { errorLabel })) {
    linhas.push(row);
  }
  return linhas;
}

/**
 * O mesmo, no shape tagueado do supabase-js (`{ data, error }`).
 *
 * Existe para os chamadores que JÁ tratam a falha de um jeito específico
 * (cron que marca a rodada como `error`, rota que degrada uma seção). Trocar
 * esse tratamento por um throw ao paginar mudaria a postura de erro deles de
 * carona, e postura de erro é decisão, não detalhe.
 */
export async function coletarTagueado<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PaginatedPage<T>>,
  errorLabel: string,
): Promise<{ data: T[] | null; error: { message: string } | null }> {
  try {
    return { data: await coletarTudo(fetchPage, errorLabel), error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
}
