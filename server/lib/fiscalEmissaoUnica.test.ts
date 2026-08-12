import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PONTO UNICO DE DISPARO DO E-MAIL DA NOTA.
 *
 * A propriedade protegida aqui e "o e-mail sai UMA vez, na transicao para
 * issued, venha ela do retorno do issue() ou do ramo de reconsulta". Ela e o
 * tipo de coisa que quebra em silencio: um reprocessamento que reenvia o recibo
 * nao derruba nada, nao aparece em log de erro, e so aparece como cliente
 * recebendo a mesma nota tres vezes.
 *
 * O QUE ESTE TESTE NAO FAZ. Ele nao executa Postgres. A garantia real vem do
 * UPDATE condicional (`.neq("status", "issued")`), que e atomico no banco; o
 * duble abaixo MODELA essa condicao. O que se prova aqui e que o nosso codigo
 * (a) roteia os dois caminhos pelo mesmo ponto e (b) so envia quando a condicao
 * casa. Que o `neq` seja atomico e propriedade do Postgres, nao nossa.
 */

type Linha = Record<string, unknown> & { id: string; status: string };

const estado = vi.hoisted(() => ({
  linhas: [] as Linha[],
  // Tabela SEPARADA: a versao anterior deste duble servia `profiles` da mesma
  // coleção de `fiscal_invoices`, e o caminho de emissao lia a propria nota
  // como se fosse o perfil do tomador. O teste falhava por um defeito do
  // instrumento, nao do codigo, que e o pior tipo de teste vermelho.
  perfis: [] as Array<Record<string, unknown>>,
  emails: [] as Array<Record<string, unknown>>,
  statusRemoto: { status: "issued" } as Record<string, unknown>,
  resultadoIssue: null as Record<string, unknown> | null,
}));

vi.mock("./redis", () => ({ queueConnection: null, cacheConnection: null }));
vi.mock("./env", () => ({
  env: { nfseEnabled: true, nfseProvider: "mock", redisUrl: "" },
}));
vi.mock("./queue", () => ({
  enqueueEmail: vi.fn(async (data: Record<string, unknown>) => {
    estado.emails.push(data);
  }),
}));
// Storage dublado: o arquivamento tem contrato proprio (nunca lanca, nunca
// regride o status) e nao e o que este teste mede.
vi.mock("./fiscalStorage", () => ({
  uploadFiscalDocument: vi.fn(async () => "caminho/fake.pdf"),
}));
vi.mock("../providers/fiscal", () => ({
  getFiscalProvider: () => ({
    name: "mock",
    issue: vi.fn(async () => estado.resultadoIssue),
    fetchStatus: vi.fn(async () => estado.statusRemoto),
    cancel: vi.fn(),
    downloadDocument: vi.fn(async () => Buffer.from("")),
  }),
}));

/**
 * Duble minimo do query builder, com UMA regra que importa: o `neq` filtra de
 * verdade. E ele que modela a condicao de corrida do banco.
 */
function criarQuery(tabela: string) {
  const colecao = (): Array<Record<string, unknown>> =>
    tabela === "profiles" ? estado.perfis : estado.linhas;
  const filtros: Array<(l: Record<string, unknown>) => boolean> = [];
  let patch: Record<string, unknown> | null = null;
  let operacao: "select" | "update" = "select";

  const q: Record<string, unknown> = {
    select: () => q,
    update: (p: Record<string, unknown>) => {
      operacao = "update";
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
    in: () => q,
    maybeSingle: async () => {
      const alvo = colecao().filter((l) => filtros.every((f) => f(l)));
      return { data: alvo[0] ?? null, error: null };
    },
    then: (resolve: (v: unknown) => unknown) => {
      const alvo = colecao().filter((l) => filtros.every((f) => f(l)));
      if (operacao === "update" && patch) {
        for (const linha of alvo) Object.assign(linha, patch);
      }
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
    auth: { admin: { getUserById: async () => ({ data: { user: null } }) } },
  },
}));

// Import ESTATICO: os `vi.mock` acima sao hoisted pelo vitest, e top-level
// await nao compila no tsconfig da aplicacao (target ES5).
import { processFiscalInvoiceJob } from "./fiscalQueue";

function semearLinha(over: Partial<Linha> = {}): Linha {
  const linha: Linha = {
    id: "nota-1",
    user_id: "user-1",
    status: "processing",
    amount_cents: 2990,
    service_description: "Assinatura Bora na Tech Pro, plano mensal",
    provider_invoice_id: "nota-1",
    attempts: 1,
    tomador_email: "maria@example.com",
    stripe_charge_id: "ch_1",
    ...over,
  };
  estado.linhas = [linha];
  // Perfil COMPLETO: o caminho de emissao passa por resolveTomador, e um
  // cadastro incompleto desviaria para blocked_missing_data antes de chegar ao
  // ponto que este teste mede.
  estado.perfis = [
    {
      user_id: "user-1",
      full_name: "Maria da Silva",
      cpf: "52998224725",
      email: "maria@example.com",
    },
  ];
  return linha;
}

beforeEach(() => {
  estado.emails = [];
  estado.statusRemoto = {
    status: "issued",
    numero: "123",
    codigoVerificacao: "V1",
  };
  estado.resultadoIssue = null;
});

describe("transicao para issued pelo ramo de reconsulta", () => {
  it("marca issued e enfileira UM e-mail", async () => {
    const linha = semearLinha();
    await processFiscalInvoiceJob("ch_1");

    expect(linha.status).toBe("issued");
    expect(linha.numero).toBe("123");
    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({
      type: "fiscal_invoice_issued",
      to: "maria@example.com",
      numero: "123",
      codigoVerificacao: "V1",
      valorLabel: expect.stringContaining("29,90"),
    });
  });

  it("REPROCESSAR nao reenvia o e-mail", async () => {
    semearLinha();
    await processFiscalInvoiceJob("ch_1");
    expect(estado.emails).toHaveLength(1);

    // Segunda passada: a linha ja esta 'issued', o curto-circuito de status
    // terminal nem chega ao provedor. Mesmo se chegasse, o UPDATE condicional
    // casaria zero linhas.
    await processFiscalInvoiceJob("ch_1");
    expect(estado.emails).toHaveLength(1);
  });

  it("linha que JA estava issued antes da consulta nao dispara e-mail", async () => {
    // Modela a corrida: outro processamento concluiu entre a leitura e a
    // escrita. O `neq` nao casa e o e-mail nao sai duas vezes.
    semearLinha({ status: "issued" });
    await processFiscalInvoiceJob("ch_1");
    expect(estado.emails).toHaveLength(0);
  });
});

describe("transicao para issued pelo retorno do issue()", () => {
  it("passa pelo MESMO ponto e envia uma vez so", async () => {
    // Sem provider_invoice_id: cai no caminho de emissao, nao no de reconsulta.
    semearLinha({ provider_invoice_id: null, status: "pending" });
    estado.resultadoIssue = {
      status: "issued",
      providerInvoiceId: "nota-1",
      numero: "456",
    };

    await processFiscalInvoiceJob("ch_1");

    expect(estado.emails).toHaveLength(1);
    expect(estado.emails[0]).toMatchObject({ numero: "456" });
  });
});

describe("desfechos que NAO enviam e-mail", () => {
  it("cancelado no provedor nao envia", async () => {
    const linha = semearLinha();
    estado.statusRemoto = { status: "canceled" };
    await processFiscalInvoiceJob("ch_1");
    expect(linha.status).toBe("canceled");
    expect(estado.emails).toHaveLength(0);
  });

  it("rejeicao definitiva nao envia e grava o motivo", async () => {
    const linha = semearLinha();
    estado.statusRemoto = {
      status: "failed",
      errorCode: "E123",
      errorMessage: "Inscricao invalida",
      retryable: false,
    };
    await processFiscalInvoiceJob("ch_1");
    expect(linha.status).toBe("failed");
    expect(linha.error_code).toBe("E123");
    expect(estado.emails).toHaveLength(0);
  });

  it("falha retentavel relanca e mantem processing, sem e-mail", async () => {
    const linha = semearLinha();
    estado.statusRemoto = {
      status: "failed",
      errorCode: "focus_unavailable",
      errorMessage: "Focus fora do ar",
      retryable: true,
    };
    await expect(processFiscalInvoiceJob("ch_1")).rejects.toThrow(
      /retentavel/i,
    );
    expect(linha.status).toBe("processing");
    expect(estado.emails).toHaveLength(0);
  });

  it("ainda processando relanca para o backoff, sem e-mail", async () => {
    semearLinha();
    estado.statusRemoto = { status: "processing" };
    await expect(processFiscalInvoiceJob("ch_1")).rejects.toThrow(
      /ainda em processamento/i,
    );
    expect(estado.emails).toHaveLength(0);
  });
});
