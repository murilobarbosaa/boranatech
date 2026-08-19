import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import {
  LinkedinDadoInvalidoError,
  LinkedinAnalyzeRequestSchema,
  type LinkedinAnalysisResponse,
  type LinkedinAnalyzeRequest,
} from "../../shared/linkedin/schema";
import { estimateCost, estimateCostFromTokens } from "../lib/aiTools";
import { DEFAULT_MODEL } from "../lib/openai";
import { checkAiDailyLimit, logAiUsage } from "../lib/aiUsage";
import {
  analyzeLinkedin,
  LinkedinTruncatedError,
  LinkedinUnreadableError,
} from "../lib/linkedinAnalyze";
import type { LinkedinParsed } from "../../shared/linkedin/parse";
import { hashDoTexto } from "../lib/linkedinTextoHash";
import {
  beginLinkedinProgressSession,
  beginLinkedinProgressSessionViaRpc,
  indicesDeMelhoriaValidos,
  mutateLinkedinImprovementViaRpc,
  quantidadeDeMelhorias,
  saveLinkedinImprovement,
} from "../lib/linkedinImprovementProgress";
import { headlineManualLonga } from "../lib/linkedinHeadlineManual";
import { montarLinkedinInputPersistido } from "../lib/linkedinPersistence";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const TOOL = "linkedin-analyzer";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Persistência fail-soft: nunca derruba a análise e nunca é confundida com
 * sucesso, falha vira um console.error claro no servidor. O input jsonb guarda
 * o formulário e um resumo do parse (sem o texto cru gigante do perfil).
 * Devolve o id da linha inserida (o client precisa dele pro checklist de
 * melhorias aplicadas) ou null quando a persistência falhou, espelhando o
 * persistGithubAnalysis.
 */
async function persistAnalysis(
  userId: string,
  request: LinkedinAnalyzeRequest,
  response: LinkedinAnalysisResponse,
  parsed: LinkedinParsed,
  textoHash: string,
): Promise<string | null> {
  try {
    // Não guarda profileText. O helper centraliza entryPath, hash, skills e a
    // mesma headline efetiva que alimentou checks, prompt e resultado.
    const input = montarLinkedinInputPersistido(
      request,
      response,
      parsed,
      textoHash,
    );

    const { data, error } = await supabaseAdmin
      .from("linkedin_analyses")
      .insert({
        user_id: userId,
        area: request.area,
        level: request.level,
        score: response.deterministic.score,
        faixa: response.deterministic.faixa,
        input,
        result: response,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        "[linkedin] Falha ao persistir analise (fail-soft):",
        error.message,
      );
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (err) {
    console.error(
      "[linkedin] Erro inesperado ao persistir analise (fail-soft):",
      err,
    );
    return null;
  }
}

router.post(
  "/analyze",
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isPro) {
      return next(
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para usar o analisador de LinkedIn.",
        ),
      );
    }

    const headlineLonga = headlineManualLonga(
      (req.body as { headlineManual?: unknown })?.headlineManual,
    );
    if (headlineLonga) {
      return next(
        createError(
          422,
          "headline_manual_longa",
          `A headline tem ${headlineLonga.tamanho} caracteres e o limite é ${headlineLonga.limite}. Encurte antes de continuar.`,
        ),
      );
    }

    const parsedBody = LinkedinAnalyzeRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return next(
        createError(
          400,
          "invalid_request",
          "Dados inválidos. Confira o texto do perfil e os campos do formulário.",
        ),
      );
    }

    const request = parsedBody.data;
    const userId = req.user!.id;
    const requestId =
      (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

    const usage = await checkAiDailyLimit(
      userId,
      !!req.isPro,
      "[linkedin]",
      TOOL,
    );
    if (!usage.allowed) {
      // Falha de verificacao (RPC fora) e distinta de cota estourada: 503, nao
      // 429, e loga como "error" pra nao poluir a metrica de rate_limited.
      // Espelha server/routes/github.ts.
      if (usage.verificationFailed) {
        await logAiUsage({
          userId,
          tool: TOOL,
          requestId,
          status: "error",
          errorMessage: "rate limit check failed",
        });
        // TODO(Ana): mensagem de falha ao verificar o limite de uso (503).
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
    let aiIo = {
      inputChars: 0,
      outputChars: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    try {
      const { response, parsed } = await analyzeLinkedin(request, (io) => {
        aiUsed = true;
        aiIo = io;
      });
      const textoHash = hashDoTexto(request.profileText);
      // outputChars mede a SAIDA DO MODELO (aiIo.outputChars, o tamanho do
      // content devolvido pela OpenAI), nao JSON.stringify(response): a
      // resposta da rota carrega tambem o bloco deterministico inteiro, que a
      // IA nao gerou e ninguem pagou. Com o response completo, a linha de
      // exemplo media 10.432 caracteres contra os ~3.900 de saida real.
      // O atalho sem IA (perfil quase vazio) fica com zero, que e o correto.
      // So conta no limite diario quando a IA rodou de fato. O atalho caloroso
      // (perfil quase vazio) loga como "skipped", que nao conta na cota.
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: aiUsed ? "success" : "skipped",
        inputChars: aiIo.inputChars,
        outputChars: aiIo.outputChars,
        inputTokens: aiIo.inputTokens,
        outputTokens: aiIo.outputTokens,
        // Sem isto a ferramenta aparecia com custo zero nos paineis admin
        // (/ai-stats e get_ai_usage_admin_summary somam cost_estimate).
        // Tokens EXATOS de usage quando vierem; a conta por chars fica so de
        // fallback, porque CHARS_PER_TOKEN subestima a entrada.
        costEstimate: aiUsed
          ? aiIo.inputTokens > 0
            ? estimateCostFromTokens(
                aiIo.inputTokens,
                aiIo.outputTokens,
                DEFAULT_MODEL,
              )
            : estimateCost(aiIo.inputChars, aiIo.outputChars, DEFAULT_MODEL)
          : 0,
      });

      const analysisId = await persistAnalysis(
        userId,
        request,
        response,
        parsed,
        textoHash,
      );

      res.json({ data: response, analysisId, textoHash });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      await logAiUsage({
        userId,
        tool: TOOL,
        requestId,
        status: "error",
        errorMessage: message,
      });

      if (err instanceof LinkedinUnreadableError) {
        return next(
          createError(
            422,
            "unreadable_profile",
            "Não consegui ler seu perfil a partir do texto enviado. Tente colar o texto do perfil manualmente.",
          ),
        );
      }
      if (err instanceof LinkedinTruncatedError) {
        // TODO(Ana): revisar a mensagem de analise cortada por tamanho.
        return next(
          createError(
            502,
            "analysis_truncated",
            "A análise ficou grande demais e foi cortada no meio. Tente de novo com um texto de perfil mais enxuto.",
          ),
        );
      }
      // Dado NOSSO invalido nao e falha de terceiro. Antes desta distincao, um
      // check com tier corrompido caia no ramo generico abaixo e virava
      // `502 upstream_error`, com a mensagem que sugere instabilidade da
      // OpenAI: o diagnostico comecava no lugar errado. 500, e nao 502, porque
      // nao ha upstream envolvido; e `code` proprio para o painel separar os
      // dois. O `errorHandler` reporta ao Sentry a partir de 500, entao o
      // evento continua saindo.
      if (err instanceof LinkedinDadoInvalidoError) {
        return next(
          createError(
            500,
            "analysis_data_invalid",
            "Algo saiu errado do nosso lado ao montar sua análise. Já registramos o problema. Tente de novo em instantes.",
          ),
        );
      }
      return next(
        createError(
          502,
          "upstream_error",
          "Não foi possível concluir a análise agora. Tente de novo.",
          {
            cause: err,
          },
        ),
      );
    }
  },
);

router.get(
  "/analyses",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("linkedin_analyses")
        .select(
          // `notaIncompleta` entra na lista pelo mesmo motivo de `checks`: o
          // delta e o historico precisam dela por LINHA, e buscar o `result`
          // inteiro de 20 analises so para ler um booleano seria caro. Ausente
          // nas linhas anteriores a v7, e o cliente normaliza para `false`.
          "id, area, level, score, faixa, created_at, input->>textoHash, comparacaoVersion:input->comparacaoVersion, mercado:input->>mercado, headlineComparacao:input->parseResumo->>headline, headlineOrigem:input->parseResumo->>headlineOrigem, skillsComparacao:input->>skills, foto:input->>foto, banner:input->>banner, openToWork:input->>openToWork, conexoes:input->>conexoes, atividade:input->>atividade, result->deterministicVersion, result->qualitativeVersion, result->deterministic->checks, result->deterministic->notaIncompleta",
        )
        .eq("user_id", req.user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("[linkedin] Falha ao listar analises:", error.message);
        return next(
          createError(500, "db_error", "Erro ao buscar suas análises."),
        );
      }
      res.json({ data: data ?? [] });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/analyses/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    try {
      const { data, error } = await supabaseAdmin
        .from("linkedin_analyses")
        .select(
          "id, area, level, score, faixa, created_at, input->>textoHash, comparacaoVersion:input->comparacaoVersion, mercado:input->>mercado, headlineComparacao:input->parseResumo->>headline, headlineOrigem:input->parseResumo->>headlineOrigem, skillsComparacao:input->>skills, foto:input->>foto, banner:input->>banner, openToWork:input->>openToWork, conexoes:input->>conexoes, atividade:input->>atividade, result->deterministicVersion, result->qualitativeVersion, result",
        )
        .eq("user_id", req.user!.id)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[linkedin] Falha ao buscar a analise:", error.message);
        return next(createError(500, "db_error", "Erro ao buscar a análise."));
      }
      if (!data) {
        return next(createError(404, "not_found", "Análise não encontrada."));
      }
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// Progresso das melhorias aplicadas (o checklist vivo do resultado), espelho
// das rotas do analisador de GitHub. Sem gate Pro alem do requireAuth do
// router: e progresso do PROPRIO dado (um ex-Pro segue marcando as analises
// antigas). Nenhum custo de IA aqui.

/**
 * A tabela de progresso nao existe no banco alvo?
 *
 * Rede de seguranca para migration esquecida: o codigo novo tolera schema
 * antigo em vez de devolver 500 no meio de um resultado que deu certo. NAO
 * substitui aplicar a migration, so troca "erro vermelho" por "recurso
 * indisponivel" enquanto ela nao chega.
 *
 * PGRST205 e o schema cache do PostgREST sem a tabela; 42P01 e o undefined_table
 * do proprio Postgres. Checagem por codigo, nunca por texto da mensagem.
 */
function isMissingProgressPersistence(error: {
  code?: string | null;
}): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    error.code === "42P01" ||
    error.code === "42883"
  );
}

const linkedinProgressRpc = async (
  functionName: string,
  args: Record<string, unknown>,
) => {
  const { data, error } = await supabaseAdmin.rpc(functionName, args);
  return { data, error };
};

// Busca pelo dono antes de qualquer leitura/escrita de progresso. `undefined`
// significa inexistente ou de outro usuário; `null`, falha da consulta.
async function ownedLinkedinAnalysis(
  userId: string,
  analysisId: string,
): Promise<{ result: unknown } | null | undefined> {
  const { data, error } = await supabaseAdmin
    .from("linkedin_analyses")
    .select("result")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .maybeSingle();
  if (error) {
    console.error(
      "[linkedin] checagem de posse da analise falhou:",
      error.message,
    );
    return null;
  }
  if (!data || typeof data !== "object") return undefined;
  return { result: (data as { result?: unknown }).result };
}

router.get(
  "/analyses/:id/improvements",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const analysis = await ownedLinkedinAnalysis(userId, id);
    if (analysis === null) {
      // TODO(Ana): mensagem de falha ao carregar o progresso.
      return next(
        createError(
          500,
          "load_failed",
          "Não foi possível carregar o progresso.",
        ),
      );
    }
    if (!analysis) {
      // 404 tambem para analise de OUTRO usuario: nao vaza existencia.
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const session = await beginLinkedinProgressSession({
      beginAtomically: () =>
        beginLinkedinProgressSessionViaRpc(
          { userId, analysisId: id },
          linkedinProgressRpc,
        ),
    });
    if (session.status === "not_found") {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    if (session.status === "start_failed") {
      const error = session.error as {
        code?: string | null;
        message?: string;
      };
      if (isMissingProgressPersistence(error ?? {})) {
        return res.json({
          applied: [],
          progressAvailable: false,
          revision: null,
        });
      }
      console.error(
        "[linkedin] Falha ao iniciar sessão de progresso:",
        error?.message ?? "erro_sem_mensagem",
      );
      return next(
        createError(
          500,
          "load_failed",
          "Não foi possível carregar o progresso.",
        ),
      );
    }
    const { data, error } = await supabaseAdmin
      .from("linkedin_improvement_progress")
      .select("improvement_index")
      .eq("user_id", userId)
      .eq("analysis_id", id)
      .eq("done", true);
    if (error) {
      console.error(
        "[linkedin] Falha ao carregar o progresso de melhorias:",
        error.message,
      );
      // Tabela ausente: 200 com progressAvailable false. A UI esconde o
      // checklist e avisa que o recurso esta indisponivel, em vez de exibir
      // erro vermelho sobre um resultado que deu certo.
      if (isMissingProgressPersistence(error)) {
        return res.json({
          applied: [],
          progressAvailable: false,
          revision: null,
        });
      }
      return next(
        createError(
          500,
          "load_failed",
          "Não foi possível carregar o progresso.",
        ),
      );
    }
    res.json({
      applied: indicesDeMelhoriaValidos(
        ((data ?? []) as Array<{ improvement_index?: unknown }>).map(
          (row) => row.improvement_index,
        ),
        quantidadeDeMelhorias(analysis.result),
      ),
      progressAvailable: true,
      revision: session.revision,
    });
  },
);

router.put(
  "/analyses/:id/improvements/:index",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    const index = Number(req.params.index);
    const body = (req.body ?? {}) as { done?: unknown; revision?: unknown };
    const outcome = await saveLinkedinImprovement(
      {
        userId,
        analysisId: id,
        index,
        done: body.done,
        revision: body.revision,
      },
      {
        mutateAtomically: (value) =>
          mutateLinkedinImprovementViaRpc(value, linkedinProgressRpc),
      },
    );

    if (outcome.status === "invalid_request") {
      return next(
        createError(400, "invalid_request", "Índice ou estado inválido."),
      );
    }
    if (outcome.status === "not_found") {
      return next(createError(404, "not_found", "Análise não encontrada."));
    }
    if (outcome.status === "invalid_improvement_index") {
      return next(
        createError(
          400,
          "invalid_improvement_index",
          "Essa melhoria não existe nesta análise.",
        ),
      );
    }
    if (outcome.status === "stale_progress_revision") {
      return next(
        createError(
          409,
          "stale_progress_revision",
          "Esta sessão de progresso foi substituída por uma mais recente.",
        ),
      );
    }
    if (outcome.status === "save_failed") {
      const error = outcome.error as { code?: string | null; message?: string };
      console.error(
        "[linkedin] Falha ao salvar o progresso de melhorias:",
        error?.message ?? "erro_sem_mensagem",
      );
      // Codigo proprio: o client trata como recurso indisponivel (esconde o
      // checklist), nao como falha de salvar (que pediria "tente de novo").
      if (isMissingProgressPersistence(error ?? {})) {
        return next(
          createError(
            503,
            "progress_unavailable",
            "O progresso de melhorias está indisponível no momento.",
          ),
        );
      }
      return next(
        createError(500, "save_failed", "Não foi possível salvar o progresso."),
      );
    }
    res.json({ ok: true });
  },
);

export default router;
