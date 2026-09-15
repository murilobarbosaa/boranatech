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
      updated_at: AGORA_ISO,
    });
    expect(r.body.data.instagram_handle).toBe("ana.cria");
    expect(r.body.data.followers_updated_at).toBe(AGORA_ISO);
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
