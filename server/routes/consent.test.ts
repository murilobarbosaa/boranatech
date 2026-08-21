import { beforeEach, describe, expect, it, vi } from "vitest";

import { PRIVACY_VERSION, TERMS_VERSION } from "../../shared/consent";

// supabaseAdmin mockado por operacao. `select().eq().in()` e a cadeia da leitura
// (hasCurrentConsent) e `upsert` e a escrita; as duas sao espionadas separadas
// porque o teste do bump de versao precisa provar que a escrita NAO toca a linha
// antiga, e isso e uma afirmacao sobre os argumentos do upsert.
const supaSpy = vi.hoisted(() => {
  const upsert = vi.fn();
  const inFn = vi.fn();
  const eq = vi.fn(() => ({ in: inFn }));
  const select = vi.fn(() => ({ eq }));
  const update = vi.fn();
  const del = vi.fn();
  const from = vi.fn(() => ({ select, upsert, update, delete: del }));
  return { from, select, eq, in: inFn, upsert, update, delete: del };
});

vi.mock("./../lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: supaSpy.from },
}));

vi.mock("./../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const sentrySpy = vi.hoisted(() => {
  const scope = { setTag: vi.fn(), setLevel: vi.fn(), setContext: vi.fn() };
  const captureMessage = vi.fn();
  const withScope = vi.fn((cb: (s: typeof scope) => void) => cb(scope));
  return { scope, captureMessage, withScope };
});

vi.mock("@sentry/node", () => ({
  withScope: sentrySpy.withScope,
  captureMessage: sentrySpy.captureMessage,
}));

import consentRouter from "./consent";

const USER = "11111111-2222-3333-4444-555555555555";

type Row = { document: string; version: string };

interface Captured {
  status: number;
  body: Record<string, unknown> | undefined;
  error: { statusCode?: number; code?: string } | undefined;
}

function handlerFor(path: string, method: "get" | "post") {
  const layer = (
    consentRouter as unknown as {
      stack: Array<{
        route?: {
          path: string;
          methods: Record<string, boolean>;
          stack: Array<{ handle: Function }>;
        };
      }>;
    }
  ).stack.find((l) => l.route?.path === path && l.route?.methods[method]);
  if (!layer?.route) throw new Error(`rota ${method} ${path} nao encontrada`);
  return layer.route.stack[0].handle as (
    req: unknown,
    res: unknown,
    next: (err?: unknown) => void,
  ) => Promise<void> | void;
}

async function call(
  path: string,
  method: "get" | "post",
  body?: unknown,
): Promise<Captured> {
  const captured: Captured = {
    status: 200,
    body: undefined,
    error: undefined,
  };
  const res = {
    status(n: number) {
      captured.status = n;
      return res;
    },
    json(b: Record<string, unknown>) {
      captured.body = b;
    },
  };
  const req = {
    user: { id: USER },
    body,
    headers: { "x-forwarded-for": "203.0.113.7", "user-agent": "vitest" },
    socket: { remoteAddress: "203.0.113.7" },
  };
  await handlerFor(path, method)(req, res, (err?: unknown) => {
    captured.error = err as Captured["error"];
  });
  return captured;
}

/** Semeia o que a leitura de hasCurrentConsent vai enxergar. */
function bancoDevolve(rows: Row[]) {
  supaSpy.in.mockResolvedValue({ data: rows, error: null });
}

const LINHAS_ATUAIS: Row[] = [
  { document: "terms", version: TERMS_VERSION },
  { document: "privacy", version: PRIVACY_VERSION },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  supaSpy.from.mockReturnValue({
    select: supaSpy.select,
    upsert: supaSpy.upsert,
    update: supaSpy.update,
    delete: supaSpy.delete,
  });
  supaSpy.select.mockReturnValue({ eq: supaSpy.eq });
  supaSpy.eq.mockReturnValue({ in: supaSpy.in });
  supaSpy.upsert.mockResolvedValue({ error: null });
  bancoDevolve(LINHAS_ATUAIS);
});

describe("POST /api/consent devolve o estado resultante (item 3.1)", () => {
  it("responde 201 com hasConsented lido do banco DEPOIS da escrita", async () => {
    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "signup_form_checkbox",
    });

    expect(res.error).toBeUndefined();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      hasConsented: true,
      terms: TERMS_VERSION,
      privacy: PRIVACY_VERSION,
    });
    // A releitura tem que acontecer, senao o `true` seria fixo de novo e o
    // cliente continuaria precisando do segundo round trip que causa a corrida.
    expect(supaSpy.select).toHaveBeenCalledTimes(1);
  });

  it("a releitura acontece DEPOIS do upsert, nao antes", async () => {
    const ordem: string[] = [];
    supaSpy.upsert.mockImplementation(async () => {
      ordem.push("upsert");
      return { error: null };
    });
    supaSpy.in.mockImplementation(async () => {
      ordem.push("select");
      return { data: LINHAS_ATUAIS, error: null };
    });

    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    expect(ordem).toEqual(["upsert", "select"]);
  });

  it("escrita ok e releitura falhando vira consent_readback_failed, nao write_failed", async () => {
    supaSpy.in.mockResolvedValue({
      data: null,
      error: { code: "57014", message: "timeout" },
    });

    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(res.body).toBeUndefined();
    expect(res.error?.code).toBe("consent_readback_failed");
    expect(res.error?.statusCode).toBe(500);
  });

  it("falha de ESCRITA continua sendo consent_write_failed", async () => {
    supaSpy.upsert.mockResolvedValue({
      error: { code: "23505", message: "boom" },
    });

    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(res.error?.code).toBe("consent_write_failed");
    // Nao pode ter tentado reler: a escrita nem passou.
    expect(supaSpy.select).not.toHaveBeenCalled();
  });
});

describe("upsert preserva a prova original (item 3.5)", () => {
  it("usa ON CONFLICT DO NOTHING no indice (user_id, document, version)", async () => {
    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    expect(supaSpy.upsert).toHaveBeenCalledTimes(1);
    const [, options] = supaSpy.upsert.mock.calls[0];
    // ignoreDuplicates=true e o que impede o reenvio de reescrever accepted_at.
    // Sem ele, cada retry de rede reescreveria a data do consentimento, que e
    // exatamente o campo que a prova existe para sustentar.
    expect(options).toEqual({
      onConflict: "user_id,document,version",
      ignoreDuplicates: true,
    });
  });

  it("nunca emite update nem delete em user_consents", async () => {
    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    expect(supaSpy.update).not.toHaveBeenCalled();
    expect(supaSpy.delete).not.toHaveBeenCalled();
  });
});

describe("consent_method e preenchido por allowlist (item 3.6)", () => {
  it("grava o metodo quando ele esta na allowlist", async () => {
    await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "consent_gate_checkbox",
    });

    const [rows] = supaSpy.upsert.mock.calls[0];
    expect(rows).toHaveLength(2);
    for (const row of rows as Array<Record<string, unknown>>) {
      expect(row.consent_method).toBe("consent_gate_checkbox");
    }
  });

  it("metodo ausente vira NULL e a gravacao SEGUE (frontend da janela de deploy)", async () => {
    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(res.status).toBe(201);
    const [rows] = supaSpy.upsert.mock.calls[0];
    for (const row of rows as Array<Record<string, unknown>>) {
      expect(row.consent_method).toBeNull();
    }
  });

  it("metodo desconhecido vira NULL sem recusar o consentimento", async () => {
    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "inventado_pelo_cliente",
    });

    expect(res.error).toBeUndefined();
    expect(res.status).toBe(201);
    const [rows] = supaSpy.upsert.mock.calls[0];
    for (const row of rows as Array<Record<string, unknown>>) {
      expect(row.consent_method).toBeNull();
    }
  });
});

// ─── Item 3.8 ────────────────────────────────────────────────────────────────
// Caminho NUNCA exercido em producao: o forense do Passo 2 mediu Grupo A = 0, ou
// seja, nenhum usuario existente jamais passou por um bump de TERMS_VERSION desde
// que user_consents existe. Nao ha evidencia de campo de que este fluxo funciona,
// e o item 4.3 do plano depende dele. Estes testes sao a unica prova que temos.
describe("bump de versao (item 3.8)", () => {
  const VERSAO_ANTIGA = "2026-01-01";

  it("quem tem linha SO na versao antiga cai no gate", async () => {
    bancoDevolve([
      { document: "terms", version: VERSAO_ANTIGA },
      { document: "privacy", version: VERSAO_ANTIGA },
    ]);

    const res = await call("/status", "get");

    expect(res.body).toEqual({ hasConsented: false });
  });

  it("aceite pos-bump grava linha NOVA, na versao atual", async () => {
    bancoDevolve([
      { document: "terms", version: VERSAO_ANTIGA },
      { document: "privacy", version: VERSAO_ANTIGA },
    ]);

    await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "consent_gate_checkbox",
    });

    const [rows] = supaSpy.upsert.mock.calls[0];
    expect(rows).toEqual([
      expect.objectContaining({ document: "terms", version: TERMS_VERSION }),
      expect.objectContaining({ document: "privacy", version: PRIVACY_VERSION }),
    ]);
    // Nenhuma linha enviada carrega a versao antiga: a escrita nao tem como
    // alcancar o historico, porque `version` faz parte da chave do conflito.
    for (const row of rows as Array<Record<string, unknown>>) {
      expect(row.version).not.toBe(VERSAO_ANTIGA);
    }
  });

  it("o historico da versao antiga sobrevive: nada de update, delete ou overwrite", async () => {
    bancoDevolve([
      { document: "terms", version: VERSAO_ANTIGA },
      { document: "privacy", version: VERSAO_ANTIGA },
    ]);

    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    expect(supaSpy.update).not.toHaveBeenCalled();
    expect(supaSpy.delete).not.toHaveBeenCalled();
    const [, options] = supaSpy.upsert.mock.calls[0];
    expect(options).toMatchObject({ ignoreDuplicates: true });
  });

  it("linha parcial (so terms na versao nova) ainda e falta de consentimento", async () => {
    bancoDevolve([
      { document: "terms", version: TERMS_VERSION },
      { document: "privacy", version: VERSAO_ANTIGA },
    ]);

    const res = await call("/status", "get");

    expect(res.body).toEqual({ hasConsented: false });
  });
});

// ─── Bloqueante 1: coluna consent_method ainda nao aplicada ──────────────────
// Rede de seguranca para a ordem de deploy invertida. Consentimento e prova
// legal: NUNCA pode ser perdido por causa de um campo de auditoria.
describe("coluna consent_method ausente nao derruba a gravacao", () => {
  const ERRO_POSTGREST = {
    code: "PGRST204",
    message:
      "Could not find the 'consent_method' column of 'user_consents' in the schema cache",
  };
  const ERRO_POSTGRES = {
    code: "42703",
    message: 'column "consent_method" of relation "user_consents" does not exist',
  };

  function primeiraFalhaDepoisOk(erro: unknown) {
    supaSpy.upsert
      .mockResolvedValueOnce({ error: erro })
      .mockResolvedValue({ error: null });
  }

  it.each([
    ["PGRST204 (cache de schema do PostgREST)", ERRO_POSTGREST],
    ["42703 (undefined_column do Postgres)", ERRO_POSTGRES],
  ])("regrava sem o campo quando o erro e %s", async (_nome, erro) => {
    primeiraFalhaDepoisOk(erro);

    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "signup_form_checkbox",
    });

    expect(res.error).toBeUndefined();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ hasConsented: true });
    expect(supaSpy.upsert).toHaveBeenCalledTimes(2);

    // A segunda tentativa nao pode mais mencionar a coluna: mandar o campo como
    // null nao resolveria, porque o PostgREST recusa pela CHAVE desconhecida e
    // nao pelo valor.
    const [rowsSemMetodo] = supaSpy.upsert.mock.calls[1];
    for (const row of rowsSemMetodo as Array<Record<string, unknown>>) {
      expect(row).not.toHaveProperty("consent_method");
      // E o que importa continua indo: a prova em si.
      expect(row).toMatchObject({ user_id: USER, ip: "203.0.113.7" });
    }
  });

  it("a regravacao preserva ON CONFLICT DO NOTHING", async () => {
    primeiraFalhaDepoisOk(ERRO_POSTGREST);

    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    const [, options] = supaSpy.upsert.mock.calls[1];
    expect(options).toEqual({
      onConflict: "user_id,document,version",
      ignoreDuplicates: true,
    });
  });

  it("registra consent_method_column_missing na telemetria", async () => {
    primeiraFalhaDepoisOk(ERRO_POSTGREST);

    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    expect(sentrySpy.captureMessage).toHaveBeenCalledWith(
      "[consent] consent_method_column_missing",
    );
    expect(sentrySpy.scope.setContext).toHaveBeenCalledWith(
      "consent_method_column_missing",
      expect.objectContaining({ reason: "consent_method_column_missing" }),
    );
  });

  it("erro que NAO e de coluna ausente nao vira regravacao silenciosa", async () => {
    supaSpy.upsert.mockResolvedValue({
      error: { code: "08006", message: "connection failure" },
    });

    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(supaSpy.upsert).toHaveBeenCalledTimes(1);
    expect(res.error?.code).toBe("consent_write_failed");
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("se a regravacao tambem falhar, o erro e honesto", async () => {
    supaSpy.upsert
      .mockResolvedValueOnce({ error: ERRO_POSTGREST })
      .mockResolvedValue({ error: { code: "08006", message: "down" } });

    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    expect(res.error?.code).toBe("consent_write_failed");
    expect(res.body).toBeUndefined();
  });
});

// ─── Ajuste 4: escrita OK e releitura falhando ───────────────────────────────
// Estado raro e assimetrico: a linha EXISTE e o cliente nao sabe. Ele retenta, o
// upsert e idempotente, e o pior desfecho e a pessoa ver o modal tendo prova no
// banco. Falha para o lado seguro (pede de novo em vez de perder a prova), mas o
// caminho precisa estar coberto, porque e o bug original numa forma mais rara.
describe("readback falhando: a prova sobrevive (ajuste 4)", () => {
  const TIMEOUT_LEITURA = { code: "57014", message: "statement timeout" };

  it("a escrita ACONTECEU mesmo com a releitura falhando", async () => {
    supaSpy.in.mockResolvedValue({ data: null, error: TIMEOUT_LEITURA });

    const res = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "signup_form_checkbox",
    });

    // O upsert rodou e nao foi desfeito: nao existe rollback aqui, e nenhum
    // caminho de erro emite delete.
    expect(supaSpy.upsert).toHaveBeenCalledTimes(1);
    expect(supaSpy.delete).not.toHaveBeenCalled();
    expect(supaSpy.update).not.toHaveBeenCalled();
    expect(res.error?.code).toBe("consent_readback_failed");
  });

  it("a retentativa do cliente NAO reescreve accepted_at", async () => {
    // 1a chamada: escreve, releitura falha, cliente recebe erro.
    supaSpy.in.mockResolvedValueOnce({ data: null, error: TIMEOUT_LEITURA });
    const primeira = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "signup_form_checkbox",
    });
    expect(primeira.error?.code).toBe("consent_readback_failed");

    // 2a chamada: o cliente retenta (recordConsent trata 5xx como retentavel).
    bancoDevolve(LINHAS_ATUAIS);
    const segunda = await call("/", "post", {
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "signup_form_checkbox",
    });

    expect(segunda.status).toBe(201);
    expect(segunda.body).toMatchObject({ hasConsented: true });
    // As DUAS escritas usam ON CONFLICT DO NOTHING, entao a segunda encontra a
    // linha da primeira e nao toca nela: accepted_at continua sendo o do aceite
    // de verdade, e nao o do retry.
    expect(supaSpy.upsert).toHaveBeenCalledTimes(2);
    for (const [, options] of supaSpy.upsert.mock.calls) {
      expect(options).toMatchObject({ ignoreDuplicates: true });
    }
  });

  it("depois que a leitura volta, o status responde consentido: sem loop", async () => {
    supaSpy.in.mockResolvedValueOnce({ data: null, error: TIMEOUT_LEITURA });
    await call("/", "post", { acceptedTerms: true, acceptedPrivacy: true });

    bancoDevolve(LINHAS_ATUAIS);
    const status = await call("/status", "get");

    // O gate consulta, recebe true e vai para 'consented'. Estado terminal:
    // nao ha caminho que o traga de volta para needsConsent.
    expect(status.body).toEqual({ hasConsented: true });
  });
});
