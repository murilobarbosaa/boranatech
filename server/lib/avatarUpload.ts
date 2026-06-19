import { randomUUID } from "crypto";

import { env } from "./env";
import {
  buildOpenAIHeaders,
  MODERATION_MODEL,
  OPENAI_MODERATION_URL,
} from "./openai";
import { supabaseAdmin } from "./supabaseAdmin";

const AVATAR_BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB, espelha o limite do bucket.
const MODERATION_TIMEOUT_MS = 10_000;
const REMOTE_FETCH_TIMEOUT_MS = 5_000;
const GOOGLE_HOST_SUFFIX = "googleusercontent.com";

// Categorias de moderacao OpenAI suportadas em imagem.
const IMAGE_CATEGORIES = ["sexual", "violence", "violence/graphic"] as const;

export type AvatarMime = "image/png" | "image/jpeg" | "image/webp";

const EXT_BY_MIME: Record<AvatarMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// Erro tipado pra rota mapear pro createError correto, sem vazar detalhe sensivel.
export class AvatarUploadError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ModerationResult {
  flagged?: boolean;
  category_scores?: Record<string, number>;
}

interface ModerationResponse {
  results?: ModerationResult[];
}

// Aceita data URL (data:<mime>;base64,<...>) ou base64 puro. Nao confia no mime
// declarado: a deteccao real e por magic bytes em validateAndModerate.
export function decodeImageInput(input: unknown): Buffer | null {
  if (typeof input !== "string" || input.length === 0) return null;

  let b64 = input;
  const dataUrl = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(input);
  if (dataUrl) {
    if (!dataUrl[2]) return null; // exige base64
    b64 = dataUrl[3];
  }

  try {
    const buf = Buffer.from(b64, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

// Deteccao por assinatura do arquivo (magic bytes), ignorando o content-type declarado.
function detectMime(buf: Buffer): AvatarMime | null {
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// FAIL-CLOSED: qualquer erro/timeout/resposta inesperada -> lanca (nunca prossegue).
async function moderateImage(bytes: Buffer, mime: AvatarMime): Promise<void> {
  const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS);

  let payload: ModerationResponse;
  try {
    const response = await fetch(OPENAI_MODERATION_URL, {
      method: "POST",
      headers: buildOpenAIHeaders(env.openaiApiKey),
      body: JSON.stringify({
        model: MODERATION_MODEL,
        input: [{ type: "image_url", image_url: { url: dataUrl } }],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`moderation status ${response.status}`);
    }
    payload = (await response.json()) as ModerationResponse;
  } catch (err) {
    console.error("[avatar] moderacao indisponivel, rejeitando (fail-closed):", err);
    throw new AvatarUploadError(
      503,
      "moderation_failed",
      "Não foi possível validar a imagem. Tente novamente.",
    );
  } finally {
    clearTimeout(timeout);
  }

  const result = payload?.results?.[0];
  if (!result || typeof result !== "object") {
    throw new AvatarUploadError(
      503,
      "moderation_failed",
      "Não foi possível validar a imagem. Tente novamente.",
    );
  }

  const scores = result.category_scores || {};
  const overThreshold = IMAGE_CATEGORIES.some((cat) => {
    const score = scores[cat];
    return (
      typeof score === "number" && score >= env.avatarModerationScoreThreshold
    );
  });

  if (result.flagged === true || overThreshold) {
    // Mensagem generica de proposito: nao revela a categoria ao usuario.
    throw new AvatarUploadError(422, "image_rejected", "Imagem não permitida.");
  }
}

// Valida magic bytes + tamanho e modera. Retorna o mime real. Lanca em qualquer falha.
export async function validateAndModerate(bytes: Buffer): Promise<AvatarMime> {
  if (!bytes || bytes.length === 0) {
    throw new AvatarUploadError(400, "invalid_image", "Imagem inválida.");
  }
  if (bytes.length > MAX_BYTES) {
    throw new AvatarUploadError(400, "image_too_large", "A imagem excede 5MB.");
  }
  const mime = detectMime(bytes);
  if (!mime) {
    throw new AvatarUploadError(
      400,
      "invalid_image",
      "Formato inválido. Use PNG, JPEG ou WEBP.",
    );
  }
  await moderateImage(bytes, mime);
  return mime;
}

// Sobe o objeto e devolve path + URL publica. Nunca chamado antes da moderacao passar.
export async function storeAvatar(
  userId: string,
  bytes: Buffer,
  contentType: AvatarMime,
): Promise<{ path: string; publicUrl: string }> {
  const path = `${userId}/${randomUUID()}.${EXT_BY_MIME[contentType]}`;

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    throw new AvatarUploadError(
      500,
      "storage_error",
      "Não foi possível salvar a imagem.",
    );
  }

  const { data } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

// Remocao best-effort: nunca derruba o fluxo principal.
export async function deleteAvatarObject(
  path: string | null | undefined,
): Promise<void> {
  if (!path) return;
  try {
    await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([path]);
  } catch (err) {
    console.warn("[avatar] falha ao remover objeto do storage:", err);
  }
}

// Fonte CONFIAVEL da foto do Google: identity_data do provedor (nao editavel pelo
// usuario), nunca user_metadata. Retorna null se nao houver identidade Google/foto.
export async function getTrustedGoogleAvatarUrl(
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;

  const google = (data.user.identities || []).find(
    (identity) => identity.provider === "google",
  );
  if (!google) return null;

  const idData = (google.identity_data || {}) as Record<string, unknown>;
  const picture = idData.picture ?? idData.avatar_url;
  return typeof picture === "string" && picture.length > 0 ? picture : null;
}

// SSRF guard: so https em host *.googleusercontent.com, sem seguir redirect, com
// timeout curto e cap de 5MB. Retorna os bytes crus pra passar pela mesma moderacao.
export async function downloadGoogleImage(url: string): Promise<Buffer> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AvatarUploadError(
      400,
      "invalid_google_photo",
      "Foto do Google inválida.",
    );
  }

  const host = parsed.hostname.toLowerCase();
  const hostOk =
    host === GOOGLE_HOST_SUFFIX || host.endsWith(`.${GOOGLE_HOST_SUFFIX}`);
  if (parsed.protocol !== "https:" || !hostOk) {
    throw new AvatarUploadError(
      400,
      "invalid_google_photo",
      "Foto do Google inválida.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(parsed.toString(), {
      redirect: "error", // nao segue redirect pra host nao-Google
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new AvatarUploadError(
        400,
        "google_photo_unavailable",
        "Não foi possível obter a foto do Google.",
      );
    }
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      throw new AvatarUploadError(400, "image_too_large", "A imagem excede 5MB.");
    }
    return buf;
  } catch (err) {
    if (err instanceof AvatarUploadError) throw err;
    throw new AvatarUploadError(
      400,
      "google_photo_unavailable",
      "Não foi possível obter a foto do Google.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
