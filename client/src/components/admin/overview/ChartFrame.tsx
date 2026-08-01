import type { ReactNode } from "react";

import type { Tendencia } from "./chartMath";

// A moldura comum dos dois gráficos da Visão.
//
// Existe para que os estados que NÃO são "gráfico desenhado" sejam idênticos nos
// dois: carregando, erro e vazio. Cada gráfico reimplementando isso é como um
// deles acaba desenhando uma área em branco quando a leitura falha, que é
// indistinguível de "não aconteceu nada no período".
//
// A ORDEM DA MOLDURA É A ORDEM DA LEITURA: pergunta, resposta em uma frase,
// gráfico, ressalvas. Quem tem três segundos lê as duas primeiras linhas e para;
// o gráfico é para quem quer o formato, e o rodapé para quem vai agir.

export const TENDENCIA_CLASSE: Record<Tendencia["tom"], string> = {
  alta: "text-emerald-700",
  baixa: "text-rose-700",
  neutro: "text-slate-600",
};

export function ChartFrame({
  titulo,
  pergunta,
  testId,
  erro,
  vazio,
  carregando,
  tendencia,
  rodape,
  children,
}: {
  titulo: string;
  /** A pergunta que este gráfico responde, escrita na tela. */
  pergunta: string;
  testId: string;
  erro: string | null;
  vazio: boolean;
  carregando: boolean;
  tendencia: Tendencia;
  /** Ressalvas. Vazio quando não há nada de excepcional a dizer. */
  rodape: string[];
  children: ReactNode;
}) {
  return (
    <article
      data-testid={testId}
      data-estado={
        erro ? "erro" : carregando ? "carregando" : vazio ? "vazio" : "ok"
      }
      className="card-brutal rounded-3xl bg-white p-5 sm:p-6"
    >
      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
        {titulo}
      </p>
      <h3 className="font-display text-lg font-black text-slate-950 sm:text-xl">
        {pergunta}
      </h3>

      {erro ? (
        <p
          data-testid={`${testId}-erro`}
          className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900"
        >
          {erro}
        </p>
      ) : carregando ? (
        <div className="mt-4 h-[220px] animate-pulse rounded-2xl bg-slate-100" />
      ) : vazio ? (
        // VAZIO NÃO É ZERO. Sem medição nenhuma o gráfico não desenha uma linha
        // no chão: ele diz que não há série.
        <p
          data-testid={`${testId}-vazio`}
          className="mt-4 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-xs font-bold text-slate-500"
        >
          Ainda não há medições neste período.
        </p>
      ) : (
        <>
          <p
            data-testid={`${testId}-tendencia`}
            className={`mt-1 text-sm font-black ${TENDENCIA_CLASSE[tendencia.tom]}`}
          >
            {tendencia.texto}
          </p>
          {/* Altura fixa e largura 100%: o ResponsiveContainer precisa de um pai
              com altura, e a largura acompanha a coluna. Em 380px o cartão
              encolhe e NÃO gera rolagem horizontal. */}
          <div className="mt-3 h-[220px] w-full sm:h-[260px]">{children}</div>
          {rodape.length > 0 ? (
            <ul
              data-testid={`${testId}-ressalvas`}
              className="mt-3 space-y-1 border-t-2 border-slate-100 pt-3"
            >
              {rodape.map((linha) => (
                <li
                  key={linha}
                  className="text-xs font-semibold text-slate-500"
                >
                  {linha}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </article>
  );
}
