import { Router } from "express";
import type { Request } from "express";

import {
  CONSENT_DOCUMENTS,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "../../shared/consent";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

// IP de origem: respeita o primeiro salto de x-forwarded-for (Vercel/Railway
// ficam na frente), com fallback para o socket. Coluna inet aceita null.
function clientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (raw) {
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? null;
}

function clientUserAgent(req: Request): string | null {
  const ua = req.headers["user-agent"];
  if (Array.isArray(ua)) return ua[0] ?? null;
  return ua ?? null;
}

// Fail-closed de NEGOCIO: retorna true SOMENTE se existir linha para terms na
// TERMS_VERSION atual E para privacy na PRIVACY_VERSION atual. Ausencia de linha
// = false (nao consentiu). Mas falha de INFRA (query ao Supabase) NAO vira
// false: propaga como erro para o /status responder 5xx, em vez de mascarar como
// "nao consentiu" e empurrar o gate a pedir aceite de quem ja consentiu. Sempre
// filtra por user_id.
export async function hasCurrentConsent(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_consents")
    .select("document, version")
    .eq("user_id", userId)
    .in("document", [...CONSENT_DOCUMENTS]);
  if (error) {
    console.error(`[consent] status query falhou user=${userId}`, error);
    throw createError(
      500,
      "consent_read_failed",
      "Erro ao verificar consentimento.",
      {
        cause: error,
        context: { op: "status", userId, pgCode: error.code },
      },
    );
  }
  const rows = (data ?? []) as Array<{ document: string; version: string }>;
  const hasTerms = rows.some(
    (row) => row.document === "terms" && row.version === TERMS_VERSION,
  );
  const hasPrivacy = rows.some(
    (row) => row.document === "privacy" && row.version === PRIVACY_VERSION,
  );
  return hasTerms && hasPrivacy;
}

router.get("/status", async (req, res, next) => {
  try {
    const hasConsented = await hasCurrentConsent(req.user!.id);
    res.json({ hasConsented });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const body = req.body as {
    acceptedTerms?: unknown;
    acceptedPrivacy?: unknown;
  };
  const acceptedTerms = body?.acceptedTerms === true;
  const acceptedPrivacy = body?.acceptedPrivacy === true;

  if (!acceptedTerms || !acceptedPrivacy) {
    return next(
      createError(
        400,
        "consent_required",
        // TODO(Ana): mensagem de erro do backend quando falta aceite.
        "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
      ),
    );
  }

  const userId = req.user!.id;
  const ip = clientIp(req);
  const userAgent = clientUserAgent(req);
  const rows = [
    {
      user_id: userId,
      document: "terms",
      version: TERMS_VERSION,
      ip,
      user_agent: userAgent,
    },
    {
      user_id: userId,
      document: "privacy",
      version: PRIVACY_VERSION,
      ip,
      user_agent: userAgent,
    },
  ];

  // Idempotente: reenviar o mesmo aceite nao duplica prova nem estoura erro.
  const { error } = await supabaseAdmin.from("user_consents").upsert(rows, {
    onConflict: "user_id,document,version",
    ignoreDuplicates: true,
  });

  if (error) {
    return next(
      createError(
        500,
        "consent_write_failed",
        // TODO(Ana): mensagem de erro do backend quando a gravacao falha.
        "Não foi possível registrar o consentimento. Tente novamente.",
      ),
    );
  }

  res.status(201).json({ hasConsented: true });
});

export default router;
