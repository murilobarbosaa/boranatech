import { coletarTudoProvandoTotal } from "./paginate";
import { supabaseAdmin } from "./supabaseAdmin";

export type AuthTimes = {
  lastSignInAt: string | null;
  createdAt: string | null;
};

/** Uma linha de `public.admin_auth_times`, como o PostgREST a devolve. */
type AuthTimesRow = {
  user_id: string;
  last_sign_in_at: string | null;
  created_at: string | null;
};

/**
 * `last_sign_in_at` e `created_at` de todos os usuarios, em UMA query.
 *
 * ATE 2026-09-02 ISTO ERA UMA VARREDURA HTTP: `auth.admin.listUsers` de 1000 em
 * 1000 sobre a base inteira, carregando e-mail e metadata de todo mundo para
 * usar duas datas. Com 8.317 perfis eram ate 9 requisicoes por execucao. E o
 * mesmo scan que derrubou o churn-risk em 31/08 com
 * `AuthRetryableFetchError: The operation was aborted due to timeout` (issue
 * NODE-EXPRESS-T); aqui ele nunca estourou, mas o custo e o risco eram os
 * mesmos, e o consumidor (metricas de retencao) roda sobre a base toda.
 *
 * Agora e a RPC `admin_auth_times`, que le `auth.users` dentro do banco e
 * devolve so as duas colunas que a retencao usa.
 *
 * ISTO AQUI AFIRMAVA, ATE 02/09/2026, QUE NAO PRECISAVA PAGINAR: "o corte de
 * linhas do PostgREST nao se aplica a retorno de funcao". E FALSO, e o custo foi
 * imediato. Medido em producao no mesmo dia, logo depois do deploy:
 * `POST /rpc/admin_auth_times` respondia 200 com `content-range: 0-999/8370`.
 * A funcao devolve 8.370 linhas e o Supabase entrega 1000, sem erro e sem
 * aviso. A retencao passou a ler 1000 de 8.370 e a jogar o resto em `d30plus`,
 * ou seja, gente que acessou ontem contada como fria.
 *
 * Comentario errado em codigo e pior que comentario ausente, porque ensina o
 * engano; por isso o texto falso nao foi apagado, foi trocado por esta nota com
 * a medicao. Agora a leitura pagina e PROVA o total contra
 * `{ count: "exact" }`, em `coletarTudoProvandoTotal`.
 *
 * ERRO PROPAGA (o chamador transforma em estado/erro). Mapa vazio seria
 * indistinguivel de "base sem ninguem", e a retencao publicaria zeros como se
 * fossem medicao.
 */
export async function fetchAuthTimes(): Promise<Map<string, AuthTimes>> {
  const linhas = await coletarTudoProvandoTotal<AuthTimesRow>(
    (from, to) =>
      supabaseAdmin
        .rpc("admin_auth_times", {}, { count: "exact" })
        // `order` obrigatorio: OFFSET sem ordem definida repete e pula linhas ao
        // mesmo tempo, o que mantem a CONTAGEM certa e o conjunto errado, e
        // passaria pela prova de total sem ser pego.
        .order("user_id")
        .range(from, to),
    { op: "admin_auth_times" },
  );

  const map = new Map<string, AuthTimes>();
  for (const row of linhas) {
    map.set(row.user_id, {
      lastSignInAt: row.last_sign_in_at ?? null,
      createdAt: row.created_at ?? null,
    });
  }
  return map;
}
