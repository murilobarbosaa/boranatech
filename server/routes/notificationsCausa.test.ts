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

import notificationsRouter from "./notifications";

type AppError = Error & { statusCode?: number; code?: string };

function getHandler(path: string) {
  const stack = (
    notificationsRouter as unknown as {
      stack: Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
          stack: Array<{ handle: Function }>;
        };
      }>;
    }
  ).stack;
  const layer = stack.find(
    (l) => l.route?.path === path && l.route.methods.get,
  );
  if (!layer?.route) throw new Error(`handler GET ${path} nao encontrado`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

async function chamarList(): Promise<AppError | undefined> {
  const handler = getHandler("/");
  let capturado: AppError | undefined;
  const req = { query: {}, user: { id: "u-1" }, isPro: false };
  const res = { json: vi.fn() };
  await handler(req, res, (err?: AppError) => {
    capturado = err;
  });
  return capturado;
}

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
