import { describe, expect, it } from "vitest";

import { buildUserPrompt } from "./linkedinAnalyze";
import { runLinkedinChecks } from "./linkedinChecks";
import { parseLinkedinText } from "../../shared/linkedin/parse";
import {
  QUALITATIVE_VERSION,
  TIER_WEIGHTS,
  computeLinkedinScore,
  type LinkedinAnalyzeRequest,
  type LinkedinCheckResult,
} from "../../shared/linkedin/schema";

/**
 * Limiares que a varredura de mutação da Fase 1B-bis encontrou SEM cobertura:
 * mudar o número não quebrava teste nenhum. Cada bloco aqui existe para que a
 * próxima mudança de valor seja deliberada, não silenciosa.
 *
 * Precedente: o limiar de candidata a headline (6 caracteres) era um destes, e
 * foi ele que truncou "Node" e produziu a crítica falsa sobre a headline.
 */

describe("TIER_WEIGHTS chegam na nota", () => {
  const check = (
    tier: LinkedinCheckResult["tier"],
    aprovado: boolean,
  ): LinkedinCheckResult =>
    ({ id: `x-${tier}-${aprovado}`, label: "", tier, category: "headline", fonte: "pdf", aprovado, detail: "" }) as LinkedinCheckResult;

  it("os tres pesos sao 10, 6 e 3", () => {
    expect(TIER_WEIGHTS).toEqual({ essencial: 10, importante: 6, opcional: 3 });
  });

  it("cada peso e observavel na nota, isolado dos outros", () => {
    // essencial aprovado contra opcional reprovado: 10 de 13.
    expect(computeLinkedinScore([check("essencial", true), check("opcional", false)]).score).toBe(77);
    // importante aprovado contra opcional reprovado: 6 de 9.
    expect(computeLinkedinScore([check("importante", true), check("opcional", false)]).score).toBe(67);
    // opcional aprovado contra essencial reprovado: 3 de 13.
    expect(computeLinkedinScore([check("opcional", true), check("essencial", false)]).score).toBe(23);
  });
});

describe("QUALITATIVE_VERSION", () => {
  it("esta em 3, e mudar isso e ato deliberado", () => {
    // Irmao do guard de DETERMINISTIC_VERSION em deltaComparavel.test.ts. Sem
    // ele, um bump ou um rollback do contrato da IA passava sem ninguem ver.
    expect(QUALITATIVE_VERSION).toBe(3);
  });
});

describe("preambulo sem cabecalho de secao: janela de 20 linhas", () => {
  const enche = (n: number) =>
    Array.from({ length: n }, (_, i) => `Linha neutra numero ${i + 1}`).join("\n");

  it("headline dentro das 20 primeiras linhas e detectada", () => {
    const texto = `${enche(5)}\nDesenvolvedora Full-stack | React | Node\n${enche(5)}`;
    expect(parseLinkedinText(texto).headline).toBe(
      "Desenvolvedora Full-stack | React | Node",
    );
  });

  it("headline DEPOIS da linha 20, sem secao nenhuma, nao e detectada", () => {
    // Sem cabecalho de secao reconhecido o parser nao tem onde ancorar, entao
    // olha so o comeco do arquivo. Preferir null a varrer o documento inteiro
    // e a decisao: linha longa qualquer no meio do PDF nao vira headline.
    const texto = `${enche(25)}\nDesenvolvedora Full-stack | React | Node`;
    expect(parseLinkedinText(texto).headline).toBeNull();
  });
});

describe("SOBRE_LIMIT: o Sobre entra truncado no prompt", () => {
  const request = (profileText: string): LinkedinAnalyzeRequest =>
    ({
      profileText,
      area: "fullstack",
      level: "pleno",
      mercado: "brasil",
      skills: "React, Node.js",
      foto: "sim",
      banner: "sim",
      openToWork: "sim",
      conexoes: "500-mais",
      atividade: "semanal",
    }) as LinkedinAnalyzeRequest;

  const prompt = (sobre: string) => {
    const texto = `Summary\n${sobre}\nExperience\nEmpresa Alfa\nDesenvolvedora Back-end\njaneiro de 2022 - Present\n3 anos\nConstruí a API de pagamentos em Node.js e reduzi a latência pela metade.\n`;
    const parsed = parseLinkedinText(texto);
    const deterministic = runLinkedinChecks({
      parsed,
      level: "pleno",
      profileText: texto,
      area: "fullstack",
      mercado: "brasil",
      skills: "React, Node.js",
      foto: "sim",
      banner: "sim",
      openToWork: "sim",
      conexoes: "500-mais",
      atividade: "semanal",
    });
    return buildUserPrompt(request(texto), parsed, deterministic);
  };

  it("Sobre abaixo do limite vai inteiro, sem marca de truncamento", () => {
    const sobre = `Sou desenvolvedora full-stack. ${"a".repeat(2000)}`;
    const p = prompt(sobre);
    expect(p).toContain("a".repeat(2000));
    expect(p).not.toContain("texto truncado em 3000 caracteres");
  });

  it("Sobre acima do limite e cortado em 3000 e a marca aparece", () => {
    const sobre = `Sou desenvolvedora full-stack. ${"a".repeat(4000)}`;
    const p = prompt(sobre);
    expect(p).toContain("... (texto truncado em 3000 caracteres)");
    // O corte e no limite, nao no tamanho original.
    expect(p).not.toContain("a".repeat(3100));
  });
});
