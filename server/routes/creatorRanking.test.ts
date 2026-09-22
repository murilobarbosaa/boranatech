import { Router } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * RANKING MENSAL (lote 11): GET /api/creator/ranking e a montagem do mes.
 *
 * A funcao SQL e dublada pelo `rpcImpl` do double: o teste controla as
 * contagens que "o banco" devolve e afirma os pontos, o desempate, quem nao
 * pontuou no fim com zero, o `eu` de quem olha, o mes fechado e o cache por
 * mes. O `requireAuth` e o real, com `req.user` posto por um envelope, como
 * nos outros testes do creator.
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
// O avatar (lote 11b) vem do resolvedor do site, dublado: Ana com foto, Bia
// com iniciais configuradas, o resto no padrao.
vi.mock("../lib/avatarResolver", () => ({
  resolveAvatars: async (ids: string[]) =>
    ids.map((userId) => {
      if (userId === "11111111-1111-1111-1111-111111111111") {
        return {
          userId,
          name: "Ana",
          mode: "photo",
          avatarUrl: "https://a/ana.png",
          icon: null,
          bg: null,
          border: "pro-holo",
        };
      }
      if (userId === "22222222-2222-2222-2222-222222222222") {
        return {
          userId,
          name: "Bia",
          mode: "icon",
          avatarUrl: null,
          icon: "rocket",
          bg: "green",
          border: "classic",
        };
      }
      return {
        userId,
        name: "",
        mode: "icon",
        avatarUrl: null,
        icon: null,
        bg: null,
        border: null,
      };
    }),
}));

import { diaBrasilia } from "../../shared/brasiliaDay";
import {
  calcularPontos,
  CONTAGENS_ZERADAS,
  mesDoDia,
  mesVizinho,
  type ContagensDoRanking,
  type RankingDoMes,
} from "../../shared/creatorRanking";
import {
  montarRanking,
  personalizarRanking,
  rankingParaOAdmin,
  type RankingMontado,
  resolverMesDoRanking,
} from "../lib/creatorRanking";
import {
  criarSupabaseDouble,
  respostaQueFiltra,
  type Chamada,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import { criarClienteRota } from "./adminTestClient";
import creatorRouter from "./creator";

const ANA = "11111111-1111-1111-1111-111111111111";
const BIA = "22222222-2222-2222-2222-222222222222";
const CAIO = "33333333-3333-3333-3333-333333333333";
const DUDA = "44444444-4444-4444-4444-444444444444";
const SAIU = "55555555-5555-5555-5555-555555555555";
// Saiu do programa e nao pontuou (lote 11j): nao aparece em mes nenhum.
const SAIU_ZERADO = "77777777-7777-7777-7777-777777777777";
const ELI = "66666666-6666-6666-6666-666666666666";

const USUARIO = { id: BIA, email: "bia@exemplo.com", role: "authenticated" };

// Data FIXA para a montagem (o `hoje` e argumento), e a data REAL para a rota,
// que le o relogio: os meses dela sao calculados a partir de agora, para o
// teste nao virar vermelho na virada do mes.
const HOJE = "2026-09-20";
const MES_ATUAL = mesDoDia(diaBrasilia(new Date().toISOString())!);
const MES_ANTERIOR = mesVizinho(MES_ATUAL, -1);
const MES_SEGUINTE = mesVizinho(MES_ATUAL, 1);

const CREATORS = [
  {
    id: "c-ana",
    user_id: ANA,
    kind: "afiliado",
    granted_at: "2026-07-16T20:21:27.962215+00:00",
    revoked_at: null,
  },
  {
    id: "c-bia",
    user_id: BIA,
    kind: "afiliado",
    granted_at: "2026-08-01T12:00:00+00:00",
    revoked_at: null,
  },
  {
    id: "c-caio",
    user_id: CAIO,
    kind: "afiliado",
    granted_at: "2026-08-02T12:00:00+00:00",
    revoked_at: null,
  },
  {
    id: "c-duda",
    user_id: DUDA,
    kind: "afiliado",
    granted_at: "2026-09-01T12:00:00+00:00",
    revoked_at: null,
  },
  {
    id: "c-saiu",
    user_id: SAIU,
    kind: "afiliado",
    granted_at: "2026-07-20T12:00:00+00:00",
    revoked_at: "2026-09-10T12:00:00+00:00",
  },
  {
    id: "c-saiu-zerado",
    user_id: SAIU_ZERADO,
    kind: "afiliado",
    granted_at: "2026-07-21T12:00:00+00:00",
    revoked_at: "2026-09-11T12:00:00+00:00",
  },
  // Influencer ativo (lote 11b): fora do ranking, mesmo pontuando.
  {
    id: "c-eli",
    user_id: ELI,
    kind: "influencer",
    granted_at: "2026-07-16T17:54:24+00:00",
    revoked_at: null,
  },
];

const PROFILES = [
  { user_id: ANA, name: "Ana", handle: "ana", avatar_url: "https://a/ana.png" },
  { user_id: BIA, name: "Bia", handle: "bia", avatar_url: null },
  { user_id: CAIO, name: null, handle: "caio", avatar_url: null },
  { user_id: DUDA, name: "Duda", handle: null, avatar_url: null },
];

const CREATOR_PROFILES = [
  {
    user_id: ANA,
    instagram_handle: "ana.cria",
    tiktok_handle: "ana.tk",
    calendar_color: "rose",
    visible_to_creators: true,
  },
  // Bia NAO consentiu (lote 11j): para os outros creators o @ da rede dela
  // (bia.tk) da lugar ao @ da conta (bia).
  {
    user_id: BIA,
    instagram_handle: null,
    tiktok_handle: "bia.tk",
    calendar_color: "cyan",
    visible_to_creators: false,
  },
  // Caio nao tem perfil de creator: cai no @ da conta e na cor padrao, e sem
  // linha nao ha consentimento.
];

let double: ReturnType<typeof criarSupabaseDouble>;
let contagensDoBanco: Array<{ user_id: string } & ContagensDoRanking>;
let erroDaRpc: { message: string } | null;

function montar(
  tabelas: Record<
    string,
    RespostaTabela | ((c: Chamada) => RespostaTabela)
  > = {},
) {
  double = criarSupabaseDouble(
    {
      creators: respostaQueFiltra(CREATORS),
      profiles: respostaQueFiltra(PROFILES),
      creator_profiles: respostaQueFiltra(CREATOR_PROFILES),
      ...tabelas,
    },
    {},
    async (nome) => {
      if (nome !== "creator_ranking_counts") {
        throw new Error(`rpc inesperada: ${nome}`);
      }
      if (erroDaRpc) return { data: null, error: erroDaRpc };
      return { data: contagensDoBanco, error: null };
    },
  );
  estado.client = double.client;
}

function redisFalso(): FakeRedis & { memoria: Map<string, string> } {
  const memoria = new Map<string, string>();
  return {
    memoria,
    get: vi.fn(async (k: string) => memoria.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      memoria.set(k, v);
      return "OK";
    }),
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

beforeEach(() => {
  estado.redis = null;
  estado.usuario = USUARIO;
  estado.sentry = vi.fn();
  erroDaRpc = null;
  // Os PESOS vem de shared/creatorRanking.ts e mudam sem passar por aqui;
  // nenhum total e escrito a mao neste arquivo (os testes usam
  // `calcularPontos`), e o cenario de EMPATE abaixo e afirmado como empate
  // pelo proprio `calcularPontos`, para o teste acusar quando um peso novo o
  // desfizer, em vez de passar por coincidencia.
  contagensDoBanco = [
    // Ana: 1 reel, 1 venda e cliques ja com teto (o clique nao pontua).
    { user_id: ANA, ...CONTAGENS_ZERADAS, reels: 1, vendas: 1, cliques: 40 },
    // Bia: EMPATA com Ana em pontos pelos pesos atuais (3 posts + 1 reel + 2
    // cadastros), com ZERO venda e mais publicacoes que ela. E o desempate
    // por vendas que poe a Ana na frente, e nao o de publicacoes.
    {
      user_id: BIA,
      ...CONTAGENS_ZERADAS,
      ig_posts: 3,
      reels: 1,
      cadastros: 2,
      cliques: 30,
    },
    // Caio: 1 video, 1 post LinkedIn e 2 cadastros pelo link; menos que as
    // duas.
    {
      user_id: CAIO,
      ...CONTAGENS_ZERADAS,
      videos: 1,
      li_posts: 1,
      cadastros: 2,
    },
    // Quem saiu do programa pontuou, e NAO entra na lista.
    { user_id: SAIU, ...CONTAGENS_ZERADAS, vendas: 5 },
    // O influencer pontuou, e NAO entra na lista (lote 11b).
    { user_id: ELI, ...CONTAGENS_ZERADAS, vendas: 9 },
  ];
});

/** O total de alguem da fixture pela regra do shared, nunca escrito a mao. */
function pontosDe(id: string): number {
  return calcularPontos(contagensDoBanco.find((c) => c.user_id === id)!);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolverMesDoRanking", () => {
  it("sem ?mes, e o mes de hoje", () => {
    expect(resolverMesDoRanking(undefined, HOJE)).toEqual({
      ok: true,
      valor: { ano: 2026, mes: 9, chave: "2026-09" },
    });
  });

  it("aceita do primeiro mes do programa ate o atual", () => {
    expect(resolverMesDoRanking("2026-07", HOJE)).toEqual({
      ok: true,
      valor: { ano: 2026, mes: 7, chave: "2026-07" },
    });
    expect(resolverMesDoRanking("2026-09", HOJE).ok).toBe(true);
  });

  it("mes futuro, mes anterior ao programa e formato errado sao o mesmo 400", () => {
    for (const valor of [
      "2026-10",
      "2026-06",
      "2025-12",
      "setembro",
      "2026-9",
      9,
    ]) {
      expect(resolverMesDoRanking(valor, HOJE)).toEqual({
        ok: false,
        code: "month_out_of_range",
      });
    }
  });
});

describe("montarRanking", () => {
  it("chama a funcao SQL com o mes em Brasilia e o teto de cliques", async () => {
    montar();
    await montarRanking(2026, 9, HOJE);
    expect(double.rpcCalls).toEqual([
      {
        nome: "creator_ranking_counts",
        args: {
          // Meia-noite de Brasilia (UTC-3) do dia 1 e do dia 1 do mes seguinte.
          p_inicio: "2026-09-01T03:00:00.000Z",
          p_fim: "2026-10-01T03:00:00.000Z",
          p_teto_cliques_dia: 30,
        },
      },
    ]);
  });

  it("pontua, desempata e poe quem nao pontuou no fim com zero", async () => {
    montar();
    const ranking = await montarRanking(2026, 9, HOJE);
    expect(ranking.mes).toBe("2026-09");
    expect(ranking.fechado).toBe(false);
    // Data de fechamento fixa (Ana): fim do dia 22/10 = meia-noite de 23/10 BR.
    expect(ranking.fecha_em).toBe("2026-10-23T03:00:00.000Z");
    expect(ranking.minha_posicao).toBeNull();
    // A fixture EMPATA Ana e Bia em pontos, e Caio fica abaixo: sem estas
    // duas guardas a ordem abaixo poderia passar por outro motivo.
    expect(pontosDe(ANA)).toBe(pontosDe(BIA));
    expect(pontosDe(CAIO)).toBeLessThan(pontosDe(ANA));
    expect(
      ranking.posicoes.map((p) => [p.posicao, p.user_id, p.pontos]),
    ).toEqual([
      // Empate em pontos: Ana tem 1 venda e Bia nenhuma, entao Ana lidera,
      // mesmo com Bia tendo mais publicacoes (o desempate por publicacoes so
      // vem depois do de vendas).
      [1, ANA, pontosDe(ANA)],
      [2, BIA, pontosDe(BIA)],
      [3, CAIO, pontosDe(CAIO)],
      // Duda esta ativa e nao pontuou: fim da lista, zero.
      [4, DUDA, 0],
    ]);
    // Quem foi revogado nao aparece no mes CORRENTE, mesmo tendo linha na
    // contagem; e a leitura de creators e UMA, so dos ativos (lote 11j: os
    // revogados so sao lidos em mes fechado).
    expect(ranking.posicoes.some((p) => p.user_id === SAIU)).toBe(false);
    expect(ranking.posicoes.every((p) => p.saiu_do_programa === false)).toBe(
      true,
    );
    expect(
      double
        .de("creators")
        .some((c) => c.filtros.some((f) => f.tipo === "not.is")),
    ).toBe(false);
    // Nem o influencer (lote 11b): a leitura de creators filtra o kind.
    expect(ranking.posicoes.some((p) => p.user_id === ELI)).toBe(false);
    expect(double.de("creators")[0].filtros).toEqual(
      expect.arrayContaining([
        { tipo: "is", coluna: "revoked_at", valor: null },
        { tipo: "eq", coluna: "kind", valor: "afiliado" },
      ]),
    );
  });

  it("expoe de cada pessoa o mesmo que o calendario: nome, @, avatar e cor", async () => {
    montar();
    const ranking = await montarRanking(2026, 9, HOJE);
    // Ordem: Ana na frente de Bia pelo desempate por vendas.
    const [ana, bia, caio, duda] = ranking.posicoes;
    expect(bia).toMatchObject({
      name: "Bia",
      handle: "bia.tk",
      rede_do_handle: "tiktok",
      avatar_url: null,
      // O avatar como o site o desenha (lote 11b).
      avatar: {
        mode: "icon",
        avatar_url: null,
        icon: "rocket",
        bg: "green",
        border: "classic",
      },
      calendar_color: "cyan",
      contagens: { publicacoes: 4, vendas: 0, cliques: 30, cadastros: 2 },
      eu: false,
    });
    // O primeiro @ cadastrado e o do Instagram.
    expect(ana).toMatchObject({
      handle: "ana.cria",
      rede_do_handle: "instagram",
      avatar_url: "https://a/ana.png",
      avatar: {
        mode: "photo",
        avatar_url: "https://a/ana.png",
        border: "pro-holo",
      },
      calendar_color: "rose",
      contagens: { publicacoes: 1, vendas: 1, cliques: 40, cadastros: 0 },
    });
    // Sem perfil de creator: o @ da conta, rede nula, cor padrao.
    expect(caio).toMatchObject({
      name: null,
      handle: "caio",
      rede_do_handle: null,
      calendar_color: "violet",
      pontos: calcularPontos(contagensDoBanco.find((c) => c.user_id === CAIO)!),
      contagens: { publicacoes: 2, vendas: 0, cliques: 0, cadastros: 2 },
      avatar: {
        mode: "icon",
        avatar_url: null,
        icon: null,
        bg: null,
        border: null,
      },
    });
    expect(duda).toMatchObject({ name: "Duda", handle: null, pontos: 0 });
    // Uma consulta por tabela, e nao uma por pessoa.
    expect(double.de("profiles")).toHaveLength(1);
    expect(double.de("creator_profiles")).toHaveLength(1);
    // A montagem e CRUA (o @ da rede da Bia esta la) e diz quem nao consentiu,
    // com o @ da conta de cada um: so a Ana ligou o consentimento; Caio e
    // Duda nem tem linha de perfil.
    expect(ranking.ocultos).toEqual([
      { user_id: BIA, handle_da_conta: "bia" },
      { user_id: CAIO, handle_da_conta: "caio" },
      { user_id: DUDA, handle_da_conta: null },
    ]);
  });

  it("mes anterior vem fechado, sem fecha_em", async () => {
    montar();
    const ranking = await montarRanking(2026, 8, HOJE);
    expect(ranking.mes).toBe("2026-08");
    expect(ranking.fechado).toBe(true);
    expect(ranking.fecha_em).toBeNull();
    expect(double.rpcCalls[0].args).toMatchObject({
      p_inicio: "2026-08-01T03:00:00.000Z",
      p_fim: "2026-09-01T03:00:00.000Z",
    });
  });

  it("mes FECHADO e congelado (lote 11j): quem saiu do programa depois de pontuar fica, marcado; quem saiu sem pontuar nao aparece", async () => {
    montar();
    const ranking = await montarRanking(2026, 8, HOJE);
    // SAIU: 5 vendas, a frente de todo mundo pelos pesos atuais, mesmo
    // revogado em 10/09. A guarda diz isso pela regra, nao por um numero.
    expect(pontosDe(SAIU)).toBeGreaterThan(pontosDe(ANA));
    expect(
      ranking.posicoes.map((p) => [p.posicao, p.user_id, p.saiu_do_programa]),
    ).toEqual([
      [1, SAIU, true],
      // O desempate de sempre: Ana e Bia empatadas, Ana com a venda.
      [2, ANA, false],
      [3, BIA, false],
      [4, CAIO, false],
      [5, DUDA, false],
    ]);
    expect(ranking.posicoes[0]).toMatchObject({
      pontos: pontosDe(SAIU),
      name: null,
      handle: null,
    });
    expect(ranking.posicoes.some((p) => p.user_id === SAIU_ZERADO)).toBe(false);
    // Alem dos ativos, o mes fechado le os revogados (so afiliados).
    const revogados = double
      .de("creators")
      .filter((c) => c.filtros.some((f) => f.tipo === "not.is"));
    expect(revogados.length).toBeGreaterThan(0);
    expect(revogados[0].filtros).toEqual(
      expect.arrayContaining([
        { tipo: "not.is", coluna: "revoked_at", valor: null },
        { tipo: "eq", coluna: "kind", valor: "afiliado" },
      ]),
    );
    // Nome, @ e perfil de quem saiu entram no mesmo lote dos ativos.
    expect(double.de("profiles")).toHaveLength(1);
    expect(double.de("profiles")[0].filtros[0].valor).toContain(SAIU);
  });

  it("personalizarRanking marca quem olha, sem mexer no objeto base", () => {
    const base: RankingMontado = {
      mes: "2026-09",
      fechado: false,
      fecha_em: "2026-10-01T03:00:00.000Z",
      posicoes: [
        {
          posicao: 1,
          user_id: ANA,
          name: "Ana",
          handle: "ana",
          rede_do_handle: null,
          avatar_url: null,
          calendar_color: "violet",
          pontos: 10,
          contagens: { publicacoes: 1, vendas: 0, cliques: 0, cadastros: 0 },
          eu: false,
        },
        {
          posicao: 2,
          user_id: BIA,
          name: "Bia",
          handle: "bia",
          rede_do_handle: null,
          avatar_url: null,
          calendar_color: "violet",
          pontos: 0,
          contagens: { publicacoes: 0, vendas: 0, cliques: 0, cadastros: 0 },
          eu: false,
        },
      ],
      minha_posicao: null,
      ocultos: [],
    };
    const meu = personalizarRanking(base, BIA);
    expect(meu.posicoes.map((p) => p.eu)).toEqual([false, true]);
    expect(meu.minha_posicao?.posicao).toBe(2);
    expect(personalizarRanking(base, CAIO).minha_posicao).toBeNull();
    expect(base.posicoes.every((p) => !p.eu)).toBe(true);
    expect(base.minha_posicao).toBeNull();
    // `ocultos` e da montagem, nao da resposta.
    expect("ocultos" in meu).toBe(false);
  });

  it("personalizarRanking aplica o consentimento (lote 11j): o @ da rede de quem esta em ocultos vira o @ da conta, menos para a propria pessoa; o admin ve tudo", () => {
    const base: RankingMontado = {
      mes: "2026-09",
      fechado: false,
      fecha_em: "2026-10-01T03:00:00.000Z",
      posicoes: [
        {
          posicao: 1,
          user_id: ANA,
          name: "Ana",
          handle: "ana.cria",
          rede_do_handle: "instagram",
          avatar_url: null,
          calendar_color: "rose",
          pontos: 10,
          contagens: { publicacoes: 1, vendas: 0, cliques: 0, cadastros: 0 },
          eu: false,
        },
      ],
      minha_posicao: null,
      ocultos: [{ user_id: ANA, handle_da_conta: "ana" }],
    };
    const paraBia = personalizarRanking(base, BIA);
    expect(paraBia.posicoes[0]).toMatchObject({
      name: "Ana",
      handle: "ana",
      rede_do_handle: null,
    });
    const paraAna = personalizarRanking(base, ANA);
    expect(paraAna.posicoes[0]).toMatchObject({
      handle: "ana.cria",
      rede_do_handle: "instagram",
      eu: true,
    });
    expect(rankingParaOAdmin(base).posicoes[0]).toMatchObject({
      handle: "ana.cria",
      rede_do_handle: "instagram",
      eu: false,
    });
    expect("ocultos" in rankingParaOAdmin(base)).toBe(false);
    // Cache gravado antes do lote 11j, sem `ocultos`: nada e escondido.
    const { ocultos: _semUso, ...antigo } = base;
    void _semUso;
    expect(personalizarRanking(antigo, BIA).posicoes[0].handle).toBe(
      "ana.cria",
    );
    // O objeto do cache nao muda.
    expect(base.posicoes[0].handle).toBe("ana.cria");
  });
});

describe("GET /api/creator/ranking", () => {
  it("401 sem usuario, 403 sem concessao", async () => {
    estado.usuario = null;
    montar();
    expect((await chamar("GET", "/ranking")).status).toBe(401);

    estado.usuario = {
      id: SAIU,
      email: "x@exemplo.com",
      role: "authenticated",
    };
    montar();
    const res = await chamar("GET", "/ranking");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("not_creator");
  });

  it("403 ranking_not_available para o influencer, sem montar nada (lote 11b)", async () => {
    estado.usuario = {
      id: ELI,
      email: "eli@exemplo.com",
      role: "authenticated",
    };
    montar();
    const res = await chamar("GET", "/ranking");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ranking_not_available");
    expect(double.rpcCalls).toHaveLength(0);
  });

  it("200: o mes atual, com o viewer marcado e a linha dele em minha_posicao", async () => {
    montar();
    const res = await chamar("GET", "/ranking");
    expect(res.status).toBe(200);
    const data = res.body.data as RankingDoMes;
    expect(data.mes).toBe(MES_ATUAL);
    // Viewer e a Bia, agora em 2o (Ana lidera com os valores da Ana).
    expect(data.posicoes.map((p) => [p.posicao, p.eu])).toEqual([
      [1, false],
      [2, true],
      [3, false],
      [4, false],
    ]);
    expect(data.minha_posicao).toMatchObject({ posicao: 2, user_id: BIA });
    // Consentimento (lote 11j), na visao da Bia: o proprio @ da rede dela
    // aparece mesmo sem consentir; o da Ana aparece porque a Ana consentiu; o
    // do Caio e o @ da conta (sem linha de perfil), que nao esta sob
    // consentimento e fica como esta.
    const porId = new Map(data.posicoes.map((p) => [p.user_id, p]));
    expect(porId.get(BIA)).toMatchObject({
      handle: "bia.tk",
      rede_do_handle: "tiktok",
    });
    expect(porId.get(ANA)).toMatchObject({
      handle: "ana.cria",
      rede_do_handle: "instagram",
    });
    expect(porId.get(CAIO)).toMatchObject({
      name: null,
      handle: "caio",
      rede_do_handle: null,
    });
    expect("ocultos" in data).toBe(false);
  });

  it("?mes= abre um mes anterior, fechado, com quem saiu do programa marcado", async () => {
    montar();
    const res = await chamar("GET", `/ranking?mes=${MES_ANTERIOR}`);
    expect(res.status).toBe(200);
    expect(res.body.data.mes).toBe(MES_ANTERIOR);
    expect(res.body.data.fechado).toBe(true);
    expect(res.body.data.fecha_em).toBeNull();
    const data = res.body.data as RankingDoMes;
    expect(data.posicoes[0]).toMatchObject({
      user_id: SAIU,
      saiu_do_programa: true,
      eu: false,
    });
    expect(data.posicoes.some((p) => p.user_id === SAIU_ZERADO)).toBe(false);
  });

  it("400 month_out_of_range para mes futuro, anterior ao programa ou invalido", async () => {
    montar();
    for (const mes of [MES_SEGUINTE, "2026-06", "abc"]) {
      const res = await chamar("GET", `/ranking?mes=${mes}`);
      expect(res.status, mes).toBe(400);
      expect(res.body.error.code).toBe("month_out_of_range");
    }
    expect(double.rpcCalls).toHaveLength(0);
  });

  it("cache de 60 s por mes: a segunda chamada nao vai ao banco, e o `eu` e de quem chama", async () => {
    const redis = redisFalso();
    estado.redis = redis;
    montar();
    const chave = `pubcache:creator/ranking:mes=${MES_ATUAL}`;
    const primeira = await chamar("GET", `/ranking?mes=${MES_ATUAL}`);
    expect(primeira.status).toBe(200);
    expect(double.rpcCalls).toHaveLength(1);
    expect(redis.set).toHaveBeenCalledWith(chave, expect.any(String), "EX", 60);
    // O que foi guardado e NEUTRO: nenhum `eu`, nenhuma `minha_posicao`.
    const guardado = JSON.parse(redis.memoria.get(chave)!) as RankingMontado;
    expect(guardado.posicoes.every((p) => !p.eu)).toBe(true);
    expect(guardado.minha_posicao).toBeNull();
    // E CRU quanto ao consentimento (lote 11j): o @ da rede da Bia esta no
    // cache, com a lista de quem nao consentiu (e o @ da conta) ao lado; quem
    // troca e a personalizacao, e o admin le este mesmo cache vendo tudo.
    expect(guardado.posicoes.find((p) => p.user_id === BIA)?.handle).toBe(
      "bia.tk",
    );
    expect(guardado.ocultos).toEqual([
      { user_id: BIA, handle_da_conta: "bia" },
      { user_id: CAIO, handle_da_conta: "caio" },
      { user_id: DUDA, handle_da_conta: null },
    ]);

    // Outra pessoa, mesmo mes: sai do cache, com o `eu` DELA.
    estado.usuario = {
      id: ANA,
      email: "ana@exemplo.com",
      role: "authenticated",
    };
    // O requireCreator tambem le o Redis (creator_status:*); a chave dele nao
    // esta na memoria, entao cai no banco e passa.
    const segunda = await chamar("GET", `/ranking?mes=${MES_ATUAL}`);
    expect(segunda.status).toBe(200);
    expect(double.rpcCalls).toHaveLength(1);
    expect(segunda.body.data.minha_posicao).toMatchObject({
      posicao: 1,
      user_id: ANA,
    });
    // Para a Ana, o @ da rede da Bia (que nao consentiu) vira o @ da conta;
    // o dela mesma fica.
    const posicoesDaAna = (segunda.body.data as RankingDoMes).posicoes;
    expect(posicoesDaAna.find((p) => p.user_id === BIA)).toMatchObject({
      handle: "bia",
      rede_do_handle: null,
    });
    expect(posicoesDaAna.find((p) => p.user_id === ANA)?.handle).toBe(
      "ana.cria",
    );
  });

  it("erro na funcao SQL vira 500 com a mensagem de tela, sem vazar o erro", async () => {
    erroDaRpc = { message: "boom" };
    montar();
    const res = await chamar("GET", "/ranking");
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe("Erro ao carregar o ranking.");
    expect(JSON.stringify(res.body)).not.toContain("boom");
  });

  it("erro do banco na guarda: o 403 fechado dela, e o ranking nem e montado", async () => {
    montar({ creators: { rows: [], error: { message: "boom" } } });
    const res = await chamar("GET", "/ranking");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("creator_check_failed");
    expect(double.rpcCalls).toHaveLength(0);
  });
});
