import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  QuizNivel,
  QuizPool,
  QuizQuestion,
  QuizTipo,
} from "../../shared/roadmapQuiz/types";
import {
  buildApprovedReview,
  drawQuestions,
  gradeAttempt,
  idDeExibicao,
  idOriginal,
  respostasParaExibicao,
  respostasParaOriginal,
  toPublicQuestions,
  type AttemptQuestionSnapshot,
} from "./roadmapQuiz";

// rng "sem troca": Math.floor(0.999 * (i + 1)) === i para todo i < 1000, entao
// o Fisher-Yates de shuffle nao troca nenhuma posicao e a ordem de saida e a
// ordem de entrada. Com ele, "as primeiras N do nivel na ordem do pool" e o
// que o sorteio devolve, e o teste controla o resultado pela ordem em que
// escreve as perguntas na fixture.
const semTroca = () => 0.999;

function pergunta(id: string, nivel: QuizNivel, tipo?: QuizTipo): QuizQuestion {
  return {
    id,
    nivel,
    pergunta: `Pergunta ${id}`,
    alternativas: { a: "A", b: "B", c: "C", d: "D" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "s1.f1",
    ...(tipo
      ? { tipo, codigo: { linguagem: "js", trecho: "console.log(1);" } }
      : {}),
  };
}

// Ids escritos a mao: ini-01..09, int-01..12, av-01..09, sem codigo.
const semCodigo: QuizPool = {
  slug: "teste",
  questions: [
    pergunta("ini-01", "iniciante"),
    pergunta("ini-02", "iniciante"),
    pergunta("ini-03", "iniciante"),
    pergunta("ini-04", "iniciante"),
    pergunta("ini-05", "iniciante"),
    pergunta("ini-06", "iniciante"),
    pergunta("ini-07", "iniciante"),
    pergunta("ini-08", "iniciante"),
    pergunta("ini-09", "iniciante"),
    pergunta("int-01", "intermediario"),
    pergunta("int-02", "intermediario"),
    pergunta("int-03", "intermediario"),
    pergunta("int-04", "intermediario"),
    pergunta("int-05", "intermediario"),
    pergunta("int-06", "intermediario"),
    pergunta("int-07", "intermediario"),
    pergunta("int-08", "intermediario"),
    pergunta("int-09", "intermediario"),
    pergunta("int-10", "intermediario"),
    pergunta("int-11", "intermediario"),
    pergunta("int-12", "intermediario"),
    pergunta("av-01", "avancado"),
    pergunta("av-02", "avancado"),
    pergunta("av-03", "avancado"),
    pergunta("av-04", "avancado"),
    pergunta("av-05", "avancado"),
    pergunta("av-06", "avancado"),
    pergunta("av-07", "avancado"),
    pergunta("av-08", "avancado"),
    pergunta("av-09", "avancado"),
  ],
};

// Intermediario com 8 de conceito ANTES e 4 de codigo DEPOIS na ordem do
// pool: com o rng sem troca, um sorteio sem garantia pega as 4 primeiras (so
// conceito). Os outros niveis nao tem codigo.
const CODIGO_INT = ["int-c1", "int-c2", "int-c3", "int-c4"];
const comCodigoNoIntermediario: QuizPool = {
  slug: "teste",
  questions: [
    ...semCodigo.questions.filter((q) => q.nivel !== "intermediario"),
    pergunta("int-01", "intermediario"),
    pergunta("int-02", "intermediario"),
    pergunta("int-03", "intermediario"),
    pergunta("int-04", "intermediario"),
    pergunta("int-05", "intermediario"),
    pergunta("int-06", "intermediario"),
    pergunta("int-07", "intermediario"),
    pergunta("int-08", "intermediario"),
    pergunta("int-c1", "intermediario", "completar"),
    pergunta("int-c2", "intermediario", "erro"),
    pergunta("int-c3", "intermediario", "saida"),
    pergunta("int-c4", "intermediario", "saida"),
  ],
};

function contarPorPrefixo(ids: string[], prefixo: string): number {
  return ids.filter((id) => id.startsWith(prefixo)).length;
}

function contarCodigo(ids: string[]): number {
  return ids.filter((id) => CODIGO_INT.includes(id)).length;
}

describe("drawQuestions", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pool sem codigo: 10 perguntas, 3 + 4 + 3, alternativas a-d uma vez cada", () => {
    const snapshot = drawQuestions(semCodigo, new Set(), semTroca);
    const ids = snapshot.map((entry) => entry.id);
    expect(ids).toHaveLength(10);
    expect(contarPorPrefixo(ids, "ini-")).toBe(3);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarPorPrefixo(ids, "av-")).toBe(3);
    for (const entry of snapshot) {
      expect([...entry.alternativas].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });

  it("nivel com codigo disponivel leva pelo menos uma de codigo", () => {
    const ids = drawQuestions(
      comCodigoNoIntermediario,
      new Set(),
      semTroca,
    ).map((entry) => entry.id);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarCodigo(ids)).toBeGreaterThanOrEqual(1);
    expect(contarPorPrefixo(ids, "ini-")).toBe(3);
    expect(contarPorPrefixo(ids, "av-")).toBe(3);
  });

  it("nivel so com perguntas de codigo sai com a cota normal", () => {
    const pool: QuizPool = {
      slug: "teste",
      questions: [
        ...semCodigo.questions.filter((q) => q.nivel !== "iniciante"),
        pergunta("ini-c1", "iniciante", "saida"),
        pergunta("ini-c2", "iniciante", "saida"),
        pergunta("ini-c3", "iniciante", "saida"),
        pergunta("ini-c4", "iniciante", "saida"),
      ],
    };
    const ids = drawQuestions(pool, new Set(), semTroca).map(
      (entry) => entry.id,
    );
    expect(contarPorPrefixo(ids, "ini-")).toBe(3);
    expect(ids).toHaveLength(10);
  });

  it("exclusao que cobre todo o codigo do nivel vence a garantia", () => {
    const ids = drawQuestions(
      comCodigoNoIntermediario,
      new Set(CODIGO_INT),
      semTroca,
    ).map((entry) => entry.id);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarCodigo(ids)).toBe(0);
  });

  it("exclusao que deixa o nivel abaixo da cota relaxa e a garantia volta", () => {
    const pool: QuizPool = {
      slug: "teste",
      questions: [
        ...semCodigo.questions.filter((q) => q.nivel !== "intermediario"),
        pergunta("int-01", "intermediario"),
        pergunta("int-02", "intermediario"),
        pergunta("int-03", "intermediario"),
        pergunta("int-c1", "intermediario", "erro"),
        pergunta("int-c2", "intermediario", "saida"),
      ],
    };
    // Sobram so int-02 e int-03 fora da exclusao: 2 < 4, relaxa.
    const ids = drawQuestions(
      pool,
      new Set(["int-01", "int-c1", "int-c2"]),
      semTroca,
    ).map((entry) => entry.id);
    expect(contarPorPrefixo(ids, "int-")).toBe(4);
    expect(contarCodigo(ids)).toBeGreaterThanOrEqual(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

describe("gradeAttempt", () => {
  it("conta acerto, erro e sem resposta; reprova abaixo de 7", () => {
    const grade = gradeAttempt(
      semCodigo,
      [
        { id: "ini-01", alternativas: ["a", "b", "c", "d"] },
        { id: "int-01", alternativas: ["a", "b", "c", "d"] },
        { id: "av-01", alternativas: ["a", "b", "c", "d"] },
      ],
      { "ini-01": "a", "int-01": "b" },
    );
    expect(grade.score).toBe(1);
    expect(grade.aprovado).toBe(false);
    expect(grade.porPergunta).toEqual([
      { id: "ini-01", acertou: true },
      { id: "int-01", acertou: false },
      { id: "av-01", acertou: false },
    ]);
  });

  it("pergunta que sumiu do pool e anulada a favor", () => {
    const grade = gradeAttempt(
      semCodigo,
      [{ id: "sumiu-99", alternativas: ["d", "c", "b", "a"] }],
      {},
    );
    expect(grade.porPergunta).toEqual([
      { id: "sumiu-99", acertou: true, anulada: true },
    ]);
    expect(grade.score).toBe(1);
  });
});

describe("toPublicQuestions", () => {
  const pool: QuizPool = {
    slug: "teste",
    questions: [
      {
        id: "conceito-01",
        nivel: "iniciante",
        pergunta: "O que e HTML?",
        alternativas: { a: "Linguagem", b: "Banco", c: "Servidor", d: "Rede" },
        correta: "a",
        explicacao: "HTML marca a estrutura.",
        fonte: "s1.f1",
      },
      {
        id: "completar-01",
        nivel: "intermediario",
        pergunta: "Complete a lacuna.",
        alternativas: { a: "let", b: "var", c: "const", d: "static" },
        correta: "c",
        explicacao: "const nao muda.",
        fonte: "s1.f1",
        tipo: "completar",
        codigo: { linguagem: "js", trecho: "____ PI = 3.14;" },
        alternativasCodigo: true,
      },
    ],
  };
  // SEM `exibicao`: e o snapshot de uma tentativa criada antes do Lote Q1, e
  // por isso este bloco descreve o caminho LEGADO, em que o id publico ainda e
  // a letra do arquivo. O caminho novo esta em "ids de exibicao".
  const snapshot = [
    { id: "conceito-01", alternativas: ["b", "a", "d", "c"] as const },
    { id: "completar-01", alternativas: ["c", "d", "a", "b"] as const },
  ].map((entry) => ({ id: entry.id, alternativas: [...entry.alternativas] }));

  it("pergunta de conceito sai so com as chaves de sempre", () => {
    const [conceito] = toPublicQuestions(pool, snapshot);
    expect(Object.keys(conceito).sort()).toEqual([
      "alternativas",
      "fonte",
      "id",
      "nivel",
      "pergunta",
    ]);
  });

  it("pergunta de codigo sai com tipo, codigo e alternativasCodigo", () => {
    const [, completar] = toPublicQuestions(pool, snapshot);
    expect(Object.keys(completar).sort()).toEqual([
      "alternativas",
      "alternativasCodigo",
      "codigo",
      "fonte",
      "id",
      "nivel",
      "pergunta",
      "tipo",
    ]);
    expect(completar.tipo).toBe("completar");
    expect(completar.codigo).toEqual({
      linguagem: "js",
      trecho: "____ PI = 3.14;",
    });
    expect(completar.alternativasCodigo).toBe(true);
  });

  it("nunca vaza correta nem explicacao", () => {
    for (const question of toPublicQuestions(pool, snapshot)) {
      expect(question).not.toHaveProperty("correta");
      expect(question).not.toHaveProperty("explicacao");
    }
  });

  it("LEGADO: alternativas saem na ordem do snapshot com a letra original", () => {
    const [conceito, completar] = toPublicQuestions(pool, snapshot);
    expect(conceito.alternativas).toEqual([
      { id: "b", texto: "Banco" },
      { id: "a", texto: "Linguagem" },
      { id: "d", texto: "Rede" },
      { id: "c", texto: "Servidor" },
    ]);
    expect(completar.alternativas).toEqual([
      { id: "c", texto: "const" },
      { id: "d", texto: "static" },
      { id: "a", texto: "let" },
      { id: "b", texto: "var" },
    ]);
  });

  it("com exibicao: mesma ordem de texto, ids pela POSICAO", () => {
    const comExibicao = snapshot.map((entry) => ({
      ...entry,
      exibicao: "posicao" as const,
    }));
    const [conceito, completar] = toPublicQuestions(pool, comExibicao);
    expect(conceito.alternativas).toEqual([
      { id: "a", texto: "Banco" },
      { id: "b", texto: "Linguagem" },
      { id: "c", texto: "Rede" },
      { id: "d", texto: "Servidor" },
    ]);
    expect(completar.alternativas).toEqual([
      { id: "a", texto: "const" },
      { id: "b", texto: "static" },
      { id: "c", texto: "let" },
      { id: "d", texto: "var" },
    ]);
  });
});

// Lote Q1: o id que sai pro client e a POSICAO de exibicao, nunca a letra do
// arquivo. O caso que da nome ao bloco e o de uniformidade: ele e a prova de
// que o vazamento fechou, e so vale acompanhado do controle legado, que mostra
// o instrumento acusando quando a correcao NAO esta aplicada.
describe("ids de exibicao", () => {
  // Pool em que TODA correta e "b": no caminho legado, quem marca "b" acerta
  // 100%; no caminho novo, a posicao da correta tem que ficar uniforme.
  const poolViciada: QuizPool = {
    slug: "viciada",
    questions: [
      ...["ini-01", "ini-02", "ini-03", "ini-04", "ini-05"].map((id) => ({
        id,
        nivel: "iniciante" as QuizNivel,
        pergunta: `P ${id}`,
        alternativas: { a: "A", b: "B", c: "C", d: "D" },
        correta: "b" as const,
        explicacao: "E b.",
        fonte: "s1.f1",
      })),
      ...["int-01", "int-02", "int-03", "int-04", "int-05"].map((id) => ({
        id,
        nivel: "intermediario" as QuizNivel,
        pergunta: `P ${id}`,
        alternativas: { a: "A", b: "B", c: "C", d: "D" },
        correta: "b" as const,
        explicacao: "E b.",
        fonte: "s1.f1",
      })),
      ...["av-01", "av-02", "av-03", "av-04", "av-05"].map((id) => ({
        id,
        nivel: "avancado" as QuizNivel,
        pergunta: `P ${id}`,
        alternativas: { a: "A", b: "B", c: "C", d: "D" },
        correta: "b" as const,
        explicacao: "E b.",
        fonte: "s1.f1",
      })),
    ],
  };

  // rng deterministico proprio (mulberry32): o teste precisa de embaralhamento
  // de verdade, entao o semTroca das outras fixtures nao serve aqui.
  function rngDeSemente(n: number) {
    let a = n >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Distribui as 400 tentativas pela POSICAO publica em que a correta aparece.
  function posicoesDaCorreta(comExibicao: boolean) {
    const rng = rngDeSemente(7);
    const contagem: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    let total = 0;
    for (let i = 0; i < 400; i += 1) {
      const sorteado = drawQuestions(poolViciada, new Set<string>(), rng);
      const snapshot = comExibicao
        ? sorteado
        : sorteado.map(({ id, alternativas }) => ({ id, alternativas }));
      for (const publica of toPublicQuestions(poolViciada, snapshot)) {
        const entry = snapshot.find((item) => item.id === publica.id)!;
        const idPublico = idDeExibicao(entry, "b");
        expect(idPublico).not.toBeNull();
        // O id publico tem que apontar para o texto da correta de verdade.
        expect(
          publica.alternativas.find((alt) => alt.id === idPublico)!.texto,
        ).toBe("B");
        contagem[idPublico!] += 1;
        total += 1;
      }
    }
    return { contagem, total };
  }

  it("a posicao da correta fica uniforme mesmo com a pool viciada em b", () => {
    const { contagem, total } = posicoesDaCorreta(true);
    for (const letra of ["a", "b", "c", "d"]) {
      const fracao = contagem[letra] / total;
      expect(fracao).toBeGreaterThan(0.15);
      expect(fracao).toBeLessThan(0.35);
    }
  });

  it("CONTROLE: sem exibicao, a correta e 'b' em 100% e a assercao acima falharia", () => {
    const { contagem, total } = posicoesDaCorreta(false);
    expect(contagem.b).toBe(total);
    expect(contagem.a + contagem.c + contagem.d).toBe(0);
    // O instrumento enxerga a diferenca: a mesma faixa do teste anterior
    // reprova este caminho.
    expect(contagem.b / total).toBeGreaterThan(0.35);
  });

  const entry: AttemptQuestionSnapshot = {
    id: "q1",
    alternativas: ["c", "a", "d", "b"],
    exibicao: "posicao",
  };
  const entryLegado: AttemptQuestionSnapshot = {
    id: "q1",
    alternativas: ["c", "a", "d", "b"],
  };
  const poolDeUm: QuizPool = {
    slug: "um",
    questions: [
      {
        id: "q1",
        nivel: "iniciante",
        pergunta: "Qual?",
        alternativas: {
          a: "texto A",
          b: "texto B",
          c: "texto C",
          d: "texto D",
        },
        correta: "d",
        explicacao: "E d.",
        fonte: "s1.f1",
      },
    ],
  };

  it("ida e volta: responder a correta pelo id de exibicao acerta", () => {
    // "d" original esta na posicao 2, entao o id publico dela e "c".
    expect(idDeExibicao(entry, "d")).toBe("c");
    const original = respostasParaOriginal([entry], { q1: "c" });
    expect(original).toEqual({ q1: "d" });
    expect(gradeAttempt(poolDeUm, [entry], original!).score).toBe(1);
  });

  it("ida e volta: qualquer outra posicao erra", () => {
    for (const exibido of ["a", "b", "d"]) {
      const original = respostasParaOriginal([entry], { q1: exibido });
      expect(original).not.toBeNull();
      expect(gradeAttempt(poolDeUm, [entry], original!).score).toBe(0);
    }
  });

  it("legado: sem exibicao as conversoes sao identidade", () => {
    expect(idDeExibicao(entryLegado, "d")).toBe("d");
    expect(idOriginal(entryLegado, "d")).toBe("d");
    expect(respostasParaOriginal([entryLegado], { q1: "d" })).toEqual({
      q1: "d",
    });
    expect(respostasParaExibicao([entryLegado], { q1: "d" })).toEqual({
      q1: "d",
    });
  });

  it("revisao: correta e respostaDoUsuario apontam a posicao do texto certo", () => {
    const [item] = buildApprovedReview(poolDeUm, [entry], { q1: "d" });
    expect(item.alternativas.map((alt) => alt.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    const posicaoDoTextoCerto = item.alternativas.find(
      (alt) => alt.texto === "texto D",
    )!.id;
    expect(item.correta).toBe(posicaoDoTextoCerto);
    expect(item.respostaDoUsuario).toBe(posicaoDoTextoCerto);
  });

  it("revisao legada mantem a letra original", () => {
    const [item] = buildApprovedReview(poolDeUm, [entryLegado], { q1: "d" });
    expect(item.correta).toBe("d");
    expect(item.respostaDoUsuario).toBe("d");
    expect(item.alternativas.map((alt) => alt.id)).toEqual([
      "c",
      "a",
      "d",
      "b",
    ]);
  });

  it("retomada: original -> exibicao -> original devolve o mapa de origem", () => {
    const gravado = { q1: "d" as const };
    const exibicao = respostasParaExibicao([entry], gravado);
    expect(exibicao).toEqual({ q1: "c" });
    expect(respostasParaOriginal([entry], exibicao)).toEqual(gravado);
  });

  it("entrada invalida devolve null", () => {
    expect(idOriginal(entry, "e")).toBeNull();
    expect(idOriginal(entry, "")).toBeNull();
    expect(respostasParaOriginal([entry], { q1: "e" })).toBeNull();
    expect(respostasParaOriginal([entry], { inexistente: "a" })).toBeNull();
  });
});
