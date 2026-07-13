import crypto from "crypto";
import { NextFunction, Request, Response, Router } from "express";

import {
  AI_ROADMAP_SLUG_RE,
  RoadmapIntakeSchema,
  type RoadmapIntake,
} from "../../shared/aiRoadmap";
import { roadmapsV2 } from "../../shared/roadmapV2/content";
import type { RoadmapNode, RoadmapV2 } from "../../shared/roadmapV2/types";
import {
  buildGenerationContext,
  countLeaves,
  generateAiRoadmapSlug,
  generateSectionContent,
  generateSkeleton,
} from "../lib/aiRoadmap/generate";
import { estimateCost } from "../lib/aiTools";
import {
  checkAiDailyLimit,
  checkRoadmapIntakeChatDailyLimit,
  logAiUsage,
  ROADMAP_INTAKE_CHAT_TOOL,
} from "../lib/aiUsage";
import {
  runIntakeChatTurn,
  validateIntakeChatBody,
  type IntakeChatAiIo,
} from "../lib/aiRoadmap/intakeChat";
import { env } from "../lib/env";
import { fetchUserContextPool } from "../lib/userContext/pool";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

// Rotas do Roadmap com IA (Roadmap Pro), montadas em /api/roadmaps-ia.
//
// Geracao sincrona com SSE e persistencia INCREMENTAL: o esqueleto vira uma
// linha em ai_roadmaps (status generating) e cada secao gerada atualiza o
// jsonb na hora. Falha no meio deixa status partial, retomavel por
// POST /:slug/resume, que completa SO as secoes vazias.
//
// Quota: UMA unidade da tool roadmap-generator (ja em AI_TOOLS), cobrada
// apenas na CONCLUSAO total (status ready), seja na geracao original, seja na
// retomada que concluir. Falha parcial nao cobra; duas retomadas nao cobram
// duas vezes (so a que conclui loga success).
//
// Seguranca: tier so de req.isPro (fail-closed), userId so do JWT, toda query
// filtra user_id, slug SEMPRE do servidor, 404 (nunca 403) para linha que nao
// e do usuario (nao vaza existencia).

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

const ROADMAP_GENERATOR_TOOL = "roadmap-generator";
// Janela do bloqueio de geracao concorrente. Ajustavel. // TODO: calibrar.
const CONCURRENT_WINDOW_MS = 5 * 60 * 1000;

interface AiRoadmapListRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  created_at: string;
  // updated_at na lista permite a UI distinguir generating ATIVO (recente) de
  // geracao que morreu no meio.
  updated_at: string;
}

interface AiRoadmapRow extends AiRoadmapListRow {
  inputs: Record<string, unknown>;
  roadmap: RoadmapV2;
}

// SSE no padrao do agente (server/routes/agent.ts): mesmos headers e frames.
function sseInit(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

// Emits fail-soft: cliente que fechou a aba mata o socket, mas a geracao segue
// gerando e persistindo por secao ate ready/partial. Um throw de write aqui
// NAO pode abortar o loop (cairia no catch de runSections e marcaria partial).
function sseSend(res: Response, payload: Record<string, unknown>): void {
  try {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch (err) {
    console.warn("[roadmap-ia] emit SSE falhou (cliente desconectado?):", err);
  }
}

function sseDone(res: Response): void {
  try {
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.warn("[roadmap-ia] fechamento SSE falhou (cliente desconectado?):", err);
  }
}

async function setStatus(
  rowId: string,
  userId: string,
  status: "partial" | "ready" | "failed",
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("ai_roadmaps")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", rowId)
    .eq("user_id", userId);
  if (error) {
    console.warn(`[roadmap-ia] update de status ${status} falhou:`, error.message);
    return false;
  }
  return true;
}

// Insere a linha do roadmap com retry de colisao de slug (unique global). A
// colisao e improvavel (8 hex) e o retry regenera o slug sem nova chamada de IA.
async function insertRoadmapRow(
  userId: string,
  intake: RoadmapIntake,
  roadmap: RoadmapV2,
): Promise<{ id: string }> {
  const MAX_SLUG_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("ai_roadmaps")
      .insert({
        user_id: userId,
        slug: roadmap.slug,
        title: roadmap.title,
        status: "generating",
        inputs: intake,
        roadmap,
      })
      .select("id")
      .single();
    if (!error && data) {
      return data as { id: string };
    }
    if (error && error.code === "23505" && attempt < MAX_SLUG_ATTEMPTS) {
      roadmap.slug = generateAiRoadmapSlug();
      continue;
    }
    throw new Error(`insert em ai_roadmaps falhou: ${error?.message ?? "sem dados"}`);
  }
  throw new Error("colisao de slug persistente em ai_roadmaps");
}

interface SectionLoopIo {
  inputChars: number;
  outputChars: number;
}

// Gera e persiste as secoes pedidas, emitindo um evento SSE por secao. Uma
// secao que falha (IA ou persistencia) NAO aborta o loop (degradacao graciosa):
// vira um frame section_failed, o loop segue, e a secao fica com children vazio
// (retomavel depois). Retorna a lista das que falharam (vazia = todas ok).
async function runSections(
  res: Response,
  userId: string,
  rowId: string,
  roadmap: RoadmapV2,
  context: string,
  indexes: number[],
  io: SectionLoopIo,
): Promise<Array<{ index: number; detail: string }>> {
  const total = roadmap.sections.length;
  const failed: Array<{ index: number; detail: string }> = [];
  for (const index of indexes) {
    try {
      const section = await generateSectionContent(context, roadmap, index);
      io.inputChars += section.inputChars;
      io.outputChars += section.outputChars;
      roadmap.sections[index].children = section.data;
      const { error: updateError } = await supabaseAdmin
        .from("ai_roadmaps")
        .update({ roadmap, updated_at: new Date().toISOString() })
        .eq("id", rowId)
        .eq("user_id", userId);
      if (updateError) {
        throw new Error(`persistencia da secao falhou: ${updateError.message}`);
      }
      sseSend(res, { type: "section", index, total });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`[roadmap-ia] secao ${index} falhou: ${detail}`);
      failed.push({ index, detail });
      sseSend(res, { type: "section_failed", index, total });
    }
  }
  return failed;
}

// Fecha a geracao a partir do resultado do loop. Nenhuma falha: ready + cota
// (finishGeneration). Alguma falha: status partial, SEM cobrar (a retomada que
// concluir cobra). Se sobrou pelo menos uma secao preenchida, o roadmap ja e
// navegavel e o frame "partial" leva o usuario a ele; se NADA foi gerado, cai
// no parcial classico com o frame de erro retomavel.
async function concludeGeneration(
  res: Response,
  userId: string,
  rowId: string,
  roadmap: RoadmapV2,
  slug: string,
  requestId: string,
  io: SectionLoopIo,
  failed: Array<{ index: number; detail: string }>,
): Promise<void> {
  if (failed.length === 0) {
    await finishGeneration(res, userId, rowId, slug, requestId, io);
    return;
  }

  await setStatus(rowId, userId, "partial");
  await logAiUsage({
    userId,
    tool: ROADMAP_GENERATOR_TOOL,
    requestId,
    status: "error",
    errorMessage: `secoes falharam: ${failed.map((f) => f.index).join(",")}`.slice(0, 300),
    inputChars: io.inputChars,
    outputChars: io.outputChars,
  });

  const filled = roadmap.sections.filter(
    (section) => Array.isArray(section.children) && section.children.length > 0,
  ).length;

  if (filled === 0) {
    // TODO(Ana): mensagem de falha parcial sem nada aproveitavel (retomada).
    sseSend(res, {
      type: "error",
      message:
        "A geracao parou no meio. Seu progresso foi salvo e voce pode retomar.",
    });
  } else {
    sseSend(res, {
      type: "partial",
      slug,
      total: roadmap.sections.length,
      filled,
      failed: failed.map((f) => f.index),
    });
  }
  sseDone(res);
}

// Conclui a geracao: status ready + a UNICA unidade de quota (logAiUsage
// success) + evento done. Se o update para ready falhar, cai para partial e
// NAO cobra (a retomada que conseguir marcar ready cobra).
async function finishGeneration(
  res: Response,
  userId: string,
  rowId: string,
  slug: string,
  requestId: string,
  io: SectionLoopIo,
): Promise<void> {
  const ready = await setStatus(rowId, userId, "ready");
  if (!ready) {
    await setStatus(rowId, userId, "partial");
    await logAiUsage({
      userId,
      tool: ROADMAP_GENERATOR_TOOL,
      requestId,
      status: "error",
      errorMessage: "falha ao marcar ready",
      inputChars: io.inputChars,
      outputChars: io.outputChars,
    });
    // TODO(Ana): mensagem de falha ao concluir a geracao.
    sseSend(res, {
      type: "error",
      message: "A geracao terminou mas nao foi possivel salvar. Tente retomar.",
    });
    sseDone(res);
    return;
  }
  await logAiUsage({
    userId,
    tool: ROADMAP_GENERATOR_TOOL,
    requestId,
    status: "success",
    inputChars: io.inputChars,
    outputChars: io.outputChars,
    costEstimate: estimateCost(io.inputChars, io.outputChars),
  });
  sseSend(res, { type: "done", slug });
  sseDone(res);
}

// Gate comum de geracao (generate e resume): Pro explicito e quota fail-closed.
// Retorna false depois de responder via next() quando barrado.
async function passesGenerationGate(
  req: Request,
  next: NextFunction,
  requestId: string,
): Promise<boolean> {
  const userId = req.user!.id;
  if (req.isPro !== true) {
    // TODO(Ana): mensagem de recurso exclusivo Pro.
    next(createError(403, "pro_required", "O Roadmap com IA e exclusivo do Plano Pro."));
    return false;
  }
  const usage = await checkAiDailyLimit(userId, true, "[roadmap-ia]");
  if (!usage.allowed) {
    if (usage.verificationFailed) {
      await logAiUsage({
        userId,
        tool: ROADMAP_GENERATOR_TOOL,
        requestId,
        status: "error",
        errorMessage: "rate limit check failed",
      });
      // TODO(Ana): mensagem de falha de verificacao de limite.
      next(
        createError(
          503,
          "rate_check_failed",
          "Nao foi possivel verificar seu limite de uso agora. Tente novamente em instantes.",
        ),
      );
      return false;
    }
    await logAiUsage({
      userId,
      tool: ROADMAP_GENERATOR_TOOL,
      requestId,
      status: "rate_limited",
    });
    // TODO(Ana): mensagem de limite diario atingido.
    next(
      createError(
        429,
        "rate_limited",
        "Limite diario de ferramentas de IA atingido. Tente novamente amanha.",
      ),
    );
    return false;
  }
  if (!env.openaiApiKey) {
    // TODO(Ana): mensagem de servico nao configurado.
    next(createError(503, "upstream_error", "Servico de IA nao configurado."));
    return false;
  }
  return true;
}

router.post("/generate", async (req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (res.locals.requestId as string | undefined) ?? crypto.randomUUID();
  const userId = req.user!.id;

  try {
    const parsedBody = RoadmapIntakeSchema.safeParse(req.body);
    if (!parsedBody.success) {
      // TODO(Ana): mensagem de respostas invalidas do entendimento.
      return next(
        createError(400, "invalid_request", "Respostas do entendimento invalidas."),
      );
    }
    const intake = parsedBody.data;

    if (!(await passesGenerationGate(req, next, requestId))) return;

    // Anti-abuso: uma geracao ativa por vez. Fail-closed: erro na checagem
    // nao libera geracao concorrente.
    const cutoff = new Date(Date.now() - CONCURRENT_WINDOW_MS).toISOString();
    const { data: activeRows, error: activeError } = await supabaseAdmin
      .from("ai_roadmaps")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "generating")
      .gte("updated_at", cutoff)
      .limit(1);
    if (activeError) {
      // TODO(Ana): mensagem de falha na checagem de geracao em andamento.
      return next(
        createError(
          503,
          "concurrency_check_failed",
          "Nao foi possivel verificar suas geracoes agora. Tente novamente em instantes.",
        ),
      );
    }
    if ((activeRows ?? []).length > 0) {
      // TODO(Ana): mensagem de geracao ja em andamento.
      return next(
        createError(
          429,
          "generation_in_progress",
          "Voce ja tem um roadmap sendo gerado. Aguarde alguns minutos.",
        ),
      );
    }

    const context = await buildGenerationContext(userId, intake);

    sseInit(res);

    // Daqui em diante, erro vira frame SSE (headers ja foram enviados).
    const io: SectionLoopIo = { inputChars: 0, outputChars: 0 };
    let roadmap: RoadmapV2;
    let rowId: string;
    try {
      const skeleton = await generateSkeleton(context);
      io.inputChars += skeleton.inputChars;
      io.outputChars += skeleton.outputChars;
      roadmap = skeleton.data;
      const inserted = await insertRoadmapRow(userId, intake, roadmap);
      rowId = inserted.id;
    } catch (err) {
      // Falha antes ou durante o insert: nao ha linha valida, nada cobrado.
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[roadmap-ia] esqueleto falhou:", detail);
      await logAiUsage({
        userId,
        tool: ROADMAP_GENERATOR_TOOL,
        requestId,
        status: "error",
        errorMessage: detail.slice(0, 300),
      });
      // TODO(Ana): mensagem de falha na geracao do esqueleto.
      sseSend(res, {
        type: "error",
        message: "Nao consegui montar seu roadmap agora. Tente novamente.",
      });
      sseDone(res);
      return;
    }

    sseSend(res, {
      type: "skeleton",
      slug: roadmap.slug,
      title: roadmap.title,
      total: roadmap.sections.length,
    });

    const indexes = roadmap.sections.map((_, i) => i);
    const failed = await runSections(res, userId, rowId, roadmap, context, indexes, io);
    await concludeGeneration(
      res,
      userId,
      rowId,
      roadmap,
      roadmap.slug,
      requestId,
      io,
      failed,
    );
  } catch (err) {
    // Barreira final: erro inesperado antes do SSE vira 500; depois, frame.
    if (res.headersSent) {
      console.error("[roadmap-ia] erro inesperado no stream:", err);
      // TODO(Ana): mensagem de erro inesperado na geracao.
      sseSend(res, { type: "error", message: "Erro ao gerar. Tente novamente." });
      sseDone(res);
      return;
    }
    return next(err);
  }
});

// POST /api/roadmaps-ia/intake/chat: um turno do chat de intake guiado. NAO gera
// roadmap e NAO grava nada (efemero; o client mantem o historico e reenvia a
// cada turno, como o agente e o chat de intake do plano de carreira). A geracao
// segue no POST /generate, que revalida o intake final com RoadmapIntakeSchema
// (defesa em profundidade: o server nunca confia no intake montado pelo chat).
router.post("/intake/chat", async (req: Request, res: Response, next: NextFunction) => {
  // Recheck fail-closed: conversar tambem e exclusivo do Pro (senao um usuario
  // free consumiria IA de graca), mesmo padrao do career-plan/intake/chat.
  if (req.isPro !== true) {
    // TODO(Ana): mensagem de recurso exclusivo Pro.
    return next(
      createError(403, "pro_required", "O Roadmap com IA e exclusivo do Plano Pro."),
    );
  }

  const userId = req.user!.id;
  const requestId =
    (res.locals.requestId as string | undefined) ?? crypto.randomUUID();

  const body = validateIntakeChatBody(req.body);
  if (!body.ok) {
    if (body.error === "turn_limit") {
      // TODO(Ana): mensagem de limite de turnos do chat (a UI oferece o formulario).
      return next(
        createError(
          400,
          "turn_limit",
          "Chegamos ao limite desta conversa. Prefira preencher o formulario para gerar seu roadmap.",
        ),
      );
    }
    if (body.error === "payload_too_large") {
      // TODO(Ana): mensagem de conversa longa demais.
      return next(
        createError(
          400,
          "payload_too_large",
          "Conversa longa demais. Comece uma nova ou use o formulario.",
        ),
      );
    }
    // TODO(Ana): mensagem de requisicao invalida.
    return next(
      createError(400, "invalid_request", "Envie pelo menos uma mensagem valida."),
    );
  }

  // Quota DEDICADA por tool (nao a global): fail-closed 503 na falha de
  // verificacao, 429 no limite atingido. logAiUsage por turno.
  const usage = await checkRoadmapIntakeChatDailyLimit(userId);
  if (!usage.allowed) {
    if (usage.verificationFailed) {
      await logAiUsage({
        userId,
        tool: ROADMAP_INTAKE_CHAT_TOOL,
        requestId,
        status: "error",
        errorMessage: "rate limit check failed",
      });
      // TODO(Ana): mensagem de falha ao verificar o limite de uso (503).
      return next(
        createError(
          503,
          "rate_check_failed",
          "Nao foi possivel verificar seu limite de uso agora. Tente novamente em instantes.",
        ),
      );
    }
    await logAiUsage({
      userId,
      tool: ROADMAP_INTAKE_CHAT_TOOL,
      requestId,
      status: "rate_limited",
    });
    // TODO(Ana): mensagem de limite diario de mensagens do chat atingido (429).
    return next(
      createError(
        429,
        "rate_limited",
        "Limite diario de mensagens do chat atingido. Tente novamente amanha.",
      ),
    );
  }

  let aiIo: IntakeChatAiIo = { inputChars: 0, outputChars: 0 };
  try {
    const turn = await runIntakeChatTurn(userId, body.messages, (io) => {
      aiIo = io;
    });
    await logAiUsage({
      userId,
      tool: ROADMAP_INTAKE_CHAT_TOOL,
      requestId,
      status: "success",
      inputChars: aiIo.inputChars,
      outputChars: aiIo.outputChars,
      costEstimate: estimateCost(aiIo.inputChars, aiIo.outputChars),
    });
    res.json({
      reply: turn.reply,
      intake: turn.intake,
      missing: turn.missing,
      ready: turn.ready,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    await logAiUsage({
      userId,
      tool: ROADMAP_INTAKE_CHAT_TOOL,
      requestId,
      status: "error",
      errorMessage: message,
      inputChars: aiIo.inputChars,
    });
    // TODO(Ana): mensagem de erro ao processar o turno do chat (502).
    return next(
      createError(
        502,
        "upstream_error",
        "Nao foi possivel responder agora. Tente de novo.",
      ),
    );
  }
});

router.post("/:slug/resume", async (req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (res.locals.requestId as string | undefined) ?? crypto.randomUUID();
  const userId = req.user!.id;
  // Preenchido quando o lock otimista flipou partial -> generating. O catch
  // final usa isso para restaurar partial em erro inesperado (nunca deixar a
  // linha presa em generating sem geracao rodando).
  let lockedRowId: string | null = null;

  try {
    const slug = req.params.slug;
    if (!AI_ROADMAP_SLUG_RE.test(slug)) {
      // TODO(Ana): mensagem de roadmap nao encontrado.
      return next(createError(404, "not_found", "Roadmap nao encontrado."));
    }

    const { data, error } = await supabaseAdmin
      .from("ai_roadmaps")
      .select("id, slug, title, status, inputs, roadmap, created_at, updated_at")
      .eq("user_id", userId)
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      // TODO(Ana): mensagem de falha ao carregar o roadmap.
      return next(createError(503, "load_failed", "Nao foi possivel carregar o roadmap agora."));
    }
    if (!data) {
      // 404 tambem para linha de OUTRO usuario: nao vaza existencia.
      // TODO(Ana): mensagem de roadmap nao encontrado.
      return next(createError(404, "not_found", "Roadmap nao encontrado."));
    }
    const row = data as AiRoadmapRow;

    if (row.status !== "partial") {
      // TODO(Ana): mensagem de roadmap nao retomavel.
      return next(
        createError(409, "not_resumable", "Este roadmap nao esta pausado para retomada."),
      );
    }

    const parsedIntake = RoadmapIntakeSchema.safeParse(row.inputs);
    if (!parsedIntake.success) {
      // inputs foram escritos pelo proprio servidor; falha aqui e corrupcao.
      // TODO(Ana): mensagem de roadmap corrompido.
      return next(createError(500, "corrupted_inputs", "Nao foi possivel retomar este roadmap."));
    }
    const roadmap = row.roadmap;
    if (!roadmap || !Array.isArray(roadmap.sections)) {
      // TODO(Ana): mensagem de roadmap corrompido.
      return next(createError(500, "corrupted_roadmap", "Nao foi possivel retomar este roadmap."));
    }

    if (!(await passesGenerationGate(req, next, requestId))) return;

    // Lock otimista: flipa partial -> generating condicionado ao status ATUAL
    // ser partial. Zero linhas afetadas = outra retomada ja flipou (ou o
    // estado mudou): 409, sem gerar nem cobrar. Impede retomadas simultaneas
    // e a dupla cobranca na conclusao.
    const { data: lockedRows, error: lockError } = await supabaseAdmin
      .from("ai_roadmaps")
      .update({ status: "generating", updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", userId)
      .eq("status", "partial")
      .select("id");
    if (lockError) {
      // TODO(Ana): mensagem de falha ao iniciar a retomada.
      return next(
        createError(503, "resume_lock_failed", "Nao foi possivel iniciar a retomada agora. Tente novamente em instantes."),
      );
    }
    if (!lockedRows || lockedRows.length === 0) {
      // TODO(Ana): mensagem de retomada ja em andamento.
      return next(
        createError(409, "resume_in_progress", "Este roadmap ja esta sendo retomado. Aguarde alguns minutos."),
      );
    }
    lockedRowId = row.id;

    const context = await buildGenerationContext(userId, parsedIntake.data);

    sseInit(res);

    sseSend(res, {
      type: "skeleton",
      slug: row.slug,
      title: row.title,
      total: roadmap.sections.length,
    });

    // Retoma SO as secoes ainda vazias; as preenchidas ficam como estao.
    const pending = roadmap.sections
      .map((section, i) => ({ section, i }))
      .filter(({ section }) => !section.children || section.children.length === 0)
      .map(({ i }) => i);

    const io: SectionLoopIo = { inputChars: 0, outputChars: 0 };
    const failed = await runSections(res, userId, row.id, roadmap, context, pending, io);
    // Conclusao (sem falhas) cobra a unidade da geracao, nao cobrada antes;
    // parcial marca partial de novo e nao cobra, retomavel outra vez.
    await concludeGeneration(
      res,
      userId,
      row.id,
      roadmap,
      row.slug,
      requestId,
      io,
      failed,
    );
  } catch (err) {
    // Erro inesperado depois do lock: restaura partial para a retomada nao
    // ficar presa em generating (o que bloquearia novas retomadas por 409).
    if (lockedRowId) {
      await setStatus(lockedRowId, userId, "partial");
    }
    if (res.headersSent) {
      console.error("[roadmap-ia] erro inesperado na retomada:", err);
      // TODO(Ana): mensagem de erro inesperado na retomada.
      sseSend(res, { type: "error", message: "Erro ao retomar. Tente novamente." });
      sseDone(res);
      return;
    }
    return next(err);
  }
});

// Ids das folhas OBRIGATORIAS da arvore (exclui optional), espelhando o
// requiredLeaves do client (client/src/lib/roadmapV2/progress.ts): e essa a
// base do badge Concluido, a mesma do percentual que a view mostra.
function collectRequiredLeafIds(nodes: RoadmapNode[], into: Set<string>): void {
  for (const node of nodes) {
    if (node.optional === true) continue;
    if (node.children && node.children.length > 0) {
      collectRequiredLeafIds(node.children, into);
    } else if (node.children === undefined) {
      into.add(node.id);
    }
  }
}

// Lista os roadmaps do proprio usuario. Sem gate Pro: dado do dono (um ex-Pro
// continua vendo o que gerou). Roadmaps ready levam totalSteps (folhas
// obrigatorias do jsonb) e completedSteps (user_progress do dono, uma query
// agregada, contando SO os nodeIds que sao folhas obrigatorias do proprio
// roadmap, para opcionais/sub-passos marcados nao inflarem o badge); contagem
// best-effort, falha degrada para null.
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from("ai_roadmaps")
    .select("id, slug, title, status, roadmap, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    // TODO(Ana): mensagem de falha ao listar roadmaps.
    return next(createError(500, "list_failed", "Nao foi possivel listar seus roadmaps."));
  }
  const rows = (data ?? []) as Array<AiRoadmapListRow & { roadmap: RoadmapV2 | null }>;

  const doneIdsBySlug = new Map<string, Set<string>>();
  let progressFailed = false;
  const hasReady = rows.some((row) => row.status === "ready");
  if (hasReady) {
    const { data: progressRows, error: progressError } = await supabaseAdmin
      .from("user_progress")
      .select("item_key")
      .eq("user_id", userId)
      .eq("context", "course_progress")
      .like("item_key", "ia-%");
    if (progressError) {
      progressFailed = true;
      console.warn(
        "[roadmap-ia] contagem de progresso da lista falhou:",
        progressError.message,
      );
    } else {
      for (const row of (progressRows ?? []) as Array<{ item_key: string }>) {
        const sep = row.item_key.indexOf(":");
        if (sep <= 0) continue;
        const slug = row.item_key.slice(0, sep);
        const nodeId = row.item_key.slice(sep + 1);
        const ids = doneIdsBySlug.get(slug) ?? new Set<string>();
        ids.add(nodeId);
        doneIdsBySlug.set(slug, ids);
      }
    }
  }

  const roadmaps = rows.map(({ roadmap, ...row }) => {
    if (row.status !== "ready" || !roadmap || !Array.isArray(roadmap.sections)) {
      return { ...row, totalSteps: null, completedSteps: null };
    }
    const requiredIds = new Set<string>();
    collectRequiredLeafIds(
      roadmap.sections.flatMap((section) => section.children ?? []),
      requiredIds,
    );
    const doneIds = doneIdsBySlug.get(row.slug);
    let completed = 0;
    if (doneIds) {
      doneIds.forEach((id) => {
        if (requiredIds.has(id)) completed += 1;
      });
    }
    return {
      ...row,
      totalSteps: requiredIds.size,
      completedSteps: progressFailed ? null : completed,
    };
  });
  res.json({ roadmaps });
});

// Resumo do contexto que a geracao vai usar, para o painel do intake. Dono,
// sem gate Pro (checkProStatus so injeta req.isPro). DECLARADA antes de /:slug
// para "context" nao casar como slug. Mesmas fontes do buildGenerationContext.
router.get("/context", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const pool = await fetchUserContextPool(userId);

    const quiz =
      pool.quiz.ok && pool.quiz.data
        ? { area: pool.quiz.data.area, level: pool.quiz.data.level }
        : null;

    const skills =
      pool.skills.ok && pool.skills.data.length > 0
        ? pool.skills.data.slice(0, 8).map((s) => s.label)
        : [];

    const trails =
      pool.courses.ok && pool.courses.data.length > 0
        ? pool.courses.data.map((course) => {
            const trail = roadmapsV2.find((r) => r.slug === course.courseSlug);
            if (trail) {
              const total = countLeaves(
                trail.sections.flatMap((section) => section.children),
              );
              const pct =
                total > 0
                  ? Math.min(100, Math.round((course.completedItems / total) * 100))
                  : 0;
              return { title: trail.title, pct };
            }
            return { title: course.title ?? course.courseSlug, pct: null };
          })
        : [];

    const careerGoal =
      pool.profile.ok && pool.profile.data?.careerGoal
        ? pool.profile.data.careerGoal
        : null;

    const studyMinutes30d =
      pool.studyDiary.ok && pool.studyDiary.data.totalMinutes30d > 0
        ? pool.studyDiary.data.totalMinutes30d
        : null;

    res.json({ quiz, skills, trails, careerGoal, studyMinutes30d });
  } catch (err) {
    console.error("[roadmap-ia] contexto do intake falhou:", err);
    // TODO(Ana): mensagem de falha ao carregar o contexto do intake.
    return next(
      createError(500, "context_failed", "Nao foi possivel carregar seu contexto agora."),
    );
  }
});

// Detalhe do roadmap do dono (jsonb completo + status). Sem gate Pro. 404
// (nunca 403) quando nao existe ou nao e do usuario: nao vaza existencia.
router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const slug = req.params.slug;
  if (!AI_ROADMAP_SLUG_RE.test(slug)) {
    // TODO(Ana): mensagem de roadmap nao encontrado.
    return next(createError(404, "not_found", "Roadmap nao encontrado."));
  }
  const { data, error } = await supabaseAdmin
    .from("ai_roadmaps")
    .select("id, slug, title, status, roadmap, created_at, updated_at")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    // TODO(Ana): mensagem de falha ao carregar o roadmap.
    return next(createError(500, "load_failed", "Nao foi possivel carregar o roadmap."));
  }
  if (!data) {
    // TODO(Ana): mensagem de roadmap nao encontrado.
    return next(createError(404, "not_found", "Roadmap nao encontrado."));
  }
  res.json(data);
});

export default router;
