import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

import type { PosthogUserActivityState } from "./types";
import { fmtDateTime } from "./userFormat";

export function ActivityBlock({
  loading,
  error,
  state,
}: {
  loading: boolean;
  error: string | null;
  state: PosthogUserActivityState | null;
}) {
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!state) return <LoadingBlock />;

  if (state.state === "not_configured") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
        <p className="font-display text-base font-black text-amber-900">
          PostHog não configurado
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-800">
          Faltando no servidor:{" "}
          {state.missing.length
            ? state.missing.join(", ")
            : "credenciais do PostHog"}
          .
        </p>
      </div>
    );
  }

  if (state.state === "error") {
    return (
      <ErrorBlock
        message={`Falha ao consultar o PostHog${
          typeof state.httpStatus === "number"
            ? ` (HTTP ${state.httpStatus})`
            : ""
        }: ${state.reason}`}
      />
    );
  }

  if (!state.hasData) {
    return (
      <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        Sem atividade registrada para este usuário.
      </div>
    );
  }

  const { features, navigation } = state.activity;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <p className="mb-2 font-display text-lg font-black text-slate-950">
          Funcionalidades usadas
        </p>
        {features.length ? (
          <ul className="space-y-2">
            {features.map((item) => (
              <li
                key={item.event}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-white px-3 py-2"
              >
                <span className="break-all font-semibold text-slate-800">
                  {item.event}
                </span>
                <span className="rounded-full border-2 border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs font-black">
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-500">
            Nenhuma funcionalidade usada até agora.
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 font-display text-lg font-black text-slate-950">
          Histórico de navegação
        </p>
        {navigation.length ? (
          <ul className="space-y-2">
            {navigation.map((item, index) => (
              <li
                key={`${item.timestamp}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-white px-3 py-2"
              >
                <span className="break-all font-semibold text-slate-800">
                  {item.page}
                </span>
                <span className="whitespace-nowrap text-xs font-black text-slate-500">
                  {fmtDateTime(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-500">
            Nenhuma navegação registrada.
          </div>
        )}
      </div>
    </div>
  );
}
