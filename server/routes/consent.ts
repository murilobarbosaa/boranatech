import * as Sentry from "@sentry/node";
import { Router } from "express";
import type { Request } from "express";

import {
  CONSENT_DOCUMENTS,
  consentMethodOf,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "../../shared/consent";
import { erroEncadeavel } from "../lib/supabaseError";
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

// A coluna consent_method existe no banco alvo?
//
// Duas fontes para a mesma resposta, e as duas sao necessarias: `42703` e o
// undefined_column do proprio Postgres, e `PGRST204` e o PostgREST recusando
// ANTES de chegar no banco, porque o cache de schema dele nao conhece a coluna.
// Numa migration recem-aplicada o segundo caso e o comum, e ele nao produz
// codigo de Postgres nenhum.
function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; message?: unknown };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  return (
    typeof e.message === "string" &&
    e.message.includes("consent_method") &&
    /column|schema cache/i.test(e.message)
  );
}

// Degradacao explicita, capturada de proposito. A requisicao devolve 201 e o
// usuario nao ve nada, entao sem esta captura o unico rastro seria o console do
// Railway. Mesma forma do captureUsersCountDegraded em routes/stats.ts.
function captureConsentMethodColumnMissing(userId: string): void {
  Sentry.withScope((scope) => {
    scope.setTag("route", "consent/record");
    scope.setLevel("warning");
    scope.setContext("consent_method_column_missing", {
      reason: "consent_method_column_missing",
      userId,
    });
    Sentry.captureMessage("[consent] consent_method_column_missing");
  });
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
        cause: erroEncadeavel(error),
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
    method?: unknown;
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
  // Campo de auditoria, resolvido por allowlist. Ausente ou desconhecido vira
  // NULL e a gravacao segue: o consentimento e o dado que nao pode falhar, e o
  // frontend anterior a este deploy nao envia o campo (deploy nao e atomico).
  const consentMethod = consentMethodOf(body?.method);
  const rows = [
    {
      user_id: userId,
      document: "terms",
      version: TERMS_VERSION,
      ip,
      user_agent: userAgent,
      consent_method: consentMethod,
    },
    {
      user_id: userId,
      document: "privacy",
      version: PRIVACY_VERSION,
      ip,
      user_agent: userAgent,
      consent_method: consentMethod,
    },
  ];

  // Idempotente E preservador da prova original: ON CONFLICT DO NOTHING via
  // ignoreDuplicates. O alvo do conflito e o indice unico
  // (user_id, document, version), entao reenviar o mesmo aceite nao duplica linha
  // e, principalmente, NAO reescreve o accepted_at/ip/user_agent que ficaram
  // gravados no aceite de verdade. Um upsert que ATUALIZA transformaria cada
  // reenvio (retry de rede, segundo clique) numa falsificacao silenciosa da data
  // do consentimento, que e justamente o campo que a prova existe para sustentar.
  //
  // Bump de versao nao passa por aqui: `version` faz parte da chave, entao a
  // versao nova e uma LINHA nova e o historico de versoes anteriores fica
  // intocado. Coberto por teste em consent.test.ts.
  const UPSERT_OPTIONS = {
    onConflict: "user_id,document,version",
    ignoreDuplicates: true,
  };

  let { error } = await supabaseAdmin
    .from("user_consents")
    .upsert(rows, UPSERT_OPTIONS);

  // Defesa em profundidade contra a ordem de deploy errada.
  //
  // A ordem correta e migration aditiva PRIMEIRO, codigo depois (a coluna nova e
  // ignorada pelo codigo antigo, entao nao ha janela de incompatibilidade nesse
  // sentido). Mas se alguem inverter, o codigo novo manda `consent_method` para
  // uma coluna que nao existe, o PostgREST recusa o corpo inteiro e TODA gravacao
  // de consentimento falha. Consentimento e prova legal: nao pode ser perdido por
  // causa de um campo de auditoria.
  //
  // Entao regravamos sem o campo acessorio e mantemos a linha. O que se perde e o
  // `consent_method` daquelas linhas (fica NULL, que ja e o valor definido para
  // "nao sabemos por qual caminho veio"), e nao a prova.
  if (error && isMissingColumnError(error)) {
    console.warn(
      `[consent] coluna consent_method ausente; regravando sem ela user=${userId}`,
    );
    captureConsentMethodColumnMissing(userId);
    const semMetodo = rows.map(({ consent_method: _ignorado, ...resto }) => resto);
    ({ error } = await supabaseAdmin
      .from("user_consents")
      .upsert(semMetodo, UPSERT_OPTIONS));
  }

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

  // O corpo carrega o estado RESULTANTE, lido do banco depois da escrita.
  //
  // Isto e o que mata a corrida: antes, a resposta era um `true` fixo e o cliente
  // precisava de um SEGUNDO round trip (GET /status) para saber onde tinha ficado,
  // e era esse segundo request que chegava antes da escrita ficar visivel e fazia
  // o gate pedir aceite a quem tinha acabado de aceitar (50 casos medidos, todos
  // com menos de 5s entre a gravacao e o pedido). Uma resposta que responde a
  // pergunta nao precisa ser conferida.
  let hasConsented: boolean;
  try {
    hasConsented = await hasCurrentConsent(userId);
  } catch (err) {
    // A escrita PASSOU e a releitura falhou. Codigo distinto de propriedade
    // (`consent_write_failed` seria mentira) para o log separar "nao gravou" de
    // "gravou e nao conseguiu confirmar". O cliente repete, e repetir e seguro
    // porque o upsert acima e idempotente.
    console.error(`[consent] releitura pos-escrita falhou user=${userId}`, err);
    return next(
      createError(
        500,
        "consent_readback_failed",
        // TODO(Ana): mensagem de erro do backend quando a confirmacao falha.
        "Não foi possível confirmar o registro do consentimento. Tente novamente.",
      ),
    );
  }

  res.status(201).json({
    hasConsented,
    terms: TERMS_VERSION,
    privacy: PRIVACY_VERSION,
  });
});

export default router;
