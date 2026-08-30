import { NextFunction, Request, Response } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  // Contexto estruturado repassado ao Sentry pelo handler central em app.ts
  // (scope.setContext). Nunca vaza ao cliente.
  context?: Record<string, unknown>;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // createError sempre seta statusCode numerico; um erro cru lancado nao tem.
  // Usamos isso para distinguir erro intencional de 500 inesperado.
  const fromCreateError = typeof err.statusCode === "number";
  const statusCode = fromCreateError ? err.statusCode! : 500;
  const code = err.code || "internal_error";

  if (statusCode >= 500) {
    console.error(
      `[error] ${req.method} ${req.path} (requestId: ${String(res.locals.requestId ?? "n/a")})`,
      err,
    );
  }

  // 500 inesperado (nao veio de createError): nao vaza err.message ao cliente.
  const message = fromCreateError
    ? err.message || "Erro interno do servidor."
    : "Erro interno do servidor.";

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

/**
 * Contexto do 500 do body parser, ou `null` quando o erro nao e desse tipo.
 *
 * POR QUE EXISTE. O `InternalServerError: stream is not readable`
 * (NODE-EXPRESS-B) chega ao Sentry com stack `readStream -> getRawBody ->
 * jsonParser` e sem a unica coisa que decide o conserto: quais headers a
 * requisicao trazia. A hipotese registrada em FavoritesContext.tsx e que o
 * `express.json()` global decide ler o corpo pelos HEADERS, e que a borda do
 * Railway acrescenta `Transfer-Encoding: chunked` quando nao ha
 * `Content-Length`. Isto MEDE, nao conserta: nada no parser muda.
 *
 * DETECCAO POR CAMPO. O `raw-body` marca o erro com um `type` fechado
 * (`raw-body/index.js:185-186`), e e ele que se le. A mensagem e texto e pode
 * mudar numa atualizacao sem aviso; `statusCode === 500` casaria com todo 500 do
 * servidor e carimbaria o contexto em cima de tudo, que e o mesmo que nao ter.
 *
 * So headers de TRANSPORTE entram. Nenhum corpo, nenhuma credencial, nada que o
 * `beforeSend` de server/lib/sentry.ts precise remover depois.
 */
// `type`, nao `interface`: o `scope.setContext` do Sentry espera um `Context`
// com index signature, e interface nao ganha uma implicita (o `pnpm check`
// reprova com TS2345). Alias de tipo ganha.
export type BodyParseContext = {
  contentLength: string | null;
  transferEncoding: string | null;
  contentType: string | null;
  method: string;
  route: string;
};

export function bodyParseContext(
  err: unknown,
  req: { headers?: Record<string, unknown>; method?: string; path?: string },
): BodyParseContext | null {
  const tipo = (err as { type?: unknown } | null | undefined)?.type;
  if (tipo !== "stream.not.readable") return null;

  const headers = req.headers ?? {};
  // Ausencia vira `null` EXPLICITO em vez de sumir do objeto: o caso suspeito e
  // justamente "requisicao sem Content-Length", entao a ausencia e o dado.
  const ler = (nome: string): string | null => {
    const valor = headers[nome];
    if (typeof valor === "string") return valor;
    if (Array.isArray(valor)) return valor.join(", ");
    return null;
  };

  return {
    contentLength: ler("content-length"),
    transferEncoding: ler("transfer-encoding"),
    contentType: ler("content-type"),
    method: typeof req.method === "string" ? req.method : "unknown",
    route: typeof req.path === "string" ? req.path : "unknown",
  };
}

export function createError(
  statusCode: number,
  code: string,
  message: string,
  // options.cause preserva o erro original: o integration LinkedErrors do Sentry
  // percorre err.cause e anexa o stack real, em vez de so a mensagem generica.
  // options.context vira scope.setContext.
  //
  // O CAUSE PRECISA SER UM `Error`. Ate 2026-08-30 este comentario dizia "ex.:
  // erro cru do Supabase" e omitia a condicao, e a omissao custou caro: o erro
  // cru do Supabase NAO e um `Error` (o postgrest-js devolve `JSON.parse(body)`
  // puro no modo `{ data, error }`), e o `aggregate-errors.js:28` do
  // @sentry/core so encadeia o que passa em `isInstanceOf(..., Error)`. Todo
  // sitio que passava erro do Supabase direto aqui gerava evento sem cadeia,
  // em silencio, desde o `89bf03ba`. Quem tem erro do Supabase em maos passa por
  // `erroEncadeavel` (server/lib/supabaseError.ts) antes.
  options?: { cause?: unknown; context?: Record<string, unknown> },
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (options?.cause !== undefined) err.cause = options.cause;
  if (options?.context) err.context = options.context;
  return err;
}
