// Certificados (C1, fase 2A): elegibilidade, emissao, lista do usuario e
// verificacao publica por code.
//
// O GET de elegibilidade NAO e mais 403 pra free: devolve status pro_required
// (a pessoa ve o certificado que conquistou e o upgrade, no momento de maior
// motivacao). O gate Pro DE VERDADE (403) fica so no POST de emissao.
import { Router } from "express";

import {
  getCertificateByCode,
  getCertificateEligibility,
  issueCertificate,
} from "../lib/certificates";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Elegibilidade: sempre 200. isPro vira parametro (status pro_required), nunca
// erro. userId SEMPRE do JWT.
router.get("/eligibility/:slug", async (req, res, next) => {
  try {
    const eligibility = await getCertificateEligibility(
      req.user!.id,
      req.params.slug,
      req.isPro === true,
    );
    res.json({ data: eligibility });
  } catch (err) {
    next(err);
  }
});

// Emissao: gate Pro REAL. Body ignorado por completo (nada dele e lido); a
// funcao reavalia tudo server-side.
router.post("/issue/:slug", async (req, res, next) => {
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

    const result = await issueCertificate(req.user!.id, req.params.slug, true);
    if (result.ok) {
      return res.status(201).json({ data: { code: result.code } });
    }
    res.status(409).json({ data: { reason: result.reason } });
  } catch (err) {
    next(err);
  }
});

// Lista os certificados do proprio usuario. userId SEMPRE do JWT.
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("certificates")
      .select("code, roadmap_slug, roadmap_title, hours, issued_at")
      .eq("user_id", req.user!.id)
      .order("issued_at", { ascending: false });
    if (error) {
      return next(createError(500, "db_error", "Erro ao listar certificados."));
    }
    res.json({
      data: (data ?? []).map((row) => ({
        code: row.code,
        roadmapSlug: row.roadmap_slug,
        roadmapTitle: row.roadmap_title,
        hours: row.hours,
        issuedAt: row.issued_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Router PUBLICO e separado: sem requireAuth, montado ANTES do
// validateSupabaseJwt (verificacao publica nao tem sessao). O rate limit global
// por IP do app.ts ja cobre /api/* (nao esta na allowlist de isencao).
export const publicCertificatesRouter = Router();

publicCertificatesRouter.get("/:code", async (req, res, next) => {
  try {
    const certificate = await getCertificateByCode(req.params.code);
    if (!certificate) {
      return next(
        createError(404, "not_found", "Certificado não encontrado."),
      );
    }
    // Revogado retorna 200 com revoked: true (a pagina diz "revogado", nao
    // "nao existe").
    res.json({ data: certificate });
  } catch (err) {
    next(err);
  }
});

export default router;
