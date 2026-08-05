import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `headlineFinal` e o PONTO UNICO: nenhum sitio de check le `parsed.headline`.
 *
 * Por que enumerar da FONTE e nao testar comportamento: um leitor esquecido de
 * `parsed.headline` produz nota certa em 99% dos casos (quando ninguem editou)
 * e errada so quando a pessoa edita, que e exatamente o caso raro que nenhum
 * teste de comportamento amostra. O defeito seria invisivel ate chegar em
 * producao no perfil de alguem.
 *
 * O molde e o do `linkedinDeteccaoNaoMoveNota.test.ts`: ler o arquivo, contar
 * as ocorrencias, e ABORTAR em qualquer uma nao classificada. A lista de
 * excecoes e curta e cada uma diz por que nao e sitio de check. Um leitor novo
 * derruba a suite ate ser classificado, que e o contrato do
 * `EXPECTED_TABLE_COUNT`: alterar e ato deliberado, no commit que cria o sitio.
 */

const ARQUIVO = `${import.meta.dirname}/linkedinChecks.ts`;

/**
 * Ocorrencias de `parsed.headline` que NAO sao leitura para check.
 *
 * Cada entrada e o trecho da linha, e o motivo. Trecho, e nao numero de linha,
 * porque numero de linha desatualiza a cada edicao acima dele e o teste viraria
 * ruido.
 */
const PERMITIDAS: Array<{ trecho: string; porque: string }> = [
  {
    trecho: "headlineFinalDe(parsed.headline, input.headlineManual)",
    porque:
      "e a RESOLUCAO em si, a unica leitura legitima: e daqui que sai headlineFinal",
  },
];

describe("nenhum sitio de check le parsed.headline direto", () => {
  const fonte = readFileSync(ARQUIVO, "utf8");
  const linhas = fonte.split("\n");

  it("toda ocorrencia de `parsed.headline` esta classificada", () => {
    const ocorrencias = linhas
      .map((linha, i) => ({ linha: linha.trim(), numero: i + 1 }))
      // Comentario nao e codigo: `parsed.headline` citado em prosa explicativa
      // nao le nada. Sem este filtro o teste cobraria classificacao de texto.
      .filter(
        ({ linha }) =>
          linha.includes("parsed.headline") &&
          !linha.startsWith("//") &&
          !linha.startsWith("*") &&
          !linha.startsWith("/*"),
      );

    const naoClassificadas = ocorrencias.filter(
      ({ linha }) => !PERMITIDAS.some((p) => linha.includes(p.trecho)),
    );

    expect(
      naoClassificadas,
      `Leitor novo de \`parsed.headline\` em linkedinChecks.ts:\n` +
        naoClassificadas.map((o) => `  linha ${o.numero}: ${o.linha}`).join("\n") +
        `\n\nSe for sitio de check, use \`headlineFinal\`. Se nao for, ` +
        `acrescente a PERMITIDAS com o motivo.`,
    ).toEqual([]);
  });

  it("afirma o TOTAL, nao so a pertinencia", () => {
    // A contramedida que o CLAUDE.md registra como a que funcionou nas tres
    // vezes: um guard que responde "os que eu conheco estao la" nao quebra
    // quando o conjunto encolhe. Se a resolucao for REMOVIDA (alguem "limpando"
    // o `headlineFinalDe`), a lista de permitidas continuaria satisfeita e este
    // teste seria o unico a acusar.
    const codigo = linhas.filter(
      (l) =>
        l.trim().includes("parsed.headline") &&
        !l.trim().startsWith("//") &&
        !l.trim().startsWith("*"),
    );
    expect(codigo).toHaveLength(PERMITIDAS.length);
  });

  it("headlineFinal alimenta o pendente e o valor persistido", () => {
    // As duas outras leituras que existiam (`headlineParecCortada` e o
    // `headline:` do resultado) tinham de migrar juntas. Se uma ficasse para
    // tras, a nota sairia da headline digitada e o `pendente` da lida, e a
    // interface afirmaria faixa sobre um texto que a analise nao usou.
    expect(fonte).toContain("headlineParecCortada(headlineFinal)");
    expect(fonte).toContain("headline: headlineFinal,");
  });
});
