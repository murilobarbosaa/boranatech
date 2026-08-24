import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PAINEL "ATENÇÃO NECESSÁRIA".
 *
 * O risco deste painel não é errar um número, é virar ruído. Um alerta que fica
 * aceso para sempre ensina a ignorar o painel inteiro, e aí o item que importa
 * chega junto com os que não importam.
 *
 * Por isso a maior parte deste arquivo são CONTROLES NEGATIVOS: o que NÃO deve
 * gerar item. Um teste que só verifica "past_due virou item" passa igualmente
 * num painel que transforma tudo em item.
 *
 * Nenhuma rede: Stripe e Supabase são dublês, e a Stripe é só `retrieve`/`list`.
 */

const stripeSpy = vi.hoisted(() => ({
  subs: {} as Record<string, unknown>,
  retrieveErro: null as unknown,
  charges: [] as unknown[],
}));

const supaSpy = vi.hoisted(() => ({
  subscriptions: [] as unknown[],
  orfaos: [] as unknown[],
  aiLogs: [] as unknown[],
  despesas: [] as unknown[],
  influencers: [] as unknown[],
  perfis: [] as unknown[],
  cancelamentos: [] as unknown[],
  erroSubscriptions: null as unknown,
  erroOrfaos: null as unknown,
  erroDespesas: null as unknown,
  erroInfluencers: null as unknown,
}));

vi.mock("./stripeClient", () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: async (id: string) => {
        if (stripeSpy.retrieveErro) throw stripeSpy.retrieveErro;
        const s = stripeSpy.subs[id];
        if (!s) throw new Error(`sub ${id} não registrada no dublê`);
        return s;
      },
    },
    charges: {
      list: () => ({
        [Symbol.asyncIterator]: async function* () {
          for (const c of stripeSpy.charges) yield c;
        },
      }),
    },
  }),
}));

vi.mock("./supabaseAdmin", () => {
  function builder(tabela: string) {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.in = () =>
      tabela === "profiles"
        ? Promise.resolve({ data: supaSpy.perfis, error: null })
        : q;
    q.gte = () => q;
    q.order = () => q;
    // `range` RECORTA de verdade, e isso não é capricho: `paginateRange` só
    // encerra na PÁGINA VAZIA (de propósito, para uma página curta por
    // max-rows não terminar a varredura antes da hora). Um dublê que devolve o
    // array inteiro a cada chamada trava o teste em laço infinito — foi o que
    // aconteceu na primeira versão deste arquivo.
    q.range = (from: number, to: number) => {
      if (tabela === "subscriptions" && supaSpy.erroSubscriptions) {
        return Promise.resolve({
          data: null,
          error: supaSpy.erroSubscriptions,
        });
      }
      const todas =
        tabela === "subscriptions" ? supaSpy.subscriptions : supaSpy.aiLogs;
      return Promise.resolve({
        data: todas.slice(from, to + 1),
        error: null,
      });
    };
    // `is` encerra a cadeia em DUAS tabelas diferentes (orfaos e influencers),
    // entao ele resolve pelo nome da tabela em vez de assumir uma so.
    q.is = () => {
      if (tabela === "influencers") {
        return Promise.resolve(
          supaSpy.erroInfluencers
            ? { data: null, error: supaSpy.erroInfluencers }
            : { data: supaSpy.influencers, error: null },
        );
      }
      return Promise.resolve(
        supaSpy.erroOrfaos
          ? { data: null, error: supaSpy.erroOrfaos }
          : { data: supaSpy.orfaos, error: null },
      );
    };
    q.lt = () => q;
    q.eq = () => q;
    q.not = () =>
      tabela === "subscription_cancellations"
        ? Promise.resolve({ data: supaSpy.cancelamentos, error: null })
        : q;
    q.limit = () =>
      Promise.resolve(
        supaSpy.erroDespesas
          ? { data: null, error: supaSpy.erroDespesas }
          : { data: supaSpy.despesas, error: null },
      );
    return q;
  }
  return { supabaseAdmin: { from: (t: string) => builder(t) } };
});

import {
  montarPainelDeAtencao,
  PAYOUT_JANELA_DIAS,
  SPIKE_PISO_USD,
  type FonteDeCobrancasFalhadas,
  type FonteDePayoutsFalhos,
} from "./atencaoNecessaria";

const AGORA = new Date("2026-08-14T18:00:00Z");

/** Fonte de cobranças falhadas que não fala com ninguém. */
const semFalhadas: FonteDeCobrancasFalhadas = {
  contar: async () => ({ count: 0, cents: 0 }),
};

/** Fonte de payouts falhos que não fala com ninguém. */
const semPayouts: FonteDePayoutsFalhos = {
  listar: async () => [],
};

function sub(over: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    status: "active",
    cancel_at_period_end: false,
    current_period_end: "2026-09-14T00:00:00Z",
    provider_subscription_id: "sub_1",
    plans: { code: "pro_monthly", price_cents: 2990, interval: "month" },
    ...over,
  };
}

/** Log de IA num dia civil de Brasília, ao meio-dia local. */
function log(dia: string, custo: string) {
  return { created_at: `${dia}T15:00:00Z`, cost_estimate: custo };
}

async function montar(
  over: Partial<Parameters<typeof montarPainelDeAtencao>[0]> = {},
) {
  return montarPainelDeAtencao({
    agora: AGORA,
    fonteDeCobrancasFalhadas: semFalhadas,
    fonteDePayoutsFalhos: semPayouts,
    ...over,
  });
}

beforeEach(() => {
  stripeSpy.subs = {};
  stripeSpy.retrieveErro = null;
  stripeSpy.charges = [];
  supaSpy.subscriptions = [];
  supaSpy.orfaos = [];
  supaSpy.aiLogs = [];
  supaSpy.despesas = [{ id: "despesa-1" }];
  supaSpy.influencers = [];
  supaSpy.perfis = [];
  supaSpy.cancelamentos = [];
  supaSpy.erroSubscriptions = null;
  supaSpy.erroOrfaos = null;
  supaSpy.erroDespesas = null;
  supaSpy.erroInfluencers = null;
});

describe("assinaturas", () => {
  it("past_due vira item crítico com valor e link para a Stripe", async () => {
    supaSpy.subscriptions = [sub({ status: "past_due" })];

    const p = await montar();

    expect(p.itens).toHaveLength(1);
    expect(p.itens[0]).toMatchObject({
      tipo: "assinatura_past_due",
      severidade: "critico",
      valorCents: 2990,
    });
    expect(p.itens[0].url).toContain(
      "dashboard.stripe.com/subscriptions/sub_1",
    );
  });

  it("saída agendada vira item de atenção, com a data de término", async () => {
    supaSpy.subscriptions = [sub({ cancel_at_period_end: true })];

    const p = await montar();

    expect(p.itens[0]).toMatchObject({
      tipo: "saida_agendada",
      severidade: "atencao",
    });
    // 2026-09-14T00:00:00Z é 13/09 às 21:00 em Brasília, e é ASSIM que tem de
    // aparecer: `current_period_end` é um instante (timestamptz), e para
    // instante o fuso local é o correto a exibir (ver shared/brasiliaDay.ts).
    // A primeira versão deste teste esperava 14/09 — o mesmo erro de fuso que
    // esta fase inteira existe para fechar, cometido no próprio teste dela.
    expect(p.itens[0].detalhe).toContain("13/09/2026");
  });

  it("CONTROLE NEGATIVO: assinatura ativa e saudável NÃO gera item", async () => {
    // O caso mais comum da base (99 de 103 linhas). Se ele gerasse item, o
    // painel nasceria com 99 alertas e ninguém o leria de novo.
    supaSpy.subscriptions = [sub()];

    const p = await montar();

    expect(p.itens).toEqual([]);
  });

  it("D21: cada item leva o equivalente MENSAL, além do valor nominal", async () => {
    // O painel somava valores NOMINAIS de ciclos diferentes, e R$ 222,00/ano com
    // R$ 129,00/semestre não dá R$ 351,00 de receita nenhuma. Os dois números
    // convivem: nominal é quanto o cliente paga, mensal é quanto ele vale por
    // mês, e só o segundo é somável com o MRR.
    supaSpy.subscriptions = [
      sub({
        id: "anual",
        cancel_at_period_end: true,
        plans: { code: "pro_annual", price_cents: 22200, interval: "year" },
      }),
      sub({
        id: "semestral",
        cancel_at_period_end: true,
        plans: {
          code: "pro_semiannual",
          price_cents: 12900,
          interval: "semiannual",
        },
      }),
    ];

    const p = await montar();
    const porId = new Map(p.itens.map((i) => [i.chave, i]));

    // 22200/12 = 1850 e 12900/6 = 2150: os MESMOS valores que
    // `adminPaginacao.test.ts` afirma para o card, pela MESMA função.
    expect(porId.get("saida:anual")).toMatchObject({
      valorCents: 22200,
      mrrMensalCents: 1850,
    });
    expect(porId.get("saida:semestral")).toMatchObject({
      valorCents: 12900,
      mrrMensalCents: 2150,
    });
    // CONTROLE NEGATIVO: o nominal NÃO foi substituído pelo mensal. Se fosse, o
    // painel passaria a mentir sobre quanto o cliente paga.
    expect(porId.get("saida:anual")!.valorCents).not.toBe(1850);
  });

  it("mensal: nominal e equivalente mensal são o MESMO número (1 mês)", async () => {
    supaSpy.subscriptions = [sub({ cancel_at_period_end: true })];
    const p = await montar();
    expect(p.itens[0]).toMatchObject({
      valorCents: 2990,
      mrrMensalCents: 2990,
    });
  });

  it("plano SEM ciclo: mensal AUSENTE, e o painel continua de pé", async () => {
    // Fallback é para valor de apresentação; aqui o valor É a informação, então
    // ele some declaradamente em vez de virar um número plausível. E derrubar o
    // painel inteiro (com os itens críticos dentro) por causa de uma linha seria
    // trocar um dado faltando por uma tela em branco.
    supaSpy.subscriptions = [
      sub({
        cancel_at_period_end: true,
        plans: { code: "pro_monthly", price_cents: 2990, interval: null },
      }),
    ];

    const p = await montar();

    expect(p.itens).toHaveLength(1);
    expect(p.itens[0].valorCents).toBe(2990);
    expect(p.itens[0].mrrMensalCents).toBeUndefined();
  });

  it("erro ao ler assinaturas vira AUSÊNCIA declarada, não painel vazio", async () => {
    // "Tudo em ordem" sobre uma fonte quebrada é mentira.
    supaSpy.erroSubscriptions = { message: "timeout" };

    const p = await montar();

    expect(p.itens).toEqual([]);
    expect(p.fontesIndisponiveis).toContain("assinaturas");
  });
});

describe("cobranças falhadas", () => {
  it("viram UM item agregado, não um por cobrança", async () => {
    // Medido em 2026-08-14: 88 falhas em 30 dias. 88 linhas seria a definição
    // de ruído; o número é o sinal.
    const p = await montar({
      fonteDeCobrancasFalhadas: {
        contar: async () => ({ count: 12, cents: 35880 }),
      },
    });

    const falhadas = p.itens.filter((i) => i.tipo === "cobrancas_falhadas");
    expect(falhadas).toHaveLength(1);
    expect(falhadas[0].severidade).toBe("critico");
    expect(falhadas[0].titulo).toContain("12");
    // CONTAGEM E JANELA COMO CAMPOS: o painel troca o título do servidor pelo
    // rótulo do grupo, e nessa troca os dois números sumiram da tela. Reparsear
    // o título com regex seria a classe de instrumento que este projeto já
    // documentou falhando em silêncio.
    expect(falhadas[0].agregado).toEqual({ quantidade: 12, janelaDias: 7 });
  });

  it("a janela do agregado acompanha a janela pedida, não uma constante", async () => {
    const p = await montar({
      janelaDias: 30,
      fonteDeCobrancasFalhadas: {
        contar: async () => ({ count: 88, cents: 100000 }),
      },
    });
    const falhadas = p.itens.filter((i) => i.tipo === "cobrancas_falhadas");
    expect(falhadas[0].agregado).toEqual({ quantidade: 88, janelaDias: 30 });
    expect(p.janelaDias).toBe(30);
  });

  it("CONTROLE NEGATIVO: zero falhas não gera item", async () => {
    const p = await montar();
    expect(p.itens.filter((i) => i.tipo === "cobrancas_falhadas")).toEqual([]);
  });

  it("fonte indisponível é declarada, e não vira zero", async () => {
    const p = await montar({
      fonteDeCobrancasFalhadas: { contar: async () => null },
    });
    expect(p.fontesIndisponiveis).toContain("cobrancas_falhadas");
  });
});

describe("pagamentos órfãos: só LEITURA, e só os acionáveis", () => {
  function orfao(over: Record<string, unknown> = {}) {
    return {
      stripe_session_id: "cs_live_1",
      expected_provider_subscription_id: "sub_orfa",
      customer_email: "alguem@exemplo.com",
      amount_total_cents: 2990,
      session_created_at: "2026-07-19T23:49:05Z",
      ...over,
    };
  }

  it("órfão com assinatura VIVA na Stripe pede ação", async () => {
    supaSpy.orfaos = [orfao()];
    stripeSpy.subs.sub_orfa = { id: "sub_orfa", status: "active" };

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "pagamento_orfao")).toHaveLength(1);
  });

  it("CONTROLE NEGATIVO: órfão com assinatura já CANCELADA sai do painel", async () => {
    // É o caso do dossiê depois de 2026-08-19: a assinatura termina, não há
    // cobrança futura, e o item some sozinho — sem ack, sem clique, sem tabela
    // de estado. É essa a condição natural de resolução que o painel exige.
    supaSpy.orfaos = [orfao()];
    stripeSpy.subs.sub_orfa = { id: "sub_orfa", status: "canceled" };

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "pagamento_orfao")).toEqual([]);
  });

  it("assinatura com ended_at também sai", async () => {
    supaSpy.orfaos = [orfao()];
    stripeSpy.subs.sub_orfa = {
      id: "sub_orfa",
      status: "active",
      ended_at: 1770000000,
    };

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "pagamento_orfao")).toEqual([]);
  });

  it("falha ao ler a Stripe NÃO silencia o item (fail-closed)", async () => {
    supaSpy.orfaos = [orfao()];
    stripeSpy.retrieveErro = new Error("stripe fora do ar");

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "pagamento_orfao")).toHaveLength(1);
  });

  it("boleto avulso (cs_) continua acionável sem consultar a Stripe", async () => {
    supaSpy.orfaos = [
      orfao({ expected_provider_subscription_id: "cs_live_abc" }),
    ];

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "pagamento_orfao")).toHaveLength(1);
  });
});

describe("spike de custo de IA", () => {
  /** 14 dias anteriores com `custo` cada, mais `hoje` no dia de hoje. */
  function serie(custoDiario: number, hoje: number) {
    const logs: unknown[] = [];
    for (let i = 1; i <= 14; i += 1) {
      const dia = new Date(Date.UTC(2026, 7, 14 - i))
        .toISOString()
        .slice(0, 10);
      logs.push(log(dia, String(custoDiario)));
    }
    logs.push(log("2026-08-14", String(hoje)));
    return logs;
  }

  it("dispara quando passa do múltiplo E do piso", async () => {
    supaSpy.aiLogs = serie(0.1, 2);

    const p = await montar();

    const spike = p.itens.filter((i) => i.tipo === "custo_ia_spike");
    expect(spike).toHaveLength(1);
    expect(spike[0].detalhe).toContain("2.00");
  });

  it("CONTROLE NEGATIVO: 10x a mediana mas abaixo do piso NÃO alerta", async () => {
    // A base é pequena (US$ 2,41 em 30 dias medidos em 2026-08-14, ~US$ 0,08 por
    // dia). Sem piso, o painel gritaria sobre centavos.
    supaSpy.aiLogs = serie(0.01, 0.1);

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "custo_ia_spike")).toEqual([]);
    expect(0.1).toBeLessThan(SPIKE_PISO_USD);
  });

  it("CONTROLE NEGATIVO: acima do piso mas dentro do normal NÃO alerta", async () => {
    // Crescimento de uso não é anomalia. Sem esta metade, o alerta viraria um
    // aviso permanente assim que o produto crescesse.
    supaSpy.aiLogs = serie(1, 2);

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "custo_ia_spike")).toEqual([]);
  });

  it("CONTROLE NEGATIVO: dia sem nenhuma chamada de IA não gera spike", async () => {
    supaSpy.aiLogs = serie(0.1, 0);

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "custo_ia_spike")).toEqual([]);
  });

  it("base inteiramente zerada não transforma qualquer centavo em spike", async () => {
    // Com mediana 0, `> 3 * 0` é verdade para qualquer valor positivo. É o piso
    // que segura, e este teste é quem prova que ele segura.
    supaSpy.aiLogs = [log("2026-08-14", "0.2")];

    const p = await montar();

    expect(p.itens.filter((i) => i.tipo === "custo_ia_spike")).toEqual([]);
  });
});

describe("ordenação e forma do painel", () => {
  it("crítico vem antes de atenção, e o maior valor primeiro", async () => {
    supaSpy.subscriptions = [
      sub({ id: "a", status: "past_due" }),
      sub({
        id: "b",
        cancel_at_period_end: true,
        plans: { code: "pro_annual", price_cents: 22200 },
      }),
    ];

    const p = await montar();

    expect(p.itens.map((i) => i.severidade)).toEqual(["critico", "atencao"]);
  });

  it("todo item tem chave estável, e as chaves não colidem", async () => {
    supaSpy.subscriptions = [
      sub({ id: "a", status: "past_due" }),
      sub({ id: "b", status: "past_due" }),
    ];

    const p = await montar();

    const chaves = p.itens.map((i) => i.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it("painel vazio com todas as fontes OK é 'tudo em ordem' de verdade", async () => {
    const p = await montar();
    expect(p.itens).toEqual([]);
    expect(p.fontesIndisponiveis).toEqual([]);
  });
});

describe("payout falho", () => {
  const payout = (over: Record<string, unknown> = {}) => ({
    id: "po_1",
    amountCents: 500000,
    criadoEm: new Date("2026-08-10T12:00:00Z"),
    ...over,
  });

  it("payout DENTRO da janela vira item crítico com o valor retido", async () => {
    const p = await montar({
      fonteDePayoutsFalhos: { listar: async () => [payout()] },
    });

    const item = p.itens.find((i) => i.tipo === "payout_falho");
    expect(item).toBeTruthy();
    expect(item!.severidade).toBe("critico");
    expect(item!.valorCents).toBe(500000);
    // SEM equivalente mensal: repasse não é contrato com ciclo. Ausência,
    // nunca zero, senão ele entraria na soma de "receita em risco" como se
    // fosse assinatura.
    expect(item!.mrrMensalCents).toBeUndefined();
    expect(item!.url).toContain("dashboard.stripe.com/payouts");
  });

  it("CONTROLE NEGATIVO: payout FORA da janela não vira item", async () => {
    // Um dia antes do limite. Na Stripe, `failed` é permanente: sem a janela
    // este item ficaria aceso para sempre, que é o que o princípio proíbe.
    const velho = new Date(
      AGORA.getTime() - (PAYOUT_JANELA_DIAS + 1) * 24 * 60 * 60 * 1000,
    );
    const p = await montar({
      fonteDePayoutsFalhos: {
        listar: async () => [payout({ criadoEm: velho })],
      },
    });

    expect(p.itens.some((i) => i.tipo === "payout_falho")).toBe(false);
  });

  it("fonte de payouts FORA DO AR não derruba o resto do painel", async () => {
    supaSpy.subscriptions = [sub({ status: "past_due" })];
    const p = await montar({
      fonteDePayoutsFalhos: { listar: async () => null },
    });

    expect(p.fontesIndisponiveis).toContain("payouts");
    // O item crítico que já existia continua lá: fonte caída tira UMA fonte,
    // não o painel.
    expect(p.itens.some((i) => i.tipo === "assinatura_past_due")).toBe(true);
  });
});

describe("mês sem despesa", () => {
  it("mês anterior VAZIO vira item de atenção apontando o financeiro", async () => {
    supaSpy.despesas = [];

    const p = await montar();
    const item = p.itens.find((i) => i.tipo === "mes_sem_despesa");
    expect(item).toBeTruthy();
    expect(item!.severidade).toBe("atencao");
    expect(item!.destinoInterno).toBe("/admin?section=financeiro");
    // AGORA é 14/08/2026, então o mês anterior é 07/2026.
    expect(item!.titulo).toContain("07/2026");
  });

  it("CONTROLE NEGATIVO: UMA despesa no mês já basta para não gerar item", async () => {
    supaSpy.despesas = [{ id: "despesa-1" }];

    const p = await montar();
    expect(p.itens.some((i) => i.tipo === "mes_sem_despesa")).toBe(false);
  });

  it("despesas fora do ar viram fonte indisponível, não item", async () => {
    supaSpy.erroDespesas = new Error("timeout");

    const p = await montar();
    expect(p.fontesIndisponiveis).toContain("despesas");
    expect(p.itens.some((i) => i.tipo === "mes_sem_despesa")).toBe(false);
  });
});

describe("influencer que virou assinante", () => {
  const ASSINANTE = "user-both";

  it("influencer COM assinatura vigente vira item, com o e-mail no detalhe", async () => {
    supaSpy.influencers = [{ user_id: ASSINANTE }];
    supaSpy.subscriptions = [
      sub({ id: "row-both", user_id: ASSINANTE, status: "active" }),
    ];
    supaSpy.perfis = [{ user_id: ASSINANTE, email: "rafa@exemplo.com" }];

    const p = await montar();
    const item = p.itens.find((i) => i.tipo === "influencer_com_assinatura");
    expect(item).toBeTruthy();
    expect(item!.detalhe).toContain("rafa@exemplo.com");
    expect(item!.severidade).toBe("atencao");
    // SEM valor: a receita não está em risco e a concessão não vale dinheiro.
    expect(item!.valorCents).toBeUndefined();
  });

  it("CONTROLE NEGATIVO: influencer SEM assinatura não vira item", async () => {
    supaSpy.influencers = [{ user_id: "so-influencer" }];
    supaSpy.subscriptions = [];

    const p = await montar();
    expect(p.itens.some((i) => i.tipo === "influencer_com_assinatura")).toBe(
      false,
    );
  });

  it("CONTROLE NEGATIVO: assinante SEM concessão não vira item", async () => {
    // A lista de influencers NÃO é vazia de propósito, e é outra pessoa.
    //
    // A primeira versão deste teste zerava `influencers`, e assim ele passava
    // pelo motivo errado: o guard `idsInfluencer.size > 0` encerra o bloco
    // antes de o cruzamento acontecer, então o AND nunca era exercitado. Uma
    // mutação que apagava a checagem de pertinência sobreviveu, e foi ela que
    // apontou o furo. Com um influencer presente e um assinante DIFERENTE, a
    // única coisa que segura o falso positivo é o AND.
    supaSpy.influencers = [{ user_id: "so-influencer" }];
    supaSpy.subscriptions = [sub({ user_id: "so-pagante", status: "active" })];
    supaSpy.perfis = [{ user_id: "so-pagante", email: "pagante@exemplo.com" }];

    const p = await montar();
    expect(p.itens.some((i) => i.tipo === "influencer_com_assinatura")).toBe(
      false,
    );
  });

  it("e-mail ausente vira estado NOMEADO, nunca string vazia", async () => {
    supaSpy.influencers = [{ user_id: ASSINANTE }];
    supaSpy.subscriptions = [
      sub({ id: "row-both", user_id: ASSINANTE, status: "active" }),
    ];
    supaSpy.perfis = [];

    const p = await montar();
    const item = p.itens.find((i) => i.tipo === "influencer_com_assinatura");
    expect(item!.detalhe).toContain("e-mail nao encontrado");
  });
});

describe("destinos internos e motivo da saída", () => {
  it("TODO item gerado carrega destinoInterno", async () => {
    // Teste de CONJUNTO, no molde do que afirma a lista de tipos: um item novo
    // que esqueça o destino cai aqui, e não numa revisão visual.
    supaSpy.subscriptions = [
      sub({ status: "past_due" }),
      sub({ id: "row-2", cancel_at_period_end: true }),
    ];
    supaSpy.despesas = [];
    supaSpy.orfaos = [
      {
        stripe_session_id: "cs_1",
        expected_provider_subscription_id: "cs_orfa",
        customer_email: "x@y.com",
        amount_total_cents: 22200,
        session_created_at: "2026-08-01T00:00:00Z",
      },
    ];

    const p = await montar({
      fonteDeCobrancasFalhadas: {
        contar: async () => ({ count: 3, cents: 9000 }),
      },
      fonteDePayoutsFalhos: {
        listar: async () => [
          {
            id: "po_1",
            amountCents: 1000,
            criadoEm: new Date("2026-08-13T00:00:00Z"),
          },
        ],
      },
    });

    expect(p.itens.length).toBeGreaterThan(0);
    const semDestino = p.itens.filter((i) => !i.destinoInterno);
    expect(semDestino.map((i) => i.tipo)).toEqual([]);
  });

  it("saída agendada COM motivo declarado carrega o código cru", async () => {
    supaSpy.subscriptions = [
      sub({ cancel_at_period_end: true, provider_subscription_id: "sub_9" }),
    ];
    supaSpy.cancelamentos = [
      { provider_subscription_id: "sub_9", reason_code: "expensive" },
    ];

    const p = await montar();
    const item = p.itens.find((i) => i.tipo === "saida_agendada");
    // CÓDIGO, não rótulo: quem traduz é o client, com o mapa que já existe.
    expect(item!.motivoCodigo).toBe("expensive");
  });

  it("CONTROLE NEGATIVO: saída SEM motivo não inventa campo", async () => {
    supaSpy.subscriptions = [
      sub({ cancel_at_period_end: true, provider_subscription_id: "sub_9" }),
    ];
    supaSpy.cancelamentos = [];

    const p = await montar();
    const item = p.itens.find((i) => i.tipo === "saida_agendada");
    expect(item!.motivoCodigo).toBeUndefined();
  });
});
