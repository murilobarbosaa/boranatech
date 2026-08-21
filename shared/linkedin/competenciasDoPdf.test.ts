import { describe, expect, it } from "vitest";

import {
  COMPETENCIAS_NO_EXPORT,
  competenciasDoPdf,
} from "./competenciasDoPdf";

/**
 * As duas fixtures de identidade abaixo sao linhas REAIS de
 * `linkedin_analyses`, com nome e cidade trocados. A forma foi preservada
 * exatamente: a posicao do nome, a headline em pedacos, a cidade, o estado e o
 * pais no fim. Trocar o conteudo e manter a forma e o ponto: o filtro e
 * posicional, entao o conteudo nao muda o veredito, e a fixture prova isso ao
 * continuar passando com nomes inventados.
 */

// Linha de 2026-07-13, 12 itens: 3 competencias reais + premio + headline em
// dois pedacos + nome + cidade + estado + pais.
const VAZAMENTO_COMPLETO = [
  "TypeScript",
  "Git",
  "GitLab",
  "Honors-Awards",
  "FinView - Projeto Destaque - 2°",
  "semestre 2025",
  "Mariana Prado",
  "Software Engineer",
  "Frontend Developer",
  "Belo Horizonte",
  "Minas Gerais",
  "Brasil",
];

// Linha de 2026-07-14, 9 itens: 3 competencias reais + nome + headline + frase
// de headline + cidade + pais.
const VAZAMENTO_COM_FRASE = [
  "Prisma ORM",
  "ESLint",
  "Tailwind CSS",
  "Rafael Moura",
  "Desenvolvedor Full Stack",
  "React • Node.js • TypeScript • JavaScript",
  "Construindo aplicações web modernas e escaláveis",
  "São Paulo",
  "Brasil",
];

describe("competenciasDoPdf", () => {
  it("deixa intacta a lista normal do export", () => {
    const normal = ["TypeScript", "Git", "GitLab"];
    const r = competenciasDoPdf(normal);
    expect(r.aceitas).toEqual(normal);
    expect(r.descartadas).toEqual([]);
  });

  it("PROVA 1: tira nome, cidade, estado e pais do vazamento completo", () => {
    const r = competenciasDoPdf(VAZAMENTO_COMPLETO);

    expect(r.aceitas).toEqual(["TypeScript", "Git", "GitLab"]);
    const descartados = r.descartadas.map((d) => d.valor);
    expect(descartados).toContain("Mariana Prado");
    expect(descartados).toContain("Belo Horizonte");
    expect(descartados).toContain("Minas Gerais");
    expect(descartados).toContain("Brasil");
    // A headline em pedacos tambem nao e competencia.
    expect(descartados).toContain("Software Engineer");
    expect(descartados).toContain("Frontend Developer");

    // O que importa de verdade: nada de identidade sobra no que vai ao form.
    expect(r.aceitas.join(" ")).not.toContain("Mariana");
    expect(r.aceitas.join(" ")).not.toContain("Belo Horizonte");
  });

  it("PROVA 1b: tira nome, headline e cidade do vazamento com frase", () => {
    const r = competenciasDoPdf(VAZAMENTO_COM_FRASE);

    expect(r.aceitas).toEqual(["Prisma ORM", "ESLint", "Tailwind CSS"]);
    const descartados = r.descartadas.map((d) => d.valor);
    expect(descartados).toContain("Rafael Moura");
    expect(descartados).toContain("São Paulo");
    expect(descartados).toContain(
      "Construindo aplicações web modernas e escaláveis",
    );
    expect(r.aceitas.join(" ")).not.toContain("Rafael");
  });

  it("PROVA 2: competencia legitima com nome de pessoa dentro NAO e descartada", () => {
    // O criterio lexical descartado errava exatamente aqui. Nenhum destes tem
    // como ser cortado, porque o filtro nao le o texto.
    const comCaraDeNome = ["Kanban", "Bootstrap", "Ruby on Rails"];
    const r = competenciasDoPdf(comCaraDeNome);
    expect(r.aceitas).toEqual(comCaraDeNome);
    expect(r.descartadas).toEqual([]);
  });

  it("PROVA 2b: nem mesmo um nome proprio inteiro cai, se estiver nas 3 primeiras", () => {
    // Deliberadamente desconfortavel, e e a propriedade que se quer: o filtro
    // e POSICIONAL. Se o vazamento um dia entrar nas tres primeiras posicoes,
    // este teto nao pega, e o conserto tera que ser no parser. Fica escrito
    // para ninguem confundir o teto com uma deteccao de nome.
    const r = competenciasDoPdf(["Joana Silva", "Git", "Docker"]);
    expect(r.aceitas).toEqual(["Joana Silva", "Git", "Docker"]);
    expect(r.descartadas).toEqual([]);
  });

  it("corta a competencia quebrada de linha pelo mesmo teto (causa A)", () => {
    const r = competenciasDoPdf([
      "AI Agents",
      "Vector Databases",
      "Retrieval-Augmented Generation",
      "(RAG)",
    ]);
    expect(r.aceitas).toHaveLength(COMPETENCIAS_NO_EXPORT);
    expect(r.descartadas.map((d) => d.valor)).toEqual(["(RAG)"]);
  });

  it("o descarte é rastreável: diz o valor e o motivo", () => {
    const r = competenciasDoPdf(["a", "b", "c", "d"]);
    expect(r.descartadas).toHaveLength(1);
    expect(r.descartadas[0].valor).toBe("d");
    expect(r.descartadas[0].motivo).toContain("posicao 4");
  });

  it("tolera null, undefined, vazio e entrada só com espaço", () => {
    expect(competenciasDoPdf(null).aceitas).toEqual([]);
    expect(competenciasDoPdf(undefined).aceitas).toEqual([]);
    expect(competenciasDoPdf([]).aceitas).toEqual([]);
    expect(competenciasDoPdf(["  ", "Git"]).aceitas).toEqual(["Git"]);
  });
});
