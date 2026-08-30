// Seletor de período da aba Visão.
//
// TRÊS janelas: 7 / 30 / tudo. 90 dias NÃO é oferecida porque a série de
// snapshots começou em 16/07 e a de receita em 13/07 — um seletor que oferece
// uma janela que não existe preenche o gráfico com nada e chama isso de dado.
//
// "Tudo" declara a data de início real ao lado, para "tudo" não parecer "desde
// sempre".
//
// GRADE DE 3 NO MOBILE, não dropdown: são três opções curtas, e um dropdown
// esconderia atrás de dois toques a decisão que governa a página inteira. No
// desktop volta a ser a fileira de pílulas do FinanceDashboard, que é o padrão
// que já existe no admin.

import { dataDeInstante } from "./overviewChange";

export const OVERVIEW_WINDOWS = ["7", "30", "all"] as const;
export type OverviewWindow = (typeof OVERVIEW_WINDOWS)[number];

const ROTULOS: Record<OverviewWindow, string> = {
  "7": "7 dias",
  "30": "30 dias",
  all: "Tudo",
};

/** Valor da URL para uma janela válida. Lixo e ausência caem em 30. */
export function parseOverviewWindow(valor: string | null): OverviewWindow {
  return valor && (OVERVIEW_WINDOWS as readonly string[]).includes(valor)
    ? (valor as OverviewWindow)
    : "30";
}

export function OverviewPeriod({
  window: janela,
  onChange,
  seriesStart,
  windows = OVERVIEW_WINDOWS,
  testId = "overview-periodo",
}: {
  window: OverviewWindow;
  onChange: (proxima: OverviewWindow) => void;
  /** Data do dado mais antigo, para "Tudo" dizer desde quando. */
  seriesStart?: string | null;
  /**
   * SUBCONJUNTO das janelas, para quem nao pode oferecer todas. O grafico de
   * ativos por dia usa isto para omitir "Tudo": serie diaria sem corte nao tem
   * teto de baldes. O default e a lista inteira, entao a Visao nao muda.
   *
   * Reusar este componente em vez de copiar as pilulas e deliberado: sao duas
   * abas vizinhas escolhendo periodo, e dois seletores parecidos-mas-nao-iguais
   * e como o vocabulario visual se perde.
   */
  windows?: readonly OverviewWindow[];
  /** Distingue os dois seletores quando os dois estao montados na mesma tela. */
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div
        data-testid={testId}
        className={`grid gap-2 sm:flex sm:flex-wrap ${
          windows.length === 2 ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {windows.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={janela === id}
            onClick={() => onChange(id)}
            className={`rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-black uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:py-1.5 ${
              janela === id
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {ROTULOS[id]}
          </button>
        ))}
      </div>
      {janela === "all" && seriesStart ? (
        <p
          data-testid="overview-periodo-inicio"
          className="text-xs font-bold text-slate-500"
        >
          Desde {dataDeInstante(seriesStart)}
        </p>
      ) : null}
    </div>
  );
}
