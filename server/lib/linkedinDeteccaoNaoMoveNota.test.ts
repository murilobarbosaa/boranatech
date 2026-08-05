import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * A detecção de headline cortada NÃO pode entrar em avaliador de check.
 *
 * POR QUE ESTE TESTE EXISTE, e a história importa mais que a asserção:
 * `headlineCortada.ts` morava em `client/src/lib` justamente para que um check
 * da régua não pudesse depender dele. Aquilo era uma barreira ESTRUTURAL: não
 * havia como importar `client/` de `shared/` ou de `server/`, ponto.
 *
 * Em 2026-08-01 o `pendente` passou a ser persistido, quem escreve o bloco
 * determinístico é o servidor, e o arquivo teve de mudar para `shared/`. A
 * alternativa era duplicar a regra nos dois lados, que é a classe de defeito
 * desta base. A barreira caiu de "impossível" para "testado", e a perda está
 * registrada dentro do próprio `headlineCortada.ts`.
 *
 * `reguaV2.pontosPendentes.test.ts` prova INÉRCIA DO RESULTADO: a flag não move
 * nenhuma parcela da decomposição. Este arquivo prova outra coisa, mais perto
 * do que se perdeu: AUSÊNCIA DE DEPENDÊNCIA. Se alguém escrever um avaliador
 * que consulte a detecção, quebra aqui, na hora, e não daqui a seis meses num
 * deep-equals que passou a comparar duas coisas erradas iguais.
 *
 * Enumera DA FONTE, no molde de `aiUsageTool.test.ts`: lê o arquivo, recorta o
 * bloco dos avaliadores e afirma sobre o que está lá dentro. E afirma o TOTAL
 * de usos no arquivo inteiro, não só a pertinência — um guard que responde "os
 * que eu conheço estão fora" é inútil; este responde "existe exatamente 1, e é
 * este".
 */

const ARQUIVO = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "linkedinChecks.ts",
);

const FONTE = readFileSync(ARQUIVO, "utf8");

/** Os nomes que a detecção exporta hoje. */
const SIMBOLOS_DA_DETECCAO = ["headlineParecCortada", "assinaturaDeCorte"];

/**
 * O bloco dos avaliadores: de `const evaluators` até a linha que fecha o objeto
 * na coluna zero. É onde vive a lógica de cada check.
 *
 * Se o recorte falhar (renomearam a constante, mudaram o formato), o teste
 * ABORTA em vez de passar sobre um bloco vazio. Parser que sub-casa em silêncio
 * é a classe de defeito que esta base documenta; aqui ele grita.
 */
function blocoDosAvaliadores(): string {
  const inicio = FONTE.indexOf("const evaluators");
  expect(inicio).toBeGreaterThan(-1);
  const fim = FONTE.indexOf("\n  };\n", inicio);
  expect(fim).toBeGreaterThan(inicio);
  const bloco = FONTE.slice(inicio, fim);
  // Sanidade do próprio instrumento: o bloco tem de conter avaliadores de
  // verdade, senão o recorte pegou nada e a asserção seria vazia.
  expect(bloco).toContain("headline-existe");
  expect(bloco).toContain("aprovado");
  expect(bloco.length).toBeGreaterThan(2000);
  return bloco;
}

describe("a deteccao de headline cortada nao entra na regua", () => {
  it("o recorte do bloco de avaliadores e valido (sanidade do instrumento)", () => {
    const bloco = blocoDosAvaliadores();
    expect(bloco.split("\n").length).toBeGreaterThan(50);
  });

  it("NENHUM avaliador de check consulta a deteccao", () => {
    const bloco = blocoDosAvaliadores();
    for (const simbolo of SIMBOLOS_DA_DETECCAO) {
      expect(bloco).not.toContain(simbolo);
    }
  });

  it("afirma o TOTAL de usos no arquivo: exatamente 1, e e o marcador", () => {
    // O import mais o uso único que decide `pendente`/`notaIncompleta`. Um uso
    // a mais significa que a detecção passou a alimentar outra coisa, e essa é
    // exatamente a mudança que este teste existe para interceptar.
    const usos = FONTE.split("headlineParecCortada").length - 1;
    expect(usos).toBe(2); // 1 no import + 1 na chamada

    // Ancora atualizada em 2026-08-05, no commit do campo de headline
    // editavel. O argumento e `headlineFinal` e nao mais `parsed.headline`
    // porque a deteccao passou a rodar sobre a headline QUE A ANALISE USA,
    // que pode ser a digitada. A propriedade que este arquivo protege nao
    // mudou: continua sendo UMA chamada, e ela so decide `pendente` e
    // `notaIncompleta`, nunca `aprovado` nem peso.
    //
    // Este teste foi quem interceptou a mudanca, e e o comportamento correto:
    // ancora acoplada a fonte cobra atualizacao deliberada em vez de deixar
    // passar. Vale registrar porque a instancia inversa (ancora que parou de
    // casar e saiu com exit 0) esta no `docs/auditoria-linkedin-fechamento.md`.
    expect(FONTE).toContain(
      "const headlineCortada = headlineParecCortada(headlineFinal)",
    );
    // `assinaturaDeCorte` nao e usada aqui de forma nenhuma.
    expect(FONTE).not.toContain("assinaturaDeCorte");
  });

  it("o resultado da deteccao so alimenta `pendente` e `notaIncompleta`", () => {
    // Enumera os usos da variavel derivada, IGNORANDO linhas de import: o
    // caminho do modulo (`shared/linkedin/headlineCortada`) casa a mesma
    // string e nao e uso de codigo. A primeira versao deste teste contava 3 e
    // encontrou 4, pelo caminho; contar texto sem separar codigo de caminho e
    // parser sub-casando ao contrario, para mais.
    const linhasDeCodigo = FONTE.split("\n").filter(
      (l) => !/^\s*import\b/.test(l) && !/from ["']/.test(l),
    );
    const usos = Array.from(
      linhasDeCodigo.join("\n").matchAll(/headlineCortada/g),
    ).length;
    // 1 declaracao + 1 em `pendente:` + 1 em `notaIncompleta:`
    expect(usos).toBe(3);
    expect(FONTE).toContain(
      "pendente: headlineCortada && entry.category === \"headline\"",
    );
    expect(FONTE).toContain("notaIncompleta: headlineCortada");
  });

  it("`aprovado` nunca e derivado da deteccao", () => {
    // A asserção mais direta do que se quer garantir: nenhuma linha que atribua
    // `aprovado` menciona a detecção.
    const linhasDeAprovado = FONTE.split("\n").filter((l) =>
      /\baprovado\b\s*[:=]/.test(l),
    );
    expect(linhasDeAprovado.length).toBeGreaterThan(5);
    for (const linha of linhasDeAprovado) {
      expect(linha).not.toContain("headlineCortada");
      for (const simbolo of SIMBOLOS_DA_DETECCAO) {
        expect(linha).not.toContain(simbolo);
      }
    }
  });
});
