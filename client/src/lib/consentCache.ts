/**
 * Marca LOCAL de consentimento ja confirmado pelo servidor, por usuario.
 *
 * So ACELERA quem ja consentiu: com a marca, o ConsentGate comeca liberado e
 * confirma em segundo plano. Nunca substitui o servidor. O primeiro "nao" dele
 * bloqueia na hora e apaga a marca, e sem marca o gate continua fail-closed.
 *
 * Por usuario, e nao global, para uma sessao nova no mesmo navegador nao herdar o
 * aceite de outra pessoa. Falha de storage (modo privado, cota) degrada para "sem
 * marca", que e o caminho fail-closed: nunca para "com marca".
 */
const PREFIXO = "bnt:consent-ok:";

export function consentimentoConfirmadoEmCache(userId: string): boolean {
  try {
    return window.localStorage.getItem(PREFIXO + userId) === "1";
  } catch {
    return false;
  }
}

export function marcarConsentimentoConfirmado(userId: string): void {
  try {
    window.localStorage.setItem(PREFIXO + userId, "1");
  } catch {
    // Sem storage a proxima carga so volta ao caminho fail-closed.
  }
}

export function limparConsentimentoConfirmado(userId: string): void {
  try {
    window.localStorage.removeItem(PREFIXO + userId);
  } catch {
    // Idem: sem storage nao ha marca para limpar.
  }
}
