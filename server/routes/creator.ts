import { Router } from "express";

import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { resolverCreatorKind } from "../middleware/requireCreator";

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

export default router;
