import { describe, expect, it } from "vitest";
import type { RoadmapV2 } from "../shared/roadmapV2/types";
import { capabilityOf } from "./languageCapabilities.mts";
import {
  makeExecutor,
  makeGroupExecutor,
} from "./verifyQuizPoolByExecution.mts";
import {
  blocosDaTrilha,
  conferirBloco,
  conferirGrupo,
  lerCerca,
  estruturaCss,
  estruturaHtml,
  extrairBlocos,
  idsDePasso,
  prosaDaTrilha,
  prosaHtmlCru,
  prosaIdInterno,
  relatorioBlocos,
  validarCss,
} from "./verifyLessonBlocks.mts";
import type { Execucao } from "./verifyQuizPoolByExecution.mts";

// So as funcoes puras: a execucao real fica fora, com executor stub.
const executorQueRoda = (): Execucao => ({
  status: 0,
  stdout: "ok\n",
  erro: "",
  timeout: false,
});
const executorQueLanca = (): Execucao => ({
  status: 1,
  stdout: "",
  erro: "ReferenceError: x is not defined",
  timeout: false,
});

describe("extrairBlocos", () => {
  it("devolve linguagem e corpo de cada cerca, na ordem", () => {
    const blocos = extrairBlocos(
      "Texto.\n\n```bash\n$ git status\n```\n\nMais.\n\n```js\nconsole.log(1);\n```",
    );
    expect(blocos).toEqual([
      { linguagem: "bash", corpo: "$ git status", problemasDaCerca: [] },
      { linguagem: "js", corpo: "console.log(1);", problemasDaCerca: [] },
    ]);
  });
});

describe("conferirBloco: bash valida a convencao sem executar", () => {
  it("bloco bash valido passa e sai nao-executado", () => {
    const r = conferirBloco(
      {
        linguagem: "bash",
        corpo:
          "$ git status\nOn branch main\nnothing to commit, working tree clean",
      },
      ["bash"],
      () => {
        throw new Error("bash nao pode ser executado");
      },
    );
    expect(r.veredito).toBe("nao-executado");
    expect(r.problemas).toEqual([]);
  });

  it("linha de comando sem o prefixo $ acusa", () => {
    const r = conferirBloco(
      { linguagem: "bash", corpo: "git status", problemasDaCerca: [] },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(r.problemas.some((p) => p.includes("$ "))).toBe(true);
  });

  it("comando git no meio da saida sem o prefixo $ acusa", () => {
    const r = conferirBloco(
      {
        linguagem: "bash",
        corpo: "$ git status\nOn branch main\ngit add .",
      },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(r.problemas.some((p) => p.includes("linha 3"))).toBe(true);
  });

  it("linha acima de 60 caracteres e bloco acima de 10 linhas acusam", () => {
    const longa = conferirBloco(
      {
        linguagem: "bash",
        corpo: `$ git commit -m "${"x".repeat(60)}"`,
        problemasDaCerca: [],
      },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(longa.problemas.some((p) => p.includes("60"))).toBe(true);
    const comprido = conferirBloco(
      {
        linguagem: "bash",
        corpo: Array.from({ length: 11 }, () => "$ git status").join("\n"),
        problemasDaCerca: [],
      },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(
      comprido.problemas.some((p) => p.includes("11 linhas de conteudo")),
    ).toBe(true);
  });
});

describe("conferirBloco: js continua executando", () => {
  it("bloco js que roda sai executado", () => {
    const r = conferirBloco(
      { linguagem: "js", corpo: "console.log('ok');", problemasDaCerca: [] },
      ["js"],
      () => executorQueRoda(),
    );
    expect(r.veredito).toBe("executado");
    expect(r.problemas).toEqual([]);
  });

  it("bloco js que lanca sai falhou, com o erro", () => {
    const r = conferirBloco(
      { linguagem: "js", corpo: "console.log(x);", problemasDaCerca: [] },
      ["js"],
      () => executorQueLanca(),
    );
    expect(r.veredito).toBe("falhou");
    expect(r.problemas.join(" ")).toContain("ReferenceError");
  });

  it("cerca fora de codeLanguages so confere limites, sem executar", () => {
    const r = conferirBloco(
      { linguagem: "json", corpo: '{ "a": 1 }', problemasDaCerca: [] },
      ["js"],
      () => {
        throw new Error("json nao pode ser executado");
      },
    );
    expect(r.veredito).toBe("fora-de-codeLanguages");
    expect(r.problemas).toEqual([]);
  });
});

describe("blocosDaTrilha e relatorioBlocos", () => {
  const trilha = {
    slug: "git",
    codeLanguages: ["bash"],
    sections: [
      {
        id: "s",
        title: "S",
        children: [
          {
            id: "s.a",
            title: "A",
            content: "```bash\n$ git init\n```",
          },
          {
            id: "s.b",
            title: "B",
            byLanguage: {
              linux: { content: "```bash\ngit log\n```" },
            },
          },
        ],
      },
    ],
  } as unknown as RoadmapV2;

  it("percorre content e byLanguage, com o passo de cada bloco", () => {
    const blocos = blocosDaTrilha(trilha);
    expect(blocos.map((b) => b.passo)).toEqual(["s.a", "s.b [linux]"]);
  });

  it("o resumo conta nao-executados, divergencias e traz o aviso sem runner", () => {
    const linhas = blocosDaTrilha(trilha).map((b) => ({
      passo: b.passo,
      linguagem: b.linguagem,
      ...conferirBloco(b, ["bash"], () => executorQueRoda()),
    }));
    const saida = relatorioBlocos(linhas);
    expect(saida).toContain(
      "blocos: 2 | executados: 0 | lancaram como esperado: 0 | gravados: 0 | nao-executados: 2 | falharam: 0 | fora de codeLanguages: 0 | divergencias de convencao: 1",
    );
    expect(saida).toContain(
      "[aviso] 2 trechos de bash sem runner: verificacao por execucao NAO cobre estes; revisao humana obrigatoria",
    );
  });
});

describe("conferirBloco: saida real que parece comando", () => {
  it("a resposta do git --version nao e confundida com comando sem $", () => {
    const r = conferirBloco(
      {
        linguagem: "bash",
        corpo: "$ git --version\ngit version 2.43.0",
        problemasDaCerca: [],
      },
      ["bash"],
      () => executorQueRoda(),
    );
    expect(r.problemas).toEqual([]);
  });
});

// Controles do verificador estrutural (Lote 08). Literais escritos a mao: se
// viessem do proprio verificador, provariam so que ele concorda consigo mesmo.
const DOCUMENTO_MINIMO = [
  "<!DOCTYPE html>",
  '<html lang="pt-BR">',
  "  <head>",
  '    <meta charset="UTF-8">',
  "    <title>Minha pagina</title>",
  "  </head>",
  "  <body>",
  "    <h1>Ola</h1>",
  "  </body>",
  "</html>",
].join("\n");

describe("estruturaHtml: marcacao que so vale porque o parser conserta", () => {
  it("tag nao-void aberta e nunca fechada reprova", () => {
    const problemas = estruturaHtml("<div>\n  <p>texto</p>");
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("div");
  });

  it("tag fechada sem ter sido aberta reprova", () => {
    const problemas = estruturaHtml("<p>um</p>\n</section>");
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("section");
  });

  it("aninhamento que o parser recupera reprova (p contendo div)", () => {
    expect(
      estruturaHtml("<p>\n  <div>bloco</div>\n</p>").length,
    ).toBeGreaterThan(0);
  });

  it("fechamento fora de ordem reprova", () => {
    expect(estruturaHtml("<b><i>texto</b></i>").length).toBeGreaterThan(0);
  });

  it("li sem fechar reprova", () => {
    const problemas = estruturaHtml("<ul>\n  <li>um\n  <li>dois\n</ul>");
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("li");
  });

  it("documento minimo passa", () => {
    expect(estruturaHtml(DOCUMENTO_MINIMO)).toEqual([]);
  });

  it("elemento void sem barra passa", () => {
    expect(
      estruturaHtml(
        '<img src="foto.jpg" alt="Ana sorrindo">\n<br>\n<input type="email" id="email">',
      ),
    ).toEqual([]);
  });

  it("elemento void com barra passa", () => {
    expect(
      estruturaHtml(
        '<label for="nome">Nome</label>\n<input id="nome" name="nome" />',
      ),
    ).toEqual([]);
  });

  it("comentario e enfase passam", () => {
    expect(
      estruturaHtml("<!-- comentario -->\n<p>Ola, <strong>mundo</strong></p>"),
    ).toEqual([]);
  });

  it("tabela sem tbody passa: o enxerto do parser e normal", () => {
    expect(estruturaHtml("<table>\n  <tr><td>1</td></tr>\n</table>")).toEqual(
      [],
    );
  });
});

describe("estruturaCss: chaves balanceadas", () => {
  it("regra fechada passa", () => {
    expect(estruturaCss("a { color: red; }")).toEqual([]);
  });

  it("chave aberta e nao fechada reprova", () => {
    expect(estruturaCss("a { color: red;").length).toBeGreaterThan(0);
  });

  it("chave fechada antes de abrir reprova", () => {
    expect(estruturaCss("a } color: red; {").length).toBeGreaterThan(0);
  });

  it("chave dentro de comentario nao conta", () => {
    expect(estruturaCss("/* } */ a { color: red; }")).toEqual([]);
  });
});

describe("prosaHtmlCru: o renderer descarta HTML fora de crase", () => {
  it("tag crua na prosa reprova", () => {
    const problemas = prosaHtmlCru("Use a tag <p> aqui");
    expect(problemas.length).toBeGreaterThan(0);
    expect(problemas.join(" ")).toContain("renderer descarta");
  });

  it("tag entre crases passa", () => {
    expect(prosaHtmlCru("Use a tag `<p>` aqui")).toEqual([]);
  });

  it("menor que com espaco nao e tag", () => {
    expect(prosaHtmlCru("se a < b, o laco continua")).toEqual([]);
  });

  it("tag dentro de cerca passa", () => {
    expect(prosaHtmlCru("Exemplo:\n\n```html\n<p>Ola</p>\n```\n")).toEqual([]);
  });
});

// Lote 09. Os controles sao escritos a mao e cada um precisa REPROVAR antes de
// o instrumento valer: o css-tree sozinho deixa passar bloco sem fechar,
// combinador repetido, media feature com erro de digitacao e ";;", e a
// convencao da trilha cobre a escrita, que o AST normaliza.
describe("validarCss: css invalido", () => {
  const REPROVA: [string, string][] = [
    ["propriedade que nao existe", "a { colr: red; }"],
    ["numero sem unidade", "div { width: 100; }"],
    ["dois-pontos faltando", "a { color red; }"],
    ["valor que nao existe na propriedade", "p { display: flexbox; }"],
    ["hex incompleto", "p { color: #12; }"],
    ["margin com cinco valores", "p { margin: 10px 5px 3px 2px 1px; }"],
    ["seletor com virgula solta", ".a, { color: red; }"],
    ["chaves trocadas", "a } color: red; {"],
    ["bloco sem fechar", "a { color: red; "],
  ];
  for (const [rotulo, css] of REPROVA) {
    it(`reprova ${rotulo}`, () => {
      expect(validarCss(css).length).toBeGreaterThan(0);
    });
  }
});

describe("validarCss: convencao da trilha", () => {
  it("reprova declaracao sem ponto e virgula, inclusive a ultima", () => {
    expect(validarCss("a { color: red }")).toEqual([
      "declaracao sem ponto e virgula: color",
    ]);
  });

  it("reprova ponto e virgula repetido", () => {
    expect(validarCss("a { color: red;; }")).toEqual([
      "ponto e virgula repetido",
    ]);
  });

  it("reprova duas declaracoes na mesma linha", () => {
    expect(validarCss(".x { aspect-ratio: 16 / 9; gap: 1rem; }")).toEqual([
      "mais de uma declaracao na mesma linha (use uma por linha)",
    ]);
  });

  it("reprova propriedade fora de minusculas", () => {
    expect(validarCss("a { Color: red; }")).toContain(
      "propriedade fora de minusculas: Color",
    );
  });

  it("reprova indentacao impar", () => {
    expect(validarCss("a {\n   color: red;\n}")).toContain(
      "linha 2: indentacao de 3 espacos (use multiplos de 2)",
    );
  });
});

describe("validarCss: os dois limites que o css-tree sozinho deixa passar", () => {
  it("reprova combinador repetido", () => {
    expect(validarCss(".nav > > a { color: red; }")).toEqual([
      "seletor com combinador repetido: .nav>>a",
    ]);
  });

  it("reprova media feature com erro de digitacao", () => {
    expect(
      validarCss("@media (min-widht: 600px) {\n  p {\n    color: red;\n  }\n}"),
    ).toEqual(["media feature fora da lista da trilha: min-widht"]);
  });

  it("aceita a media feature escrita certo", () => {
    expect(
      validarCss("@media (min-width: 600px) {\n  p {\n    color: red;\n  }\n}"),
    ).toEqual([]);
  });
});

describe("validarCss: css valido passa", () => {
  const PASSA: [string, string][] = [
    ["atalho margin", ".c { margin: 0 auto; }"],
    ["grid com repeat", ".g { grid-template-columns: repeat(3, 1fr); }"],
    [
      "propriedade customizada e var()",
      ":root {\n  --cor: #333;\n}\n\np {\n  color: var(--cor);\n}",
    ],
    ["pseudo-classe", "a:hover { color: blue; }"],
    ["pseudo-elemento com content", 'p::before { content: ""; }'],
    ["clamp", "h1 { font-size: clamp(1.5rem, 4vw, 3rem); }"],
    [
      "duas declaracoes em duas linhas",
      ".x {\n  aspect-ratio: 16 / 9;\n  gap: 1rem;\n}",
    ],
    ["transition", ".x { transition: opacity 0.2s ease-in-out; }"],
    ["rgb com barra", "p { color: rgb(0 0 0 / 50%); }"],
    [
      "keyframes",
      "@keyframes sobe { from { opacity: 0; } to { opacity: 1; } }",
    ],
    ["object-fit", "img { object-fit: cover; }"],
    [
      "prefers-reduced-motion",
      "@media (prefers-reduced-motion: reduce) {\n  .a {\n    transition: none;\n  }\n}",
    ],
  ];
  for (const [rotulo, css] of PASSA) {
    it(`aceita ${rotulo}`, () => {
      expect(validarCss(css)).toEqual([]);
    });
  }
});

describe("prosaIdInterno: id de passo exposto na prosa", () => {
  const registro: RoadmapV2[] = [
    {
      slug: "teste",
      title: "Teste",
      description: "d",
      level: "Iniciante",
      sections: [
        {
          id: "s1",
          title: "S1",
          children: [
            { id: "html.seo", title: "SEO basico", content: "" },
            { id: "outro.passo", title: "Outro", content: "" },
          ],
        },
      ],
    } as unknown as RoadmapV2,
  ];
  const ids = idsDePasso(registro);

  it("o universo de ids sai do registro", () => {
    expect([...ids].sort()).toEqual(["html.seo", "outro.passo"]);
  });

  it("reprova codigo inline que e exatamente um id de passo", () => {
    expect(prosaIdInterno("veja o passo `html.seo` depois", ids)).toEqual([
      "id interno de passo exposto na prosa: html.seo",
    ]);
  });

  it("aceita codigo inline que so parece id", () => {
    expect(prosaIdInterno("use `lista.map` para isso", ids)).toEqual([]);
  });

  it("nao olha dentro das cercas", () => {
    expect(prosaIdInterno("```js\n// `html.seo`\n```", ids)).toEqual([]);
  });

  it("prosaDaTrilha junta o id exposto ao HTML cru", () => {
    const trilha = {
      slug: "t",
      sections: [
        {
          id: "s",
          title: "S",
          children: [
            { id: "p1", title: "P1", content: "olhe o passo `html.seo`." },
          ],
        },
      ],
    } as unknown as RoadmapV2;
    expect(prosaDaTrilha(trilha, ids)).toEqual([
      {
        passo: "p1",
        problemas: ["id interno de passo exposto na prosa: html.seo"],
      },
    ]);
  });

  it("sem os ids, a conferencia nao acusa nada (controle)", () => {
    expect(prosaIdInterno("veja o passo `html.seo`", new Set())).toEqual([]);
  });
});

// Lote 10a. Duas contagens de linha (conteudo e total) e os metadados de
// cerca. Os controles de `lanca=` e de `arquivo=` usam o EXECUTOR REAL, e nao
// stub: o que eles precisam provar e que o processo filho quebra (ou nao) do
// jeito declarado, e um stub provaria so o meu if.
describe("limites: conteudo e total contam separado", () => {
  const bash = (corpo: string) =>
    conferirBloco({ linguagem: "bash", corpo }, ["bash"], () =>
      executorQueRoda(),
    );

  it("reprova 11 linhas de conteudo", () => {
    const corpo = Array.from({ length: 11 }, () => "$ git status").join("\n");
    expect(bash(corpo).problemas.join(" ")).toContain("11 linhas de conteudo");
  });

  it("reprova 13 linhas no total", () => {
    // 9 de conteudo e 4 em branco: passa no limite de conteudo e estoura o total.
    const corpo = Array.from({ length: 9 }, () => "$ git status")
      .join("\n")
      .concat("\n\n\n\n");
    const problemas = bash(corpo).problemas.join(" ");
    expect(problemas).toContain("13 linhas no total");
    expect(problemas).not.toContain("linhas de conteudo");
  });

  it("aceita 10 de conteudo com 2 em branco", () => {
    const linhas = Array.from({ length: 10 }, () => "$ git status");
    linhas.splice(3, 0, "");
    linhas.splice(7, 0, "");
    expect(bash(linhas.join("\n")).problemas).toEqual([]);
  });
});

describe("lerCerca: metadados da cerca", () => {
  it("le linguagem, lanca e arquivo", () => {
    expect(lerCerca("js lanca=TypeError")).toEqual({
      linguagem: "js",
      lanca: "TypeError",
      arquivo: undefined,
      problemasDaCerca: [],
    });
    expect(lerCerca("js arquivo=mat.js").arquivo).toBe("mat.js");
  });

  it("reprova metadado desconhecido", () => {
    expect(lerCerca("js lanka=TypeError").problemasDaCerca).toEqual([
      "metadado desconhecido na cerca: lanka",
    ]);
  });

  it("reprova nome de arquivo que sai do diretorio", () => {
    expect(lerCerca("js arquivo=../fora.js").problemasDaCerca).toEqual([
      "nome de arquivo invalido na cerca: ../fora.js",
    ]);
    expect(lerCerca("js arquivo=sub/dir.js").problemasDaCerca.length).toBe(1);
  });

  it("cerca sem metadado continua igual", () => {
    expect(lerCerca("js").linguagem).toBe("js");
    expect(lerCerca("js").problemasDaCerca).toEqual([]);
  });
});

describe("lanca= no executor real", () => {
  const js = capabilityOf("js").runner!;

  it("aceita o bloco que lanca o tipo declarado", () => {
    const r = conferirBloco(
      {
        linguagem: "js",
        corpo: "const pedido = undefined;\nconsole.log(pedido.itens);",
        lanca: "TypeError",
      },
      ["js"],
      makeExecutor(js),
    );
    expect(r.veredito).toBe("lancou-como-esperado");
    expect(r.problemas).toEqual([]);
  }, 30000);

  it("reprova o bloco que declarou lanca e rodou limpo", () => {
    const r = conferirBloco(
      { linguagem: "js", corpo: "console.log(1);", lanca: "TypeError" },
      ["js"],
      makeExecutor(js),
    );
    expect(r.veredito).toBe("falhou");
    expect(r.problemas.join(" ")).toContain("rodou sem erro");
  }, 30000);

  it("reprova o bloco que lancou outro tipo", () => {
    const r = conferirBloco(
      {
        linguagem: "js",
        corpo: "throw new RangeError('fora');",
        lanca: "TypeError",
      },
      ["js"],
      makeExecutor(js),
    );
    expect(r.veredito).toBe("falhou");
    expect(r.problemas.join(" ")).toContain("RangeError");
  }, 30000);

  it("aceita lanca= em python", () => {
    const r = conferirBloco(
      {
        linguagem: "python",
        corpo: "print(1 / 0)",
        lanca: "ZeroDivisionError",
      },
      ["python"],
      makeExecutor(capabilityOf("python").runner!),
    );
    expect(r.veredito).toBe("lancou-como-esperado");
  }, 30000);
});

describe("arquivo= agrupa os blocos do passo", () => {
  const grupo = (appCorpo: string) =>
    conferirGrupo(
      [
        {
          linguagem: "js",
          arquivo: "mat.js",
          corpo: "export function dobro(n) {\n  return n * 2;\n}",
        },
        { linguagem: "js", arquivo: "app.js", corpo: appCorpo },
      ],
      ["js"],
      makeGroupExecutor(capabilityOf("js").runner!),
    );

  it("o par mat.js e app.js roda, e so o ultimo executa", () => {
    const r = grupo(
      "import { dobro } from './mat.js';\nconsole.log(dobro(2));",
    );
    expect(r.map((x) => x.veredito)).toEqual(["gravado", "executado"]);
    expect(r.flatMap((x) => x.problemas)).toEqual([]);
  }, 30000);

  it("reprova quando o ultimo importa o que o primeiro nao exporta", () => {
    const r = grupo(
      "import { triplo } from './mat.js';\nconsole.log(triplo(2));",
    );
    expect(r[0].veredito).toBe("gravado");
    expect(r[1].veredito).toBe("falhou");
    expect(r[1].problemas.join(" ")).toContain("triplo");
  }, 30000);
});
