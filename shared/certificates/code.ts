// Codigo publico do certificado. Formato BNT-XXXX-XXXX com alfabeto Crockford
// base32 sem caracteres ambiguos (0/O, 1/I/L, U removidos), 30 simbolos.
import crypto from "crypto";

// 30 simbolos: 8 digitos (2-9) + 22 letras (A-Z sem I, L, O, U). NAO e potencia
// de 2, entao `byte % 30` enviesaria a distribuicao (256 = 8*30 + 16); a cauda
// 240..255 tem que ser descartada (rejection sampling).
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

// Maior multiplo de ALPHABET.length que cabe em um byte (240). Bytes >= isso
// caem fora e sao rejeitados, mantendo o modulo uniforme.
const REJECT_THRESHOLD = 256 - (256 % ALPHABET.length);

function randomIndex(): number {
  // Loop de rejeicao: em media descarta 16/256 dos bytes, converge rapido.
  for (;;) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < REJECT_THRESHOLD) {
      return byte % ALPHABET.length;
    }
  }
}

export function generateCertificateCode(): string {
  let chars = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    chars += ALPHABET[randomIndex()];
  }
  return `BNT-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

// Normaliza um code digitado pela pagina publica para a forma canonica
// BNT-XXXX-XXXX. Uppercase, descarta tudo que nao e do alfabeto (inclusive os
// hifens digitados) e reinsere os hifens na posicao canonica, para casar o
// lookup com ou sem hifen. Se o resultado nao tem o formato esperado, devolve o
// que sobrou (o lookup simplesmente nao acha e a pagina responde 404).
export function normalizeCertificateCode(raw: string): string {
  const cleaned = (raw ?? "")
    .toUpperCase()
    .split("")
    .filter((char) => ALPHABET.includes(char))
    .join("");
  if (cleaned.length === 3 + CODE_LENGTH && cleaned.startsWith("BNT")) {
    return `BNT-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  }
  return cleaned;
}
