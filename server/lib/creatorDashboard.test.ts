import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MONTADOR DO PAINEL DE CREATOR (server/lib/creatorDashboard.ts).
 *
 * Todos os valores esperados sao LITERAIS escritos a mao, nunca recalculados
 * pela mesma formula do codigo: um teste que refaz a conta do codigo erra junto
 * com ele.
 *
 * O `from` vem do duble do harness (valida coluna contra os tipos e contra as
 * migrations pendentes). O `rpc` e local: `creator_events_daily` e paginada
 * com `.order().range()`, e o duble do harness devolve a promessa direto, sem
 * cadeia. O rpc local registra os argumentos e os intervalos pedidos, e pode
 * capar cada pagina como o db-max-rows do PostgREST.
 */

type LinhaSerie = {
  dia: string;
  event_type: string;
  quantidade: number;
  revenue_cents: number;
  commission_cents: number;
};

type RegistroRpc = {
  nome: string;
  args: Record<string, unknown>;
  opts: unknown;
  ranges: Array<[number, number]>;
};

const estado = vi.hoisted(() => ({
  client: null as unknown as {
    from: (table: string) => unknown;
    rpc: (...args: unknown[]) => unknown;
  },
  rpc: {
    chamadas: [] as RegistroRpc[],
    porInicio: new Map<string, LinhaSerie[]>(),
    tetoPorPagina: null as number | null,
    erro: null as { message: string } | null,
  },
}));

vi.mock("./supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.client;
  },
}));

import {
  criarSupabaseDouble,
  respostaQueFiltra,
  type Chamada,
  type RespostaTabela,
} from "../routes/adminUsersHarness.test";
import {
  conversaoPct,
  montarPainelDoCreator,
  parseJanelaDoPainel,
  resolverJanelaDoPainel,
} from "./creatorDashboard";

function rpcFalso(nome: string, args: Record<string, unknown>, opts?: unknown) {
  const registro: RegistroRpc = { nome, args, opts, ranges: [] };
  estado.rpc.chamadas.push(registro);
  const linhas = estado.rpc.porInicio.get(String(args.p_from)) ?? [];
  const cadeia = {
    order: () => cadeia,
    range: async (from: number, to: number) => {
      registro.ranges.push([from, to]);
      if (estado.rpc.erro) {
        return { data: null, error: estado.rpc.erro, count: null };
      }
      let pagina = linhas.slice(from, to + 1);
      if (estado.rpc.tetoPorPagina !== null) {
        pagina = pagina.slice(0, estado.rpc.tetoPorPagina);
      }
      return { data: pagina, error: null, count: linhas.length };
    },
  };
  return cadeia;
}

// Cada PAGINA e uma chamada ao PostgREST (um POST /rpc por `.range()`), e o
// registro e por chamada, como em producao. Uma janela lida inteira aparece
// como a pagina com dados mais a pagina vazia que encerra a varredura. Os dois
// leitores abaixo agrupam por janela.
function argsDistintos(): Array<Record<string, unknown>> {
  const vistos = new Map<string, Record<string, unknown>>();
  for (const c of estado.rpc.chamadas) vistos.set(JSON.stringify(c.args), c.args);
  // Array.from e nao spread: o target do tsconfig nao habilita iterar Map.
  return Array.from(vistos.values());
}

function rangesDe(pFrom: string): Array<[number, number]> {
  return estado.rpc.chamadas
    .filter((c) => c.args.p_from === pFrom)
    .flatMap((c) => c.ranges);
}

let double: ReturnType<typeof criarSupabaseDouble>;

function montar(
  tabelas: Record<string, RespostaTabela | ((c: Chamada) => RespostaTabela)>,
) {
  double = criarSupabaseDouble(tabelas);
  estado.client = {
    from: double.client.from,
    rpc: (...a: unknown[]) =>
      rpcFalso(a[0] as string, a[1] as Record<string, unknown>, a[2]),
  };
}

// 2026-09-20 12:00 em Brasilia.
const AGORA = new Date("2026-09-20T15:00:00Z");
const UID = "11111111-1111-1111-1111-111111111111";

const CONCESSAO_ATIVA = {
  id: "c1",
  user_id: UID,
  kind: "afiliado",
  granted_at: "2026-09-01T12:00:00Z",
  revoked_at: null,
  granted_by: "admin-1",
};
const PERFIL = {
  user_id: UID,
  name: "Ana Creator",
  handle: "anacreator",
  avatar_url: null,
  email: "ana@exemplo.com",
};
const CODIGO_A = {
  id: "a1",
  user_id: UID,
  code: "ANA30",
  status: "active",
  discount_percent: 10,
  commission_percent: 30,
  clicks: 100,
  sales: 3,
  revenue_cents: 6279,
  commission_due_cents: 1884,
  commission_paid_cents: 0,
  created_at: "2026-09-01T12:00:00Z",
  notes: "contrato assinado",
};
const CODIGO_B = {
  id: "b1",
  user_id: UID,
  code: "ANAYT",
  status: "active",
  discount_percent: 10,
  commission_percent: 20,
  clicks: 40,
  sales: 0,
  revenue_cents: 0,
  commission_due_cents: 0,
  commission_paid_cents: 0,
  created_at: "2026-09-02T12:00:00Z",
  notes: null,
};
const EVENTOS = [
  {
    affiliate_id: "a1",
    event_type: "click",
    occurred_at: "2026-09-10T12:00:00Z",
  },
  {
    affiliate_id: "a1",
    event_type: "sale",
    occurred_at: "2026-09-15T18:00:00Z",
  },
  {
    affiliate_id: "b1",
    event_type: "click",
    occurred_at: "2026-09-18T01:30:00Z",
  },
];

const INICIO_7D = "2026-09-14T03:00:00.000Z";
const INICIO_ANTERIOR_7D = "2026-09-07T03:00:00.000Z";

const SERIE_7D: LinhaSerie[] = [
  {
    dia: "2026-09-15",
    event_type: "click",
    quantidade: 5,
    revenue_cents: 0,
    commission_cents: 0,
  },
  {
    dia: "2026-09-15",
    event_type: "sale",
    quantidade: 1,
    revenue_cents: 2093,
    commission_cents: 628,
  },
  {
    dia: "2026-09-17",
    event_type: "click",
    quantidade: 2,
    revenue_cents: 0,
    commission_cents: 0,
  },
];
const SERIE_ANTERIOR_7D: LinhaSerie[] = [
  {
    dia: "2026-09-10",
    event_type: "click",
    quantidade: 4,
    revenue_cents: 0,
    commission_cents: 0,
  },
];

const ZERO = {
  clicks: 0,
  checkouts: 0,
  sales: 0,
  revenue_cents: 0,
  commission_cents: 0,
};

function montarPadrao(
  sobrescrever: Record<
    string,
    RespostaTabela | ((c: Chamada) => RespostaTabela)
  > = {},
) {
  montar({
    creators: respostaQueFiltra([CONCESSAO_ATIVA]),
    profiles: respostaQueFiltra([PERFIL]),
    affiliates: respostaQueFiltra([CODIGO_B, CODIGO_A]),
    creator_events: respostaQueFiltra(EVENTOS),
    ...sobrescrever,
  });
}

beforeEach(() => {
  estado.rpc.chamadas = [];
  estado.rpc.porInicio = new Map([
    [INICIO_7D, SERIE_7D],
    [INICIO_ANTERIOR_7D, SERIE_ANTERIOR_7D],
  ]);
  estado.rpc.tetoPorPagina = null;
  estado.rpc.erro = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function painelOk(
  janela: "7d" | "30d" | "90d" | "all",
  visao: "creator" | "admin",
) {
  const r = await montarPainelDoCreator(UID, janela, visao, AGORA);
  if (!r.ok) throw new Error(`esperava painel, veio ${r.reason}`);
  return r.painel;
}

describe("resolverJanelaDoPainel", () => {
  it("7d sao sete dias civis de Brasilia terminando hoje, meio-abertos", () => {
    expect(resolverJanelaDoPainel("7d", AGORA)).toEqual({
      primeiroDiaCivil: "2026-09-14",
      ultimoDiaCivil: "2026-09-20",
      inicioIso: "2026-09-14T03:00:00.000Z",
      fimIso: "2026-09-21T03:00:00.000Z",
      anteriorInicioIso: "2026-09-07T03:00:00.000Z",
      anteriorFimIso: "2026-09-14T03:00:00.000Z",
    });
  });

  it("22h30 de Brasilia ainda e o mesmo dia, mesmo ja sendo amanha em UTC", () => {
    const janela = resolverJanelaDoPainel(
      "7d",
      new Date("2026-09-21T01:30:00Z"),
    );
    expect(janela.ultimoDiaCivil).toBe("2026-09-20");
    expect(janela.fimIso).toBe("2026-09-21T03:00:00.000Z");
  });

  it("90d existe (o OverviewWindow do admin nao tem)", () => {
    const janela = resolverJanelaDoPainel("90d", AGORA);
    expect(janela.primeiroDiaCivil).toBe("2026-06-23");
    expect(janela.anteriorInicioIso).toBe("2026-03-25T03:00:00.000Z");
  });

  it("all nao tem inicio nem periodo anterior", () => {
    expect(resolverJanelaDoPainel("all", AGORA)).toEqual({
      primeiroDiaCivil: null,
      ultimoDiaCivil: "2026-09-20",
      inicioIso: null,
      fimIso: "2026-09-21T03:00:00.000Z",
      anteriorInicioIso: null,
      anteriorFimIso: null,
    });
  });
});

describe("parseJanelaDoPainel", () => {
  it("ausente vira 30d; valida passa; o resto e null, nunca o padrao", () => {
    expect(parseJanelaDoPainel(undefined)).toBe("30d");
    expect(parseJanelaDoPainel("90d")).toBe("90d");
    expect(parseJanelaDoPainel("all")).toBe("all");
    expect(parseJanelaDoPainel("1y")).toBeNull();
    expect(parseJanelaDoPainel("30")).toBeNull();
    expect(parseJanelaDoPainel(["7d", "30d"])).toBeNull();
  });
});

describe("conversaoPct", () => {
  it("duas casas, e null sem clique", () => {
    expect(conversaoPct(3, 140)).toBe(2.14);
    expect(conversaoPct(1, 3)).toBe(33.33);
    expect(conversaoPct(0, 0)).toBeNull();
  });
});

describe("montarPainelDoCreator: totais e codigos", () => {
  it("soma os CONTADORES dos dois codigos e calcula a conversao", async () => {
    montarPadrao();
    const painel = await painelOk("7d", "creator");

    expect(painel.totais).toEqual({
      clicks: 140,
      sales: 3,
      revenue_cents: 6279,
      commission_due_cents: 1884,
      commission_paid_cents: 0,
      conversao_pct: 2.14,
    });
    expect(painel.codigos.map((c) => c.code)).toEqual(["ANA30", "ANAYT"]);
    expect(painel.codigos.map((c) => c.commission_percent)).toEqual([30, 20]);
    expect(painel.codigos[0].link).toBe(
      "https://boranatech.com.br/planos?ref=ANA30",
    );
    expect(painel.creator.kind).toBe("afiliado");
    expect(painel.janela).toBe("7d");
  });

  it("conversao e null com zero cliques, nunca 0", async () => {
    montarPadrao({
      affiliates: respostaQueFiltra([
        { ...CODIGO_A, clicks: 0, sales: 0 },
        { ...CODIGO_B, clicks: 0 },
      ]),
    });
    const painel = await painelOk("7d", "creator");
    expect(painel.totais.clicks).toBe(0);
    expect(painel.totais.conversao_pct).toBeNull();
  });

  it("os codigos sao lidos por user_id, paginados e com contagem exata", async () => {
    montarPadrao();
    await painelOk("7d", "creator");
    const leituras = double.de("affiliates");
    expect(leituras.length).toBeGreaterThanOrEqual(1);
    expect(leituras[0].filtros).toEqual([
      { tipo: "eq", coluna: "user_id", valor: UID },
    ]);
    expect(leituras[0].ordem).toEqual(["created_at", "id"]);
  });

  it("sem codigo: totais zerados e creator_events nem e consultada", async () => {
    montarPadrao({ affiliates: respostaQueFiltra([]) });
    const painel = await painelOk("7d", "creator");
    expect(painel.codigos).toEqual([]);
    expect(painel.totais).toEqual({
      clicks: 0,
      sales: 0,
      revenue_cents: 0,
      commission_due_cents: 0,
      commission_paid_cents: 0,
      conversao_pct: null,
    });
    expect(painel.eventos.events_since).toBeNull();
    expect(double.de("creator_events")).toHaveLength(0);
    expect(estado.rpc.chamadas).toHaveLength(0);
  });
});

describe("montarPainelDoCreator: eventos", () => {
  it("serie de 7 dias com eventos em 2 dias tem 7 entradas, 5 zeradas", async () => {
    montarPadrao();
    const painel = await painelOk("7d", "creator");
    const { eventos } = painel;

    expect(eventos.serie.map((d) => d.dia)).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
    expect(
      eventos.serie.filter(
        (d) =>
          d.clicks === 0 &&
          d.checkouts === 0 &&
          d.sales === 0 &&
          d.revenue_cents === 0 &&
          d.commission_cents === 0,
      ),
    ).toHaveLength(5);
    expect(eventos.serie[1]).toEqual({
      dia: "2026-09-15",
      clicks: 5,
      checkouts: 0,
      sales: 1,
      revenue_cents: 2093,
      commission_cents: 628,
    });
    expect(eventos.serie[3]).toEqual({ dia: "2026-09-17", ...ZERO, clicks: 2 });
    expect(eventos.periodo).toEqual({
      clicks: 7,
      checkouts: 0,
      sales: 1,
      revenue_cents: 2093,
      commission_cents: 628,
    });
    expect(eventos.periodo_anterior).toEqual({ ...ZERO, clicks: 4 });
  });

  it("pede a serie ao banco com os intervalos meio-abertos e contagem exata", async () => {
    montarPadrao();
    await painelOk("7d", "creator");
    expect(argsDistintos()).toEqual([
      {
        p_affiliate_ids: ["a1", "b1"],
        p_from: "2026-09-14T03:00:00.000Z",
        p_to: "2026-09-21T03:00:00.000Z",
      },
      {
        p_affiliate_ids: ["a1", "b1"],
        p_from: "2026-09-07T03:00:00.000Z",
        p_to: "2026-09-14T03:00:00.000Z",
      },
    ]);
    expect(
      estado.rpc.chamadas.every((c) => c.nome === "creator_events_daily"),
    ).toBe(true);
    // Contagem exata em TODA pagina: e ela que prova o total no fim.
    expect(
      estado.rpc.chamadas.every(
        (c) => JSON.stringify(c.opts) === JSON.stringify({ count: "exact" }),
      ),
    ).toBe(true);
    // Janela atual: 3 linhas e a pagina vazia. Anterior: 1 linha e a vazia.
    expect(rangesDe("2026-09-14T03:00:00.000Z")).toEqual([
      [0, 999],
      [3, 1002],
    ]);
    expect(rangesDe("2026-09-07T03:00:00.000Z")).toEqual([
      [0, 999],
      [1, 1000],
    ]);
  });

  it("events_since, ultimo clique e ultima venda vem das tres consultas certas", async () => {
    montarPadrao();
    const { eventos } = await painelOk("7d", "creator");
    expect(eventos.events_since).toBe("2026-09-10T12:00:00Z");
    expect(eventos.ultimo_click_at).toBe("2026-09-18T01:30:00Z");
    expect(eventos.ultima_venda_at).toBe("2026-09-15T18:00:00Z");

    const filtrosPorLeitura = double
      .de("creator_events")
      .map((c) => [c.filtros, c.ordemDetalhe]);
    expect(filtrosPorLeitura).toEqual([
      [
        [{ tipo: "in", coluna: "affiliate_id", valor: ["a1", "b1"] }],
        [{ coluna: "occurred_at", ascending: true }],
      ],
      [
        [
          { tipo: "in", coluna: "affiliate_id", valor: ["a1", "b1"] },
          { tipo: "eq", coluna: "event_type", valor: "click" },
        ],
        [{ coluna: "occurred_at", ascending: false }],
      ],
      [
        [
          { tipo: "in", coluna: "affiliate_id", valor: ["a1", "b1"] },
          { tipo: "eq", coluna: "event_type", valor: "sale" },
        ],
        [{ coluna: "occurred_at", ascending: false }],
      ],
    ]);
  });

  it("sem nenhum evento: events_since null, serie vazia e nenhuma chamada da serie", async () => {
    montarPadrao({ creator_events: respostaQueFiltra([]) });
    const { eventos } = await painelOk("7d", "creator");
    expect(eventos.events_since).toBeNull();
    expect(eventos.serie).toEqual([]);
    expect(eventos.periodo).toEqual(ZERO);
    expect(eventos.periodo_anterior).toEqual(ZERO);
    expect(eventos.ultimo_click_at).toBeNull();
    expect(eventos.ultima_venda_at).toBeNull();
    expect(estado.rpc.chamadas).toHaveLength(0);
  });

  it("em all o periodo anterior e null, tambem sem eventos", async () => {
    montarPadrao({ creator_events: respostaQueFiltra([]) });
    const { eventos } = await painelOk("all", "creator");
    expect(eventos.periodo_anterior).toBeNull();
  });

  it("events_since dentro da janela: a serie comeca nele, sem inventar dia", async () => {
    montarPadrao({
      creator_events: respostaQueFiltra([
        {
          affiliate_id: "a1",
          event_type: "click",
          occurred_at: "2026-09-16T12:00:00Z",
        },
      ]),
    });
    const { eventos } = await painelOk("7d", "creator");
    expect(eventos.serie.map((d) => d.dia)).toEqual([
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
    // O periodo anterior inteiro e anterior ao primeiro evento: soma zero sem
    // perguntar ao banco.
    expect(eventos.periodo_anterior).toEqual(ZERO);
    expect(argsDistintos().map((a) => a.p_from)).toEqual([INICIO_7D]);
  });

  it("all: a serie vai de events_since ate hoje e o banco recebe events_since", async () => {
    montarPadrao();
    estado.rpc.porInicio = new Map([["2026-09-10T12:00:00Z", SERIE_7D]]);
    const { eventos } = await painelOk("all", "creator");
    expect(argsDistintos()).toEqual([
      {
        p_affiliate_ids: ["a1", "b1"],
        p_from: "2026-09-10T12:00:00Z",
        p_to: "2026-09-21T03:00:00.000Z",
      },
    ]);
    expect(eventos.serie).toHaveLength(11);
    expect(eventos.serie[0].dia).toBe("2026-09-10");
    expect(eventos.serie[10].dia).toBe("2026-09-20");
    expect(eventos.periodo_anterior).toBeNull();
  });

  it("pagina a serie quando o servidor capa cada pagina, e nao perde linha", async () => {
    montarPadrao();
    estado.rpc.tetoPorPagina = 2;
    const { eventos } = await painelOk("7d", "creator");
    // Tres linhas com teto de duas por pagina: 2, depois 1, depois a vazia.
    expect(rangesDe(INICIO_7D)).toEqual([
      [0, 999],
      [2, 1001],
      [3, 1002],
    ]);
    expect(eventos.periodo).toEqual({
      clicks: 7,
      checkouts: 0,
      sales: 1,
      revenue_cents: 2093,
      commission_cents: 628,
    });
  });

  it("receita e comissao entram so pela venda, nunca pelo checkout", async () => {
    montarPadrao();
    estado.rpc.porInicio = new Map([
      [
        INICIO_7D,
        [
          {
            dia: "2026-09-15",
            event_type: "checkout",
            quantidade: 2,
            revenue_cents: 4186,
            commission_cents: 1256,
          },
          {
            dia: "2026-09-15",
            event_type: "sale",
            quantidade: 1,
            revenue_cents: 2093,
            commission_cents: 628,
          },
        ],
      ],
    ]);
    const { eventos } = await painelOk("7d", "creator");
    expect(eventos.periodo).toEqual({
      clicks: 0,
      checkouts: 2,
      sales: 1,
      revenue_cents: 2093,
      commission_cents: 628,
    });
  });
});

describe("montarPainelDoCreator: visao creator e visao admin", () => {
  it("visao creator nao traz email, notas nem granted_by, e nem os pede", async () => {
    montarPadrao();
    const painel = await painelOk("7d", "creator");
    expect(Object.keys(painel.perfil)).toEqual([
      "name",
      "handle",
      "avatar_url",
    ]);
    expect(Object.keys(painel.creator)).toEqual([
      "kind",
      "granted_at",
      "revoked_at",
    ]);
    expect(painel.codigos.some((c) => "notes" in c)).toBe(false);
    expect(double.de("profiles")[0].colunas).toEqual([
      "name",
      "handle",
      "avatar_url",
    ]);
    expect(double.de("affiliates")[0].colunas).not.toContain("notes");
    expect(double.de("creators")[0].colunas).not.toContain("granted_by");
  });

  it("visao admin traz email, notas e granted_by", async () => {
    montarPadrao();
    const painel = await painelOk("7d", "admin");
    expect(painel.perfil.email).toBe("ana@exemplo.com");
    expect(painel.codigos.map((c) => c.notes)).toEqual([
      "contrato assinado",
      null,
    ]);
    expect(painel.creator.granted_by).toBe("admin-1");
  });

  it("revogado: a visao creator nao abre, a visao admin abre com revoked_at", async () => {
    const revogada = { ...CONCESSAO_ATIVA, revoked_at: "2026-09-19T12:00:00Z" };
    montarPadrao({ creators: respostaQueFiltra([revogada]) });

    const doCreator = await montarPainelDoCreator(UID, "7d", "creator", AGORA);
    expect(doCreator).toEqual({ ok: false, reason: "not_creator" });
    // Sem concessao ativa nada mais e lido.
    expect(double.chamadas.map((c) => c.table)).toEqual(["creators"]);

    const doAdmin = await painelOk("7d", "admin");
    expect(doAdmin.creator.revoked_at).toBe("2026-09-19T12:00:00Z");
  });

  it("visao admin pega a concessao MAIS RECENTE entre varias revogadas", async () => {
    montarPadrao({
      creators: respostaQueFiltra([
        {
          ...CONCESSAO_ATIVA,
          id: "c0",
          kind: "influencer",
          granted_at: "2026-01-10T12:00:00Z",
          revoked_at: "2026-02-10T12:00:00Z",
        },
        { ...CONCESSAO_ATIVA, revoked_at: "2026-09-19T12:00:00Z" },
      ]),
    });
    const painel = await painelOk("7d", "admin");
    expect(painel.creator.granted_at).toBe("2026-09-01T12:00:00Z");
    expect(painel.creator.kind).toBe("afiliado");
  });

  it("quem nunca teve concessao nao tem painel em nenhuma visao", async () => {
    montarPadrao({ creators: respostaQueFiltra([]) });
    for (const visao of ["creator", "admin"] as const) {
      const r = await montarPainelDoCreator(UID, "7d", visao, AGORA);
      expect(r).toEqual({ ok: false, reason: "not_creator" });
    }
  });
});

describe("montarPainelDoCreator: erro lanca, nunca vira zero", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("erro na leitura do perfil derruba o painel", async () => {
    montarPadrao({ profiles: { error: { message: "timeout" } } });
    await expect(
      montarPainelDoCreator(UID, "7d", "creator", AGORA),
    ).rejects.toBeTruthy();
  });

  it("erro na serie derruba o painel", async () => {
    montarPadrao();
    estado.rpc.erro = { message: "statement timeout" };
    await expect(
      montarPainelDoCreator(UID, "7d", "creator", AGORA),
    ).rejects.toMatchObject({ code: "db_error" });
  });

  it("contador nulo derruba o painel em vez de somar como zero", async () => {
    montarPadrao({
      affiliates: respostaQueFiltra([{ ...CODIGO_A, clicks: null }, CODIGO_B]),
    });
    await expect(
      montarPainelDoCreator(UID, "7d", "creator", AGORA),
    ).rejects.toThrow("clicks nao numerico");
  });

  it("tipo de evento desconhecido derruba o painel em vez de sumir", async () => {
    montarPadrao();
    estado.rpc.porInicio = new Map([
      [
        INICIO_7D,
        [
          {
            dia: "2026-09-15",
            event_type: "impression",
            quantidade: 9,
            revenue_cents: 0,
            commission_cents: 0,
          },
        ],
      ],
    ]);
    await expect(
      montarPainelDoCreator(UID, "7d", "creator", AGORA),
    ).rejects.toThrow('event_type desconhecido: "impression"');
  });
});
