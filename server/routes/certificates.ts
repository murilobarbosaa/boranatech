// Certificados (C1, fase 2A): elegibilidade, emissao, lista do usuario e
// verificacao publica por code.
//
// O GET de elegibilidade NAO e mais 403 pra free: devolve status pro_required
// (a pessoa ve o certificado que conquistou e o upgrade, no momento de maior
// motivacao). O gate Pro DE VERDADE (403) fica so no POST de emissao.
import { Router } from "express";

import type { Request, Response, NextFunction } from "express";

import { renderCertificatePdf, renderCertificatePng } from "../lib/certificatePdf";
import {
  renderCertificateScreenSvg,
  renderCertificateSvg,
} from "../lib/certificateRender";
import {
  getCertificateByCode,
  getCertificateEligibility,
  getCertificateRecordForOwner,
  getCertificateStatuses,
  issueCertificate,
} from "../lib/certificates";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

// Rate limit dedicado das rotas de download (geram Chromium, sao caras). Janela
// fixa por USUARIO, em memoria: minimo defensivo, nao entitlement. Sweep
// oportunista quando o mapa cresce, para nao vazar chaves de usuarios inativos.
const DOWNLOAD_WINDOW_MS = 60_000;
const DOWNLOAD_MAX_PER_WINDOW = 10;
const DOWNLOAD_STORE_CAP = 10_000;
const downloadHits = new Map<string, { count: number; resetAt: number }>();

function downloadRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = downloadHits.get(userId);
  if (!entry || entry.resetAt <= now) {
    if (downloadHits.size > DOWNLOAD_STORE_CAP) {
      downloadHits.forEach((value, key) => {
        if (value.resetAt <= now) downloadHits.delete(key);
      });
    }
    downloadHits.set(userId, { count: 1, resetAt: now + DOWNLOAD_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > DOWNLOAD_MAX_PER_WINDOW;
}

// Sanitiza o code para nome de arquivo: so o alfabeto do code normalizado.
function safeCodeForFilename(code: string): string {
  return code.replace(/[^A-Za-z0-9_-]/g, "");
}

type DownloadFormat = "pdf" | "image";

// Download DONO-SO. A trava real de posse e server-side: esconder o botao no
// client nao basta. Ordem: rate limit -> existe? -> e do dono? -> revogado? ->
// gera. Qualquer falha do Chromium vira 503 tratado (nunca stacktrace); a
// visualizacao publica do certificado nao depende disto.
async function handleDownload(
  format: DownloadFormat,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user!.id;
  if (downloadRateLimited(userId)) {
    return next(
      createError(
        429,
        "rate_limited",
        "Muitos downloads seguidos. Aguarde um minuto e tente de novo.",
      ),
    );
  }

  const record = await getCertificateRecordForOwner(req.params.code);
  if (!record) {
    return next(createError(404, "not_found", "Certificado não encontrado."));
  }
  // 403, nao 404 generico: o dono e conhecido e nao e o requisitante.
  if (record.userId !== userId) {
    return next(
      createError(403, "forbidden", "Este certificado não pertence a você."),
    );
  }
  // Revogado: bloqueia o download (nao gera arquivo de um certificado invalido).
  if (record.revoked) {
    return next(
      createError(409, "revoked", "Certificado revogado. Download indisponível."),
    );
  }

  try {
    const svg = await renderCertificateSvg(record.data);
    const safeCode = safeCodeForFilename(record.data.code);
    if (format === "pdf") {
      const pdf = await renderCertificatePdf(svg);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="certificado-${safeCode}.pdf"`,
      );
      res.setHeader("Cache-Control", "private, no-store");
      res.send(pdf);
      return;
    }
    const png = await renderCertificatePng(svg);
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificado-${safeCode}.png"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.send(png);
  } catch (err) {
    // Chromium nao iniciou/gerou (provavel no primeiro deploy Railway ate
    // validar). Erro tratado, nunca 500 feio; a pagina publica segue intacta.
    console.error("[certificates] download generation failed:", err);
    return next(
      createError(
        503,
        "generation_unavailable",
        "Não foi possível gerar o arquivo agora. Tente mais tarde.",
      ),
    );
  }
}

// DONO-SO, com login (requireAuth ja aplicado). ANTES do checkProStatus: baixar
// um certificado ja emitido nao deve exigir assinatura Pro ativa (a pessoa era
// Pro quando emitiu).
router.get("/:code/pdf", (req, res, next) => {
  void handleDownload("pdf", req, res, next);
});
router.get("/:code/image", (req, res, next) => {
  void handleDownload("image", req, res, next);
});

// Status por trilha pro selo da vitrine. Declarada ANTES do checkProStatus de
// proposito: o selo nao e recurso Pro, entao nao paga a latencia do cache+RPC
// de Pro. userId SEMPRE do JWT.
router.get("/status", async (req, res, next) => {
  try {
    const statuses = await getCertificateStatuses(req.user!.id);
    res.json({ data: statuses });
  } catch (err) {
    next(err);
  }
});

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

// SVG bonito do certificado para a pagina EXIBIR (versao de TELA, LEVE: sem as
// fontes base64 embutidas). A pagina renderiza inline e carrega Outfit/Bricolage
// via @font-face, entao fica identico ao PDF mas ~55% menor no fio. Deriva do
// snapshot congelado; NAO expoe user_id nem CPF (o design nem tem CPF). Revogado
// TAMBEM serve o SVG: a pagina marca o estado, nao bloqueia aqui. Coberto pelo
// rate limit global de /api/*. NAO confundir com o SVG do PDF/PNG (embutido).
publicCertificatesRouter.get("/:code/svg", async (req, res, next) => {
  try {
    const certificate = await getCertificateByCode(req.params.code);
    if (!certificate) {
      return next(
        createError(404, "not_found", "Certificado não encontrado."),
      );
    }
    const svg = await renderCertificateScreenSvg({
      holderName: certificate.holderName,
      roadmapTitle: certificate.roadmapTitle,
      hours: certificate.hours,
      issuedAt: certificate.issuedAt,
      code: certificate.code,
    });
    // Deriva de snapshot imutavel: cacheavel por alguns minutos (alivia a
    // renderizacao repetida do SVG na verificacao publica).
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(svg);
  } catch (err) {
    next(err);
  }
});

export default router;
