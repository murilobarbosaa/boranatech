// Tipos do guard de canonical. O modulo em si e .mjs de proposito: ele e
// importado por scripts/prerender.mjs, que roda com `node` puro (sem tsx) no
// postbuild, e tambem pelo teste que trava o comportamento do guard.
export declare const REDIRECTS_ESPERADOS: Readonly<Record<string, string>>;
export declare function canonicalDoHtml(
  html: string | null | undefined,
): string | null;
export declare function conferirCanonical(
  rota: string,
  html: string,
): string | null;
