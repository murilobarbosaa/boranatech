import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * A ferramenta passada para `checkAiDailyLimit` e a passada para `logAiUsage`
 * PRECISAM ser o mesmo identificador, dentro de cada rota.
 *
 * Se divergirem, a reserva e criada com um nome e a confirmacao procura por
 * outro: a linha fica `reserved`, consome cota da pessoa por 10 minutos, e nada
 * acusa. O caso nao e hipotetico. Na Fase 3 o literal `"github-perfil"` foi
 * passado para a reserva enquanto o log usava `` const tool = `github-${mode}` ``:
 * para qualquer modo diferente de "perfil" as duas divergiam.
 *
 * O teste enumera as rotas DA FONTE, nao de lista: qualquer arquivo em
 * `server/routes` que chame `checkAiDailyLimit` entra sozinho.
 *
 * POR QUE AST E NAO REGEX (2026-08-05). A versao anterior lia a fonte com
 * expressao regular, e o 4o argumento saia de `([^)\s]+)\s*\)`. Isso amarrava o
 * teste ao LAYOUT do codigo: quando um `prettier --write` reflowou
 * `checkAiDailyLimit(userId, !!req.isPro, "[github]", tool)` para a forma
 * multilinha, a captura passou a ser `tool,` (com a virgula final) e o teste
 * quebrou sem ninguem ter tocado em rota nenhuma. Como `pnpm format` reescreve
 * o repositorio inteiro, esse era um vermelho garantido para o futuro.
 *
 * O agravante era a categoria: um instrumento de verificacao cujo escopo e
 * derivado por um parser que pode sub-casar em silencio. Aqui o defeito
 * apareceu quebrando, mas a mesma captura poderia ter passado a devolver algo
 * plausivel e errado. O AST nao sub-casa: ele le o 4o argumento como no,
 * qualquer que seja a formatacao, e distingue identificador de literal por
 * TIPO, nao por aparencia.
 *
 * O que o AST NAO substitui: a asserção de TOTAL. Ele responde "o que declarei
 * esta correto?" e nao responde "o que existe esta declarado?". Um arquivo de
 * rota novo que ninguem tenha lembrado de cobrir so e pego pelas contagens
 * `ARQUIVOS_ESPERADOS` e `SITIOS_ESPERADOS`, cuja alteracao e ato deliberado,
 * no mesmo commit que cria a rota.
 */

const ROUTES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "routes",
);

// Mesmo contrato do EXPECTED_TABLE_COUNT: mexer nestes numeros e deliberado, no
// commit que cria ou remove a chamada.
const ARQUIVOS_ESPERADOS = 8;
const SITIOS_ESPERADOS = 9;

// Como o 4o argumento de checkAiDailyLimit foi escrito. `literal` e o modo de
// falha (nao acompanha o identificador do log); `outro` cobre o que nao for
// nem identificador nem literal, para nada passar sem classificacao.
type FormaDoArgumento = "identificador" | "literal" | "outro";

interface Sitio {
  arquivo: string;
  texto: string;
  forma: FormaDoArgumento;
}

interface Rota {
  arquivo: string;
  toolDaReserva: string;
  formaDaReserva: FormaDoArgumento;
  toolsDoLog: string[];
}

/**
 * O criterio de "isto e uma rota de producao", nomeado para poder ser testado.
 *
 * Era um predicado inline dentro do `filter`, e um predicado inline nao tem como
 * ser exercitado com nome forjado: so dava para conferir o efeito dele sobre os
 * arquivos que por acaso existem no diretorio hoje. Nomeado, ele responde a
 * pergunta direta ("este nome entra na varredura?") para qualquer nome, inclusive
 * os que ainda nao existem.
 */
export function ehArquivoDeRota(nome: string): boolean {
  return nome.endsWith(".ts") && !/\.test\.tsx?$/.test(nome);
}

function parse(arquivo: string, fonte: string): ts.SourceFile {
  return ts.createSourceFile(
    arquivo,
    fonte,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
}

function nomeDaChamada(node: ts.CallExpression): string | null {
  return ts.isIdentifier(node.expression) ? node.expression.text : null;
}

function formaDe(node: ts.Expression): FormaDoArgumento {
  if (ts.isIdentifier(node)) return "identificador";
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isTemplateExpression(node)
  ) {
    return "literal";
  }
  return "outro";
}

/** Nome da propriedade `tool` de um objeto literal, nas duas formas do JS. */
function toolDoObjeto(obj: ts.ObjectLiteralExpression): string | null {
  for (const p of obj.properties) {
    const nome = p.name && ts.isIdentifier(p.name) ? p.name.text : null;
    // `{ tool }`: o identificador se chama literalmente `tool`.
    if (ts.isShorthandPropertyAssignment(p) && p.name.text === "tool") {
      return "tool";
    }
    // `{ tool: IDENT }`.
    if (ts.isPropertyAssignment(p) && nome === "tool") {
      if (ts.isIdentifier(p.initializer)) return p.initializer.text;
      return p.initializer.getText(obj.getSourceFile());
    }
  }
  return null;
}

function lerRotas(): { rotas: Rota[]; sitios: Sitio[] } {
  const rotas: Rota[] = [];
  const sitios: Sitio[] = [];

  // ARQUIVO DE TESTE NAO E ROTA. A varredura audita as rotas de producao de
  // `server/routes`; um teste que mora ali e chama `checkAiDailyLimit` num duble
  // nao declara ferramenta nenhuma, e passaria a ser cobrado como se declarasse.
  // O buraco existia desde sempre e so apareceu quando o primeiro teste de rota
  // passou a chamar a funcao direto (Fase 4, lote 2): ele acusou tres falhas
  // sobre um "arquivo de rota" que e um `.test.ts`. A assercao de TOTAL de
  // arquivos, logo abaixo, continua sendo o anteparo contra este filtro esconder
  // uma rota de verdade.
  for (const arquivo of readdirSync(ROUTES).filter(ehArquivoDeRota)) {
    const fonte = readFileSync(path.join(ROUTES, arquivo), "utf8");
    const sf = parse(arquivo, fonte);

    const reservasDoArquivo: Sitio[] = [];
    const logsDoArquivo: string[] = [];

    const visitar = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const nome = nomeDaChamada(node);
        if (nome === "checkAiDailyLimit") {
          // checkAiDailyLimit(userId, isPro, escopo, TOOL): o 4o argumento e o
          // indice 3. Ausente significa "usou o default", que tambem precisa
          // aparecer, e nao silenciosamente.
          const arg = node.arguments[3];
          const s: Sitio = arg
            ? { arquivo, texto: arg.getText(sf), forma: formaDe(arg) }
            : { arquivo, texto: "(4o argumento ausente)", forma: "outro" };
          reservasDoArquivo.push(s);
          sitios.push(s);
        }
        if (nome === "logAiUsage") {
          const arg = node.arguments[0];
          if (arg && ts.isObjectLiteralExpression(arg)) {
            const t = toolDoObjeto(arg);
            if (t) logsDoArquivo.push(t);
          }
        }
      }
      ts.forEachChild(node, visitar);
    };
    visitar(sf);

    if (reservasDoArquivo.length === 0) continue;

    const vistos = new Set<string>();
    for (const r of reservasDoArquivo) {
      if (vistos.has(r.texto)) continue;
      vistos.add(r.texto);
      rotas.push({
        arquivo,
        toolDaReserva: r.texto,
        formaDaReserva: r.forma,
        toolsDoLog: Array.from(new Set(logsDoArquivo)),
      });
    }
  }
  return { rotas, sitios };
}

/**
 * `const tool = <template>` declarado no arquivo? Substitui o antigo
 * `fonte.toContain("const tool = \`github-${mode}\`")`, que era casamento de
 * texto dentro do teste que existe para nao depender de texto.
 */
function declaraToolComoTemplate(arquivo: string): boolean {
  const fonte = readFileSync(path.join(ROUTES, arquivo), "utf8");
  const sf = parse(arquivo, fonte);
  let achou = false;
  const visitar = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "tool" &&
      node.initializer &&
      ts.isTemplateExpression(node.initializer)
    ) {
      achou = true;
    }
    ts.forEachChild(node, visitar);
  };
  visitar(sf);
  return achou;
}

const { rotas, sitios } = lerRotas();

describe("o filtro da varredura: teste nao e rota", () => {
  // O FILTRO ja existia desde a Fase 4 lote 2, mas nao tinha prova propria: o
  // unico jeito de saber se ele funcionava era o efeito colateral de a suite
  // ficar verde. Isso responde "funcionou hoje", nao "funciona".
  it("arquivo de PRODUCAO forjado entra na varredura", () => {
    for (const nome of [
      "linkedin.ts",
      "ai.ts",
      "rotaQueAindaNaoExiste.ts",
      "testes.ts",
      "contest.ts",
    ]) {
      expect(ehArquivoDeRota(nome), nome).toBe(true);
    }
  });

  it("arquivo de TESTE forjado NAO entra", () => {
    for (const nome of [
      "linkedin.test.ts",
      "linkedinAnaliseEmAndamento.test.ts",
      "algumaCoisa.test.tsx",
    ]) {
      expect(ehArquivoDeRota(nome), nome).toBe(false);
    }
  });

  it("o que nem e TypeScript fica de fora", () => {
    for (const nome of ["README.md", "rota.js", "rota.ts.snap", "pasta"]) {
      expect(ehArquivoDeRota(nome), nome).toBe(false);
    }
  });

  it("o filtro nao esconde nenhuma rota que existe hoje", () => {
    // O outro sentido: o filtro poderia estar apertado demais e sumir com uma
    // rota de verdade. A assercao de TOTAL de arquivos (mais abaixo) ja pega
    // isso, e esta aqui explicita porque e a metade que se costuma esquecer.
    const todos = readdirSync(ROUTES);
    const deProducao = todos.filter(ehArquivoDeRota);
    const deTeste = todos.filter((f) => /\.test\.tsx?$/.test(f));
    expect(deProducao.length).toBeGreaterThan(10);
    expect(deTeste.length).toBeGreaterThan(0);
    // Nenhum arquivo `.ts` do diretorio some das duas listas somadas.
    const ts = todos.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
    expect(deProducao.length + deTeste.length).toBe(ts.length);
  });
});

describe("identificador de ferramenta: reserva e log usam o mesmo", () => {
  it("a enumeracao nao encolheu em silencio", () => {
    const arquivos = new Set(rotas.map((r) => r.arquivo));
    // Array.from e nao spread: o tsconfig da aplicacao nao declara `target`,
    // entao cai em ES5 e `[...set]` nao compila (TS2802).
    expect(
      arquivos.size,
      `arquivos: ${Array.from(arquivos).sort().join(", ")}`,
    ).toBe(ARQUIVOS_ESPERADOS);
    expect(sitios.length).toBe(SITIOS_ESPERADOS);
  });

  it("NENHUMA rota passa string literal para a reserva", () => {
    for (const r of rotas) {
      expect(
        r.formaDaReserva,
        `${r.arquivo}: reserva recebe ${r.formaDaReserva} (${r.toolDaReserva})`,
      ).toBe("identificador");
    }
  });

  it("o identificador da reserva tambem e usado em algum logAiUsage da rota", () => {
    for (const r of rotas) {
      expect(
        r.toolsDoLog,
        `${r.arquivo}: reserva usa ${r.toolDaReserva}, logs usam ${r.toolsDoLog.join(", ")}`,
      ).toContain(r.toolDaReserva);
    }
  });

  it("github usa a MESMA variavel dinamica nos dois lados", () => {
    const gh = rotas.find((r) => r.arquivo === "github.ts");
    expect(gh).toBeDefined();
    expect(gh!.toolDaReserva).toBe("tool");
    expect(declaraToolComoTemplate("github.ts")).toBe(true);
  });

  it("todo sitio foi classificado: nenhum caiu em 'outro'", () => {
    // Aborto em item nao classificado. Sem isto, uma forma nova de escrever o
    // argumento (spread, chamada de funcao, ternario) passaria como se tivesse
    // sido verificada.
    const naoClassificados = sitios.filter((s) => s.forma === "outro");
    expect(
      naoClassificados,
      `sitios sem classificacao: ${naoClassificados.map((s) => `${s.arquivo}:${s.texto}`).join(", ")}`,
    ).toEqual([]);
  });
});
