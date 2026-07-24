// Quiz final de roadmap (fase 4.2): iniciar/retomar tentativa, salvar
// respostas parciais, corrigir e historico. A prova e GRATUITA (sem
// checkProStatus); o gate e a conclusao da trilha em roadmap_completions.
//
// Invariantes de seguranca (herdados da 4.1):
// - O gabarito nunca sai do server antes da correcao. O snapshot persistido
//   (questions) so tem ids e ordem de alternativas; o payload de pergunta pro
//   client sai exclusivamente de toPublicQuestions (sem correta/explicacao).
// - Correcao 100% server-side contra o pool atual do disco.
// - Regra de revelacao: REPROVADO ve so { id, acertou } por pergunta;
//   APROVADO ve a revisao completa (correta + explicacao). E o unico fluxo em
//   que gabarito sai do server, via buildApprovedReview.
import { Router } from "express";

import {
  PASS_SCORE,
  type QuizAlternativaId,
  type QuizPool,
} from "../../shared/roadmapQuiz/types";
import { roadmapQuizPools } from "../data/roadmapQuizzes";
import {
  drawQuestions,
  evaluateRetakeGate,
  gradeAttempt,
  toPublicQuestions,
  type AttemptQuestionSnapshot,
} from "../lib/roadmapQuiz";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

interface AttemptRow {
  id: string;
  status: "ativa" | "aprovada" | "reprovada";
  questions: AttemptQuestionSnapshot[];
  answers: Record<string, QuizAlternativaId> | null;
  score: number | null;
  created_at: string;
  completed_at: string | null;
}

const ATTEMPT_COLUMNS =
  "id, status, questions, answers, score, created_at, completed_at";

const ALTERNATIVA_IDS = new Set(["a", "b", "c", "d"]);

// Valida o body { answers: { questionId: "a".."d" } } contra o snapshot da
// tentativa: so ids sorteados, so valores a-d. Retorna null se invalido.
function parseAnswers(
  body: unknown,
  snapshot: AttemptQuestionSnapshot[],
): Record<string, QuizAlternativaId> | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { answers?: unknown }).answers;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const validIds = new Set(snapshot.map((entry) => entry.id));
  const out: Record<string, QuizAlternativaId> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!validIds.has(id)) return null;
    if (typeof value !== "string" || !ALTERNATIVA_IDS.has(value)) return null;
    out[id] = value as QuizAlternativaId;
  }
  return out;
}

// Revisao completa da tentativa APROVADA: unico fluxo em que correta e
// explicacao saem do server (regra de revelacao). Pergunta que sumiu do pool
// (anulada na correcao) e omitida da revisao.
function buildApprovedReview(
  pool: QuizPool,
  snapshot: AttemptQuestionSnapshot[],
  answers: Record<string, QuizAlternativaId | undefined>,
) {
  const out = [];
  for (const entry of snapshot) {
    const question = pool.questions.find((q) => q.id === entry.id);
    if (!question) continue;
    out.push({
      id: question.id,
      pergunta: question.pergunta,
      alternativas: entry.alternativas.map((alt) => ({
        id: alt,
        texto: question.alternativas[alt],
      })),
      correta: question.correta,
      explicacao: question.explicacao,
      respostaDoUsuario: answers[question.id] ?? null,
    });
  }
  return out;
}

function attemptSummary(row: AttemptRow) {
  return {
    id: row.id,
    status: row.status,
    score: row.score,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

// Payload de submit conforme a regra de revelacao: base pra todos, revisao so
// pra aprovado.
function submitPayload(
  pool: QuizPool,
  snapshot: AttemptQuestionSnapshot[],
  answers: Record<string, QuizAlternativaId>,
) {
  const grade = gradeAttempt(pool, snapshot, answers);
  return {
    status: grade.aprovado ? ("aprovada" as const) : ("reprovada" as const),
    score: grade.score,
    passScore: PASS_SCORE,
    porPergunta: grade.porPergunta,
    ...(grade.aprovado
      ? { revisao: buildApprovedReview(pool, snapshot, answers) }
      : {}),
  };
}

// Carrega a tentativa DO USUARIO na trilha; uuid invalido vira not-found.
async function loadAttempt(userId: string, slug: string, attemptId: string) {
  const { data, error } = await supabaseAdmin
    .from("roadmap_quiz_attempts")
    .select(ATTEMPT_COLUMNS)
    .eq("id", attemptId)
    .eq("user_id", userId)
    .eq("roadmap_slug", slug)
    .maybeSingle();
  if (error) {
    return { attempt: null, dbError: error.code !== "22P02" };
  }
  return { attempt: (data as AttemptRow | null) ?? null, dbError: false };
}

// Iniciar ou retomar: gates fail-closed em ordem (pool -> conclusao ->
// aprovacao previa), depois retoma a ativa se existir, senao sorteia
// excluindo os ids da tentativa mais recente nao-ativa (anti-repeticao).
router.post("/:slug/attempts", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const pool = roadmapQuizPools[slug];
    if (!pool) {
      // TODO(Ana): revisar copy das mensagens de erro deste arquivo.
      return next(
        createError(404, "quiz_unavailable", "Esta trilha ainda não tem prova."),
      );
    }

    const { data: completion, error: completionError } = await supabaseAdmin
      .from("roadmap_completions")
      .select("roadmap_slug")
      .eq("user_id", req.user!.id)
      .eq("roadmap_slug", slug)
      .maybeSingle();
    if (completionError) {
      return next(createError(500, "db_error", "Erro ao verificar conclusão."));
    }
    if (!completion) {
      return next(
        createError(
          403,
          "completion_required",
          "Conclua todos os passos da trilha antes de fazer a prova.",
        ),
      );
    }

    const { data: rows, error: attemptsError } = await supabaseAdmin
      .from("roadmap_quiz_attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("user_id", req.user!.id)
      .eq("roadmap_slug", slug)
      .order("created_at", { ascending: false });
    if (attemptsError) {
      return next(createError(500, "db_error", "Erro ao buscar tentativas."));
    }
    const attempts = (rows ?? []) as AttemptRow[];

    if (attempts.some((row) => row.status === "aprovada")) {
      return next(
        createError(409, "already_passed", "Você já foi aprovado nesta prova."),
      );
    }

    const active = attempts.find((row) => row.status === "ativa");
    if (active) {
      return res.json({
        data: {
          attemptId: active.id,
          questions: toPublicQuestions(pool, active.questions),
          answers: active.answers ?? {},
        },
      });
    }

    // Barra unica: quem reprovou pode refazer, mas ate RETAKE_LIMIT tentativas
    // por ciclo; estourou -> cooldown de COOLDOWN_HOURS a partir da ultima
    // reprovada, depois o ciclo reseta. A aprovada ja barrou acima
    // (already_passed). Derivado dos timestamps, sem coluna nova.
    const failedAtMs = attempts
      .filter((row) => row.status === "reprovada")
      .map((row) => new Date(row.completed_at ?? row.created_at).getTime())
      .filter((ms) => Number.isFinite(ms))
      .sort((a, b) => a - b);
    const retake = evaluateRetakeGate(failedAtMs, Date.now());
    if (!retake.allowed) {
      // createError so carrega { code, message }; o cooldown precisa devolver o
      // retryAt pro client mostrar quando libera, entao respondemos direto.
      return res.status(429).json({
        error: {
          code: "cooldown_active",
          // TODO(Ana): copy do aviso de cooldown do quiz
          message:
            "Você usou todas as tentativas por enquanto. Tente de novo mais tarde.",
          retryAt: retake.retryAt,
        },
      });
    }

    const lastFinished = attempts.find((row) => row.status !== "ativa");
    const exclude = new Set(
      (lastFinished?.questions ?? []).map((entry) => entry.id),
    );
    const snapshot = drawQuestions(pool, exclude);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("roadmap_quiz_attempts")
      .insert({
        user_id: req.user!.id,
        roadmap_slug: slug,
        status: "ativa",
        questions: snapshot,
      })
      .select("id")
      .single();

    if (insertError) {
      // 23505 no unique parcial de ativa: outra requisicao criou a tentativa
      // primeiro. Re-le e retoma (idempotente).
      if (insertError.code === "23505") {
        const { data: raced, error: racedError } = await supabaseAdmin
          .from("roadmap_quiz_attempts")
          .select(ATTEMPT_COLUMNS)
          .eq("user_id", req.user!.id)
          .eq("roadmap_slug", slug)
          .eq("status", "ativa")
          .single();
        if (racedError || !raced) {
          return next(createError(500, "db_error", "Erro ao iniciar a prova."));
        }
        const row = raced as AttemptRow;
        return res.json({
          data: {
            attemptId: row.id,
            questions: toPublicQuestions(pool, row.questions),
            answers: row.answers ?? {},
          },
        });
      }
      return next(createError(500, "db_error", "Erro ao iniciar a prova."));
    }

    res.json({
      data: {
        attemptId: inserted.id,
        questions: toPublicQuestions(pool, snapshot),
        answers: {},
      },
    });
  } catch (err) {
    next(err);
  }
});

// Salva respostas parciais da tentativa ativa (retomada apos fechar o
// navegador). Merge por cima das ja salvas.
router.put("/:slug/attempts/:id/answers", async (req, res, next) => {
  try {
    const { slug, id } = req.params;
    const { attempt, dbError } = await loadAttempt(req.user!.id, slug, id);
    if (dbError) {
      return next(createError(500, "db_error", "Erro ao buscar tentativa."));
    }
    if (!attempt) {
      return next(createError(404, "not_found", "Tentativa não encontrada."));
    }
    if (attempt.status !== "ativa") {
      return next(
        createError(409, "not_active", "Esta tentativa já foi corrigida."),
      );
    }

    const parsed = parseAnswers(req.body, attempt.questions);
    if (!parsed) {
      return next(createError(400, "invalid_answers", "Respostas inválidas."));
    }

    const merged = { ...(attempt.answers ?? {}), ...parsed };
    const { error: updateError } = await supabaseAdmin
      .from("roadmap_quiz_attempts")
      .update({ answers: merged })
      .eq("id", attempt.id)
      .eq("user_id", req.user!.id)
      .eq("status", "ativa");
    if (updateError) {
      return next(createError(500, "db_error", "Erro ao salvar respostas."));
    }

    res.json({ data: { saved: Object.keys(merged).length } });
  } catch (err) {
    next(err);
  }
});

// Corrige a tentativa ativa: merge do body com as parciais salvas, pergunta
// sem resposta conta como errada, resultado persiste na linha e a resposta
// segue a regra de revelacao.
router.post("/:slug/attempts/:id/submit", async (req, res, next) => {
  try {
    const { slug, id } = req.params;
    const pool = roadmapQuizPools[slug];
    if (!pool) {
      return next(
        createError(404, "quiz_unavailable", "Esta trilha ainda não tem prova."),
      );
    }

    const { attempt, dbError } = await loadAttempt(req.user!.id, slug, id);
    if (dbError) {
      return next(createError(500, "db_error", "Erro ao buscar tentativa."));
    }
    if (!attempt) {
      return next(createError(404, "not_found", "Tentativa não encontrada."));
    }
    if (attempt.status !== "ativa") {
      return next(
        createError(409, "not_active", "Esta tentativa já foi corrigida."),
      );
    }

    const bodyAnswers =
      (req.body as { answers?: unknown } | undefined)?.answers === undefined
        ? {}
        : parseAnswers(req.body, attempt.questions);
    if (bodyAnswers === null) {
      return next(createError(400, "invalid_answers", "Respostas inválidas."));
    }

    const merged = { ...(attempt.answers ?? {}), ...bodyAnswers };
    const payload = submitPayload(pool, attempt.questions, merged);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("roadmap_quiz_attempts")
      .update({
        status: payload.status,
        score: payload.score,
        answers: merged,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id)
      .eq("user_id", req.user!.id)
      .eq("status", "ativa")
      .select("id");

    if (updateError) {
      // 23505 no unique parcial de aprovada: outra requisicao aprovou
      // primeiro. Re-le a aprovada e responde com ela (idempotente).
      if (updateError.code === "23505") {
        const { data: approved, error: approvedError } = await supabaseAdmin
          .from("roadmap_quiz_attempts")
          .select(ATTEMPT_COLUMNS)
          .eq("user_id", req.user!.id)
          .eq("roadmap_slug", slug)
          .eq("status", "aprovada")
          .maybeSingle();
        if (approvedError || !approved) {
          return next(createError(500, "db_error", "Erro ao corrigir a prova."));
        }
        const row = approved as AttemptRow;
        return res.json({
          data: submitPayload(pool, row.questions, row.answers ?? {}),
        });
      }
      return next(createError(500, "db_error", "Erro ao corrigir a prova."));
    }

    // Guard de status ativa nao casou nenhuma linha: submit duplo em corrida.
    // Re-le e responde com o estado persistido (idempotente).
    if (!updated || updated.length === 0) {
      const { attempt: settled } = await loadAttempt(req.user!.id, slug, id);
      if (!settled || settled.status === "ativa") {
        return next(createError(500, "db_error", "Erro ao corrigir a prova."));
      }
      return res.json({
        data: submitPayload(pool, settled.questions, settled.answers ?? {}),
      });
    }

    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
});

// Historico do usuario na trilha, mais recente primeiro. A revisao completa
// da aprovada (se existir) e a unica situacao em que gabarito sai de novo.
router.get("/:slug/attempts", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { data: rows, error } = await supabaseAdmin
      .from("roadmap_quiz_attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("user_id", req.user!.id)
      .eq("roadmap_slug", slug)
      .order("created_at", { ascending: false });
    if (error) {
      return next(createError(500, "db_error", "Erro ao buscar tentativas."));
    }
    const attempts = (rows ?? []) as AttemptRow[];
    const approved = attempts.find((row) => row.status === "aprovada");
    const pool = roadmapQuizPools[slug];

    // Mesmo gate do POST /:slug/attempts (barra unica de tentativas), computado
    // aqui pra a tela explicativa mostrar restantes/cooldown SEM criar tentativa.
    // Fonte de verdade unica: o server; o POST reavalia no confirm.
    const failedAtMs = attempts
      .filter((row) => row.status === "reprovada")
      .map((row) => new Date(row.completed_at ?? row.created_at).getTime())
      .filter((ms) => Number.isFinite(ms))
      .sort((a, b) => a - b);
    const retakeGate = evaluateRetakeGate(failedAtMs, Date.now());

    res.json({
      data: {
        attempts: attempts.map(attemptSummary),
        retakeGate,
        ...(approved && pool
          ? {
              revisaoAprovada: buildApprovedReview(
                pool,
                approved.questions,
                approved.answers ?? {},
              ),
            }
          : {}),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
