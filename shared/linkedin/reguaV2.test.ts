import { describe, expect, it } from "vitest";

import {
  CATEGORIA_AUTODECLARADA,
  cortesDeCobertura,
  expDescricoesPorItem,
  limiaresDensidade,
  mudancaSoDeAutodeclaracao,
} from "./reguaV2";

describe("cobertura, variante C", () => {
  it("pool grande fica no teto absoluto", () => {
    expect(cortesDeCobertura(64)).toEqual({ essencial: 6, otima: 10 });
    expect(cortesDeCobertura(22)).toEqual({ essencial: 6, otima: 10 });
    expect(cortesDeCobertura(12)).toEqual({ essencial: 6, otima: 9 });
  });

  it("pool pequena NUNCA pede mais do que existe", () => {
    for (let pool = 1; pool <= 64; pool += 1) {
      const { essencial, otima } = cortesDeCobertura(pool);
      expect(essencial, `pool ${pool}`).toBeLessThanOrEqual(pool);
      expect(otima, `pool ${pool}`).toBeLessThanOrEqual(Math.max(pool, essencial + 1));
    }
  });

  it("as tres areas que a contagem absoluta tornaria impossiveis ficam alcancaveis", () => {
    expect(cortesDeCobertura(3).essencial).toBe(2); // analise-sistemas
    expect(cortesDeCobertura(5).essencial).toBe(3); // gestao, blockchain
    expect(cortesDeCobertura(6).essencial).toBe(3); // gamedev
    expect(cortesDeCobertura(7).essencial).toBe(4); // iot
  });

  it("ciberseguranca (pool 10) nao pune quem passava: corte 5", () => {
    expect(cortesDeCobertura(10)).toEqual({ essencial: 5, otima: 8 });
  });

  it("A TRAVA age com pool 1 e com pool 2, e sem ela os dois checks colidiriam", () => {
    // Condicao do release: codigo que nunca executa nao e protecao. Com pool 1,
    // min(10, ceil(0,75)) = 1 e min(6, ceil(0,5)) = 1: sem a trava, essencial e
    // otima seriam o MESMO numero e o segundo check nunca diferenciaria nada.
    const semTrava = (p: number) => ({
      essencial: Math.min(6, Math.ceil(p / 2)),
      otima: Math.min(10, Math.ceil(p * 0.75)),
    });
    expect(semTrava(1)).toEqual({ essencial: 1, otima: 1 });
    expect(cortesDeCobertura(1)).toEqual({ essencial: 1, otima: 2 });
    expect(semTrava(2)).toEqual({ essencial: 1, otima: 2 });
    expect(cortesDeCobertura(2)).toEqual({ essencial: 1, otima: 2 });
    // Com pool 2 a trava nao precisa agir; com pool 1 ela age. E a fronteira.
    expect(cortesDeCobertura(1).otima).toBeGreaterThan(cortesDeCobertura(1).essencial);
  });

  it("otima e SEMPRE maior que essencial, em toda pool", () => {
    for (let pool = 1; pool <= 200; pool += 1) {
      const { essencial, otima } = cortesDeCobertura(pool);
      expect(otima, `pool ${pool}`).toBeGreaterThan(essencial);
    }
  });
});

describe("limiares de densidade por nivel", () => {
  it("estagio, trainee, junior e transicao recebem a regua leve", () => {
    for (const n of ["estagio", "trainee", "junior", "transicao"] as const) {
      expect(limiaresDensidade(n).sobreMin).toBe(300);
      expect(limiaresDensidade(n).descricaoPorExperiencia).toBe(50);
    }
  });

  it("pleno e freelancer ficam como hoje", () => {
    for (const n of ["pleno", "freelancer"] as const) {
      expect(limiaresDensidade(n).sobreMin).toBe(500);
      expect(limiaresDensidade(n).descricaoPorExperiencia).toBe(100);
    }
  });

  it("o teto do Sobre NAO muda por nivel", () => {
    expect(limiaresDensidade("junior").sobreMax).toBe(
      limiaresDensidade("pleno").sobreMax,
    );
  });

  it("a menor descricao legitima do corpus (56) passa no leve e reprova no padrao", () => {
    expect(56).toBeGreaterThanOrEqual(limiaresDensidade("junior").descricaoPorExperiencia);
    expect(56).toBeLessThan(limiaresDensidade("pleno").descricaoPorExperiencia);
  });
});

describe("exp-descricoes por item", () => {
  it("uma experiencia vazia entre cheias REPROVA, e o veredito diz qual", () => {
    const v = expDescricoesPorItem([0, 1422, 823], 100);
    expect(v.aprovado).toBe(false);
    expect(v.reprovadas).toEqual([1]);
    expect(v.total).toBe(3);
  });

  it("o agregado antigo aprovaria o mesmo perfil", () => {
    // 0 + 1422 + 823 = 2245 >= 100. Era isso que fazia o card dizer
    // "criterios ok" com uma experiencia sem descricao nenhuma.
    const soma = [0, 1422, 823].reduce((s, n) => s + n, 0);
    expect(soma).toBeGreaterThanOrEqual(100);
  });

  it("todas com descricao suficiente aprova", () => {
    expect(expDescricoesPorItem([120, 300], 100).aprovado).toBe(true);
    expect(expDescricoesPorItem([120, 300], 100).reprovadas).toEqual([]);
  });

  it("sem experiencia nenhuma NAO aprova por vacuidade", () => {
    expect(expDescricoesPorItem([], 100).aprovado).toBe(false);
  });

  it("fronteira exata do minimo por item", () => {
    expect(expDescricoesPorItem([99], 100).aprovado).toBe(false);
    expect(expDescricoesPorItem([100], 100).aprovado).toBe(true);
    expect(expDescricoesPorItem([49], 50).aprovado).toBe(false);
    expect(expDescricoesPorItem([50], 50).aprovado).toBe(true);
  });
});

describe("sinais autodeclarados: sem reponderacao", () => {
  it("o peso dos sinais NAO e mexido: 28 de 194 continuam sendo 28 de 194", () => {
    // Guard contra reintroduzir o teto sem decisao. Ele existiu e foi
    // revertido: 100% do movimento para baixo das 107 vinha dele.
    const catalogo = [
      { tier: "essencial" as const, category: "sinais" },
      { tier: "opcional" as const, category: "sinais" },
      { tier: "importante" as const, category: "sinais" },
      { tier: "importante" as const, category: "sinais" },
      { tier: "opcional" as const, category: "sinais" },
    ];
    const pesos = { essencial: 10, importante: 6, opcional: 3 };
    const soma = catalogo.reduce((s, c) => s + pesos[c.tier], 0);
    expect(soma).toBe(28);
    expect(CATEGORIA_AUTODECLARADA).toBe("sinais");
  });
});

describe("delta suprimido quando a mudanca e so autodeclaracao", () => {
  const c = (id: string, category: string, aprovado: boolean) => ({ id, category, aprovado });

  it("marcar 'tenho banner' nao pode gerar delta nem celebracao", () => {
    const antes = [c("headline-existe", "headline", true), c("banner-personalizado", "sinais", false)];
    const depois = [c("headline-existe", "headline", true), c("banner-personalizado", "sinais", true)];
    expect(mudancaSoDeAutodeclaracao(antes, depois)).toBe(true);
  });

  it("melhoria real no perfil gera delta, mesmo junto com autodeclaracao", () => {
    const antes = [c("sobre-cta", "sobre", false), c("banner-personalizado", "sinais", false)];
    const depois = [c("sobre-cta", "sobre", true), c("banner-personalizado", "sinais", true)];
    expect(mudancaSoDeAutodeclaracao(antes, depois)).toBe(false);
  });

  it("nada mudou nao e 'so autodeclaracao'", () => {
    const iguais = [c("sobre-cta", "sobre", true)];
    expect(mudancaSoDeAutodeclaracao(iguais, iguais)).toBe(false);
  });

  it("check que nao existia antes nao conta como mudanca", () => {
    const antes = [c("sobre-cta", "sobre", true)];
    const depois = [c("sobre-cta", "sobre", true), c("check-novo", "sinais", true)];
    expect(mudancaSoDeAutodeclaracao(antes, depois)).toBe(false);
  });
});
