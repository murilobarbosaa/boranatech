import type { Request, Response } from "express";
import { Router } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GUARDA E ROTAS DO PROPRIO CREATOR: requireCreator, GET /api/creator/status e
 * GET /api/creator/me.
 *
 * O `requireAuth` e o REAL (so o JWT e que nao existe aqui): um envelope na
 * frente do router poe `req.user` quando o teste quer um usuario logado, que e
 * o que o validateSupabaseJwt faz em producao. Assim o 401 sem usuario sai da
 * guarda de verdade, nao de um mock que responde 401.
 *
 * O Redis e um objeto com get/set/del controlados pelo teste, para provar os
 * tres estados do cache (hit, miss, indisponivel) um a um.
 */

type FakeRedis = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

const estado = vi.hoisted(() => ({
  client: null as unknown,
  redis: null as unknown,
  usuario: null as null | { id: string; email: string; role: string },
  sentry: vi.fn(),
  // Resolvedor de link curto do TikTok (lote 10c), controlado por teste. O
  // `fetch` global NAO e dublado aqui: o cliente de rota fala com o Express
  // por ele, e um stub engoliria as proprias requisicoes do teste. O
  // resolvedor tem teste proprio (server/lib/tiktokShortLink.test.ts).
  resolver: vi.fn(),
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    isProd: false,
    devProUserIds: [],
  },
}));
vi.mock("../lib/redis", () => ({
  get cacheConnection() {
    return estado.redis;
  },
  queueConnection: null,
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.client;
  },
}));
vi.mock("@sentry/node", () => ({
  captureException: (...a: unknown[]) => estado.sentry(...a),
}));
vi.mock("../lib/tiktokShortLink", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/tiktokShortLink")>();
  return {
    ...real,
    resolverLinkCurtoDoTikTok: (url: unknown) => estado.resolver(url),
  };
});

import { diaBrasilia, somarDiaCivil } from "../../shared/brasiliaDay";
import {
  criarSupabaseDouble,
  respostaQueFiltra,
  type Chamada,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import { criarClienteRota } from "./adminTestClient";
import creatorRouter from "./creator";
import { requireCreator } from "../middleware/requireCreator";

const UID = "22222222-2222-2222-2222-222222222222";
const USUARIO = { id: UID, email: "cria@exemplo.com", role: "authenticated" };

/** O avatar que o resolvedor devolve sem assinatura dublada: icone padrao. */
const AVATAR_ICONE = {
  mode: "icon",
  avatar_url: null,
  icon: null,
  bg: null,
  border: null,
};

let double: ReturnType<typeof criarSupabaseDouble>;

function montar(
  tabelas: Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)>,
) {
  double = criarSupabaseDouble(tabelas);
  estado.client = double.client;
}

function redisFalso(valorLido: unknown): FakeRedis {
  return {
    get: vi.fn(async () => valorLido),
    set: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1),
  };
}

const envelope = Router();
envelope.use((req, _res, next) => {
  if (estado.usuario) req.user = estado.usuario;
  next();
});
envelope.use(creatorRouter);
const chamar = criarClienteRota(envelope, "/api/creator");

type ErroDeGuarda = { statusCode?: number; code?: string } | undefined;

async function passarPelaGuarda(
  usuario: typeof USUARIO | null = USUARIO,
): Promise<{ req: Request; erro: ErroDeGuarda; chamouNext: boolean }> {
  const req = { user: usuario ?? undefined } as unknown as Request;
  let erro: ErroDeGuarda;
  let chamouNext = false;
  await requireCreator(req, {} as Response, (e?: unknown) => {
    chamouNext = true;
    erro = e as ErroDeGuarda;
  });
  return { req, erro, chamouNext };
}

beforeEach(() => {
  estado.redis = null;
  estado.usuario = null;
  estado.sentry = vi.fn();
  estado.resolver = vi.fn(async () => ({
    ok: false,
    code: "short_link_unresolved",
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requireCreator", () => {
  it("creator ativo passa e carrega o kind em req.creator", async () => {
    montar({
      creators: respostaQueFiltra([
        { user_id: UID, kind: "influencer", revoked_at: null },
      ]),
    });
    const { req, erro, chamouNext } = await passarPelaGuarda();
    expect(chamouNext).toBe(true);
    expect(erro).toBeUndefined();
    expect(req.creator).toEqual({ kind: "influencer" });
    expect(double.de("creators")[0].filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
      { tipo: "is", coluna: "revoked_at", valor: null },
    ]);
  });

  it("sem concessao: 403 not_creator", async () => {
    montar({ creators: respostaQueFiltra([]) });
    const { req, erro } = await passarPelaGuarda();
    expect(erro).toMatchObject({ statusCode: 403, code: "not_creator" });
    expect(req.creator).toBeUndefined();
  });

  it("concessao revogada: 403 not_creator", async () => {
    montar({
      creators: respostaQueFiltra([
        {
          user_id: UID,
          kind: "afiliado",
          revoked_at: "2026-09-10T12:00:00Z",
        },
      ]),
    });
    const { erro } = await passarPelaGuarda();
    expect(erro).toMatchObject({ statusCode: 403, code: "not_creator" });
  });

  it("erro de consulta: 403 com code proprio e Sentry, NUNCA deixa passar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({ creators: { error: { message: "timeout" } } });
    const { req, erro } = await passarPelaGuarda();
    expect(erro).toMatchObject({
      statusCode: 403,
      code: "creator_check_failed",
    });
    expect(req.creator).toBeUndefined();
    expect(estado.sentry).toHaveBeenCalledTimes(1);
  });

  it("sem usuario: 401, sem consultar o banco", async () => {
    montar({});
    const { erro } = await passarPelaGuarda(null);
    expect(erro).toMatchObject({ statusCode: 401, code: "unauthorized" });
    expect(double.chamadas).toHaveLength(0);
  });
});

describe("requireCreator: cache de 60s", () => {
  it("cache hit nao consulta o banco", async () => {
    montar({});
    estado.redis = redisFalso("afiliado");
    const { req, erro } = await passarPelaGuarda();
    expect(erro).toBeUndefined();
    expect(req.creator).toEqual({ kind: "afiliado" });
    expect(double.chamadas).toHaveLength(0);
    expect((estado.redis as FakeRedis).get).toHaveBeenCalledWith(
      `creator_status:${UID}`,
    );
  });

  it('cache hit de "none" barra sem consultar o banco', async () => {
    montar({});
    estado.redis = redisFalso("none");
    const { erro } = await passarPelaGuarda();
    expect(erro).toMatchObject({ statusCode: 403, code: "not_creator" });
    expect(double.chamadas).toHaveLength(0);
  });

  it("miss consulta o banco e grava o kind com TTL de 60s", async () => {
    montar({
      creators: respostaQueFiltra([
        { user_id: UID, kind: "influencer", revoked_at: null },
      ]),
    });
    estado.redis = redisFalso(null);
    await passarPelaGuarda();
    expect((estado.redis as FakeRedis).set).toHaveBeenCalledWith(
      `creator_status:${UID}`,
      "influencer",
      "EX",
      60,
    );
  });

  it('miss de quem nao e creator grava "none"', async () => {
    montar({ creators: respostaQueFiltra([]) });
    estado.redis = redisFalso(null);
    await passarPelaGuarda();
    expect((estado.redis as FakeRedis).set).toHaveBeenCalledWith(
      `creator_status:${UID}`,
      "none",
      "EX",
      60,
    );
  });

  it("erro de Redis consulta o banco e NAO grava cache", async () => {
    montar({
      creators: respostaQueFiltra([
        { user_id: UID, kind: "afiliado", revoked_at: null },
      ]),
    });
    const redis = redisFalso(null);
    redis.get = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    estado.redis = redis;
    const { req } = await passarPelaGuarda();
    expect(req.creator).toEqual({ kind: "afiliado" });
    expect(double.de("creators")).toHaveLength(1);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("valor desconhecido no cache e tratado como miss e sobrescrito", async () => {
    montar({
      creators: respostaQueFiltra([
        { user_id: UID, kind: "afiliado", revoked_at: null },
      ]),
    });
    estado.redis = redisFalso("parceiro");
    const { req } = await passarPelaGuarda();
    expect(req.creator).toEqual({ kind: "afiliado" });
    expect((estado.redis as FakeRedis).set).toHaveBeenCalledWith(
      `creator_status:${UID}`,
      "afiliado",
      "EX",
      60,
    );
  });

  it("erro do banco num miss nao grava nada no cache", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({ creators: { error: { message: "timeout" } } });
    estado.redis = redisFalso(null);
    await passarPelaGuarda();
    expect((estado.redis as FakeRedis).set).not.toHaveBeenCalled();
  });
});

describe("GET /api/creator/status", () => {
  it('afiliado ativo: 200 {data: {kind: "afiliado"}}', async () => {
    montar({
      creators: respostaQueFiltra([
        { user_id: UID, kind: "afiliado", revoked_at: null },
      ]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/status");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { kind: "afiliado" } });
  });

  it("quem nao e creator: 200 {data: {kind: null}}", async () => {
    montar({ creators: respostaQueFiltra([]) });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/status");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { kind: null } });
  });

  it("erro de consulta: 503 creator_status_unavailable, nunca kind null", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({ creators: { error: { message: "timeout" } } });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/status");
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("creator_status_unavailable");
    expect(r.body.data).toBeUndefined();
  });

  it("sem usuario: 401", async () => {
    montar({});
    const r = await chamar("GET", "/status");
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("unauthorized");
  });
});

describe("GET /api/creator/me", () => {
  it("sem usuario: 401", async () => {
    montar({});
    const r = await chamar("GET", "/me");
    expect(r.status).toBe(401);
  });

  it("usuario que nao e creator: 403 not_creator", async () => {
    montar({ creators: respostaQueFiltra([]) });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/me");
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("not_creator");
  });

  it("janela invalida: 400 invalid_janela", async () => {
    montar({
      creators: respostaQueFiltra([
        { user_id: UID, kind: "afiliado", revoked_at: null },
      ]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/me?janela=1y");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_janela");
  });

  it("creator: 200 com o painel na visao creator", async () => {
    montar({
      creators: respostaQueFiltra([
        {
          user_id: UID,
          kind: "afiliado",
          granted_at: "2026-09-01T12:00:00Z",
          revoked_at: null,
        },
      ]),
      profiles: respostaQueFiltra([
        {
          user_id: UID,
          name: "Cria",
          handle: "cria",
          avatar_url: null,
          email: "cria@exemplo.com",
        },
      ]),
      affiliates: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/me?janela=7d");
    expect(r.status).toBe(200);
    expect(r.body.data.creator).toEqual({
      kind: "afiliado",
      granted_at: "2026-09-01T12:00:00Z",
      revoked_at: null,
    });
    expect(r.body.data.perfil).toEqual({
      name: "Cria",
      handle: "cria",
      avatar_url: null,
      // O avatar resolvido pela regra do site (lote 11b). Sem assinatura
      // dublada, o resolvedor cai no icone padrao.
      avatar: AVATAR_ICONE,
    });
    expect(r.body.data.janela).toBe("7d");
  });

  it("erro no montador: 500 db_error, nunca painel parcial", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creators: respostaQueFiltra([
        {
          user_id: UID,
          kind: "afiliado",
          granted_at: "2026-09-01T12:00:00Z",
          revoked_at: null,
        },
      ]),
      profiles: { error: { message: "timeout" } },
      affiliates: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/me");
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
    expect(r.body.data).toBeUndefined();
  });
});

// PERFIL DE CREATOR E CHAVE PIX (lote 08). O CPF de teste e o mesmo de
// shared/creatorProfile.test.ts, e a asserção que importa em toda rota daqui e
// que os onze digitos NUNCA aparecem na resposta: a chave inteira so existe na
// revelacao auditada do admin.

const CPF_DE_TESTE = "52998224725";
const AGORA_ISO = "2026-09-15T12:00:00.000Z";

function concessaoAtiva() {
  return respostaQueFiltra([
    { user_id: UID, kind: "afiliado", revoked_at: null },
  ]);
}

function escritasEm(tabela: string) {
  return double.de(tabela).filter((c) => c.op !== "select");
}

describe("GET /api/creator/profile", () => {
  it("quem nao e creator: 403 not_creator", async () => {
    montar({ creators: respostaQueFiltra([]) });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/profile");
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("not_creator");
  });

  it("sem linha: campos nulos, consentimento desligado, e a leitura NAO cria linha", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: respostaQueFiltra([]),
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/profile");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      data: {
        instagram_handle: null,
        tiktok_handle: null,
        instagram_followers: null,
        tiktok_followers: null,
        followers_updated_at: null,
        visible_to_creators: false,
        // Sem linha, a cor e o padrao do banco (lote 10c).
        calendar_color: "violet",
        pix: null,
      },
    });
    expect(escritasEm("creator_profiles")).toHaveLength(0);
    expect(escritasEm("creator_pix_keys")).toHaveLength(0);
  });

  it("com perfil e chave: a chave sai MASCARADA, nunca inteira", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: respostaQueFiltra([
        {
          user_id: UID,
          instagram_handle: "ana.cria",
          tiktok_handle: "ana.cria",
          instagram_followers: 12500,
          tiktok_followers: 800,
          followers_updated_at: "2026-09-14T12:00:00Z",
          visible_to_creators: true,
        },
      ]),
      creator_pix_keys: respostaQueFiltra([
        {
          user_id: UID,
          key_type: "cpf",
          key_value: CPF_DE_TESTE,
          updated_at: "2026-09-14T12:00:00Z",
        },
      ]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/profile");
    expect(r.status).toBe(200);
    expect(r.body.data.pix).toEqual({
      tipo: "cpf",
      mascarada: "***.***.247-**",
      updated_at: "2026-09-14T12:00:00Z",
    });
    expect(r.body.data.visible_to_creators).toBe(true);
    expect(JSON.stringify(r.body)).not.toContain(CPF_DE_TESTE);
  });

  it("erro de leitura: 500 db_error, nunca perfil vazio", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creators: concessaoAtiva(),
      creator_profiles: { error: { message: "timeout" } },
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/profile");
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
    expect(r.body.data).toBeUndefined();
  });
});

describe("PUT /api/creator/profile", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("grava normalizado, com a data dos seguidores, e devolve o perfil relido", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(AGORA_ISO));
    const salvo = {
      user_id: UID,
      instagram_handle: "ana.cria",
      tiktok_handle: "ana.cria",
      instagram_followers: 12500,
      tiktok_followers: null,
      followers_updated_at: AGORA_ISO,
      visible_to_creators: true,
    };
    montar({
      creators: concessaoAtiva(),
      creator_profiles: (c) =>
        c.op === "select" ? { rows: [salvo] } : { rows: [] },
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/profile", {
      instagram_handle: "https://www.instagram.com/Ana.Cria/",
      tiktok_handle: "@ana.cria",
      instagram_followers: 12500,
      tiktok_followers: null,
      visible_to_creators: true,
    });
    expect(r.status).toBe(200);
    const escritas = escritasEm("creator_profiles");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].op).toBe("upsert");
    expect(escritas[0].payload).toEqual({
      user_id: UID,
      instagram_handle: "ana.cria",
      tiktok_handle: "ana.cria",
      instagram_followers: 12500,
      tiktok_followers: null,
      followers_updated_at: AGORA_ISO,
      visible_to_creators: true,
      // Sem cor no corpo e sem linha anterior: o padrao (lote 10c).
      calendar_color: "violet",
      updated_at: AGORA_ISO,
    });
    expect(r.body.data.instagram_handle).toBe("ana.cria");
    expect(r.body.data.followers_updated_at).toBe(AGORA_ISO);
  });

  it("calendar_color (lote 10c): valida pela lista, grava a escolhida, e sem ela mantem a gravada", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: (c) =>
        c.op === "select"
          ? {
              rows: [
                {
                  user_id: UID,
                  instagram_handle: "ana.cria",
                  tiktok_handle: null,
                  instagram_followers: null,
                  tiktok_followers: null,
                  followers_updated_at: null,
                  visible_to_creators: false,
                  calendar_color: "rose",
                },
              ],
            }
          : { rows: [] },
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const corpo = {
      instagram_handle: "ana.cria",
      tiktok_handle: null,
      instagram_followers: null,
      tiktok_followers: null,
      visible_to_creators: false,
    };
    // Fora da lista: 400, nada gravado.
    const invalida = await chamar("PUT", "/profile", {
      ...corpo,
      calendar_color: "magenta",
    });
    expect(invalida.status).toBe(400);
    expect(invalida.body.error.code).toBe("invalid_calendar_color");
    expect(escritasEm("creator_profiles")).toHaveLength(0);

    // Escolhida: vai no upsert.
    const escolhida = await chamar("PUT", "/profile", {
      ...corpo,
      calendar_color: "emerald",
    });
    expect(escolhida.status).toBe(200);
    expect(escritasEm("creator_profiles")[0].payload?.calendar_color).toBe(
      "emerald",
    );

    // Ausente (client anterior ao lote): a gravada continua, nao o padrao.
    const semCor = await chamar("PUT", "/profile", corpo);
    expect(semCor.status).toBe(200);
    expect(escritasEm("creator_profiles")[1].payload?.calendar_color).toBe(
      "rose",
    );
    expect(semCor.body.data.calendar_color).toBe("rose");
  });

  it("sem seguidor nenhum: followers_updated_at vai null", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: { rows: [] },
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/profile", {
      instagram_handle: "ana.cria",
      tiktok_handle: null,
      instagram_followers: null,
      tiktok_followers: null,
      visible_to_creators: false,
    });
    expect(r.status).toBe(200);
    expect(
      escritasEm("creator_profiles")[0].payload?.followers_updated_at,
    ).toBe(null);
  });

  it("@ invalido: 400 com o codigo do campo, e nada e gravado", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: respostaQueFiltra([]),
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/profile", {
      instagram_handle: "ana cria",
      tiktok_handle: null,
      instagram_followers: null,
      tiktok_followers: null,
      visible_to_creators: false,
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_instagram_handle");
    expect(escritasEm("creator_profiles")).toHaveLength(0);
  });

  it("seguidores como texto: 400 invalid_tiktok_followers", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: respostaQueFiltra([]),
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/profile", {
      instagram_handle: null,
      tiktok_handle: "ana.cria",
      instagram_followers: null,
      tiktok_followers: "1.200",
      visible_to_creators: false,
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_tiktok_followers");
  });

  it("consentimento ausente: 400, nunca vira false em silencio", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_profiles: respostaQueFiltra([]),
      creator_pix_keys: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/profile", {
      instagram_handle: "ana.cria",
      tiktok_handle: null,
      instagram_followers: null,
      tiktok_followers: null,
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_visible_to_creators");
    expect(escritasEm("creator_profiles")).toHaveLength(0);
  });

  it("quem nao e creator: 403 e nada e gravado", async () => {
    montar({
      creators: respostaQueFiltra([]),
      creator_profiles: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/profile", { visible_to_creators: true });
    expect(r.status).toBe(403);
    expect(escritasEm("creator_profiles")).toHaveLength(0);
  });
});

describe("PUT /api/creator/pix", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("CPF valido: grava so os digitos e devolve so a mascara", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(AGORA_ISO));
    montar({
      creators: concessaoAtiva(),
      creator_pix_keys: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/pix", {
      tipo: "cpf",
      valor: "529.982.247-25",
    });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({
      data: {
        pix: {
          tipo: "cpf",
          mascarada: "***.***.247-**",
          updated_at: AGORA_ISO,
        },
      },
    });
    const escritas = escritasEm("creator_pix_keys");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].op).toBe("upsert");
    expect(escritas[0].payload).toEqual({
      user_id: UID,
      key_type: "cpf",
      key_value: CPF_DE_TESTE,
      updated_at: AGORA_ISO,
    });
    expect(JSON.stringify(r.body)).not.toContain(CPF_DE_TESTE);
  });

  it("CPF com digito verificador errado: 400 invalid_pix_cpf, nada gravado", async () => {
    montar({ creators: concessaoAtiva(), creator_pix_keys: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/pix", {
      tipo: "cpf",
      valor: "529.982.247-26",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_pix_cpf");
    expect(escritasEm("creator_pix_keys")).toHaveLength(0);
  });

  it("tipo fora da lista: 400 invalid_pix_type", async () => {
    montar({ creators: concessaoAtiva(), creator_pix_keys: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/pix", { tipo: "celular", valor: "1" });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_pix_type");
  });

  it("erro ao gravar: 500 db_error, sem chave na resposta", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creators: concessaoAtiva(),
      creator_pix_keys: { error: { message: "timeout" } },
    });
    estado.usuario = USUARIO;
    const r = await chamar("PUT", "/pix", {
      tipo: "cpf",
      valor: CPF_DE_TESTE,
    });
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
    expect(JSON.stringify(r.body)).not.toContain(CPF_DE_TESTE);
  });
});

describe("DELETE /api/creator/pix", () => {
  it("apaga a chave do proprio creator e devolve pix null", async () => {
    montar({ creators: concessaoAtiva(), creator_pix_keys: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", "/pix");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { pix: null } });
    const escritas = escritasEm("creator_pix_keys");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].op).toBe("delete");
    expect(escritas[0].filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
    ]);
  });

  it("quem nao e creator: 403 e nada e apagado", async () => {
    montar({ creators: respostaQueFiltra([]), creator_pix_keys: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", "/pix");
    expect(r.status).toBe(403);
    expect(escritasEm("creator_pix_keys")).toHaveLength(0);
  });
});

// PUBLICACOES REGISTRADAS (lote 09). Um codigo por causa, e um status por
// codigo: link errado e 400, repetida e 409 (vinda do unique do banco) e teto
// diario e 429. Sao tres coisas que a tela precisa dizer diferente.

const LINK_VALIDO = "https://www.instagram.com/reel/Cx1AbCdEf_-/";
const POST_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const PUBLICACAO = {
  id: POST_ID,
  network: "instagram",
  kind: "reel",
  url: LINK_VALIDO,
  status: "pendente",
  // `as string | null`: a fixture confirmada abaixo espalha esta e troca o
  // instante, e o literal `null` faria o tsc travar o tipo em `null`.
  confirmed_at: null as string | null,
  created_at: "2026-09-16T12:00:00Z",
};

// Uma segunda, ja confirmada, no mesmo mes: e o que separa `no_mes` (so as
// confirmadas) de `aguardando` (so as pendentes) na leitura.
const CONFIRMADA = {
  ...PUBLICACAO,
  id: "9d2c1b0a-8f7e-4d6c-b5a4-3f2e1d0c9b8a",
  url: "https://www.instagram.com/p/Cx9ZyXwVu_-/",
  kind: "post",
  status: "confirmado",
  confirmed_at: "2026-09-16T13:00:00Z",
};

const LINK_STORY =
  "https://www.instagram.com/stories/ana.cria/3456789012345678901/";
const LINK_VIDEO = "https://www.tiktok.com/@ana.cria/video/7311122233344455566";
const LINK_POST = "https://www.instagram.com/p/Cx1AbCdEf_-/";
const LINK_LINKEDIN =
  "https://www.linkedin.com/feed/update/urn:li:activity:7371234567890123456/";

/** Publicacoes que respondem por STATUS ao count do mes: o double nao simula
 * `gte`, entao o responder olha o filtro de status e devolve as linhas certas
 * para cada uma das duas contagens. */
function postsPorStatus(...linhas: Array<typeof PUBLICACAO>) {
  return (c: Chamada): RespostaTabela => {
    const status = c.filtros.find((f) => f.coluna === "status");
    if (!status) return { rows: linhas };
    return { rows: linhas.filter((l) => l.status === status.valor) };
  };
}

describe("GET /api/creator/posts", () => {
  it("lista do proprio creator, com status em cada linha; no_mes conta SO as confirmadas e aguardando SO as pendentes", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_posts: postsPorStatus(PUBLICACAO, CONFIRMADA),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/posts");
    expect(r.status).toBe(200);
    expect(r.body.data.posts).toEqual([PUBLICACAO, CONFIRMADA]);
    expect(r.body.data.total).toBe(2);
    expect(r.body.data.no_mes).toBe(1);
    expect(r.body.data.aguardando).toBe(1);
    // As duas contagens do mes filtram por status, cada uma pelo seu.
    const contagens = double
      .de("creator_posts")
      .filter((c) => c.filtros.some((f) => f.coluna === "status"))
      .map((c) => c.filtros.find((f) => f.coluna === "status")!.valor)
      .sort();
    expect(contagens).toEqual(["confirmado", "pendente"]);
  });

  it("quem nao e creator: 403 not_creator", async () => {
    montar({ creators: respostaQueFiltra([]), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/posts");
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("not_creator");
  });
});

describe("POST /api/creator/posts", () => {
  it("registra o link e devolve 201 com a publicacao normalizada", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_posts: (c) =>
        c.op === "insert" ? { rows: [PUBLICACAO] } : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "instagram.com/reel/Cx1AbCdEf_-?igshid=abc",
      rede: "instagram",
      tipo: "reel",
    });
    expect(r.status).toBe(201);
    expect(r.body.data.post).toEqual(PUBLICACAO);
    const escritas = escritasEm("creator_posts");
    expect(escritas).toHaveLength(1);
    // O que vai para o banco e a forma CANONICA, nao o que foi colado, e o
    // status inicial e pendente: reel so vale ponto depois da conferencia.
    expect(escritas[0].payload).toEqual({
      user_id: UID,
      network: "instagram",
      kind: "reel",
      external_id: "Cx1AbCdEf_-",
      url: LINK_VALIDO,
      status: "pendente",
      confirmed_at: null,
      confirmed_by: null,
    });
  });

  it("cada tipo com o link certo grava o kind escolhido; post, reel e video nascem pendentes", async () => {
    for (const [rede, tipo, url] of [
      ["instagram", "post", LINK_POST],
      ["instagram", "reel", LINK_VALIDO],
      ["tiktok", "video", LINK_VIDEO],
      ["linkedin", "post", LINK_LINKEDIN],
    ] as const) {
      montar({
        creators: concessaoAtiva(),
        creator_posts: (c) =>
          c.op === "insert"
            ? { rows: [{ ...PUBLICACAO, kind: tipo }] }
            : { rows: [] },
      });
      estado.usuario = USUARIO;
      const r = await chamar("POST", "/posts", { url, rede, tipo });
      expect(r.status, `${rede} ${tipo}`).toBe(201);
      const payload = escritasEm("creator_posts")[0].payload!;
      expect(payload.kind, tipo).toBe(tipo);
      expect(payload.status, tipo).toBe("pendente");
      expect(payload.confirmed_at, tipo).toBeNull();
    }
  });

  it("story nasce CONFIRMADO, com confirmed_at no instante do registro e confirmed_by nulo", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-16T15:00:00.000Z"));
    const story = {
      ...PUBLICACAO,
      kind: "story",
      url: LINK_STORY,
      status: "confirmado",
      confirmed_at: "2026-09-16T15:00:00.000Z",
    };
    montar({
      creators: concessaoAtiva(),
      creator_posts: (c) =>
        c.op === "insert" ? { rows: [story] } : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: LINK_STORY,
      rede: "instagram",
      tipo: "story",
    });
    vi.useRealTimers();
    expect(r.status).toBe(201);
    expect(r.body.data.post.status).toBe("confirmado");
    expect(escritasEm("creator_posts")[0].payload).toEqual({
      user_id: UID,
      network: "instagram",
      kind: "story",
      external_id: "3456789012345678901",
      url: LINK_STORY,
      status: "confirmado",
      confirmed_at: "2026-09-16T15:00:00.000Z",
      // Sem admin a nomear: a confirmacao do story e automatica.
      confirmed_by: null,
    });
  });

  it("link de um tipo com outro escolhido, na mesma rede: 400 post_type_mismatch, com o tipo detectado na mensagem, e nada gravado", async () => {
    for (const [url, tipo, detectado] of [
      [LINK_VALIDO, "post", "reel"],
      [LINK_POST, "reel", "post"],
      [LINK_STORY, "post", "story"],
    ] as const) {
      montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
      estado.usuario = USUARIO;
      const r = await chamar("POST", "/posts", {
        url,
        rede: "instagram",
        tipo,
      });
      expect(r.status, `${tipo} ${url}`).toBe(400);
      expect(r.body.error.code).toBe("post_type_mismatch");
      expect(r.body.error.message).toBe(
        `Esse link é de um ${detectado}. Troque o tipo ou o link.`,
      );
      expect(escritasEm("creator_posts")).toHaveLength(0);
    }
  });

  it("link de OUTRA rede (lote 10d): 400 post_network_mismatch, com a rede detectada na mensagem, e nada gravado", async () => {
    for (const [url, rede, tipo, detectada] of [
      [LINK_VIDEO, "instagram", "reel", "TikTok"],
      [LINK_VALIDO, "tiktok", "video", "Instagram"],
      [LINK_LINKEDIN, "instagram", "post", "LinkedIn"],
      [LINK_POST, "linkedin", "post", "Instagram"],
    ] as const) {
      montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
      estado.usuario = USUARIO;
      const r = await chamar("POST", "/posts", { url, rede, tipo });
      expect(r.status, `${rede} ${url}`).toBe(400);
      expect(r.body.error.code).toBe("post_network_mismatch");
      expect(r.body.error.message).toBe(
        `Esse link é do ${detectada}. Troque a rede ou o link.`,
      );
      expect(escritasEm("creator_posts")).toHaveLength(0);
    }
  });

  it("sem rede, ou com rede fora da lista: 400 invalid_post_network, sem tocar no banco", async () => {
    for (const rede of [undefined, "", "youtube", 3]) {
      montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
      estado.usuario = USUARIO;
      const r = await chamar("POST", "/posts", {
        url: LINK_VALIDO,
        rede,
        tipo: "reel",
      });
      expect(r.status, String(rede)).toBe(400);
      expect(r.body.error.code).toBe("invalid_post_network");
      expect(double.de("creator_posts")).toHaveLength(0);
    }
  });

  it("tipo que a rede nao admite: 400 invalid_post_type, sem tocar no banco", async () => {
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: LINK_VIDEO,
      rede: "tiktok",
      tipo: "reel",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_post_type");
    expect(double.de("creator_posts")).toHaveLength(0);
  });

  it("sem tipo, ou com tipo que nao existe: 400 invalid_post_type, sem tocar no banco", async () => {
    for (const tipo of [undefined, "", "carrossel", 3]) {
      montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
      estado.usuario = USUARIO;
      const r = await chamar("POST", "/posts", {
        url: LINK_VALIDO,
        rede: "instagram",
        tipo,
      });
      expect(r.status, String(tipo)).toBe(400);
      expect(r.body.error.code).toBe("invalid_post_type");
      expect(double.de("creator_posts")).toHaveLength(0);
    }
  });

  it("link invalido: 400 invalid_post_url e NADA e gravado", async () => {
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "https://www.instagram.com/ana.cria/",
      rede: "instagram",
      tipo: "post",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_post_url");
    expect(escritasEm("creator_posts")).toHaveLength(0);
  });

  it("link curto do Instagram tem codigo proprio, e o servidor NAO abre a URL", async () => {
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "https://instagr.am/p/Cx1AbCdEf_-/",
      rede: "instagram",
      tipo: "post",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("short_link_unsupported");
    expect(escritasEm("creator_posts")).toHaveLength(0);
    expect(estado.resolver).not.toHaveBeenCalled();
  });

  it("link curto do TikTok com tipo video (lote 10c): o servidor resolve e grava a canonica", async () => {
    estado.resolver = vi.fn(async () => ({
      ok: true,
      valor: {
        network: "tiktok",
        kind: "video",
        external_id: "7311122233344455566",
        url: LINK_VIDEO,
      },
    }));
    const video = {
      ...PUBLICACAO,
      kind: "video",
      network: "tiktok",
      url: LINK_VIDEO,
    };
    montar({
      creators: concessaoAtiva(),
      creator_posts: (c) =>
        c.op === "insert" ? { rows: [video] } : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "https://vm.tiktok.com/ZMabc1234/",
      rede: "tiktok",
      tipo: "video",
    });
    expect(r.status).toBe(201);
    expect(r.body.data.post.url).toBe(LINK_VIDEO);
    expect(estado.resolver).toHaveBeenCalledWith(
      "https://vm.tiktok.com/ZMabc1234/",
    );
    expect(escritasEm("creator_posts")[0].payload).toMatchObject({
      network: "tiktok",
      kind: "video",
      external_id: "7311122233344455566",
      url: LINK_VIDEO,
      status: "pendente",
    });
  });

  it("link curto do TikTok que nao resolve: 400 short_link_unresolved, nada gravado", async () => {
    // O resolvedor padrao do beforeEach ja responde short_link_unresolved.
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "https://vt.tiktok.com/ZSabc12/",
      rede: "tiktok",
      tipo: "video",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("short_link_unresolved");
    expect(estado.resolver).toHaveBeenCalledTimes(1);
    expect(escritasEm("creator_posts")).toHaveLength(0);
  });

  it("no teto do dia, o decimo primeiro link curto recebe 429 SEM nenhuma chamada ao resolvedor", async () => {
    const dezDeHoje = Array.from({ length: 10 }, (_, i) => ({
      id: `id-${i}`,
    }));
    montar({
      creators: concessaoAtiva(),
      creator_posts: { rows: dezDeHoje },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "https://vm.tiktok.com/ZMabc1234/",
      rede: "tiktok",
      tipo: "video",
    });
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe("post_daily_limit");
    expect(estado.resolver).not.toHaveBeenCalled();
    expect(escritasEm("creator_posts")).toHaveLength(0);
    // A contagem do dia foi a unica ida ao banco.
    expect(double.de("creator_posts")).toHaveLength(1);
  });

  it("link curto do TikTok com OUTRO tipo escolhido: continua short_link_unsupported, sem abrir a URL", async () => {
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: "https://vm.tiktok.com/ZMabc1234/",
      rede: "instagram",
      tipo: "reel",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("short_link_unsupported");
    expect(estado.resolver).not.toHaveBeenCalled();
  });

  it("publicacao repetida: 409 pelo 23505 da constraint, sem select antes", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_posts: (c) =>
        c.op === "insert"
          ? {
              error: {
                code: "23505",
                message:
                  'duplicate key value violates unique constraint "creator_posts_unico_por_creator"',
              },
            }
          : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: LINK_VALIDO,
      rede: "instagram",
      tipo: "reel",
    });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("post_already_registered");
  });

  it("outro 23505, de outra constraint, NAO vira 409: e 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creators: concessaoAtiva(),
      creator_posts: (c) =>
        c.op === "insert"
          ? {
              error: {
                code: "23505",
                message:
                  'duplicate key value violates unique constraint "outra_coisa_key"',
              },
            }
          : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: LINK_VALIDO,
      rede: "instagram",
      tipo: "reel",
    });
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });

  it("no teto do dia: 429 post_daily_limit, e nada e gravado", async () => {
    // Dez linhas no dia: a contagem bate o teto, e o insert nem acontece.
    const dezDeHoje = Array.from({ length: 10 }, (_, i) => ({
      id: `id-${i}`,
    }));
    montar({
      creators: concessaoAtiva(),
      creator_posts: { rows: dezDeHoje },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: LINK_VALIDO,
      rede: "instagram",
      tipo: "reel",
    });
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe("post_daily_limit");
    expect(escritasEm("creator_posts")).toHaveLength(0);
  });

  it("quem nao e creator: 403 e nada e gravado", async () => {
    montar({ creators: respostaQueFiltra([]), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/posts", {
      url: LINK_VALIDO,
      rede: "instagram",
      tipo: "reel",
    });
    expect(r.status).toBe(403);
    expect(escritasEm("creator_posts")).toHaveLength(0);
  });
});

describe("DELETE /api/creator/posts/:id", () => {
  it("apaga a propria, com o dono no proprio DELETE", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_posts: { rows: [{ id: POST_ID }] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", `/posts/${POST_ID}`);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { id: POST_ID } });
    const escritas = escritasEm("creator_posts");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].op).toBe("delete");
    expect(escritas[0].filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
      { tipo: "eq", coluna: "id", valor: POST_ID },
    ]);
  });

  it("publicacao de outra pessoa: 404, porque o delete nao alcanca", async () => {
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", `/posts/${POST_ID}`);
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("post_not_found");
  });

  it("id invalido: 400, sem tocar no banco", async () => {
    montar({ creators: concessaoAtiva(), creator_posts: { rows: [] } });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", "/posts/nao-e-uuid");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_post_id");
    expect(double.de("creator_posts")).toHaveLength(0);
  });
});

// CALENDARIO COMPARTILHADO E COLLAB (lote 10).
//
// A DATA E CALCULADA A PARTIR DE HOJE, e nao escrita como literal: a janela de
// marcacao vai de hoje ate hoje mais 90 dias, entao um literal passaria a
// falhar sozinho por decurso de prazo. Os literais de data ficam no teste de
// shared/creatorCalendar.ts, que e onde a regra mora.

const OUTRO_UID = "33333333-3333-3333-3333-333333333333";
const EVENTO_ID = "8f14e45f-ceea-467a-9f6b-2c1d0e2a9b77";
const PEDIDO_ID = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

const HOJE_BR = diaBrasilia(new Date().toISOString())!;
const DIA_MARCADO = somarDiaCivil(HOJE_BR, 5);
const DIA_PASSADO = somarDiaCivil(HOJE_BR, -1);

const MARCACAO = {
  id: EVENTO_ID,
  user_id: UID,
  event_date: DIA_MARCADO,
  network: "instagram",
  note: "bastidores do curso",
  created_at: "2026-09-16T12:00:00Z",
};

const MARCACAO_DE_OUTRO = { ...MARCACAO, user_id: OUTRO_UID };

const PEDIDO = {
  id: PEDIDO_ID,
  event_id: EVENTO_ID,
  requester_id: OUTRO_UID,
  owner_id: UID,
  message: "bora?",
  status: "pendente",
  created_at: "2026-09-16T13:00:00Z",
  responded_at: null,
};

/** Perfis com nome, @ e e-mail: `lerAutores` pede nome e @, `lerContato` pede
 * nome e e-mail, e a notificacao direcionada resolve o usuario PELO e-mail. */
function perfis() {
  return respostaQueFiltra([
    {
      user_id: UID,
      name: "Cria",
      handle: "cria",
      email: "cria@exemplo.com",
    },
    {
      user_id: OUTRO_UID,
      name: "Outra Cria",
      handle: "outracria",
      email: "outra@exemplo.com",
    },
  ]);
}

/** As duas tabelas que o aviso escreve, no caminho feliz. */
function avisoOk(): Record<
  string,
  RespostaTabela | ((c: Chamada) => RespostaTabela)
> {
  return {
    notifications: (c: Chamada) =>
      c.op === "insert" ? { rows: [{ id: "notif-1" }] } : { rows: [] },
    notification_recipients: { rows: [] },
  };
}

describe("GET /api/creator/calendar", () => {
  it("mes invalido: 400 month_out_of_range, sem tocar no banco", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/calendar?mes=2026-13");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("month_out_of_range");
    expect(double.de("creator_calendar_events")).toHaveLength(0);
  });

  it("sem o parametro mes: 400, o mesmo codigo", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/calendar");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("month_out_of_range");
  });

  it("devolve as marcacoes de TODOS os creators, com o autor de cada uma", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO, MARCACAO_DE_OUTRO] },
      creator_collab_requests: respostaQueFiltra([]),
      profiles: perfis(),
      // So OUTRO escolheu cor; o meu perfil nao tem linha: padrao.
      creator_profiles: respostaQueFiltra([
        { user_id: OUTRO_UID, calendar_color: "emerald" },
      ]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", `/calendar?mes=${DIA_MARCADO.slice(0, 7)}`);
    expect(r.status).toBe(200);
    expect(r.body.data.marcacoes).toHaveLength(2);
    // A marcacao de OUTRA pessoa aparece: o calendario e compartilhado, e e
    // isso que permite a duas pessoas nao repetirem o mesmo assunto no dia.
    const donos = r.body.data.marcacoes.map(
      (m: { user_id: string }) => m.user_id,
    );
    expect(donos).toEqual([UID, OUTRO_UID]);
    expect(r.body.data.marcacoes[0].autor).toEqual({
      user_id: UID,
      name: "Cria",
      handle: "cria",
      avatar_url: null,
      avatar: AVATAR_ICONE,
    });
    // Sem pedido, `meu_pedido` e null EXPLICITO, nao ausente: ausente e o
    // backend anterior ao lote 10c, e o client trata os dois diferente.
    expect(r.body.data.marcacoes[1].meu_pedido).toBeNull();
    expect(r.body.data.marcacoes[1].collabs).toEqual([]);
    expect(r.body.data.marcacoes[1].minha_collab).toBe(false);
    // A cor de cada creator vem em cada marcacao (lote 10c), numa leitura so
    // de creator_profiles para o mes, e sem linha e o padrao.
    expect(r.body.data.marcacoes[0].calendar_color).toBe("violet");
    expect(r.body.data.marcacoes[1].calendar_color).toBe("emerald");
    expect(double.de("creator_profiles")).toHaveLength(1);
    expect(double.de("creator_profiles")[0].filtros).toEqual([
      { tipo: "in", coluna: "user_id", valor: [UID, OUTRO_UID] },
    ]);
  });

  it("collabs (lote 10c): a aceita aparece em `collabs` para um TERCEIRO, com nome e avatar; a pendente nao; minha_collab so para o parceiro", async () => {
    const TERCEIRO_UID = "55555555-5555-5555-5555-555555555555";
    const MARCACAO_DE_TERCEIRO = {
      ...MARCACAO,
      id: "9d2c1b0a-8f7e-4d6c-b5a4-3f2e1d0c9b8a",
      user_id: TERCEIRO_UID,
    };
    const tabelas = () => ({
      // Os dois que olham sao creators ativos.
      creators: respostaQueFiltra([
        { user_id: UID, kind: "afiliado", revoked_at: null },
        { user_id: TERCEIRO_UID, kind: "influencer", revoked_at: null },
      ]),
      creator_calendar_events: {
        rows: [MARCACAO_DE_OUTRO, MARCACAO_DE_TERCEIRO],
      },
      creator_collab_requests: respostaQueFiltra([
        // Aceita: EU (UID) fechei collab na marcacao de OUTRO.
        {
          id: PEDIDO_ID,
          event_id: MARCACAO_DE_OUTRO.id,
          requester_id: UID,
          owner_id: OUTRO_UID,
          status: "aceita",
        },
        // Pendente: OUTRO pediu na do terceiro. Nao e collab ainda.
        {
          id: "2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
          event_id: MARCACAO_DE_TERCEIRO.id,
          requester_id: OUTRO_UID,
          owner_id: TERCEIRO_UID,
          status: "pendente",
        },
      ]),
      creator_profiles: respostaQueFiltra([
        { user_id: UID, calendar_color: "cyan" },
      ]),
      profiles: respostaQueFiltra([
        {
          user_id: UID,
          name: "Cria",
          handle: "cria",
          email: "cria@exemplo.com",
          avatar_url: "https://a/cria.png",
        },
        {
          user_id: OUTRO_UID,
          name: "Outra Cria",
          handle: "outracria",
          email: "outra@exemplo.com",
        },
        { user_id: TERCEIRO_UID, name: "Terceira", handle: "terceira" },
      ]),
    });

    // Visao do TERCEIRO: ve a collab dos outros dois, e nao e dele.
    montar(tabelas());
    estado.usuario = { ...USUARIO, id: TERCEIRO_UID };
    const terceiro = await chamar(
      "GET",
      `/calendar?mes=${DIA_MARCADO.slice(0, 7)}`,
    );
    expect(terceiro.status).toBe(200);
    expect(terceiro.body.data.marcacoes[0].collabs).toEqual([
      {
        user_id: UID,
        name: "Cria",
        // A url do perfil existe, mas a foto so aparece com a regra do site
        // (Pro e moderacao limpa, lote 11b); sem assinatura dublada, o alias
        // segue o `avatar` e sai nulo.
        avatar_url: null,
        avatar: AVATAR_ICONE,
        // A cor do parceiro entra no dia, na cor dele.
        calendar_color: "cyan",
      },
    ]);
    expect(terceiro.body.data.marcacoes[0].minha_collab).toBe(false);
    expect(terceiro.body.data.marcacoes[1].collabs).toEqual([]);
    // Uma leitura de pedidos e uma de perfis para o mes inteiro: o parceiro
    // entra no MESMO lote dos donos. Desde o lote 11b sao DUAS leituras de
    // `profiles` (nome e @ aqui, e a do resolvedor de avatar do site), as duas
    // para o lote inteiro, nunca uma por pessoa.
    expect(double.de("creator_collab_requests")).toHaveLength(1);
    expect(double.de("profiles")).toHaveLength(2);
    expect(double.de("profiles")[0].filtros[0].valor).toEqual([
      OUTRO_UID,
      TERCEIRO_UID,
      UID,
    ]);

    // Visao do PARCEIRO (eu): a mesma collab, agora minha.
    montar(tabelas());
    estado.usuario = USUARIO;
    const parceiro = await chamar(
      "GET",
      `/calendar?mes=${DIA_MARCADO.slice(0, 7)}`,
    );
    expect(parceiro.body.data.marcacoes[0].minha_collab).toBe(true);
    expect(parceiro.body.data.marcacoes[0].meu_pedido).toEqual({
      id: PEDIDO_ID,
      status: "aceita",
    });
  });

  it("meu_pedido (lote 10c): o pedido de QUEM OLHA em cada marcacao, lido numa consulta so; o de outra pessoa nao aparece", async () => {
    const MARCACAO_DE_TERCEIRO = {
      ...MARCACAO,
      id: "9d2c1b0a-8f7e-4d6c-b5a4-3f2e1d0c9b8a",
      user_id: "55555555-5555-5555-5555-555555555555",
    };
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: {
        rows: [MARCACAO_DE_OUTRO, MARCACAO_DE_TERCEIRO],
      },
      creator_profiles: respostaQueFiltra([]),
      creator_collab_requests: respostaQueFiltra([
        // O meu, pendente, na marcacao de OUTRO.
        {
          id: PEDIDO_ID,
          event_id: MARCACAO_DE_OUTRO.id,
          requester_id: UID,
          owner_id: OUTRO_UID,
          status: "recusada",
        },
        // O de OUTRA pessoa na marcacao do terceiro: nao e meu, nao aparece.
        {
          id: "2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
          event_id: MARCACAO_DE_TERCEIRO.id,
          requester_id: OUTRO_UID,
          owner_id: MARCACAO_DE_TERCEIRO.user_id,
          status: "pendente",
        },
      ]),
      profiles: perfis(),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", `/calendar?mes=${DIA_MARCADO.slice(0, 7)}`);
    expect(r.status).toBe(200);
    expect(r.body.data.marcacoes[0].meu_pedido).toEqual({
      id: PEDIDO_ID,
      status: "recusada",
    });
    expect(r.body.data.marcacoes[1].meu_pedido).toBeNull();
    // Uma leitura de pedidos para o mes inteiro, pelos ids das marcacoes.
    const leituras = double.de("creator_collab_requests");
    expect(leituras).toHaveLength(1);
    expect(leituras[0].filtros).toEqual([
      {
        tipo: "in",
        coluna: "event_id",
        valor: [MARCACAO_DE_OUTRO.id, MARCACAO_DE_TERCEIRO.id],
      },
    ]);
  });

  it("quem nao e creator: 403 not_creator", async () => {
    montar({
      creators: respostaQueFiltra([]),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/calendar?mes=2026-09");
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("not_creator");
  });
});

describe("POST /api/creator/calendar", () => {
  it("marca o dia e grava a forma canonica, com a nota sem espaco; `network` sozinho continua valendo", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: (c) =>
        c.op === "upsert" ? { rows: [MARCACAO] } : { rows: [] },
      profiles: perfis(),
      creator_profiles: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      network: "instagram",
      note: "  bastidores do curso  ",
    });
    expect(r.status).toBe(201);
    // `marcacao` e o alias do client anterior; `marcacoes` e a resposta nova.
    expect(r.body.data.marcacao.id).toBe(EVENTO_ID);
    expect(r.body.data.marcacoes).toHaveLength(1);
    expect(r.body.data.ja_existiam).toEqual([]);
    // Sem linha de perfil: a cor padrao vai na resposta (lote 10d).
    expect(r.body.data.marcacoes[0].calendar_color).toBe("violet");
    const escritas = escritasEm("creator_calendar_events");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].op).toBe("upsert");
    expect(escritas[0].payloadLote).toEqual([
      {
        user_id: UID,
        event_date: DIA_MARCADO,
        network: "instagram",
        note: "bastidores do curso",
      },
    ]);
  });

  it("tres redes num dia vazio (lote 10d): tres linhas em UMA ida ao banco, e o toast sabe quais", async () => {
    const tres = ["instagram", "tiktok", "linkedin"].map((network, i) => ({
      ...MARCACAO,
      id: `${i}f14e45f-ceea-467a-9f6b-2c1d0e2a9b77`,
      network,
    }));
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: (c) =>
        c.op === "upsert" ? { rows: tres } : { rows: [] },
      profiles: perfis(),
      creator_profiles: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      redes: ["instagram", "tiktok", "linkedin", "tiktok"],
      note: "",
    });
    expect(r.status).toBe(201);
    expect(
      r.body.data.marcacoes.map((m: { network: string }) => m.network),
    ).toEqual(["instagram", "tiktok", "linkedin"]);
    expect(r.body.data.ja_existiam).toEqual([]);
    const escritas = escritasEm("creator_calendar_events");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].op).toBe("upsert");
    // Repetida no corpo e descartada: tres linhas, nao quatro.
    expect(escritas[0].payloadLote).toHaveLength(3);
    expect(escritas[0].payloadLote?.map((l) => l.network)).toEqual([
      "instagram",
      "tiktok",
      "linkedin",
    ]);
  });

  it("duas redes com uma ja marcada: cria uma, reporta a outra em ja_existiam, e a linha leva a cor do perfil", async () => {
    montar({
      creators: concessaoAtiva(),
      // O banco pula a duplicada (ignoreDuplicates) e devolve so a nova.
      creator_calendar_events: (c) =>
        c.op === "upsert"
          ? { rows: [{ ...MARCACAO, network: "linkedin" }] }
          : { rows: [] },
      profiles: perfis(),
      creator_profiles: respostaQueFiltra([
        { user_id: UID, calendar_color: "cyan" },
      ]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      redes: ["instagram", "linkedin"],
    });
    expect(r.status).toBe(201);
    expect(r.body.data.marcacoes).toHaveLength(1);
    expect(r.body.data.marcacoes[0].network).toBe("linkedin");
    expect(r.body.data.marcacoes[0].calendar_color).toBe("cyan");
    expect(r.body.data.ja_existiam).toEqual(["instagram"]);
  });

  it("todas ja marcadas: 409 event_already_marked, como sempre", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: (c) =>
        c.op === "upsert" ? { rows: [] } : { rows: [] },
      profiles: perfis(),
      creator_profiles: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      redes: ["instagram"],
    });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("event_already_marked");
  });

  it("redes vazias, rede fora da lista ou sem rede nenhuma: 400 invalid_network", async () => {
    for (const corpo of [
      { redes: [] },
      { redes: ["youtube"] },
      { redes: ["instagram", "x"] },
      { network: "youtube" },
      {},
    ]) {
      montar({
        creators: concessaoAtiva(),
        creator_calendar_events: { rows: [] },
      });
      estado.usuario = USUARIO;
      const r = await chamar("POST", "/calendar", {
        event_date: DIA_MARCADO,
        ...corpo,
      });
      expect(r.status, JSON.stringify(corpo)).toBe(400);
      expect(r.body.error.code).toBe("invalid_network");
      expect(escritasEm("creator_calendar_events")).toHaveLength(0);
    }
  });

  it("nota vazia vira null, e nao erro: marcar sem assunto vale", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: (c) =>
        c.op === "upsert"
          ? { rows: [{ ...MARCACAO, note: null }] }
          : { rows: [] },
      profiles: perfis(),
      creator_profiles: respostaQueFiltra([]),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      network: "tiktok",
      note: "   ",
    });
    expect(r.status).toBe(201);
    // O lote INTEIRO, e nao so `note`: fixa todas as colunas de uma vez.
    expect(escritasEm("creator_calendar_events")[0].payloadLote).toEqual([
      {
        user_id: UID,
        event_date: DIA_MARCADO,
        network: "tiktok",
        note: null,
      },
    ]);
  });

  it("dia antes do piso (12/09/2026): 400 date_out_of_window, nada gravado; ontem, no piso, passa", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: "2026-09-12",
      network: "instagram",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("date_out_of_window");
    expect(escritasEm("creator_calendar_events")).toHaveLength(0);

    // Ontem, e o proprio piso: marcaveis (lote 10d, janela retroativa).
    for (const dia of [DIA_PASSADO, "2026-09-13"]) {
      montar({
        creators: concessaoAtiva(),
        creator_calendar_events: (c) =>
          c.op === "upsert"
            ? { rows: [{ ...MARCACAO, event_date: dia }] }
            : { rows: [] },
        profiles: perfis(),
        creator_profiles: respostaQueFiltra([]),
      });
      estado.usuario = USUARIO;
      const ok = await chamar("POST", "/calendar", {
        event_date: dia,
        network: "instagram",
      });
      expect(ok.status, dia).toBe(201);
    }
  });

  it("dia alem da janela de 90 dias: 400 date_out_of_window", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: somarDiaCivil(HOJE_BR, 91),
      network: "instagram",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("date_out_of_window");
  });

  it("rede fora da lista: 400 invalid_network, nada gravado", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      network: "youtube",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_network");
    expect(escritasEm("creator_calendar_events")).toHaveLength(0);
  });

  it("nota acima do teto: 400 invalid_note", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      network: "instagram",
      note: "a".repeat(141),
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_note");
  });

  it("23505 de outra constraint no upsert NAO vira 409: e 500 (a duplicada do dia o banco pula, nao lanca)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: (c) =>
        c.op === "upsert"
          ? {
              error: {
                code: "23505",
                message:
                  'duplicate key value violates unique constraint "outra_coisa_key"',
              },
            }
          : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/calendar", {
      event_date: DIA_MARCADO,
      network: "instagram",
    });
    expect(r.status).toBe(500);
    expect(r.body.error.code).toBe("db_error");
  });
});

describe("DELETE /api/creator/calendar/:id", () => {
  it("apaga a propria, com o dono dentro do proprio DELETE", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [{ id: EVENTO_ID }] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", `/calendar/${EVENTO_ID}`);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ data: { id: EVENTO_ID } });
    const escritas = escritasEm("creator_calendar_events");
    expect(escritas[0].op).toBe("delete");
    expect(escritas[0].filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
      { tipo: "eq", coluna: "id", valor: EVENTO_ID },
    ]);
  });

  it("marcacao de outra pessoa: 404, porque o delete nao alcanca", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", `/calendar/${EVENTO_ID}`);
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("event_not_found");
  });

  it("id invalido: 400, sem tocar no banco", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("DELETE", "/calendar/nao-e-uuid");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_event_id");
    expect(double.de("creator_calendar_events")).toHaveLength(0);
  });
});

describe("POST /api/creator/calendar/:id/collab", () => {
  it("marcacao de dia passado (lote 10d): 400 collab_event_in_past, nada gravado nem avisado", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: {
        rows: [{ ...MARCACAO_DE_OUTRO, event_date: DIA_PASSADO }],
      },
      creator_collab_requests: { rows: [] },
      profiles: perfis(),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {
      message: "bora?",
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("collab_event_in_past");
    expect(escritasEm("creator_collab_requests")).toHaveLength(0);
  });

  it("pede collab e grava o dono VINDO DA MARCACAO, nao do corpo", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO_DE_OUTRO] },
      creator_collab_requests: (c) =>
        c.op === "insert"
          ? { rows: [{ ...PEDIDO, requester_id: UID, owner_id: OUTRO_UID }] }
          : { rows: [] },
      profiles: perfis(),
      ...avisoOk(),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {
      message: "  bora?  ",
      owner_id: "tentativa-de-forjar",
    });
    expect(r.status).toBe(201);
    const escritas = escritasEm("creator_collab_requests");
    expect(escritas).toHaveLength(1);
    expect(escritas[0].payload).toEqual({
      event_id: EVENTO_ID,
      requester_id: UID,
      owner_id: OUTRO_UID,
      message: "bora?",
    });
    // O AVISO ACONTECE, e chega a quem tem de chegar: o destinatario e o DONO
    // da marcacao (resolvido pelo e-mail em `profiles`), e nao quem pediu.
    // Sem esta assercao, quebrar o aviso amanha deixaria a suite verde, que e
    // exatamente o defeito que o filtro `not.is` acabou de expor no dublê.
    expect(escritasEm("notifications")).toHaveLength(1);
    const destinatarios = escritasEm("notification_recipients");
    expect(destinatarios).toHaveLength(1);
    expect(destinatarios[0].payload).toEqual({
      notification_id: "notif-1",
      user_id: OUTRO_UID,
    });
  });

  it("collab na PROPRIA marcacao: 400 own_event, nada gravado", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO] },
      creator_collab_requests: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {});
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("own_event");
    expect(escritasEm("creator_collab_requests")).toHaveLength(0);
  });

  it("marcacao que nao existe: 404 event_not_found", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [] },
      creator_collab_requests: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {});
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("event_not_found");
    expect(escritasEm("creator_collab_requests")).toHaveLength(0);
  });

  it("no teto do dia: 429 collab_daily_limit, e nada e gravado", async () => {
    const cincoDeHoje = Array.from({ length: 5 }, (_, i) => ({ id: `p-${i}` }));
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO_DE_OUTRO] },
      creator_collab_requests: (c) =>
        c.op === "insert" ? { rows: [PEDIDO] } : { rows: cincoDeHoje },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {});
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe("collab_daily_limit");
    expect(escritasEm("creator_collab_requests")).toHaveLength(0);
  });

  it("pedir duas vezes na mesma marcacao: 409 pelo nome da constraint", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO_DE_OUTRO] },
      creator_collab_requests: (c) =>
        c.op === "insert"
          ? {
              error: {
                code: "23505",
                message:
                  'duplicate key value violates unique constraint "creator_collab_unica_por_evento"',
              },
            }
          : { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {});
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("collab_already_requested");
  });

  it("recado acima do teto: 400 invalid_message, sem nem ler a marcacao", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO_DE_OUTRO] },
      creator_collab_requests: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {
      message: "a".repeat(301),
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_message");
    expect(escritasEm("creator_collab_requests")).toHaveLength(0);
  });

  it("falha no AVISO nao desfaz o pedido: ainda e 201", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    montar({
      creators: concessaoAtiva(),
      creator_calendar_events: { rows: [MARCACAO_DE_OUTRO] },
      creator_collab_requests: (c) =>
        c.op === "insert"
          ? { rows: [{ ...PEDIDO, requester_id: UID, owner_id: OUTRO_UID }] }
          : { rows: [] },
      profiles: perfis(),
      // A notificacao quebra: o pedido ja esta gravado e continua de pe.
      notifications: { error: { message: "timeout" } },
      notification_recipients: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/calendar/${EVENTO_ID}/collab`, {});
    expect(r.status).toBe(201);
    expect(escritasEm("creator_collab_requests")).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });
});

describe("GET /api/creator/collabs", () => {
  it("separa os recebidos dos enviados", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_collab_requests: respostaQueFiltra([
        PEDIDO,
        {
          ...PEDIDO,
          id: "2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
          requester_id: UID,
          owner_id: OUTRO_UID,
        },
      ]),
      creator_calendar_events: { rows: [MARCACAO] },
      profiles: perfis(),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/collabs");
    expect(r.status).toBe(200);
    expect(r.body.data.recebidos).toHaveLength(1);
    expect(r.body.data.recebidos[0].id).toBe(PEDIDO_ID);
    // O outro lado do pedido recebido e quem pediu.
    expect(r.body.data.recebidos[0].outra_pessoa.user_id).toBe(OUTRO_UID);
    expect(r.body.data.enviados).toHaveLength(1);
  });

  it("pedido cuja marcacao sumiu fica FORA da lista, com aviso no log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    montar({
      creators: concessaoAtiva(),
      creator_collab_requests: respostaQueFiltra([PEDIDO]),
      // A marcacao do pedido nao existe mais.
      creator_calendar_events: { rows: [] },
      profiles: perfis(),
    });
    estado.usuario = USUARIO;
    const r = await chamar("GET", "/collabs");
    expect(r.status).toBe(200);
    expect(r.body.data.recebidos).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

describe("POST /api/creator/collabs/:id/responder", () => {
  it("aceita: 200, e o status pendente entra no proprio UPDATE", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_collab_requests: (c) =>
        c.op === "update"
          ? { rows: [{ ...PEDIDO, status: "aceita", responded_at: AGORA_ISO }] }
          : { rows: [] },
      creator_calendar_events: { rows: [MARCACAO] },
      profiles: perfis(),
      ...avisoOk(),
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/collabs/${PEDIDO_ID}/responder`, {
      aceita: true,
    });
    expect(r.status).toBe(200);
    expect(r.body.data.pedido.status).toBe("aceita");
    const escritas = escritasEm("creator_collab_requests");
    expect(escritas[0].op).toBe("update");
    // Sem o `status = pendente` no filtro, duas respostas simultaneas fariam a
    // segunda sobrescrever a primeira.
    expect(escritas[0].filtros).toEqual([
      { tipo: "eq", coluna: "id", valor: PEDIDO_ID },
      { tipo: "eq", coluna: "owner_id", valor: UID },
      { tipo: "eq", coluna: "status", valor: "pendente" },
    ]);
    // Quem e avisado da RESPOSTA e quem pediu, e nao o dono que respondeu.
    expect(escritasEm("notifications")).toHaveLength(1);
    expect(escritasEm("notification_recipients")[0].payload).toEqual({
      notification_id: "notif-1",
      user_id: OUTRO_UID,
    });
  });

  it("corpo sem booleano: 400 invalid_body, e NADA e gravado", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_collab_requests: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/collabs/${PEDIDO_ID}/responder`, {});
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_body");
    expect(escritasEm("creator_collab_requests")).toHaveLength(0);
  });

  it("pedido ja respondido: 409 collab_already_answered", async () => {
    montar({
      creators: concessaoAtiva(),
      // O update nao alcanca (ja nao esta pendente), mas o pedido existe.
      creator_collab_requests: (c) =>
        c.op === "update" ? { rows: [] } : { rows: [PEDIDO] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/collabs/${PEDIDO_ID}/responder`, {
      aceita: false,
    });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("collab_already_answered");
  });

  it("pedido inexistente (ou de outro dono): 404 collab_not_found", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_collab_requests: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", `/collabs/${PEDIDO_ID}/responder`, {
      aceita: true,
    });
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("collab_not_found");
  });

  it("id invalido: 400, sem tocar no banco", async () => {
    montar({
      creators: concessaoAtiva(),
      creator_collab_requests: { rows: [] },
    });
    estado.usuario = USUARIO;
    const r = await chamar("POST", "/collabs/nao-e-uuid/responder", {
      aceita: true,
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_collab_id");
    expect(double.de("creator_collab_requests")).toHaveLength(0);
  });
});
