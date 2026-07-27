import { describe, expect, it } from "vitest";

import { runLinkedinChecks } from "./linkedinChecks";
import { keyTechnologiesForArea } from "./skillNormalize";
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

  it("cobertura-keywords-area: 10 de 22 reprova, 11 de 22 aprova", () => {
    // 10/22 = 0,4545 e 11/22 = 0,5000. A fronteira 0,5 fica presa nesse par.
    expect(aprovado(comNTechs(10), "cobertura-keywords-area")).toBe(false);
    expect(aprovado(comNTechs(11), "cobertura-keywords-area")).toBe(true);
  });

  it("cobertura-keywords-otima: 16 de 22 reprova, 17 de 22 aprova", () => {
    // 16/22 = 0,7273 e 17/22 = 0,7727. A fronteira 0,75 fica presa nesse par.
    expect(aprovado(comNTechs(16), "cobertura-keywords-otima")).toBe(false);
    expect(aprovado(comNTechs(17), "cobertura-keywords-otima")).toBe(true);
  });

  it("cobertura-keywords-otima em backend: 0,75 e atingivel EXATO, e a fronteira prende por cima", () => {
    // backend tem 64 tecnologias-chave, degrau 1/64 = 0,0156, e 48/64 = 0,7500
    // cravado. Com o valor exato na mao, subir o limiar para 0,76 reprova e o
    // teste quebra. DESCER para 0,74 continua inobservavel em qualquer area:
    // exigiria uma razao entre 47/64 = 0,7344 e 48/64 = 0,75, e nao existe.
    const backend = keyTechnologiesForArea("backend");
    expect(backend).toHaveLength(64);
    const comN = (n: number) => {
      const texto = backend.slice(0, n).join(" ");
      return runLinkedinChecks({
        parsed: parsedBase({ sobre: texto }),
        profileText: texto,
        area: "backend",
        mercado: "brasil",
        skills: "",
        foto: "sim",
        banner: "sim",
        openToWork: "sim",
        conexoes: "500-mais",
        atividade: "semanal",
      });
    };
    expect(aprovado(comN(47), "cobertura-keywords-otima")).toBe(false);
    expect(aprovado(comN(48), "cobertura-keywords-otima")).toBe(true);
  });

  it("skills-cobertura: 10 coladas reprova, 11 coladas aprova", () => {
    const comNColadas = (n: number) =>
      rodar(parsedBase(), { skills: techs.slice(0, n).join(", ") });
    expect(aprovado(comNColadas(10), "skills-cobertura")).toBe(false);
    expect(aprovado(comNColadas(11), "skills-cobertura")).toBe(true);
  });
});
