import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { decidirDelta, versaoDe, type EntradaDelta } from "./deltaFunil";

/**
 * O funil precisa ser o ÚNICO caminho, e é isso que o primeiro bloco garante.
 *
 * História: `setScoreDelta` existia em dois lugares e cada um carregava as suas
 * guardas. A supressão por versão estava nos dois; a por autodeclaração entrou
 * só num, e um teste da função de supressão nunca pegaria, porque testa a
 * função e não o call site. O mesmo molde de `aiUsageTool.test.ts`: enumerar da
 * fonte, não de lista.
 */

const PAGINA = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "client",
    "src",
    "pages",
    "LinkedinAnalisar.tsx",
  ),
  "utf8",
);

describe("funil unico: nenhum call site decide por conta propria", () => {
  const chamadas = Array.from(
    PAGINA.matchAll(/setScoreDelta\(\s*([^)]*)/g),
    (m) => m[1].trim(),
  );

  it("existem call sites para auditar", () => {
    expect(chamadas.length).toBeGreaterThanOrEqual(2);
  });

  it("todo setScoreDelta recebe o veredito do funil OU zera", () => {
    // Duas formas permitidas: `v.delta` (dentro do aplicador) e `null` (reset).
    // Qualquer outra coisa e um call site decidindo sozinho, que e o defeito.
    for (const arg of chamadas) {
      expect(
        arg === "v.delta" || arg === "null",
        `setScoreDelta(${arg.slice(0, 60)}) nao passa pelo funil`,
      ).toBe(true);
    }
  });

  it("setReguaMudou segue a mesma regra", () => {
    const regua = Array.from(
      PAGINA.matchAll(/setReguaMudou\(\s*([^)]*)/g),
      (m) => m[1].trim(),
    );
    expect(regua.length).toBeGreaterThanOrEqual(2);
    for (const arg of regua) {
      expect(
        arg === "v.reguaMudou" || arg === "false",
        `setReguaMudou(${arg.slice(0, 60)}) nao passa pelo funil`,
      ).toBe(true);
    }
  });

  it("os DOIS caminhos que mostram delta chamam decidirDelta", () => {
    // Analise nova e abrir do historico. Se um deles sumir, o outro fica sem
    // par e este numero cai.
    expect(Array.from(PAGINA.matchAll(/decidirDelta\(\{/g))).toHaveLength(2);
    expect(Array.from(PAGINA.matchAll(/aplicarDelta\(/g)).length).toBe(3);
  });
});

const base: EntradaDelta = {
  notaAnterior: 50,
  versaoAnterior: 4,
  checksAnteriores: [{ id: "sobre-cta", category: "sobre", aprovado: false }],
  notaAtual: 60,
  versaoAtual: 4,
  checksAtuais: [{ id: "sobre-cta", category: "sobre", aprovado: true }],
};

describe("decidirDelta: as supressoes", () => {
  it("melhoria real mostra delta", () => {
    const v = decidirDelta(base);
    expect(v.delta).toEqual({ from: 50, to: 60 });
    expect(v.motivo).toBe("delta");
    expect(v.reguaMudou).toBe(false);
  });

  it("CENARIO 1: v1 contra v4 nao mostra delta nem celebracao", () => {
    // O caso dos 107 no primeiro acesso pos-deploy. `versaoAnterior` ausente e
    // a linha legada real: o campo nao existe, nao e 1 escrito.
    const v = decidirDelta({
      ...base,
      notaAnterior: 45,
      versaoAnterior: undefined,
      notaAtual: 60,
    });
    expect(v.delta).toBeNull();
    expect(v.reguaMudou).toBe(true);
    expect(v.motivo).toBe("regua-mudou");
  });

  it("CENARIO 2: marcar um sinal e reanalisar nao mostra delta nem celebracao", () => {
    const v = decidirDelta({
      notaAnterior: 50,
      versaoAnterior: 4,
      checksAnteriores: [
        { id: "sobre-cta", category: "sobre", aprovado: true },
        { id: "banner-personalizado", category: "sinais", aprovado: false },
      ],
      notaAtual: 53,
      versaoAtual: 4,
      checksAtuais: [
        { id: "sobre-cta", category: "sobre", aprovado: true },
        { id: "banner-personalizado", category: "sinais", aprovado: true },
      ],
    });
    expect(v.delta).toBeNull();
    expect(v.reguaMudou).toBe(false);
    expect(v.motivo).toBe("so-autodeclaracao");
  });

  it("melhoria real JUNTO com autodeclaracao continua mostrando delta", () => {
    const v = decidirDelta({
      ...base,
      checksAnteriores: [
        { id: "sobre-cta", category: "sobre", aprovado: false },
        { id: "banner-personalizado", category: "sinais", aprovado: false },
      ],
      checksAtuais: [
        { id: "sobre-cta", category: "sobre", aprovado: true },
        { id: "banner-personalizado", category: "sinais", aprovado: true },
      ],
    });
    expect(v.motivo).toBe("delta");
  });

  it("sem analise anterior nao ha delta", () => {
    expect(decidirDelta({ ...base, notaAnterior: null }).motivo).toBe(
      "sem-anterior",
    );
  });

  it("nota igual nao vira banner nem seta", () => {
    expect(decidirDelta({ ...base, notaAtual: 50 }).motivo).toBe("nota-igual");
  });

  it("analise antiga SEM o campo checks nao quebra: cai na regra de nota", () => {
    const v = decidirDelta({ ...base, checksAnteriores: undefined });
    expect(v.delta).toEqual({ from: 50, to: 60 });
  });

  it("versaoDe trata a linha legada (campo ausente) como 1", () => {
    expect(versaoDe(undefined)).toBe(1);
    expect(versaoDe(null)).toBe(1);
    expect(versaoDe(4)).toBe(4);
  });
});
