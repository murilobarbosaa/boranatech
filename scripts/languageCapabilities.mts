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

export interface Runner {
  command: string;
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
}

// saidaEsperadaAplicavel e true em todas por ora: e o contrato que a validacao
// aplica hoje a toda pergunta de erro.
export const LANGUAGE_CAPABILITIES: Record<string, LanguageCapability> = {
  js: {
    runner: { command: "node", ext: ".mjs" },
    saidaEsperadaAplicavel: true,
    importRule: "forbidden",
  },
  // Sem runner: o node nao executa TypeScript sem transpilar.
  ts: {
    runner: null,
    saidaEsperadaAplicavel: true,
    importRule: "forbidden",
  },
  python: {
    runner: { command: "python3", ext: ".py" },
    saidaEsperadaAplicavel: true,
    importRule: "stdlib-allowlist",
  },
  bash: {
    runner: null,
    saidaEsperadaAplicavel: true,
    importRule: "nao-se-aplica",
  },
  html: {
    runner: null,
    saidaEsperadaAplicavel: true,
    importRule: "nao-se-aplica",
  },
  css: {
    runner: null,
    saidaEsperadaAplicavel: true,
    importRule: "nao-se-aplica",
  },
  dockerfile: {
    runner: null,
    saidaEsperadaAplicavel: true,
    importRule: "nao-se-aplica",
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

// Aviso de trechos que a verificacao por execucao NAO cobre. Texto unico para
// o portao do gerador e para o verify:quiz-pool dizerem a mesma coisa. Licao
// do Lote 06g: o instrumento diz o que fez e o que nao fez; fingir cobertura e
// a classe de defeito que a tabela do 2c pegou (4 de 8 perguntas de erro de
// Python aprovadas pelo portao estavam semanticamente erradas).
export function avisoSemRunner(linguagem: string, trechos: number): string {
  return `${trechos} trechos de ${linguagem} sem runner: verificacao por execucao NAO cobre estes; revisao humana obrigatoria`;
}
