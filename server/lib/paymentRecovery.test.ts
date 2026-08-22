import { beforeEach, describe, expect, it, vi } from "vitest";

import { recuperacaoDegradada, runPaymentRecovery } from "./paymentRecovery";
import {
  EPISODIO_NOVO_MS,
  MAX_EPISODIOS,
  SEGUNDO_AVISO_MS,
} from "../../shared/paymentRecovery";

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
  /**
   * Tabelas cuja LEITURA deve devolver erro, para exercitar os estados de falha
   * com o proprio nome. Chaveado por tabela porque e assim que o erro chega na
   * vida real: o supabase-js devolve `{ data: null, error }` por consulta, e nao
   * uma excecao.
   */
  erroDeLeituraEm: new Set<string>(),
};

const sentrySpy = vi.hoisted(() => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("@sentry/node", () => ({
  captureException: sentrySpy.captureException,
  withScope: (
    fn: (scope: { setTag: (k: string, v: string) => void }) => void,
  ) => fn({ setTag: sentrySpy.setTag }),
}));

const enviados: { to: string; bucket: string }[] = [];
/**
 * TENTATIVAS de upsert, nao linhas gravadas. A diferenca e o ponto do teste do
 * teto: uma tentativa que o banco recusa pelo CHECK ainda seria uma tentativa por
 * execucao do cron, a cada 15 min, para sempre.
 */
const tentativasDeEscrita: Record<string, unknown>[] = [];
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
        if (db.erroDeLeituraEm.has(tabela)) {
          return { data: null, error: { message: `falha simulada em ${tabela}` } };
        }
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
          tentativasDeEscrita.push(linha);
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
  db.erroDeLeituraEm = new Set();
  sentrySpy.captureException.mockClear();
  sentrySpy.setTag.mockClear();
  enviados.length = 0;
  tentativasDeEscrita.length = 0;
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

  // BLOCO 1 da rodada 10: no teto, nao pode haver NEM TENTATIVA de escrita.
  it("pessoa no teto de episodios nao gera tentativa de escrita nenhuma", async () => {
    // Episodio MAX completo (stage 1 e 2), contato ha muito tempo.
    const contatoAntigo = T0 - EPISODIO_NOVO_MS - 10 * 60_000;
    db.envios = [
      { email: EMAIL, episodio: MAX_EPISODIOS, stage: 1, sent_at: new Date(contatoAntigo - 1000).toISOString(), supabase_user_id: "user-1", reason_bucket: "outro" },
      { email: EMAIL, episodio: MAX_EPISODIOS, stage: 2, sent_at: new Date(contatoAntigo).toISOString(), supabase_user_id: "user-1", reason_bucket: "outro" },
    ];
    db.recusas = [recusa(T0)];

    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));

    expect(r.enviados).toBe(0);
    expect(r.ignorados.teto_de_episodios).toBe(1);
    // O que este teste existe para provar:
    expect(tentativasDeEscrita).toHaveLength(0);
    expect(enviados).toHaveLength(0);
    // E nao contou como erro de registro, que seria o sintoma do bug.
    expect(r.ignorados.erro_registro).toBeUndefined();
  });

  it("no teto, varredura repetida segue sem tentar escrever", async () => {
    const contatoAntigo = T0 - EPISODIO_NOVO_MS - 10 * 60_000;
    db.envios = [
      { email: EMAIL, episodio: MAX_EPISODIOS, stage: 2, sent_at: new Date(contatoAntigo).toISOString(), supabase_user_id: "user-1", reason_bucket: "outro" },
    ];
    db.recusas = [recusa(T0)];
    for (let i = 0; i < 5; i += 1) {
      await runPaymentRecovery(new Date(T0 + (31 + i * 15) * 60_000));
    }
    expect(tentativasDeEscrita).toHaveLength(0);
    expect(enviados).toHaveLength(0);
  });

  it("dentro do debounce nao manda nada", async () => {
    db.recusas = [recusa(T0)];
    const r = await runPaymentRecovery(new Date(T0 + 5 * 60_000));
    expect(r.enviados).toBe(0);
    expect(r.ignorados.debounce).toBe(1);
  });
});

/**
 * FALHA DE LEITURA NAO E ESTADO VALIDO.
 *
 * O comportamento na duvida (nao enviar) ja estava certo e nao muda aqui: estes
 * testes o travam junto. O que eles acrescentam e a asserção sobre o NOME. Antes,
 * uma falha ao checar assinatura era contada como `converteu` e uma falha ao
 * checar supressao como `suprimido`, dois estados legitimos e frequentes: um dia
 * inteiro com o banco fora do ar apareceria no relatorio do cron como um dia de
 * conversoes, e o job sairia verde.
 *
 * Por isso cada teste afirma as TRES coisas juntas: a chave de erro subiu, a
 * chave legitima NAO foi inflada, e ninguem recebeu e-mail.
 */
describe("falha de checagem e contada com o proprio nome", () => {
  it("erro ao checar assinatura vira erro_checagem_assinatura, nao converteu", async () => {
    db.recusas = [recusa(T0)];
    db.erroDeLeituraEm = new Set(["subscriptions"]);

    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));

    expect(r.ignorados.erro_checagem_assinatura).toBe(1);
    expect(r.ignorados.converteu).toBeUndefined();
    expect(r.enviados).toBe(0);
    expect(enviados).toHaveLength(0);
  });

  it("erro ao checar supressao vira erro_checagem_supressao, nao suprimido", async () => {
    db.recusas = [recusa(T0)];
    db.erroDeLeituraEm = new Set(["email_suppressions"]);

    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));

    expect(r.ignorados.erro_checagem_supressao).toBe(1);
    expect(r.ignorados.suprimido).toBeUndefined();
    expect(r.enviados).toBe(0);
    expect(enviados).toHaveLength(0);
  });

  it("conta UMA pessoa mesmo com as duas checagens falhando", async () => {
    db.recusas = [recusa(T0)];
    db.erroDeLeituraEm = new Set(["subscriptions", "email_suppressions"]);

    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));

    // `ignorados` conta pessoas puladas. Somar os dois motivos para a mesma
    // pessoa faria o total das chaves passar de `pessoasNaJanela`.
    const total = Object.values(r.ignorados).reduce((a, n) => a + n, 0);
    expect(total).toBe(r.pessoasNaJanela);
    expect(r.ignorados.erro_checagem_assinatura).toBe(1);
    expect(r.ignorados.erro_checagem_supressao).toBeUndefined();
  });

  it("reporta a falha de leitura ao Sentry, nao so ao console", async () => {
    db.recusas = [recusa(T0)];
    db.erroDeLeituraEm = new Set(["subscriptions"]);

    await runPaymentRecovery(new Date(T0 + 31 * 60_000));

    expect(sentrySpy.captureException).toHaveBeenCalledTimes(1);
    expect(sentrySpy.setTag).toHaveBeenCalledWith("job", "payment-recovery");
    expect(sentrySpy.setTag).toHaveBeenCalledWith("checagem", "assinatura");
  });

  it("nao chama o Sentry quando a varredura corre limpa", async () => {
    db.recusas = [recusa(T0)];

    const r = await runPaymentRecovery(new Date(T0 + 31 * 60_000));

    expect(r.enviados).toBe(1);
    expect(sentrySpy.captureException).not.toHaveBeenCalled();
  });
});

/**
 * O predicado que decide o status gravado em cron_run_logs.
 *
 * Testado aqui, e nao pela rota, porque e funcao exportada justamente para isso
 * (mesmo motivo de `runDegradada` em lib/sentryTaskIntake.ts). Nenhum teste desta
 * base sobe o router de cron.
 */
describe("recuperacaoDegradada", () => {
  const base = { pessoasNaJanela: 1, enviados: 0 };

  it("e falso na varredura limpa", () => {
    expect(recuperacaoDegradada({ ...base, ignorados: {} })).toBe(false);
    expect(
      recuperacaoDegradada({ ...base, ignorados: { debounce: 3, converteu: 2 } }),
    ).toBe(false);
  });

  it("e verdadeiro para QUALQUER chave erro_", () => {
    for (const chave of [
      "erro_leitura",
      "erro_registro",
      "erro_checagem_assinatura",
      "erro_checagem_supressao",
    ]) {
      expect(recuperacaoDegradada({ ...base, ignorados: { [chave]: 1 } })).toBe(
        true,
      );
    }
  });

  it("pega uma chave erro_ futura que ninguem cadastrou", () => {
    // O predicado e por prefixo de proposito: uma lista escrita a mao aqui
    // deixaria de acusar no primeiro erro novo, em silencio.
    expect(
      recuperacaoDegradada({ ...base, ignorados: { erro_inventado_amanha: 1 } }),
    ).toBe(true);
  });

  it("ignora chave erro_ zerada", () => {
    expect(
      recuperacaoDegradada({ ...base, ignorados: { erro_registro: 0 } }),
    ).toBe(false);
  });
});
