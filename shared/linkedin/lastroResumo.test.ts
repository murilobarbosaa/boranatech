import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  TIPOS_DE_VIOLACAO,
  resumirViolacoes,
  type TipoViolacao,
  type Violacao,
} from "./lastro";
import { CONTAGEM_INDISPONIVEL, readQualitative } from "./readQualitative";
import { readLinkedinAnalysisResponse } from "./readAnalysis";

/**
 * O RESUMO DE LASTRO E A AGREGACAO DA LISTA COMPLETA, e nada mais.
 *
 * As violacoes so viviam no Sentry, por um caminho AMOSTRADO (um evento por
 * tipo por minuto). Contar dali daria um numero menor que o real sem dizer que
 * subcontou. Este arquivo trava tres coisas:
 *
 *   1. o resumo e EXATAMENTE a agregacao da lista (fonte unica, sem segunda
 *      contagem em lugar nenhum para divergir);
 *   2. as chaves possiveis do `Record` sao a uniao `TipoViolacao` LIDA DA
 *      FONTE, entao um tipo novo sem tratamento quebra aqui;
 *   3. a leitura e fail-closed: payload antigo sem o resumo le como o estado
 *      nomeado de indisponivel, jamais como zero.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const GOLDENS = path.join(
  AQUI,
  "..",
  "..",
  "server",
  "lib",
  "__fixtures__",
  "linkedin",
  "qualitativo",
);

function violacao(tipo: TipoViolacao): Violacao {
  return {
    tipo,
    campo: "resumo",
    // Texto que NAO pode aparecer no resumo. Os dois campos existem na
    // `Violacao` e sao derivados da resposta do modelo.
    contexto: "ZQXJCONTEXTOZQXJ",
    termo: "ZQXJTERMOZQXJ",
  };
}

describe("o resumo e a agregacao da lista, sem inventar nem perder", () => {
  it("lista vazia da total zero e mapa vazio", () => {
    expect(resumirViolacoes([])).toEqual({ total: 0, porTipo: {} });
  });

  it("total bate com o tamanho da lista, e a soma do mapa bate com o total", () => {
    const lista = [
      violacao("numeral_fabricado"),
      violacao("numeral_fabricado"),
      violacao("idioma_incorreto"),
      violacao("prosa_numeral_sem_lastro"),
    ];
    const resumo = resumirViolacoes(lista);

    expect(resumo.total).toBe(lista.length);
    expect(resumo.porTipo).toEqual({
      numeral_fabricado: 2,
      idioma_incorreto: 1,
      prosa_numeral_sem_lastro: 1,
    });
    // A invariante que impede as duas metades de divergirem em silencio.
    const soma = Object.values(resumo.porTipo).reduce((a, b) => a + b, 0);
    expect(soma).toBe(resumo.total);
  });

  it("tipo sem ocorrencia fica AUSENTE, e nao zero", () => {
    // Zero explicito para doze tipos em toda analise limpa engordaria o jsonb
    // de todas elas so para dizer "nada aconteceu".
    const resumo = resumirViolacoes([violacao("bullet_sem_origem")]);
    expect(Object.keys(resumo.porTipo)).toEqual(["bullet_sem_origem"]);
    expect(resumo.porTipo.idioma_incorreto).toBeUndefined();
  });

  it("PRIVACIDADE: contexto e termo nao atravessam a agregacao", () => {
    const resumo = resumirViolacoes([
      violacao("tecnologia_sem_lastro"),
      violacao("colar_numeral_sem_lastro"),
    ]);
    expect(JSON.stringify(resumo)).not.toContain("ZQXJ");
  });

  it("todo tipo da uniao e agregavel, sem excecao", () => {
    const lista = TIPOS_DE_VIOLACAO.map((t) => violacao(t));
    const resumo = resumirViolacoes(lista);
    expect(resumo.total).toBe(TIPOS_DE_VIOLACAO.length);
    expect(new Set(Object.keys(resumo.porTipo))).toEqual(
      new Set(TIPOS_DE_VIOLACAO),
    );
  });
});

describe("TOTALIDADE: as chaves vem da uniao lida DA FONTE", () => {
  it("TIPOS_DE_VIOLACAO e exatamente a uniao TipoViolacao do arquivo", () => {
    // Mesma contramedida de `server/lib/linkedinLogSemTexto.test.ts`: a uniao e
    // um tipo, some na compilacao, e a unica forma de afirmar que a lista em
    // runtime nao encolheu e ler a declaracao de volta do disco.
    const fonte = readFileSync(path.join(AQUI, "lastro.ts"), "utf8");
    const bloco = fonte
      .slice(fonte.indexOf("export type TipoViolacao"))
      .split(";")[0];
    const daFonte = new Set(
      bloco
        .split("\n")
        .map((linha) => linha.trim().match(/^\|\s*"([a-z_]+)"$/)?.[1])
        .filter((t): t is string => t !== undefined),
    );

    // Afirma o TOTAL, e nao so a pertinencia: um parser que casasse metade dos
    // membros passaria num teste de "todos os que li estao la".
    expect(daFonte.size).toBe(12);
    expect(Array.from(daFonte).sort()).toEqual(
      Array.from(TIPOS_DE_VIOLACAO).sort(),
    );
  });
});

describe("leitura FAIL-CLOSED do resumo persistido", () => {
  it("payload ANTIGO, sem o resumo, le como indisponivel e nunca como zero", () => {
    // O caso real: 100% das analises gravadas antes deste lote. `0` seria a
    // afirmacao de que a analise rodou e nao violou nada, que ninguem mediu.
    const view = readQualitative({ resumo: "texto" });
    expect(view.lastroResumo.total).toBe(CONTAGEM_INDISPONIVEL);
    expect(view.lastroResumo.total).not.toBe(0);
    expect(view.lastroResumo.porTipo).toEqual({});
  });

  it("roundtrip do payload NOVO devolve o resumo intacto", () => {
    const resumo = resumirViolacoes([
      violacao("idioma_incorreto"),
      violacao("idioma_incorreto"),
    ]);
    const view = readQualitative({ resumo: "texto", lastroResumo: resumo });
    expect(view.lastroResumo.total).toBe(2);
    expect(view.lastroResumo.porTipo).toEqual({ idioma_incorreto: 2 });
  });

  it("total ilegivel derruba o mapa junto: contagem sem total e pior que nada", () => {
    // Um mapa sem total confiavel convida a somar os valores e obter um numero
    // que a analise nunca afirmou.
    const view = readQualitative({
      lastroResumo: { total: "muitos", porTipo: { idioma_incorreto: 3 } },
    });
    expect(view.lastroResumo.total).toBe(CONTAGEM_INDISPONIVEL);
    expect(view.lastroResumo.porTipo).toEqual({});
  });

  it("chave de tipo desconhecido e DESCARTADA, nao propagada", () => {
    // Versao futura que invente um tipo: quem le o mapa espera chaves de
    // `TipoViolacao` e renderizaria um rotulo que nao tem.
    const view = readQualitative({
      lastroResumo: {
        total: 5,
        porTipo: { idioma_incorreto: 2, tipo_do_futuro: 3 },
      },
    });
    expect(view.lastroResumo.porTipo).toEqual({ idioma_incorreto: 2 });
    // O total NAO e recalculado a partir do mapa: ele e o que a analise
    // afirmou. Divergir aqui e honesto; inventar um total nao seria.
    expect(view.lastroResumo.total).toBe(5);
  });

  it("contagem negativa ou fracionada nao entra no mapa", () => {
    const view = readQualitative({
      lastroResumo: {
        total: 3,
        porTipo: { idioma_incorreto: -1, numeral_fabricado: 1.5 },
      },
    });
    expect(view.lastroResumo.porTipo).toEqual({});
  });
});

describe("AUTOCONSISTENCIA: todo golden concorda com a propria lista", () => {
  const arquivos = readdirSync(GOLDENS).filter((f) => f.endsWith(".json"));

  it("ha goldens para conferir, e a enumeracao nao encolheu", () => {
    // Mesmo contrato de `EXPECTED_TABLE_COUNT`: mudar e ato deliberado.
    expect(arquivos.length).toBe(15);
  });

  for (const arquivo of arquivos) {
    it(`${arquivo}: lastroResumo e a agregacao das violacoes congeladas`, () => {
      const golden = JSON.parse(
        readFileSync(path.join(GOLDENS, arquivo), "utf8"),
      ) as {
        violacoes?: Array<{ tipo: string }>;
        qualitative: { lastroResumo?: unknown };
      };
      const esperado = resumirViolacoes(
        (golden.violacoes ?? []).map((v) => violacao(v.tipo as TipoViolacao)),
      );
      // O golden congela DUAS coisas que precisam concordar: a lista de
      // violacoes e o resumo. Se alguem editar uma sem a outra, e aqui que
      // aparece, e nao no painel do admin tres semanas depois.
      expect(golden.qualitative.lastroResumo).toEqual(esperado);
    });
  }
});

describe("readAnalysis entrega o qualitative com o resumo, nos dois shapes", () => {
  const RESPOSTA_BASE = {
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    deterministicVersion: 7,
    qualitativeVersion: 2,
    deterministic: {
      score: 70,
      faixa: "forte",
      headline: "Front-end",
      checks: [],
      keywordsEncontradas: [],
      keywordsFaltantes: [],
      sobreTamanho: 100,
      experienciasContagem: 1,
    },
  };

  it("payload NOVO: o resumo atravessa o reader de resposta ate a view", () => {
    const resposta = readLinkedinAnalysisResponse({
      ...RESPOSTA_BASE,
      qualitative: {
        resumo: "texto",
        lastroResumo: resumirViolacoes([violacao("vazamento_delimitador")]),
      },
    });
    expect(resposta).not.toBeNull();
    const view = readQualitative(resposta!.qualitative);
    expect(view.lastroResumo.total).toBe(1);
    expect(view.lastroResumo.porTipo).toEqual({ vazamento_delimitador: 1 });
  });

  it("payload ANTIGO: sem o resumo, a resposta segue legivel e o total e indisponivel", () => {
    // A janela de deploy real: front novo lendo analise gravada por qualquer
    // versao anterior. Nao pode derrubar a leitura nem inventar zero.
    const resposta = readLinkedinAnalysisResponse({
      ...RESPOSTA_BASE,
      qualitative: { resumo: "texto" },
    });
    expect(resposta).not.toBeNull();
    const view = readQualitative(resposta!.qualitative);
    expect(view.lastroResumo.total).toBe(CONTAGEM_INDISPONIVEL);
  });
});
