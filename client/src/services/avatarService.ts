import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const API_BASE = apiUrl("/api");

export class AvatarApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface AvatarApiResult {
  avatarUrl: string;
  mode: "photo";
}

// Escolha de foto ainda nao aplicada (fica pendente ate o usuario clicar em Salvar).
export type PendingPhoto =
  | { type: "upload"; dataUrl: string }
  | { type: "google" }
  | { type: "remove" };

// Placeholders de copy (a Ana refina depois). Mapeia os codes do backend.
const ERROR_MESSAGES: Record<string, string> = {
  pro_required: "Recurso Pro. Assine o Plano Pro para usar foto no avatar.",
  upload_disabled: "O upload de foto está desabilitado para esta conta.",
  pending_review: "Sua foto está em análise. Aguarde a revisão.",
  image_rejected: "Imagem não permitida. Escolha outra foto.",
  moderation_failed: "Não foi possível validar a imagem agora. Tente novamente.",
  no_google_photo: "Não encontramos uma foto na sua conta do Google.",
  invalid_image: "Arquivo inválido. Use PNG, JPEG ou WEBP.",
  image_too_large: "A imagem é muito grande. Use até 5MB.",
};

export function describeAvatarError(err: unknown): string {
  if (err instanceof AvatarApiError) {
    return (
      ERROR_MESSAGES[err.code] ||
      err.message ||
      "Não foi possível processar a imagem."
    );
  }
  return "Não foi possível processar a imagem.";
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

type ErrorBody = { error?: { code?: string; message?: string } } | null;

async function postAvatar(
  path: string,
  body?: unknown,
): Promise<AvatarApiResult> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as
    | (AvatarApiResult & ErrorBody)
    | null;

  if (!res.ok) {
    throw new AvatarApiError(
      res.status,
      json?.error?.code || "unknown",
      json?.error?.message || "Não foi possível processar a imagem.",
    );
  }

  return json as AvatarApiResult;
}

// Sobe a foto ja reduzida (data URL ou base64) pro endpoint dedicado, que valida
// e modera antes de armazenar.
export function uploadAvatar(imageBase64: string): Promise<AvatarApiResult> {
  return postAvatar("/me/avatar", { imageBase64 });
}

export function applyGoogleAvatar(): Promise<AvatarApiResult> {
  return postAvatar("/me/avatar/from-google");
}

export async function removeAvatar(): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE}/me/avatar`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ErrorBody;
    throw new AvatarApiError(
      res.status,
      json?.error?.code || "unknown",
      json?.error?.message || "Não foi possível remover a foto.",
    );
  }
}
