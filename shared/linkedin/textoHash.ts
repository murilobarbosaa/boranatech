/** Normalização mínima e compartilhada entre o SHA-256 do server e do client. */
export function normalizarTextoParaHash(texto: string): string {
  return texto.replace(/\r\n?/g, "\n").trim();
}

export function textoHashValido(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

/**
 * Identidade forte e conservadora. Ausência ou corrupção nunca cai em
 * heurística de comprimento: retorna falso e não afirma que os perfis são os
 * mesmos.
 */
export function mesmoTextoHash(atual: unknown, anterior: unknown): boolean {
  return (
    textoHashValido(atual) && textoHashValido(anterior) && atual === anterior
  );
}

export function analiseAnteriorDoMesmoTexto<
  T extends { textoHash?: string | null },
>(
  analyses: readonly T[],
  textoHash: string | null | undefined,
  inicio = 0,
): T | undefined {
  if (!textoHashValido(textoHash)) return undefined;
  return analyses
    .slice(inicio)
    .find((analysis) => mesmoTextoHash(textoHash, analysis.textoHash));
}
