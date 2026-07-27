import { describe, expect, it } from "vitest";

import { estadoDescricao, experienciasBlock } from "./linkedinAnalyze";
import type { LinkedinParsed } from "../../shared/linkedin/parse";

/**
 * O corte que decide se uma experiencia recebe bullets.
 *
 * Antes tinha dois estados (tem descricao / nao tem) e o limiar de 48 estava
 * justificado num numero contaminado pelo bug B.1. Agora sao tres, e a copy da
 * curta e diferente da copy da vazia: dizer "esta sem descricao" para quem
 * escreveu uma linha e falso, e a pessoa perde a confianca no relatorio.
 */

const exp = (descricao: string) => ({
  titulo: "Desenvolvedora Back-end",
  empresa: "Empresa Alfa",
  descricao,
});

const parsed = (descricoes: string[]): LinkedinParsed => ({
  headline: null,
  sobre: null,
  experiencias: descricoes.map(exp),
  skillsPdf: [],
  usable: true,
});

const A48 = "x".repeat(48);
const A47 = "x".repeat(47);

describe("estadoDescricao: zero, curto e suficiente sao tres coisas", () => {
  it("vazia so quando nao ha texto nenhum", () => {
    expect(estadoDescricao(exp(""))).toBe("vazia");
    expect(estadoDescricao(exp("   \n  "))).toBe("vazia");
  });

  it("curta e o vao entre 1 e 47, que o corpus nao tem mas o mundo tem", () => {
    expect(estadoDescricao(exp("x"))).toBe("curta");
    expect(estadoDescricao(exp(A47))).toBe("curta");
  });

  it("suficiente a partir de 48", () => {
    expect(estadoDescricao(exp(A48))).toBe("suficiente");
    // A menor descricao legitima das 6 fixtures, com 56 caracteres.
    expect(
      estadoDescricao(exp("Atendimento ao cliente e organização do estoque da loja.")),
    ).toBe("suficiente");
  });
});

describe("experienciasBlock: a marcacao que chega ao modelo", () => {
  it("vazia: marcada como sem descricao, sem transcrever nada", () => {
    const bloco = experienciasBlock(parsed([""]));
    expect(bloco).toContain("SEM DESCRIÇÃO PRÓPRIA NO PERFIL");
    expect(bloco).not.toContain("CURTA DEMAIS");
  });

  it("curta: marcada como curta E com o texto transcrito", () => {
    const bloco = experienciasBlock(parsed(["Atendi clientes na loja"]));
    expect(bloco).toContain("DESCRIÇÃO CURTA DEMAIS PARA REESCREVER");
    expect(bloco).toContain("Atendi clientes na loja");
    // A curta NAO pode ser anunciada como vazia: ela tem texto.
    expect(bloco).not.toContain("SEM DESCRIÇÃO PRÓPRIA NO PERFIL");
  });

  it("suficiente: o texto vai cru, sem marcacao nenhuma", () => {
    const bloco = experienciasBlock(parsed([A48]));
    expect(bloco).toContain(A48);
    expect(bloco).not.toContain("SEM DESCRIÇÃO PRÓPRIA NO PERFIL");
    expect(bloco).not.toContain("CURTA DEMAIS");
  });

  it("a empresa vai junto do cargo, atribuida ao bloco certo", () => {
    expect(experienciasBlock(parsed([A48]))).toContain(
      "Desenvolvedora Back-end (Empresa Alfa)",
    );
  });

  it("orcamento estourado: NENHUMA experiencia desaparece", () => {
    // O corte antigo era um slice no fim do texto, entao as experiencias mais
    // antigas sumiam inteiras e o modelo nao escrevia bullet para o que nao
    // viu (rodada 2, E.5). Agora o orcamento e repartido entre as descricoes.
    const muitas = parsed(
      Array.from({ length: 12 }, (_, i) => `Descricao ${i + 1}. ${"x".repeat(900)}`),
    );
    const bloco = experienciasBlock(muitas);
    for (let i = 1; i <= 12; i += 1) {
      expect(bloco).toContain(`${i}. Desenvolvedora Back-end (Empresa Alfa)`);
    }
    expect(bloco.length).toBeLessThanOrEqual(6000);
    // Cada descricao chega com pedaco proprio, nenhuma zerada.
    for (let i = 1; i <= 12; i += 1) {
      expect(bloco).toContain(`Descricao ${i}.`);
    }
    expect(bloco).toContain("(descrição cortada pelo limite do prompt)");
  });

  it("marcacao de vazia e de curta sobrevive inteira ao corte", () => {
    // Sao curtas e carregam INSTRUCAO. Cortar uma delas pela metade produziria
    // uma ordem truncada, que e pior que uma descricao truncada.
    const misto = parsed([
      "",
      "Atendi clientes na loja",
      ...Array.from({ length: 10 }, () => "y".repeat(900)),
    ]);
    const bloco = experienciasBlock(misto);
    expect(bloco).toContain(
      "(SEM DESCRIÇÃO PRÓPRIA NO PERFIL: não escreva bullets para esta experiência)",
    );
    expect(bloco).toContain("DESCRIÇÃO CURTA DEMAIS PARA REESCREVER");
    expect(bloco).toContain('"Atendi clientes na loja"');
    expect(bloco.length).toBeLessThanOrEqual(6000);
  });

  it("dentro do orcamento nao ha corte nenhum", () => {
    const bloco = experienciasBlock(parsed([A48, A48]));
    expect(bloco).not.toContain("cortada pelo limite");
  });

  it("empresa null nao vira parentese vazio", () => {
    const semEmpresa: LinkedinParsed = {
      ...parsed([A48]),
      experiencias: [{ titulo: "Cargo", empresa: null, descricao: A48 }],
    };
    expect(experienciasBlock(semEmpresa)).toContain("1. Cargo\n");
    expect(experienciasBlock(semEmpresa)).not.toContain("()");
  });
});
