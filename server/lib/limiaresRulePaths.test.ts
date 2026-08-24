import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O `paths` da regra nao pode parar de cobrir o `FONTES` do script.
 *
 * POR QUE ESTE TESTE EXISTE, com data: em 2026-08-18 tres sitios numericos
 * orfaos nasceram em `server/lib/linkedinAnalyze.ts`. O arquivo estava no
 * `FONTES` de `scripts/mutateLinkedinThresholds.mjs` (logo, auditado pelo
 * `check:limiares`) e FORA do `paths` de `.claude/rules/linkedin-limiares.md`
 * (logo, a regra que manda classificar nao carregava ao editar aquele arquivo).
 * Duas listas descrevendo a mesma coisa, nada comparando as duas, e a copia
 * envelheceu calada ate a `main` ficar vermelha.
 *
 * UMA DIRECAO SO, e isso e deliberado. O teste exige que todo arquivo do
 * `FONTES` esteja coberto por algum padrao do `paths`. O inverso (um `paths`
 * mais largo que o `FONTES`) e PERMITIDO: hoje `client/src/components/linkedin`
 * esta no `paths` e nunca esteve no `FONTES`, porque a regra carrega ali para
 * dar contexto mesmo sem o guard auditar o diretorio. A assimetria esta escrita
 * na propria regra; travar o inverso aqui quebraria uma decisao registrada.
 */

const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/**
 * Extrai os literais entre aspas de um bloco de texto.
 *
 * `String.match` com flag global, e nao `matchAll` espalhado: o `tsconfig.json`
 * da aplicacao nao declara `target`, entao cai em ES5 e sem `downlevelIteration`
 * iterar o retorno de `matchAll` reprova no `pnpm check` (TS2802). O CLAUDE.md
 * ja registra essa armadilha; aqui ela apareceu de novo.
 */
function aspasDe(bloco: string): string[] {
  return (bloco.match(/"[^"]+"/g) ?? []).map((t) => t.slice(1, -1));
}

const SCRIPT = "scripts/mutateLinkedinThresholds.mjs";
const REGRA = ".claude/rules/linkedin-limiares.md";

/**
 * Parse TEXTUAL do `FONTES`, e nao `import`, por necessidade e nao por gosto.
 *
 * O `.mjs` nao exporta a constante, e ele tem efeito no topo do modulo: ao ser
 * avaliado sem argumentos ele percorre a lista de mutantes, REESCREVE arquivos
 * da fonte e chama a suite por mutante. Importar isso dentro de um teste seria
 * rodar a auditoria completa a cada execucao da suite, editando o repositorio
 * no caminho. O custo do parse e depender do formato do literal; o custo do
 * import seria destruir a arvore de trabalho.
 */
function lerFontes(): string[] {
  const fonte = readFileSync(path.join(RAIZ, SCRIPT), "utf8");
  const bloco = /const FONTES = \[([\s\S]*?)\];/.exec(fonte);
  if (!bloco) {
    throw new Error(
      `${SCRIPT}: nao achei a declaracao 'const FONTES = [...]'. Se o formato mudou, este parse precisa acompanhar.`,
    );
  }
  return aspasDe(bloco[1]);
}

/** Parse do frontmatter YAML da regra, so a lista `paths`. */
function lerPaths(): string[] {
  const texto = readFileSync(path.join(RAIZ, REGRA), "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(texto);
  if (!fm) {
    throw new Error(`${REGRA}: nao achei o frontmatter delimitado por ---.`);
  }
  const bloco = /paths:\n((?:\s*-\s*"[^"]+"\n)+)/.exec(fm[1]);
  if (!bloco) {
    throw new Error(`${REGRA}: nao achei a lista 'paths:' no frontmatter.`);
  }
  return aspasDe(bloco[1]);
}

/**
 * Casamento MINIMO, so para as duas formas que os padroes de hoje usam:
 * caminho exato e prefixo terminado em `/**`, que e como o git trata "tudo
 * abaixo deste diretorio".
 *
 * Nao ha util de glob nas dependencias do projeto (conferido em 2026-08-18:
 * nem minimatch, nem picomatch, nem micromatch estao no `package.json`), e
 * acrescentar dependencia para quatro padroes seria desproporcional.
 *
 * O LIMITE E EXPLICITO E LANCA. Um padrao com `*` simples, `?` ou chaves cai no
 * `throw` abaixo em vez de devolver `false` em silencio. Devolver `false` faria
 * o teste falhar com a mensagem errada ("arquivo nao coberto") escondendo a
 * causa real ("o matcher nao entende este padrao"); devolver `true` seria pior,
 * porque passaria. Quem acrescentar um padrao novo tem de estender isto aqui.
 */
function cobre(padrao: string, arquivo: string): boolean {
  if (padrao.endsWith("/**")) {
    const prefixo = padrao.slice(0, -2);
    return arquivo.startsWith(prefixo);
  }
  if (/[*?{}[\]]/.test(padrao)) {
    throw new Error(
      `padrao nao suportado pelo matcher minimo deste teste: "${padrao}". Estenda 'cobre()' ou traga um util de glob.`,
    );
  }
  return arquivo === padrao;
}

/** Arquivos do FONTES que nenhum padrao do paths alcanca. */
function naoCobertos(fontes: string[], paths: string[]): string[] {
  return fontes.filter((f) => !paths.some((p) => cobre(p, f)));
}

describe("paths da regra de limiares x FONTES do script", () => {
  const fontes = lerFontes();
  const paths = lerPaths();

  /**
   * O parse precisa provar que LEU alguma coisa antes de qualquer veredito.
   * Sem isto, um regex que deixasse de casar devolveria lista vazia e
   * `naoCobertos([])` seria `[]`, ou seja, o teste passaria afirmando cobertura
   * total sobre nada. E a classe de instrumento que falha PASSANDO, e este
   * arquivo inteiro existe por causa dela.
   *
   * NAO congelo a contagem exata (o contrato do `EXPECTED_TABLE_COUNT`) de
   * proposito: ali o numero mudar e evento raro e deliberado, aqui acrescentar
   * fonte e a operacao normal que este teste existe para acompanhar. Travar o
   * total cobraria um segundo commit em toda adicao legitima. As ancoras abaixo
   * pegam um parse quebrado sem esse custo.
   */
  it("o parse leu as duas listas de verdade", () => {
    expect(fontes.length).toBeGreaterThan(0);
    expect(paths.length).toBeGreaterThan(0);
    expect(fontes).toContain("server/lib/linkedinAnalyze.ts");
    expect(fontes).toContain("shared/linkedin/parse.ts");
    expect(paths).toContain("shared/linkedin/**");
  });

  it("todo arquivo do FONTES e coberto por algum padrao do paths", () => {
    expect(
      naoCobertos(fontes, paths),
      `arquivo(s) auditado(s) pelo check:limiares e fora do 'paths' de ${REGRA}. ` +
        `A regra nao vai carregar ao editar esses arquivos, que foi como os tres ` +
        `orfaos de 2026-08-18 entraram. Acrescente o caminho ao frontmatter.`,
    ).toEqual([]);
  });

  /**
   * CONTROLE NEGATIVO, no molde da prova de bloqueio exigida quando o
   * `check:limiares` entrou no hook: um teste que so afirma "esta tudo coberto"
   * passaria igual sobre um comparador quebrado que nunca acusa nada.
   *
   * Listas SINTETICAS, e nao as do repositorio, para este caso nao pegar carona
   * no estado real: se um dia o `paths` regredir, o assert de cima e que tem de
   * falhar, com a mensagem que nomeia o arquivo. Um controle negativo que cai
   * junto so acrescenta ruido ao diagnostico.
   */
  it("CONTROLE NEGATIVO: fonte fora do paths E acusada", () => {
    expect(naoCobertos(["server/lib/fora.ts"], ["shared/linkedin/**"])).toEqual(
      ["server/lib/fora.ts"],
    );
    // E o outro lado: dentro do prefixo e por caminho exato, nao acusa.
    expect(
      naoCobertos(["shared/linkedin/parse.ts"], ["shared/linkedin/**"]),
    ).toEqual([]);
    expect(naoCobertos(["server/lib/x.ts"], ["server/lib/x.ts"])).toEqual([]);
  });

  it("CONTROLE NEGATIVO: prefixo parecido NAO conta como coberto", () => {
    // `shared/linkedinOutro/` comeca com a mesma string que `shared/linkedin`,
    // e um matcher escrito com `startsWith` sobre o prefixo SEM a barra diria
    // que esta coberto. O `padrao.slice(0, -2)` preserva a barra justamente
    // para isso, e este caso trava a decisao.
    expect(
      naoCobertos(["shared/linkedinOutro/parse.ts"], ["shared/linkedin/**"]),
    ).toEqual(["shared/linkedinOutro/parse.ts"]);
  });

  it("CONTROLE NEGATIVO: padrao nao suportado LANCA, nao devolve false", () => {
    expect(() =>
      cobre("server/lib/linkedin*.ts", "server/lib/linkedinX.ts"),
    ).toThrow(/nao suportado/);
  });
});
