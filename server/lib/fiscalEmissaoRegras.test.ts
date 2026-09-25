import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O WORKER sob as regras do contador (lote FISCAL-REGRAS 01).
 *
 *   R2  linha 'awaiting_batch' nao e emitida por job nenhum;
 *   R4  cadastro incompleto NAO bloqueia: a nota sai sem tomador;
 *   R5  valor = bruto menos estornos; estorno integral nao emite;
 *   R6  competencia enviada e a da VENDA (a da linha), nunca o dia do lote.
 *
 * Pelo `processFiscalInvoiceJob` real; so o banco, o provedor e o e-mail sao
 * dublados. Literais escritos a mao.
 */

type Linha = Record<string, unknown> & { id: string; status: string };

const estado = vi.hoisted(() => ({
  linhas: [] as Array<Record<string, unknown>>,
  perfis: [] as Array<Record<string, unknown>>,
  issues: [] as Array<Record<string, unknown>>,
}));

vi.mock("./redis", () => ({ queueConnection: null, cacheConnection: null }));
vi.mock("./env", () => ({
  env: { nfseEnabled: true, nfseProvider: "mock", redisUrl: "" },
}));
vi.mock("./queue", () => ({ enqueueEmail: vi.fn(async () => {}) }));
vi.mock("./fiscalStorage", () => ({
  uploadFiscalDocument: vi.fn(async () => "caminho/fake.pdf"),
}));
vi.mock("../providers/fiscal", () => ({
  getFiscalProvider: () => ({
    name: "mock",
    issue: vi.fn(async (input: Record<string, unknown>) => {
      estado.issues.push(input);
      return { status: "processing", providerInvoiceId: "ref-1" };
    }),
    fetchStatus: vi.fn(),
    cancel: vi.fn(),
    downloadDocument: vi.fn(async () => Buffer.from("")),
  }),
}));

function criarQuery(tabela: string) {
  const colecao = () => (tabela === "profiles" ? estado.perfis : estado.linhas);
  const filtros: Array<(l: Record<string, unknown>) => boolean> = [];
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
    neq: (col: string, val: unknown) => {
      filtros.push((l) => l[col] !== val);
      return q;
    },
    maybeSingle: async () => {
      const alvo = colecao().filter((l) => filtros.every((f) => f(l)));
      return { data: alvo[0] ?? null, error: null };
    },
    then: (resolve: (v: unknown) => unknown) => {
      const alvo = colecao().filter((l) => filtros.every((f) => f(l)));
      if (patch) for (const l of alvo) Object.assign(l, patch);
      return Promise.resolve(
        resolve({ data: alvo.map((l) => ({ id: l.id })), error: null }),
      );
    },
  };
  return q;
}

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => criarQuery(tabela),
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: { email: "maria@example.com" } },
        }),
      },
    },
  },
}));

import { processFiscalInvoiceJob } from "./fiscalQueue";

const PERFIL_COMPLETO = {
  user_id: "user-1",
  full_name: "Maria da Silva",
  cpf: "52998224725",
  email: "maria@example.com",
};

function semear(over: Partial<Linha> = {}): Linha {
  const linha: Linha = {
    id: "nota-1",
    user_id: "user-1",
    status: "pending",
    amount_cents: 2990,
    refunded_cents: 0,
    competencia: "2026-10-15",
    valor_liquido_cents: null,
    service_description: "Assinatura Bora na Tech Pro, plano mensal",
    provider_invoice_id: null,
    attempts: 0,
    tomador_email: null,
    charge_key: "stripe:ch_1",
    ...over,
  };
  estado.linhas = [linha];
  return linha;
}

beforeEach(() => {
  estado.issues = [];
  estado.perfis = [PERFIL_COMPLETO];
  // O lote de outubro roda as 02:00Z de 01/11. A competencia enviada nao pode
  // ser a deste relogio.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-01T02:00:00Z"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("tomador (R4)", () => {
  it("com nome e CPF validos a nota leva o tomador", async () => {
    const linha = semear();
    await expect(processFiscalInvoiceJob("stripe:ch_1")).rejects.toThrow(
      /em processamento/,
    );

    expect(estado.issues).toHaveLength(1);
    expect(estado.issues[0].tomador).toEqual({
      nome: "Maria da Silva",
      documento: "52998224725",
      tipoDocumento: "cpf",
      email: "maria@example.com",
    });
    expect(linha).toMatchObject({
      status: "processing",
      tomador_nome: "Maria da Silva",
      tomador_documento: "52998224725",
    });
  });

  it("sem CPF a nota sai SEM tomador, e nao bloqueia", async () => {
    estado.perfis = [{ user_id: "user-1", full_name: "Maria da Silva" }];
    const linha = semear();
    await expect(processFiscalInvoiceJob("stripe:ch_1")).rejects.toThrow(
      /em processamento/,
    );

    expect(linha.status).toBe("processing");
    expect(estado.issues).toHaveLength(1);
    expect("tomador" in estado.issues[0]).toBe(false);
    expect(linha).toMatchObject({
      tomador_nome: null,
      tomador_documento: null,
      tomador_email: null,
    });
  });
});

describe("valor liquido (R5)", () => {
  it("estorno parcial desce o valor da nota", async () => {
    const linha = semear({ refunded_cents: 1000 });
    await expect(processFiscalInvoiceJob("stripe:ch_1")).rejects.toThrow(
      /em processamento/,
    );

    expect(estado.issues[0].servico).toMatchObject({ valorCents: 1990 });
    expect(linha.valor_liquido_cents).toBe(1990);
  });

  it("estorno integral NAO emite e grava motivo proprio", async () => {
    const linha = semear({ refunded_cents: 2990 });
    await processFiscalInvoiceJob("stripe:ch_1");

    expect(estado.issues).toEqual([]);
    expect(linha).toMatchObject({
      status: "skipped",
      error_code: "estorno_integral_antes_da_emissao",
    });
  });
});

describe("competencia (R6)", () => {
  it("vai a competencia da VENDA, nao o dia do lote", async () => {
    semear({ competencia: "2026-10-15" });
    await expect(processFiscalInvoiceJob("stripe:ch_1")).rejects.toThrow(
      /em processamento/,
    );

    expect(estado.issues[0].servico).toMatchObject({
      competencia: "2026-10-15",
    });
  });
});

describe("antes do lote (R2)", () => {
  it("job para linha 'awaiting_batch' nao emite nada", async () => {
    const linha = semear({ status: "awaiting_batch" });
    await processFiscalInvoiceJob("stripe:ch_1");

    expect(estado.issues).toEqual([]);
    expect(linha.status).toBe("awaiting_batch");
  });

  it("linha 'skipped' e terminal", async () => {
    semear({ status: "skipped" });
    await processFiscalInvoiceJob("stripe:ch_1");
    expect(estado.issues).toEqual([]);
  });
});
