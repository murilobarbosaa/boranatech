import { BADGE_CATALOG, type BadgeDefinition } from "../../shared/badges";
import { supabaseAdmin } from "./supabaseAdmin";

interface UserStats {
  studyEntriesCount: number;
  studyMinutesTotal: number;
  studyStreakLongest: number;
  studyStreakCurrent: number;
  roadmapsStarted: number;
  roadmapsCompleted: number;
  roadmapsConcurrent: number;
  proActive: boolean;
  proDurationDays: number;
}

interface HeatmapDay {
  date: string;
  minutes: number;
  entries: number;
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function calculateLongestStreak(heatmap: HeatmapDay[]): number {
  const studyDays = heatmap
    .filter((d) => d.minutes > 0)
    .map((d) => d.date)
    .sort();

  if (studyDays.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < studyDays.length; i++) {
    const prev = new Date(`${studyDays[i - 1]}T00:00:00Z`).getTime();
    const curr = new Date(`${studyDays[i]}T00:00:00Z`).getTime();
    const diffDays = Math.round((curr - prev) / ONE_DAY_MS);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
}

function calculateCurrentStreak(heatmap: HeatmapDay[]): number {
  const studyDaysSet = new Set(heatmap.filter((d) => d.minutes > 0).map((d) => d.date));
  if (studyDaysSet.size === 0) return 0;

  // Hoje no fuso São Paulo (same as RPC get_study_heatmap)
  const nowSp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  let cursor = new Date(Date.UTC(nowSp.getFullYear(), nowSp.getMonth(), nowSp.getDate()));

  // Permite começar streak a partir de ontem (não quebra se ainda não estudou hoje)
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!studyDaysSet.has(todayKey)) {
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!studyDaysSet.has(key)) break;
    streak++;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }

  return streak;
}

async function gatherUserStats(userId: string): Promise<UserStats> {
  const [entriesAggResult, heatmapResult, progressResult, subscriptionResult] = await Promise.all([
    // Totais de estudo (count + sum minutes) direto da tabela — get_study_stats não expõe esses números.
    supabaseAdmin
      .from("study_entries")
      .select("minutes", { count: "exact" })
      .eq("user_id", userId),
    // Heatmap completo (730 dias) — pra calcular streak histórico e atual.
    supabaseAdmin.rpc("get_study_heatmap", { p_user_id: userId, p_days: 730 }),
    // Progresso em trilhas — só linhas com status='completed' contam pra "step completado".
    supabaseAdmin
      .from("user_roadmap_progress")
      .select("roadmap_id, status")
      .eq("user_id", userId),
    // Assinatura ativa mais antiga (pra calcular duração Pro).
    supabaseAdmin
      .from("subscriptions")
      .select("status, created_at")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const studyEntriesCount = entriesAggResult.count ?? entriesAggResult.data?.length ?? 0;
  const studyMinutesTotal = (entriesAggResult.data ?? []).reduce(
    (sum: number, row: { minutes: number | null }) => sum + (row.minutes ?? 0),
    0,
  );

  const heatmap = (heatmapResult.data as HeatmapDay[] | null) ?? [];
  const studyStreakLongest = calculateLongestStreak(heatmap);
  const studyStreakCurrent = calculateCurrentStreak(heatmap);

  const progressRows =
    (progressResult.data as Array<{ roadmap_id: string; status: string | null }> | null) ?? [];

  // Roadmaps com qualquer progresso (= "iniciados").
  const startedRoadmapIds = new Set(progressRows.map((row) => String(row.roadmap_id)));
  const roadmapsStarted = startedRoadmapIds.size;

  // Contagem de steps completados por roadmap.
  const completedStepsByRoadmap = new Map<string, number>();
  for (const row of progressRows) {
    if (row.status !== "completed") continue;
    const key = String(row.roadmap_id);
    completedStepsByRoadmap.set(key, (completedStepsByRoadmap.get(key) ?? 0) + 1);
  }

  // Pra saber se a trilha foi 100% completada, comparar steps completados com total_steps do roadmap.
  let roadmapsCompleted = 0;
  if (startedRoadmapIds.size > 0) {
    const { data: roadmapsData } = await supabaseAdmin
      .from("roadmaps")
      .select("id, roadmap_steps(count)")
      .in("id", Array.from(startedRoadmapIds));

    for (const roadmap of (roadmapsData ?? []) as Array<{
      id: string;
      roadmap_steps: Array<{ count: number }> | null;
    }>) {
      const totalSteps = Array.isArray(roadmap.roadmap_steps) && roadmap.roadmap_steps.length > 0
        ? Number(roadmap.roadmap_steps[0].count ?? 0)
        : 0;
      const completedSteps = completedStepsByRoadmap.get(String(roadmap.id)) ?? 0;
      if (totalSteps > 0 && completedSteps >= totalSteps) {
        roadmapsCompleted++;
      }
    }
  }

  const roadmapsConcurrent = roadmapsStarted - roadmapsCompleted;

  const subscription = subscriptionResult.data as { status: string; created_at: string } | null;
  const proActive = !!subscription;
  const proDurationDays = subscription
    ? Math.floor((Date.now() - new Date(subscription.created_at).getTime()) / ONE_DAY_MS)
    : 0;

  return {
    studyEntriesCount,
    studyMinutesTotal,
    studyStreakLongest,
    studyStreakCurrent,
    roadmapsStarted,
    roadmapsCompleted,
    roadmapsConcurrent,
    proActive,
    proDurationDays,
  };
}

function isBadgeUnlocked(badge: BadgeDefinition, stats: UserStats): boolean {
  switch (badge.checkType) {
    case "study_entries_count":
      return stats.studyEntriesCount >= badge.checkThreshold;
    case "study_minutes_total":
      return stats.studyMinutesTotal >= badge.checkThreshold;
    case "study_streak_current":
      return stats.studyStreakCurrent >= badge.checkThreshold;
    case "study_streak_longest":
      return stats.studyStreakLongest >= badge.checkThreshold;
    case "roadmap_started":
      return stats.roadmapsStarted >= badge.checkThreshold;
    case "roadmap_completed":
      return stats.roadmapsCompleted >= badge.checkThreshold;
    case "roadmaps_concurrent":
      return stats.roadmapsConcurrent >= badge.checkThreshold;
    case "pro_active":
      return stats.proActive;
    case "pro_duration_days":
      return stats.proDurationDays >= badge.checkThreshold;
    default:
      return false;
  }
}

function badgeCurrent(badge: BadgeDefinition, stats: UserStats): number {
  switch (badge.checkType) {
    case "study_entries_count":
      return stats.studyEntriesCount;
    case "study_minutes_total":
      return stats.studyMinutesTotal;
    case "study_streak_current":
      return stats.studyStreakCurrent;
    case "study_streak_longest":
      return stats.studyStreakLongest;
    case "roadmap_started":
      return stats.roadmapsStarted;
    case "roadmap_completed":
      return stats.roadmapsCompleted;
    case "roadmaps_concurrent":
      return stats.roadmapsConcurrent;
    case "pro_active":
      return stats.proActive ? 1 : 0;
    case "pro_duration_days":
      return stats.proDurationDays;
    default:
      return 0;
  }
}

export function calculateBadgeProgress(
  badge: BadgeDefinition,
  stats: UserStats,
): { current: number; target: number } {
  return { current: badgeCurrent(badge, stats), target: badge.checkThreshold };
}

export interface BadgeStatus {
  badge: BadgeDefinition;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: { current: number; target: number } | null;
  isNew: boolean;
}

export interface CheckResult {
  allBadges: BadgeStatus[];
  newlyUnlocked: BadgeDefinition[];
}

export async function checkAndPersistBadges(userId: string): Promise<CheckResult> {
  const stats = await gatherUserStats(userId);

  const { data: persisted } = await supabaseAdmin
    .from("user_badges")
    .select("badge_id, unlocked_at")
    .eq("user_id", userId);

  const persistedMap = new Map<string, string>();
  for (const row of (persisted ?? []) as Array<{ badge_id: string; unlocked_at: string }>) {
    persistedMap.set(row.badge_id, row.unlocked_at);
  }

  const newlyUnlocked: BadgeDefinition[] = [];
  const toInsert: Array<{ user_id: string; badge_id: string }> = [];

  const allBadges: BadgeStatus[] = BADGE_CATALOG.map((badge) => {
    const unlocked = isBadgeUnlocked(badge, stats);
    const persistedAt = persistedMap.get(badge.id) ?? null;
    const isNew = unlocked && !persistedAt;

    if (isNew) {
      newlyUnlocked.push(badge);
      toInsert.push({ user_id: userId, badge_id: badge.id });
    }

    return {
      badge,
      isUnlocked: unlocked,
      unlockedAt: persistedAt,
      progress: unlocked ? null : calculateBadgeProgress(badge, stats),
      isNew,
    };
  });

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from("user_badges").insert(toInsert);
    if (error) {
      console.error("[badges] Erro ao persistir badges desbloqueadas:", error);
    }
  }

  return { allBadges, newlyUnlocked };
}
