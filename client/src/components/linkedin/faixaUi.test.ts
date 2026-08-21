import { describe, expect, it } from "vitest";

import {
  FAIXA_UI,
  FAIXA_WASH,
  faixaLabelOf,
  faixaUiOf,
  faixaWashOf,
} from "./faixaUi";
import { FAIXA_LABELS, LINKEDIN_FAIXAS } from "@shared/linkedin/schema";

// A faixa chega do servidor e do result jsonb persistido. Acesso direto ao mapa
// derruba a pagina inteira quando um valor novo aparece antes do deploy do
// front (regra "Lookups por valor do servidor" do CLAUDE.md).
describe("faixaUiOf / faixaWashOf", () => {
  it("resolve todas as faixas do catalogo para o valor do mapa", () => {
    for (const faixa of LINKEDIN_FAIXAS) {
      expect(faixaUiOf(faixa)).toBe(FAIXA_UI[faixa]);
      expect(faixaWashOf(faixa)).toBe(FAIXA_WASH[faixa]);
    }
  });

  it("devolve fallback neutro para faixa desconhecida, sem lancar", () => {
    const ui = faixaUiOf("faixa-que-ainda-nao-existe");
    expect(ui.cardBg).toBe("bg-slate-100");
    expect(ui.chipBg).toBe("bg-slate-300");
    expect(faixaWashOf("faixa-que-ainda-nao-existe")).toBe("from-slate-200/40");
  });

  it("nunca devolve undefined, nem para string vazia", () => {
    expect(faixaUiOf("").cardBg).toBeTruthy();
    expect(faixaWashOf("")).toBeTruthy();
  });
});

describe("faixaLabelOf", () => {
  it("resolve todas as faixas do catalogo para o rotulo do mapa", () => {
    for (const faixa of LINKEDIN_FAIXAS) {
      expect(faixaLabelOf(faixa)).toBe(FAIXA_LABELS[faixa]);
    }
  });

  it("devolve string, nunca undefined, para faixa desconhecida", () => {
    // O tipo ja diz `string`, mas o mapa cru devolvia `undefined` e o `{}` do
    // JSX escondia isso. A assercao e sobre o VALOR, nao sobre o tipo.
    expect(faixaLabelOf("faixa-que-ainda-nao-existe")).toBe("");
    expect(faixaLabelOf("")).toBe("");
    expect(typeof faixaLabelOf("qualquer")).toBe("string");
  });
});

describe("nenhum consumidor volta a ler o mapa direto", () => {
  it("o mapa cru DEVOLVE undefined: e por isso que o resolver existe", () => {
    // Trava a premissa. Se um dia `FAIXA_UI` ganhar um Proxy com default, ou
    // virar um Map com fallback, este teste quebra e avisa que o resolver pode
    // ter deixado de ser necessario. Sem ele, "o resolver protege" e afirmacao
    // sobre um comportamento que ninguem verificou.
    const desconhecida = "faixa-que-ainda-nao-existe" as never;
    expect(FAIXA_UI[desconhecida]).toBeUndefined();
    expect(FAIXA_LABELS[desconhecida]).toBeUndefined();
    expect(FAIXA_WASH[desconhecida]).toBeUndefined();
  });

  it("acesso direto ao FAIXA_UI seguido de .chipBg LANCA (a forma do incidente)", () => {
    // Reproduz o modo de falha que o resolver evita, para o comentario nao ser
    // a unica coisa que descreve o dano. `STATUS_META[item.status].label` no
    // admin era exatamente isto.
    // `as never` daria erro de tipo ao acessar `.chipBg` (o TS sabe que nao
    // existe). O ponto do teste e o comportamento em RUNTIME, que e onde o
    // incidente acontece: o valor chega do servidor e o tipo nao alcanca.
    const mapa = FAIXA_UI as Record<string, { chipBg: string }>;
    expect(() => mapa["faixa-que-ainda-nao-existe"].chipBg).toThrow();
    expect(() => faixaUiOf("faixa-que-ainda-nao-existe").chipBg).not.toThrow();
  });
});
