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

export function createError(
  statusCode: number,
  code: string,
  message: string,
  // options.cause preserva o erro original (ex.: erro cru do Supabase): o
  // integration LinkedErrors do Sentry percorre err.cause e anexa o stack real,
  // em vez de so a mensagem generica. options.context vira scope.setContext.
  options?: { cause?: unknown; context?: Record<string, unknown> },
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (options?.cause !== undefined) err.cause = options.cause;
  if (options?.context) err.context = options.context;
  return err;
}
