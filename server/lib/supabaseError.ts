/**
 * Envelopa o erro do supabase-js num `Error` de verdade, para o Sentry
 * conseguir encadea-lo.
 *
 * O DEFEITO QUE ISTO CONSERTA, medido em 2026-08-30. Desde o `89bf03ba` varios
 * pontos do servidor passam o erro do Supabase como `cause` do `createError`,
 * com o comentario dizendo que o `LinkedErrors` do Sentry o anexaria ao evento.
 * A cadeia NUNCA se formou. Duas medicoes independentes:
 *
 *   1. `@sentry/core/build/cjs/utils/aggregate-errors.js:28` percorre o `cause`
 *      so quando ele passa em `isInstanceOf(error[key], Error)`.
 *   2. O `postgrest-js`, no modo `{ data, error }` que este projeto usa, devolve
 *      `JSON.parse(body)` PURO no ramo de resposta HTTP de erro. Testado com um
 *      `fetch` falso devolvendo 409: `error instanceof Error` da `false`,
 *      `constructor.name` da `Object`, e nao ha `stack`. A classe
 *      `PostgrestError`, que estende `Error`, so e construida quando
 *      `shouldThrowOnError` esta ligado, ou seja, no modo `.throwOnError()`, que
 *      nao e o usado aqui.
 *
 * Resultado: `cause` recebia um objeto plano, o `LinkedErrors` o ignorava, e o
 * evento chegava com uma exceção so. O que salvou o diagnostico do BUG-77 foi o
 * breadcrumb do `console.error` vizinho, por acidente de desenho, nao pelo
 * mecanismo que os comentarios afirmavam.
 *
 * O QUE ENTRA NA MENSAGEM, e por que. Propriedade solta num `Error` NAO viaja
 * para o Sentry: o `exceptionFromError` do SDK monta o evento a partir de
 * `name`, `message` e `stack`, e mais nada. Anexar `code` como propriedade e
 * achar que ela aparece seria repetir o erro que este arquivo existe para
 * corrigir, uma camada adiante. Entao `code`, `details` e `hint` entram no
 * TEXTO da mensagem, que e o campo `value` da exceção e sempre aparece. No
 * BUG-77 era o `details` que carregava o `user_id` afetado.
 *
 * `name` fica FIXO em `SupabaseError`, sem o codigo dentro. O `name` vira o
 * campo `type` da exceção encadeada e participa do agrupamento; embutir o
 * `23505` ali criaria uma issue nova por codigo de Postgres, que e o oposto do
 * que se quer (a serie por tipo de operacao e o que interessa).
 */

/** Formato do erro do PostgREST. Todos os campos podem faltar. */
type ErroPlanoDoSupabase = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

/** Texto nao vazio, ou `null`. Evita despejar `null`/`undefined` na mensagem. */
function textoOuNulo(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/**
 * Devolve algo que o `LinkedErrors` consegue encadear.
 *
 * CONTRATO, e cada ramo existe por um motivo:
 *
 * - Ja e `Error`: devolve INTACTO. Envelopar de novo criaria um elo a mais na
 *   cadeia sem informacao nova, e apagaria o `name` real (`GithubFetchError`,
 *   `AbortError`) que e justamente o que identifica a falha.
 * - `null` ou `undefined`: devolve como veio. `createError` ja ignora
 *   `undefined`, e fabricar um `Error` com mensagem inventada sobre a ausencia
 *   de erro seria criar informacao que ninguem observou.
 * - Objeto no formato do PostgREST: envelopa com a mensagem do Postgres.
 * - Qualquer outra coisa (string, numero, objeto sem `message`): envelopa com
 *   `String(bruto)` e NADA mais. Sem campo inventado: se nao veio `code`, o
 *   evento nao ganha um `code` vazio para alguem interpretar depois.
 */
export function erroEncadeavel(bruto: unknown): unknown {
  if (bruto instanceof Error) return bruto;
  if (bruto === null || bruto === undefined) return bruto;

  if (typeof bruto === "object") {
    const o = bruto as ErroPlanoDoSupabase;
    const message = textoOuNulo(o.message);
    if (message !== null) {
      const code = textoOuNulo(o.code);
      const details = textoOuNulo(o.details);
      const hint = textoOuNulo(o.hint);
      const partes = [code === null ? message : `[${code}] ${message}`];
      if (details !== null) partes.push(`details: ${details}`);
      if (hint !== null) partes.push(`hint: ${hint}`);
      return montar(partes.join(" | "), bruto);
    }
  }

  return montar(String(bruto), bruto);
}

/**
 * Monta o `Error` e pendura o objeto original.
 *
 * `original` fica NAO ENUMERAVEL de proposito: ele existe para quem depura no
 * servidor ler o objeto exato, e nao para virar ruido em `JSON.stringify` nem
 * em `console.error`, que ja recebem o texto completo pela mensagem. Preservar o
 * bruto evita trocar uma perda por outra: a mensagem e legivel mas achatada, e o
 * objeto continua ali para quem precisar do campo separado.
 */
function montar(mensagem: string, original: unknown): Error {
  const err = new Error(mensagem);
  err.name = "SupabaseError";
  Object.defineProperty(err, "original", {
    value: original,
    enumerable: false,
    writable: false,
    configurable: true,
  });
  return err;
}
