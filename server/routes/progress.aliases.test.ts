import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FIACAO da rota de progresso: resolucao de alias (lote 01b) e checkpoints de
 * etapa (lote 03).
 *
 * Ate aqui as duas regras tinham teste de FUNCAO pura (`aliases.test.ts`,
 * `progressState.test.ts`) e nada que exercitasse a rota. O que faltava
 * cobrir e exatamente o que funcao pura nao pega: se a rota chama a funcao,
 * com que argumento, e o que ela manda pro banco depois.
 *
 * O router REAL roda num Express REAL com o errorHandler de producao. Dubles:
 * Supabase e Auth.
 *
 * LIMITE CONHECIDO DO DUBLE: ele nao aplica ORDER BY. Os testes que dependem
 * de ordem entregam as linhas ja na ordem que o Postgres devolveria, e
 * afirmam SEPARADAMENTE que a consulta pediu a ordenacao certa
 * (`ordemDetalhe`). Sem essa segunda assercao o teste passaria mesmo se a
 * rota esquecesse o `.order`, que e o defeito que faz o dedupe ficar com a
 * linha errada.
 */

const USER_ID = "11111111-1111-1111-1111-111111111111";

const estado = vi.hoisted(() => ({
  double: null as unknown as ReturnType<
    typeof import("./adminUsersHarness.test").criarSupabaseDouble
  >,
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
    isProd: false,
    devProUserIds: [],
  },
}));
vi.mock("../lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.double.client;
  },
}));
vi.mock("../middleware/auth", () => ({
  requireAuth: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.user = { id: USER_ID, email: "a@b.com", role: "authenticated" };
    next();
  },
  checkProStatus: (
    req: Record<string, unknown>,
    _res: unknown,
    next: () => void,
  ) => {
    req.isPro = true;
    next();
  },
  requirePro: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  validateSupabaseJwt: (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  resolveProStatus: async () => true,
  isDevProUser: () => false,
}));

import {
  criarSupabaseDouble,
  type LinhaQualquer,
  type RespostaTabela,
} from "./adminUsersHarness.test";
import progressRouter from "./progress";
import { criarClienteRota } from "./adminTestClient";

const chamar = criarClienteRota(progressRouter, "/api/progress");

// Ids REAIS do catalogo: um id inventado passaria pelo dedupe sem exercitar o
// mapa de aliases, que e o que esta sob teste.
const CANONICO = "landing-page-pessoal";
const ALIAS = "portfolio-pessoal-html-css";
const V1 = "calculadora-js";
const ISO = "2026-09-06T00:00:00.000Z";

function linha(over: LinhaQualquer = {}): LinhaQualquer {
  return {
    item_key: CANONICO,
    state: { done: true },
    updated_at: "2026-09-05T10:00:00.000Z",
    ...over,
  };
}

/** Respostas em SEQUENCIA para a mesma tabela: a n-esima consulta recebe a
 * n-esima resposta, e a ultima se repete. E o que permite testar a leitura
 * antes do upsert sem inventar uma segunda tabela. */
function emSequencia(...respostas: RespostaTabela[]) {
  let i = 0;
  return () => respostas[Math.min(i++, respostas.length - 1)];
}

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
) {
  estado.double = criarSupabaseDouble(respostas);
  return estado.double;
}

beforeEach(() => {
  montar({ user_progress: { rows: [] } });
});

describe("GET /:context", () => {
  it("1. colapsa alias e canonico numa linha so, ficando com a mais recente", async () => {
    const d = montar({
      user_progress: {
        // Ja na ordem que `updated_at desc` devolveria.
        rows: [
          linha({
            item_key: CANONICO,
            state: { done: true },
            updated_at: "2026-09-05T12:00:00.000Z",
          }),
          linha({
            item_key: ALIAS,
            state: { done: false },
            updated_at: "2026-01-01T00:00:00.000Z",
          }),
        ],
      },
    });
    const r = await chamar("GET", "/project_progress");
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    expect(r.body.data[0].itemKey).toBe(CANONICO);
    expect(r.body.data[0].state).toEqual({ done: true });
    // A consulta pediu updated_at DESC: sem isso o dedupe ficaria com a linha
    // mais antiga e o teste acima passaria por acaso.
    expect(d.chamadas[0].ordemDetalhe).toEqual([
      { coluna: "updated_at", ascending: false },
    ]);
  });

  it("2. linha so do alias volta com o id canonico", async () => {
    montar({ user_progress: { rows: [linha({ item_key: ALIAS })] } });
    const r = await chamar("GET", "/project_progress");
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    expect(r.body.data[0].itemKey).toBe(CANONICO);
  });

  it("3. contexto fora de projeto nao colapsa nada", async () => {
    // Os dois ids sao o par fundido de projeto. Em course_progress eles nao
    // significam nada, e a rota tem de devolver os dois intactos.
    montar({
      user_progress: {
        rows: [linha({ item_key: CANONICO }), linha({ item_key: ALIAS })],
      },
    });
    const r = await chamar("GET", "/course_progress");
    expect(r.status).toBe(200);
    expect(r.body.data.map((x: { itemKey: string }) => x.itemKey)).toEqual([
      CANONICO,
      ALIAS,
    ]);
  });
});

describe("PUT /:context/:itemKey", () => {
  it("4. grava o id canonico quando a chamada vem pelo alias", async () => {
    const d = montar({
      user_progress: emSequencia({ rows: [linha()] }),
    });
    const r = await chamar("PUT", `/project_progress/${ALIAS}`, {
      state: { done: true },
    });
    expect(r.status).toBe(200);
    const upsert = d.chamadas.find((c) => c.op === "upsert");
    expect(upsert, "nenhum upsert aconteceu").toBeDefined();
    expect((upsert!.payload as LinhaQualquer).item_key).toBe(CANONICO);
  });

  it("5. normaliza a data da etapa em ISO", async () => {
    const d = montar({ user_progress: emSequencia({ rows: [linha()] }) });
    const r = await chamar("PUT", `/project_progress/${CANONICO}`, {
      state: { done: false, etapas: { planejar: "2026-09-06T00:00:00Z" } },
    });
    expect(r.status).toBe(200);
    const upsert = d.chamadas.find((c) => c.op === "upsert")!;
    const state = (upsert.payload as LinhaQualquer).state as {
      etapas: Record<string, string>;
    };
    expect(state.etapas.planejar).toBe(ISO);
  });

  it("6. recusa etapa que nao existe no projeto, nomeando a chave", async () => {
    const d = montar({ user_progress: { rows: [linha()] } });
    const r = await chamar("PUT", `/project_progress/${CANONICO}`, {
      state: { etapas: { inexistente: ISO } },
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_request");
    expect(r.body.error.message).toContain("inexistente");
    expect(d.chamadas.filter((c) => c.op === "upsert")).toHaveLength(0);
  });

  it("7. recusa etapa em projeto sem detalhe v2", async () => {
    const d = montar({ user_progress: { rows: [linha()] } });
    const r = await chamar("PUT", `/project_progress/${V1}`, {
      state: { etapas: { planejar: ISO } },
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("invalid_request");
    expect(d.chamadas.filter((c) => c.op === "upsert")).toHaveLength(0);
  });

  it("8. request sem a chave etapas preserva as etapas ja gravadas", async () => {
    // A fusao do lote 03 (commit E): uma aba com bundle antigo manda so
    // `{ done: true }` e nao pode apagar checkpoint marcado noutra aba.
    const d = montar({
      user_progress: emSequencia(
        { rows: [linha({ state: { done: false, etapas: { html: ISO } } })] },
        { rows: [linha()] },
      ),
    });
    const r = await chamar("PUT", `/project_progress/${CANONICO}`, {
      state: { done: true },
    });
    expect(r.status).toBe(200);
    const leituras = d.chamadas.filter((c) => c.op === "select");
    expect(leituras, "a leitura de fusao nao aconteceu").toHaveLength(1);
    const upsert = d.chamadas.find((c) => c.op === "upsert")!;
    expect((upsert.payload as LinhaQualquer).state).toEqual({
      done: true,
      etapas: { html: ISO },
    });
  });

  it("9. id que nao existe no catalogo da 404", async () => {
    const d = montar({ user_progress: { rows: [] } });
    const r = await chamar("PUT", "/project_progress/id-que-nao-existe", {
      state: { done: true },
    });
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("not_found");
    expect(d.chamadas).toHaveLength(0);
  });
});

describe("DELETE /:context/:itemKey", () => {
  it("10. apaga o canonico E os aliases", async () => {
    const d = montar({ user_progress: { rows: [] } });
    const r = await chamar("DELETE", `/project_progress/${CANONICO}`);
    expect(r.status).toBe(200);
    const del = d.chamadas.find((c) => c.op === "delete")!;
    const filtro = del.filtros.find((f) => f.coluna === "item_key")!;
    expect(filtro.tipo).toBe("in");
    expect(filtro.valor).toEqual([CANONICO, ALIAS]);
  });

  it("11. contexto fora de projeto apaga so a chave pedida", async () => {
    const d = montar({ user_progress: { rows: [] } });
    const r = await chamar("DELETE", "/course_progress/frontend:web.http");
    expect(r.status).toBe(200);
    const del = d.chamadas.find((c) => c.op === "delete")!;
    const filtro = del.filtros.find((f) => f.coluna === "item_key")!;
    expect(filtro.valor).toEqual(["frontend:web.http"]);
  });
});
