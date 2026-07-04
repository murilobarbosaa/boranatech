import { NextFunction, Request, Response } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
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
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
