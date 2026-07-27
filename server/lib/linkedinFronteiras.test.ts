import { describe, expect, it } from "vitest";

import { runLinkedinChecks } from "./linkedinChecks";
import { keyTechnologiesForArea } from "./skillNormalize";
import {
  corteDeCompetencias,
  cortesDeCobertura,
} from "../../shared/linkedin/reguaV2";
import { faixaFromScore } from "../../shared/linkedin/schema";
import type { LinkedinParsed } from "../../shared/linkedin/parse";

/**
 * FRONTEIRAS dos limiares que a Fase 3 vai mover.
 *
 * A varredura de mutação por ordem de grandeza (`--vizinhanca` ausente)
 * responde "esse limiar é usado?". Estes testes respondem a outra pergunta:
 * "onde exatamente está a fronteira?". A diferença importa porque a Fase 3
 * move fronteira por poucos pontos, e um limiar pode estar coberto contra
 * 100 -> 100000 e descoberto contra 100 -> 101.
 *
 * Modo de escrita: para cada limiar, um caso EXATAMENTE no valor (que aprova) e
 * um caso um passo abaixo (que reprova). Mover o limiar em 1 quebra um dos dois.
 */

const parsedBase = (over: Partial<LinkedinParsed> = {}): LinkedinParsed => ({
  headline: "Desenvolvedora Full-stack | React | Node.js",
  sobre: null,
  experiencias: [],
  skillsPdf: [],
  formacao: [],
  certificacoes: [],
  usable: true,
  ...over,
});

const rodar = (
  parsed: LinkedinParsed,
  over: { skills?: string; profileText?: string; area?: "fullstack" | "backend" } = {},
) =>
  runLinkedinChecks({
    parsed,
      level: "pleno",
    profileText: over.profileText ?? `${parsed.headline ?? ""} ${parsed.sobre ?? ""}`,
    area: over.area ?? "fullstack",
    mercado: "brasil",
    skills: over.skills ?? "",
    foto: "sim",
    banner: "sim",
    openToWork: "sim",
    conexoes: "500-mais",
    atividade: "semanal",
  });

const aprovado = (r: ReturnType<typeof rodar>, id: string) =>
  r.checks.find((c) => c.id === id)?.aprovado;

describe("fronteira: sobre-tamanho (500 e 2200)", () => {
  const comSobre = (n: number) => rodar(parsedBase({ sobre: "a".repeat(n) }));

  it("499 reprova e 500 aprova", () => {
    expect(aprovado(comSobre(499), "sobre-tamanho")).toBe(false);
    expect(aprovado(comSobre(500), "sobre-tamanho")).toBe(true);
  });

  it("2200 aprova e 2201 reprova", () => {
    expect(aprovado(comSobre(2200), "sobre-tamanho")).toBe(true);
    expect(aprovado(comSobre(2201), "sobre-tamanho")).toBe(false);
  });
});

describe("fronteira: sobre-existe (200)", () => {
  it("199 reprova e 200 aprova", () => {
    expect(aprovado(rodar(parsedBase({ sobre: "a".repeat(199) })), "sobre-existe")).toBe(false);
    expect(aprovado(rodar(parsedBase({ sobre: "a".repeat(200) })), "sobre-existe")).toBe(true);
  });
});

describe("fronteira: exp-descricoes (100 caracteres somados)", () => {
  // O check mede a concatenacao das descricoes, nao cada uma.
  const comDescricao = (n: number) =>
    rodar(
      parsedBase({
        experiencias: [
          { titulo: "Desenvolvedora", empresa: "Empresa Alfa", descricao: "a".repeat(n) },
        ],
      }),
    );

  it("99 reprova e 100 aprova", () => {
    expect(aprovado(comDescricao(99), "exp-descricoes")).toBe(false);
    expect(aprovado(comDescricao(100), "exp-descricoes")).toBe(true);
  });
});

describe("fronteira: skills-quantidade (10) e skills-quantidade-otima (25)", () => {
  const comSkills = (n: number) =>
    rodar(parsedBase(), { skills: Array.from({ length: n }, (_, i) => `Skill${i}`).join(", ") });

  it("9 reprova e 10 aprova o basico", () => {
    expect(aprovado(comSkills(9), "skills-quantidade")).toBe(false);
    expect(aprovado(comSkills(10), "skills-quantidade")).toBe(true);
  });

  it("24 reprova e 25 aprova o otimo", () => {
    expect(aprovado(comSkills(24), "skills-quantidade-otima")).toBe(false);
    expect(aprovado(comSkills(25), "skills-quantidade-otima")).toBe(true);
  });
});

describe("fronteira: faixas de nota (39, 69, 89)", () => {
  it("cada fronteira separa exatamente dois inteiros vizinhos", () => {
    expect(faixaFromScore(39)).toBe("inicio");
    expect(faixaFromScore(40)).toBe("em-construcao");
    expect(faixaFromScore(69)).toBe("em-construcao");
    expect(faixaFromScore(70)).toBe("forte");
    expect(faixaFromScore(89)).toBe("forte");
    expect(faixaFromScore(90)).toBe("magnetico");
  });

  it("as pontas continuam nas faixas certas", () => {
    expect(faixaFromScore(0)).toBe("inicio");
    expect(faixaFromScore(100)).toBe("magnetico");
  });
});

describe("fronteira: cobertura por razao (0.5, 0.75) e skills-cobertura (0.5)", () => {
  // GRANULARIDADE. Estes tres limiares comparam uma RAZAO cujo denominador e o
  // numero de tecnologias-chave da area: 22 em fullstack, 64 na maior (backend).
  // A razao so assume valores multiplos de 1/N, entao o menor degrau observavel
  // e 0,045 em fullstack e 0,016 em backend. Um mutante de 0,01 e INOBSERVAVEL
  // por construcao: nao existe perfil cuja razao caia entre 0,50 e 0,51.
  //
  // O que da para fixar, e o que estes testes fixam, e o par de degraus que
  // cerca a fronteira. Mover o limiar para fora desse intervalo quebra.
  const techs = keyTechnologiesForArea("fullstack");
  const comNTechs = (n: number) => {
    const texto = techs.slice(0, n).join(" ");
    return rodar(parsedBase({ sobre: texto }), { profileText: texto });
  };

  it("fullstack tem 22 tecnologias-chave: o degrau da razao e 1/22", () => {
    expect(techs).toHaveLength(22);
  });

  it("REGUA V2: cobertura-keywords-area prende em 6 para fullstack (pool 22)", () => {
    // A regua v1 comparava razao (>= 0,5 de 22 = 11 tecnologias) e era
    // inatingivel na pratica: 1 das 107 analises aprovava. A v2 usa
    // min(6, ceil(pool/2)), que em fullstack da 6.
    expect(cortesDeCobertura(22).essencial).toBe(6);
    expect(aprovado(comNTechs(5), "cobertura-keywords-area")).toBe(false);
    expect(aprovado(comNTechs(6), "cobertura-keywords-area")).toBe(true);
  });

  it("REGUA V2: cobertura-keywords-otima prende em 10 para fullstack", () => {
    expect(cortesDeCobertura(22).otima).toBe(10);
    expect(aprovado(comNTechs(9), "cobertura-keywords-otima")).toBe(false);
    expect(aprovado(comNTechs(10), "cobertura-keywords-otima")).toBe(true);
  });

  it("REGUA V2: em area de pool pequena o corte encolhe junto, e nunca fica impossivel", () => {
    // ciberseguranca tem pool 10: o corte essencial vira 5, nao 6. Era o unico
    // perfil das 107 que a contagem absoluta pura derrubava.
    expect(cortesDeCobertura(10)).toEqual({ essencial: 5, otima: 8 });
    expect(cortesDeCobertura(3).essencial).toBeLessThanOrEqual(3);
  });

  it("REGUA V2: skills-cobertura prende no que o perfil COMPROVA, nao na pool", () => {
    // A v1 pedia 50% da pool inteira nas competencias coladas (11 em fullstack)
    // e aprovava 0 das 107. Agora pede min(corte, comprovadas): nunca mais do
    // que a pessoa tem.
    const comTudo = (n: number) => {
      const texto = techs.slice(0, 8).join(" "); // o perfil comprova 8
      return rodar(parsedBase({ sobre: texto }), {
        profileText: texto,
        skills: techs.slice(0, n).join(", "),
      });
    };
    // comprova 8, entao o corte e min(6, 8) = 6.
    expect(corteDeCompetencias(22, 8)).toEqual({ minimo: 6, alcancavel: true });
    expect(aprovado(comTudo(5), "skills-cobertura")).toBe(false);
    expect(aprovado(comTudo(6), "skills-cobertura")).toBe(true);
  });

  it("REGUA V2: quem comprova pouco nao e cobrado por mais do que tem", () => {
    // Comprova 3: o corte cai para 3, e cadastrar as 3 aprova. Na v1 esta
    // pessoa reprovava sem ter o que fazer.
    const texto = techs.slice(0, 3).join(" ");
    const comN = (n: number) =>
      rodar(parsedBase({ sobre: texto }), {
        profileText: texto,
        skills: techs.slice(0, n).join(", "),
      });
    expect(corteDeCompetencias(22, 3).minimo).toBe(3);
    expect(aprovado(comN(2), "skills-cobertura")).toBe(false);
    expect(aprovado(comN(3), "skills-cobertura")).toBe(true);
  });

  it("REGUA V2: quem comprova ZERO nao ganha o check de graca", () => {
    // Sem a guarda, min(6, 0) = 0 e `0 >= 0` aprovaria: 27 das 107 ganhariam um
    // check essencial de 10 pontos por nao ter nada.
    expect(corteDeCompetencias(22, 0)).toEqual({ minimo: 0, alcancavel: false });
    const vazio = rodar(parsedBase({ headline: "Pessoa" }), {
      profileText: "Pessoa",
      skills: "",
    });
    expect(aprovado(vazio, "skills-cobertura")).toBe(false);
  });
});
