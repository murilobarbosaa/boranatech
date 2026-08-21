import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseLinkedinText } from "../../shared/linkedin/parse";
import {
  HEADLINE_MANUAL_MAX,
  headlineFinalDe,
} from "../../shared/linkedin/schema";
import { runLinkedinChecks, type LinkedinChecksInput } from "./linkedinChecks";

/**
 * As provas do campo de headline editavel (o "(b)").
 *
 * O que cada bloco existe para impedir esta escrito no bloco. O que ELES NAO
 * cobrem: a UI. O campo, o contador e a copy sao verificados a olho, e a
 * decisao de nao montar o `LinkedinAnalisar` inteiro num teste e a mesma do
 * `linkedinTierInvalido.test.ts`.
 */

const DIR = `${import.meta.dirname}/__fixtures__/linkedin`;

function baseInput(profileText: string): LinkedinChecksInput {
  return {
    parsed: parseLinkedinText(profileText),
    profileText,
    area: "backend",
    level: "pleno",
    mercado: "brasil",
    skills: "TypeScript, Node.js, PostgreSQL",
    foto: "sim",
    banner: "sim",
    openToWork: "nao",
    conexoes: "500-mais",
    atividade: "semanal",
  };
}

const FIXTURES = readdirSync(DIR)
  .filter((f) => f.endsWith(".txt"))
  .sort();

describe("headlineManual ausente nao move a nota", () => {
  // A garantia retroativa: as 185 linhas ja gravadas nao tem o campo, entao
  // `headlineFinalDe` tem de devolver exatamente `parsed.headline` e o
  // resultado inteiro tem de ser identico ao de antes do campo existir.
  //
  // Deep-equals do RESULTADO INTEIRO, e nao so da nota, de proposito: um campo
  // novo que mudasse `pendente` ou `notaIncompleta` sem mexer no score
  // passaria por uma comparacao de `score` e mudaria o que a interface afirma.
  it.each(FIXTURES)("%s: deep-equals com e sem a chave", (nome) => {
    const texto = readFileSync(`${DIR}/${nome}`, "utf8");
    const semChave = runLinkedinChecks(baseInput(texto));
    const comUndefined = runLinkedinChecks({
      ...baseInput(texto),
      headlineManual: undefined,
    });
    const comNull = runLinkedinChecks({
      ...baseInput(texto),
      headlineManual: null,
    });
    const comVazio = runLinkedinChecks({
      ...baseInput(texto),
      headlineManual: "   ",
    });

    expect(comUndefined).toEqual(semChave);
    expect(comNull).toEqual(semChave);
    // Vazio conta como ausente: quem apaga o campo pede a leitura de volta,
    // nao uma analise sobre string vazia.
    expect(comVazio).toEqual(semChave);
  });
});

describe("o pendente sai do TEXTO, nunca do ato de editar", () => {
  // Perfil cuja headline o parser le com assinatura de corte (termina em
  // virgula), entao `notaIncompleta` nasce true.
  const CORTADA = [
    "Contact",
    "exemplo@teste.com",
    "",
    "Top Skills",
    "TypeScript",
    "",
    "Joana Teste",
    "Desenvolvedora Back-end | Node.js, TypeScript,",
    "Sao Paulo, Brasil",
    "",
    "Experience",
    "Empresa Exemplo",
    "Desenvolvedora Back-end",
    "January 2023 - Present (2 years)",
    "Construiu APIs em Node.js e PostgreSQL com foco em performance.",
    "",
  ].join("\n");

  it("sem edicao, a leitura cortada mantem notaIncompleta true", () => {
    const r = runLinkedinChecks(baseInput(CORTADA));
    expect(r.notaIncompleta).toBe(true);
  });

  it("editada e limpa, notaIncompleta vira false SEM regra especial", () => {
    const r = runLinkedinChecks({
      ...baseInput(CORTADA),
      headlineManual: "Desenvolvedora Back-end | Node.js, TypeScript, PostgreSQL",
    });
    expect(r.notaIncompleta).toBe(false);
  });

  it("editada e AINDA cortada, notaIncompleta continua true", () => {
    // ESTA e a prova de que nao existe "editou, entao limpou". Se houvesse uma
    // regra olhando para o ATO de editar, este caso sairia `false` e a
    // interface afirmaria faixa sobre uma headline que continua truncada. O
    // que decide e o texto resultante, e ele ainda tem assinatura.
    const r = runLinkedinChecks({
      ...baseInput(CORTADA),
      headlineManual: "Desenvolvedora Back-end | Node.js, TypeScript, Postgre,",
    });
    expect(r.notaIncompleta).toBe(true);
  });
});

describe("headlineFinalDe: precedencia", () => {
  it("a digitada vence a do parser", () => {
    expect(headlineFinalDe("lida", "digitada")).toBe("digitada");
  });

  it("ausente, vazia e so-espaco caem na do parser", () => {
    expect(headlineFinalDe("lida", undefined)).toBe("lida");
    expect(headlineFinalDe("lida", null)).toBe("lida");
    expect(headlineFinalDe("lida", "")).toBe("lida");
    expect(headlineFinalDe("lida", "   ")).toBe("lida");
  });

  it("sem leitura e sem digitada devolve null, nao string vazia", () => {
    // `null` e "nao ha headline" e alimenta `headline-existe`. Uma string
    // vazia passaria por "existe" em qualquer teste de tipo e reprovaria no
    // check, que e a pior combinacao: o dado mente e o veredito acerta.
    expect(headlineFinalDe(null, undefined)).toBeNull();
  });

  it("o teto e o mesmo do clip do parser, nao o ideal do check", () => {
    // 250 e capacidade (`clip(..., 250)`); 220 e qualidade
    // (`headline-tamanho`). Trocar um pelo outro faria o campo recusar o valor
    // que o proprio parser produziu.
    expect(HEADLINE_MANUAL_MAX).toBe(250);
  });
});
