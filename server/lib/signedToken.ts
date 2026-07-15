import crypto from "crypto";

// Modulo HMAC generico baseado em claims, para tokens assinados independentes do
// auth do Supabase (ex.: confirmacao de e-mail, descadastro de newsletter).
// Design fail-closed: verifySignedToken retorna null em QUALQUER falha, nunca
// lanca e nunca devolve um valor truthy quando a validacao nao passa. O payload e
// codificado em base64url (URL-safe), entao o token pode ir direto num link.

function toBase64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString();
}

function sign(payloadB64: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
}

export function issueSignedToken(opts: {
  claims: Record<string, string | number>;
  secret: string;
  ttlMs: number;
}): string {
  const payload = { ...opts.claims, exp: Date.now() + opts.ttlMs };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, opts.secret)}`;
}

export function verifySignedToken<T extends Record<string, string | number>>(opts: {
  token: string;
  secret: string;
  expectedPurpose: string;
}): (T & { exp: number }) | null {
  const parts = opts.token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  // timingSafeEqual lanca se os buffers tiverem length diferente; guarda antes.
  const expected = sign(payloadB64, opts.secret);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

  let decoded: Record<string, unknown>;
  try {
    decoded = JSON.parse(fromBase64Url(payloadB64)) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (typeof decoded.exp !== "number" || decoded.exp <= Date.now()) {
    return null;
  }

  if (decoded.purpose !== opts.expectedPurpose) {
    return null;
  }

  return decoded as T & { exp: number };
}

// Variante que DISTINGUE "invalido/adulterado" de "expirado" para quem precisa de
// mensagens diferentes (ex.: pagina de renovacao). Mesmo formato e mesmo sign() do
// verifySignedToken; assinatura errada, payload corrompido ou purpose divergente =
// "invalid"; assinatura ok mas exp no passado = "expired". Fail-closed por padrao.
export type DetailedVerifyResult<T> =
  | { status: "valid"; claims: T & { exp: number } }
  | { status: "invalid" }
  | { status: "expired" };

export function verifySignedTokenDetailed<
  T extends Record<string, string | number>,
>(opts: {
  token: string;
  secret: string;
  expectedPurpose: string;
}): DetailedVerifyResult<T> {
  const parts = opts.token.split(".");
  if (parts.length !== 2) return { status: "invalid" };
  const [payloadB64, signature] = parts;

  const expected = sign(payloadB64, opts.secret);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return { status: "invalid" };
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return { status: "invalid" };
  }

  let decoded: Record<string, unknown>;
  try {
    decoded = JSON.parse(fromBase64Url(payloadB64)) as Record<string, unknown>;
  } catch {
    return { status: "invalid" };
  }

  if (typeof decoded.exp !== "number") return { status: "invalid" };
  // Assinatura valida mas fora do prazo: distinto de adulterado.
  if (decoded.exp <= Date.now()) return { status: "expired" };
  if (decoded.purpose !== opts.expectedPurpose) return { status: "invalid" };

  return { status: "valid", claims: decoded as T & { exp: number } };
}
