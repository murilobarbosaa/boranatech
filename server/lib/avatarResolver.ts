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

// Pro dos DONOS dos avatares em LOTE (nao de quem chama): uma unica query no
// lugar de 1 RPC is_user_pro por usuario (N+1 da auditoria, secao 5.4).
// Replica a definicao da RPC is_user_pro (migration 20260517231011): existe
// subscription de plano nao-free com status active/trialing e periodo vigente
// (current_period_end nulo ou futuro). MANTER EM SINCRONIA com a RPC se ela
// mudar. Fail-closed: erro/excecao -> ninguem Pro (mesmo contrato de antes).
async function fetchProOwners(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  try {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, plans!inner(code)")
      .in("user_id", userIds)
      .in("status", ["active", "trialing"])
      .neq("plans.code", "free")
      .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`);
    if (error || !data) return new Set();
    return new Set(
      (data as Array<{ user_id: string }>).map((row) => row.user_id),
    );
  } catch {
    return new Set();
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

  // So checa Pro de quem precisa (poderia exibir foto OU usa borda Pro), pra
  // nao consultar a toa. Uma unica query em lote pra lista inteira.
  const needsProCheck = rows.filter((row) => {
    const photoCandidate =
      row.avatar_mode === "photo" &&
      !!row.avatar_url &&
      row.avatar_moderation_status === "clean";
    const proBorder =
      row.avatar_border != null && PRO_AVATAR_BORDERS.has(row.avatar_border);
    return photoCandidate || proBorder;
  });
  const proOwners = await fetchProOwners(
    needsProCheck.map((row) => row.user_id),
  );

  return uniqueIds.map((userId) => {
    const row = byId.get(userId);
    // user_id sem profile: default minimo em icone, pra nao quebrar o lote.
    if (!row) return iconDefault(userId, null);

    const ownerPro = proOwners.has(userId);
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
