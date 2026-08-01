import { describe, expect, it } from "vitest";

import { CHARGE_SEM_DONO_CORTE_DIAS } from "./financeSyncWindow";
import {
  calcularProblemas,
  SNAPSHOT_TOLERANCIA_DIAS,
  type SinaisDeSaude,
} from "./healthBand";

/**
 * A regra da faixa: lista VAZIA é o caso bom, e é ela que faz a faixa sumir.
 *
 * Verde não é um selo. Se a lista de problemas pudesse conter "tudo bem", a
 * faixa passaria a ocupar o topo da página para dizer que não há nada a dizer.
 */

const AGORA = new Date("2026-08-01T12:00:00Z");

function sinais(over: Partial<SinaisDeSaude> = {}): SinaisDeSaude {
  return {
    database: "ok",
    openai: "ok",
    currents: "ok",
    jooble: "ok",
    posthogState: "ok",
    stripeFaltando: [],
    redisConfigured: true,
    redisOk: true,
    resendApiKey: true,
    snapshotStaleDays: 0,
    boletosPendentes: [],
    chargesSemDono: { count: 0, grossCents: 0 },
    filaDeEmail: { failed: 0, waiting: 0 },
    ...over,
  };
}

describe("tudo bem = nada a dizer", () => {
  it("sem problema, a lista é vazia", () => {
    expect(calcularProblemas(sinais(), AGORA)).toEqual([]);
  });

  it("Redis NÃO configurado não é problema", () => {
    // Ausência deliberada não é falha: o código trata Redis nulo em todo lugar.
    expect(
      calcularProblemas(
        sinais({ redisConfigured: false, redisOk: false }),
        AGORA,
      ),
    ).toEqual([]);
  });

  it("health check que não respondeu não vira acusação de chave faltando", () => {
    // `null` significa "não sei", e afirmar que a chave falta seria inventar.
    expect(
      calcularProblemas(
        sinais({ database: null, openai: null, currents: null, jooble: null }),
        AGORA,
      ),
    ).toEqual([]);
  });
});

describe("os oito sinais continuam cobertos", () => {
  it("banco fora é ERRO", () => {
    const p = calcularProblemas(sinais({ database: "error" }), AGORA);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ id: "database", severidade: "erro" });
  });

  it("Stripe com credencial faltando é ERRO e diz qual", () => {
    // Stripe é o único provedor de pagamento: faltar credencial impede cobrar.
    const p = calcularProblemas(
      sinais({ stripeFaltando: ["webhook secret", "price pro_annual"] }),
      AGORA,
    );
    expect(p[0]).toMatchObject({ id: "stripe", severidade: "erro" });
    expect(p[0].detalhe).toContain("webhook secret");
    expect(p[0].detalhe).toContain("price pro_annual");
  });

  it("PostHog, Redis, OpenAI, Resend, Currents e Jooble aparecem quando quebram", () => {
    const p = calcularProblemas(
      sinais({
        posthogState: "error",
        redisOk: false,
        openai: "error",
        resendApiKey: false,
        currents: "error",
        jooble: "error",
      }),
      AGORA,
    );
    expect(p.map((x) => x.id).sort()).toEqual([
      "currents",
      "jooble",
      "openai",
      "posthog",
      "redis",
      "resend",
    ]);
  });

  it("currents e jooble eram calculados e NUNCA apareciam antes", () => {
    // Ganho da consolidação: `/api/health` já produzia esses dois sinais e
    // nenhum dos dois cartões antigos os exibia.
    const p = calcularProblemas(sinais({ currents: "error" }), AGORA);
    expect(p.map((x) => x.id)).toContain("currents");
  });

  it("erro vem antes de aviso", () => {
    const p = calcularProblemas(
      sinais({ posthogState: "error", database: "error" }),
      AGORA,
    );
    expect(p[0].severidade).toBe("erro");
    expect(p[p.length - 1].severidade).toBe("atencao");
  });
});

describe("cron do snapshot parado", () => {
  it("um dia de atraso é NORMAL, não alarme", () => {
    // O snapshot é gravado às 05:10 UTC; entre 21h e 2h de Brasília o mais
    // recente é legitimamente o de ontem. Alertar aí gritaria toda noite, e
    // alarme que grita sem motivo é alarme que alguém desliga.
    expect(calcularProblemas(sinais({ snapshotStaleDays: 1 }), AGORA)).toEqual(
      [],
    );
    expect(SNAPSHOT_TOLERANCIA_DIAS).toBe(2);
  });

  it("acima da tolerância é ERRO e diz há quantos dias", () => {
    const p = calcularProblemas(sinais({ snapshotStaleDays: 5 }), AGORA);
    expect(p[0]).toMatchObject({ id: "snapshot-parado", severidade: "erro" });
    expect(p[0].detalhe).toContain("5 dias");
  });

  it("série vazia é diferente de série em dia", () => {
    const p = calcularProblemas(sinais({ snapshotStaleDays: null }), AGORA);
    expect(p[0].id).toBe("snapshot-nunca");
  });
});

describe("boleto em limbo", () => {
  it("diz o valor e quando expira", () => {
    // Emitido há 2 dias, prazo de 5: expira em 3.
    const p = calcularProblemas(
      sinais({
        boletosPendentes: [
          { valorCents: 22200, emitidoEm: "2026-07-30T12:00:00Z" },
        ],
      }),
      AGORA,
    );
    expect(p[0].id).toBe("boleto-limbo");
    expect(p[0].detalhe).toContain("222,00");
    expect(p[0].detalhe).toContain("3 dia");
  });

  it("soma quando há mais de um e usa o prazo MAIS CURTO", () => {
    const p = calcularProblemas(
      sinais({
        boletosPendentes: [
          { valorCents: 22200, emitidoEm: "2026-07-30T12:00:00Z" },
          { valorCents: 2990, emitidoEm: "2026-07-28T12:00:00Z" },
        ],
      }),
      AGORA,
    );
    expect(p[0].detalhe).toContain("251,90");
    expect(p[0].detalhe).toContain("1 dia");
  });

  it("prazo vencido é dito como vencido, não como número negativo", () => {
    const p = calcularProblemas(
      sinais({
        boletosPendentes: [
          { valorCents: 2990, emitidoEm: "2026-07-01T12:00:00Z" },
        ],
      }),
      AGORA,
    );
    expect(p[0].detalhe).toContain("prazo já venceu");
    expect(p[0].detalhe).not.toContain("-");
  });

  it("é AVISO, não erro: dinheiro que não entrou não é sistema quebrado", () => {
    const p = calcularProblemas(
      sinais({
        boletosPendentes: [{ valorCents: 2990, emitidoEm: null }],
      }),
      AGORA,
    );
    expect(p[0].severidade).toBe("atencao");
  });
});

describe("cobrança sem dono", () => {
  it("acusa com o VALOR em reais, não só a contagem", () => {
    // "1 cobrança sem dono" não move ninguém; "R$ 90,30" move. É o caso real:
    // um boleto pago em 24/07 cuja atribuição nunca chegou.
    const problemas = calcularProblemas(
      sinais({ chargesSemDono: { count: 1, grossCents: 9030 } }),
      AGORA,
    );
    const p = problemas.find((x) => x.id === "charge-sem-dono");
    expect(p).toBeDefined();
    expect(p!.detalhe).toContain("90,30");
  });

  it("é AVISO, não erro: o dinheiro está na conta, falta a atribuição", () => {
    const problemas = calcularProblemas(
      sinais({ chargesSemDono: { count: 1, grossCents: 9030 } }),
      AGORA,
    );
    expect(problemas.find((x) => x.id === "charge-sem-dono")!.severidade).toBe(
      "atencao",
    );
  });

  it("zero órfãs deixa a faixa SILENCIOSA", () => {
    const problemas = calcularProblemas(
      sinais({ chargesSemDono: { count: 0, grossCents: 0 } }),
      AGORA,
    );
    expect(problemas).toEqual([]);
  });

  it("concorda em número e plural com mais de uma cobrança", () => {
    const p = calcularProblemas(
      sinais({ chargesSemDono: { count: 3, grossCents: 15000 } }),
      AGORA,
    ).find((x) => x.id === "charge-sem-dono")!;
    expect(p.detalhe).toContain("3 cobranças");
    expect(p.detalhe).toContain("150,00");
  });

  it("cita o corte em dias, para o aviso dizer o que já foi tentado", () => {
    const p = calcularProblemas(
      sinais({ chargesSemDono: { count: 1, grossCents: 100 } }),
      AGORA,
    ).find((x) => x.id === "charge-sem-dono")!;
    expect(p.detalhe).toContain(String(CHARGE_SEM_DONO_CORTE_DIAS));
  });
});

describe("fila de e-mails", () => {
  it("falha na fila vira aviso, com a contagem", () => {
    const p = calcularProblemas(
      sinais({ filaDeEmail: { failed: 3, waiting: 12 } }),
      AGORA,
    ).find((x) => x.id === "fila-email");
    expect(p).toBeDefined();
    expect(p!.detalhe).toContain("3");
    expect(p!.severidade).toBe("atencao");
  });

  it("fila com trabalho AGUARDANDO e sem falha é silêncio", () => {
    // `waiting` maior que zero é o funcionamento normal de uma fila. Acusar
    // isso encheria a faixa de vermelho toda vez que uma campanha fosse
    // disparada, que é exatamente quando ninguém quer ruído.
    expect(
      calcularProblemas(
        sinais({ filaDeEmail: { failed: 0, waiting: 400 } }),
        AGORA,
      ),
    ).toEqual([]);
  });

  it("fila INDISPONÍVEL não vira problema próprio: quem cobre é o Redis", () => {
    // Dois avisos para a mesma causa treinam a pessoa a ignorar os dois.
    expect(calcularProblemas(sinais({ filaDeEmail: null }), AGORA)).toEqual([]);
  });

  it("indisponível com Redis fora acusa UMA vez, pelo Redis", () => {
    const problemas = calcularProblemas(
      sinais({ filaDeEmail: null, redisConfigured: true, redisOk: false }),
      AGORA,
    );
    expect(problemas.map((p) => p.id)).toEqual(["redis"]);
  });
});
