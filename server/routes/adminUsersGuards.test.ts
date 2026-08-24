import { describe, expect, it, vi } from "vitest";

/**
 * GUARDA DE AUTORIZAÇÃO das rotas do admin.
 *
 * Nada verificava que as rotas novas estão de fato atrás de requireAuth +
 * requireAdmin. Uma rota montada fora da guarda não quebra nada, não aparece em
 * teste nenhum, e expõe dado de usuário para qualquer autenticado.
 *
 * A lista de rotas é DERIVADA do router, não escrita à mão: rota futura entra
 * na verificação sozinha. Lista à mão é o caso degenerado do parser que
 * sub-casa em silêncio, e este projeto já tem uma coleção deles documentada.
 */

// O router real importa BullMQ/ioredis (que abrem conexão) e o middleware de
// auth (que monta o JWKS no load e falha sem .env). Estes mocks existem para o
// MÓDULO carregar; as guardas em si NÃO são mockadas: são elas que o arquivo
// verifica.
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
    stripeSecretKey: "",
    billingEnabled: false,
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHost: "https://us.posthog.com",
    rateLimitMaxRequests: 1000,
    refundMaxPerMinute: 100000,
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({}),
    auth: { admin: {} },
    rpc: async () => ({}),
  },
}));

import adminRouter from "./admin";
import { requireAdmin, requireAuth } from "../middleware/auth";

type Camada = {
  name?: string;
  handle?: unknown;
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: unknown }>;
  };
};

const stack = (adminRouter as unknown as { stack: Camada[] }).stack;

/**
 * Total de rotas declaradas no router do admin.
 *
 * 52 desde `GET /subscription-history` (fatia 3 da Visão). Mudar este número é
 * ato deliberado, no commit da rota que o muda.
 */
// 55 -> 56 em 2026-08-14, com a rota `GET /admin/attention` (painel "Atenção
// necessária"). 56 -> 57 na mesma data, com `GET /admin/overview-series` (séries
// diárias, funil e uso por ferramenta da Fase 4). Subir este número é ato
// deliberado: quem acrescenta rota confere antes que ela está atrás de
// `requireAuth` + `requireAdmin`, e as duas novas estão — o router monta as
// guardas no topo e as rotas entram depois, o que os dois testes acima verificam
// por posição. 57 -> 58 em 2026-08-17, com `GET /admin/online-now` (presença do
// card "Atividade agora" da Visão); ela entra depois dos dois `router.use` do
// topo, como as anteriores, e este arquivo é quem confere isso. 58 -> 59 em
// 2026-08-22, com `GET /admin/ai-cost-per-user` (a tabela de custo de IA por
// usuário, que aposentou um placeholder cuja copy prometia dados "após 30 dias"
// enquanto eles existiam havia mais de cem). Ela é declarada na seção de rotas
// de IA, depois dos dois `router.use` do topo, e os dois testes acima conferem
// isso por posição. A rota expõe e-mail de pessoa: estar atrás de
// `requireAuth` + `requireAdmin` não é detalhe aqui, é o requisito.
const EXPECTED_ROUTE_COUNT = 60;

/** Middlewares montados no router ANTES de qualquer rota (router.use no topo). */
function guardasDoRouter(): unknown[] {
  const guardas: unknown[] = [];
  for (const camada of stack) {
    if (camada.route) break; // a primeira rota encerra o bloco de guardas
    if (camada.handle) guardas.push(camada.handle);
  }
  return guardas;
}

function rotasDeclaradas(): Array<{ metodo: string; caminho: string }> {
  const saida: Array<{ metodo: string; caminho: string }> = [];
  for (const camada of stack) {
    if (!camada.route) continue;
    for (const metodo of Object.keys(camada.route.methods)) {
      saida.push({ metodo: metodo.toUpperCase(), caminho: camada.route.path });
    }
  }
  return saida;
}

describe("todas as rotas do admin estão atrás das duas guardas", () => {
  it("requireAuth e requireAdmin são montados ANTES da primeira rota", () => {
    const guardas = guardasDoRouter();
    expect(guardas).toContain(requireAuth);
    expect(guardas).toContain(requireAdmin);
  });

  it("nenhuma rota é declarada antes das guardas", () => {
    // A ordem importa: um router.get colocado acima do router.use ficaria
    // FORA da proteção sem nada acusar.
    const indiceRequireAuth = stack.findIndex((c) => c.handle === requireAuth);
    const indiceRequireAdmin = stack.findIndex(
      (c) => c.handle === requireAdmin,
    );
    const indicePrimeiraRota = stack.findIndex((c) => Boolean(c.route));

    expect(indiceRequireAuth).toBeGreaterThanOrEqual(0);
    expect(indiceRequireAdmin).toBeGreaterThanOrEqual(0);
    expect(indicePrimeiraRota).toBeGreaterThan(indiceRequireAuth);
    expect(indicePrimeiraRota).toBeGreaterThan(indiceRequireAdmin);
  });

  it("o TOTAL de rotas do router é afirmado, não só o piso", () => {
    // `toBeGreaterThan(30)` era um PISO, e piso não é asserção de total: uma
    // rota nova fora de /users passava sem que nada quebrasse, e a checagem de
    // que ela está atrás das guardas nunca era exercitada por ninguém. É a
    // mesma fraqueza que o CLAUDE.md descreve ("os N que eu conheço estão lá"
    // contra "existem exatamente N").
    //
    // Com o total afirmado, TODA rota nova do admin derruba este teste, e quem a
    // adicionou precisa olhar para as guardas antes de subir o número. Alterar
    // este valor é ato deliberado, no mesmo commit da rota.
    expect(rotasDeclaradas()).toHaveLength(EXPECTED_ROUTE_COUNT);
  });

  it("as rotas de usuário estão todas na lista derivada do router", () => {
    const rotas = rotasDeclaradas();

    const deUsuario = rotas
      .filter((r) => r.caminho.startsWith("/users"))
      .map((r) => `${r.metodo} ${r.caminho}`)
      .sort();

    expect(deUsuario).toEqual([
      "GET /users",
      "GET /users/:id",
      "GET /users/:id/activity",
      "GET /users/:id/audit",
      "GET /users/:id/email-usage",
      "GET /users/:id/site-life",
      "GET /users/:id/transactions",
      "PATCH /users/:id",
      "POST /users/:id/email",
      "POST /users/:id/external-refunds",
      "POST /users/:id/influencer",
      "POST /users/:id/influencer/revoke",
      "POST /users/:id/refunds",
      "POST /users/:id/reveal-cpf",
      "POST /users/:id/subscription/cancel",
      "POST /users/:id/subscription/revoke",
    ]);
  });
});

describe("as guardas em si recusam quem não deve passar", () => {
  function chamar(
    guarda: (req: never, res: never, next: (e?: unknown) => void) => unknown,
    req: Record<string, unknown>,
  ) {
    return new Promise<{ status?: number; code?: string }>((resolve) => {
      void (
        guarda as unknown as (
          r: unknown,
          s: unknown,
          n: (e?: unknown) => void,
        ) => unknown
      )(req, {}, (err?: unknown) => {
        if (!err) return resolve({});
        const e = err as { statusCode?: number; code?: string };
        resolve({ status: e.statusCode, code: e.code });
      });
    });
  }

  it("sem token: requireAuth devolve 401", async () => {
    expect(await chamar(requireAuth, {})).toEqual({
      status: 401,
      code: "unauthorized",
    });
  });

  it("com token: requireAuth deixa passar", async () => {
    expect(await chamar(requireAuth, { user: { id: "u1" } })).toEqual({});
  });

  it("sem token: requireAdmin devolve 401 antes de consultar o banco", async () => {
    expect(await chamar(requireAdmin, {})).toEqual({
      status: 401,
      code: "unauthorized",
    });
  });

  it("token de NÃO-admin: requireAdmin devolve 403", async () => {
    const { supabaseAdmin } = await import("../lib/supabaseAdmin");
    (supabaseAdmin as unknown as { rpc: unknown }).rpc = async () => ({
      data: false,
      error: null,
    });

    expect(await chamar(requireAdmin, { user: { id: "u1" } })).toEqual({
      status: 403,
      code: "forbidden",
    });
  });

  it("token de admin: requireAdmin deixa passar", async () => {
    const { supabaseAdmin } = await import("../lib/supabaseAdmin");
    (supabaseAdmin as unknown as { rpc: unknown }).rpc = async () => ({
      data: true,
      error: null,
    });

    expect(await chamar(requireAdmin, { user: { id: "u1" } })).toEqual({});
  });

  it("erro na RPC de admin vira 403, nunca liberação", async () => {
    // Fail-closed: falha de infra não pode virar acesso.
    const { supabaseAdmin } = await import("../lib/supabaseAdmin");
    (supabaseAdmin as unknown as { rpc: unknown }).rpc = async () => {
      throw new Error("banco fora do ar");
    };

    expect(await chamar(requireAdmin, { user: { id: "u1" } })).toEqual({
      status: 403,
      code: "forbidden",
    });
  });
});
