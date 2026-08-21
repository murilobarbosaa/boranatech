import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CADA CALL SITE DE BANCO DO CAMINHO DA ANALISE ESTOURA NO PRAZO NOVO, e produz
 * o desfecho que foi DECLARADO para ele?
 *
 * O prazo de banco nao e um numero solto: ele tem uma consequencia diferente em
 * cada round-trip, e essa consequencia e a parte que precisa de teste, nao a
 * subtracao. A tabela que este arquivo trava:
 *
 *   reserva (as duas RPCs)  fail-closed SEM cobranca. Nenhuma vaga e criada do
 *                           nosso lado e a analise nem comeca.
 *   log_busca_reserva       nao sei se existe reserva, entao NADA e escrito.
 *                           Inserir aqui dobraria a contagem do dia da pessoa.
 *   log_grava_uso           a confirmacao segue em voo. NAO e orfandade, e por
 *                           isso NAO dispara o alarme de reserva orfa.
 *
 * E a quarta afirmacao, que e a que protege as outras oito ferramentas de IA:
 * sem `prazoBancoMs`, nao existe prazo nenhum. `checkAiDailyLimit` e
 * `logAiUsage` servem nove rotas, e so o caminho da analise foi medido.
 *
 * Relogio falso e supabase dublado: nada de rede, nada de espera real.
 */

vi.mock("@sentry/node", async () => {
  const { espiao } = await import("./__mocks__/sentryEspiao");
  return espiao();
});

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, aiDailyLimitPro: 20, aiDailyLimitFree: 3 },
  };
});

/** Round-trips que o duble VIU acontecer, na ordem. */
const operacoes: string[] = [];
/** Round-trips que o duble deve TRAVAR (promessa que nunca resolve). */
const travar = new Set<string>();
/** Id devolvido pela busca de reserva; null = nao ha reserva em voo. */
let reservaEmVoo: string | null = null;
/** Round-trips que o duble deve responder com ERRO do proprio Postgres. */
const falhar = new Set<string>();

function resultado<T>(nome: string, valor: T): Promise<T> {
  operacoes.push(nome);
  if (travar.has(nome)) return new Promise<T>(() => undefined);
  return Promise.resolve(valor);
}

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: (nome: string) =>
      nome === "reserve_ai_usage_slot"
        ? resultado("rpc:reserve", {
            data: [{ allowed: true, usage_count: 1, reservation_id: "r1" }],
            error: null,
          })
        : resultado("rpc:get_ai_usage_today", { data: 0, error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  resultado("select:reserva", {
                    data: reservaEmVoo ? [{ id: reservaEmVoo }] : [],
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      }),
      update: () => ({
        eq: () =>
          resultado("update:reserva", {
            error: falhar.has("update:reserva")
              ? { message: "permission denied" }
              : null,
          }),
      }),
      insert: () => resultado("insert:uso", { error: null }),
    }),
  },
}));

import { capturados } from "./__mocks__/sentryEspiao";
import { PRAZO_BANCO_ANALISE_MS } from "../../shared/linkedin/prazos";
import { checkAiDailyLimit, logAiUsage } from "./aiUsage";

const USUARIO = "00000000-0000-4000-8000-000000000001";
const TOOL = "linkedin-analyzer";

const LOG_BASE = {
  userId: USUARIO,
  tool: TOOL,
  requestId: "req-1",
  status: "success",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  operacoes.length = 0;
  travar.clear();
  falhar.clear();
  capturados.length = 0;
  reservaEmVoo = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Roda a promessa ate `ms` de relogio falso e devolve o desfecho. */
async function em<T>(ms: number, p: Promise<T>): Promise<T> {
  const observado = p;
  await vi.advanceTimersByTimeAsync(ms);
  return observado;
}

describe("reserva: fail-closed SEM cobranca", () => {
  it("as duas RPCs travadas devolvem verificationFailed e nao criam vaga", async () => {
    travar.add("rpc:reserve");
    travar.add("rpc:get_ai_usage_today");

    const usage = await em(
      PRAZO_BANCO_ANALISE_MS * 2,
      checkAiDailyLimit(
        USUARIO,
        true,
        "[linkedin]",
        TOOL,
        PRAZO_BANCO_ANALISE_MS,
      ),
    );

    // 503 na rota, nao 429: e falha de VERIFICACAO, nao limite atingido.
    expect(usage.allowed).toBe(false);
    expect(usage.verificationFailed).toBe(true);

    // A PROVA DE "SEM COBRANCA": nenhuma escrita saiu daqui. As duas RPCs foram
    // TENTADAS (e podem ate aterrissar depois, criando uma linha `reserved` que
    // o TTL de 10 minutos devolve), mas do nosso lado nao houve insert nenhum
    // e, sobretudo, a rota nao segue para a chamada paga de IA.
    expect(operacoes).toEqual(["rpc:reserve", "rpc:get_ai_usage_today"]);
    expect(operacoes).not.toContain("insert:uso");
    expect(operacoes).not.toContain("update:reserva");
  });

  it("so a RPC atomica travada cai no modo degradado e responde por ele", async () => {
    travar.add("rpc:reserve");

    const usage = await em(
      PRAZO_BANCO_ANALISE_MS,
      checkAiDailyLimit(
        USUARIO,
        true,
        "[linkedin]",
        TOOL,
        PRAZO_BANCO_ANALISE_MS,
      ),
    );

    // O caminho degradado responde: a analise acontece, com a corrida de cota
    // aberta que o proprio modo degradado ja assume. E o QUINTO round-trip da
    // conta do pior caso.
    expect(usage.allowed).toBe(true);
    expect(operacoes).toEqual(["rpc:reserve", "rpc:get_ai_usage_today"]);
  });
});

describe("log_busca_reserva: nao sei, entao nao escrevo", () => {
  it("busca travada NAO insere linha nova (seria contagem dobrada)", async () => {
    travar.add("select:reserva");

    await em(
      PRAZO_BANCO_ANALISE_MS,
      logAiUsage({ ...LOG_BASE, prazoBancoMs: PRAZO_BANCO_ANALISE_MS }),
    );

    // ESTA E A ASSERCAO QUE JUSTIFICA O RAMO. Antes do prazo, `acharReserva`
    // devolvia `null` para qualquer falha, e `null` manda inserir. Se o prazo
    // caisse dentro daquele `catch`, uma reserva que EXISTE ganharia uma segunda
    // linha por cima, e o contador do dia somaria as duas.
    expect(operacoes).toEqual(["select:reserva"]);
    expect(operacoes).not.toContain("insert:uso");
    expect(operacoes).not.toContain("update:reserva");
  });
});

describe("log_grava_uso: em voo NAO e orfandade", () => {
  it("update travado nao dispara o alarme de reserva orfa", async () => {
    reservaEmVoo = "reserva-1";
    travar.add("update:reserva");

    await em(
      PRAZO_BANCO_ANALISE_MS,
      logAiUsage({ ...LOG_BASE, prazoBancoMs: PRAZO_BANCO_ANALISE_MS }),
    );

    expect(operacoes).toEqual(["select:reserva", "update:reserva"]);
    // O alarme de orfa significa "cobrada e nao entregue, va olhar o banco".
    // Prazo estourado nao e isso: o update segue em voo e provavelmente fecha a
    // reserva com atraso. Disparar aqui seria alarme falso a cada lentidao, e
    // alarme falso e como um alarme acaba desligado.
    expect(capturados.filter((c) => c.msg.includes("ORFA"))).toHaveLength(0);
  });

  it("erro REAL do update continua disparando o alarme", async () => {
    reservaEmVoo = "reserva-1";
    falhar.add("update:reserva");

    await em(
      PRAZO_BANCO_ANALISE_MS,
      logAiUsage({ ...LOG_BASE, prazoBancoMs: PRAZO_BANCO_ANALISE_MS }),
    );

    // O CONTRAPONTO do teste acima, e ele e que da valor aos dois. Silenciar o
    // prazo so vale se a falha de verdade continuar gritando; sem esta metade,
    // um `catch` que engolisse tudo passaria igual.
    expect(operacoes).toEqual(["select:reserva", "update:reserva"]);
    expect(capturados.filter((c) => c.msg.includes("ORFA"))).toHaveLength(1);
  });

  it("update que aterrissa a tempo fecha a reserva sem alarme", async () => {
    reservaEmVoo = "reserva-1";

    await em(
      PRAZO_BANCO_ANALISE_MS,
      logAiUsage({ ...LOG_BASE, prazoBancoMs: PRAZO_BANCO_ANALISE_MS }),
    );

    // O caminho normal, que o prazo nao pode ter mudado: uma confirmacao, sem
    // linha extra e sem alarme.
    expect(operacoes).toEqual(["select:reserva", "update:reserva"]);
    expect(capturados).toHaveLength(0);
  });
});

describe("as outras oito ferramentas nao foram tocadas", () => {
  it("checkAiDailyLimit sem prazo nao ganha prazo nenhum", async () => {
    travar.add("rpc:reserve");
    let terminou = false;
    void checkAiDailyLimit(USUARIO, true, "[ai]", "ai").then(
      () => {
        terminou = true;
      },
      () => {
        terminou = true;
      },
    );

    // Dez vezes o prazo do caminho da analise. Continua pendurado no unico teto
    // que sempre valeu para ele, o global de 15s do proprio cliente supabase,
    // que este lote NAO mexeu.
    await vi.advanceTimersByTimeAsync(PRAZO_BANCO_ANALISE_MS * 10);
    expect(terminou).toBe(false);
  });

  it("logAiUsage sem prazo nao ganha prazo nenhum", async () => {
    travar.add("select:reserva");
    let terminou = false;
    void logAiUsage({ ...LOG_BASE, tool: "github-analyzer" }).then(() => {
      terminou = true;
    });

    await vi.advanceTimersByTimeAsync(PRAZO_BANCO_ANALISE_MS * 10);
    expect(terminou).toBe(false);
  });
});
