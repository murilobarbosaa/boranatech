// Janela de período da aba Visão, e a variação que ela suporta.
//
// Funções PURAS de propósito: são a parte do card que decide se existe Δ, e essa
// decisão é a que não pode errar. Um card com Δ falso é pior que um card sem Δ,
// porque quem lê não tem como desconfiar.

/** As três janelas oferecidas. 90 dias NÃO entra: a série tem 16 dias. */
export const OVERVIEW_WINDOWS = ["7", "30", "all"] as const;
export type OverviewWindow = (typeof OVERVIEW_WINDOWS)[number];

export function parseOverviewWindow(valor: unknown): OverviewWindow {
  return typeof valor === "string" &&
    (OVERVIEW_WINDOWS as readonly string[]).includes(valor)
    ? (valor as OverviewWindow)
    : "30";
}

export type Janela = {
  window: OverviewWindow;
  /** Início do período consultado (ISO). `null` em `all`: não há corte. */
  startIso: string | null;
  endIso: string;
  /** Dias da janela; `null` em `all` (o tamanho é o da base). */
  days: number | null;
  /**
   * Período IMEDIATAMENTE anterior, do mesmo tamanho. `null` em `all`, onde a
   * pergunta não se aplica: não existe período anterior ao começo de tudo.
   */
  previousStartIso: string | null;
  previousEndIso: string | null;
};

const MS_DIA = 24 * 60 * 60 * 1000;

export function resolverJanela(
  window: OverviewWindow,
  agora: Date = new Date(),
): Janela {
  const endIso = agora.toISOString();
  if (window === "all") {
    return {
      window,
      startIso: null,
      endIso,
      days: null,
      previousStartIso: null,
      previousEndIso: null,
    };
  }
  const days = Number(window);
  const start = new Date(agora.getTime() - days * MS_DIA);
  const previousStart = new Date(agora.getTime() - 2 * days * MS_DIA);
  return {
    window,
    startIso: start.toISOString(),
    endIso,
    days,
    previousStartIso: previousStart.toISOString(),
    previousEndIso: start.toISOString(),
  };
}

/**
 * Motivo pelo qual um card NÃO tem variação.
 *
 * Existe porque espaço vazio no lugar do Δ parece defeito. A tela precisa poder
 * dizer, em uma linha, por que não há comparação — e o motivo é diferente por
 * card, porque cada série tem a sua própria idade (perfis têm 88 dias, receita
 * tem 18, o snapshot tem 16).
 */
export type MotivoSemVariacao =
  | "historico_insuficiente"
  | "janela_sem_anterior"
  | "sem_dados";

export type Variacao =
  | {
      disponivel: true;
      atual: number;
      anterior: number;
      delta: number;
      /**
       * `null` quando a base é ZERO. Nunca infinito: um card com "+∞%" destrói a
       * confiança na página inteira, e o delta absoluto continua verdadeiro.
       */
      percent: number | null;
    }
  | { disponivel: false; atual: number; motivo: MotivoSemVariacao };

/**
 * Variação de um card, com a disponibilidade decidida POR CARD.
 *
 * `historicoDesdeIso` é a idade da série DAQUELE número, não da página: a Visão
 * mistura fontes com históricos diferentes, e uma regra global marcaria como
 * indisponível um Δ que existe (novos usuários) ou como disponível um que não
 * existe (receita).
 */
export function calcularVariacao(input: {
  janela: Janela;
  atual: number;
  anterior: number | null;
  historicoDesdeIso: string | null;
}): Variacao {
  const { janela, atual, anterior, historicoDesdeIso } = input;

  if (janela.window === "all" || !janela.previousStartIso) {
    return { disponivel: false, atual, motivo: "janela_sem_anterior" };
  }
  if (!historicoDesdeIso) {
    return { disponivel: false, atual, motivo: "sem_dados" };
  }
  // O período anterior INTEIRO precisa caber dentro do histórico. Se a série
  // começa depois do início dele, o "anterior" seria parcial, e comparar um
  // período cheio com um pedaço é o mesmo erro que comparar contra zero.
  if (historicoDesdeIso > janela.previousStartIso) {
    return { disponivel: false, atual, motivo: "historico_insuficiente" };
  }
  if (anterior === null) {
    return { disponivel: false, atual, motivo: "sem_dados" };
  }

  return {
    disponivel: true,
    atual,
    anterior,
    delta: atual - anterior,
    percent: anterior > 0 ? ((atual - anterior) / anterior) * 100 : null,
  };
}
