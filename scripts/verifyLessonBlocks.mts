// Confere os blocos de codigo das licoes de UMA trilha:
//   pnpm verify:lesson-blocks <slug>
// Toda cerca do content (e das variantes byLanguage) passa pelos limites da
// disciplina de codigo do guia (secao 11): no maximo 10 linhas de ate 60
// caracteres. Depois, pela capacidade da linguagem (languageCapabilities):
// - linguagem com runner (js, python): o bloco executa com o mesmo executor
//   isolado do verify:quiz-pool (cwd temporario, ambiente do zero, entrada
//   vazia); lancar ou estourar o timeout e "falhou".
// - linguagem sem runner (bash, html, css, dockerfile, ts): "nao-executado",
//   contado no resumo com o aviso de revisao humana, a mesma honestidade do
//   portao do gerador. Em bash, confere a convencao de trecho decidida no Lote
//   07b: o bloco abre com um comando prefixado por "$ ", e saida vem sem
//   prefixo; linha que parece comando sem o prefixo e acusada.
// - html e css: sem execucao tambem, mas com conferencia estrutural. Em
//   html (Lote 08), a marcacao precisa valer por si, e nao porque o parser
//   conserta; em css (Lote 09), o bloco passa pelo parser e pelo lexer do
//   css-tree e pelas convencoes de escrita da trilha (ver validarCss).
// - cerca fora de codeLanguages (json, text, sem identificador): so os
//   limites, "fora-de-codeLanguages".
//
// Alem dos blocos, o verificador confere a PROSA de cada passo: o renderer
// das licoes usa react-markdown sem rehype-raw, entao HTML cru fora de crase
// e DESCARTADO na tela, sem aviso (ver prosaHtmlCru).
// Exit 1 se algum bloco falhar ou divergir da convencao.
//
// Nasceu no Lote 07b: ate aqui nenhum instrumento executava os blocos das
// licoes, e a saida mostrada vinha de node -e a mao durante o lote. Roda por
// slug, de proposito: as trilhas publicadas nao foram verificadas por ele
// (python.ts e frontend.ts ja tem cercas bash sem o prefixo "$ ", anteriores
// a convencao).
import { pathToFileURL } from "node:url";
import { sqlBancoOf } from "../shared/roadmapV2/sqlBancos";
import type { RoadmapNode, RoadmapV2 } from "../shared/roadmapV2/types";
import { avisoSemRunner, capabilityOf } from "./languageCapabilities.mts";
// Reexportadas do modulo proprio (ver htmlStructure.mts): quem ja importava
// daqui continua importando daqui.
export { estruturaCss, estruturaHtml, validarCss } from "./htmlStructure.mts";
import { estruturaHtml, validarCss } from "./htmlStructure.mts";
import {
  type ArquivoDoGrupo,
  type Execucao,
  type Executor,
  type ExecutorDeGrupo,
  makeExecutor,
  makeGroupExecutor,
} from "./verifyQuizPoolByExecution.mts";

// Duas contagens desde o Lote 10a: a PEP 8 (e a legibilidade em geral) pede
// linha em branco entre definicoes, e contar essas linhas junto com o codigo
// punia justamente o bloco bem escrito. O limite de tela continua coberto pelo
// total.
export const BLOCO_MAX_LINHAS_CONTEUDO = 10;
export const BLOCO_MAX_LINHAS_TOTAL = 12;
export const BLOCO_MAX_COLUNAS = 60;

// Linha de bash que parece comando: comeca com um programa comum de terminal
// seguido de espaco. Saida de Git raramente comeca assim; e o que pega o
// comando que perdeu o "$ " no meio do bloco.
const COMANDO_SEM_PREFIXO_RE =
  /^(git|cd|ls|mkdir|touch|cat|echo|rm|mv|cp|code|python3|node|npm|pnpm)\s/;
// Saida real que casa o padrao acima: a resposta do git --version. Achada no
// primeiro uso do verificador, na propria trilha de Git (Lote 07b), onde o
// bloco verdadeiro de fundamentos.instalar saiu como divergencia.
const SAIDA_QUE_PARECE_COMANDO_RE = /^git version \d/;

export interface Bloco {
  linguagem: string;
  corpo: string;
  /** `lanca=<TipoDoErro>`: o bloco lanca de proposito. */
  lanca?: string;
  /** `arquivo=<nome>`: o bloco e um arquivo com esse nome dentro do passo. */
  arquivo?: string;
  /** `banco=<nome>` (so em sql): base de shared/roadmapV2/sqlBancos.ts carregada antes. */
  banco?: string;
  /**
   * Metadado desconhecido ou mal formado na cerca. Opcional porque um Bloco
   * construido a mao (teste, chamador futuro) nao tem cerca para ter problema;
   * extrairBlocos sempre preenche.
   */
  problemasDaCerca?: string[];
}

export interface BlocoDoPasso extends Bloco {
  passo: string;
}

export type VereditoBloco =
  | "executado"
  // Bloco com `lanca=`: quebrou como o autor declarou. Sucesso, nao falha.
  | "lancou-como-esperado"
  // Bloco de um grupo `arquivo=` que nao e o ultimo: gravado no diretorio e
  // disponivel para import, sem execucao propria.
  | "gravado"
  | "falhou"
  | "nao-executado"
  | "fora-de-codeLanguages";

export interface ConferenciaBloco {
  veredito: VereditoBloco;
  // Limites, convencao e, em "falhou", o erro da execucao (prefixo
  // "execucao:"), para o resumo separar divergencia de falha.
  problemas: string[];
}

export interface LinhaBloco extends ConferenciaBloco {
  passo: string;
  linguagem: string;
}

// ---------- puros ----------

// Nome de arquivo aceito em `arquivo=`: sem barra e sem "..", para um bloco de
// licao nao escrever fora do diretorio do executor.
const NOME_DE_ARQUIVO_RE = /^[a-z0-9._-]+$/;

const METADADOS_CONHECIDOS = new Set(["lanca", "arquivo", "banco"]);

// Nomes dos arquivos do grupo que executa um bloco com `banco=`: a base e
// gravada com o nome que o runSqlSnippet.mjs procura ao lado do trecho, e o
// erro dentro dela cita esse nome.
const ARQUIVO_DA_BASE = "__banco.sql";
const ARQUIVO_DO_TRECHO = "trecho.sql";

// A cerca e `linguagem` seguida de pares `chave=valor` separados por espaco.
// Eles sao INVISIVEIS na tela: o react-markdown usa so a primeira palavra para
// a classe `language-js` e descarta o resto (provado por teste de render no
// Lote 10a). Chave desconhecida e problema, para erro de digitacao nao passar
// calado deixando o bloco sem a verificacao que o autor pediu.
export function lerCerca(info: string): {
  linguagem: string;
  lanca?: string;
  arquivo?: string;
  banco?: string;
  problemasDaCerca: string[];
} {
  const partes = info.trim().split(/\s+/).filter(Boolean);
  const linguagem = partes.shift() ?? "";
  const problemasDaCerca: string[] = [];
  let lanca: string | undefined;
  let arquivo: string | undefined;
  let banco: string | undefined;
  for (const parte of partes) {
    const igual = parte.indexOf("=");
    const chave = igual < 0 ? parte : parte.slice(0, igual);
    const valor = igual < 0 ? "" : parte.slice(igual + 1);
    if (!METADADOS_CONHECIDOS.has(chave)) {
      problemasDaCerca.push(`metadado desconhecido na cerca: ${chave}`);
      continue;
    }
    if (valor === "") {
      problemasDaCerca.push(`metadado sem valor na cerca: ${chave}`);
      continue;
    }
    if (chave === "lanca") lanca = valor;
    if (chave === "arquivo") {
      if (!NOME_DE_ARQUIVO_RE.test(valor)) {
        problemasDaCerca.push(`nome de arquivo invalido na cerca: ${valor}`);
        continue;
      }
      // Lote 11a: o wrapper de sql executa so o ULTIMO arquivo do grupo e nao
      // carrega os anteriores (SQL nao tem import), entao erro no primeiro
      // passaria calado, a classe do diagnostico perdido do ts no Lote 10b.
      // O valor continua lido para a regra de banco= junto de arquivo= seguir
      // acusando; o problema da cerca ja reprova o bloco.
      if (linguagem === "sql") {
        problemasDaCerca.push(
          "arquivo= ainda nao vale em cerca sql: sql nao tem semantica de grupo (Lote 11), e so o ultimo arquivo executaria",
        );
      }
      arquivo = valor;
    }
    // banco= (Lote 11a): so em sql, nome do registro, nunca junto de
    // arquivo= (as duas coisas montam o grupo de arquivos, e a combinacao nao
    // tem semantica definida).
    if (chave === "banco") {
      if (linguagem !== "sql") {
        problemasDaCerca.push(
          `banco= so vale em cerca sql (cerca ${linguagem})`,
        );
        continue;
      }
      if (sqlBancoOf(valor) === undefined) {
        problemasDaCerca.push(
          `banco desconhecido na cerca: ${valor} (fora de shared/roadmapV2/sqlBancos.ts)`,
        );
        continue;
      }
      banco = valor;
    }
  }
  if (banco !== undefined && arquivo !== undefined) {
    problemasDaCerca.push("banco= e arquivo= na mesma cerca");
    banco = undefined;
  }
  return { linguagem, lanca, arquivo, banco, problemasDaCerca };
}

// Grupo de arquivos que executa um bloco com `banco=`: a base primeiro, o
// trecho por ultimo (o executor de grupo so executa o ultimo, e o wrapper de
// sql carrega a base que achar ao lado dele).
export function arquivosDoBloco(bloco: Bloco): ArquivoDoGrupo[] {
  const base = bloco.banco === undefined ? undefined : sqlBancoOf(bloco.banco);
  if (base === undefined) {
    throw new Error(
      `[verifyLessonBlocks] bloco sem base registrada: banco=${bloco.banco}`,
    );
  }
  return [
    { nome: ARQUIVO_DA_BASE, corpo: base },
    { nome: ARQUIVO_DO_TRECHO, corpo: bloco.corpo },
  ];
}

export function extrairBlocos(content: string): Bloco[] {
  return Array.from(content.matchAll(/```([^\n]*)\n([\s\S]*?)```/g), (m) => ({
    ...lerCerca(m[1]),
    corpo: m[2].replace(/\n$/, ""),
  }));
}

export function blocosDaTrilha(roadmap: RoadmapV2): BlocoDoPasso[] {
  const out: BlocoDoPasso[] = [];
  const visitar = (node: RoadmapNode) => {
    for (const bloco of extrairBlocos(node.content ?? "")) {
      out.push({ passo: node.id, ...bloco });
    }
    for (const [lang, variante] of Object.entries(node.byLanguage ?? {})) {
      for (const bloco of extrairBlocos(variante.content ?? "")) {
        out.push({ passo: `${node.id} [${lang}]`, ...bloco });
      }
    }
    node.children?.forEach(visitar);
  };
  roadmap.sections.forEach((section) => section.children.forEach(visitar));
  return out;
}

function limites(corpo: string): string[] {
  const out: string[] = [];
  const linhas = corpo.split("\n");
  const conteudo = linhas.filter((linha) => linha.trim() !== "").length;
  if (conteudo > BLOCO_MAX_LINHAS_CONTEUDO) {
    out.push(
      `bloco com ${conteudo} linhas de conteudo (maximo ${BLOCO_MAX_LINHAS_CONTEUDO})`,
    );
  }
  if (linhas.length > BLOCO_MAX_LINHAS_TOTAL) {
    out.push(
      `bloco com ${linhas.length} linhas no total (maximo ${BLOCO_MAX_LINHAS_TOTAL})`,
    );
  }
  linhas.forEach((linha, i) => {
    if (linha.length > BLOCO_MAX_COLUNAS) {
      out.push(
        `linha ${i + 1} com ${linha.length} caracteres (maximo ${BLOCO_MAX_COLUNAS})`,
      );
    }
  });
  return out;
}

function convencaoBash(corpo: string): string[] {
  const out: string[] = [];
  const linhas = corpo.split("\n");
  const primeira = linhas.findIndex((linha) => linha.trim().length > 0);
  linhas.forEach((linha, i) => {
    if (linha.startsWith("$ ")) return;
    if (i === primeira) {
      out.push(
        `linha ${i + 1} nao comeca com "$ ": bloco bash abre com um comando`,
      );
    } else if (
      COMANDO_SEM_PREFIXO_RE.test(linha) &&
      !SAIDA_QUE_PARECE_COMANDO_RE.test(linha)
    ) {
      out.push(`linha ${i + 1} parece comando sem o prefixo "$ "`);
    }
  });
  return out;
}

// HTML cru na PROSA. O renderer das licoes usa react-markdown sem rehype-raw:
// uma tag fora de crase some da tela, sem aviso nenhum. Fora das cercas e do
// codigo inline, "<" seguido de letra, barra ou "!" e problema. "a < b" nao e.
export function prosaHtmlCru(texto: string): string[] {
  const semCodigo = texto
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ");
  return Array.from(semCodigo.matchAll(/<[a-zA-Z/!][^\n]{0,40}/g)).map(
    (m) =>
      `prosa com HTML cru fora de crase (o renderer descarta): ${m[0].trim()}`,
  );
}

// Id interno de passo exposto na PROSA (Lote 09). O aluno le o texto da
// licao; "veja o passo `html.seo`" nao diz nada a ele, porque esse id so
// existe no arquivo. Conexao entre passos e nominal, pelo TITULO. A regra pega
// codigo inline cujo conteudo seja EXATAMENTE um id de passo de qualquer
// trilha registrada, o que deixa passar `lista.map` e outros trechos de codigo
// que so por acaso tem ponto.
export function prosaIdInterno(
  texto: string,
  idsDePasso: Set<string>,
): string[] {
  const semCerca = texto.replace(/```[\s\S]*?```/g, " ");
  return Array.from(semCerca.matchAll(/`([^`\n]+)`/g))
    .filter((m) => idsDePasso.has(m[1].trim()))
    .map((m) => `id interno de passo exposto na prosa: ${m[1].trim()}`);
}

// Todos os ids de passo das trilhas registradas, que e o universo contra o
// qual a regra acima decide.
export function idsDePasso(roadmaps: RoadmapV2[]): Set<string> {
  const out = new Set<string>();
  const visitar = (node: RoadmapNode) => {
    out.add(node.id);
    node.children?.forEach(visitar);
  };
  for (const roadmap of roadmaps) {
    roadmap.sections.forEach((section) => section.children.forEach(visitar));
  }
  return out;
}

export interface LinhaProsa {
  passo: string;
  problemas: string[];
}

export function prosaDaTrilha(
  roadmap: RoadmapV2,
  ids: Set<string> = new Set(),
): LinhaProsa[] {
  const out: LinhaProsa[] = [];
  const visitar = (node: RoadmapNode) => {
    const problemas = [
      ...prosaHtmlCru(node.content ?? ""),
      ...prosaIdInterno(node.content ?? "", ids),
    ];
    for (const [lang, variante] of Object.entries(node.byLanguage ?? {})) {
      problemas.push(
        ...prosaHtmlCru(variante.content ?? "").map((p) => `[${lang}] ${p}`),
        ...prosaIdInterno(variante.content ?? "", ids).map(
          (p) => `[${lang}] ${p}`,
        ),
      );
    }
    if (problemas.length > 0) out.push({ passo: node.id, problemas });
    node.children?.forEach(visitar);
  };
  roadmap.sections.forEach((section) => section.children.forEach(visitar));
  return out;
}

// Conferencia de UM bloco. Pura em relacao ao executor recebido (o teste
// passa um stub); so e chamado em linguagem de codeLanguages com runner.
// `executarGrupo` so e usado por bloco com `banco=`, que roda como grupo de
// dois arquivos (a base e o trecho); opcional para os call sites antigos.
export function conferirBloco(
  bloco: Bloco,
  codeLanguages: string[],
  executar: Executor,
  executarGrupo?: ExecutorDeGrupo,
): ConferenciaBloco {
  const problemas = [
    ...(bloco.problemasDaCerca ?? []),
    ...limites(bloco.corpo),
  ];
  if (!codeLanguages.includes(bloco.linguagem)) {
    return { veredito: "fora-de-codeLanguages", problemas };
  }
  if (bloco.linguagem === "bash") problemas.push(...convencaoBash(bloco.corpo));
  if (bloco.linguagem === "html") problemas.push(...estruturaHtml(bloco.corpo));
  if (bloco.linguagem === "css") problemas.push(...validarCss(bloco.corpo));
  const runner = capabilityOf(bloco.linguagem).runner;
  if (!runner) return { veredito: "nao-executado", problemas };
  if (bloco.banco !== undefined) {
    if (!executarGrupo) {
      throw new Error(
        "[verifyLessonBlocks] bloco com banco= sem executor de grupo",
      );
    }
    return vereditoDaExecucao(
      bloco,
      executarGrupo(arquivosDoBloco(bloco)),
      problemas,
    );
  }
  return vereditoDaExecucao(bloco, executar(bloco.corpo), problemas);
}

// Traduz UMA execucao em veredito, respeitando o `lanca=` da cerca. Sem ele,
// quebrar e falha; com ele, quebrar do jeito declarado e o sucesso, e rodar
// limpo e o problema (o bloco existe justamente para mostrar o erro).
function vereditoDaExecucao(
  bloco: Bloco,
  r: Execucao,
  problemas: string[],
): ConferenciaBloco {
  if (r.timeout) {
    return {
      veredito: "falhou",
      problemas: [...problemas, "execucao: estourou o timeout"],
    };
  }
  if (bloco.lanca) {
    if (r.status === 0) {
      return {
        veredito: "falhou",
        problemas: [
          ...problemas,
          `execucao: declarou lanca=${bloco.lanca} e rodou sem erro`,
        ],
      };
    }
    const saida = `${r.stderr ?? ""}\n${r.erro}`;
    // Palavra inteira, e nao substring: com includes, lanca=Error passava num
    // bloco que lanca TypeError, e o instrumento aprovava uma declaracao que
    // nao descreve o erro real. O valor vem do conteudo, entao e escapado
    // antes de virar expressao.
    const declarado = new RegExp(
      `\\b${bloco.lanca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    );
    if (!declarado.test(saida)) {
      return {
        veredito: "falhou",
        problemas: [
          ...problemas,
          `execucao: declarou lanca=${bloco.lanca} e lancou: ${r.erro}`,
        ],
      };
    }
    return { veredito: "lancou-como-esperado", problemas };
  }
  if (r.status !== 0) {
    return {
      veredito: "falhou",
      problemas: [
        ...problemas,
        `execucao: lancou: ${r.erro || `status ${r.status}`}`,
      ],
    };
  }
  return { veredito: "executado", problemas };
}

// Grupo de blocos `arquivo=` do MESMO passo: todos sao gravados juntos e so o
// ultimo executa; os anteriores ficam disponiveis para import e saem como
// "gravado". E o que torna verificavel um passo que ensina dois arquivos, como
// o de import e export da trilha de JavaScript.
export function conferirGrupo(
  blocos: Bloco[],
  codeLanguages: string[],
  executarGrupo: ExecutorDeGrupo,
): ConferenciaBloco[] {
  const base = blocos.map((bloco) => [
    ...(bloco.problemasDaCerca ?? []),
    ...limites(bloco.corpo),
  ]);
  const fora = blocos.findIndex(
    (bloco) => !codeLanguages.includes(bloco.linguagem),
  );
  if (fora >= 0) {
    return blocos.map((_, i) => ({
      veredito: "fora-de-codeLanguages" as const,
      problemas: base[i],
    }));
  }
  const nomes = new Set(blocos.map((bloco) => bloco.arquivo));
  if (nomes.size !== blocos.length) {
    base[base.length - 1].push("grupo com nome de arquivo repetido");
  }
  const runner = capabilityOf(blocos[0].linguagem).runner;
  if (!runner) {
    return blocos.map((_, i) => ({
      veredito: "nao-executado" as const,
      problemas: base[i],
    }));
  }
  const r = executarGrupo(
    blocos.map((bloco) => ({ nome: bloco.arquivo ?? "", corpo: bloco.corpo })),
  );
  const ultimo = blocos.length - 1;
  return blocos.map((bloco, i) =>
    i === ultimo
      ? vereditoDaExecucao(bloco, r, base[i])
      : { veredito: "gravado" as const, problemas: base[i] },
  );
}

export function relatorioBlocos(linhas: LinhaBloco[]): string[] {
  const out = linhas.map(
    (l) =>
      `${l.passo} | ${l.linguagem || "(sem id)"} | ${l.veredito}${l.problemas.length ? ` | ${l.problemas.join("; ")}` : ""}`,
  );
  const conta = (v: VereditoBloco) =>
    linhas.filter((l) => l.veredito === v).length;
  const divergencias = linhas.filter((l) =>
    l.problemas.some((p) => !p.startsWith("execucao:")),
  ).length;
  out.push(
    `blocos: ${linhas.length} | executados: ${conta("executado")} | lancaram como esperado: ${conta("lancou-como-esperado")} | gravados: ${conta("gravado")} | nao-executados: ${conta("nao-executado")} | falharam: ${conta("falhou")} | fora de codeLanguages: ${conta("fora-de-codeLanguages")} | divergencias de convencao: ${divergencias}`,
  );
  const semRunner = new Map<string, number>();
  linhas.forEach((l) => {
    if (l.veredito !== "nao-executado") return;
    semRunner.set(l.linguagem, (semRunner.get(l.linguagem) ?? 0) + 1);
  });
  semRunner.forEach((trechos, linguagem) =>
    out.push(`[aviso] ${avisoSemRunner(linguagem, trechos)}`),
  );
  return out;
}

async function main() {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!slug) {
    console.error("Uso: pnpm verify:lesson-blocks <slug>");
    process.exit(1);
  }
  const { roadmapsV2 } = await import("../shared/roadmapV2/content");
  const roadmap = roadmapsV2.find((entry) => entry.slug === slug);
  if (!roadmap) {
    console.error(`[verify:lesson-blocks] trilha "${slug}" nao existe.`);
    process.exit(1);
  }
  const codeLanguages = roadmap.codeLanguages ?? [];
  if (codeLanguages.length === 0) {
    console.error(
      `[verify:lesson-blocks] trilha "${slug}" nao tem codeLanguages.`,
    );
    process.exit(1);
  }
  const executores = new Map<string, Executor>();
  const executoresDeGrupo = new Map<string, ExecutorDeGrupo>();
  const naoExecuta: Executor = () => {
    throw new Error("[verify:lesson-blocks] linguagem sem runner executada");
  };
  // Uma travessia so: o Map de grupo e indexado pelo PROPRIO objeto do bloco,
  // entao as duas passagens precisam ver a mesma lista.
  const blocos = blocosDaTrilha(roadmap);
  const gruposDeArquivo = new Map<string, BlocoDoPasso[]>();
  for (const bloco of blocos) {
    if (!bloco.arquivo) continue;
    const chave = `${bloco.passo}|${bloco.linguagem}`;
    gruposDeArquivo.set(chave, [...(gruposDeArquivo.get(chave) ?? []), bloco]);
  }
  const conferidosEmGrupo = new Map<BlocoDoPasso, ConferenciaBloco>();
  for (const grupo of gruposDeArquivo.values()) {
    const runner = codeLanguages.includes(grupo[0].linguagem)
      ? capabilityOf(grupo[0].linguagem).runner
      : null;
    const executarGrupo: ExecutorDeGrupo = runner
      ? makeGroupExecutor(runner)
      : () => {
          throw new Error("[verify:lesson-blocks] grupo sem runner executado");
        };
    const conferencias = conferirGrupo(grupo, codeLanguages, executarGrupo);
    grupo.forEach((bloco, i) => conferidosEmGrupo.set(bloco, conferencias[i]));
  }
  const linhas: LinhaBloco[] = blocos.map((bloco) => {
    const daqui = conferidosEmGrupo.get(bloco);
    if (daqui) {
      return { passo: bloco.passo, linguagem: bloco.linguagem, ...daqui };
    }
    const runner = codeLanguages.includes(bloco.linguagem)
      ? capabilityOf(bloco.linguagem).runner
      : null;
    let executar = naoExecuta;
    let executarGrupo: ExecutorDeGrupo | undefined;
    if (runner) {
      executar = executores.get(bloco.linguagem) ?? makeExecutor(runner);
      executores.set(bloco.linguagem, executar);
      executarGrupo =
        executoresDeGrupo.get(bloco.linguagem) ?? makeGroupExecutor(runner);
      executoresDeGrupo.set(bloco.linguagem, executarGrupo);
    }
    return {
      passo: bloco.passo,
      linguagem: bloco.linguagem,
      ...conferirBloco(bloco, codeLanguages, executar, executarGrupo),
    };
  });
  for (const linha of relatorioBlocos(linhas)) console.log(linha);
  const prosa = prosaDaTrilha(roadmap, idsDePasso(roadmapsV2));
  for (const linha of prosa) {
    console.log(`${linha.passo} | prosa | ${linha.problemas.join("; ")}`);
  }
  const comIdInterno = prosa.filter((l) =>
    l.problemas.some((p) => p.includes("id interno de passo")),
  ).length;
  console.log(
    `prosa com problema: ${prosa.length} passo(s) (id interno exposto em ${comIdInterno})`,
  );
  const reprova =
    prosa.length > 0 ||
    linhas.some(
      (l) =>
        l.veredito === "falhou" ||
        l.problemas.some((p) => !p.startsWith("execucao:")),
    );
  if (reprova) process.exit(1);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
