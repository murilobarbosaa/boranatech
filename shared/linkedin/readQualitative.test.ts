import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { readQualitative } from "./readQualitative";
import { QUALITATIVE_VERSION } from "./schema";

/**
 * A prova de que as 107 análises persistidas continuam abrindo depois da
 * separação de skillsSugeridas em dois campos. A fixture NAO e sintetica: e a
 * linha real `cf02e168-...` de linkedin_analyses, com PII trocada e o resto
 * byte a byte como o servidor gravou.
 */
const LEGADO = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "server",
      "lib",
      "__fixtures__",
      "linkedin",
      "result-legado-v1.json",
    ),
    "utf8",
  ),
) as { qualitative: unknown; qualitativeVersion?: number };

describe("readQualitative: linha legada real (v1)", () => {
  it("a fixture e mesmo do formato antigo", () => {
    expect(LEGADO.qualitativeVersion).toBeUndefined();
    expect(Object.keys(LEGADO.qualitative as object)).toContain(
      "skillsSugeridas",
    );
    expect(Object.keys(LEGADO.qualitative as object)).not.toContain(
      "skillsParaAdicionarAgora",
    );
  });

  it("abre sem lancar e detecta versao 1", () => {
    const view = readQualitative(LEGADO.qualitative, LEGADO.qualitativeVersion);
    expect(view.version).toBe(1);
  });

  it("preserva todo o conteudo que a UI renderiza", () => {
    const view = readQualitative(LEGADO.qualitative, LEGADO.qualitativeVersion);
    expect(view.resumo.length).toBeGreaterThan(0);
    expect(view.pontosFortes.length).toBeGreaterThan(0);
    expect(view.pontosFracos.length).toBeGreaterThan(0);
    expect(view.melhorias.length).toBeGreaterThan(0);
    expect(view.headlines).toHaveLength(3);
    expect(view.sobreReescrito.length).toBeGreaterThan(0);
    expect(view.bulletsReescritos.length).toBeGreaterThan(0);
    expect(view.modeloMensagemRecrutador.length).toBeGreaterThan(0);
    expect(view.proximoPasso.length).toBeGreaterThan(0);
    expect(view.camposAusentes).toEqual([]);
  });

  it("a lista legada vira ESTUDO, nunca 'adicionar agora'", () => {
    const view = readQualitative(LEGADO.qualitative, LEGADO.qualitativeVersion);
    // skillsSugeridas v1 era derivado das FALTANTES: no perfil real ele contem
    // Ruby e Elixir para um dev JavaScript. Renderizar isso como "adicione as
    // suas competencias" repetiria o conselho ruim a cada abertura. A lista de
    // "adicionar agora" nao vem daqui desde a v3: e calculada em deterministic.
    expect("skillsParaAdicionarAgora" in view).toBe(false);
    expect(view.skillsParaEstudar).toContain("Ruby");
    expect(view.skillsParaEstudar).toContain("Elixir");
    expect(view.skillsParaEstudar).toEqual(
      (LEGADO.qualitative as { skillsSugeridas: string[] }).skillsSugeridas,
    );
  });
});

describe("readQualitative: formato atual e entradas quebradas", () => {
  const atual = {
    resumo: "r",
    pontosFortes: ["a"],
    pontosFracos: ["b"],
    melhorias: [{ prioridade: "alta", titulo: "t", comoFazer: "c" }],
    proximoPasso: "p",
    headlines: ["h1", "h2", "h3"],
    sobreReescrito: "s",
    bulletsReescritos: [{ contexto: "ctx", bullets: ["x"] }],
    skillsParaEstudar: ["Go"],
    modeloMensagemRecrutador: "m",
  };

  it("le o formato novo sem tocar nas listas", () => {
    const view = readQualitative(atual, QUALITATIVE_VERSION);
    expect(view.version).toBe(QUALITATIVE_VERSION);
    expect(view.skillsParaEstudar).toEqual(["Go"]);
    expect(view.camposAusentes).toEqual([]);
  });

  it("infere a versao pelos campos quando o carimbo nao veio", () => {
    expect(readQualitative(atual).version).toBe(QUALITATIVE_VERSION);
  });

  it("render parcial: campo faltando vira neutro e entra em camposAusentes", () => {
    const view = readQualitative({ resumo: "so isto" });
    expect(view.resumo).toBe("so isto");
    expect(view.headlines).toEqual([]);
    expect(view.melhorias).toEqual([]);
    expect(view.camposAusentes).toContain("headlines");
    expect(view.camposAusentes).toContain("melhorias");
    expect(view.camposAusentes).not.toContain("resumo");
  });

  it("NUNCA lanca, nem com lixo total", () => {
    for (const lixo of [null, undefined, 42, "texto", [], { melhorias: "nao e array" }]) {
      expect(() => readQualitative(lixo)).not.toThrow();
      expect(readQualitative(lixo).melhorias).toEqual([]);
    }
  });
});
