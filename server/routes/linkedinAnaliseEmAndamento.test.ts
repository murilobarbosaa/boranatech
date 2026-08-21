import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * DUAS ANALISES DO MESMO USUARIO AO MESMO TEMPO: a segunda e recusada?
 *
 * O achado (Fase 4, investigacao, achado 2): a reserva ja era atomica, mas o
 * advisory lock so decidia se CABIA NA COTA. Com cota livre, duas abas passavam
 * as duas, pagavam duas chamadas de IA pelo mesmo perfil e gravavam duas linhas
 * no historico. O `if (loading)` do cliente nao alcanca isso: e estado local de
 * uma pagina React, e a segunda aba tem o seu.
 *
 * O que este arquivo prova, com a RPC DUBLADA e zero rede:
 *
 *   1. o desfecho novo da RPC vira 409 com o codigo `analise_em_andamento`,
 *      distinto de qualquer outro erro desta rota;
 *   2. a chamada da reserva recebe a JANELA, e ela e exatamente a constante
 *      derivada do shared (`TETO_CLIENT_MS`), nao um numero digitado aqui;
 *   3. neste ramo `logAiUsage` NAO e chamada. Ela confirmaria a reserva da
 *      analise que ainda esta rodando, e essa e a forma mais facil de reabrir
 *      por outra porta a corrida que o lote fecha;
 *   4. quem chama SEM janela (as outras oito ferramentas) invoca a RPC com os
 *      tres argumentos de sempre, entao nem alcanca o corpo novo;
 *   5. reserva pendente do MESMO usuario em OUTRA ferramenta nao bloqueia. O
 *      advisory lock e por usuario, mas a recusa e por (usuario, ferramenta).
 */

vi.mock("../lib/env", async (importActual) => {
  const real = await importActual<typeof import("../lib/env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

interface UsuarioDoTeste {
  id: string;
  email: string;
  role: string;
}

vi.mock("../middleware/auth", () => ({
  requireAuth: (req: express.Request, _res: unknown, next: () => void) => {
    (req as express.Request & { user: UsuarioDoTeste }).user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "teste@boranatech.com.br",
      role: "authenticated",
    };
    next();
  },
  checkProStatus: (req: express.Request, _res: unknown, next: () => void) => {
    (req as express.Request & { isPro: boolean }).isPro = true;
    next();
  },
}));

/** Argumentos com que a RPC de reserva foi invocada, na ordem. */
const chamadasDaReserva: Record<string, unknown>[] = [];
/** Reservas pendentes fingidas, por ferramenta. */
const pendentesPorFerramenta = new Set<string>();

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: (nome: string, args: Record<string, unknown>) => {
      if (nome !== "reserve_ai_usage_slot") {
        return Promise.resolve({ data: 0, error: null });
      }
      chamadasDaReserva.push(args);
      // MODELO DO CORPO DA MIGRATION, e so dele: janela positiva mais reserva
      // pendente da MESMA ferramenta recusa; qualquer outra combinacao reserva.
      const janela = args.p_janela_andamento_ms;
      const ferramenta = String(args.p_tool);
      const bloqueia =
        typeof janela === "number" &&
        janela > 0 &&
        pendentesPorFerramenta.has(ferramenta);
      return Promise.resolve({
        data: bloqueia
          ? [
              {
                allowed: false,
                usage_count: null,
                reservation_id: null,
                motivo: "analise_em_andamento",
              },
            ]
          : [
              {
                allowed: true,
                usage_count: 1,
                reservation_id: "reserva-nova",
                motivo: "reservado",
              },
            ],
        error: null,
      });
    },
    from: () => {
      throw new Error("sem banco neste teste");
    },
  },
}));

const logAiUsage = vi.fn(async () => undefined);
vi.mock("../lib/aiUsage", async (importActual) => {
  const real = await importActual<typeof import("../lib/aiUsage")>();
  return { ...real, logAiUsage: () => logAiUsage() };
});

import { TETO_CLIENT_MS } from "../../shared/linkedin/prazos";
import { checkAiDailyLimit } from "../lib/aiUsage";
import * as http from "../lib/http";
import { errorHandler } from "../middleware/error";
import linkedinRouter from "./linkedin";

const PERFIL = `Contato
teste@email.com
Fulana Teste
Desenvolvedora Front-end | React, TypeScript
Resumo
${"Sou desenvolvedora front-end construindo interfaces de produto para times distribuidos. ".repeat(4)}
Experience
Empresa Alfa
Desenvolvedora Front-end
janeiro de 2022 - Present
2 anos
Desenvolvi telas em React para 12 squads internos e acompanhei metricas de qualidade durante os ciclos de entrega do produto.`;

const CORPO = {
  profileText: PERFIL,
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  skills: "React, TypeScript",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "100-500",
  atividade: "semanal",
};

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use("/api/linkedin", linkedinRouter);
app.use(errorHandler);
const servidor = createServer(app);
const pronto = new Promise<void>((resolve) =>
  servidor.listen(0, "127.0.0.1", resolve),
);

async function analisar(): Promise<{ status: number; corpo: unknown }> {
  await pronto;
  const porta = (servidor.address() as AddressInfo).port;
  const r = await fetch(`http://127.0.0.1:${porta}/api/linkedin/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CORPO),
  });
  const texto = await r.text();
  let corpo: unknown = null;
  try {
    corpo = JSON.parse(texto);
  } catch {
    corpo = texto;
  }
  return { status: r.status, corpo };
}

function codigoDoErro(corpo: unknown): string | null {
  if (corpo && typeof corpo === "object") {
    const c = (corpo as { error?: { code?: unknown } }).error?.code;
    if (typeof c === "string") return c;
  }
  return null;
}

beforeEach(() => {
  chamadasDaReserva.length = 0;
  pendentesPorFerramenta.clear();
  logAiUsage.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  servidor.close();
});

describe("a segunda analise simultanea e recusada com 409 nomeado", () => {
  it("desfecho da RPC vira 409 analise_em_andamento, e nada mais", async () => {
    pendentesPorFerramenta.add("linkedin-analyzer");
    // Nenhuma chamada de IA pode sair: se sair, o duble grita.
    const ia = vi.spyOn(http, "fetchWithTimeout").mockImplementation(() => {
      throw new Error("a rota nao pode ter chamado a IA neste ramo");
    });

    const { status, corpo } = await analisar();

    expect(status).toBe(409);
    expect(codigoDoErro(corpo)).toBe("analise_em_andamento");
    // O codigo e PROPRIO: nao colide com nenhum outro desta rota, e o 409 que ja
    // existia na base (`stale_progress_revision`) vive em outro endpoint.
    expect(codigoDoErro(corpo)).not.toBe("rate_limited");
    expect(codigoDoErro(corpo)).not.toBe("rate_check_failed");
    expect(ia).not.toHaveBeenCalled();
  });

  it("NAO grava linha de uso: logAiUsage confirmaria a reserva em voo", async () => {
    pendentesPorFerramenta.add("linkedin-analyzer");
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(() => {
      throw new Error("a rota nao pode ter chamado a IA neste ramo");
    });

    const { status } = await analisar();

    expect(status).toBe(409);
    // A assercao negativa que protege a analise da OUTRA aba. `logAiUsage`
    // procura a reserva pendente por (usuario, tool) e a fecha; chamada aqui,
    // ela liberaria a vaga da analise que ainda esta rodando e carimbaria a
    // linha dela com os dados desta requisicao.
    expect(logAiUsage).not.toHaveBeenCalled();
  });

  it("a reserva recebe a JANELA, e ela e a constante derivada do shared", async () => {
    pendentesPorFerramenta.add("linkedin-analyzer");
    vi.spyOn(http, "fetchWithTimeout").mockImplementation(() => {
      throw new Error("nao deveria chamar a IA");
    });

    await analisar();

    expect(chamadasDaReserva).toHaveLength(1);
    // Igualdade com a constante IMPORTADA, nunca com um numero digitado aqui:
    // um literal repetido no teste deixaria de casar com a fonte em silencio no
    // dia em que qualquer parcela da derivacao mudasse.
    expect(chamadasDaReserva[0].p_janela_andamento_ms).toBe(TETO_CLIENT_MS);
    // E a janela e positiva de verdade, senao a checagem estaria desligada e o
    // teste acima passaria por acidente.
    expect(TETO_CLIENT_MS).toBeGreaterThan(0);
  });
});

describe("o raio da mudanca para as outras ferramentas", () => {
  it("sem janela, a RPC e chamada com os TRES argumentos de sempre", async () => {
    await checkAiDailyLimit(
      "00000000-0000-4000-8000-000000000009",
      true,
      "[github]",
      "github-perfil",
    );

    expect(chamadasDaReserva).toHaveLength(1);
    const args = chamadasDaReserva[0];
    // A prova ESTRUTURAL de que as outras oito ferramentas nao alcancam o corpo
    // novo: sem o quarto argumento, o Postgres resolve para a funcao de tres
    // argumentos, que esta migration nao alterou. Nao depende de a janela ser
    // zero nem de nenhum default.
    expect(Object.keys(args).sort()).toEqual([
      "p_limit",
      "p_tool",
      "p_user_id",
    ]);
    expect(args.p_janela_andamento_ms).toBeUndefined();
  });

  it("mesmo com reserva pendente, quem chama sem janela e liberado", async () => {
    pendentesPorFerramenta.add("github-perfil");

    const usage = await checkAiDailyLimit(
      "00000000-0000-4000-8000-000000000009",
      true,
      "[github]",
      "github-perfil",
    );

    expect(usage.allowed).toBe(true);
    expect(usage.analiseEmAndamento).toBeUndefined();
  });

  it("reserva pendente em OUTRA ferramenta nao bloqueia a analise", async () => {
    // O advisory lock e por usuario (hashtextextended do user_id), mas a recusa
    // e por (usuario, ferramenta). Uma analise de GitHub em voo nao pode impedir
    // a pessoa de rodar o analisador de LinkedIn no mesmo minuto.
    pendentesPorFerramenta.add("github-perfil");

    const usage = await checkAiDailyLimit(
      "00000000-0000-4000-8000-000000000001",
      true,
      "[linkedin]",
      "linkedin-analyzer",
      undefined,
      TETO_CLIENT_MS,
    );

    expect(usage.allowed).toBe(true);
    expect(usage.analiseEmAndamento).toBeUndefined();
  });

  it("com janela e reserva da MESMA ferramenta, o estado nomeado sobe", async () => {
    pendentesPorFerramenta.add("linkedin-analyzer");

    const usage = await checkAiDailyLimit(
      "00000000-0000-4000-8000-000000000001",
      true,
      "[linkedin]",
      "linkedin-analyzer",
      undefined,
      TETO_CLIENT_MS,
    );

    // Terceiro estado, nao um sabor de cota estourada: `analiseEmAndamento` e o
    // que separa "espere a que esta rodando" de "volte amanha".
    expect(usage.allowed).toBe(false);
    expect(usage.analiseEmAndamento).toBe(true);
    expect(usage.verificationFailed).toBeUndefined();
  });
});
