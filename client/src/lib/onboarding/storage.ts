import {
  ONBOARDINGS_PREFERENCE_KEY,
  ONBOARDING_LOCAL_PREFIX,
  parseOnboardingRecord,
  parseOnboardingRecords,
  type OnboardingRecord,
  type OnboardingRecordMap,
} from "@shared/onboarding/schema";
import type { Profile } from "@/services/contracts";
import { updateMyProfile } from "@/services/profileService";

// Persistencia dupla do "ja vi este onboarding":
//   - logado  : profiles.preferences.onboardings[routeKey]
//   - anonimo : localStorage, chave `bnt_onb:<routeKey>`
//
// O PATCH /api/me SOBRESCREVE `preferences` inteiro (server/routes/me.ts faz
// `updates[field] = body[field]`, sem merge). Entao toda escrita aqui e
// read-modify-write sobre o `preferences` que o AuthContext ja tem em maos.
// Mandar so `{ onboardings: ... }` apagaria todo o resto do blob.

/** Le os registros do perfil. Nunca lanca: dado torto vira "nao visto". */
export function readProfileRecords(
  profile: Profile | null | undefined,
): OnboardingRecordMap {
  const preferences = profile?.preferences;
  if (!preferences || typeof preferences !== "object") return {};
  return parseOnboardingRecords(
    (preferences as Record<string, unknown>)[ONBOARDINGS_PREFERENCE_KEY],
  );
}

function localKey(routeKey: string): string {
  return `${ONBOARDING_LOCAL_PREFIX}${routeKey}`;
}

/** Acesso a localStorage sempre dentro de try: modo privado / storage cheio. */
function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalRecord(routeKey: string): OnboardingRecord | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(localKey(routeKey));
    if (!raw) return null;
    return parseOnboardingRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Todos os registros anonimos validos, indexados por routeKey. */
export function readAllLocalRecords(): OnboardingRecordMap {
  const storage = safeLocalStorage();
  if (!storage) return {};

  const out: OnboardingRecordMap = {};
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !key.startsWith(ONBOARDING_LOCAL_PREFIX)) continue;
      const raw = storage.getItem(key);
      if (!raw) continue;
      let record: OnboardingRecord | null = null;
      try {
        record = parseOnboardingRecord(JSON.parse(raw));
      } catch {
        record = null;
      }
      if (record) out[key.slice(ONBOARDING_LOCAL_PREFIX.length)] = record;
    }
  } catch {
    return out;
  }
  return out;
}

export function writeLocalRecord(
  routeKey: string,
  record: OnboardingRecord,
): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(localKey(routeKey), JSON.stringify(record));
  } catch {
    // localStorage indisponivel ou cheio. O onboarding ja fechou; reaparecer na
    // proxima visita e o pior que acontece.
  }
}

function removeLocalRecords(routeKeys: string[]): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  for (const routeKey of routeKeys) {
    try {
      storage.removeItem(localKey(routeKey));
    } catch {
      // idem.
    }
  }
}

/**
 * Ja viu? Le as DUAS fontes.
 *
 * O localStorage continua valendo para quem esta logado porque a migracao pode
 * ter falhado (PATCH fora do ar), e nesse caso ele e o unico registro que
 * existe. Ignorar o local aqui reabriria o onboarding de quem ja fechou.
 */
export function hasSeenOnboarding(
  routeKey: string,
  profile: Profile | null | undefined,
): boolean {
  if (readProfileRecords(profile)[routeKey]) return true;
  return readLocalRecord(routeKey) !== null;
}

/** Monta o `preferences` completo com o sub-objeto de onboardings trocado. */
function mergedPreferences(
  profile: Profile | null | undefined,
  nextRecords: OnboardingRecordMap,
): Record<string, unknown> {
  const current =
    profile?.preferences && typeof profile.preferences === "object"
      ? (profile.preferences as Record<string, unknown>)
      : {};

  return { ...current, [ONBOARDINGS_PREFERENCE_KEY]: nextRecords };
}

export interface MarkSeenInput {
  routeKey: string;
  record: OnboardingRecord;
  /** Perfil do AuthContext. `null` = anonimo, e o registro vai para o localStorage. */
  profile: Profile | null | undefined;
  /** Ha sessao? Sem sessao nao adianta tentar o PATCH (401 garantido). */
  signedIn: boolean;
}

export type MarkSeenResult = "profile" | "local";

/**
 * Grava o "visto". Logado tenta o perfil e cai para o localStorage se o PATCH
 * falhar, mesmo espirito do /bem-vindo: a pessoa nao pode ver o mesmo
 * onboarding de novo so porque a rede piscou.
 */
export async function markOnboardingSeen({
  routeKey,
  record,
  profile,
  signedIn,
}: MarkSeenInput): Promise<MarkSeenResult> {
  if (!signedIn) {
    writeLocalRecord(routeKey, record);
    return "local";
  }

  const nextRecords = { ...readProfileRecords(profile), [routeKey]: record };
  try {
    await updateMyProfile({
      preferences: mergedPreferences(profile, nextRecords),
    });
    return "profile";
  } catch {
    writeLocalRecord(routeKey, record);
    return "local";
  }
}

export interface MigrationResult {
  /** routeKeys efetivamente migrados. Vazio quando nao havia o que migrar. */
  migrated: string[];
  /** true quando o PATCH foi aceito e o localStorage foi limpo. */
  persisted: boolean;
}

/**
 * Migra os registros anonimos do localStorage para o perfil, uma vez, quando
 * aparece sessao.
 *
 * Migra so o que NAO existe no perfil: o registro do perfil e o mais confiavel
 * (veio de uma escrita autenticada), e sobrescrever com o local trocaria um
 * "concluido" por um "pulado" de outra sessao anonima na mesma maquina.
 *
 * So limpa as chaves locais DEPOIS do PATCH aceito. Se falhar, o localStorage
 * fica como fallback e a proxima tentativa migra de novo.
 */
export async function migrateLocalRecordsToProfile(
  profile: Profile | null | undefined,
): Promise<MigrationResult> {
  const local = readAllLocalRecords();
  const localKeys = Object.keys(local);
  if (localKeys.length === 0) return { migrated: [], persisted: false };

  const remote = readProfileRecords(profile);
  const pending = localKeys.filter((routeKey) => !remote[routeKey]);
  if (pending.length === 0) {
    // Nada novo, mas as chaves locais ja estao representadas no perfil: some
    // com elas para a migracao nao rodar de novo a cada carga.
    removeLocalRecords(localKeys);
    return { migrated: [], persisted: true };
  }

  const nextRecords: OnboardingRecordMap = { ...remote };
  for (const routeKey of pending) nextRecords[routeKey] = local[routeKey];

  try {
    await updateMyProfile({
      preferences: mergedPreferences(profile, nextRecords),
    });
  } catch {
    return { migrated: [], persisted: false };
  }

  removeLocalRecords(localKeys);
  return { migrated: pending, persisted: true };
}
