// Estrutura de html e css para os verificadores (Lote 08).
//
// Modulo proprio, e nao dentro do verifyLessonBlocks, porque o verificador de
// blocos importa o executor do verifyQuizPoolByExecution, e a tabela de
// revisao da pool (verifyQuizPoolByExecution) precisa do estruturaHtml: com o
// codigo aqui, os dois importam deste lado e nao existe ciclo. Mesma licao das
// capacidades de linguagem no Lote 07.
import {
  generate as generateCss,
  lexer as lexerCss,
  parse as parseCss,
  walk as walkCss,
} from "css-tree";
import { JSDOM } from "jsdom";

// ---------- estrutura de html e css (Lote 08) ----------

// Elementos void do padrao HTML: nao tem tag de fechamento, escritos com ou
// sem barra.
const VOID_HTML = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// Elementos que o PARSER insere sozinho e a trilha nao escreve (tbody dentro
// de table, colgroup): o enxerto e normal e nao pode reprovar. Sao descartados
// dos DOIS lados da comparacao.
const IMPLICITOS_HTML = new Set(["tbody", "colgroup"]);

// Dentro de script e style o conteudo e texto cru: o que parece tag la nao e.
const TEXTO_CRU_HTML = new Set(["script", "style"]);

interface NoHtml {
  tag: string;
  filhos: NoHtml[];
}

// Arvore que o TEXTO descreve, por pilha explicita, com os problemas de
// abertura e fechamento. Fechamento opcional omitido (</li>, </p>) cai aqui
// como tag nunca fechada: a trilha ensina a fechar tudo.
function arvoreDoTexto(corpo: string): {
  arvore: NoHtml[];
  problemas: string[];
} {
  const problemas: string[] = [];
  const raiz: NoHtml = { tag: "#raiz", filhos: [] };
  const pilha: NoHtml[] = [raiz];
  const re =
    /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>|<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
  let cru: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(corpo)) !== null) {
    const fecha = m[1] ? m[1].toLowerCase() : null;
    const abre = m[2] ? m[2].toLowerCase() : null;
    if (cru !== null) {
      if (fecha !== cru) continue;
      cru = null;
    }
    if (fecha) {
      const alvo = pilha.map((no) => no.tag).lastIndexOf(fecha);
      if (alvo <= 0) {
        problemas.push(`</${fecha}> fecha o que nao foi aberto`);
        continue;
      }
      for (let i = pilha.length - 1; i > alvo; i -= 1) {
        problemas.push(`<${pilha[i].tag}> aberta e nunca fechada`);
      }
      pilha.length = alvo;
      continue;
    }
    if (abre) {
      const no: NoHtml = { tag: abre, filhos: [] };
      pilha[pilha.length - 1].filhos.push(no);
      if (VOID_HTML.has(abre)) continue;
      if (TEXTO_CRU_HTML.has(abre)) cru = abre;
      pilha.push(no);
    }
  }
  for (let i = pilha.length - 1; i > 0; i -= 1) {
    problemas.push(`<${pilha[i].tag}> aberta e nunca fechada`);
  }
  return { arvore: raiz.filhos, problemas };
}

function serializarArvore(nos: NoHtml[]): string {
  return nos
    .map((no) =>
      IMPLICITOS_HTML.has(no.tag)
        ? serializarArvore(no.filhos)
        : `${no.tag}(${serializarArvore(no.filhos)})`,
    )
    .join(",");
}

// Arvore que o NAVEGADOR monta, pelo jsdom. Documento (comeca com doctype ou
// html) passa pelo parser de documento; o resto e fragmento.
function arvoreDoParser(corpo: string): NoHtml[] {
  const texto = corpo.trimStart();
  const converter = (el: Element): NoHtml => ({
    tag: el.tagName.toLowerCase(),
    filhos: Array.from(el.children).map(converter),
  });
  if (/^<!doctype/i.test(texto) || /^<html[\s>]/i.test(texto)) {
    return [converter(new JSDOM(corpo).window.document.documentElement)];
  }
  return Array.from(JSDOM.fragment(corpo).children).map(converter);
}

// Marcacao que so vale porque o parser conserta e defeito: o bloco da licao
// precisa valer por si.
export function estruturaHtml(corpo: string): string[] {
  const { arvore, problemas } = arvoreDoTexto(corpo);
  if (problemas.length > 0) return problemas;
  const escrita = serializarArvore(arvore);
  const lida = serializarArvore(arvoreDoParser(corpo));
  if (escrita !== lida) {
    return [
      `o parser recuperou o aninhamento: escrito ${escrita}, lido ${lida}`,
    ];
  }
  return [];
}

// Css raso: so chaves balanceadas, ignorando comentario e string. Continua
// existindo depois do validarCss (Lote 09) porque e ele que pega o bloco sem
// fechar: o css-tree fecha o bloco sozinho e nao reclama.
export function estruturaCss(corpo: string): string[] {
  const limpo = corpo
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/"[^"]*"|'[^']*'/g, '""');
  const problemas: string[] = [];
  let nivel = 0;
  for (const ch of limpo) {
    if (ch === "{") {
      nivel += 1;
    } else if (ch === "}") {
      if (nivel === 0) {
        problemas.push("} fecha bloco que nao foi aberto");
        return problemas;
      }
      nivel -= 1;
    }
  }
  if (nivel > 0) problemas.push(`${nivel} bloco com { sem fechar`);
  return problemas;
}

// ---------- validacao de css (Lote 09) ----------

// Features de media que a trilha usa. A lista e FECHADA de proposito e falha
// FECHANDO: feature fora dela vira problema, e nao "desconhecida, deixa
// passar". O motivo e que o css-tree 3.2.1 nao enumera nomes de media feature
// (no gramatica dele sao <mf-name>, um ident qualquer), entao `min-widht`
// passa limpo pelo lexer. Uma lista permissiva aqui seria a armadilha do
// CLAUDE.md: guard que responde "os que eu conheco estao la" e nao acusa nada.
// Feature nova num bloco futuro derruba a verificacao e exige decisao
// deliberada, que e o comportamento desejado.
const MEDIA_FEATURES_DA_TRILHA = new Set([
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "orientation",
  "prefers-color-scheme",
  "prefers-reduced-motion",
  "hover",
  "pointer",
  "width",
  "height",
]);

// Remove comentario e conteudo de string, preservando o comprimento das linhas
// (para as conferencias por texto nao se confundirem com ponto e virgula ou
// chave que morem dentro de um valor textual).
function cssSemComentarioNemString(corpo: string): string {
  return corpo
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(
      /"[^"\n]*"|'[^'\n]*'/g,
      (m) => '"' + " ".repeat(Math.max(0, m.length - 2)) + '"',
    );
}

// Conferencias de CONVENCAO da trilha, feitas sobre o texto: elas falam de
// como o bloco e escrito, e o AST normaliza justamente isso.
function convencoesCss(corpo: string): string[] {
  const problemas: string[] = [];
  const limpo = cssSemComentarioNemString(corpo);
  const linhas = limpo.split("\n");

  if (/;\s*;/.test(limpo)) problemas.push("ponto e virgula repetido");

  linhas.forEach((linha, i) => {
    if (linha.trim() === "") return;
    if (/^\s*\t/.test(linha)) {
      problemas.push(`linha ${i + 1}: indentacao com tabulacao`);
      return;
    }
    const recuo = linha.length - linha.trimStart().length;
    if (recuo % 2 !== 0) {
      problemas.push(
        `linha ${i + 1}: indentacao de ${recuo} espacos (use multiplos de 2)`,
      );
    }
  });

  return problemas;
}

// Validacao de um bloco de CSS da trilha: estrutura de chaves, parse e lexer
// do css-tree, e as convencoes de escrita.
//
// Duas excecoes deliberadas no lexer: propriedade customizada (--nome) nao tem
// gramatica para casar, e valor que contenha var() nao e casavel no css-tree
// 3.2.1 (o lexer nao resolve a substituicao), entao seria alarme falso.
export function validarCss(corpo: string): string[] {
  const problemas = [...estruturaCss(corpo)];
  if (problemas.length > 0) return problemas;

  const ast = parseCss(corpo, {
    positions: true,
    onParseError(erro) {
      problemas.push(`parse: ${erro.message}`);
    },
  });

  walkCss(ast, {
    visit: "Declaration",
    enter(node) {
      const propriedade = node.property ?? "";
      if (propriedade !== propriedade.toLowerCase()) {
        problemas.push(`propriedade fora de minusculas: ${propriedade}`);
      }
      if (propriedade.startsWith("--")) return;
      if (!node.value) return;
      if (generateCss(node.value).includes("var(")) return;
      const resultado = lexerCss.matchProperty(propriedade, node.value);
      if (resultado.error) {
        problemas.push(
          `valor invalido em ${propriedade}: ${resultado.error.message.split("\n")[0]}`,
        );
      }
    },
  });

  // Combinador repetido (".nav > > a"): o parser aceita e nao reclama.
  walkCss(ast, {
    visit: "Selector",
    enter(node) {
      const filhos = node.children?.toArray() ?? [];
      for (let i = 1; i < filhos.length; i += 1) {
        if (
          filhos[i].type === "Combinator" &&
          filhos[i - 1].type === "Combinator"
        ) {
          problemas.push(
            `seletor com combinador repetido: ${generateCss(node)}`,
          );
        }
      }
    },
  });

  walkCss(ast, {
    visit: "Feature",
    enter(node) {
      const nome = node.name ?? "";
      if (!MEDIA_FEATURES_DA_TRILHA.has(nome)) {
        problemas.push(`media feature fora da lista da trilha: ${nome}`);
      }
    },
  });

  // Ponto e virgula em TODA declaracao, inclusive a ultima do bloco, e uma
  // declaracao por linha quando a regra tem mais de uma. As duas saem do AST
  // com posicao, e nao do texto: por texto, o ";" que falta numa regra escrita
  // em uma linha so passa despercebido, e um @keyframes de uma linha (duas
  // regras aninhadas, uma declaracao cada) seria acusado sem motivo.
  const limpo = cssSemComentarioNemString(corpo);
  walkCss(ast, {
    visit: "Block",
    enter(node) {
      const declaracoes = (node.children?.toArray() ?? []).filter(
        (filho) => filho.type === "Declaration",
      );
      for (const decl of declaracoes) {
        const fim = decl.loc?.end.offset;
        if (fim === undefined) continue;
        const resto = limpo.slice(fim);
        const proximo = resto.trimStart()[0];
        if (proximo !== ";") {
          problemas.push(
            `declaracao sem ponto e virgula: ${decl.property ?? "?"}`,
          );
        }
      }
      if (declaracoes.length > 1) {
        const linhas = declaracoes
          .map((decl) => decl.loc?.start.line)
          .filter((linha): linha is number => linha !== undefined);
        if (new Set(linhas).size !== linhas.length) {
          problemas.push(
            "mais de uma declaracao na mesma linha (use uma por linha)",
          );
        }
      }
    },
  });

  problemas.push(...convencoesCss(corpo));
  return problemas;
}
