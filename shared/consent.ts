// Fonte unica de verdade das versoes de consentimento. Nenhuma outra parte do
// codigo (server, client, migration) deve repetir estas strings soltas: sempre
// importar daqui. Ao publicar novos Termos ou Politica, bumpar a versao aqui e
// o gate volta a exigir aceite de todo mundo.

export const TERMS_VERSION = "2026-07-13";
export const PRIVACY_VERSION = "2026-07-13";

export type ConsentDocument = "terms" | "privacy";

export const CONSENT_DOCUMENTS: readonly ConsentDocument[] = ["terms", "privacy"];

export function currentVersionFor(document: ConsentDocument): string {
  return document === "terms" ? TERMS_VERSION : PRIVACY_VERSION;
}
