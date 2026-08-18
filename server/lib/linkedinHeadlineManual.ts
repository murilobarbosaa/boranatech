import { HEADLINE_MANUAL_MAX } from "../../shared/linkedin/schema";

export interface HeadlineManualLonga {
  tamanho: number;
  limite: number;
}

/** Validação explícita usada pela rota antes do erro genérico do Zod. */
export function headlineManualLonga(
  value: unknown,
): HeadlineManualLonga | null {
  if (typeof value !== "string") return null;
  const tamanho = value.trim().length;
  return tamanho > HEADLINE_MANUAL_MAX
    ? { tamanho, limite: HEADLINE_MANUAL_MAX }
    : null;
}
