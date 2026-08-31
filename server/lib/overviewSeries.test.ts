import { describe, expect, it } from "vitest";

import {
  calcularFrescor,
  contarCoorte,
  FUNIL_MIN_CADASTROS,
  FUNIL_MIN_MATURIDADE_DIAS,
  montarFunilDeCoorte,
  SNAPSHOT_MARGEM_HORAS,
} from "./overviewSeries";

/**
 * As partes PURAS da Fase 4: a aritmética do funil e o frescor do snapshot.
 *
 * São as duas que não podem errar em silêncio, uma taxa inventada e um "está em
 * dia" falso são números plausíveis, e é isso que os torna perigosos.
 */

describe("funil de coorte: taxas adjacentes", () => {
  it("a ORDEM é cadastro, Pro, engajamento pós-compra (D20)", () => {
    // A ordem antiga (cadastro -> ativou -> assinou) afirmava que a ativação é
    // pré-requisito da compra, o que os dados não sustentam: quem assina antes
    // de usar aparecia como perda numa etapa que já tinha passado.
    const f = montarFunilDeCoorte({
      cadastro: 1000,
      pro: 100,
      proComUso: 50,
      anterior: null,
    });
    expect(f.passos.map((p) => p.chave)).toEqual([
      "cadastro",
      "pro",
      "engajamento",
    ]);
  });

  it("calcula taxa sobre o passo anterior, não sobre o topo", () => {
    const f = montarFunilDeCoorte({
      cadastro: 1000,
      pro: 100,
      proComUso: 50,
      anterior: null,
    });

    expect(f.passos.map((p) => p.valor)).toEqual([1000, 100, 50]);
    expect(f.passos[1].taxaSobreAnterior).toBeCloseTo(10, 6);
    // 50 de 100 ASSINANTES = 50%, não 5% do topo. Taxa sobre o topo faria a
    // última etapa parecer sempre catastrófica.
    expect(f.passos[2].taxaSobreAnterior).toBeCloseTo(50, 6);
  });

  it("CONTROLE NEGATIVO: denominador zero vira taxa NULL, nunca NaN nem Infinity", () => {
    const f = montarFunilDeCoorte({
      cadastro: 0,
      pro: 0,
      proComUso: 0,
      anterior: null,
    });

    expect(f.passos[1].taxaSobreAnterior).toBeNull();
    expect(f.passos[2].taxaSobreAnterior).toBeNull();
    for (const p of f.passos) {
      expect(Number.isNaN(p.taxaSobreAnterior as number)).toBe(false);
    }
  });

  it("o primeiro passo NÃO tem taxa (não existe passo anterior)", () => {
    const f = montarFunilDeCoorte({
      cadastro: 10,
      pro: 5,
      proComUso: 1,
      anterior: null,
    });
    expect(f.passos[0].taxaSobreAnterior).toBeNull();
  });

  it("destaca a transição de MENOR taxa absoluta, deterministicamente", () => {
    const f = montarFunilDeCoorte({
      cadastro: 1000,
      pro: 30, // 3%
      proComUso: 15, // 50%
      anterior: null,
    });
    expect(f.destaque).toBe("pro");
  });

  it("o destaque acompanha a ordem nova: engajamento baixo vence conversão alta", () => {
    // A regra do destaque não mudou (menor taxa absoluta); o que mudou foi
    // QUAIS transições existem. Sem este caso, a reordenação passaria com o
    // destaque sempre no mesmo passo e ninguém saberia.
    const f = montarFunilDeCoorte({
      cadastro: 100,
      pro: 90, // 90%
      proComUso: 9, // 10%
      anterior: null,
    });
    expect(f.destaque).toBe("engajamento");
  });

  it("com todas as transições sem denominador, não há destaque", () => {
    const f = montarFunilDeCoorte({
      cadastro: 0,
      pro: 0,
      proComUso: 0,
      anterior: null,
    });
    expect(f.destaque).toBeNull();
  });

  it("NÃO produz delta de taxa entre janelas, e diz por quê", () => {
    // As coortes têm maturidades diferentes: quem se cadastrou ontem teve um dia
    // para converter, quem se cadastrou há 45 dias teve 45. Um delta aqui seria
    // negativo por construção, todo dia, sem nada ter piorado.
    const f = montarFunilDeCoorte({
      cadastro: 4807,
      pro: 76,
      proComUso: 60,
      anterior: { cadastro: 619, pro: 25, proComUso: 20 },
    });

    // 619 >= 100, mas sem maturidade declarada o delta continua desligado.
    expect(f.motivoSemDelta).toBe("coortes_de_maturidade_diferente");
    expect(f.deltaPp).toBeNull();
    expect(f.anterior).toEqual({ cadastro: 619, pro: 25, proComUso: 20 });
    // CONTROLE NEGATIVO: nenhum passo carrega um campo de delta.
    for (const p of f.passos) {
      expect(p).not.toHaveProperty("delta");
      expect(p).not.toHaveProperty("deltaPct");
    }
  });

  it("passos são subconjuntos aninhados: a taxa nunca passa de 100%", () => {
    // Propriedade do funil de coorte. Um funil de ATIVIDADE na janela (não
    // aninhado) permitiria conversão maior que o topo, e a taxa deixaria de
    // significar alguma coisa.
    const f = montarFunilDeCoorte({
      cadastro: 100,
      pro: 100,
      proComUso: 100,
      anterior: null,
    });
    for (const p of f.passos) {
      if (p.taxaSobreAnterior !== null) {
        expect(p.taxaSobreAnterior).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("contagem da coorte: o 3º passo é INTERSEÇÃO, não união", () => {
  const pessoa = (id: string) => ({ user_id: id });

  it("conta cadastro, Pro e Pro-que-usou nas mesmas pessoas", () => {
    const coorte = [pessoa("a"), pessoa("b"), pessoa("c"), pessoa("d")];
    const pro = new Set(["a", "b", "c"]);
    const usaram = new Set(["a", "b", "d"]);

    // 'd' usou mas não assinou: entra em `usaram` e NÃO entra em `proComUso`.
    expect(contarCoorte(coorte, pro, usaram)).toEqual({
      cadastro: 4,
      pro: 3,
      proComUso: 2,
    });
  });

  it("CONTROLE NEGATIVO: assinante SEM uso não conta no 3º passo", () => {
    const coorte = [pessoa("a"), pessoa("b")];
    const pro = new Set(["a", "b"]);
    const usaram = new Set<string>(["a"]);

    const c = contarCoorte(coorte, pro, usaram);
    expect(c.pro).toBe(2);
    // 'b' pagou e nunca usou: é exatamente o cliente que o passo existe para
    // encontrar, e somá-lo aqui apagaria o problema que a etapa mede.
    expect(c.proComUso).toBe(1);
  });

  it("CONTROLE NEGATIVO: uso sem assinatura NÃO pode fazer a taxa passar de 100%", () => {
    // Se o 3º passo fosse "quem usou" (sem cruzar com Pro), 30 usuários sobre 2
    // assinantes daria 1.500%. O aninhamento existe para isso ser impossível.
    const coorte = Array.from({ length: 30 }, (_, i) => pessoa(`u${i}`));
    const pro = new Set(["u0", "u1"]);
    const usaram = new Set(coorte.map((p) => p.user_id));

    const c = contarCoorte(coorte, pro, usaram);
    const f = montarFunilDeCoorte({ ...c, anterior: null });
    expect(f.passos[2].taxaSobreAnterior).toBeCloseTo(100, 6);
  });

  it("coorte vazia dá zeros, não NaN", () => {
    expect(contarCoorte([], new Set(), new Set())).toEqual({
      cadastro: 0,
      pro: 0,
      proComUso: 0,
    });
  });
});

describe("frescor do snapshot (D14): duração, não rótulo de dia", () => {
  const snapshotDe = (dia: string) => dia;

  it("depois da execução do dia, está em dia", () => {
    // 06:00Z de 14/08, snapshot de 14/08 (coletado 05:10Z): 50 minutos atrás.
    const f = calcularFrescor(
      snapshotDe("2026-08-14"),
      new Date("2026-08-14T06:00:00Z"),
    );
    expect(f.atrasado).toBe(false);
    expect(f.horasDesdeOEsperado).toBe(0);
  });

  it("A CORREÇÃO: às 01:30Z, com o snapshot de ontem, NÃO está atrasado", () => {
    // Este é o caso que o campo antigo errava. Às 01:30Z de 14/08 o rótulo do
    // dia UTC já virou, mas a execução das 05:10Z ainda não aconteceu: o último
    // snapshot esperado é o de 13/08, e ele existe. `staleDays` acusava 1.
    const f = calcularFrescor(
      snapshotDe("2026-08-13"),
      new Date("2026-08-14T01:30:00Z"),
    );
    expect(f.atrasado).toBe(false);
    expect(f.horasDesdeOEsperado).toBe(0);
  });

  it("CONTROLE NEGATIVO: o comportamento ANTIGO teria acusado atraso nesse mesmo instante", () => {
    // Guarda contra regressão silenciosa: se alguém voltar a comparar rótulos,
    // este cenário volta a dar 1 e o teste acima cai.
    const rotuloAntigo = (ultimo: string, agora: Date) => {
      const hojeUtc = agora.toISOString().slice(0, 10);
      const MS = 24 * 60 * 60 * 1000;
      return Math.round(
        (Date.parse(`${hojeUtc}T00:00:00Z`) -
          Date.parse(`${ultimo}T00:00:00Z`)) /
          MS,
      );
    };
    expect(rotuloAntigo("2026-08-13", new Date("2026-08-14T01:30:00Z"))).toBe(
      1,
    );
    expect(
      calcularFrescor("2026-08-13", new Date("2026-08-14T01:30:00Z")).atrasado,
    ).toBe(false);
  });

  it("uma execução inteira perdida É atraso", () => {
    // 06:00Z de 14/08 com o último snapshot de 12/08: a execução de 13/08
    // não aconteceu.
    const f = calcularFrescor(
      snapshotDe("2026-08-12"),
      new Date("2026-08-14T06:00:00Z"),
    );
    expect(f.horasDesdeOEsperado).toBe(48);
    expect(f.atrasado).toBe(true);
  });

  it("a margem é respeitada e não é infinita", () => {
    expect(SNAPSHOT_MARGEM_HORAS).toBeGreaterThan(0);
    expect(SNAPSHOT_MARGEM_HORAS).toBeLessThan(24);
  });

  it("sem snapshot nenhum, é AUSÊNCIA, não 'em dia'", () => {
    // Série vazia não pode ser lida como saudável: ninguém mediu nunca.
    const f = calcularFrescor(null, new Date("2026-08-14T06:00:00Z"));
    expect(f.horasDesdeOEsperado).toBeNull();
    expect(f.ultimoSnapshot).toBeNull();
    expect(f.atrasado).toBe(false);
  });

  it("nunca devolve horas negativas", () => {
    // Snapshot com data no futuro (relógio torto, backfill) não pode virar um
    // atraso negativo que a UI exibiria como "-12h".
    const f = calcularFrescor(
      snapshotDe("2026-08-20"),
      new Date("2026-08-14T06:00:00Z"),
    );
    expect(f.horasDesdeOEsperado).toBeGreaterThanOrEqual(0);
  });
});

describe("delta do funil: liga só quando as coortes são comparáveis", () => {
  const grande = { cadastro: 1000, pro: 100, proComUso: 50 };

  it("LIGA com as duas coortes acima do mínimo e maturidade suficiente", () => {
    const f = montarFunilDeCoorte({
      ...grande,
      anterior: { cadastro: 800, pro: 96, proComUso: 48 },
      maturidadeAnteriorDias: FUNIL_MIN_MATURIDADE_DIAS,
    });

    expect(f.motivoSemDelta).toBeNull();
    // Pro: 10% agora contra 12% antes = -2 pontos percentuais.
    expect(f.deltaPp!.pro).toBeCloseTo(-2, 6);
    // Engajamento: 50% contra 50% = 0.
    expect(f.deltaPp!.engajamento).toBeCloseTo(0, 6);
  });

  it("CONTROLE NEGATIVO: coorte anterior pequena NÃO liga, e o motivo é específico", () => {
    // Foi o caso real de 2026-08-14: com piso de maturidade, a janela anterior
    // tinha DEZ cadastros. "Maturidade diferente" mandaria investigar a coisa
    // errada; o problema ali é tamanho.
    const f = montarFunilDeCoorte({
      ...grande,
      anterior: { cadastro: 10, pro: 2, proComUso: 1 },
      maturidadeAnteriorDias: 30,
    });

    expect(f.deltaPp).toBeNull();
    expect(f.motivoSemDelta).toBe("coorte_anterior_pequena");
  });

  it("CONTROLE NEGATIVO: maturidade insuficiente NÃO liga", () => {
    const f = montarFunilDeCoorte({
      ...grande,
      anterior: { cadastro: 800, pro: 96, proComUso: 48 },
      maturidadeAnteriorDias: FUNIL_MIN_MATURIDADE_DIAS - 1,
    });
    expect(f.deltaPp).toBeNull();
    expect(f.motivoSemDelta).toBe("coortes_de_maturidade_diferente");
  });

  it("CONTROLE NEGATIVO: sem janela anterior, não liga", () => {
    const f = montarFunilDeCoorte({ ...grande, anterior: null });
    expect(f.deltaPp).toBeNull();
    expect(f.motivoSemDelta).toBe("coortes_de_maturidade_diferente");
  });

  it("os limiares são constantes nomeadas, não números soltos", () => {
    expect(FUNIL_MIN_CADASTROS).toBe(100);
    expect(FUNIL_MIN_MATURIDADE_DIAS).toBe(7);
  });
});
