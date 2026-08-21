import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

/**
 * O FUNIL DO ANALISADOR COBRE TODOS OS DESFECHOS, nos dois eixos?
 *
 * A pergunta que originou o lote ("quantas pessoas batem em PDF escaneado ou
 * com senha") so tem resposta se NENHUM desfecho ficar sem evento. Um estado
 * novo de entrada sem instrumentacao nao aparece como buraco no painel: ele
 * aparece como ausencia, indistinguivel de "ninguem passou por ali".
 *
 * Por isso os dois eixos sao verificados por IGUALDADE DE CONJUNTO contra a
 * fonte, nunca contra uma lista escrita a mao aqui. Lista a mao e o caso
 * degenerado do parser que sub-casa em silencio, e ela envelheceria no primeiro
 * estado novo que alguem esquecesse de copiar.
 */

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({ promise: Promise.reject(new Error("nao usado")) }),
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "" }));

import { PDF_ERROR_CODES } from "./pdfExtract";
import {
  DESFECHOS_EXTRACAO_EXTRAS,
  LINKEDIN_DESFECHOS_ANALISE,
  classificarDesfechoDeErro,
  type DesfechoAnalise,
  type DesfechoExtracao,
} from "./analytics";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/**
 * EIXO 1: extracao.
 *
 * `DesfechoExtracao` e uma uniao de TIPO, que nao existe em runtime. Para
 * afirmar o conjunto sem redigitar nada, cada membro esperado e escrito como um
 * valor TIPADO como `DesfechoExtracao`: se um deles deixar de pertencer a
 * uniao, o `pnpm check` reprova antes de o teste rodar. A igualdade de conjunto
 * abaixo cobre a outra direcao (membro da fonte que ninguem instrumentou).
 */
const EXTRACAO_ESPERADOS: DesfechoExtracao[] = [
  ...PDF_ERROR_CODES,
  ...DESFECHOS_EXTRACAO_EXTRAS,
];

describe("EIXO 1: todo estado de entrada tem desfecho de extracao", () => {
  it("a uniao de extracao e exatamente PDF_ERROR_CODES mais os dois extras", () => {
    expect(new Set(EXTRACAO_ESPERADOS)).toEqual(
      new Set([...PDF_ERROR_CODES, "ok", "perfil_nao_reconhecido"]),
    );
  });

  it("todo membro de PDF_ERROR_CODES e um desfecho de extracao valido", () => {
    // A direcao que pega o estado NOVO de entrada: `pdfExtract` ganha um
    // membro, e ele precisa poder sair no evento. Se o `satisfies` abaixo
    // falhasse, o erro apareceria no `pnpm check`.
    for (const code of PDF_ERROR_CODES) {
      const desfecho: DesfechoExtracao = code;
      expect(EXTRACAO_ESPERADOS).toContain(desfecho);
    }
    expect(EXTRACAO_ESPERADOS.length).toBe(PDF_ERROR_CODES.length + 2);
  });

  it("a pagina dispara um evento de extracao em TODA saida de handleFile", () => {
    // Contagem de sitios na fonte, e nao inspecao visual: sao quatro saidas
    // possiveis (sucesso, perfil nao reconhecido, erro classificado, erro nao
    // classificado) e cada uma precisa de uma captura.
    const pagina = readFileSync(
      path.join(AQUI, "..", "pages", "LinkedinAnalisar.tsx"),
      "utf8",
    );
    const capturas = pagina.match(/captureLinkedinExtracao\(/g) ?? [];
    expect(capturas.length).toBe(4);
  });
});

/**
 * EIXO 2: desfecho da analise.
 *
 * A fonte da verdade e `linkedinClient.ts`, que e quem decide o que a pagina
 * recebe. Os codigos sao LIDOS DELE em tempo de teste, entao um codigo novo la
 * quebra aqui sem ninguem precisar lembrar.
 *
 * CONTRAMEDIDA DO PARSER: o regex abaixo poderia sub-casar e devolver um
 * subconjunto, o que faria o teste passar sobre uma superficie menor (a classe
 * de defeito que esta base ja catalogou varias vezes). Por isso o teste afirma o
 * TOTAL: conta as ocorrencias amplas de `throw new Error(` e exige que o numero
 * de literais extraidos mais os nao-literais conhecidos feche a conta.
 */
function codigosDoCliente(): { literais: string[]; totalThrows: number } {
  const fonte = readFileSync(path.join(AQUI, "linkedinClient.ts"), "utf8");
  const escopo = fonte.slice(
    fonte.indexOf("export async function analyzeLinkedin"),
    fonte.indexOf("export interface LinkedinImprovementsState"),
  );
  const totalThrows = (escopo.match(/throw new Error\(/g) ?? []).length;
  const literais = Array.from(
    escopo.matchAll(/throw new Error\(\s*"([A-Z_]+)"/g),
    (m) => m[1],
  );
  const comPrefixo = Array.from(
    escopo.matchAll(/`([A-Z_]+):\s*\$\{/g),
    (m) => m[1],
  );
  return {
    literais: Array.from(new Set([...literais, ...comPrefixo])),
    totalThrows,
  };
}

describe("EIXO 2: todo erro que o cliente lanca vira desfecho instrumentado", () => {
  it("o parser leu TODOS os throws do analyze, sem encolher em silencio", () => {
    const { literais, totalThrows } = codigosDoCliente();
    // A CONTA QUE FECHA, e e ela que impede o parser de encolher em silencio:
    // sao 10 `throw new Error(` no corpo de `analyzeLinkedin`. Nove sao
    // alcancados pelos dois regex (8 literais simples mais o template com
    // prefixo `RATE_LIMITED:`), e o decimo e
    // `body.error?.message || "ANALYSIS_FAILED"`, que nenhum literal casa
    // porque o valor e a frase escrita pela rota. Esse decimo e exatamente o
    // balde de texto livre, coberto por `erro_generico`.
    //
    // Mudar estes numeros e ato deliberado, no commit que mexe em
    // `linkedinClient`: e o mesmo contrato de `EXPECTED_TABLE_COUNT`.
    expect(totalThrows).toBe(10);
    expect(literais.length).toBe(9);
    expect(totalThrows - literais.length).toBe(1);
  });

  it("cada codigo do cliente tem um desfecho proprio, e nenhum vira generico por descuido", () => {
    const { literais } = codigosDoCliente();
    for (const codigo of literais) {
      const desfecho = classificarDesfechoDeErro(
        codigo === "RATE_LIMITED" ? "RATE_LIMITED: qualquer coisa" : codigo,
      );
      expect(LINKEDIN_DESFECHOS_ANALISE).toContain(desfecho);
      if (codigo !== "ANALYSIS_FAILED") {
        expect(desfecho).not.toBe("erro_generico");
      }
    }
  });

  it("os desfechos instrumentados sao exatamente os codigos mapeados mais os tres proprios", () => {
    const { literais } = codigosDoCliente();
    const vindosDoCliente = new Set(
      literais.map((c) =>
        classificarDesfechoDeErro(c === "RATE_LIMITED" ? "RATE_LIMITED: x" : c),
      ),
    );
    // `sucesso` e `warm_empty` nao vem de erro nenhum, e `invalid_request` sai
    // TAMBEM do guard local da pagina. Nada alem disso pode existir na uniao:
    // desfecho sem origem e um valor que nunca aparece no painel.
    // `Array.from` e nao spread de Set: o tsconfig da aplicacao nao declara
    // `target`, entao cai em ES5 e o `tsc` recusa iterar Set com spread.
    const proprios: DesfechoAnalise[] = ["sucesso", "warm_empty"];
    expect(new Set(Array.from(vindosDoCliente).concat(proprios))).toEqual(
      new Set(LINKEDIN_DESFECHOS_ANALISE),
    );
  });

  it("mensagem desconhecida vira erro_generico, e a mensagem e DESCARTADA", () => {
    // Fail-closed, e aqui isso e privacidade: a ultima linha do cliente lanca a
    // frase que a rota escreveu.
    const frase = "Nao foi possivel concluir a analise agora. Tente de novo.";
    expect(classificarDesfechoDeErro(frase)).toBe("erro_generico");
    expect(classificarDesfechoDeErro("")).toBe("erro_generico");
    expect(classificarDesfechoDeErro("qualquer_coisa_nova")).toBe(
      "erro_generico",
    );
  });

  it("RATE_LIMITED e classificado sem carregar a mensagem do servidor junto", () => {
    expect(
      classificarDesfechoDeErro("RATE_LIMITED: Limite diario de 20 chamadas"),
    ).toBe("rate_limited");
  });

  it("a pagina dispara um desfecho em TODA saida de runAnalysis", () => {
    const pagina = readFileSync(
      path.join(AQUI, "..", "pages", "LinkedinAnalisar.tsx"),
      "utf8",
    );
    // Tres saidas: guard local, sucesso e catch.
    const capturas = pagina.match(/captureLinkedinDesfecho\(\{/g) ?? [];
    expect(capturas.length).toBe(3);
  });
});
