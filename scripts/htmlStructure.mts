// Estrutura de html e css para os verificadores (Lote 08).
//
// Modulo proprio, e nao dentro do verifyLessonBlocks, porque o verificador de
// blocos importa o executor do verifyQuizPoolByExecution, e a tabela de
// revisao da pool (verifyQuizPoolByExecution) precisa do estruturaHtml: com o
// codigo aqui, os dois importam deste lado e nao existe ciclo. Mesma licao das
// capacidades de linguagem no Lote 07.
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

// Css raso: so chaves balanceadas, ignorando comentario e string. O resto
// fica para o lote da trilha de CSS.
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
