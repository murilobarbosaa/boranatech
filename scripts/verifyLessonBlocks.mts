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
// - html e css (Lote 08): sem execucao tambem, mas com conferencia
//   estrutural. Em html, a marcacao precisa valer por si, e nao porque o
//   parser conserta; em css, chaves balanceadas.
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
import type { RoadmapNode, RoadmapV2 } from "../shared/roadmapV2/types";
import { avisoSemRunner, capabilityOf } from "./languageCapabilities.mts";
// Reexportadas do modulo proprio (ver htmlStructure.mts): quem ja importava
// daqui continua importando daqui.
export { estruturaCss, estruturaHtml } from "./htmlStructure.mts";
import { estruturaCss, estruturaHtml } from "./htmlStructure.mts";
import { type Executor, makeExecutor } from "./verifyQuizPoolByExecution.mts";

export const BLOCO_MAX_LINHAS = 10;
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
}

export interface BlocoDoPasso extends Bloco {
  passo: string;
}

export type VereditoBloco =
  | "executado"
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

export function extrairBlocos(content: string): Bloco[] {
  return Array.from(
    content.matchAll(/```([a-z0-9]*)[ \t]*\n([\s\S]*?)```/g),
    (m) => ({ linguagem: m[1], corpo: m[2].replace(/\n$/, "") }),
  );
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
  if (linhas.length > BLOCO_MAX_LINHAS) {
    out.push(
      `bloco com ${linhas.length} linhas (maximo ${BLOCO_MAX_LINHAS} linhas)`,
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

export interface LinhaProsa {
  passo: string;
  problemas: string[];
}

export function prosaDaTrilha(roadmap: RoadmapV2): LinhaProsa[] {
  const out: LinhaProsa[] = [];
  const visitar = (node: RoadmapNode) => {
    const problemas = prosaHtmlCru(node.content ?? "");
    for (const [lang, variante] of Object.entries(node.byLanguage ?? {})) {
      problemas.push(
        ...prosaHtmlCru(variante.content ?? "").map((p) => `[${lang}] ${p}`),
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
export function conferirBloco(
  bloco: Bloco,
  codeLanguages: string[],
  executar: Executor,
): ConferenciaBloco {
  const problemas = limites(bloco.corpo);
  if (!codeLanguages.includes(bloco.linguagem)) {
    return { veredito: "fora-de-codeLanguages", problemas };
  }
  if (bloco.linguagem === "bash") problemas.push(...convencaoBash(bloco.corpo));
  if (bloco.linguagem === "html") problemas.push(...estruturaHtml(bloco.corpo));
  if (bloco.linguagem === "css") problemas.push(...estruturaCss(bloco.corpo));
  const runner = capabilityOf(bloco.linguagem).runner;
  if (!runner) return { veredito: "nao-executado", problemas };
  const r = executar(bloco.corpo);
  if (r.timeout) {
    return {
      veredito: "falhou",
      problemas: [...problemas, "execucao: estourou o timeout"],
    };
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
    `blocos: ${linhas.length} | executados: ${conta("executado")} | nao-executados: ${conta("nao-executado")} | falharam: ${conta("falhou")} | fora de codeLanguages: ${conta("fora-de-codeLanguages")} | divergencias de convencao: ${divergencias}`,
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
  const naoExecuta: Executor = () => {
    throw new Error("[verify:lesson-blocks] linguagem sem runner executada");
  };
  const linhas: LinhaBloco[] = blocosDaTrilha(roadmap).map((bloco) => {
    const runner = codeLanguages.includes(bloco.linguagem)
      ? capabilityOf(bloco.linguagem).runner
      : null;
    let executar = naoExecuta;
    if (runner) {
      executar = executores.get(bloco.linguagem) ?? makeExecutor(runner);
      executores.set(bloco.linguagem, executar);
    }
    return {
      passo: bloco.passo,
      linguagem: bloco.linguagem,
      ...conferirBloco(bloco, codeLanguages, executar),
    };
  });
  for (const linha of relatorioBlocos(linhas)) console.log(linha);
  const prosa = prosaDaTrilha(roadmap);
  for (const linha of prosa) {
    console.log(`${linha.passo} | prosa | ${linha.problemas.join("; ")}`);
  }
  console.log(`prosa com HTML cru: ${prosa.length} passo(s)`);
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
