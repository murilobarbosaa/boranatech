import { normalizarTextoParaHash } from "@shared/linkedin/textoHash";

/** SHA-256 local para comparar o formulário atual sem enviar nem expor texto. */
export async function hashLinkedinTextNoCliente(
  texto: string,
): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(normalizarTextoParaHash(texto));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
