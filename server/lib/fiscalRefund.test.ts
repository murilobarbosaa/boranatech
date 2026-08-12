import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TOTAL cancela a nota; PARCIAL chama um humano.
 *
 * O erro caro aqui e cancelar por parcial: apagaria o documento fiscal do
 * dinheiro que o cliente de fato pagou. O outro erro (nao cancelar por
 * integral) deixa uma nota valendo sobre dinheiro devolvido, que o contador
 * cobra no fechamento. Nenhum dos dois aparece como falha de execucao.
 */

type Linha = Record<string, unknown> & { id: string; status: string };

const estado = vi.hoisted(() => ({
  linhas: [] as Linha[],
  cancelamentos: [] as Array<{ chargeId: string; justificativa: string }>,
}));

vi.mock("./redis", () => ({ queueConnection: null, cacheConnection: null }));
vi.mock("./env", () => ({ env: { nfseEnabled: true, redisUrl: "" } }));
vi.mock("./fiscalQueue", () => ({
  enqueueFiscalCancel: vi.fn(
    async (chargeId: string, justificativa: string) => {
      estado.cancelamentos.push({ chargeId, justificativa });
    },
  ),
}));

function criarQuery() {
  const filtros: Array<(l: Linha) => boolean> = [];
  let patch: Record<string, unknown> | null = null;
  const q: Record<string, unknown> = {
    select: () => q,
    update: (p: Record<string, unknown>) => {
      patch = p;
      return q;
    },
    eq: (col: string, val: unknown) => {
      filtros.push((l) => l[col] === val);
      return q;
    },
    maybeSingle: async () => ({
      data: estado.linhas.filter((l) => filtros.every((f) => f(l)))[0] ?? null,
      error: null,
    }),
    then: (resolve: (v: unknown) => unknown) => {
      const alvo = estado.linhas.filter((l) => filtros.every((f) => f(l)));
      if (patch) for (const l of alvo) Object.assign(l, patch);
      return Promise.resolve(resolve({ data: alvo, error: null }));
    },
  };
  return q;
}

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: { from: () => criarQuery() },
}));

import {
  applyRefundToFiscalInvoice,
  classifyRefundExtent,
} from "./fiscalRefund";

describe("classifyRefundExtent", () => {
  it("acumulado igual ao bruto e total", () => {
    expect(classifyRefundExtent(2990, 2990)).toBe("total");
  });

  it("acumulado ACIMA do bruto tambem e total", () => {
    // Ajuste de disputa pode passar do bruto; um `===` deixaria este caso sem
    // classificacao e a nota valeria sobre dinheiro devolvido.
    expect(classifyRefundExtent(2990, 3100)).toBe("total");
  });

  it("acumulado abaixo do bruto e parcial", () => {
    expect(classifyRefundExtent(22200, 5000)).toBe("partial");
  });

  it("DOIS parciais que somam o bruto contam como total", () => {
    // A funcao recebe o ACUMULADO, nao a operacao isolada: e isso que faz a
    // segunda metade de 111+111 numa cobranca de 222 disparar o cancelamento.
    expect(classifyRefundExtent(22200, 11100 + 11100)).toBe("total");
  });

  it("sem reembolso nao classifica nada", () => {
    expect(classifyRefundExtent(2990, 0)).toBe("none");
    expect(classifyRefundExtent(0, 100)).toBe("none");
  });
});

describe("applyRefundToFiscalInvoice", () => {
  beforeEach(() => {
    estado.cancelamentos = [];
    estado.linhas = [
      {
        id: "nota-1",
        status: "issued",
        precisa_revisao: false,
        stripe_charge_id: "ch_1",
      },
    ];
  });

  it("integral enfileira cancelamento e NAO marca revisao", async () => {
    await applyRefundToFiscalInvoice({
      stripeChargeId: "ch_1",
      grossCents: 2990,
      refundedTotalCents: 2990,
      origem: "webhook",
    });
    expect(estado.cancelamentos).toEqual([
      { chargeId: "ch_1", justificativa: "Reembolso integral ao tomador" },
    ]);
    expect(estado.linhas[0].precisa_revisao).toBe(false);
    // A nota SO vira canceled quando o provedor confirmar. Marcar aqui seria
    // afirmar um cancelamento que a prefeitura ainda nem viu.
    expect(estado.linhas[0].status).toBe("issued");
  });

  it("parcial marca revisao e NAO cancela", async () => {
    await applyRefundToFiscalInvoice({
      stripeChargeId: "ch_1",
      grossCents: 22200,
      refundedTotalCents: 5000,
      origem: "admin",
    });
    expect(estado.cancelamentos).toEqual([]);
    expect(estado.linhas[0].precisa_revisao).toBe(true);
    expect(estado.linhas[0].status).toBe("issued");
    expect(estado.linhas[0].error_code).toBe("reembolso_parcial");
  });

  it("parcial repetido nao reescreve (idempotente)", async () => {
    estado.linhas[0].precisa_revisao = true;
    estado.linhas[0].error_code = "marcado_antes";
    await applyRefundToFiscalInvoice({
      stripeChargeId: "ch_1",
      grossCents: 22200,
      refundedTotalCents: 5000,
      origem: "webhook",
    });
    expect(estado.linhas[0].error_code).toBe("marcado_antes");
  });

  it("nota que NAO esta emitida e ignorada", async () => {
    // Reembolso que chega antes da emissao concluir: nao ha o que cancelar, e
    // marcar revisao numa nota que ainda vai nascer so geraria ruido.
    estado.linhas[0].status = "pending";
    await applyRefundToFiscalInvoice({
      stripeChargeId: "ch_1",
      grossCents: 2990,
      refundedTotalCents: 2990,
      origem: "webhook",
    });
    expect(estado.cancelamentos).toEqual([]);
    expect(estado.linhas[0].precisa_revisao).toBe(false);
  });

  it("cobranca sem nota nao explode", async () => {
    estado.linhas = [];
    await expect(
      applyRefundToFiscalInvoice({
        stripeChargeId: "ch_sem_nota",
        grossCents: 2990,
        refundedTotalCents: 2990,
        origem: "webhook",
      }),
    ).resolves.toBeUndefined();
    expect(estado.cancelamentos).toEqual([]);
  });
});
