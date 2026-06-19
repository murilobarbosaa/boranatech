import { supabaseAdmin } from "./supabaseAdmin";

export type AvatarMode = "icon" | "photo";

export interface ResolvedAvatar {
  userId: string;
  name: string;
  mode: AvatarMode;
  avatarUrl: string | null;
  icon: string | null;
  bg: string | null;
  border: string | null;
}

interface ProfileRow {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  avatar_mode: string | null;
  avatar_icon: string | null;
  avatar_bg: string | null;
  avatar_border: string | null;
  avatar_moderation_status: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function iconDefault(userId: string, name: string | null): ResolvedAvatar {
  return {
    userId,
    name: name ?? "",
    mode: "icon",
    avatarUrl: null,
    icon: null,
    bg: null,
    border: null,
  };
}

// Pro do DONO do avatar (nao de quem chama). Fail-closed: erro/excecao -> nao Pro.
async function isOwnerPro(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc("is_user_pro", {
      p_user_id: userId,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

// Resolve o avatar EFETIVO de uma lista de usuarios. Depende somente do dono:
// foto so aparece se o dono e Pro, escolheu modo foto, tem url e o avatar esta limpo.
// Retorna apenas campos seguros (nada de email, status de moderacao ou assinatura).
export async function resolveAvatars(
  userIds: string[],
): Promise<ResolvedAvatar[]> {
  const uniqueIds = Array.from(
    new Set(
      (userIds || []).filter(
        (id): id is string => typeof id === "string" && UUID_RE.test(id),
      ),
    ),
  );
  if (uniqueIds.length === 0) return [];

  let rows: ProfileRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "user_id, name, avatar_url, avatar_mode, avatar_icon, avatar_bg, avatar_border, avatar_moderation_status",
      )
      .in("user_id", uniqueIds);
    // fail-closed: sem leitura confiavel, ninguem exibe foto (todos viram icone).
    rows = error || !data ? [] : (data as ProfileRow[]);
  } catch {
    rows = [];
  }

  const byId = new Map<string, ProfileRow>();
  for (const row of rows) byId.set(row.user_id, row);

  // So checa Pro de quem de fato poderia exibir foto, pra nao disparar RPC a toa.
  const photoCandidates = rows.filter(
    (row) =>
      row.avatar_mode === "photo" &&
      !!row.avatar_url &&
      row.avatar_moderation_status === "clean",
  );
  const proPairs = await Promise.all(
    photoCandidates.map(
      async (row) => [row.user_id, await isOwnerPro(row.user_id)] as const,
    ),
  );
  const proById = new Map<string, boolean>(proPairs);

  return uniqueIds.map((userId) => {
    const row = byId.get(userId);
    // user_id sem profile: default minimo em icone, pra nao quebrar o lote.
    if (!row) return iconDefault(userId, null);

    const showPhoto =
      row.avatar_mode === "photo" &&
      !!row.avatar_url &&
      row.avatar_moderation_status === "clean" &&
      proById.get(userId) === true;

    return {
      userId,
      name: row.name ?? "",
      mode: showPhoto ? "photo" : "icon",
      avatarUrl: showPhoto ? row.avatar_url : null,
      icon: row.avatar_icon ?? null,
      bg: row.avatar_bg ?? null,
      border: row.avatar_border ?? null,
    };
  });
}
