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
 * `storageKey`. Se um dia definir, esta funcao precisa acompanhar, e o
 * `client/public/sessao-init.js` tambem: ele repete a forma da chave porque roda
 * antes de qualquer modulo, e o sessaoInit.test.ts trava os dois juntos.
 */
export function chaveDaSessaoSupabase(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  } catch {
    return null;
  }
}

/**
 * Classe que `client/public/sessao-init.js` poe no <html> quando acha sessao,
 * antes do CSS e do bundle. Com ela o index.css esconde os links de visitante que
 * o prerender marcou com `data-auth-estatico` (ver Header). Vale so ate o React
 * montar: dali em diante quem decide e o Header vivo, e o App tira a classe.
 *
 * O sessao-init.js decide por um criterio MAIS AMPLO que `temSessaoPersistida`:
 * qualquer chave `sb-*-auth-token`, e nao so a deste projeto. Quem esta logado
 * aqui sempre sai marcado la; uma chave orfa marca sem sessao, e o custo e so o
 * espaco vazio no lugar dos links ate o React montar.
 */
export const CLASSE_SESSAO_PERSISTIDA = "bnt-sessao-persistida";

export function liberarMarcaDeSessaoEstatica(): void {
  document.documentElement.classList.remove(CLASSE_SESSAO_PERSISTIDA);
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
