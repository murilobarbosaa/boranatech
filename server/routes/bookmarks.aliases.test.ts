import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * FIACAO da rota de favoritos: resolucao de alias no colapso da leitura, na
 * escrita e no apagamento (lote 01b).
 *
 * O colapso e a parte que so aparece na rota: `colapsarProjetos` preserva a
 * ORDEM e so mexe nas linhas de tipo `projeto`, e nenhuma das duas coisas e
 * verificavel testando `resolveProjectId` sozinho.
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
import bookmarksRouter from "./bookmarks";
import { criarClienteRota } from "./adminTestClient";

const chamar = criarClienteRota(bookmarksRouter, "/api/bookmarks");

// Dois pares fundidos REAIS, para o teste distinguir "colapsou o par certo" de
// "colapsou todo projeto".
const CANONICO_A = "landing-page-pessoal";
const ALIAS_A = "portfolio-pessoal-html-css";
const CANONICO_B = "calculadora-js";
const ALIAS_B = "calculadora-javascript";

function fav(over: LinhaQualquer = {}): LinhaQualquer {
  return {
    id: "1",
    user_id: USER_ID,
    resource_type: "projeto",
    resource_id: CANONICO_A,
    title_snapshot: "t",
    subtitle_snapshot: null,
    url_snapshot: null,
    created_at: "2026-09-05T10:00:00.000Z",
    ...over,
  };
}

function montar(
  respostas: Record<string, RespostaTabela | (() => RespostaTabela)>,
) {
  estado.double = criarSupabaseDouble(respostas);
  return estado.double;
}

// A mesma lista nos dois caminhos de leitura: alias A, canonico A, um curso no
// meio, e o alias do outro par.
const LINHAS = [
  fav({ id: "1", resource_id: ALIAS_A }),
  fav({ id: "2", resource_id: CANONICO_A }),
  fav({ id: "3", resource_type: "curso", resource_id: "curso-x" }),
  fav({ id: "4", resource_id: ALIAS_B }),
];

beforeEach(() => {
  montar({ user_bookmarks: { rows: [] } });
});

describe("GET /", () => {
  it("1. paginado: colapsa so o par duplicado e mantem o curso na posicao", async () => {
    const d = montar({ user_bookmarks: { rows: LINHAS, count: 4 } });
    const r = await chamar("GET", "/?page=1&limit=50");
    expect(r.status).toBe(200);
    expect(
      r.body.data.map((x: { resource_id: string }) => x.resource_id),
    ).toEqual([CANONICO_A, "curso-x", CANONICO_B]);
    // `total` continua sendo o do banco, nao o da lista colapsada: e a
    // imprecisao aceita e documentada na rota (contar depois do colapso
    // exigiria ler a tabela inteira a cada pagina).
    expect(r.body.pagination.total).toBe(4);
    expect(r.body.data).toHaveLength(3);
    expect(d.chamadas[0].ordemDetalhe).toEqual([
      { coluna: "created_at", ascending: false },
      { coluna: "id", ascending: false },
    ]);
  });

  it("2. caminho legado, sem page: mesma regra", async () => {
    montar({ user_bookmarks: { rows: LINHAS } });
    const r = await chamar("GET", "/");
    expect(r.status).toBe(200);
    expect(
      r.body.data.map((x: { resource_id: string }) => x.resource_id),
    ).toEqual([CANONICO_A, "curso-x", CANONICO_B]);
    expect(r.body.pagination).toBeUndefined();
  });
});

describe("POST /", () => {
  it("3. favorito de projeto grava o id canonico", async () => {
    const d = montar({ user_bookmarks: { rows: [fav()] } });
    const r = await chamar("POST", "/", {
      resource_type: "projeto",
      resource_id: ALIAS_A,
      title_snapshot: "Pagina Pessoal",
    });
    expect(r.status).toBe(201);
    const insert = d.chamadas.find((c) => c.op === "insert")!;
    expect(insert.payload!.resource_id).toBe(CANONICO_A);
  });

  it("4. favorito de curso passa intacto", async () => {
    const d = montar({
      user_bookmarks: { rows: [fav({ resource_type: "curso" })] },
    });
    const r = await chamar("POST", "/", {
      resource_type: "curso",
      // De proposito um id que E alias de projeto: se a rota resolvesse alias
      // sem olhar o tipo, este teste pegaria.
      resource_id: ALIAS_A,
    });
    expect(r.status).toBe(201);
    const insert = d.chamadas.find((c) => c.op === "insert")!;
    expect(insert.payload!.resource_id).toBe(ALIAS_A);
  });
});

describe("DELETE /:resourceType/:resourceId", () => {
  it("5. desfavoritar projeto apaga canonico e alias", async () => {
    const d = montar({ user_bookmarks: { rows: [] } });
    const r = await chamar("DELETE", `/projeto/${CANONICO_A}`);
    expect(r.status).toBe(200);
    const del = d.chamadas.find((c) => c.op === "delete")!;
    const filtro = del.filtros.find((f) => f.coluna === "resource_id")!;
    expect(filtro.tipo).toBe("in");
    expect(filtro.valor).toEqual([CANONICO_A, ALIAS_A]);
  });

  it("6. desfavoritar curso nao envolve alias", async () => {
    const d = montar({ user_bookmarks: { rows: [] } });
    const r = await chamar("DELETE", `/curso/${ALIAS_A}`);
    expect(r.status).toBe(200);
    const del = d.chamadas.find((c) => c.op === "delete")!;
    const filtro = del.filtros.find((f) => f.coluna === "resource_id")!;
    expect(filtro.valor).toEqual([ALIAS_A]);
  });
});

describe("POST /migrate", () => {
  it("7. migracao do localStorage grava o canonico", async () => {
    const d = montar({ user_bookmarks: { rows: [] } });
    const r = await chamar("POST", "/migrate", {
      bookmarks: [
        { resource_type: "projeto", resource_id: ALIAS_A, title_snapshot: "x" },
        { resource_type: "curso", resource_id: "curso-y" },
      ],
    });
    expect(r.status).toBe(200);
    expect(r.body.data.migrated).toBe(2);
    const upsert = d.chamadas.find((c) => c.op === "upsert")!;
    const lote = upsert.payloadLote!;
    expect(lote[0].resource_id).toBe(CANONICO_A);
    expect(lote[1].resource_id).toBe("curso-y");
  });
});
