import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * EXCLUSÃO DE CONTA COM ASSINATURA VIVA (D8).
 *
 * O defeito que estes testes travam é irreversível quando acontece: apagada a
 * conta, o CASCADE leva `subscriptions` junto e não sobra como descobrir o
 * customer na Stripe. Foi assim que `sub_1Tv4SX…` ficou cobrando alguém que não
 * existe mais no produto.
 *
 * Por isso a asserção central não é "cancelou", é **ORDEM**: cancelar tem de
 * acontecer ANTES do delete, e a falha do cancelamento tem de IMPEDIR o delete.
 *
 * Stripe é dublê. Nenhuma chamada de rede, nenhuma escrita — nem em modo teste.
 */

const stripeSpy = vi.hoisted(() => ({
  ordem: [] as string[],
  cancelados: [] as string[],
  cancelErro: null as unknown,
  retrieveStatus: null as string | null,
  retrieveErro: null as unknown,
  customersAtualizados: [] as Array<{ id: string; metadata: unknown }>,
  customerUpdateErro: null as unknown,
}));

const supaSpy = vi.hoisted(() => ({
  linhas: [] as unknown[],
  erroSelect: null as unknown,
  deleteChamado: [] as string[],
  deleteErro: null as unknown,
}));

vi.mock("./stripeClient", () => ({
  getStripe: () => ({
    subscriptions: {
      cancel: async (id: string) => {
        stripeSpy.ordem.push(`cancel:${id}`);
        if (stripeSpy.cancelErro) throw stripeSpy.cancelErro;
        stripeSpy.cancelados.push(id);
        return { id, status: "canceled" };
      },
      retrieve: async (id: string) => {
        stripeSpy.ordem.push(`retrieve:${id}`);
        if (stripeSpy.retrieveErro) throw stripeSpy.retrieveErro;
        return { id, status: stripeSpy.retrieveStatus ?? "active" };
      },
    },
    customers: {
      update: async (id: string, params: { metadata: unknown }) => {
        stripeSpy.ordem.push(`customer:${id}`);
        if (stripeSpy.customerUpdateErro) throw stripeSpy.customerUpdateErro;
        stripeSpy.customersAtualizados.push({ id, metadata: params.metadata });
        return { id };
      },
    },
  }),
}));

vi.mock("./supabaseAdmin", () => {
  const builder = () => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.in = () =>
      Promise.resolve(
        supaSpy.erroSelect
          ? { data: null, error: supaSpy.erroSelect }
          : { data: supaSpy.linhas, error: null },
      );
    return q;
  };
  return {
    supabaseAdmin: {
      from: () => builder(),
      auth: {
        admin: {
          deleteUser: async (id: string) => {
            stripeSpy.ordem.push(`delete:${id}`);
            supaSpy.deleteChamado.push(id);
            return { error: supaSpy.deleteErro ?? null };
          },
        },
      },
    },
  };
});

const sentrySpy = vi.hoisted(() => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock("@sentry/node", () => ({
  captureMessage: sentrySpy.captureMessage,
  captureException: sentrySpy.captureException,
}));

import { prepararExclusaoDeConta } from "./accountDeletion";
import { supabaseAdmin } from "./supabaseAdmin";

function linha(over: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    status: "active",
    renewal_type: "auto",
    provider_subscription_id: "sub_1",
    provider_customer_id: "cus_1",
    ...over,
  };
}

/**
 * Reproduz a sequência da rota `DELETE /api/me`: prepara e, SÓ se der certo,
 * apaga. O teste exercita esta ordem, que é o que a correção estabelece.
 */
async function excluirConta(userId: string): Promise<"ok" | "abortado"> {
  try {
    await prepararExclusaoDeConta(userId);
  } catch {
    return "abortado";
  }
  await supabaseAdmin.auth.admin.deleteUser(userId);
  return "ok";
}

beforeEach(() => {
  stripeSpy.ordem = [];
  stripeSpy.cancelados = [];
  stripeSpy.cancelErro = null;
  stripeSpy.retrieveStatus = null;
  stripeSpy.retrieveErro = null;
  stripeSpy.customersAtualizados = [];
  stripeSpy.customerUpdateErro = null;
  supaSpy.linhas = [];
  supaSpy.erroSelect = null;
  supaSpy.deleteChamado = [];
  supaSpy.deleteErro = null;
  // Sem isto a contagem de captureMessage vaza de um caso para o proximo, e o
  // teste fica dependente de ordem (mesmo motivo do reset dos outros spies).
  sentrySpy.captureMessage.mockReset();
  sentrySpy.captureException.mockReset();
});

describe("com assinatura ativa", () => {
  it("cancela na Stripe ANTES de apagar a conta", async () => {
    supaSpy.linhas = [linha()];

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    // A ordem É a correção. Um teste que só verificasse "cancel foi chamado"
    // passaria com a sequência invertida, que é justamente o defeito.
    expect(stripeSpy.ordem.indexOf("cancel:sub_1")).toBeLessThan(
      stripeSpy.ordem.indexOf("delete:user-1"),
    );
    expect(stripeSpy.cancelados).toEqual(["sub_1"]);
    expect(supaSpy.deleteChamado).toEqual(["user-1"]);
  });

  it("marca o customer com account_deleted_at, também antes do delete", async () => {
    supaSpy.linhas = [linha()];

    await excluirConta("user-1");

    expect(stripeSpy.customersAtualizados).toHaveLength(1);
    const meta = stripeSpy.customersAtualizados[0].metadata as Record<
      string,
      string
    >;
    expect(meta.deleted_user_id).toBe("user-1");
    expect(typeof meta.account_deleted_at).toBe("string");
    expect(Number.isNaN(Date.parse(meta.account_deleted_at))).toBe(false);
    expect(stripeSpy.ordem.indexOf("customer:cus_1")).toBeLessThan(
      stripeSpy.ordem.indexOf("delete:user-1"),
    );
  });

  it("cancela também as que já tinham saída agendada e as past_due", async () => {
    // Elas continuam vivas até a data marcada; com a conta apagada não há mais
    // ninguém para usar o que ainda foi pago, e a decisão (D8) é encerrar já.
    supaSpy.linhas = [
      linha({ id: "r1", provider_subscription_id: "sub_a" }),
      linha({
        id: "r2",
        provider_subscription_id: "sub_b",
        status: "past_due",
      }),
      linha({
        id: "r3",
        provider_subscription_id: "sub_c",
        status: "trialing",
      }),
    ];

    await excluirConta("user-1");

    expect(stripeSpy.cancelados).toEqual(["sub_a", "sub_b", "sub_c"]);
  });

  it("marca cada customer UMA vez, mesmo com várias assinaturas", async () => {
    supaSpy.linhas = [
      linha({ id: "r1", provider_subscription_id: "sub_a" }),
      linha({ id: "r2", provider_subscription_id: "sub_b" }),
    ];

    await excluirConta("user-1");

    expect(stripeSpy.customersAtualizados.map((c) => c.id)).toEqual(["cus_1"]);
  });
});

describe("falha na Stripe é fail-closed", () => {
  it("erro no cancelamento IMPEDE o deleteUser", async () => {
    // O controle negativo mais importante do arquivo: se este teste cair, o
    // defeito original voltou — conta apagada e cobrança viva.
    supaSpy.linhas = [linha()];
    stripeSpy.cancelErro = new Error("stripe fora do ar");
    stripeSpy.retrieveErro = new Error("stripe fora do ar");

    const r = await excluirConta("user-1");

    expect(r).toBe("abortado");
    expect(supaSpy.deleteChamado).toEqual([]);
    expect(stripeSpy.ordem).not.toContain("delete:user-1");
  });

  it("erro ao LER as assinaturas também impede o delete", async () => {
    // Sem saber quais assinaturas existem não dá para afirmar que não há
    // nenhuma. Prosseguir aqui seria o defeito de volta, por outro caminho.
    supaSpy.erroSelect = { message: "timeout" };

    const r = await excluirConta("user-1");

    expect(r).toBe("abortado");
    expect(supaSpy.deleteChamado).toEqual([]);
  });

  it("assinatura JÁ cancelada na Stripe não bloqueia (idempotência)", async () => {
    // O banco local pode estar atrasado. A função confere o estado REAL antes
    // de decidir, em vez de engolir o erro.
    supaSpy.linhas = [linha()];
    stripeSpy.cancelErro = new Error("already canceled");
    stripeSpy.retrieveStatus = "canceled";

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    expect(supaSpy.deleteChamado).toEqual(["user-1"]);
  });

  it("assinatura inexistente na Stripe não bloqueia", async () => {
    supaSpy.linhas = [linha()];
    stripeSpy.cancelErro = { code: "resource_missing" };

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    // E nem precisou conferir: `resource_missing` já é conclusivo.
    expect(stripeSpy.ordem).not.toContain("retrieve:sub_1");
  });

  it("falha só no MARCADOR não aborta, e a exclusão segue", async () => {
    // Escolha deliberada e contrária ao resto: abortar aqui deixaria a pessoa
    // com conta viva e assinatura já cancelada, que é um estado pior. O
    // pagamento reaparece no detector como acionável, pedindo atenção humana.
    supaSpy.linhas = [linha()];
    stripeSpy.customerUpdateErro = new Error("customer update falhou");

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    expect(stripeSpy.cancelados).toEqual(["sub_1"]);
    expect(supaSpy.deleteChamado).toEqual(["user-1"]);
  });
});

describe("sem assinatura na Stripe", () => {
  it("NENHUMA chamada à Stripe, e o fluxo antigo segue intacto", async () => {
    // Controle negativo: a correção não pode custar rede para a maioria das
    // pessoas, que não assina.
    supaSpy.linhas = [];

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    expect(stripeSpy.ordem).toEqual(["delete:user-1"]);
    expect(stripeSpy.cancelados).toEqual([]);
    expect(stripeSpy.customersAtualizados).toEqual([]);
  });

  it("boleto avulso não vira chamada de cancel (não há o que cancelar)", async () => {
    // `provider_subscription_id` é um `cs_...`: subscriptions.cancel com ele
    // falha SEMPRE, e o acesso já morre com o período pago.
    supaSpy.linhas = [
      linha({ renewal_type: "manual", provider_subscription_id: "cs_live_x" }),
    ];

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    expect(stripeSpy.cancelados).toEqual([]);
    expect(stripeSpy.ordem).not.toContain("cancel:cs_live_x");
    // Mas o customer é marcado do mesmo jeito: é ele que permite classificar o
    // pagamento depois.
    expect(stripeSpy.customersAtualizados.map((c) => c.id)).toEqual(["cus_1"]);
  });
});

describe("resultado devolvido", () => {
  it("separa canceladas de sem-contraparte e sinaliza marcador incompleto", async () => {
    supaSpy.linhas = [
      linha({ id: "r1", provider_subscription_id: "sub_a" }),
      linha({
        id: "r2",
        renewal_type: "manual",
        provider_subscription_id: "cs_live_b",
      }),
    ];
    stripeSpy.customerUpdateErro = new Error("falhou");

    const r = await prepararExclusaoDeConta("user-1");

    expect(r.canceladas).toEqual(["sub_a"]);
    expect(r.semContraparteNaStripe).toEqual(["cs_live_b"]);
    expect(r.customersMarcados).toEqual([]);
    expect(r.marcadorIncompleto).toBe(true);
  });
});

/**
 * O QUE VAI PARA O SENTRY, e o que nao vai.
 *
 * BUG-69: a funcao capturava um evento em toda exclusao, inclusive nas bem
 * sucedidas, e sucesso virava issue. O filtro `!level:info` do intake (78ec95a0)
 * tirava isso do CRM, mas tapando na saida um evento que nao devia existir; a
 * correcao na origem e nao emitir.
 */
describe("rastro no Sentry", () => {
  function mensagensCapturadas(): string[] {
    return sentrySpy.captureMessage.mock.calls.map((c) => String(c[0]));
  }

  it("exclusao bem sucedida NAO captura nada", async () => {
    supaSpy.linhas = [linha()];

    const r = await excluirConta("user-1");

    expect(r).toBe("ok");
    // O caminho feliz inteiro: cancelou, marcou o customer, apagou a conta.
    expect(stripeSpy.customersAtualizados.map((c) => c.id)).toEqual(["cus_1"]);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("sem assinatura nenhuma tambem nao captura", async () => {
    supaSpy.linhas = [];

    await excluirConta("user-1");

    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("marcador incompleto captura o resumo da EXCLUSAO, em warning", async () => {
    supaSpy.linhas = [linha()];
    stripeSpy.customerUpdateErro = new Error("customer update falhou");

    await excluirConta("user-1");

    const resumo = sentrySpy.captureMessage.mock.calls.find((c) =>
      String(c[0]).includes("exclusao incompleta"),
    );
    expect(resumo).toBeTruthy();
    const opcoes = resumo![1] as {
      level: string;
      fingerprint: string[];
      tags: Record<string, string>;
      extra: Record<string, unknown>;
    };
    // `warning`: precisa de limpeza manual, nao de plantao.
    expect(opcoes.level).toBe("warning");
    expect(opcoes.fingerprint).toEqual(["account-deletion-incompleto"]);
    expect(opcoes.tags).toMatchObject({
      area: "account-deletion",
      marcador: "incompleto",
    });
    expect(opcoes.extra.deleted_user_id).toBe("user-1");
    // So ids: nada que identifique a pessoa fora do que a Stripe ja carrega.
    expect(Object.keys(opcoes.extra).sort()).toEqual([
      "canceladas",
      "customers_marcados",
      "deleted_user_id",
      "sem_contraparte",
    ]);
  });

  it("a CAUSA por customer continua sendo reportada, separada da consequencia", async () => {
    // Os dois eventos coexistem de proposito, com fingerprints diferentes:
    // `marcarCustomer` diz qual customer falhou e por que; o resumo diz que a
    // exclusao terminou incompleta. Um nao substitui o outro.
    supaSpy.linhas = [linha()];
    stripeSpy.customerUpdateErro = new Error("customer update falhou");

    await excluirConta("user-1");

    const mensagens = mensagensCapturadas();
    expect(
      mensagens.some((m) => m.includes("marcador account_deleted_at")),
    ).toBe(true);
    expect(mensagens.some((m) => m.includes("exclusao incompleta"))).toBe(true);
    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(2);
  });
});
