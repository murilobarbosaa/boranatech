import crypto from "crypto";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { resolveAreaSelection } from "../../shared/areas";
import { detectGithubTarget } from "../../shared/github/detect";
import type {
  GithubQualitativeWithRequirements,
  ProjectValidationContext,
  RequisitoAvaliacao,
} from "../../shared/github/schema";
import {
  aliasesOf,
  dedupeByCanonicalId,
  resolveProjectId,
} from "../../shared/projects/aliases";
import { projetos, type ProjetoRequisito } from "../../shared/projects/catalog";
import { loadProjetoV2 } from "../../shared/projects/v2";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import { analyzeGithub } from "../lib/githubAnalyze";
import { computeValidationOutcome } from "../lib/projectValidation";
import {
  calcularNota,
  type NotaValidacao,
} from "../../shared/projects/validationScore";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { persistGithubAnalysis } from "./github";
import { montarDbError } from "../lib/dbError";

// Validacao de projeto Pro via leitor de GitHub (fase 5c.1). A camada
// VALIDADA e separada da autodeclarada por design: aprovacao NAO escreve
// project_progress nem course_progress; a UI da 5c.2 junta as duas.
const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Mesmo racional do ANALYZE_BUDGET_MS do github.ts: teto global da rota, com
// o signal propagado ate cada fetch do GitHub e a chamada da OpenAI.
const VALIDATE_BUDGET_MS = 75_000;

const TOOL = "project-validation";

// Entre duas validacoes do MESMO projeto pelo mesmo usuario. A cota diaria de
// IA continua sendo o teto real; isto so evita queimar cota em clique
// repetido, e por isso e conferido ANTES dela.
const COOLDOWN_MS = 5 * 60 * 1000;

/**
 * De onde saem os requisitos que a IA vai conferir.
 *
 * Desde o lote 06 qualquer projeto v2 de CODIGO vale, e nao so os 8 com selo
 * Pro do catalogo: e o modulo v2 que passa a mandar. Os 8 do catalogo
 * continuam funcionando pelos `requisitos` do catalogo ate migrarem.
 *
 * Projeto v2 de artefato (figma, notebook, documento, dashboard) fica de fora:
 * o avaliador le um repositorio, e nao ha repositorio para ler.
 */
async function requisitosParaValidar(
  project: (typeof projetos)[number],
): Promise<ProjetoRequisito[] | null> {
  const v2 = await loadProjetoV2(project.id);
  if (v2 && (v2.tipoEntrega === "repo" || v2.tipoEntrega === "repo_deploy"))
    return v2.requisitos;
  if (project.pro === true && project.requisitos?.length)
    return project.requisitos;
  return null;
}

router.post(
  "/:projectId/submit",
  async (req: Request, res: Response, next: NextFunction) => {
    // Gates em ordem, fail-closed.
    if (req.isPro !== true) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para validar projetos premium.",
        ),
      );
    }

    // Alias antes de tudo: link ou bundle antigo com id fundido valida o
    // projeto certo, em vez de 404.
    const projectId = resolveProjectId(req.params.projectId);
    const project = projetos.find((p) => p.id === projectId);
    if (!project) {
      return next(createError(404, "not_found", "Projeto não encontrado."));
    }
    const requisitos = await requisitosParaValidar(project);
    if (!requisitos) {
      return next(
        createError(
          400,
          "validation_unavailable",
          "Este projeto não tem validação disponível.",
        ),
      );
    }

    const userId = req.user!.id;

    // Historico do projeto, para o cooldown e para a regra da melhor nota.
    const { data: anteriores, error: erroHistorico } = await supabaseAdmin
      .from("project_validations")
      .select("id, status, created_at, requisitos_result")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (erroHistorico) {
      return next(
        montarDbError(
          "project-validation",
          "project-validations history",
          erroHistorico,
          "Erro ao verificar validações.",
        ),
      );
    }

    const historico = anteriores ?? [];
    const ultima = historico[0];
    if (ultima?.created_at) {
      const desde =
        Date.now() - new Date(ultima.created_at as string).getTime();
      if (desde < COOLDOWN_MS) {
        const retryAfter = Math.ceil((COOLDOWN_MS - desde) / 1000);
        return next(
          createError(
            429,
            "rate_limited",
            `Espere ${Math.ceil(retryAfter / 60)} min para validar de novo.`,
            { context: { retryAfter } },
          ),
        );
      }
    }

    const { url } = req.body as { url?: string };
    const target = detectGithubTarget(String(url ?? ""));
    if (target.kind !== "repo") {
      return next(
        createError(
          400,
          "invalid_request",
          "Envie a URL de um repositório público do GitHub (perfil não vale aqui).",
        ),
      );
    }

    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const usage = await checkAiDailyLimit(
      userId,
      true,
      "[project-validation]",
      TOOL,
    );
    if (!usage.allowed) {
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: TOOL,
          requestId,
          reservationId: usage.reservationId,
          status: "error",
          errorMessage: "rate limit check failed",
        });
        return next(
          createError(
            503,
            "rate_check_failed",
            "Não foi possível verificar seu limite de uso agora. Tente novamente em instantes.",
          ),
        );
      }
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        reservationId: usage.reservationId,
        status: "rate_limited",
      });
      return next(
        createError(
          429,
          "rate_limited",
          `Limite diário de ${usage.limit} chamadas de IA atingido. Tente novamente amanhã.`,
        ),
      );
    }

    let aiUsed = false;
    let aiIo = { inputChars: 0, outputChars: 0 };
    const budget = new AbortController();
    const budgetTimer = setTimeout(() => budget.abort(), VALIDATE_BUDGET_MS);
    budgetTimer.unref();
    try {
      const context: ProjectValidationContext = {
        projectId: project.id,
        nome: project.nome,
        objetivo: project.objetivo,
        requisitos,
      };
      const response = await analyzeGithub(
        "repo",
        { owner: target.owner, repo: target.repo },
        resolveAreaSelection(project.areaSlug ?? undefined),
        (io) => {
          aiUsed = true;
          aiIo = io;
        },
        budget.signal,
        context,
      );

      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        reservationId: usage.reservationId,
        status: aiUsed ? "success" : "skipped",
        inputChars: aiIo.inputChars,
        outputChars: JSON.stringify(response).length,
      });

      const avaliacao =
        (response.qualitative as GithubQualitativeWithRequirements)
          .requisitosAvaliacao ?? [];
      const outcome = computeValidationOutcome(requisitos, avaliacao);

      // A analise persiste no historico normal, com marcador de origem no
      // input jsonb. Aqui ela NAO e best-effort: a validacao referencia a
      // linha (analysis_id not null), entao sem analise persistida nao ha
      // registro de validacao.
      const analysisId = await persistGithubAnalysis(
        userId,
        String(url),
        response,
        { projectValidation: project.id },
      );
      if (!analysisId) {
        return next(
          createError(500, "save_failed", "Erro ao salvar a análise."),
        );
      }

      // MELHOR NOTA VENCE. Reenviar depois de validado e permitido (subir a
      // nota e o objetivo), mas uma tentativa PIOR nao pode rebaixar o que ja
      // esta registrado: o perfil mostraria menos do que a pessoa ja provou.
      const aprovadaAntes = historico.find((h) => h.status === "aprovado");
      const notaAnterior = aprovadaAntes
        ? calcularNota(
            requisitos.map((r) => r.id),
            (aprovadaAntes.requisitos_result ?? []) as RequisitoAvaliacao[],
          )
        : null;

      let gravado = true;
      let melhor: NotaValidacao | undefined;

      if (
        outcome.status === "aprovado" &&
        notaAnterior &&
        outcome.nota.atendidos < notaAnterior.atendidos
      ) {
        gravado = false;
        melhor = notaAnterior;
      } else if (outcome.status === "aprovado" && aprovadaAntes) {
        const { error: updateError } = await supabaseAdmin
          .from("project_validations")
          .update({
            analysis_id: analysisId,
            requisitos_result: avaliacao,
            created_at: new Date().toISOString(),
          })
          .eq("id", aprovadaAntes.id as string);
        if (updateError) {
          return next(
            createError(500, "save_failed", "Erro ao registrar a validação."),
          );
        }
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("project_validations")
          .insert({
            user_id: userId,
            project_id: project.id,
            analysis_id: analysisId,
            status: outcome.status,
            requisitos_result: avaliacao,
          });
        if (insertError) {
          // 23505 no unique parcial: outra submissao aprovou em corrida.
          // Idempotente: o estado final e "aprovado" de qualquer jeito.
          if (insertError.code !== "23505" || outcome.status !== "aprovado") {
            return next(
              createError(500, "save_failed", "Erro ao registrar a validação."),
            );
          }
        }
      }

      res.json({
        status: outcome.status,
        resultado: avaliacao,
        analysisId,
        nota: outcome.nota,
        pendentes: outcome.nota.pendentes,
        requisitos: requisitos.map((r) => ({
          id: r.id,
          descricao: r.descricao,
        })),
        gravado,
        ...(melhor ? { melhor } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        reservationId: usage.reservationId,
        status: "error",
        errorMessage: message,
      });
      if (budget.signal.aborted) {
        return next(
          createError(
            504,
            "analysis_timeout",
            "A validação demorou mais que o esperado e foi interrompida.",
          ),
        );
      }
      next(err);
    } finally {
      clearTimeout(budgetTimer);
    }
  },
);

/** Ids dos requisitos que valem para um projeto, ou null quando nao ha. */
async function idsDeRequisitos(projectId: string): Promise<string[] | null> {
  const project = projetos.find((p) => p.id === projectId);
  if (!project) return null;
  const requisitos = await requisitosParaValidar(project);
  return requisitos ? requisitos.map((r) => r.id) : null;
}

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_validations")
      .select("project_id, status, created_at, analysis_id, requisitos_result")
      .eq("user_id", req.user!.id)
      .order("created_at", { ascending: false });
    if (error) {
      return next(
        montarDbError(
          "project-validation",
          "project-validations list",
          error,
          "Erro ao listar validações.",
        ),
      );
    }
    const linhas = (data ?? []).map((row) => ({
      projectId: row.project_id as string,
      status: row.status as string,
      createdAt: row.created_at as string,
      analysisId: row.analysis_id as string,
      resultado: (row.requisitos_result ?? []) as RequisitoAvaliacao[],
    }));
    // A consulta ja vem ordenada por created_at desc, entao o colapso mantem
    // a validacao mais recente de cada projeto canonico.
    const colapsadas = dedupeByCanonicalId(
      linhas,
      (r) => r.projectId,
      (r, projectId) => ({ ...r, projectId }),
    );
    // A nota e DERIVADA na leitura: `requisitos_result` guarda o veredito por
    // requisito, e a lista de requisitos vem do modulo v2, que pode ter
    // mudado desde a validacao. Recalcular na leitura mantem a nota coerente
    // com o projeto de hoje.
    const comNota = await Promise.all(
      colapsadas.map(async ({ resultado, ...linha }) => {
        const ids = await idsDeRequisitos(linha.projectId);
        const nota = ids ? calcularNota(ids, resultado) : null;
        return { ...linha, nota, perfeito: nota?.perfeito ?? false };
      }),
    );
    res.json({ data: comNota });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:projectId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = resolveProjectId(req.params.projectId);
      // Busca pelo canonico E pelos aliases: a validacao pode ter sido
      // gravada antes da fusao, com o id que hoje nao existe mais.
      const { data, error } = await supabaseAdmin
        .from("project_validations")
        .select(
          "project_id, status, created_at, analysis_id, requisitos_result",
        )
        .eq("user_id", req.user!.id)
        .in("project_id", [projectId, ...aliasesOf(projectId)])
        .order("created_at", { ascending: false });
      if (error) {
        return next(
          montarDbError(
            "project-validation",
            "project-validations load",
            error,
            "Erro ao buscar validações.",
          ),
        );
      }
      const rows = data ?? [];
      if (rows.length === 0) {
        return next(
          createError(404, "not_found", "Nenhuma validação para este projeto."),
        );
      }
      const ids = await idsDeRequisitos(projectId);
      const requisitosDoProjeto = projetos.find((p) => p.id === projectId);
      const v2 = await loadProjetoV2(projectId);
      const listaRequisitos =
        v2 && (v2.tipoEntrega === "repo" || v2.tipoEntrega === "repo_deploy")
          ? v2.requisitos
          : (requisitosDoProjeto?.requisitos ?? []);

      const toItem = (row: (typeof rows)[number]) => {
        const resultado = (row.requisitos_result ?? []) as RequisitoAvaliacao[];
        return {
          projectId,
          status: row.status,
          createdAt: row.created_at,
          analysisId: row.analysis_id,
          resultado,
          nota: ids ? calcularNota(ids, resultado) : null,
        };
      };
      const aprovada = rows.find((row) => row.status === "aprovado");
      res.json({
        data: {
          ultima: toItem(rows[0]),
          aprovada: aprovada ? toItem(aprovada) : null,
          requisitos: listaRequisitos.map((r) => ({
            id: r.id,
            descricao: r.descricao,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
