import { describe, expect, it } from "vitest";
import type { QuizPool, QuizQuestion } from "../shared/roadmapQuiz/types";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import {
  quizPoolWarnings,
  referenciasDePosicao,
  validateQuizPool,
} from "./quizPoolValidation.mts";

// Literais escritos a mao. O slug "a+b" tem um metacaractere de regex: sem
// escape, o "+" vira quantificador e o id correto "a+b-ini-01" deixa de casar
// o formato (ou a validacao lanca). Trilha minima so para o slug existir no
// agregado e a pergunta ter uma folha real de fonte.
const roadmap: RoadmapV2 = {
  slug: "a+b",
  area: "frontend",
  title: "A mais B",
  level: "Iniciante",
  description: "Trilha de teste.",
  sections: [
    {
      id: "s1",
      title: "Secao 1",
      level: "iniciante",
      children: [{ id: "s1.f1", title: "Folha 1" }],
    },
  ],
};

// Trilha de linguagem com codeLanguages, para os casos em que a pergunta de
// codigo e permitida. A fixture de area acima nao tem codeLanguages, entao
// pergunta de codigo nela e erro.
const roadmapComCodigo: RoadmapV2 = {
  ...roadmap,
  area: "linguagem",
  kind: "linguagem",
  codeLanguages: ["js", "ts"],
};

function pergunta(id: string): QuizQuestion {
  return {
    id,
    nivel: "iniciante",
    pergunta: "Qual e a resposta?",
    alternativas: { a: "Um", b: "Dois", c: "Tres", d: "Quatro" },
    correta: "a",
    explicacao: "Porque sim.",
    fonte: "s1.f1",
  };
}

function problemasDeFormato(pool: QuizPool): string[] {
  return validateQuizPool(pool, "a+b", roadmap).filter((problem) =>
    problem.includes("fora do formato"),
  );
}

describe("validateQuizPool com slug que tem metacaractere de regex", () => {
  it("nao lanca e aceita o id no formato <slug>-ini-NN", () => {
    const pool: QuizPool = { slug: "a+b", questions: [pergunta("a+b-ini-01")] };
    expect(() => validateQuizPool(pool, "a+b", roadmap)).not.toThrow();
    expect(problemasDeFormato(pool)).toEqual([]);
  });

  it("reprova exatamente um id fora do formato", () => {
    const pool: QuizPool = { slug: "a+b", questions: [pergunta("axb-ini-01")] };
    expect(problemasDeFormato(pool)).toHaveLength(1);
  });
});

// Perguntas de codigo: cada caso usa `pergunta(id)` com os campos novos por
// cima e filtra os problemas pelo trecho da mensagem esperada.
function problemasContendo(
  question: QuizQuestion,
  trecho: string,
  trilha: RoadmapV2 = roadmap,
): string[] {
  const pool: QuizPool = { slug: "a+b", questions: [question] };
  return validateQuizPool(pool, "a+b", trilha).filter((problem) =>
    problem.includes(trecho),
  );
}

function problemasDeCodigo(
  question: QuizQuestion,
  trilha: RoadmapV2 = roadmap,
): string[] {
  const pool: QuizPool = { slug: "a+b", questions: [question] };
  return validateQuizPool(pool, "a+b", trilha).filter(
    (problem) =>
      problem.includes("codigo") ||
      problem.includes("tipo invalido") ||
      problem.includes("lacuna"),
  );
}

describe("perguntas de codigo", () => {
  it("saida com codigo valido de 3 linhas nao gera problema de codigo", () => {
    expect(
      problemasDeCodigo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: {
            linguagem: "js",
            trecho: "const a = 1;\nconst b = 2;\nconsole.log(a + b);",
          },
        },
        roadmapComCodigo,
      ),
    ).toEqual([]);
  });

  it("tipo fora da lista gera tipo invalido", () => {
    expect(
      problemasContendo(
        { ...pergunta("a+b-ini-01"), tipo: "xyz" as never },
        'tipo invalido "xyz"',
      ),
    ).toHaveLength(1);
  });

  it("erro sem codigo gera sem campo codigo", () => {
    expect(
      problemasContendo(
        { ...pergunta("a+b-ini-01"), tipo: "erro" },
        "sem campo codigo",
      ),
    ).toHaveLength(1);
  });

  it("codigo em pergunta sem tipo gera so e permitido", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          codigo: { linguagem: "js", trecho: "let x = 1;" },
        },
        "so e permitido em pergunta de tipo completar, erro ou saida",
      ),
    ).toHaveLength(1);
  });

  it("completar sem lacuna gera encontradas 0", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "let x = 1;" },
        },
        "exatamente uma lacuna ____ no trecho (encontradas 0)",
      ),
    ).toHaveLength(1);
  });

  it("completar com duas lacunas gera encontradas 2", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "completar",
          codigo: { linguagem: "js", trecho: "let ____ = ____;" },
        },
        "(encontradas 2)",
      ),
    ).toHaveLength(1);
  });

  it("saida com lacuna no trecho gera so e permitida em completar", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "js", trecho: "console.log(____);" },
        },
        "lacuna ____ so e permitida em pergunta completar",
      ),
    ).toHaveLength(1);
  });

  it("trecho de 13 linhas gera com 13 linhas", () => {
    const trecho = [
      "l1",
      "l2",
      "l3",
      "l4",
      "l5",
      "l6",
      "l7",
      "l8",
      "l9",
      "l10",
      "l11",
      "l12",
      "l13",
    ].join("\n");
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "python", trecho },
        },
        "codigo.trecho com 13 linhas (maximo 12)",
      ),
    ).toHaveLength(1);
  });

  it("linha de 71 caracteres gera linha de 71 caracteres", () => {
    const linha =
      "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrs";
    expect(linha).toHaveLength(71);
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "sql", trecho: `print(1)\n${linha}` },
        },
        "codigo.trecho com linha de 71 caracteres (maximo 70)",
      ),
    ).toHaveLength(1);
  });

  it("meia-risca no trecho gera travessao ou meia-risca", () => {
    expect(
      problemasContendo(
        {
          ...pergunta("a+b-ini-01"),
          tipo: "saida",
          codigo: { linguagem: "bash", trecho: "echo a \u2013 b" },
        },
        "codigo.trecho com travessao ou meia-risca",
      ),
    ).toHaveLength(1);
  });
});

describe("saidaEsperada nas perguntas erro", () => {
  const erro = (saidaEsperada?: string): QuizQuestion => ({
    ...pergunta("a+b-ini-01"),
    tipo: "erro",
    codigo: {
      linguagem: "js",
      trecho: "console.log(1 + '1');",
      ...(saidaEsperada === undefined ? {} : { saidaEsperada }),
    },
  });
  const problemas = (q: QuizQuestion) =>
    validateQuizPool({ slug: "a+b", questions: [q] }, "a+b", roadmapComCodigo);

  it("erro sem saidaEsperada gera erro exige codigo.saidaEsperada", () => {
    expect(
      problemas(erro()).filter((p) =>
        p.includes("erro exige codigo.saidaEsperada"),
      ),
    ).toHaveLength(1);
    expect(
      problemas(erro("   ")).filter((p) =>
        p.includes("erro exige codigo.saidaEsperada"),
      ),
    ).toHaveLength(1);
  });

  it("erro com saidaEsperada crua nao gera problema de saidaEsperada", () => {
    expect(
      problemas(erro("2")).filter((p) => p.includes("saidaEsperada")),
    ).toEqual([]);
  });

  it("saidaEsperada com meia-risca gera travessao ou meia-risca", () => {
    expect(
      problemas(erro("a \u2013 b")).filter((p) =>
        p.includes("codigo.saidaEsperada contem travessao ou meia-risca"),
      ),
    ).toHaveLength(1);
  });

  it("saidaEsperada fora de erro gera so em pergunta erro", () => {
    const saida: QuizQuestion = {
      ...pergunta("a+b-ini-01"),
      tipo: "saida",
      alternativasCodigo: true,
      codigo: {
        linguagem: "js",
        trecho: "console.log(1);",
        saidaEsperada: "1",
      },
    };
    expect(
      problemas(saida).filter((p) =>
        p.includes("saidaEsperada so em pergunta erro"),
      ),
    ).toHaveLength(1);
  });
});

describe("codeLanguages da trilha", () => {
  const saidaEm = (linguagem: string): QuizQuestion => ({
    ...pergunta("a+b-ini-01"),
    tipo: "saida",
    codigo: { linguagem, trecho: "console.log(1);" },
  });

  it("pergunta de codigo em trilha sem codeLanguages e erro", () => {
    expect(
      problemasContendo(saidaEm("js"), "em trilha sem codeLanguages", roadmap),
    ).toHaveLength(1);
  });

  it("linguagem fora das codeLanguages da trilha e erro", () => {
    expect(
      problemasContendo(
        saidaEm("python"),
        'codigo.linguagem "python" fora das codeLanguages da trilha [js, ts]',
        roadmapComCodigo,
      ),
    ).toHaveLength(1);
  });

  it("linguagem dentro das codeLanguages nao gera problema de codigo", () => {
    expect(problemasDeCodigo(saidaEm("ts"), roadmapComCodigo)).toEqual([]);
  });
});

describe("quizPoolWarnings: variedade de tipo de codigo por nivel", () => {
  const deCodigo = (
    id: string,
    nivel: QuizQuestion["nivel"],
    tipo: "completar" | "erro" | "saida",
  ): QuizQuestion => ({
    ...pergunta(id),
    nivel,
    tipo,
    codigo: {
      linguagem: "js",
      trecho: tipo === "completar" ? "const a = ____;" : "console.log(1);",
      ...(tipo === "erro" ? { saidaEsperada: "2" } : {}),
    },
    ...(tipo === "erro" ? {} : { alternativasCodigo: true as const }),
  });
  const pool: QuizPool = {
    slug: "a+b",
    questions: [
      deCodigo("a+b-ini-01", "iniciante", "completar"),
      deCodigo("a+b-ini-02", "iniciante", "erro"),
      deCodigo("a+b-ini-03", "iniciante", "saida"),
      deCodigo("a+b-int-01", "intermediario", "erro"),
      deCodigo("a+b-int-02", "intermediario", "saida"),
      deCodigo("a+b-av-01", "avancado", "completar"),
      deCodigo("a+b-av-02", "avancado", "erro"),
      deCodigo("a+b-av-03", "avancado", "saida"),
    ],
  };

  it("avisa exatamente o nivel e o tipo que faltam", () => {
    expect(quizPoolWarnings(pool, roadmapComCodigo)).toEqual([
      "pool a+b: nivel intermediario sem pergunta completar",
    ]);
  });

  it("trilha sem codeLanguages nao avisa nada", () => {
    expect(quizPoolWarnings(pool, roadmap)).toEqual([]);
    expect(quizPoolWarnings(pool, null)).toEqual([]);
  });

  it("pool so de conceito em trilha com codeLanguages avisa os nove", () => {
    const soConceito: QuizPool = {
      slug: "a+b",
      questions: [pergunta("a+b-ini-01")],
    };
    expect(quizPoolWarnings(soConceito, roadmapComCodigo)).toHaveLength(9);
  });
});

// Lote 10c. O defeito que motivou este guarda passou por validateQuizPool, por
// verifyQuizPoolByExecution e pela leitura humana das 18 linhas da tabela de
// revisao: 14 perguntas da pool de TypeScript tinham portugues sem acento em
// string que o usuario le. Nenhum dos tres olha ortografia, e nao deviam; o
// que faltava era um guarda barato.
//
// Lote 11a: o guarda passou de AVISO a ERRO. Ele era aviso porque a pool de
// JavaScript publicada ainda acusava (javascript-int-14); com ela consertada,
// a medicao nas 29 pools deu zero, e o erro vive em validateQuizPool, que
// tambem roda no pnpm check (generateRoadmapMeta --check) e no portao final
// do gerador.
describe("validateQuizPool: portugues sem acento em string visivel e ERRO", () => {
  const poolCom = (campos: Partial<QuizQuestion>): QuizPool => ({
    slug: "a+b",
    questions: [{ ...pergunta("a+b-ini-01"), ...campos }],
  });
  const acentos = (pool: QuizPool, trilha: RoadmapV2 = roadmap) =>
    validateQuizPool(pool, "a+b", trilha).filter((problem) =>
      problem.includes("sem acento"),
    );

  it("palavra sem acento em string visivel reprova, com pergunta, campo e palavra", () => {
    expect(acentos(poolCom({ pergunta: "Isto nao roda?" }))).toEqual([
      'pool a+b, pergunta a+b-ini-01: pergunta tem "nao" sem acento',
    ]);
  });

  it("deixou de ser aviso: quizPoolWarnings nao repete o problema", () => {
    expect(
      quizPoolWarnings(poolCom({ pergunta: "Isto nao roda?" }), null),
    ).toEqual([]);
  });

  it("CONTROLE: a mesma palavra entre crases passa, porque e identificador", () => {
    expect(acentos(poolCom({ pergunta: "Isto `nao` roda?" }))).toEqual([]);
  });

  it("CONTROLE: a mesma palavra em codigo.trecho passa", () => {
    expect(
      acentos(
        poolCom({
          tipo: "saida",
          codigo: {
            linguagem: "js",
            trecho: "const nao = 1;\nconsole.log(nao);",
          },
          alternativas: { a: "1", b: "2", c: "3", d: "4" },
          alternativasCodigo: true,
        }),
        roadmapComCodigo,
      ),
    ).toEqual([]);
  });

  it("CONTROLE: pergunta limpa passa", () => {
    expect(acentos(poolCom({}))).toEqual([]);
  });

  // A exclusao de alternativasCodigo nao estava no desenho original: veio da
  // medicao sobre as 29 pools, onde as quatro alternativas de javascript-ini-11
  // (`numero % 2 === 0 ? 'par' : 'impar'`) eram acusadas sobre um identificador.
  // Sem este par de casos a exclusao seria um silencio nao provado.
  it("CONTROLE: alternativa de codigo nao e acusada", () => {
    const alternativas = { a: "numero > 0", b: "numero", c: "1", d: "2" };
    expect(
      acentos(poolCom({ alternativas, alternativasCodigo: true })),
    ).toEqual([]);
  });

  it("CONTROLE NEGATIVO: a mesma alternativa em prosa E acusada", () => {
    const alternativas = { a: "numero > 0", b: "numero", c: "1", d: "2" };
    expect(acentos(poolCom({ alternativas }))).toEqual([
      'pool a+b, pergunta a+b-ini-01: alternativa a tem "numero" sem acento',
      'pool a+b, pergunta a+b-ini-01: alternativa b tem "numero" sem acento',
    ]);
  });
});

describe("saidaEsperada condicionada a capacidade da linguagem", () => {
  const trilhaEm = (linguagem: string): RoadmapV2 => ({
    ...roadmap,
    area: "linguagem",
    kind: "linguagem",
    codeLanguages: [linguagem],
  });
  const erroEm = (linguagem: string, saidaEsperada?: string): QuizQuestion => ({
    ...pergunta("a+b-ini-01"),
    tipo: "erro",
    codigo: {
      linguagem,
      trecho: "<p>oi</p",
      ...(saidaEsperada === undefined ? {} : { saidaEsperada }),
    },
  });
  const deSaida = (q: QuizQuestion, linguagem: string) =>
    validateQuizPool(
      { slug: "a+b", questions: [q] },
      "a+b",
      trilhaEm(linguagem),
    ).filter((p) => p.includes("saidaEsperada"));

  it("html aceita erro sem saidaEsperada", () => {
    expect(deSaida(erroEm("html"), "html")).toEqual([]);
  });

  it("html rejeita saidaEsperada presente e vazia", () => {
    const problemas = deSaida(erroEm("html", "   "), "html");
    expect(problemas).toHaveLength(1);
    expect(problemas[0]).toContain("vazia");
  });

  it("bash continua exigindo saidaEsperada", () => {
    expect(
      deSaida(erroEm("bash"), "bash").some((p) =>
        p.includes("erro exige codigo.saidaEsperada"),
      ),
    ).toBe(true);
  });
});

// Lote 09b. A ordem das alternativas na tela e embaralhada, e desde o Lote Q1
// o id que o client recebe e a POSICAO, nao a letra do arquivo: texto que cita
// letra ou posicao aponta para outra alternativa na tela.
describe("referenciasDePosicao: citar letra ou posicao de alternativa", () => {
  const REPROVA = [
    "a opção b usa WHERE",
    "A alternativa correta é a letra a",
    "As duas primeiras opções",
    "É o contrário da última alternativa",
    "a opcao c esta errada",
    "as tres ultimas opcoes",
  ];
  for (const texto of REPROVA) {
    it(`acusa ${JSON.stringify(texto)}`, () => {
      expect(referenciasDePosicao(texto).length).toBeGreaterThan(0);
    });
  }

  const PASSA = [
    "a alternativa correta usa HAVING",
    "a letra do alfabeto",
    "a primeira regra da folha",
    "a opção de menu do editor",
    "letras maiusculas e minusculas",
  ];
  for (const texto of PASSA) {
    it(`aceita ${JSON.stringify(texto)}`, () => {
      expect(referenciasDePosicao(texto)).toEqual([]);
    });
  }

  it("a validacao da pool reprova a explicacao que cita a letra", () => {
    const pergunta: QuizQuestion = {
      id: "a+b-ini-01",
      nivel: "iniciante",
      pergunta: "Pergunta de teste?",
      alternativas: { a: "Um", b: "Dois", c: "Tres", d: "Quatro" },
      correta: "a",
      explicacao: "A alternativa correta é a letra a, e nao as outras.",
      fonte: "s1.f1",
    };
    const problemas = validateQuizPool(
      { slug: "a+b", questions: [pergunta] } as unknown as QuizPool,
      "a+b",
      roadmap,
    );
    expect(
      problemas.some((p) => p.includes("cita posicao de alternativa")),
    ).toBe(true);
  });
});
