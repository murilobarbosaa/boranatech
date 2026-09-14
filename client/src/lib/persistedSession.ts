/**
 * Existe sessao do Supabase persistida neste navegador?
 *
 * Leitura SINCRONA da PRESENCA da chave, sem parsear o conteudo: o valor carrega
 * o token de acesso, e aqui so importa se ele existe. Serve para o Header decidir
 * no primeiro render entre "Entrar" imediato (visitante sem sessao, a maioria) e
 * um espaco neutro enquanto a sessao de quem esta logado resolve. Presenca nao e
 * validade: um token vencido tambem conta, e quando o AuthContext resolver sem
 * usuario o Header volta ao "Entrar" de sempre.
 *
 * A chave e a padrao do supabase-js, `sb-<ref>-auth-token`, onde <ref> e o
 * primeiro rotulo do host do projeto, porque `lib/supabase.ts` nao define
 * `storageKey`. Se um dia definir, esta funcao precisa acompanhar.
 */
export function chaveDaSessaoSupabase(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  } catch {
    return null;
  }
}

export function temSessaoPersistida(): boolean {
  const chave = chaveDaSessaoSupabase(import.meta.env.VITE_SUPABASE_URL);
  if (!chave) return false;
  try {
    return window.localStorage.getItem(chave) !== null;
  } catch {
    return false;
  }
}
