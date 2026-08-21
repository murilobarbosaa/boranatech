import { beforeEach, describe, expect, it, vi } from "vitest";

const supa = vi.hoisted(() => {
  const mutacoes: Array<{ tabela: string; dados: unknown }> = [];
  const fila: Array<{ data: unknown; error: unknown }> = [];
  function from(tabela: string) {
    let op = "select";
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "eq", "not", "limit", "order"])
      chain[m] = () => chain;
    chain.update = (dados: unknown) => {
      op = "update";
      mutacoes.push({ tabela, dados });
      return chain;
    };
    chain.then = (r: (v: unknown) => unknown) => {
      if (op === "update") return Promise.resolve({ error: null }).then(r);
      return Promise.resolve(fila.shift() ?? { data: [], error: null }).then(r);
    };
    return chain;
  }
  return {
    from,
    mutacoes,
    fila,
    reset() {
      mutacoes.length = 0;
      fila.length = 0;
    },
  };
});
vi.mock("./supabaseAdmin", () => ({ supabaseAdmin: { from: supa.from } }));

const sentry = vi.hoisted(() => ({ updateIssueStatus: vi.fn() }));
vi.mock("./sentryApi", () => sentry);

import {
  alvoDaTransicao,
  empurrarResolucao,
  reenviarPushesPendentes,
} from "./sentryTaskPush";

beforeEach(() => {
  supa.reset();
  vi.clearAllMocks();
  sentry.updateIssueStatus.mockResolvedValue({ state: "ok" });
});

// Os sete testes que a EMENDA 1 exigiu ao revogar o invariante 6 original, e que
// ficaram impossiveis de escrever ate a Fase 5.5, porque o push estava sem
// gatilho e sem coluna de retry.

describe("1 e 2: a transicao decide, e e simetrica", () => {
  it("entrar em etapa terminal empurra 'resolved'", () => {
    expect(
      alvoDaTransicao({
        temVinculo: true,
        origemEraTerminal: false,
        destinoEhTerminal: true,
      }),
    ).toBe("resolved");
  });

  it("sair de etapa terminal empurra 'unresolved'", () => {
    expect(
      alvoDaTransicao({
        temVinculo: true,
        origemEraTerminal: true,
        destinoEhTerminal: false,
      }),
    ).toBe("unresolved");
  });
});

describe("7: simetria, ida e volta devolve o Sentry ao estado inicial", () => {
  it("resolved e depois unresolved", async () => {
    // A asserção que sustenta "arrasto acidental e autocuravel". Se alguem
    // otimizar o caminho de volta ("nao precisa chamar o Sentry ao sair de
    // Concluido, o card ja estava certo"), o push vira mao unica e o erro deixa
    // de ter conserto pela interface.
    const ida = alvoDaTransicao({
      temVinculo: true,
      origemEraTerminal: false,
      destinoEhTerminal: true,
    });
    const volta = alvoDaTransicao({
      temVinculo: true,
      origemEraTerminal: true,
      destinoEhTerminal: false,
    });
    expect(ida).toBe("resolved");
    expect(volta).toBe("unresolved");

    await empurrarResolucao({ taskId: "t1", numericId: "99", alvo: ida! });
    await empurrarResolucao({ taskId: "t1", numericId: "99", alvo: volta! });
    expect(sentry.updateIssueStatus.mock.calls.map((c) => c[1])).toEqual([
      "resolved",
      "unresolved",
    ]);
  });
});

describe("5: card SEM vinculo do Sentry nao dispara nada", () => {
  it("nem entrando nem saindo de terminal", () => {
    expect(
      alvoDaTransicao({
        temVinculo: false,
        origemEraTerminal: false,
        destinoEhTerminal: true,
      }),
    ).toBeNull();
    expect(
      alvoDaTransicao({
        temVinculo: false,
        origemEraTerminal: true,
        destinoEhTerminal: false,
      }),
    ).toBeNull();
  });

  it("CONTROLE: o MESMO movimento COM vinculo dispara", () => {
    // Sem isto, "nao dispara" seria compativel com "nunca dispara".
    expect(
      alvoDaTransicao({
        temVinculo: true,
        origemEraTerminal: false,
        destinoEhTerminal: true,
      }),
    ).toBe("resolved");
  });
});

describe("6: movimento que NAO e transicao nao empurra", () => {
  it("terminal para terminal nao empurra", () => {
    // Concluido -> Cancelado (as duas is_done). O card nao foi "concluido de
    // novo", e reempurrar seria escrita externa sem fato novo.
    expect(
      alvoDaTransicao({
        temVinculo: true,
        origemEraTerminal: true,
        destinoEhTerminal: true,
      }),
    ).toBeNull();
  });

  it("comum para comum nao empurra", () => {
    // E ESTE e o caso dos 10 concluidos migrados: eles nasceram EM Concluido,
    // pela migracao, e nunca passaram por uma transicao. Nenhum caminho os
    // alcanca, porque o push so existe dentro de moveTask e moveTask exige um
    // movimento. Empurrar resolvido para 10 issues de uma vez, por efeito
    // colateral de migracao, e exatamente o que este teste impede.
    expect(
      alvoDaTransicao({
        temVinculo: true,
        origemEraTerminal: false,
        destinoEhTerminal: false,
      }),
    ).toBeNull();
  });
});

describe("3: falha no Sentry nao desfaz o movimento", () => {
  it("erro vira pendencia, e o card nao e tocado", async () => {
    sentry.updateIssueStatus.mockResolvedValue({
      state: "error",
      reason: "500 do Sentry",
      httpStatus: 500,
    });
    const r = await empurrarResolucao({
      taskId: "t1",
      numericId: "99",
      alvo: "resolved",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.pendente).toBe(true);

    // A UNICA escrita e a pendencia. Nada de column_id, completed_at ou
    // position: o movimento foi decidido por uma pessoa e o banco ja o gravou.
    expect(supa.mutacoes).toHaveLength(1);
    const dados = supa.mutacoes[0].dados as Record<string, unknown>;
    expect(Object.keys(dados)).toEqual(["sentry_sync_pending"]);
    expect(dados.sentry_sync_pending).toBe("resolved");
  });

  it("sucesso limpa a pendencia", async () => {
    const r = await empurrarResolucao({
      taskId: "t1",
      numericId: "99",
      alvo: "resolved",
    });
    expect(r.ok).toBe(true);
    expect(supa.mutacoes[0].dados).toEqual({ sentry_sync_pending: null });
  });

  it("404 NAO vira pendencia: issue apagada nao tem o que sincronizar", async () => {
    sentry.updateIssueStatus.mockResolvedValue({
      state: "error",
      reason: "Sentry respondeu 404.",
      httpStatus: 404,
    });
    const r = await empurrarResolucao({
      taskId: "t1",
      numericId: "99",
      alvo: "resolved",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.pendente).toBe(false);
    // Insistir para sempre seria ruido permanente num job de 15 em 15 minutos.
    expect(supa.mutacoes[0].dados).toEqual({ sentry_sync_pending: null });
  });
});

describe("retry: ENTREGA, nunca decisao", () => {
  it("reenvia o alvo guardado, sem recalcular nada", async () => {
    supa.fila.push({
      data: [
        { id: "t1", sentry_numeric_id: "99", sentry_sync_pending: "resolved" },
        {
          id: "t2",
          sentry_numeric_id: "88",
          sentry_sync_pending: "unresolved",
        },
      ],
      error: null,
    });
    const r = await reenviarPushesPendentes();
    expect(r).toEqual({
      tentados: 2,
      entregues: 2,
      falharam: 0,
      descartados: 0,
    });
    // O alvo vem da COLUNA, nao de uma reavaliacao do estado do card. E o que
    // torna o retry idempotente e o que o mantem do lado da entrega.
    expect(sentry.updateIssueStatus.mock.calls.map((c) => c[1])).toEqual([
      "resolved",
      "unresolved",
    ]);
  });

  it("sem pendencia, nao chama o Sentry", async () => {
    const r = await reenviarPushesPendentes();
    expect(r.tentados).toBe(0);
    expect(sentry.updateIssueStatus).not.toHaveBeenCalled();
  });
});
