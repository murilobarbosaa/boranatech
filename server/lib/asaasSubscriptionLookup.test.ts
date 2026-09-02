import { describe, expect, it, vi } from "vitest";

import {
  resolverAssinaturaDoAsaas,
  type AssinaturaDoAsaas,
} from "./asaasSubscriptionLookup";

/**
 * O QUE ESTE ARQUIVO TRAVA e a ORDEM das tentativas, que e a unica coisa capaz
 * de ficar errada aqui e a unica que nao aparece na tela: perguntar pelo id
 * local primeiro acha a row certa na maioria das vezes e a errada exatamente no
 * reprocessamento fora de ordem.
 */

const POR_COBRANCA: AssinaturaDoAsaas = {
  id: "row-da-cobranca",
  user_id: "user-1",
  status: "pending",
  plan_id: "plan-1",
  affiliate_code: null,
  coupon_code: null,
};

const POR_ID: AssinaturaDoAsaas = {
  ...POR_COBRANCA,
  id: "row-do-external-reference",
};

describe("resolverAssinaturaDoAsaas", () => {
  it("a COBRANCA vem primeiro quando as duas chaves resolvem", async () => {
    // A ligacao que o PROVEDOR confirma ganha da que nos afirmamos.
    const porCobranca = vi.fn(async () => POR_COBRANCA);
    const porId = vi.fn(async () => POR_ID);

    const r = await resolverAssinaturaDoAsaas("pay_1", "row-x", {
      porCobranca,
      porId,
    });

    expect(r).toBe(POR_COBRANCA);
    // E o segundo lookup NEM ACONTECE: uma consulta a menos por event, e a
    // prova de que a ordem e real e nao coincidencia do dado de teste.
    expect(porId).not.toHaveBeenCalled();
  });

  it("cai no id local quando a cobranca nao resolve", async () => {
    // Janela em que a charge foi criada e o UPDATE que grava
    // `provider_subscription_id` nao concluiu.
    const r = await resolverAssinaturaDoAsaas("pay_1", "row-x", {
      porCobranca: async () => null,
      porId: async () => POR_ID,
    });

    expect(r).toBe(POR_ID);
  });

  it("sem chargeId, nao consulta por cobranca", async () => {
    const porCobranca = vi.fn(async () => POR_COBRANCA);

    const r = await resolverAssinaturaDoAsaas(null, "row-x", {
      porCobranca,
      porId: async () => POR_ID,
    });

    expect(porCobranca).not.toHaveBeenCalled();
    expect(r).toBe(POR_ID);
  });

  it("nenhuma das duas resolve: null, e null NAO e erro", async () => {
    // Quem chama decide o que fazer: o webhook lanca (pagamento sem linha e
    // grave), o backfill grava a linha sem dono (dinheiro que se moveu precisa
    // aparecer no caixa).
    const r = await resolverAssinaturaDoAsaas("pay_1", "row-x", {
      porCobranca: async () => null,
      porId: async () => null,
    });

    expect(r).toBeNull();
  });

  it("sem nenhuma das duas chaves: null, sem consulta nenhuma", async () => {
    const porCobranca = vi.fn(async () => POR_COBRANCA);
    const porId = vi.fn(async () => POR_ID);

    const r = await resolverAssinaturaDoAsaas(null, null, {
      porCobranca,
      porId,
    });

    expect(r).toBeNull();
    expect(porCobranca).not.toHaveBeenCalled();
    expect(porId).not.toHaveBeenCalled();
  });

  it("erro de leitura PROPAGA, nao vira 'nao encontrei'", async () => {
    // Tratar falha de banco como ausencia faria o webhook concluir "pagamento
    // sem linha" e o backfill gravar a receita sem dono, os dois em silencio.
    await expect(
      resolverAssinaturaDoAsaas("pay_1", "row-x", {
        porCobranca: async () => {
          throw new Error("boom");
        },
        porId: async () => POR_ID,
      }),
    ).rejects.toThrow("boom");
  });
});
