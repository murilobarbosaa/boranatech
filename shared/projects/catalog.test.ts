import { describe, expect, it } from "vitest";

import { projetos } from "./catalog";

// Guard de acentuacao do catalogo. Existe por causa da leva de 204 entradas
// adicionadas em bloco sem diacritico ("Analise", "Relatorio", "Automacao"),
// que so foi notada meses depois porque nada media isso.
//
// A lista abaixo e de formas que, EM PORTUGUES, so existem com acento. Cada
// palavra e uma afirmacao: "esta sequencia de letras nunca e uma palavra
// valida". Palavra cuja forma nua tambem e portugues correto NAO entra aqui,
// porque guard que da alarme falso e guard que alguem desliga.
//
// REMOVIDA da lista sugerida: `analise`. E o unico caso medido de homografo
// real neste catalogo: substantivo ("Análise de Funil") e imperativo do verbo
// analisar ("Analise o documento de requisitos"), e o imperativo e correto sem
// acento. Hoje sao 15 ocorrencias de verbo, todas em passosSimplificados, mas
// um objetivo escrito como instrucao ("Analise os dados de vendas") e
// plausivel e daria falso positivo. As demais 46 formas foram conferidas uma a
// uma e nenhuma tem leitura valida sem acento.
const SO_EXISTEM_COM_ACENTO = [
  "relatorio",
  "automacao",
  "servico",
  "servicos",
  "usuario",
  "usuarios",
  "formulario",
  "memoria",
  "classica",
  "classico",
  "dinamico",
  "basico",
  "basica",
  "codigo",
  "pagina",
  "estatico",
  "estatica",
  "grafico",
  "graficos",
  "logica",
  "metricas",
  "semantica",
  "traducao",
  "orquestracao",
  "replicacao",
  "automatico",
  "automatica",
  "padroes",
  "cardapio",
  "enderecos",
  "validacao",
  "configuracao",
  "aplicacao",
  "aplicacoes",
  "colecao",
  "notificacao",
  "notificacoes",
  "seguranca",
  "previsao",
  "visualizacao",
  "tecnica",
  "tecnicas",
  "nivel",
  "portfolio",
  "historico",
  "saude",
];

// Fronteira por classe de letra, nao \b: com \b, "seguranca" casaria dentro de
// "seguranca-x" e, pior, o \b do JavaScript trata acentuada como nao-palavra,
// entao "informação" daria fronteira no meio da palavra.
const LETRA = "A-Za-z\\u00C0-\\u024F\\u0300-\\u036F";
const PADRAO = new RegExp(
  `(?<![${LETRA}])(${SO_EXISTEM_COM_ACENTO.join("|")})(?![${LETRA}])`,
  "gi",
);

describe("catalogo de projetos: acentuacao", () => {
  it("nenhum nome ou objetivo usa forma sem acento que so existe com acento", () => {
    const achados: string[] = [];
    for (const p of projetos)
      for (const campo of ["nome", "objetivo"] as const) {
        const texto = p[campo];
        // exec em laco, nao matchAll: o tsconfig da aplicacao nao declara
        // `target`, entao cai em ES5 e iterar o RegExpStringIterator nao
        // compila (TS2802). Mesmo motivo do Array.from em projectAreaGroup.
        PADRAO.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = PADRAO.exec(texto)) !== null)
          achados.push(`${p.id}.${campo}: "${m[1]}" em ${JSON.stringify(texto)}`);
      }
    expect(
      achados,
      `formas sem acento encontradas (${achados.length}):\n${achados.join("\n")}`,
    ).toEqual([]);
  });

  it("a lista do guard nao tem entrada morta nem duplicada", () => {
    // Duplicata na lista e ruido puro; o teste afirma o tamanho do conjunto,
    // que e o mesmo contrato do EXPECTED_TABLE_COUNT das migrations.
    expect(new Set(SO_EXISTEM_COM_ACENTO).size).toBe(
      SO_EXISTEM_COM_ACENTO.length,
    );
    expect(SO_EXISTEM_COM_ACENTO.length).toBe(46);
    for (const w of SO_EXISTEM_COM_ACENTO)
      expect(w, `${w} deveria estar sem acento na lista`).toBe(
        w.normalize("NFD").replace(/[̀-ͯ]/g, ""),
      );
  });
});
