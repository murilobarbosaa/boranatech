// Capacidade de cada linguagem de trecho de quiz, num lugar so (Lote 07).
//
// Antes a informacao estava espalhada: o runner em verifyQuizPoolByExecution
// (`linguagem === "js"`), a regra de import em quizPoolGeneration
// (`includes("python")` e uma lista IMPORT_FREE_LANGUAGES escrita a mao). Uma
// linguagem nova (bash de Git, html, css, dockerfile) exigiria achar e mudar
// cada sitio, e o sitio esquecido cairia num padrao silencioso. Aqui a
// linguagem declara as capacidades uma vez, e linguagem fora do mapa e erro de
// configuracao, nunca comportamento padrao.
//
// O que NAO mora aqui: os exemplos de sintaxe do prompt (completarExemplo,
// exemploCodigoNoEnunciado em quizPoolGeneration.mts). Eles escolhem o TEXTO do
// exemplo na linguagem da trilha, nao uma capacidade dela.
import { fileURLToPath } from "node:url";

// Caminho absoluto do wrapper de TS. Absoluto porque o executor roda com cwd
// num diretorio temporario, onde nada do repositorio e alcancavel por caminho
// relativo.
const RUN_TS_SNIPPET = fileURLToPath(
  new URL("./runTsSnippet.mjs", import.meta.url),
);

// Wrapper de SQL (Lote 11a), absoluto pelo mesmo motivo.
const RUN_SQL_SNIPPET = fileURLToPath(
  new URL("./runSqlSnippet.mjs", import.meta.url),
);

export interface Runner {
  command: string;
  /** Argumentos ANTES do arquivo (o wrapper de TS entra aqui). */
  args?: string[];
  ext: string;
}

export type ImportRule = "stdlib-allowlist" | "forbidden" | "nao-se-aplica";

export interface LanguageCapability {
  /** Comando que executa o trecho; null: a verificacao por execucao nao cobre a linguagem. */
  runner: Runner | null;
  /** Se a pergunta de erro traz codigo.saidaEsperada (o stdout do codigo consertado). */
  saidaEsperadaAplicavel: boolean;
  /**
   * stdlib-allowlist: import so de modulo da lista (python); forbidden: nenhum
   * import (js, ts); nao-se-aplica: ferramenta ou marcacao, sem nocao de import
   * no trecho (um Dockerfile comeca com FROM, um script bash chama comandos).
   */
  importRule: ImportRule;
  /**
   * Saida de ferramenta (bash, dockerfile): texto de terminal real parece
   * frase ("Already up to date."), entao a regra de alternativa escrita como
   * frase vira aviso para a revisao humana em vez de reprovar a correta.
   */
  saidaDeFerramenta: boolean;
}

// saidaEsperadaAplicavel: false em html, css e dockerfile, que nao tem saida de
// terminal (um erro de HTML e uma tag que nao fecha, nao um stdout diferente).
// bash MANTEM: comando de Git tem saida real e previsivel ("Already up to
// date."), e mesmo sem execucao o campo e a unica declaracao explicita da
// intencao, que e o que a revisao humana compara com a correta.
export const LANGUAGE_CAPABILITIES: Record<string, LanguageCapability> = {
  js: {
    runner: { command: "node", ext: ".mjs" },
    saidaEsperadaAplicavel: true,
    importRule: "forbidden",
    saidaDeFerramenta: false,
  },
  // Sem runner: o node nao executa TypeScript sem transpilar.
  ts: {
    // Duas etapas (Lote 10a): o wrapper confere os tipos com a API do
    // typescript e so entao executa com o tsx. O tsx sozinho nao serviria:
    // ele REMOVE os tipos sem conferir, e o erro de tipo, que e o defeito
    // que uma pergunta de erro de TS mais cobra, passaria calado.
    runner: { command: "node", args: [RUN_TS_SNIPPET], ext: ".ts" },
    saidaEsperadaAplicavel: true,
    importRule: "forbidden",
    saidaDeFerramenta: false,
  },
  // node:sqlite num banco :memory: (Lote 11a). O flag tira o
  // ExperimentalWarning que o Node 24 ainda imprime no stderr a cada carga do
  // modulo: sem ele, todo trecho que roda limpo teria stderr.
  sql: {
    runner: {
      command: "node",
      args: ["--disable-warning=ExperimentalWarning", RUN_SQL_SNIPPET],
      ext: ".sql",
    },
    saidaEsperadaAplicavel: true,
    importRule: "nao-se-aplica",
    saidaDeFerramenta: false,
  },
  python: {
    runner: { command: "python3", ext: ".py" },
    saidaEsperadaAplicavel: true,
    importRule: "stdlib-allowlist",
    saidaDeFerramenta: false,
  },
  bash: {
    runner: null,
    saidaEsperadaAplicavel: true,
    importRule: "nao-se-aplica",
    saidaDeFerramenta: true,
  },
  html: {
    runner: null,
    saidaEsperadaAplicavel: false,
    importRule: "nao-se-aplica",
    saidaDeFerramenta: false,
  },
  css: {
    runner: null,
    saidaEsperadaAplicavel: false,
    importRule: "nao-se-aplica",
    saidaDeFerramenta: false,
  },
  dockerfile: {
    runner: null,
    saidaEsperadaAplicavel: false,
    importRule: "nao-se-aplica",
    saidaDeFerramenta: true,
  },
};

export function capabilityOf(linguagem: string): LanguageCapability {
  const capacidade = Object.prototype.hasOwnProperty.call(
    LANGUAGE_CAPABILITIES,
    linguagem,
  )
    ? LANGUAGE_CAPABILITIES[linguagem]
    : undefined;
  if (!capacidade) {
    throw new Error(
      `[languageCapabilities] linguagem "${linguagem}" fora de LANGUAGE_CAPABILITIES: declare runner, saidaEsperadaAplicavel e importRule antes de usa-la em codeLanguages.`,
    );
  }
  return capacidade;
}

// saidaEsperadaAplicavel tolerante a linguagem fora do mapa (devolve true, o
// contrato antigo): a validacao da pool ja reporta a linguagem desconhecida
// como problema proprio, e esta leitura nao pode lancar no meio dela.
export function saidaEsperadaAplicavelEm(linguagem: string): boolean {
  return Object.prototype.hasOwnProperty.call(LANGUAGE_CAPABILITIES, linguagem)
    ? LANGUAGE_CAPABILITIES[linguagem].saidaEsperadaAplicavel
    : true;
}

// saidaDeFerramenta tolerante a linguagem fora do mapa (devolve false: a regra
// de frase continua reprovando, o contrato antigo).
export function saidaDeFerramentaEm(linguagem: string): boolean {
  return Object.prototype.hasOwnProperty.call(LANGUAGE_CAPABILITIES, linguagem)
    ? LANGUAGE_CAPABILITIES[linguagem].saidaDeFerramenta
    : false;
}

// Aviso de trechos que a verificacao por execucao NAO cobre. Texto unico para
// o portao do gerador e para o verify:quiz-pool dizerem a mesma coisa. Licao
// do Lote 06g: o instrumento diz o que fez e o que nao fez; fingir cobertura e
// a classe de defeito que a tabela do 2c pegou (4 de 8 perguntas de erro de
// Python aprovadas pelo portao estavam semanticamente erradas).
export function avisoSemRunner(linguagem: string, trechos: number): string {
  return `${trechos} trechos de ${linguagem} sem runner: verificacao por execucao NAO cobre estes; revisao humana obrigatoria`;
}
