import { supabaseAdmin } from "./supabaseAdmin";
import { isMissingColumnError } from "./pgErrors";
import {
  fetchProStatusSets,
  userMatchesSegment,
  type ProStatusSets,
  type UserSegment,
} from "./userSegments";

// Calculo de alcance de segmento, compartilhado entre o audience-preview do
// admin e o SNAPSHOT gravado na publicacao (denominador exato das stats). A
// parte cara (varredura de subscriptions/profiles) vira um ReachContext
// carregado UMA vez; segmentReach e puro e reusa o contexto (no cron em lote,
// N notificacoes reusam um unico contexto por tick).

const DB_PAGE = 1000;

export type ReachContext = {
  totalUsers: number;
  sets: ProStatusSets;
  // user_ids com marketing_opt_in = true; so populado quando algum alvo e
  // promotional (a category promotional so alcanca quem tem opt-in).
  optedInUserIds: string[];
};

async function fetchOptedInUserIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += DB_PAGE) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("marketing_opt_in", true)
      .range(from, from + DB_PAGE - 1);
    if (error) {
      throw new Error(error.message);
    }
    const rows = data ?? [];
    ids.push(...rows.map((row) => row.user_id as string));
    if (rows.length < DB_PAGE) break;
  }
  return ids;
}

export async function loadReachContext(opts: {
  needOptedIn: boolean;
}): Promise<ReachContext> {
  const [profilesResult, sets] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    fetchProStatusSets(),
  ]);
  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }
  const totalUsers = profilesResult.count ?? 0;
  const optedInUserIds = opts.needOptedIn ? await fetchOptedInUserIds() : [];
  return { totalUsers, sets, optedInUserIds };
}

// Puro: quantos usuarios casam com audience + category numa base ja carregada.
// Mesma semantica do feed (userSegments). Product usa o atalho aritmetico com
// os sets; promotional filtra os opt-in por userMatchesSegment.
export function segmentReach(
  segment: UserSegment,
  category: "product" | "promotional",
  ctx: ReachContext,
): number {
  if (category === "promotional") {
    return ctx.optedInUserIds.filter((id) =>
      userMatchesSegment(id, segment, ctx.sets),
    ).length;
  }
  if (segment === "all") return ctx.totalUsers;
  if (segment === "active_pro") return ctx.sets.active.size;
  if (segment === "paying_pro") return ctx.sets.payingActive.size;
  if (segment === "never_pro") {
    // never_pro exige !everPaid E !active: influencer ativo que nunca pagou
    // esta em active (Pro vitalicio) e sai da conta.
    const everPaidOrActive = new Set(ctx.sets.everPaid);
    ctx.sets.active.forEach((id) => everPaidOrActive.add(id));
    return Math.max(0, ctx.totalUsers - everPaidOrActive.size);
  }
  // ex_pro: pagou algum dia, nao esta active nem past_due.
  return Array.from(ctx.sets.everPaid).filter(
    (id) => !ctx.sets.active.has(id) && !ctx.sets.pastDue.has(id),
  ).length;
}

async function countNotificationRecipients(
  notificationId: string,
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("notification_recipients")
    .select("user_id", { count: "exact", head: true })
    .eq("notification_id", notificationId);
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

type PromotedRow = { id: string; audience: string; category: string };

// Grava audience_snapshot dos recem-promovidos (cron em lote). BEST-EFFORT: a
// promocao ja aconteceu antes desta chamada, entao qualquer falha aqui (coluna
// ausente no schema antigo, erro de calculo) so deixa o snapshot null (a UI cai
// na estimativa), NUNCA reverte a publicacao. Carrega o contexto uma unica vez.
export async function writeAudienceSnapshots(
  rows: PromotedRow[],
): Promise<void> {
  try {
    const segments = rows.filter((row) => row.audience !== "custom");
    const needOptedIn = segments.some((row) => row.category === "promotional");
    const ctx =
      segments.length > 0 ? await loadReachContext({ needOptedIn }) : null;

    let columnMissing = false;
    for (const row of rows) {
      if (columnMissing) break;
      const snapshot =
        row.audience === "custom"
          ? await countNotificationRecipients(row.id)
          : segmentReach(
              row.audience as UserSegment,
              row.category as "product" | "promotional",
              ctx!,
            );
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ audience_snapshot: snapshot })
        .eq("id", row.id);
      if (error) {
        if (isMissingColumnError(error, "audience_snapshot")) {
          // Schema antigo: coluna ainda nao existe. Para de tentar (todas
          // falhariam igual) e segue; as notificacoes ficam sem snapshot.
          columnMissing = true;
          console.warn(
            "[cron] coluna notifications.audience_snapshot ausente; publicadas sem snapshot até o db:push.",
          );
        } else {
          console.warn(
            `[cron] falha ao gravar audience_snapshot de ${row.id}: ${error.message}`,
          );
        }
      }
    }
  } catch (err) {
    console.warn("[cron] snapshot de alcance em lote falhou", err);
  }
}
