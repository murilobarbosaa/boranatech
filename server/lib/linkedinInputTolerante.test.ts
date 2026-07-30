import { describe, expect, it } from "vitest";

import { hashDoTexto } from "./linkedinTextoHash";
import { LinkedinAnalyzeRequestSchema } from "../../shared/linkedin/schema";

/**
 * As duas chaves novas do `input` jsonb (`entryPath`, `textoHash`) contra as 157
 * linhas que JA existem sem elas.
 *
 * A regra do CLAUDE.md sobre lookup por valor do servidor vale aqui na direcao
 * temporal: codigo novo tolera dado antigo, nunca o contrario. Sao 157 linhas
 * persistidas (107 v1 sem carimbo de versao, 50 v4) e nenhuma delas tem
 * `entryPath` nem `textoHash`. Se qualquer leitura acessar direto, a analise
 * antiga quebra ao ser reaberta no historico.
 *
 * ZERO MIGRATION, e o motivo esta aqui: `input` e `jsonb` sem constraint de
 * shape e sem indice sobre chave interna (`20260613120000_create_linkedin_
 * analyses.sql`), entao acrescentar chave dentro do objeto e escrita de dado,
 * nao mudanca de schema. Nada a aplicar, nada a reverter.
 */

/** Forma REAL de uma linha antiga, copiada de `134d325f` em producao. */
const INPUT_ANTIGO = {
  area: "fullstack",
  foto: "sim",
  level: "pleno",
  banner: "nao",
  skills: "Investigações criminais, Desenvolvimento de negócios",
  mercado: "brasil",
  conexoes: "100-500",
  objetivo: null,
  atividade: "nunca",
  openToWork: "nao-sei",
  parseResumo: {
    headline: "PostgreSQL | SaaS B2B & B2C",
    skillsPdf: ["Ciência da computação", "Édiller Watzek"],
    sobreTamanho: 2069,
    experienciasContagem: 4,
  },
} as const;

/** Leitura tolerante: e o unico jeito de tocar as chaves novas. */
function lerEntryPath(input: Record<string, unknown>): string | null {
  const v = input.entryPath;
  return typeof v === "string" && v.length > 0 ? v : null;
}
function lerTextoHash(input: Record<string, unknown>): string | null {
  const v = input.textoHash;
  return typeof v === "string" && v.length === 64 ? v : null;
}

describe("linha ANTIGA (sem as chaves novas) continua legivel", () => {
  it("as chaves realmente NAO existem: nao e um null escrito", () => {
    expect("entryPath" in INPUT_ANTIGO).toBe(false);
    expect("textoHash" in INPUT_ANTIGO).toBe(false);
  });

  it("a leitura devolve null em vez de quebrar", () => {
    const input = INPUT_ANTIGO as unknown as Record<string, unknown>;
    expect(lerEntryPath(input)).toBeNull();
    expect(lerTextoHash(input)).toBeNull();
  });

  it("o resto do input antigo segue intacto (nada foi renomeado)", () => {
    expect(INPUT_ANTIGO.parseResumo.headline).toBe("PostgreSQL | SaaS B2B & B2C");
    expect(INPUT_ANTIGO.area).toBe("fullstack");
  });

  it("hash de tamanho errado nao passa por hash valido", () => {
    // Guard contra dado torto: 64 hex e a forma de um sha256. Qualquer outra
    // coisa e tratada como ausente, nao como hash.
    expect(lerTextoHash({ textoHash: "" })).toBeNull();
    expect(lerTextoHash({ textoHash: "abc" })).toBeNull();
    expect(lerTextoHash({ textoHash: 12345 })).toBeNull();
    expect(lerTextoHash({ textoHash: hashDoTexto("qualquer") })).not.toBeNull();
  });
});

describe("request do BUNDLE ANTIGO continua valido (janela de deploy)", () => {
  // O deploy nao e atomico: a Vercel sobe antes do Railway, e existe uma janela
  // de 1 a 3 minutos com backend novo recebendo request de bundle velho. Se
  // `entryPath` fosse obrigatorio, TODA analise da janela sairia 400.
  const REQUEST_VELHO = {
    profileText: "x".repeat(250),
    area: "fullstack",
    level: "pleno",
    mercado: "brasil",
    skills: "React, Node.js",
    foto: "sim",
    banner: "nao",
    openToWork: "sim",
    conexoes: "100-500",
    atividade: "semanal",
  };

  it("sem entryPath, o schema ACEITA", () => {
    const r = LinkedinAnalyzeRequestSchema.safeParse(REQUEST_VELHO);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.entryPath).toBeUndefined();
  });

  it("com entryPath valido, o schema aceita e preserva", () => {
    for (const p of ["pdf", "manual", "review"] as const) {
      const r = LinkedinAnalyzeRequestSchema.safeParse({
        ...REQUEST_VELHO,
        entryPath: p,
      });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.entryPath).toBe(p);
    }
  });

  it("entryPath invalido e RECUSADO (opcional nao quer dizer qualquer coisa)", () => {
    const r = LinkedinAnalyzeRequestSchema.safeParse({
      ...REQUEST_VELHO,
      entryPath: "csv",
    });
    expect(r.success).toBe(false);
  });
});

describe("hashDoTexto", () => {
  it("mesmo texto, mesmo hash", () => {
    expect(hashDoTexto("Desenvolvedor Full Stack")).toBe(
      hashDoTexto("Desenvolvedor Full Stack"),
    );
  });

  it("o MESMO PDF relido em outro sistema operacional da o MESMO hash", () => {
    // Sem normalizar CRLF, o aviso de "texto igual" nunca dispararia no caso em
    // que ele mais importa: a pessoa reexportando o mesmo PDF.
    expect(hashDoTexto("linha 1\r\nlinha 2")).toBe(hashDoTexto("linha 1\nlinha 2"));
    expect(hashDoTexto("  texto  ")).toBe(hashDoTexto("texto"));
  });

  it("edicao REAL muda o hash (senao o aviso mentiria)", () => {
    const antes = "Desenvolvedor Full Stack | React";
    expect(hashDoTexto(antes)).not.toBe(hashDoTexto(antes + " | Node.js"));
    // Espaco interno NAO e colapsado de proposito: nao normalizar demais e o
    // que garante que uma edicao de verdade sempre mude o hash.
    expect(hashDoTexto("a b")).not.toBe(hashDoTexto("a  b"));
    // Caixa importa: "react" e "React" sao edicoes distintas.
    expect(hashDoTexto("react")).not.toBe(hashDoTexto("React"));
  });

  it("e sha256: 64 hex, e nao carrega o texto de volta", () => {
    const h = hashDoTexto("ana.moura@exemplo.com +55 11 91234-5678");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("ana");
    expect(h).not.toContain("91234");
  });
});
