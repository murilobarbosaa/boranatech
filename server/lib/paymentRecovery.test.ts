import { beforeEach, describe, expect, it, vi } from "vitest";

import { runPaymentRecovery } from "./paymentRecovery";
import { EPISODIO_NOVO_MS, SEGUNDO_AVISO_MS } from "../../shared/paymentRecovery";

/**
 * Este teste existe por causa de um bug que os 17 testes da decisao pura NAO
 * pegaram, e nao podiam pegar: a decisao estava CERTA (devolvia stage 1 para o
 * episodio novo) e quem barrava era a CONSTRAINT do banco, UNIQUE (email, stage).
 *
 * Por isso o fake abaixo IMPLEMENTA a chave unica declarada na migration, em vez
 * de aceitar todo insert. Um teste com upsert permissivo passaria com a constraint
 * errada, que e exatamente o que aconteceu.
 *
 * Se alguem trocar a chave de volta para (email, stage), o teste
 * "reabre o episodio depois de 30 dias" falha.
 */
const CHAVE_UNICA = ["email", "episodio", "stage"] as const;

type LinhaEnvio = {
  email: string;
  episodio: number;
  stage: number;
  sent_at: string;
  supabase_user_id: string | null;
  reason_bucket: string;
};

const db = {
  recusas: [] as Record<string, unknown>[],
  envios: [] as LinhaEnvio[],
  assinaturasAtivasDe: new Set<string>(),
  suprimidos: new Set<string>(),
};

const enviados: { to: string; bucket: string }[] = [];
vi.mock("./queue", () => ({
  enqueueEmail: async (job: { to: string; bucket: string }) => {
    enviados.push({ to: job.to, bucket: job.bucket });
  },
}));

function chaveDe(linha: Record<string, unknown>): string {
  return CHAVE_UNICA.map((c) => String(linha[c])).join("|");
}

vi.mock("./supabaseAdmin", () => {
  const consulta = (tabela: string) => {
    const filtros: Record<string, unknown> = {};
    const api: Record<string, unknown> = {
      select: () => api,
      gte: () => api,
      order: async () => ({ data: db.recusas, error: null }),
      in: () => api,
      limit: async () => {
        if (tabela === "subscriptions") {
          const uid = String(filtros.user_id ?? "");
          return {
            data: db.assinaturasAtivasDe.has(uid) ? [{ id: "s1" }] : [],
            error: null,
          };
        }
        if (tabela === "email_suppressions") {
          const e = String(filtros.email ?? "");
          return { data: db.suprimidos.has(e) ? [{ email: e }] : [], error: null };
        }
        return { data: [], error: null };
      },
      eq: (coluna: string, valor: unknown) => {
        filtros[coluna] = valor;
        if (tabela === "payment_recovery_emails") {
          // A leitura de envios da pessoa.
          return {
            ...api,
            then: undefined,
          } as unknown as typeof api;
        }
        return api;
      },
      upsert: (linha: Record<string, unknown>) => ({
        select: async () => {
          // AQUI mora o ponto do teste: a chave unica da migration, respeitada.
          const existe = db.envios.some(
            (e) => chaveDe(e as unknown as Record<string, unknown>) === chaveDe(linha),
          );
          if (existe) return { data: [], error: null }; // ignoreDuplicates
          db.envios.push(linha as unknown as LinhaEnvio);
          return { data: [{ id: "novo" }], error: null };
        },
      }),
    };
    // A leitura de payment_recovery_emails termina em .eq(...) e e aguardada.
    if (tabela === "payment_recovery_emails") {
      const leitura = {
        select: () => ({
          eq: async (_c: string, valor: unknown) => ({
            data: db.envios.filter((e) => e.email === valor),
            error: null,
          }),
        }),
        upsert: api.upsert,
      };
      return leitura as unknown as typeof api;
    }
    return api;
  };
  return { supabaseAdmin: { from: (t: string) => consulta(t) } };
});

const EMAIL = "quem.falhou@gmail.com";

function recusa(quandoMs: number) {
  return {
    id: `bfp_${quandoMs}`,
    email: EMAIL,
    supabase_user_id: "user-1",
    outcome_type: "issuer_declined",
    outcome_reason: "insufficient_funds",
    advice_code: null,
    failure_code: "card_declined",
    attempted_at: new Date(quandoMs).toISOString(),
  };
}

const T0 = Date.parse("2026-08-01T12:00:00Z");

beforeEach(() => {
  db.recusas = [];
  db.envios = [];
  db.assinaturasAtivasDe = new Set();
  db.suprimidos = new Set();
  enviados.length = 0;
});

describe("runPaymentRecovery com a chave unica do banco", () => {
  it("manda o primeiro aviso passado o debounce", async () => {
    db.recusas = [recusa(T0)];
    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));
    expect(r.enviados).toBe(1);
    expect(enviados).toEqual([{ to: EMAIL, bucket: "insufficient_funds" }]);
    expect(db.envios[0]).toMatchObject({ episodio: 1, stage: 1 });
  });

  it("nao repete o mesmo aviso na varredura seguinte", async () => {
    db.recusas = [recusa(T0)];
    await runPaymentRecovery(new Date(T0 + 31 * 60_000));
    const r2 = await runPaymentRecovery(new Date(T0 + 45 * 60_000));
    expect(r2.enviados).toBe(0);
    expect(enviados).toHaveLength(1);
  });

  // O TESTE QUE FALHAVA COM A CONSTRAINT ANTIGA.
  it("reabre o episodio depois de 30 dias e manda de novo", async () => {
    // Episodio 1 completo: stage 1 e stage 2.
    db.recusas = [recusa(T0)];
    await runPaymentRecovery(new Date(T0 + 31 * 60_000));
    await runPaymentRecovery(new Date(T0 + 31 * 60_000 + SEGUNDO_AVISO_MS));
    expect(db.envios.map((e) => [e.episodio, e.stage])).toEqual([
      [1, 1],
      [1, 2],
    ]);
    expect(enviados).toHaveLength(2);

    // Volta muito depois e falha de novo.
    const voltou = T0 + 31 * 60_000 + SEGUNDO_AVISO_MS + EPISODIO_NOVO_MS + 60_000;
    db.recusas = [recusa(voltou)];
    const r = await runPaymentRecovery(new Date(voltou + 31 * 60_000));

    // Com UNIQUE (email, stage) isto dava 0 e virava `ja_registrado`.
    expect(r.enviados).toBe(1);
    expect(enviados).toHaveLength(3);
    expect(db.envios[2]).toMatchObject({ episodio: 2, stage: 1 });
  });

  it("nao manda para quem tem assinatura ativa", async () => {
    db.recusas = [recusa(T0)];
    db.assinaturasAtivasDe.add("user-1");
    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));
    expect(r.enviados).toBe(0);
    expect(r.ignorados.converteu).toBe(1);
    expect(enviados).toHaveLength(0);
  });

  it("nao manda para endereco suprimido", async () => {
    db.recusas = [recusa(T0)];
    db.suprimidos.add(EMAIL);
    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));
    expect(r.enviados).toBe(0);
    expect(r.ignorados.suprimido).toBe(1);
  });

  it("dez tentativas em uma hora rendem UM e-mail", async () => {
    db.recusas = Array.from({ length: 10 }, (_, i) => recusa(T0 - i * 6 * 60_000));
    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));
    expect(r.enviados).toBe(1);
    expect(enviados).toHaveLength(1);
  });

  it("dentro do debounce nao manda nada", async () => {
    db.recusas = [recusa(T0)];
    const r = await runPaymentRecovery(new Date(T0 + 5 * 60_000));
    expect(r.enviados).toBe(0);
    expect(r.ignorados.debounce).toBe(1);
  });
});
