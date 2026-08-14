/**
 * Uso por ferramenta: chamadas, custo MEDIDO e chamadas SEM custo medido.
 *
 * A terceira coluna é a que mais importa hoje, e não é enfeite: 7 ferramentas
 * gravam custo 0 porque o call site não passa `costEstimate` para `logAiUsage`.
 * Enquanto isso não fecha (Fase 5), o custo total é um PISO, e esta coluna diz
 * de onde vem a diferença — ou seja, ela prioriza o trabalho da Fase 5 em vez de
 * deixar "conserte os 7 call sites" como uma lista sem ordem.
 */

export type UsoPorFerramenta = {
  tool: string;
  chamadas: number;
  custoUsd: number;
  semCustoMedido: number;
};

export function ToolUsagePanel({
  ferramentas,
  loading,
  error,
  windowLabel,
}: {
  ferramentas?: UsoPorFerramenta[] | null;
  loading?: boolean;
  error?: string | null;
  windowLabel?: string | null;
}) {
  // Payload degradado vira lista vazia, nunca throw no render da Visão.
  const linhas = Array.isArray(ferramentas) ? ferramentas : [];
  const totalChamadas = linhas.reduce((a, f) => a + (f.chamadas ?? 0), 0);
  const totalSemCusto = linhas.reduce((a, f) => a + (f.semCustoMedido ?? 0), 0);

  return (
    <article
      data-testid="uso-por-ferramenta"
      className="card-brutal rounded-3xl bg-white p-5 sm:p-6"
    >
      <p className="text-xs font-black uppercase tracking-wide text-violet-700">
        uso de IA por ferramenta
      </p>
      <h3 className="font-display text-lg font-black text-slate-950 sm:text-xl">
        Quem consome, e quanto disso a gente mede?
      </h3>
      {windowLabel ? (
        <p className="mt-1 text-xs font-bold text-slate-500">{windowLabel}</p>
      ) : null}

      {loading ? (
        <p
          data-testid="ferramentas-loading"
          className="mt-5 text-sm font-bold text-slate-500"
        >
          Carregando…
        </p>
      ) : error ? (
        <p
          data-testid="ferramentas-erro"
          className="mt-5 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-black text-rose-800"
        >
          {error}
        </p>
      ) : linhas.length === 0 ? (
        <p
          data-testid="ferramentas-vazio"
          className="mt-5 text-sm font-bold text-slate-500"
        >
          Nenhuma chamada de IA no período.
        </p>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-black uppercase text-slate-500">
                  <th className="pb-2">Ferramenta</th>
                  <th className="pb-2 text-right">Chamadas</th>
                  <th className="pb-2 text-right">Custo medido</th>
                  <th className="pb-2 text-right">Sem custo</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((f) => (
                  <tr
                    key={f.tool}
                    data-testid="ferramenta-linha"
                    data-tool={f.tool}
                    className="border-t-2 border-slate-200"
                  >
                    <td className="py-2 font-bold text-slate-900">{f.tool}</td>
                    <td className="py-2 text-right font-semibold text-slate-700">
                      {(f.chamadas ?? 0).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-700">
                      US$ {(f.custoUsd ?? 0).toFixed(2)}
                    </td>
                    <td
                      className={`py-2 text-right font-black ${
                        (f.semCustoMedido ?? 0) > 0
                          ? "text-amber-700"
                          : "text-slate-400"
                      }`}
                    >
                      {(f.semCustoMedido ?? 0).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalSemCusto > 0 ? (
            <p
              data-testid="ferramentas-piso"
              className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-3 text-xs font-bold text-amber-900"
            >
              {totalSemCusto.toLocaleString("pt-BR")} de{" "}
              {totalChamadas.toLocaleString("pt-BR")} chamadas rodaram sem custo
              medido. O custo total é um piso enquanto isso não fecha.
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
