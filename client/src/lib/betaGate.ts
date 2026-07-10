// Ponto unico de verdade pro token do portao de lancamento (beta). Acesso e por
// token, independente do auth do Supabase. Guardado no localStorage.
const BETA_TOKEN_KEY = "bnt_beta_token";

export function getBetaToken(): string | null {
  try {
    return localStorage.getItem(BETA_TOKEN_KEY);
  } catch {
    // localStorage indisponivel (modo privado, etc): trata como sem token.
    return null;
  }
}

export function setBetaToken(token: string): void {
  try {
    localStorage.setItem(BETA_TOKEN_KEY, token);
  } catch {
    // Sem storage nao da pra persistir; ignora sem quebrar o fluxo.
  }
}
