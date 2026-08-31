import { describe, expect, it, vi } from "vitest";

import {
  detectarChargesSemDono,
  linhaDoBanco,
  passouDoCorte,
  TETO_CANDIDATO_POR_EMAIL,
  type AchadoSemDono,
  type LinhaSemDono,
  type SemDonoLookups,
} from "./chargeSemDono";
import { statusDaRunDeOrfaos } from "./orphanPayments";

/**
 * PAGAMENTO SEM DONO A PARTIR DE `finance_transactions`.
 *
 * O defeito que isto fecha, medido em 2026-08-31: o detector de orfaos so ve
 * Checkout Session paga, e a cobranca do Walisson (R$ 29,90, 21/08, invoice
 * avulsa criada no painel) nunca teve sessao. Ela estava na nossa
 * `finance_transactions` no dia do pagamento, com `user_id` nulo, e ninguem
 * perguntou.
 *
 * Os controles negativos aqui sao metade da regra, e cada um cobre um jeito
 * diferente de a correcao dar errado: acusar cobranca que TEM dono encheria a
 * fila de ruido; acusar cedo demais gritaria com o que o sync ainda vai
 * resolver sozinho; ressuscitar linha resolvida faria a fila nunca esvaziar; e
 * tratar "nao consegui olhar" como "esta ok" e o defeito que este projeto
 * inteiro persegue.
 */

const AGORA = Date.parse("2026-08-31T12:00:00.000Z");
const DIA = 24 * 60 * 60 * 1000;

function linha(over: Partial<LinhaSemDono> = {}): LinhaSemDono {
  return {
    stripeChargeId: "ch_1",
    grossCents: 2990,
    currency: "BRL",
    // 20 dias atras: bem acima do corte de 8.
    occurredAt: new Date(AGORA - 20 * DIA).toISOString(),
    emailDaCobranca: "pagador@exemplo.com",
    customerId: "cus_1",
    ...over,
  };
}

function lookups(over: Partial<SemDonoLookups> = {}): SemDonoLookups {
  return {
    listarSemDono: async () => [linha()],
    emailDoCustomer: async () => null,
    contasPorEmail: async () => new Map(),
    persistir: async (itens) => ({ persisted: true, novas: itens.length }),
    ...over,
  };
}

describe("passouDoCorte", () => {
  it("acima do corte: passa", () => {
    expect(passouDoCorte(new Date(AGORA - 20 * DIA).toISOString(), AGORA)).toBe(
      true,
    );
  });

  it("CONTROLE NEGATIVO: abaixo do corte NAO passa", () => {
    // 3 dias: ainda dentro da janela de 7 do sync-finance, entao a linha pode
    // ganhar dono sozinha na proxima passada. Gritar aqui e gritar com o que se
    // cura, e alarme assim e alarme que alguem desliga.
    expect(passouDoCorte(new Date(AGORA - 3 * DIA).toISOString(), AGORA)).toBe(
      false,
    );
  });

  it("CONTROLE NEGATIVO: data invalida nao vira achado", () => {
    expect(passouDoCorte("nao e data", AGORA)).toBe(false);
  });
});

describe("detectarChargesSemDono", () => {
  it("cobranca sem dono acima do corte E detectada", async () => {
    const scan = await detectarChargesSemDono(lookups(), { agoraMs: AGORA });
    expect(scan.encontradas).toBe(1);
    expect(scan.acionaveis).toBe(1);
    expect(scan.itens[0].stripeChargeId).toBe("ch_1");
    expect(scan.leituraOk).toBe(true);
  });

  it("CONTROLE NEGATIVO: abaixo do corte nao entra", async () => {
    const scan = await detectarChargesSemDono(
      lookups({
        listarSemDono: async () => [
          linha({ occurredAt: new Date(AGORA - 3 * DIA).toISOString() }),
        ],
      }),
      { agoraMs: AGORA },
    );
    expect(scan.encontradas).toBe(0);
    expect(scan.acionaveis).toBe(0);
  });

  it("CONTROLE NEGATIVO: linha sem charge id nao entra", async () => {
    // Sem chave nao ha upsert idempotente possivel; a linha duplicaria a cada
    // execucao. `payout` e `refund` nunca chegam aqui porque a consulta filtra
    // `type='charge'`, e este e o guarda para o que escapar disso.
    const scan = await detectarChargesSemDono(
      lookups({ listarSemDono: async () => [linha({ stripeChargeId: null })] }),
      { agoraMs: AGORA },
    );
    expect(scan.encontradas).toBe(0);
  });

  it("leitura que FALHA nao vira 'sem achados'", async () => {
    const scan = await detectarChargesSemDono(
      lookups({ listarSemDono: async () => null }),
      { agoraMs: AGORA },
    );
    expect(scan.leituraOk).toBe(false);
    expect(scan.encontradas).toBe(0);
    // E o que importa: com leituraOk falso a run fica amarela.
    expect(
      statusDaRunDeOrfaos(scanDeSessaoLimpo(), {
        acionaveis: scan.acionaveis,
        naoVerificadas: scan.naoVerificadas,
        leituraOk: scan.leituraOk,
        persisted: scan.persisted,
      }),
    ).toBe("partial");
  });

  it("candidato por email vira CANDIDATO, e nao atribuicao", async () => {
    const scan = await detectarChargesSemDono(
      lookups({
        contasPorEmail: async () =>
          new Map([["pagador@exemplo.com", "user-9"]]),
      }),
      { agoraMs: AGORA },
    );
    expect(scan.itens[0].candidatoUserId).toBe("user-9");
    expect(scan.itens[0].candidatoVerificado).toBe(true);
    // O achado NAO carrega campo de atribuicao: nao ha `userId` no tipo, entao
    // nao ha como o job promover ninguem por acidente.
    expect("userId" in scan.itens[0]).toBe(false);
  });

  it("email SEM conta correspondente e registrado como sem candidato", async () => {
    const scan = await detectarChargesSemDono(
      lookups({ contasPorEmail: async () => new Map() }),
      { agoraMs: AGORA },
    );
    expect(scan.itens[0].candidatoUserId).toBeNull();
    // Verificado: procurei e nao achei. Diferente de nao ter procurado.
    expect(scan.itens[0].candidatoVerificado).toBe(true);
    expect(scan.naoVerificadas).toBe(0);
  });

  it("cobranca SEM email e SEM customer vira NAO VERIFICADA", async () => {
    // 3 das 50 charges de 7 dias nao tem customer. "Nao sei quem e" nao pode
    // virar "esta ok".
    const scan = await detectarChargesSemDono(
      lookups({
        listarSemDono: async () => [
          linha({ emailDaCobranca: null, customerId: null }),
        ],
      }),
      { agoraMs: AGORA },
    );
    expect(scan.naoVerificadas).toBe(1);
    expect(scan.itens[0].candidatoVerificado).toBe(false);
    expect(
      statusDaRunDeOrfaos(scanDeSessaoLimpo(), {
        acionaveis: scan.acionaveis,
        naoVerificadas: scan.naoVerificadas,
        leituraOk: scan.leituraOk,
        persisted: scan.persisted,
      }),
    ).toBe("partial");
  });

  it("sem email na linha, cai para a Stripe UMA vez por achado", async () => {
    const emailDoCustomer = vi.fn(async () => "vindo-da-stripe@exemplo.com");
    const scan = await detectarChargesSemDono(
      lookups({
        listarSemDono: async () => [linha({ emailDaCobranca: null })],
        emailDoCustomer,
        contasPorEmail: async () =>
          new Map([["vindo-da-stripe@exemplo.com", "user-7"]]),
      }),
      { agoraMs: AGORA },
    );
    expect(emailDoCustomer).toHaveBeenCalledTimes(1);
    expect(scan.itens[0].candidatoUserId).toBe("user-7");
  });

  it("CONTROLE NEGATIVO: com email na linha NAO chama a Stripe", async () => {
    // O caminho comum e gratuito: medido em 5 de 5 das cobrancas sem dono, o
    // email ja estava em `raw_payload.source.billing_details.email`.
    const emailDoCustomer = vi.fn(async () => "nao-deveria@exemplo.com");
    await detectarChargesSemDono(lookups({ emailDoCustomer }), {
      agoraMs: AGORA,
    });
    expect(emailDoCustomer).not.toHaveBeenCalled();
  });

  it("teto estourado deixa o excedente NAO VERIFICADO e mantem partial", async () => {
    const quantas = TETO_CANDIDATO_POR_EMAIL + 3;
    const emailDoCustomer = vi.fn(async () => null);
    const scan = await detectarChargesSemDono(
      lookups({
        listarSemDono: async () =>
          Array.from({ length: quantas }, (_, i) =>
            linha({ stripeChargeId: `ch_${i}`, emailDaCobranca: null }),
          ),
        emailDoCustomer,
      }),
      { agoraMs: AGORA },
    );
    expect(emailDoCustomer).toHaveBeenCalledTimes(TETO_CANDIDATO_POR_EMAIL);
    expect(scan.encontradas).toBe(quantas);
    // Todas nao verificadas: as do teto porque a Stripe nao devolveu email, as
    // 3 excedentes porque nem foram tentadas. O que passa do teto NAO some.
    expect(scan.naoVerificadas).toBe(quantas);
    expect(
      statusDaRunDeOrfaos(scanDeSessaoLimpo(), {
        acionaveis: scan.acionaveis,
        naoVerificadas: scan.naoVerificadas,
        leituraOk: scan.leituraOk,
        persisted: scan.persisted,
      }),
    ).toBe("partial");
  });

  it("segunda execucao nao duplica: `novas` sai do que o upsert inseriu", async () => {
    // O duble reproduz `ignoreDuplicates`: a primeira execucao insere, a
    // segunda devolve zero linhas. Se `novas` fosse derivado do tamanho da
    // lista em vez do retorno do banco, o job reportaria orfaos novos todo dia.
    const jaRegistradas = new Set<string>();
    const persistir = async (itens: AchadoSemDono[]) => {
      const novas = itens.filter((i) => !jaRegistradas.has(i.stripeChargeId));
      for (const n of novas) jaRegistradas.add(n.stripeChargeId);
      return { persisted: true, novas: novas.length };
    };
    const primeira = await detectarChargesSemDono(lookups({ persistir }), {
      agoraMs: AGORA,
    });
    const segunda = await detectarChargesSemDono(lookups({ persistir }), {
      agoraMs: AGORA,
    });
    expect(primeira.novas).toBe(1);
    expect(segunda.novas).toBe(0);
    // A deteccao continua acusando nas duas: a linha segue em aberto.
    expect(segunda.acionaveis).toBe(1);
  });

  it("dry-run nao persiste e nao inventa linha nova", async () => {
    const persistir = vi.fn(async () => ({ persisted: true, novas: 1 }));
    const scan = await detectarChargesSemDono(lookups({ persistir }), {
      agoraMs: AGORA,
      dryRun: true,
    });
    expect(persistir).not.toHaveBeenCalled();
    expect(scan.novas).toBe(0);
    expect(scan.acionaveis).toBe(1);
  });

  it("falha ao persistir mantem a run em partial", async () => {
    const scan = await detectarChargesSemDono(
      lookups({ persistir: async () => ({ persisted: false, novas: 0 }) }),
      { agoraMs: AGORA },
    );
    expect(scan.persisted).toBe(false);
    expect(
      statusDaRunDeOrfaos(scanDeSessaoLimpo(), {
        acionaveis: scan.acionaveis,
        naoVerificadas: scan.naoVerificadas,
        leituraOk: scan.leituraOk,
        persisted: scan.persisted,
      }),
    ).toBe("partial");
  });
});

describe("linhaDoBanco", () => {
  it("le email e customer de raw_payload sem chamar a Stripe", () => {
    const l = linhaDoBanco({
      stripe_charge_id: "py_1",
      gross_cents: 2990,
      currency: "BRL",
      occurred_at: "2026-08-21T06:14:40.000Z",
      raw_payload: {
        source: {
          customer: "cus_V6sD6mBFPrWXGw",
          billing_details: { email: "wssantosdfn24@gmail.com" },
        },
      },
    });
    expect(l.emailDaCobranca).toBe("wssantosdfn24@gmail.com");
    expect(l.customerId).toBe("cus_V6sD6mBFPrWXGw");
  });

  it("CONTROLE NEGATIVO: raw_payload sem os campos devolve null, nao quebra", () => {
    const l = linhaDoBanco({
      stripe_charge_id: "ch_x",
      gross_cents: null,
      currency: null,
      occurred_at: "2026-08-01T00:00:00.000Z",
      raw_payload: { source: "ch_x" },
    });
    expect(l.emailDaCobranca).toBeNull();
    expect(l.customerId).toBeNull();
  });

  it("CONTROLE NEGATIVO: email vazio nao vira email", () => {
    const l = linhaDoBanco({
      stripe_charge_id: "ch_y",
      gross_cents: null,
      currency: null,
      occurred_at: "2026-08-01T00:00:00.000Z",
      raw_payload: { source: { billing_details: { email: "   " } } },
    });
    expect(l.emailDaCobranca).toBeNull();
  });
});

/** Varredura por sessao SEM nada a acusar: isola o efeito do segundo achado. */
function scanDeSessaoLimpo() {
  return {
    windowDays: 7,
    full: false,
    dryRun: false,
    paidSessions: 0,
    skippedRecent: 0,
    orphans: 0,
    orphansAcionaveis: 0,
    porCategoria: {
      modo_teste: 0,
      conta_excluida: 0,
      sem_usuario_no_banco: 0,
      sem_assinatura: 0,
    },
    newOrphans: 0,
    persisted: true,
    findings: [],
    unresolvedAcionaveis: 0,
    unresolvedItens: [],
    unresolvedNaoVerificadas: 0,
    unresolvedLeituraOk: true,
  };
}

describe("statusDaRunDeOrfaos com o segundo achado", () => {
  it("CONTROLE NEGATIVO: sem achados dos dois lados, a run e success", () => {
    expect(
      statusDaRunDeOrfaos(scanDeSessaoLimpo(), {
        acionaveis: 0,
        naoVerificadas: 0,
        leituraOk: true,
        persisted: true,
      }),
    ).toBe("success");
  });

  it("cobranca sem dono acionavel deixa a run em partial", () => {
    expect(
      statusDaRunDeOrfaos(scanDeSessaoLimpo(), {
        acionaveis: 1,
        naoVerificadas: 0,
        leituraOk: true,
        persisted: true,
      }),
    ).toBe("partial");
  });

  it("CONTROLE NEGATIVO: sem o segundo argumento o criterio antigo vale igual", () => {
    // Compatibilidade: nenhum chamador existente muda de comportamento.
    expect(statusDaRunDeOrfaos(scanDeSessaoLimpo())).toBe("success");
  });
});
