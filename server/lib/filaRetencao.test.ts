import { describe, expect, it, vi } from "vitest";

/**
 * RETENCAO das duas filas, afirmada em numero.
 *
 * O defeito que isto trava, medido em 02/09/2026: a fila `emails` usava
 * `removeOnComplete: 100`. Com ~85 `welcome` por dia, o historico durava cerca
 * de sete horas, e a investigacao sobre o que um worker de dev consumiu entre
 * 29/08 e 02/09 encontrou o periodo ja descartado pelo proprio BullMQ. A
 * pergunta nao ficou dificil, ficou impossivel.
 *
 * Os numeros aqui sao escritos a mao, em segundos, nao derivados das constantes
 * do modulo: expectativa derivada da fonte erra junto com a fonte.
 */

vi.mock("./env", () => ({
  env: {
    redisUrl: "redis://localhost:6379",
    transactionalEmailRateMs: 1000,
    emailCampaignRateMs: 1000,
    resendApiKey: "re_test",
    appPublicUrl: "https://exemplo.com.br",
  },
}));

const filas = vi.hoisted(() => ({
  criadas: [] as Array<{ nome: string; opts: Record<string, unknown> }>,
}));

vi.mock("bullmq", () => ({
  Queue: class {
    constructor(nome: string, opts: Record<string, unknown>) {
      filas.criadas.push({ nome, opts });
    }
    add() {
      return Promise.resolve();
    }
  },
  Worker: class {
    on() {}
  },
}));

vi.mock("./redis", () => ({
  queueConnection: {},
  cacheConnection: {},
}));

import "./queue";
import "./emailCampaignQueue";

function opcoesDa(nome: string) {
  const fila = filas.criadas.find((f) => f.nome === nome);
  if (!fila) throw new Error(`fila ${nome} nao foi criada`);
  return fila.opts.defaultJobOptions as {
    removeOnComplete: { age: number; count: number };
    removeOnFail: { age: number; count: number };
  };
}

describe("retencao das filas: idade e teto, em numero", () => {
  it("as duas filas foram criadas", () => {
    expect(filas.criadas.map((f) => f.nome).sort()).toEqual([
      "email-campaign",
      "emails",
    ]);
  });

  it("emails: 7 dias de historico, teto de 5000", () => {
    const o = opcoesDa("emails");
    // 604800 = 7 * 24 * 3600, escrito a mao.
    expect(o.removeOnComplete).toEqual({ age: 604800, count: 5000 });
    // 2592000 = 30 * 24 * 3600.
    expect(o.removeOnFail).toEqual({ age: 2592000, count: 5000 });
  });

  it("email-campaign: 30 dias nos dois, com os tetos que ja tinha", () => {
    const o = opcoesDa("email-campaign");
    expect(o.removeOnComplete).toEqual({ age: 2592000, count: 1000 });
    expect(o.removeOnFail).toEqual({ age: 2592000, count: 5000 });
  });

  it("nenhuma das duas usa mais o formato NUMERO puro", () => {
    // O formato antigo (`removeOnComplete: 100`) corta so por contagem, e foi
    // ele que apagou a janela de 29/08 a 02/09. Um numero solto aqui de novo
    // reprova.
    for (const nome of ["emails", "email-campaign"]) {
      const o = opcoesDa(nome);
      expect(typeof o.removeOnComplete).toBe("object");
      expect(typeof o.removeOnFail).toBe("object");
    }
  });

  it("7 dias cobre com folga o volume medido (~85 welcome por dia)", () => {
    // 85 por dia por 7 dias = 595, bem abaixo do teto de 5000: na pratica quem
    // corta e a idade, nao a contagem, que e a intencao.
    const o = opcoesDa("emails");
    expect(85 * 7).toBeLessThan(o.removeOnComplete.count);
  });
});
