import { AI_ROADMAP_SLUG_RE } from "../../../shared/aiRoadmap";
import { supabaseAdmin } from "../supabaseAdmin";

// Pool de contexto do usuario: FONTE UNICA de coleta dos dados de estado do
// usuario na plataforma, devolvidos ESTRUTURADOS (nenhuma formatacao de texto
// aqui). Consumidores (o snapshot do agente hoje, o Roadmap Pro no futuro)
// formatam como quiserem.
//
// Contrato:
//  - Cada fonte e independente e vem como { ok: true, data } | { ok: false }.
//    Falha individual (query, RPC, tabela ainda inexistente) vira { ok: false }
//    com console.warn e NUNCA derruba o pool inteiro nem vira dado inventado.
//  - Toda query filtra explicitamente por user_id = userId (supabaseAdmin usa
//    service role e BYPASSA o RLS; o filtro aqui e a barreira real).
//  - userId vem sempre do JWT verificado (req.user.id), nunca do corpo.

export type SourceResult<T> = { ok: true; data: T } | { ok: false };

export interface PlanContext {
  isPro: boolean;
}

export interface QuizContext {
  area: string | null;
  areaSlug: string | null;
  level: string | null;
  confidence: number | null;
  completedAt: string | null;
}

export interface RoadmapProgressContext {
  roadmapId: string;
  title: string | null;
  completedSteps: number;
  totalSteps: number | null;
  lastActivityAt: string | null;
}

export interface CourseProgressContext {
  // Slug da trilha v2 (prefixo do item_key em user_progress course_progress).
  courseSlug: string;
  completedItems: number;
  lastActivityAt: string | null;
  // Presentes SO quando o slug e de um roadmap gerado por IA (ai_roadmaps do
  // proprio usuario); trilhas estaticas seguem so com o slug (o titulo delas
  // vive no conteudo estatico). Resolucao best-effort: falha deixa ausente.
  title?: string;
  status?: string;
}

export interface SkillContext {
  kind: string;
  label: string;
  level: string;
}

export interface StudyDiaryContext {
  totalMinutes30d: number;
  activeDays30d: number;
  lastEntryAt: string | null;
}

export interface ProfileContext {
  headline: string | null;
  careerGoal: string | null;
  city: string | null;
  uf: string | null;
}

export interface BookmarksContext {
  total: number;
  recent: Array<{ resourceType: string; title: string | null }>;
}

export interface AnalysisSummaryContext {
  area: string | null;
  level: string | null;
  score: number | null;
  faixa: string | null;
  createdAt: string | null;
}

export interface BadgeContext {
  badgeId: string;
  unlockedAt: string | null;
}

export interface UserContextPool {
  plan: SourceResult<PlanContext>;
  // null = usuario nunca concluiu o quiz (vazio legitimo, distinto de falha).
  quiz: SourceResult<QuizContext | null>;
  roadmaps: SourceResult<RoadmapProgressContext[]>;
  courses: SourceResult<CourseProgressContext[]>;
  skills: SourceResult<SkillContext[]>;
  studyDiary: SourceResult<StudyDiaryContext>;
  profile: SourceResult<ProfileContext | null>;
  bookmarks: SourceResult<BookmarksContext>;
  linkedin: SourceResult<AnalysisSummaryContext | null>;
  github: SourceResult<AnalysisSummaryContext | null>;
  badges: SourceResult<BadgeContext[]>;
}

// Tetos de leitura para nao estourar contexto nem custo. Ajustaveis. // TODO: calibrar.
const MAX_ROADMAP_PROGRESS_ROWS = 500;
const MAX_COURSE_PROGRESS_ROWS = 500;
const MAX_SKILLS = 50;
const MAX_BADGES = 50;
const RECENT_BOOKMARKS = 5;
const STUDY_WINDOW_DAYS = 30;

function warnSource(source: string, detail: unknown): { ok: false } {
  console.warn(`[userContext] fonte ${source} falhou:`, detail);
  return { ok: false };
}

async function fetchPlan(userId: string): Promise<SourceResult<PlanContext>> {
  try {
    // RPC canonica, a MESMA fonte de verdade do checkProStatus. Fail-closed:
    // erro nao vira isPro true nem false silencioso, vira fonte indisponivel.
    const { data, error } = await supabaseAdmin.rpc("is_user_pro", {
      p_user_id: userId,
    });
    if (error) return warnSource("plan", error.message);
    return { ok: true, data: { isPro: data === true } };
  } catch (err) {
    return warnSource("plan", err);
  }
}

interface QuizRow {
  result_area: string | null;
  result_area_slug: string | null;
  level: string | null;
  confidence: number | null;
  completed_at: string | null;
}

async function fetchQuiz(
  userId: string,
): Promise<SourceResult<QuizContext | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("career_quiz_attempts")
      .select("result_area, result_area_slug, level, confidence, completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return warnSource("quiz", error.message);
    if (!data) return { ok: true, data: null };
    const row = data as QuizRow;
    return {
      ok: true,
      data: {
        area: row.result_area,
        areaSlug: row.result_area_slug,
        level: row.level,
        confidence: row.confidence,
        completedAt: row.completed_at,
      },
    };
  } catch (err) {
    return warnSource("quiz", err);
  }
}

interface RoadmapProgressRow {
  roadmap_id: string;
  status: string;
  updated_at: string | null;
}

async function fetchRoadmaps(
  userId: string,
): Promise<SourceResult<RoadmapProgressContext[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_roadmap_progress")
      .select("roadmap_id, status, updated_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .limit(MAX_ROADMAP_PROGRESS_ROWS);
    if (error) return warnSource("roadmaps", error.message);

    const rows = (data ?? []) as RoadmapProgressRow[];
    if (rows.length === 0) return { ok: true, data: [] };

    const byRoadmap = new Map<
      string,
      { completed: number; lastActivityAt: string | null }
    >();
    for (const row of rows) {
      const acc = byRoadmap.get(row.roadmap_id) ?? {
        completed: 0,
        lastActivityAt: null,
      };
      acc.completed += 1;
      if (
        row.updated_at &&
        (!acc.lastActivityAt || row.updated_at > acc.lastActivityAt)
      ) {
        acc.lastActivityAt = row.updated_at;
      }
      byRoadmap.set(row.roadmap_id, acc);
    }

    const roadmapIds = Array.from(byRoadmap.keys());

    // Nomes e total de passos sao metadados publicos; a barreira de identidade
    // ja foi aplicada acima (as ids vem so do progresso do proprio usuario).
    const [{ data: roadmapRows, error: roadmapError }, stepsCount] =
      await Promise.all([
        supabaseAdmin.from("roadmaps").select("id, title").in("id", roadmapIds),
        supabaseAdmin
          .from("roadmap_steps")
          .select("roadmap_id")
          .in("roadmap_id", roadmapIds),
      ]);

    const titleById = new Map<string, string>();
    if (!roadmapError) {
      for (const r of (roadmapRows ?? []) as Array<{
        id: string;
        title: string;
      }>) {
        titleById.set(r.id, r.title);
      }
    }
    const totalById = new Map<string, number>();
    if (!stepsCount.error) {
      for (const s of (stepsCount.data ?? []) as Array<{
        roadmap_id: string;
      }>) {
        totalById.set(s.roadmap_id, (totalById.get(s.roadmap_id) ?? 0) + 1);
      }
    }

    const result: RoadmapProgressContext[] = roadmapIds.map((id) => {
      const acc = byRoadmap.get(id)!;
      return {
        roadmapId: id,
        title: titleById.get(id) ?? null,
        completedSteps: acc.completed,
        totalSteps: totalById.get(id) ?? null,
        lastActivityAt: acc.lastActivityAt,
      };
    });
    return { ok: true, data: result };
  } catch (err) {
    return warnSource("roadmaps", err);
  }
}

interface CourseProgressRow {
  item_key: string;
  updated_at: string | null;
}

async function fetchCourses(
  userId: string,
): Promise<SourceResult<CourseProgressContext[]>> {
  try {
    // Trilhas v2: presenca da linha = no concluido; item_key = "slug:nodeId".
    const { data, error } = await supabaseAdmin
      .from("user_progress")
      .select("item_key, updated_at")
      .eq("user_id", userId)
      .eq("context", "course_progress")
      .limit(MAX_COURSE_PROGRESS_ROWS);
    if (error) return warnSource("courses", error.message);

    const rows = (data ?? []) as CourseProgressRow[];
    const bySlug = new Map<
      string,
      { completed: number; lastActivityAt: string | null }
    >();
    for (const row of rows) {
      const sep = row.item_key.indexOf(":");
      const slug = sep > 0 ? row.item_key.slice(0, sep) : row.item_key;
      const acc = bySlug.get(slug) ?? { completed: 0, lastActivityAt: null };
      acc.completed += 1;
      if (
        row.updated_at &&
        (!acc.lastActivityAt || row.updated_at > acc.lastActivityAt)
      ) {
        acc.lastActivityAt = row.updated_at;
      }
      bySlug.set(slug, acc);
    }

    const result: CourseProgressContext[] = Array.from(
      bySlug,
      ([courseSlug, acc]) => ({
        courseSlug,
        completedItems: acc.completed,
        lastActivityAt: acc.lastActivityAt,
      }),
    );

    // Slugs ia-<hex> sao roadmaps gerados por IA e nao estao no conteudo
    // estatico: resolve title/status em UM batch em ai_roadmaps, filtrando por
    // user_id (barreira de identidade). Best-effort: qualquer falha degrada
    // para o slug cru, nunca derruba a fonte.
    const aiSlugs = result
      .map((c) => c.courseSlug)
      .filter((slug) => AI_ROADMAP_SLUG_RE.test(slug));
    if (aiSlugs.length > 0) {
      try {
        const { data: aiRows, error: aiError } = await supabaseAdmin
          .from("ai_roadmaps")
          .select("slug, title, status")
          .eq("user_id", userId)
          .in("slug", aiSlugs);
        if (!aiError) {
          const metaBySlug = new Map(
            ((aiRows ?? []) as Array<{ slug: string; title: string; status: string }>).map(
              (row) => [row.slug, row],
            ),
          );
          for (const course of result) {
            const meta = metaBySlug.get(course.courseSlug);
            if (meta) {
              course.title = meta.title;
              course.status = meta.status;
            }
          }
        } else {
          console.warn("[userContext] resolucao de ai_roadmaps falhou:", aiError.message);
        }
      } catch (err) {
        console.warn("[userContext] resolucao de ai_roadmaps falhou:", err);
      }
    }

    return { ok: true, data: result };
  } catch (err) {
    return warnSource("courses", err);
  }
}

async function fetchSkills(
  userId: string,
): Promise<SourceResult<SkillContext[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profile_skills")
      .select("kind, label, level")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_SKILLS);
    if (error) return warnSource("skills", error.message);
    return { ok: true, data: (data ?? []) as SkillContext[] };
  } catch (err) {
    return warnSource("skills", err);
  }
}

interface StudyEntryRow {
  studied_at: string;
  minutes: number;
}

async function fetchStudyDiary(
  userId: string,
): Promise<SourceResult<StudyDiaryContext>> {
  try {
    const cutoff = new Date(
      Date.now() - STUDY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data, error } = await supabaseAdmin
      .from("study_entries")
      .select("studied_at, minutes")
      .eq("user_id", userId)
      .gte("studied_at", cutoff)
      .order("studied_at", { ascending: false });
    if (error) return warnSource("studyDiary", error.message);

    const rows = (data ?? []) as StudyEntryRow[];
    const days = new Set<string>();
    let totalMinutes = 0;
    for (const row of rows) {
      totalMinutes += row.minutes;
      days.add(row.studied_at.slice(0, 10));
    }
    return {
      ok: true,
      data: {
        totalMinutes30d: totalMinutes,
        activeDays30d: days.size,
        lastEntryAt: rows.length > 0 ? rows[0].studied_at : null,
      },
    };
  } catch (err) {
    return warnSource("studyDiary", err);
  }
}

interface ProfileRow {
  headline: string | null;
  career_goal: string | null;
  city: string | null;
  uf: string | null;
}

async function fetchProfile(
  userId: string,
): Promise<SourceResult<ProfileContext | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("headline, career_goal, city, uf")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return warnSource("profile", error.message);
    if (!data) return { ok: true, data: null };
    const row = data as ProfileRow;
    return {
      ok: true,
      data: {
        headline: row.headline,
        careerGoal: row.career_goal,
        city: row.city,
        uf: row.uf,
      },
    };
  } catch (err) {
    return warnSource("profile", err);
  }
}

interface BookmarkRow {
  resource_type: string;
  title_snapshot: string | null;
}

async function fetchBookmarks(
  userId: string,
): Promise<SourceResult<BookmarksContext>> {
  try {
    const { data, error, count } = await supabaseAdmin
      .from("user_bookmarks")
      .select("resource_type, title_snapshot", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(RECENT_BOOKMARKS);
    if (error) return warnSource("bookmarks", error.message);
    const rows = (data ?? []) as BookmarkRow[];
    return {
      ok: true,
      data: {
        total: count ?? rows.length,
        recent: rows.map((r) => ({
          resourceType: r.resource_type,
          title: r.title_snapshot,
        })),
      },
    };
  } catch (err) {
    return warnSource("bookmarks", err);
  }
}

interface AnalysisRow {
  area: string | null;
  level: string | null;
  score: number | null;
  faixa: string | null;
  created_at: string | null;
}

// linkedin_analyses e github_analyses compartilham o mesmo shape de resumo.
// github_analyses pode ainda nao existir no banco (migration pendente): o erro
// de tabela inexistente degrada para { ok: false } como qualquer outra falha.
async function fetchLatestAnalysis(
  table: "linkedin_analyses" | "github_analyses",
  source: string,
  userId: string,
): Promise<SourceResult<AnalysisSummaryContext | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("area, level, score, faixa, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return warnSource(source, error.message);
    if (!data) return { ok: true, data: null };
    const row = data as AnalysisRow;
    return {
      ok: true,
      data: {
        area: row.area,
        level: row.level,
        score: row.score,
        faixa: row.faixa,
        createdAt: row.created_at,
      },
    };
  } catch (err) {
    return warnSource(source, err);
  }
}

interface BadgeRow {
  badge_id: string;
  unlocked_at: string | null;
}

async function fetchBadges(
  userId: string,
): Promise<SourceResult<BadgeContext[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false })
      .limit(MAX_BADGES);
    if (error) return warnSource("badges", error.message);
    const rows = (data ?? []) as BadgeRow[];
    return {
      ok: true,
      data: rows.map((r) => ({
        badgeId: r.badge_id,
        unlockedAt: r.unlocked_at,
      })),
    };
  } catch (err) {
    return warnSource("badges", err);
  }
}

// Cada fonte ja resolve para SourceResult sem lancar; o allSettled e cinto e
// suspensorio para que nenhuma rejeicao inesperada derrube o pool inteiro.
function settled<T>(
  result: PromiseSettledResult<SourceResult<T>>,
  source: string,
): SourceResult<T> {
  if (result.status === "fulfilled") return result.value;
  return warnSource(source, result.reason);
}

export async function fetchUserContextPool(
  userId: string,
): Promise<UserContextPool> {
  const [
    plan,
    quiz,
    roadmaps,
    courses,
    skills,
    studyDiary,
    profile,
    bookmarks,
    linkedin,
    github,
    badges,
  ] = await Promise.allSettled([
    fetchPlan(userId),
    fetchQuiz(userId),
    fetchRoadmaps(userId),
    fetchCourses(userId),
    fetchSkills(userId),
    fetchStudyDiary(userId),
    fetchProfile(userId),
    fetchBookmarks(userId),
    fetchLatestAnalysis("linkedin_analyses", "linkedin", userId),
    fetchLatestAnalysis("github_analyses", "github", userId),
    fetchBadges(userId),
  ]);

  return {
    plan: settled(plan, "plan"),
    quiz: settled(quiz, "quiz"),
    roadmaps: settled(roadmaps, "roadmaps"),
    courses: settled(courses, "courses"),
    skills: settled(skills, "skills"),
    studyDiary: settled(studyDiary, "studyDiary"),
    profile: settled(profile, "profile"),
    bookmarks: settled(bookmarks, "bookmarks"),
    linkedin: settled(linkedin, "linkedin"),
    github: settled(github, "github"),
    badges: settled(badges, "badges"),
  };
}
