import { Router } from "express";

import {
  montarPainelDoCreator,
  parseJanelaDoPainel,
} from "../lib/creatorDashboard";
import { montarDbError } from "../lib/dbError";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import {
  requireCreator,
  resolverCreatorKind,
} from "../middleware/requireCreator";

const router = Router();

router.use(requireAuth);

// Status de creator do usuario logado. So requireAuth, NAO requireCreator: e o
// que o header usa para decidir se mostra o botao "Creator", entao responde
// para qualquer usuario autenticado, creator ou nao.
//
// Erro de consulta vira 503 `creator_status_unavailable`, NUNCA `kind: null`:
// null quer dizer "nao e creator", e devolve-lo por falha de infraestrutura
// esconderia o botao de um creator como se ele nao fosse um.
router.get("/status", async (req, res, next) => {
  try {
    const kind = await resolverCreatorKind(req.user!.id);
    res.json({ kind });
  } catch (err) {
    return next(
      createError(
        503,
        "creator_status_unavailable",
        // TODO(Ana)
        "Não foi possível verificar seu acesso de creator agora.",
        { cause: err, context: { op: "creator status" } },
      ),
    );
  }
});

// Painel do proprio creator. requireCreator aqui, e nao no router inteiro,
// porque /status acima responde para qualquer usuario autenticado.
router.get("/me", requireCreator, async (req, res, next) => {
  const janela = parseJanelaDoPainel(req.query.janela);
  if (!janela) {
    return next(
      createError(
        400,
        "invalid_janela",
        // TODO(Ana)
        "Janela inválida. Use 7d, 30d, 90d ou all.",
      ),
    );
  }
  try {
    const resultado = await montarPainelDoCreator(
      req.user!.id,
      janela,
      "creator",
    );
    // A guarda acabou de confirmar a concessao; chegar aqui sem ela e revogacao
    // entre a guarda e a leitura (ou cache de ate 60s). O painel nao abre.
    if (!resultado.ok) {
      return next(
        createError(
          403,
          "not_creator",
          // TODO(Ana)
          "Acesso de creator necessário.",
        ),
      );
    }
    res.json({ data: resultado.painel });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "painel do creator",
        err,
        // TODO(Ana)
        "Erro ao carregar o painel.",
      ),
    );
  }
});

export default router;
