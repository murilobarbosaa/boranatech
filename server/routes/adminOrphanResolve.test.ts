import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FIACAO das rotas de pagamento orfao do admin.
 *
 * O caso central aqui NAO e o caminho feliz: e a AUDITORIA FALHANDO. A rota
 * grava numa tabela que e a unica memoria de por que um pagamento foi tratado, e
 * a regra da casa e que ausencia de rastro IMPEDE a escrita. Um teste que so
 * exercitasse o sucesso deixaria passar a inversao da ordem (gravar primeiro,
 * auditar depois), que e silenciosa e so aparece no dia em que a auditoria cai.
 *
 * O router REAL roda dentro de um Express REAL, com o errorHandler de producao.
 * Dubles: Supabase, Redis, Stripe, Auth. As guardas sao mockadas aqui de
 * proposito; quem as verifica e adminUsersGuards.test.ts, que nao as mocka.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
}));

vi.mock("../lib/queue", () => ({
  emailQueue: null,
  enqueueEmail: vi.fn(),
  createEmailWorker: vi.fn(),
}));
vi.mock("../lib/redis", () => ({
  queueConnection: null,
  cacheConnection: null,
}));
vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
    stripePriceIds: {
      pro_monthly: "price_m",
      pro_semiannual: "price_s",
      pro_annual: "price_a",
    },
    stripeWebhookSecret: "whsec_x",
    appUrl: "https://exemplo.com",
    stripeSecretKey: "sk_test_x",
    billingEnabled: false,
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100000,
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../lib/stripeClient", () => ({
  getStripe: () => ({}),
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));
vi.mock("../lib/proStatusCache", () => ({
  invalidateProStatusCache: vi.fn(),
  getCachedProStatus: async () => null,
  setCachedProStatus: async () => {},
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { id: ADMIN_ID, email: "admin@x.com", role: "authenticated" };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
  requirePro: (_req: unknown, _res: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  resolveProStatus: async () => false,
  isDevProUser: () => false,
}));

import {
  criarSupabaseDouble,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import adminRouter from "./admin";
import { criarClienteAdmin } from "./adminTestClient";

const chamarAdmin = criarClienteAdmin(adminRouter);

const ADMIN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORFAO_ID = "11111111-2222-3333-4444-555555555555";
const NOTA_VALIDA = "Reembolso integral emitido na Stripe hoje.";

function linhaAberta(over: Record<string, unknown> = {}) {
  return {
    id: ORFAO_ID,
    stripe_session_id: "cs_live_abc",
    customer_email: "pessoa@exemplo.com",
    plan_id: "pro_monthly",
    amount_total_cents: 2990,
    currency: "brl",
    detected_at: "2026-08-14T05:52:27.955Z",
    last_seen_at: "2026-08-29T05:00:00.000Z",
    expected_provider_subscription_id: "sub_1",
    resolved_at: null,
    resolution_note: null,
    ...over,
  };
}

/** Monta o duble com a linha pedida e a auditoria opcionalmente quebrada. */
function montar(opts: {
  linha?: Record<string, unknown> | null;
  auditoriaFalha?: boolean;
}) {
  const respostas: Record<string, RespostaTabela | (() => RespostaTabela)> = {
    billing_orphan_payments: {
      rows: opts.linha === null ? [] : [opts.linha ?? linhaAberta()],
      error: null,
    },
    content_audit_logs: opts.auditoriaFalha
      ? { error: { message: "audit indisponivel" } }
      : { rows: [] },
  };
  estado.double = criarSupabaseDouble(respostas);
}

beforeEach(() => {
  montar({});
});

describe("GET /billing/orphan-payments", () => {
  it("lista as abertas, mais antiga primeiro", async () => {
    const r = await chamarAdmin("GET", "/billing/orphan-payments");

    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    expect(r.body.data[0].stripe_session_id).toBe("cs_live_abc");

    const consulta = estado.double.de("billing_orphan_payments")[0];
    // O filtro E a lista: sem ele a tela mostraria as ja resolvidas.
    expect(
      consulta.filtros.some(
        (f) => f.tipo === "is" && f.coluna === "resolved_at",
      ),
    ).toBe(true);
    // Ordem afirmada: quem espera ha mais tempo vem antes.
    expect(consulta.ordem).toContain("detected_at");
  });
});

describe("POST resolve: as guardas de entrada", () => {
  it("id que nao e uuid vira 400, sem tocar o banco", async () => {
    const r = await chamarAdmin("POST", "/billing/orphan-payments/xx/resolve", {
      confirmed: true,
      note: NOTA_VALIDA,
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_id");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("confirmed AUSENTE recusa", async () => {
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { note: NOTA_VALIDA },
    );
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("confirmation_required");
  });

  it('confirmed como STRING "true" recusa (a coercao e o defeito)', async () => {
    // `if (corpo.confirmed)` aceitaria isto, e um corpo malformado viraria uma
    // confirmacao que ninguem deu.
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: "true", note: NOTA_VALIDA },
    );
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("confirmation_required");
    expect(estado.double.chamadas).toHaveLength(0);
  });

  it("nota curta recusa, e a mensagem diz o minimo", async () => {
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: "ok" },
    );
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("note_required");
    expect(String(r.body.error.message)).toContain("20");
  });

  it("nota que so tem espacos recusa (o trim e antes da contagem)", async () => {
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: "                              " },
    );
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("note_required");
  });
});

describe("POST resolve: o estado vem do banco, nao do cliente", () => {
  it("linha inexistente vira 404", async () => {
    montar({ linha: null });
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: NOTA_VALIDA },
    );
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("not_found");
  });

  it("linha JA resolvida vira 409, e nao grava por cima", async () => {
    montar({
      linha: linhaAberta({
        resolved_at: "2026-08-29T10:00:00.000Z",
        resolution_note: "ja tratei",
      }),
    });
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: NOTA_VALIDA },
    );
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("already_resolved");
    expect(
      estado.double.chamadas.filter((c) => c.op === "update"),
    ).toHaveLength(0);
  });
});

describe("POST resolve: auditoria fail-closed (o caso central)", () => {
  it("auditoria falhando NAO grava a resolucao", async () => {
    montar({ auditoriaFalha: true });

    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: NOTA_VALIDA },
    );

    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("audit_failed");
    // A assercao que importa: nenhum update chegou ao banco.
    expect(
      estado.double.chamadas.filter(
        (c) => c.table === "billing_orphan_payments" && c.op === "update",
      ),
    ).toHaveLength(0);
  });

  it("a auditoria vem ANTES da escrita, e nao depois", async () => {
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: NOTA_VALIDA },
    );
    expect(r.status).toBe(200);

    const ordem = estado.double.chamadas.map((c) => `${c.table}:${c.op}`);
    const iAudit = ordem.indexOf("content_audit_logs:insert");
    const iUpdate = ordem.indexOf("billing_orphan_payments:update");
    expect(iAudit).toBeGreaterThanOrEqual(0);
    expect(iUpdate).toBeGreaterThanOrEqual(0);
    // Sem isto, inverter a ordem passaria: os dois aconteceriam no caminho feliz.
    expect(iAudit).toBeLessThan(iUpdate);
  });
});

describe("CONTROLE NEGATIVO: o caminho feliz grava o que promete", () => {
  it("carimba resolved_at e a nota COM a marca de proveniencia", async () => {
    const r = await chamarAdmin(
      "POST",
      `/billing/orphan-payments/${ORFAO_ID}/resolve`,
      { confirmed: true, note: `  ${NOTA_VALIDA}  ` },
    );

    expect(r.status).toBe(200);
    expect(r.body.data.id).toBe(ORFAO_ID);

    const update = estado.double.chamadas.find(
      (c) => c.table === "billing_orphan_payments" && c.op === "update",
    );
    expect(update).toBeTruthy();
    const payload = update!.payload as {
      resolved_at: string;
      resolution_note: string;
    };
    expect(payload.resolved_at).toBeTruthy();
    // O texto do admin sobrevive, sem os espacos das pontas.
    expect(payload.resolution_note).toContain(NOTA_VALIDA);
    expect(payload.resolution_note.startsWith(" ")).toBe(false);
    // E a nota diz sozinha quem resolveu, para quem ler so a tabela no SQL
    // Editor (que e como as duas notas existentes foram escritas).
    expect(payload.resolution_note).toContain(ADMIN_ID);

    // A trava atomica: o update ainda filtra por resolved_at nulo, porque entre
    // a leitura e a escrita cabe outro admin.
    expect(
      update!.filtros.some(
        (f) => f.tipo === "is" && f.coluna === "resolved_at",
      ),
    ).toBe(true);
  });

  it("a auditoria registra ator, recurso e o antes e depois", async () => {
    await chamarAdmin("POST", `/billing/orphan-payments/${ORFAO_ID}/resolve`, {
      confirmed: true,
      note: NOTA_VALIDA,
    });

    const audit = estado.double.chamadas.find(
      (c) => c.table === "content_audit_logs" && c.op === "insert",
    );
    expect(audit).toBeTruthy();
    const p = audit!.payload as Record<string, unknown>;
    expect(p.actor_user_id).toBe(ADMIN_ID);
    expect(p.action).toBe("billing_orphan_resolve");
    expect(p.resource_id).toBe(ORFAO_ID);
    expect((p.before_json as Record<string, unknown>).resolved_at).toBeNull();
    expect((p.after_json as Record<string, unknown>).verified_by_system).toBe(
      false,
    );
  });
});
