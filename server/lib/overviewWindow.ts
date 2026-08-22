import {
  diaBrasilia,
  inicioDoDiaBrasilia,
  somarDiaCivil,
} from "../../shared/brasiliaDay";

// Janela de período da aba Visão, e a variação que ela suporta.
//
// Funções PURAS de propósito: são a parte do card que decide se existe Δ, e essa
// decisão é a que não pode errar. Um card com Δ falso é pior que um card sem Δ,
// porque quem lê não tem como desconfiar.
//
// ---------------------------------------------------------------------------
// SEMÂNTICA OFICIAL (Fase 2, 2026-08-14): DIAS CIVIS EM America/Sao_Paulo.
//
// "Últimos N dias" = N dias civis de Brasília terminando HOJE, com o dia de hoje
// parcial. `startIso` é o instante em que o primeiro desses dias começa em
// Brasília; `endIso` é agora.
//
// O QUE ERA ANTES, e por que mudou. `resolverJanela` fazia `agora - N*24h`, uma
// janela deslizante por instante em UTC, enquanto o gráfico "Cadastros por dia"
// logo abaixo dos cards agrupava por dia civil de Brasília. Os dois eram
// internamente coerentes e rotulados "últimos 30 dias", e não somavam: medido em
// 2026-08-14 às 04:53 UTC, 4.788 no card contra 4.606 no gráfico, 182 cadastros
// de diferença na mesma tela.
//
// Dia civil ganhou de instante deslizante por duas razões. Primeira: é a unidade
// em que a pessoa que lê o painel pensa ("ontem", "esta semana"), e a única em
// que card e gráfico PODEM bater. Segunda: janela deslizante muda de conteúdo a
// cada segundo, então dois blocos da mesma página carregados com 300 ms de
// diferença já mediam populações diferentes.
//
// O CUSTO, declarado: os números caem no deploy desta fase, porque a janela civil
// é mais curta que a deslizante (ela não inclui as horas de ontem que a
// deslizante pegava). Não é regressão, é mudança de definição.
// ---------------------------------------------------------------------------

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
  /**
   * Instante em que o PRIMEIRO dia civil da janela começa em Brasília (ISO UTC).
   * `null` em `all`: não há corte.
   */
  startIso: string | null;
  endIso: string;
  /** Dias CIVIS da janela; `null` em `all` (o tamanho é o da base). */
  days: number | null;
  /**
   * Primeiro e último dia civil da janela (`AAAA-MM-DD`, Brasília). É por AQUI
   * que o gráfico e os cards passam a falar a mesma língua: o gráfico monta os
   * baldes destes dias e o card conta o intervalo que eles delimitam. Antes o
   * gráfico calculava os seus próprios dias e o card os seus próprios instantes.
   * `primeiroDiaCivil` é `null` em `all`.
   */
  primeiroDiaCivil: string | null;
  ultimoDiaCivil: string;
  /**
   * Período IMEDIATAMENTE anterior, do MESMO número de dias civis. `null` em
   * `all`, onde a pergunta não se aplica: não existe período anterior ao começo
   * de tudo.
   */
  previousStartIso: string | null;
  previousEndIso: string | null;
  previousPrimeiroDiaCivil: string | null;
  previousUltimoDiaCivil: string | null;
};

export function resolverJanela(
  window: OverviewWindow,
  agora: Date = new Date(),
): Janela {
  const endIso = agora.toISOString();
  const hoje = diaBrasilia(endIso);
  if (!hoje) {
    // `agora` inválido: não há como resolver uma janela civil. Lançar em vez de
    // devolver uma janela plausível, porque este valor governa SEIS cards.
    throw new Error("resolverJanela: instante inválido");
  }

  if (window === "all") {
    return {
      window,
      startIso: null,
      endIso,
      days: null,
      primeiroDiaCivil: null,
      ultimoDiaCivil: hoje,
      previousStartIso: null,
      previousEndIso: null,
      previousPrimeiroDiaCivil: null,
      previousUltimoDiaCivil: null,
    };
  }

  const days = Number(window);
  // N dias civis TERMINANDO hoje: hoje conta como um deles, então o primeiro é
  // `hoje - (N-1)`. Com N=1 a janela é só hoje.
  const primeiroDiaCivil = somarDiaCivil(hoje, -(days - 1));
  const startIso = inicioDoDiaBrasilia(primeiroDiaCivil);

  // Período anterior: os N dias civis imediatamente antes do primeiro.
  const previousUltimoDiaCivil = somarDiaCivil(primeiroDiaCivil, -1);
  const previousPrimeiroDiaCivil = somarDiaCivil(primeiroDiaCivil, -days);
  const previousStartIso = inicioDoDiaBrasilia(previousPrimeiroDiaCivil);
  // FECHA 1 ms ANTES do início da janela atual. O código anterior usava o mesmo
  // instante como fim do anterior e início do atual, e as queries filtram com
  // `.gte`/`.lte`: uma linha criada exatamente naquele instante contava nos DOIS
  // períodos e inflava o Δ. Improvável, e ainda assim é uma soma que não fecha.
  const previousEndIso = new Date(Date.parse(startIso) - 1).toISOString();

  return {
    window,
    startIso,
    endIso,
    days,
    primeiroDiaCivil,
    ultimoDiaCivil: hoje,
    previousStartIso,
    previousEndIso,
    previousPrimeiroDiaCivil,
    previousUltimoDiaCivil,
  };
}

/**
 * Motivo pelo qual um card NÃO tem variação.
 *
 * Existe porque espaço vazio no lugar do Δ parece defeito. A tela precisa poder
 * dizer, em uma linha, por que não há comparação, e o motivo é diferente por
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

/**
 * Rótulo humano do intervalo, para o badge de cada card e gráfico.
 *
 * CALCULADO NO SERVIDOR de propósito. O client não deve reimplementar fuso: a
 * tela tem seis cards e dois gráficos, e cada um que formatasse a data por conta
 * própria seria uma chance nova de o mesmo intervalo aparecer com dois nomes.
 * O `Intl` do navegador da Ana Julia não tem obrigação de concordar com o do
 * Railway sobre o que é "hoje".
 *
 * Formato: `15 jul a 14 ago` (mesmo dia: `14 ago`; sem início: `até 14 ago`).
 *
 * O SEPARADOR É A PALAVRA "a", e não um traço. Meia-risca (U+2013) e travessão
 * (U+2014) estão proibidos em qualquer texto do projeto pelo CLAUDE.md, e o
 * hífen comum que ficou no lugar deles resolvia a proibição sem resolver a
 * leitura: num rótulo curto ao lado de números, o hífen se confunde com sinal.
 * A palavra não se confunde com nada. O que trava isso está em
 * `adminOverviewCards.test.ts`, e é uma asserção NEGATIVA: a saída não contém
 * hífen nem nenhum dos dois traços longos. No ramo sem início ela é o único
 * detector, porque lá não há forma fixa para afirmar pelo lado positivo.
 */
export function rotuloDeIntervalo(
  primeiroDiaCivil: string | null,
  ultimoDiaCivil: string,
): string {
  const curto = (dia: string) => {
    const [, mes, d] = dia.split("-");
    const MESES = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    return `${Number(d)} ${MESES[Number(mes) - 1]}`;
  };
  if (!primeiroDiaCivil) return `até ${curto(ultimoDiaCivil)}`;
  if (primeiroDiaCivil === ultimoDiaCivil) return curto(ultimoDiaCivil);
  return `${curto(primeiroDiaCivil)} a ${curto(ultimoDiaCivil)}`;
}

/** Nome do fuso que governa TODA a Visão. Vai na resposta para a tela declarar. */
export const OVERVIEW_TZ_LABEL = "Brasília";
