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

describe("Fase 4 (v5): mudanca de LEITURA suprime delta e celebracao", () => {
  // A regua nao mudou entre a v4 e a v5. O que mudou foi o conteudo que o
  // parser entrega a ela: a headline que vinha cortada ao meio chega inteira.
  // O efeito no usuario e identico ao de uma mudanca de regua (a nota do mesmo
  // perfil se move sozinha), entao a supressao tem que ser a mesma. Este teste
  // roda pelo funil de verdade, `decidirDelta`, e nao pela copia local da regra
  // que vive em deltaComparavel.test.ts.
  const CHECKS = [
    { id: "headline-cargo-alvo", category: "headline", aprovado: true },
    { id: "sobre-stack", category: "sobre", aprovado: true },
  ] as const;

  function entrada(versaoAnterior: number | null, versaoAtual: number): EntradaDelta {
    return {
      notaAnterior: 51,
      versaoAnterior,
      checksAnteriores: [
        { id: "headline-cargo-alvo", category: "headline", aprovado: false },
        { id: "sobre-stack", category: "sobre", aprovado: true },
      ],
      notaAtual: 72,
      versaoAtual,
      checksAtuais: [...CHECKS],
    };
  }

  it("v4 -> v5 nao mostra delta e liga o aviso de nao-comparavel", () => {
    const v = decidirDelta(entrada(4, 5));
    expect(v.delta).toBeNull();
    expect(v.reguaMudou).toBe(true);
    expect(v.motivo).toBe("regua-mudou");
  });

  it("linha legada sem carimbo (v1) -> v5 tambem e suprimida", () => {
    const v = decidirDelta(entrada(null, 5));
    expect(versaoDe(null)).toBe(1);
    expect(v.delta).toBeNull();
    expect(v.reguaMudou).toBe(true);
  });

  it("v5 -> v5 volta a comparar: e a reanalise honesta depois do deploy", () => {
    const v = decidirDelta(entrada(5, 5));
    expect(v.delta).toEqual({ from: 51, to: 72 });
    expect(v.reguaMudou).toBe(false);
    expect(v.motivo).toBe("delta");
  });
});

describe("supressao por nota incompleta", () => {
  const CHECK = { id: "headline-existe", category: "headline", aprovado: true };
  // `notaAnterior !== notaAtual` e checks iguais: sem a supressao nova, este
  // conjunto produz delta. E o que faz o teste medir a supressao, e nao um
  // caminho que ja estava suprimido por outro motivo.
  const base: EntradaDelta = {
    notaAnterior: 70,
    versaoAnterior: 7,
    checksAnteriores: [CHECK],
    notaAtual: 74,
    versaoAtual: 7,
    checksAtuais: [CHECK],
  };

  it("suprime quando a ATUAL esta incompleta", () => {
    const v = decidirDelta({ ...base, incompletaAtual: true });
    expect(v.delta).toBeNull();
    expect(v.motivo).toBe("nota-incompleta");
  });

  it("suprime quando a ANTERIOR esta incompleta", () => {
    const v = decidirDelta({ ...base, incompletaAnterior: true });
    expect(v.delta).toBeNull();
    expect(v.motivo).toBe("nota-incompleta");
  });

  it("suprime quando as DUAS estao incompletas", () => {
    const v = decidirDelta({
      ...base,
      incompletaAnterior: true,
      incompletaAtual: true,
    });
    expect(v.delta).toBeNull();
  });

  it("NAO suprime quando nenhuma esta, nem com os campos ausentes", () => {
    expect(decidirDelta(base).delta).not.toBeNull();
    expect(
      decidirDelta({ ...base, incompletaAnterior: false, incompletaAtual: false })
        .delta,
    ).not.toBeNull();
  });

  it("ausencia vale FALSE, nao true: linha antiga nao vira suprimida", () => {
    // As 170 linhas gravadas antes da v7 nao tem o campo. Se ausencia valesse
    // `true`, o delta sumiria para todo mundo com historico.
    const v = decidirDelta({ ...base, incompletaAtual: undefined });
    expect(v.delta).not.toBeNull();
  });

  it("`delta: null` desliga a celebracao: o confete morre de graca", () => {
    // O contrato esta no doc de `VeredictoDelta` ("Null tambem desliga a
    // celebracao"). Este teste trava a consequencia: nao existe segundo lugar
    // onde alguem precise lembrar de suprimir o confete.
    const v = decidirDelta({ ...base, incompletaAtual: true });
    expect(v.delta).toBeNull();
    expect(v.reguaMudou).toBe(false);
  });
});
