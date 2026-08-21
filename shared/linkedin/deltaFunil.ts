import { mudancaSoDeAutodeclaracao } from "./reguaV2";

/**
 * Funil ÚNICO do delta de nota do analisador de LinkedIn.
 *
 * Por que existe: `setScoreDelta` era chamado em dois lugares (análise nova e
 * abrir do histórico) e cada um carregava as suas próprias guardas. A supressão
 * por versão estava nos dois; a supressão por autodeclaração entrou só no
 * segundo, e a auditoria da rodada anterior só a achou porque foi procurar. Um
 * teste da função de supressão nunca pegaria isso: ele testa a função, não os
 * call sites.
 *
 * A partir daqui a decisão é uma só, aqui dentro. Quem chama passa o antes e o
 * depois e recebe o veredito pronto. `deltaFunil.test.ts` enumera os call sites
 * da fonte e falha se algum voltar a decidir por conta própria.
 */

export interface EntradaDelta {
  /** Nota da análise anterior. null quando não há anterior. */
  notaAnterior: number | null;
  /** Versão da régua da anterior. Ausente nas linhas gravadas antes do carimbo. */
  versaoAnterior: number | null | undefined;
  /** Vereditos dos checks da anterior. Ausente nas análises anteriores à v2. */
  checksAnteriores:
    | readonly { id: string; category: string; aprovado: boolean }[]
    | null
    | undefined;
  notaAtual: number;
  versaoAtual: number | null | undefined;
  checksAtuais: readonly { id: string; category: string; aprovado: boolean }[];
  /**
   * Alguma das duas notas está INCOMPLETA (leitura em dúvida)?
   *
   * Ausente nas linhas anteriores à v7, e ausência vale `false` — a mesma
   * normalização de `readDeterministic`, pelo mesmo motivo: uma análise antiga
   * era completa dentro da régua dela.
   */
  incompletaAnterior?: boolean;
  incompletaAtual?: boolean;
}

export interface VeredictoDelta {
  /** Delta a exibir, ou null. Null também desliga a celebração. */
  delta: { from: number; to: number } | null;
  /** A régua mudou entre as duas: mostra o aviso de não-comparável. */
  reguaMudou: boolean;
  /**
   * Por que não há delta. Existe para o motivo aparecer em teste e em log, em
   * vez de "null" sem explicação.
   */
  motivo:
    | "delta"
    | "sem-anterior"
    | "nota-incompleta"
    | "regua-mudou"
    | "so-autodeclaracao"
    | "nota-igual";
}

/** Versão de uma linha: ausente conta como 1, que é o formato original. */
export function versaoDe(v: number | null | undefined): number {
  return v ?? 1;
}

export function decidirDelta(e: EntradaDelta): VeredictoDelta {
  if (e.notaAnterior === null) {
    return { delta: null, reguaMudou: false, motivo: "sem-anterior" };
  }
  // Pendência em QUALQUER das duas pontas mata o delta, e mata antes de tudo
  // o mais: comparar 70-incompleta com 74-completa produz um "+4" que não
  // significa nada. Aqui dentro, e não no call site, porque `delta: null`
  // também desliga a celebração (ver o comentário de `VeredictoDelta`): o
  // confete morre de graça, sem um segundo lugar para alguém esquecer. Foi
  // exatamente assim que a supressão por autodeclaração sumiu de um dos dois
  // call sites do `setScoreDelta`.
  if (e.incompletaAnterior === true || e.incompletaAtual === true) {
    return { delta: null, reguaMudou: false, motivo: "nota-incompleta" };
  }
  const reguaMudou = versaoDe(e.versaoAnterior) !== versaoDe(e.versaoAtual);
  if (reguaMudou) {
    return { delta: null, reguaMudou: true, motivo: "regua-mudou" };
  }
  if (
    Array.isArray(e.checksAnteriores) &&
    mudancaSoDeAutodeclaracao(e.checksAnteriores, e.checksAtuais)
  ) {
    return { delta: null, reguaMudou: false, motivo: "so-autodeclaracao" };
  }
  if (e.notaAnterior === e.notaAtual) {
    return { delta: null, reguaMudou: false, motivo: "nota-igual" };
  }
  return {
    delta: { from: e.notaAnterior, to: e.notaAtual },
    reguaMudou: false,
    motivo: "delta",
  };
}
