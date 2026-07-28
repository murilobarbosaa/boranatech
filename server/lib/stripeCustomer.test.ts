import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveStripeCustomerId } from "./stripeCustomer";

// vi.mock e hoisted pelo vitest, entao o import estatico acima ja recebe os
// mocks. Import dinamico com top-level await nao compila no tsconfig do projeto.
vi.mock("./env", () => ({
  env: { stripeSecretKey: "sk_live_fake", stripePriceIds: {} },
}));

const capturados: { msg: string; opts: unknown }[] = [];
vi.mock("@sentry/node", () => ({
  captureMessage: (msg: string, opts: unknown) => {
    capturados.push({ msg, opts });
    return "id-de-teste";
  },
  captureException: () => "id-de-teste",
}));

/** Controla o que o supabase e a Stripe devolvem em cada teste. */
const cenario = {
  leituraErro: null as unknown,
  linha: null as { stripe_customer_id: string } | null,
  /** Quando setado, a SEGUNDA leitura do mapeamento devolve isto (corrida). */
  linhaNaReleitura: undefined as { stripe_customer_id: string } | null | undefined,
  leituras: 0,
  upsertErro: null as unknown,
  upsertData: [{ stripe_customer_id: "cus_novo" }] as unknown[] | null,
  updateErro: null as unknown,
  criarLanca: null as unknown,
  criado: { id: "cus_novo", livemode: true, metadata: {} } as Record<string, unknown>,
  retrieve: null as unknown,
  retrieveLanca: null as unknown,
};

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: async () => {
              cenario.leituras += 1;
              const alvo =
                cenario.leituras > 1 && cenario.linhaNaReleitura !== undefined
                  ? cenario.linhaNaReleitura
                  : cenario.linha;
              return { data: alvo ? [alvo] : [], error: cenario.leituraErro };
            },
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: async () => ({ error: cenario.updateErro }),
        }),
      }),
      upsert: () => ({
        select: async () => ({ data: cenario.upsertData, error: cenario.upsertErro }),
      }),
    }),
  },
}));

vi.mock("./stripeClient", () => ({
  getStripe: () => ({
    customers: {
      create: async () => {
        if (cenario.criarLanca) throw cenario.criarLanca;
        return cenario.criado;
      },
      retrieve: async () => {
        if (cenario.retrieveLanca) throw cenario.retrieveLanca;
        return cenario.retrieve;
      },
      update: async () => cenario.criado,
    },
  }),
}));



function erroStripe(code: string, statusCode = 500) {
  return Object.assign(new Error(code), { code, statusCode });
}

beforeEach(() => {
  capturados.length = 0;
  Object.assign(cenario, {
    leituraErro: null,
    linha: null,
    linhaNaReleitura: undefined,
    leituras: 0,
    upsertErro: null,
    upsertData: [{ stripe_customer_id: "cus_novo" }],
    updateErro: null,
    criarLanca: null,
    criado: { id: "cus_novo", livemode: true, metadata: {} },
    retrieve: null,
    retrieveLanca: null,
  });
});

describe("resolveStripeCustomerId: caminho normal", () => {
  it("cria e mapeia quando nao ha linha", async () => {
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_novo" });
    expect(capturados).toHaveLength(0);
  });

  it("reusa o Customer mapeado", async () => {
    cenario.linha = { stripe_customer_id: "cus_velho" };
    cenario.retrieve = {
      id: "cus_velho",
      livemode: true,
      metadata: { supabase_user_id: "user-1" },
    };
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_velho" });
    expect(capturados).toHaveLength(0);
  });
});

// O ponto do Bloco 1: indisponibilidade NAO derruba o checkout.
describe("INDISPONIBILIDADE degrada, e a degradacao e contada", () => {
  it("erro ao ler o mapeamento degrada em vez de lancar", async () => {
    cenario.leituraErro = { message: "timeout" };
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "degradado", motivo: "leitura_do_mapeamento" });
    expect(capturados).toHaveLength(1);
    expect(capturados[0].msg).toBe("[billing] stripe_customer_lookup degraded");
  });

  it("erro transitorio da Stripe no retrieve degrada", async () => {
    cenario.linha = { stripe_customer_id: "cus_velho" };
    cenario.retrieveLanca = erroStripe("rate_limit", 429);
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "degradado", motivo: "stripe_indisponivel" });
    expect(capturados).toHaveLength(1);
  });

  it("falha ao criar o Customer degrada", async () => {
    cenario.criarLanca = new Error("rede caiu");
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "degradado", motivo: "criacao_do_customer" });
    expect(capturados).toHaveLength(1);
  });

  it("cada motivo vai como tag, para dar para separar no Sentry", async () => {
    cenario.leituraErro = { message: "x" };
    await resolveStripeCustomerId("user-1", "a@b.com");
    const opts = capturados[0].opts as { tags?: { motivo?: string } };
    expect(opts.tags?.motivo).toBe("leitura_do_mapeamento");
  });
});

// Persistencia falha, mas o Customer E do usuario: usar e melhor que degradar.
describe("persistencia falha mas o Customer e valido", () => {
  it("usa o Customer criado e reporta a degradacao", async () => {
    cenario.upsertErro = { message: "constraint" };
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_novo" });
    expect(capturados[0].opts).toMatchObject({
      tags: { motivo: "persistencia_do_mapeamento" },
    });
  });
});

// DIVERGENCIA continua abortando. Este e o limite da flexibilizacao.
describe("DIVERGENCIA continua lancando", () => {
  it("dono diferente aborta o checkout", async () => {
    cenario.linha = { stripe_customer_id: "cus_de_outro" };
    cenario.retrieve = {
      id: "cus_de_outro",
      livemode: true,
      metadata: { supabase_user_id: "OUTRO-USUARIO" },
    };
    await expect(resolveStripeCustomerId("user-1", "a@b.com")).rejects.toMatchObject({
      code: "customer_owner_mismatch",
    });
    // Divergencia NAO e degradacao: nao deve poluir a contagem.
    expect(capturados).toHaveLength(0);
  });

  it("modo live/test divergente aborta o checkout", async () => {
    cenario.linha = { stripe_customer_id: "cus_de_teste" };
    cenario.retrieve = {
      id: "cus_de_teste",
      livemode: false, // chave e sk_live_
      metadata: { supabase_user_id: "user-1" },
    };
    await expect(resolveStripeCustomerId("user-1", "a@b.com")).rejects.toMatchObject({
      code: "config_error",
    });
    expect(capturados).toHaveLength(0);
  });

  it("metadata AUSENTE nao aborta (decisao 4.1)", async () => {
    cenario.linha = { stripe_customer_id: "cus_sem_meta" };
    cenario.retrieve = { id: "cus_sem_meta", livemode: true, metadata: {} };
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_sem_meta" });
  });
});

describe("Customer sumiu da Stripe", () => {
  it("deletado no painel: recria e atualiza o mapeamento", async () => {
    cenario.linha = { stripe_customer_id: "cus_deletado" };
    cenario.retrieve = { id: "cus_deletado", deleted: true };
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_novo" });
  });

  it("resource_missing: recria em vez de estourar", async () => {
    cenario.linha = { stripe_customer_id: "cus_sumiu" };
    cenario.retrieveLanca = erroStripe("resource_missing", 404);
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_novo" });
  });
});

describe("corrida na criacao", () => {
  it("perdedor usa o Customer do vencedor, e o orfao nao e devolvido", async () => {
    cenario.upsertData = []; // conflito: ignoreDuplicates virou DO NOTHING
    cenario.linha = null; // primeira leitura: vazia
    cenario.linhaNaReleitura = { stripe_customer_id: "cus_vencedor" };
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_vencedor" });
    // cus_novo (o orfao do perdedor) NAO pode sair desta funcao.
    expect(r).not.toEqual({ modo: "reuso", customerId: "cus_novo" });
  });

  it("corrida sem vencedor legivel usa o proprio Customer criado e reporta", async () => {
    cenario.upsertData = [];
    cenario.linha = null;
    cenario.linhaNaReleitura = null;
    const r = await resolveStripeCustomerId("user-1", "a@b.com");
    expect(r).toEqual({ modo: "reuso", customerId: "cus_novo" });
    expect(capturados[0].opts).toMatchObject({
      tags: { motivo: "corrida_sem_vencedor" },
    });
  });
});
