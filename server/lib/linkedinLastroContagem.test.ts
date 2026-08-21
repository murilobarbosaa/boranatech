import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * O teto do Sentry passa a CONTAR, em vez de subcontar (BUG-28, BUG-42, BUG-48).
 *
 * Estado anterior: 1 evento por tipo a cada 60s por processo, e o `console.warn`
 * com a contagem exata morrendo no log do Railway, porque
 * `server/lib/sentry.ts` nao instala integracao de console. A serie visivel era
 * "quantos eventos couberam na janela", que nao tem relacao com o volume real.
 *
 * O que este teste trava e a RECONSTITUICAO: somando
 * `1 + ocorrencias_suprimidas_desde_ultimo` sobre os eventos, ou lendo o maior
 * `total_no_processo`, chega-se ao numero de violacoes que de fato aconteceram.
 * A Etapa 2 (ajuste de prompt) depende disso para poder afirmar "melhorou".
 */

vi.mock("@sentry/node", async () => {
  const { espiao } = await import("./__mocks__/sentryEspiao");
  return espiao();
});

vi.mock("./env", async (importActual) => {
  const real = await importActual<typeof import("./env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

import { capturados } from "./__mocks__/sentryEspiao";
import {
  __resetContagemDeLastroParaTeste,
  registrarViolacao,
} from "./linkedinAnalyze";
import type { Violacao } from "../../shared/linkedin/lastro";

function violacao(tipo: Violacao["tipo"], termo = "Kubernetes"): Violacao {
  return { tipo, campo: "headlines", contexto: "Dev | Node", termo };
}

type ExtraDeLastro = {
  ocorrencias_suprimidas_desde_ultimo: number;
  total_no_processo: number;
};

function extrasDe(indice: number): ExtraDeLastro {
  return (capturados[indice].opts as { extra: ExtraDeLastro }).extra;
}

describe("contagem de violacoes de lastro", () => {
  beforeEach(() => {
    capturados.length = 0;
    __resetContagemDeLastroParaTeste();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.useFakeTimers();
    // Instante fixo: a janela e medida por diferenca, e um relogio real faria o
    // caso de "dentro da janela" depender da velocidade da maquina.
    vi.setSystemTime(new Date("2026-08-18T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("N violacoes do MESMO tipo na janela dao 1 evento, e ele carrega o N", () => {
    for (let i = 0; i < 7; i += 1) {
      registrarViolacao(violacao("tecnologia_sem_lastro"));
    }

    // O teto continua valendo: o volume de eventos nao subiu.
    expect(capturados).toHaveLength(1);
    // E o unico evento ja declara o total, mesmo tendo saido na PRIMEIRA
    // ocorrencia: `total_no_processo` e lido no envio, entao aqui ele vale 1.
    expect(extrasDe(0).total_no_processo).toBe(1);
    expect(extrasDe(0).ocorrencias_suprimidas_desde_ultimo).toBe(0);
  });

  it("o evento SEGUINTE traz as suprimidas e o total reconstituivel", () => {
    // 7 na primeira janela (1 enviada, 6 suprimidas).
    for (let i = 0; i < 7; i += 1) {
      registrarViolacao(violacao("tecnologia_sem_lastro"));
    }
    vi.advanceTimersByTime(60_000);
    // A oitava ja cai na janela seguinte e leva a conta das 6.
    registrarViolacao(violacao("tecnologia_sem_lastro"));

    expect(capturados).toHaveLength(2);
    expect(extrasDe(1).ocorrencias_suprimidas_desde_ultimo).toBe(6);
    expect(extrasDe(1).total_no_processo).toBe(8);

    // AS DUAS RECONSTITUICOES CONCORDAM, que e a propriedade que interessa.
    const porSoma = [0, 1].reduce(
      (t, i) => t + 1 + extrasDe(i).ocorrencias_suprimidas_desde_ultimo,
      0,
    );
    const porTotal = Math.max(
      ...[0, 1].map((i) => extrasDe(i).total_no_processo),
    );
    expect(porSoma).toBe(8);
    expect(porTotal).toBe(8);
  });

  it("CONTROLE NEGATIVO: cada tipo conta sozinho, sem somar com os outros", () => {
    // Sem isto, um tipo barulhento esconderia outro atras do proprio volume,
    // que e a razao do fingerprint por tipo existir.
    registrarViolacao(violacao("tecnologia_sem_lastro"));
    registrarViolacao(violacao("numeral_fabricado", "300%"));
    registrarViolacao(violacao("tecnologia_sem_lastro"));
    registrarViolacao(violacao("numeral_fabricado", "45 pessoas"));
    registrarViolacao(violacao("numeral_fabricado", "12x"));

    // Um evento por tipo (o primeiro de cada), nao um por ocorrencia.
    expect(capturados).toHaveLength(2);

    vi.advanceTimersByTime(60_000);
    registrarViolacao(violacao("tecnologia_sem_lastro"));
    registrarViolacao(violacao("numeral_fabricado", "8h"));

    const porTipo = capturados.map((c) => ({
      msg: c.msg,
      extra: (c.opts as { extra: ExtraDeLastro }).extra,
    }));
    const tecnologia = porTipo.filter((c) =>
      c.msg.includes("tecnologia_sem_lastro"),
    );
    const numeral = porTipo.filter((c) => c.msg.includes("numeral_fabricado"));

    // 3 de tecnologia e 4 de numeral, cada um com a sua propria conta.
    expect(tecnologia[1].extra.total_no_processo).toBe(3);
    expect(numeral[1].extra.total_no_processo).toBe(4);
    expect(tecnologia[1].extra.ocorrencias_suprimidas_desde_ultimo).toBe(1);
    expect(numeral[1].extra.ocorrencias_suprimidas_desde_ultimo).toBe(2);
  });

  it("o resto do evento nao mudou: nivel, tags e fingerprint por tipo", () => {
    registrarViolacao(violacao("bullet_sem_origem", "3 bullet(s)"));

    const o = capturados[0].opts as {
      level: string;
      tags: Record<string, string>;
      fingerprint: string[];
      extra: Record<string, unknown>;
    };
    expect(capturados[0].msg).toBe("ai_lastro_violado: bullet_sem_origem");
    expect(o.level).toBe("warning");
    expect(o.tags).toMatchObject({
      area: "ai-lastro",
      tool: "linkedin-analyzer",
      tipo: "bullet_sem_origem",
    });
    expect(o.fingerprint).toEqual(["ai-lastro-violado", "bullet_sem_origem"]);
    // Os extras antigos continuam la: a contagem foi ACRESCENTADA, nao trocada.
    expect(o.extra.campo).toBe("headlines");
    expect(o.extra.termo).toBe("3 bullet(s)");
    expect(o.extra.contexto).toBe("Dev | Node");
  });

  it("o console.warn continua saindo em TODA ocorrencia", () => {
    // Ele nao chega ao Sentry, mas segue sendo o registro por ocorrencia no log
    // do Railway, e a mudanca nao pode te-lo silenciado junto.
    const warn = vi.mocked(console.warn);
    for (let i = 0; i < 4; i += 1) {
      registrarViolacao(violacao("tecnologia_sem_lastro"));
    }

    expect(warn).toHaveBeenCalledTimes(4);
    expect(capturados).toHaveLength(1);
  });
});
