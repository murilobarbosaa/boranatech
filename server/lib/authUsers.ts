import { createError } from "../middleware/error";
import { erroEncadeavel } from "./supabaseError";
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
 * devolve so as duas colunas que a retencao usa. Sem paginacao: o corte de
 * linhas do PostgREST nao se aplica a retorno de funcao, e a resposta e uma
 * linha estreita por usuario.
 *
 * ERRO PROPAGA (o chamador transforma em estado/erro). Mapa vazio seria
 * indistinguivel de "base sem ninguem", e a retencao publicaria zeros como se
 * fossem medicao.
 */
export async function fetchAuthTimes(): Promise<Map<string, AuthTimes>> {
  const map = new Map<string, AuthTimes>();
  const { data, error } = await supabaseAdmin.rpc("admin_auth_times");
  if (error) {
    console.error("[authUsers] admin_auth_times falhou:", error);
    throw createError(500, "db_error", "Erro ao buscar dados de acesso.", {
      cause: erroEncadeavel(error),
      context: {
        op: "admin_auth_times",
        pgCode: (error as { code?: string } | null | undefined)?.code,
      },
    });
  }
  // Mesma guarda do wrapper irmao: `data` fora do formato faria a retencao
  // publicar zeros como se fossem medicao.
  if (!Array.isArray(data)) {
    throw createError(500, "db_error", "Erro ao buscar dados de acesso.", {
      context: { op: "admin_auth_times", recebido: typeof data },
    });
  }
  for (const row of data as AuthTimesRow[]) {
    map.set(row.user_id, {
      lastSignInAt: row.last_sign_in_at ?? null,
      createdAt: row.created_at ?? null,
    });
  }
  return map;
}
