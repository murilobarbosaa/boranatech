import { NextFunction, Request, Response } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "internal_error";
  const message = err.message || "Erro interno do servidor.";

  if (statusCode === 500) {
    console.error(`[error] ${req.method} ${req.path}`, err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

export function createError(statusCode: number, code: string, message: string): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
