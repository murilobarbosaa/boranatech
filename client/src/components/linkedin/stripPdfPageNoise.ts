/**
 * Limpeza SO da camada de EXIBICAO do "seu atual" do prontuario: o export
 * em PDF do LinkedIn injeta artefatos de paginacao no meio do texto
 * ("Page 2 of 3", "Página 1 de 2"). A sanitizacao vive aqui no client e
 * NUNCA em shared/linkedin/parse.ts: o parse alimenta o scoring do server
 * e o texto pontuado nao pode divergir; aqui a gente so esconde o ruido
 * na hora de mostrar.
 *
 * Regex conservadora: exige o token completo "page N of M" ou
 * "pagina N de M" (com ou sem acento), entre limites de espaco. Frases
 * legitimas com "page" ou com numeros soltos ("2 de 3 metricas") passam
 * intactas.
 */
const PAGE_NOISE_RE =
  /(?:^|\s)(?:page|p[aá]gina)\s+\d+\s+(?:of|de)\s+\d+(?=\s|$)/gi;

export function stripPdfPageNoise(text: string): string {
  return text
    .replace(PAGE_NOISE_RE, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
