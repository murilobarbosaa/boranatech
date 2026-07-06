import { NextFunction, Request, Response, Router } from "express";

import {
  deleteConversation,
  getConversation,
  listConversations,
} from "../lib/agent/conversationStore";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

// Endpoints do historico de conversas. Montado em /api/agent/conversations.
// requireAuth em tudo; checkProStatus resolve req.isPro (o gate de Pro fica nos
// handlers de leitura). Identidade SO de req.user.id, nunca do corpo nem da query.
const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Formato uuid v4-ish; id malformado nao chega ao banco.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/agent/conversations -> listar. Beneficio Pro.
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  if (req.isPro !== true) {
    // TODO(Ana): mensagem de recurso Pro.
    return next(createError(403, "forbidden", "O historico de conversas e do Plano Pro."));
  }

  const result = await listConversations(userId);
  if (!result.ok) {
    // TODO(Ana): mensagem de falha ao listar.
    return next(createError(500, "db_error", "Nao foi possivel carregar suas conversas."));
  }

  res.json({ data: result.data });
});

// GET /api/agent/conversations/:id -> ler uma. Beneficio Pro.
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id;

  if (!UUID_RE.test(id)) {
    // TODO(Ana): mensagem de identificador invalido.
    return next(createError(400, "invalid_request", "Identificador de conversa invalido."));
  }
  if (req.isPro !== true) {
    // TODO(Ana): mensagem de recurso Pro.
    return next(createError(403, "forbidden", "O historico de conversas e do Plano Pro."));
  }

  const result = await getConversation(userId, id);
  if (!result.ok) {
    // TODO(Ana): mensagem de falha ao carregar.
    return next(createError(500, "db_error", "Nao foi possivel carregar a conversa."));
  }
  if (!result.data) {
    // 404 nao distingue "nao existe" de "nao e sua", para nao vazar existencia.
    // TODO(Ana): mensagem de conversa nao encontrada.
    return next(createError(404, "not_found", "Conversa nao encontrada."));
  }

  res.json({ data: result.data });
});

// DELETE /api/agent/conversations/:id -> apagar. SO requireAuth (obrigacao de
// exclusao vale para qualquer dono, Pro ou nao); SEM gate de Pro.
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id;

  if (!UUID_RE.test(id)) {
    // TODO(Ana): mensagem de identificador invalido.
    return next(createError(400, "invalid_request", "Identificador de conversa invalido."));
  }

  const result = await deleteConversation(userId, id);
  if (!result.ok) {
    // TODO(Ana): mensagem de falha ao apagar.
    return next(createError(500, "db_error", "Nao foi possivel apagar a conversa."));
  }
  if (!result.data.deleted) {
    // TODO(Ana): mensagem de conversa nao encontrada.
    return next(createError(404, "not_found", "Conversa nao encontrada."));
  }

  res.json({ ok: true });
});

export default router;
