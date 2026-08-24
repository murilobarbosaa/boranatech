import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ONBOARDING_REGISTRY } from "./registry";

// Amarra `docs/onboarding-rotas-pendentes.md` ao registry.
//
// O documento e uma lista escrita a mao, ou seja, a classe de artefato que esta
// base ja viu envelhecer em silencio varias vezes. Sozinho ele viraria, no
// primeiro lote, "uma lista que parece completa". Aqui ele e comparado com a
// fonte nos DOIS sentidos: rota pendente que nao esta no doc derruba o teste, e
// rota no doc que deixou de ser pendente tambem.
//
// Efeito pratico: classificar uma rota de verdade obriga a tirar ela do doc no
// mesmo commit.

const DOC = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "docs",
  "onboarding-rotas-pendentes.md",
);

const INICIO = "<!-- ROTAS-PENDENTES:INICIO -->";
const FIM = "<!-- ROTAS-PENDENTES:FIM -->";

function rotasDoDoc(): string[] {
  const texto = readFileSync(DOC, "utf8");
  const i = texto.indexOf(INICIO);
  const j = texto.indexOf(FIM);
  // Delimitador explicito, e nao heuristica de secao: sem os marcadores o teste
  // aborta em vez de casar um trecho menor e reportar sucesso sobre ele.
  if (i < 0 || j < 0 || j < i) {
    throw new Error("marcadores ROTAS-PENDENTES nao encontrados no doc");
  }
  const bloco = texto.slice(i + INICIO.length, j);

  // Contagem AMPLA (itens de lista) contra leitura ESTRUTURADA (a rota entre
  // crases). Divergiu, o parser encolheu.
  const itens = bloco.match(/^- /gm) ?? [];
  const rotas = Array.from(bloco.matchAll(/^- `(\/[^`]*)`$/gm), (m) => m[1]);
  expect(rotas.length, "item de lista no bloco sem rota entre crases").toBe(
    itens.length,
  );

  return rotas;
}

const pendentesNoRegistry = Object.entries(ONBOARDING_REGISTRY)
  .filter(([, entry]) => entry.type === "pendente")
  .map(([rota]) => rota);

describe("doc das rotas pendentes x registry", () => {
  const doDoc = rotasDoDoc();

  it("afirma o total", () => {
    expect(pendentesNoRegistry).toHaveLength(26);
    expect(doDoc).toHaveLength(26);
  });

  it("nao repete rota", () => {
    expect(new Set(doDoc).size).toBe(doDoc.length);
  });

  it("toda rota pendente esta classificada no doc, e vice-versa", () => {
    expect(new Set(doDoc)).toEqual(new Set(pendentesNoRegistry));
  });

  it("nenhuma rota do doc ja tem onboarding portado", () => {
    // Rede contra o esquecimento inverso: portar o conteudo e deixar a rota no
    // doc faria o documento afirmar que falta algo que ja existe.
    const jaPortadas = doDoc.filter(
      (rota) => ONBOARDING_REGISTRY[rota]?.type === "onboarding",
    );
    expect(jaPortadas).toEqual([]);
  });
});
