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
  erroSubscriptions: null as unknown,
  erroOrfaos: null as unknown,
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
    q.in = () => q;
    q.gte = () => q;
    q.order = () => q;
    // `range` RECORTA de verdade, e isso não é capricho: `paginateRange` só
    // encerra na PÁGINA VAZIA (de propósito, para uma página curta por
    // max-rows não terminar a varredura antes da hora). Um dublê que devolve o
    // array inteiro a cada chamada trava o teste em laço infinito — foi o que
    // aconteceu na primeira versão deste arquivo.
    q.range = (from: number, to: number) => {
      if (tabela === "subscriptions" && supaSpy.erroSubscriptions) {
        return Promise.resolve({ data: null, error: supaSpy.erroSubscriptions });
      }
      const todas =
        tabela === "subscriptions" ? supaSpy.subscriptions : supaSpy.aiLogs;
      return Promise.resolve({
        data: todas.slice(from, to + 1),
        error: null,
      });
    };
    q.is = () =>
      Promise.resolve(
        supaSpy.erroOrfaos
          ? { data: null, error: supaSpy.erroOrfaos }
          : { data: supaSpy.orfaos, error: null },
      );
    return q;
  }
  return { supabaseAdmin: { from: (t: string) => builder(t) } };
});

import {
  montarPainelDeAtencao,
  SPIKE_PISO_USD,
  type FonteDeCobrancasFalhadas,
} from "./atencaoNecessaria";

const AGORA = new Date("2026-08-14T18:00:00Z");

/** Fonte de cobranças falhadas que não fala com ninguém. */
const semFalhadas: FonteDeCobrancasFalhadas = {
  contar: async () => ({ count: 0, cents: 0 }),
};

function sub(over: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    status: "active",
    cancel_at_period_end: false,
    current_period_end: "2026-09-14T00:00:00Z",
    provider_subscription_id: "sub_1",
    plans: { code: "pro_monthly", price_cents: 2990 },
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
  supaSpy.erroSubscriptions = null;
  supaSpy.erroOrfaos = null;
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
