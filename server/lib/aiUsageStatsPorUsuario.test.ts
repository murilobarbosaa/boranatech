import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * CUSTO DE IA POR USUARIO, a agregacao.
 *
 * A tabela que este agregado alimenta substituiu um `PendingIntegration` que
 * dizia "Dados agregados por usuario disponiveis apos 30 dias" enquanto o
 * `user_id` ja estava gravado havia mais de cem dias. O que trava aqui e a
 * IDENTIDADE de criterio com `agregarUsoDeIa`: se as duas divergirem, a tabela
 * por usuario e o card por ferramenta somam custos diferentes sobre as MESMAS
 * linhas, e nada acusa, porque os dois numeros continuam plausiveis.
 */

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("../routes/adminUsersHarness.test").criarSupabaseDouble
  >,
}));

vi.mock("./supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));

import { criarSupabaseDouble } from "../routes/adminUsersHarness.test";
import {
  agregarUsoDeIa,
  AI_STATS_JANELA_DIAS,
  custoDeIaPorUsuario,
  inicioDaJanelaDeIa,
} from "./aiUsageStats";

type Linha = {
  id?: number;
  user_id: string | null;
  tool?: string;
  status: string | null;
  cost_estimate: string | null;
};

let proximoId = 1;
function log(over: Partial<Linha> = {}): Linha {
  return {
    id: proximoId++,
    user_id: "u1",
    tool: "agent-chat",
    status: "success",
    cost_estimate: "1",
    created_at: "2026-08-20T12:00:00Z",
    ...over,
  } as Linha;
}

function base(rows: Linha[], maxRows: number | null = null) {
  proximoId = 1;
  estado.double = criarSupabaseDouble(
    { ai_usage_logs: { rows } },
    {},
    undefined,
    maxRows,
  );
}

afterEach(() => vi.clearAllMocks());

const DESDE = "2026-01-01T00:00:00Z";

describe("custoDeIaPorUsuario", () => {
  it("soma por usuario e ordena por custo desc", async () => {
    base([
      log({ user_id: "ana", cost_estimate: "0.50" }),
      log({ user_id: "ana", cost_estimate: "0.25" }),
      log({ user_id: "bia", cost_estimate: "2.00" }),
      log({ user_id: "caio", cost_estimate: "0.10" }),
    ]);
    const r = await custoDeIaPorUsuario(DESDE, 20);

    expect(r.top.map((l) => l.userId)).toEqual(["bia", "ana", "caio"]);
    expect(r.top[0].cost).toBeCloseTo(2, 10);
    expect(r.top[1].cost).toBeCloseTo(0.75, 10);
    expect(r.top[1].calls).toBe(2);
    // CONTROLE NEGATIVO: ninguem sobrou, entao nao ha resto a declarar.
    expect(r.maisUsuarios).toBe(0);
    expect(r.usuariosDistintos).toBe(3);
    expect(r.semUsuario).toBeNull();
  });

  it("NaN de cost_estimate vira semCustoMedido e NAO contamina a soma", async () => {
    // O defeito que isto trava: uma unica linha ilegivel fazendo `cost` virar
    // NaN derrubaria a coluna inteira do usuario para "NaN", e a ordenacao com
    // NaN e silenciosamente arbitraria. Mesma regra de `agregarUsoDeIa`.
    base([
      log({ user_id: "ana", cost_estimate: "0.40" }),
      log({ user_id: "ana", cost_estimate: "ilegivel" }),
    ]);
    const r = await custoDeIaPorUsuario(DESDE, 20);

    expect(Number.isFinite(r.top[0].cost)).toBe(true);
    expect(r.top[0].cost).toBeCloseTo(0.4, 10);
    expect(r.top[0].semCustoMedido).toBe(1);
    expect(r.top[0].calls).toBe(2);
  });

  it("custo zero em sucesso conta como nao medido; erro com zero NAO conta", async () => {
    // A distincao inteira do campo: linha de erro nao chamou o modelo, e custo
    // zero nela e o valor certo, nao uma medicao faltando.
    base([
      log({ user_id: "ana", cost_estimate: "0", status: "success" }),
      log({ user_id: "ana", cost_estimate: "0", status: "error" }),
      log({ user_id: "ana", cost_estimate: null, status: "rate_limited" }),
    ]);
    const r = await custoDeIaPorUsuario(DESDE, 20);

    expect(r.top[0].calls).toBe(3);
    expect(r.top[0].success).toBe(1);
    expect(r.top[0].semCustoMedido).toBe(1);
  });

  it("user_id NULL vira balde nomeado, fora do ranking e nunca descartado", async () => {
    base([
      log({ user_id: null, cost_estimate: "5.00" }),
      log({ user_id: "ana", cost_estimate: "1.00" }),
    ]);
    const r = await custoDeIaPorUsuario(DESDE, 20);

    // O balde tem o MAIOR custo e mesmo assim nao encabeca o ranking: ele nao e
    // uma pessoa. E nao sumiu: esta declarado ao lado.
    expect(r.top.map((l) => l.userId)).toEqual(["ana"]);
    expect(r.semUsuario).not.toBeNull();
    expect(r.semUsuario!.cost).toBeCloseTo(5, 10);
    expect(r.semUsuario!.calls).toBe(1);
    // CONTROLE NEGATIVO: o balde nao entra na contagem de usuarios distintos.
    expect(r.usuariosDistintos).toBe(1);
  });

  it("corta no topo pedido e DECLARA quantos ficaram de fora", async () => {
    // Corte mudo seria um numero com cara de total. `maisUsuarios` e o que
    // separa "estes sao todos" de "estes sao os maiores".
    const rows = Array.from({ length: 25 }, (_, i) =>
      log({ user_id: `u${String(i).padStart(2, "0")}`, cost_estimate: `${i}` }),
    );
    base(rows);
    const r = await custoDeIaPorUsuario(DESDE, 20);

    expect(r.top).toHaveLength(20);
    expect(r.maisUsuarios).toBe(5);
    expect(r.usuariosDistintos).toBe(25);
    // O topo e o MAIOR custo, nao os primeiros lidos.
    expect(r.top[0].userId).toBe("u24");
  });

  it("PAGINA: o teto de linhas do PostgREST nao pode virar soma menor", async () => {
    // O defeito medido na irma em 2026-07-31: sem paginar, o painel exibia
    // R$ 1,45 onde o custo era R$ 1,58, e o erro cresce com o volume.
    const rows = Array.from({ length: 1500 }, () =>
      log({ user_id: "ana", cost_estimate: "0.01" }),
    );
    base(rows, 1000);
    const r = await custoDeIaPorUsuario(DESDE, 20);

    expect(r.top[0].calls).toBe(1500);
    expect(r.top[0].cost).toBeCloseTo(15, 6);
  });

  it("empate de custo tem desempate estavel, para o corte do topo nao oscilar", async () => {
    base([
      log({ user_id: "zeta", cost_estimate: "1.00" }),
      log({ user_id: "alfa", cost_estimate: "1.00" }),
    ]);
    const primeira = await custoDeIaPorUsuario(DESDE, 20);
    base([
      log({ user_id: "alfa", cost_estimate: "1.00" }),
      log({ user_id: "zeta", cost_estimate: "1.00" }),
    ]);
    const segunda = await custoDeIaPorUsuario(DESDE, 20);

    expect(primeira.top.map((l) => l.userId)).toEqual(["alfa", "zeta"]);
    expect(segunda.top.map((l) => l.userId)).toEqual(["alfa", "zeta"]);
  });

  it("o custo total por usuario BATE com o custo total por ferramenta", async () => {
    // A trava que importa para a tela: a tabela nova fica ao lado do card de
    // custo total, e os dois leem as MESMAS linhas. Divergirem seria dois
    // numeros plausiveis e incompativeis no mesmo cartao.
    const rows = [
      log({ user_id: "ana", tool: "agent-chat", cost_estimate: "0.30" }),
      log({ user_id: "bia", tool: "interview", cost_estimate: "0.70" }),
      log({ user_id: null, tool: "agent-chat", cost_estimate: "0.25" }),
      log({ user_id: "ana", tool: "interview", cost_estimate: "ilegivel" }),
    ];
    base(rows);
    const porUsuario = await custoDeIaPorUsuario(DESDE, 20);
    base(rows);
    const porFerramenta = await agregarUsoDeIa(DESDE);

    const totalUsuario =
      porUsuario.top.reduce((s, l) => s + l.cost, 0) +
      (porUsuario.semUsuario?.cost ?? 0);
    const totalFerramenta = Object.values(porFerramenta).reduce(
      (s, i) => s + i.cost,
      0,
    );
    expect(totalUsuario).toBeCloseTo(totalFerramenta, 10);
    expect(totalUsuario).toBeCloseTo(1.25, 10);
  });
});

describe("a janela da aba IA", () => {
  it("e uma constante compartilhada, nao um 30 escrito em cada lugar", () => {
    expect(AI_STATS_JANELA_DIAS).toBe(30);
    const agora = new Date("2026-08-22T05:00:00.000Z");
    expect(inicioDaJanelaDeIa(agora)).toBe("2026-07-23T05:00:00.000Z");
  });
});
