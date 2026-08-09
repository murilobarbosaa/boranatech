import { z } from "zod";

// Schema do sub-objeto `preferences.onboardings` de public.profiles, que
// registra quais onboardings por rota a pessoa ja viu.
//
// Mora em shared/ porque `preferences` e um blob sem schema no banco (ver
// shared/profileFields.ts): o servidor grava o que vier. Como nao ha validacao
// do outro lado, a validacao na LEITURA e a unica que existe, e ela nao pode
// derrubar a pagina. Dado invalido => tratado como NAO VISTO, nunca excecao.
//
// NAO reaproveita profiles.onboarding_completed / onboarding_step: aqueles dois
// pertencem ao fluxo de /bem-vindo e significam outra coisa.

/** Chave do sub-objeto dentro de `profiles.preferences`. */
export const ONBOARDINGS_PREFERENCE_KEY = "onboardings";

/** Prefixo da chave de localStorage do fluxo anonimo: `bnt_onb:<routeKey>`. */
export const ONBOARDING_LOCAL_PREFIX = "bnt_onb:";

/** Chave do estado do tour guiado. Sempre localStorage, logado ou nao. */
export const ONBOARDING_TOUR_STORAGE_KEY = "bnt_onb_tour";

export const onboardingHowSchema = z.enum(["concluido", "pulado"]);

export const onboardingPerfilSchema = z.enum([
  "nao-sei-nada",
  "sei-mas-e-agora",
  "ja-estou-na-area",
]);

export const onboardingTourSchema = z.enum(["guiado", "livre"]);

export const onboardingDataSchema = z.object({
  perfil: onboardingPerfilSchema.optional(),
  tour: onboardingTourSchema.optional(),
});

/**
 * Um registro por rota. `seen` e literal `true` de proposito: o registro so
 * existe quando a pessoa viu, entao "seen:false" nao e um estado valido, e
 * gravado assim seria lido como visto por qualquer checagem de existencia.
 */
export const onboardingRecordSchema = z.object({
  seen: z.literal(true),
  how: onboardingHowSchema,
  /** ISO string. Nao usa z.iso.datetime(): carimbo torto nao invalida o "visto". */
  at: z.string(),
  data: onboardingDataSchema.optional(),
});

export type OnboardingHow = z.infer<typeof onboardingHowSchema>;
export type OnboardingRecord = z.infer<typeof onboardingRecordSchema>;
export type OnboardingRecordData = z.infer<typeof onboardingDataSchema>;
export type OnboardingRecordMap = Record<string, OnboardingRecord>;

/**
 * Le o mapa de registros de um valor desconhecido, ENTRADA POR ENTRADA.
 *
 * Parse do mapa inteiro descartaria tudo por causa de uma chave torta, e o
 * efeito seria reabrir onboarding em rota que a pessoa ja viu. Por entrada, o
 * estrago fica na entrada.
 */
export function parseOnboardingRecords(value: unknown): OnboardingRecordMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const out: OnboardingRecordMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const parsed = onboardingRecordSchema.safeParse(raw);
    if (parsed.success) out[key] = parsed.data;
  }
  return out;
}

/**
 * Estado do tour guiado.
 *
 * Nao guarda INDICE de propósito. A posicao e derivada da ordem canonica mais o
 * que ja esta visto, entao um indice salvo seria uma segunda fonte de verdade
 * capaz de divergir da primeira (a pessoa ve uma rota fora do tour, ou o lote
 * seguinte acrescenta rotas no meio da ordem). O que precisa sobreviver ao
 * reload e so "o tour esta rolando", que e um booleano.
 *
 * `active` e literal `true` pelo mesmo motivo de `seen`: o registro so existe
 * enquanto o tour roda, e `active:false` gravado seria lido como ativo por
 * qualquer checagem de existencia.
 */
export const onboardingTourStateSchema = z.object({
  active: z.literal(true),
  /** ISO. Usado para expirar tour esquecido, nunca para calcular posicao. */
  startedAt: z.string(),
});

export type OnboardingTourState = z.infer<typeof onboardingTourStateSchema>;

export function parseOnboardingTourState(
  value: unknown,
): OnboardingTourState | null {
  const parsed = onboardingTourStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Le um registro solto (o caso do localStorage, uma chave por rota). */
export function parseOnboardingRecord(value: unknown): OnboardingRecord | null {
  const parsed = onboardingRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
