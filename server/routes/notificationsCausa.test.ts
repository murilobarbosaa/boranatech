import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A causa real da falha tem que chegar ao Sentry, nao so a mensagem generica.
 *
 * O evento NODE-EXPRESS-5 ("Error: Nao foi possivel carregar as notificacoes.")
 * dizia QUE falhou e nao dizia POR QUE: o `catch` da rota descartava `err` e
 * montava um `createError` novo, entao o stack no Sentry terminava em
 * `createError` e o erro do Supabase nunca aparecia. `createError` aceita
 * `{ cause }` (middleware/error.ts:50-56) e o integration LinkedErrors do
 * Sentry percorre `err.cause` e anexa o erro original como segunda excecao do
 * mesmo evento.
 *
 * O teste afirma o ELO, nao o comportamento do Sentry: se `cause` estiver la, o
 * LinkedErrors faz o resto (provado empiricamente no evento NODE-EXPRESS-H, que
 * chegou com duas excecoes na cadeia: o erro de schema e o `createError` que o
 * embrulhou).
 */

const audienceSpy = vi.hoisted(() => ({ resolveAudienceContext: vi.fn() }));

vi.mock("./../lib/notificationAudience", () => ({
  resolveAudienceContext: audienceSpy.resolveAudienceContext,
  getVisibleNotificationsForUser: vi.fn(),
  listVisibleNotificationIds: vi.fn(),
  getActiveSuperForUser: vi.fn(),
  isNotificationVisibleToUser: vi.fn(),
}));

vi.mock("./../lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

vi.mock("./../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import notificationsRouter, { superRouter } from "./notifications";

type AppError = Error & { statusCode?: number; code?: string };
type Router = { stack: Array<{ route?: RouteLayer }> };
type RouteLayer = {
  path: string;
  methods: Record<string, boolean>;
  stack: Array<{ handle: Function }>;
};

function getHandler(
  router: unknown,
  metodo: "get" | "post",
  path: string,
): Function {
  const layer = (router as Router).stack.find(
    (l) => l.route?.path === path && l.route.methods[metodo],
  );
  if (!layer?.route) {
    throw new Error(`handler ${metodo.toUpperCase()} ${path} nao encontrado`);
  }
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

const UUID = "11111111-2222-3333-4444-555555555555";

/**
 * Chama um handler e devolve o erro entregue ao `next`.
 *
 * Os quatro caminhos falham no MESMO ponto (`resolveAudienceContext`, mockado
 * para rejeitar), que e o primeiro `await` dentro do `try` de cada um. Isso
 * mantem os testes sobre a UNICA coisa que eles afirmam: o erro que sai do
 * `catch` carrega a causa.
 */
async function chamar(
  handler: Function,
  params: Record<string, string> = {},
): Promise<AppError | undefined> {
  let capturado: AppError | undefined;
  const req = { query: {}, params, user: { id: "u-1" }, isPro: false };
  const res = { json: vi.fn() };
  await handler(req, res, (err?: AppError) => {
    capturado = err;
  });
  return capturado;
}

const chamarList = () => chamar(getHandler(notificationsRouter, "get", "/"));

describe("GET /api/me/notifications: causa preservada", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    audienceSpy.resolveAudienceContext.mockReset();
    // O `catch` da rota loga; silenciado para a saida do teste ficar limpa.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("anexa o erro original como cause do 500", async () => {
    const doSupabase = new Error(
      'relation "public.notifications" does not exist',
    );
    audienceSpy.resolveAudienceContext.mockRejectedValue(doSupabase);

    const err = await chamarList();

    expect(err?.statusCode).toBe(500);
    expect(err?.code).toBe("notifications_fetch_failed");
    // O ELO: e ele que o LinkedErrors percorre.
    expect(err?.cause).toBe(doSupabase);
  });

  // CONTROLE NEGATIVO: sem ele, um teste que so olha statusCode/code passaria
  // identico com o codigo ANTIGO, que era exatamente o defeito (mensagem certa,
  // causa descartada).
  it("CONTROLE NEGATIVO: a mensagem generica sozinha nao basta, a cause nao pode ser undefined", async () => {
    audienceSpy.resolveAudienceContext.mockRejectedValue(new Error("qualquer"));

    const err = await chamarList();

    expect(err?.message).toBe("Não foi possível carregar as notificações.");
    expect(err?.cause).toBeDefined();
  });
});

/**
 * Os outros tres 500 do mesmo arquivo, que engoliam a causa do mesmo jeito.
 *
 * Nenhum deles tem evento no Sentry hoje. Entram junto porque sao a MESMA linha
 * e porque a alternativa e deixar tres caminhos sabidamente cegos esperando o
 * primeiro incidente para receber a instrumentacao que ja se sabe necessaria.
 *
 * A tabela e enumerada aqui de proposito: se um quarto `catch` aparecer no
 * arquivo sem `cause`, ele nao vai estar nesta lista, e a lista e o inventario
 * que alguem le antes de escrever o proximo.
 */
const CAMINHOS = [
  {
    nome: "POST /:id/read",
    router: notificationsRouter,
    metodo: "post" as const,
    path: "/:id/read",
    code: "notification_read_failed",
  },
  {
    nome: "POST /read-all",
    router: notificationsRouter,
    metodo: "post" as const,
    path: "/read-all",
    code: "notifications_read_all_failed",
  },
  {
    nome: "POST /:id/dismiss (superRouter)",
    router: superRouter,
    metodo: "post" as const,
    path: "/:id/dismiss",
    code: "notification_dismiss_failed",
  },
];

describe("demais 500 de notifications: causa preservada", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    audienceSpy.resolveAudienceContext.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  for (const caminho of CAMINHOS) {
    it(`${caminho.nome} anexa a causa no ${caminho.code}`, async () => {
      const original = new Error("timeout do supabase");
      audienceSpy.resolveAudienceContext.mockRejectedValue(original);

      const err = await chamar(
        getHandler(caminho.router, caminho.metodo, caminho.path),
        { id: UUID },
      );

      expect(err?.statusCode).toBe(500);
      expect(err?.code).toBe(caminho.code);
      expect(err?.cause).toBe(original);
    });
  }

  // CONTROLE NEGATIVO: prova que os handlers acima realmente entraram no
  // `catch` de 500, e nao sairam por um 404 de validacao (que tambem chama
  // `next` e passaria despercebido se so olhassemos "houve erro").
  it("CONTROLE NEGATIVO: id invalido sai por 404 sem cause, nao pelo caminho de 500", async () => {
    audienceSpy.resolveAudienceContext.mockRejectedValue(
      new Error("nao usado"),
    );

    const err = await chamar(
      getHandler(notificationsRouter, "post", "/:id/read"),
      { id: "nao-e-uuid" },
    );

    expect(err?.statusCode).toBe(404);
    expect(err?.code).toBe("notification_not_found");
    expect(err?.cause).toBeUndefined();
  });
});
