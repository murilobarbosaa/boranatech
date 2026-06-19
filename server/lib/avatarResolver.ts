import { DEFAULT_AVATAR_BORDER, PRO_AVATAR_BORDERS } from "./avatarBorders";
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

  // So checa Pro de quem precisa (poderia exibir foto OU usa borda Pro), pra nao
  // disparar RPC a toa. Uma linha por usuario, entao nao ha RPC duplicada.
  const needsProCheck = rows.filter((row) => {
    const photoCandidate =
      row.avatar_mode === "photo" &&
      !!row.avatar_url &&
      row.avatar_moderation_status === "clean";
    const proBorder =
      row.avatar_border != null && PRO_AVATAR_BORDERS.has(row.avatar_border);
    return photoCandidate || proBorder;
  });
  const proPairs = await Promise.all(
    needsProCheck.map(
      async (row) => [row.user_id, await isOwnerPro(row.user_id)] as const,
    ),
  );
  const proById = new Map<string, boolean>(proPairs);

  return uniqueIds.map((userId) => {
    const row = byId.get(userId);
    // user_id sem profile: default minimo em icone, pra nao quebrar o lote.
    if (!row) return iconDefault(userId, null);

    const ownerPro = proById.get(userId) === true;
    const showPhoto =
      row.avatar_mode === "photo" &&
      !!row.avatar_url &&
      row.avatar_moderation_status === "clean" &&
      ownerPro;

    // Trava de display: dono sem Pro nao exibe borda Pro pros outros, cai no default.
    const rawBorder = row.avatar_border ?? null;
    const border =
      !ownerPro && rawBorder != null && PRO_AVATAR_BORDERS.has(rawBorder)
        ? DEFAULT_AVATAR_BORDER
        : rawBorder;

    return {
      userId,
      name: row.name ?? "",
      mode: showPhoto ? "photo" : "icon",
      avatarUrl: showPhoto ? row.avatar_url : null,
      icon: row.avatar_icon ?? null,
      bg: row.avatar_bg ?? null,
      border,
    };
  });
}
