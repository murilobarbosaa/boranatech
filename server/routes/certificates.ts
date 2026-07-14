// Certificados (C1). Nesta fase, so a consulta de elegibilidade: a UI usa o
// retorno pra mostrar carga horaria e o que falta ANTES de qualquer emissao
// (POST fica pra fase 2). Gate Pro explicito: descoberta e gratis, o
// certificado e Pro.
import { Router } from "express";

import { getCertificateEligibility } from "../lib/certificates";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

router.get("/eligibility/:slug", async (req, res, next) => {
  try {
    if (req.isPro !== true) {
      return next(
        // TODO(Ana): revisar copy da mensagem de gate Pro do certificado.
        createError(
          403,
          "forbidden",
          "Recurso Pro. Assine o Plano Pro para emitir seu certificado.",
        ),
      );
    }

    // userId SEMPRE do JWT, nunca do param/body.
    const eligibility = await getCertificateEligibility(
      req.user!.id,
      req.params.slug,
    );
    res.json({ data: eligibility });
  } catch (err) {
    next(err);
  }
});

export default router;
