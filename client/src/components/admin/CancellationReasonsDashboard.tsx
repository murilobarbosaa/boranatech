import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/adminApi";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";

// TODO(Ana): revisar TODA a copy visivel deste bloco (rotulos dos motivos, selo
// de amostra pequena, titulo dos comentarios, estado vazio e de erro).

type ByReason = { code: string; count: number; percent: number };
type CancellationComment = {
  reasonCode: string | null;
  reasonText: string | null;
  canceledAt: string | null;
};
type CancellationReasonsData = {
  total: number;
  byReason: ByReason[];
  comments: CancellationComment[];
  // Auxiliar: quem deu o motivo e voltou atras. Fora do total e dos percentuais.
  revertedCount: number;
};

// Traducao dos 5 reason_code (CHECK da subscription_cancellations) para pt-BR.
// TODO(Ana): revisar os rotulos dos motivos de cancelamento.
const REASON_LABELS: Record<string, string> = {
  expensive: "Está caro",
  unused: "Não estava usando",
  missing_feature: "Faltou funcionalidade",
  paused: "Vai pausar, volta depois",
  other: "Outro motivo",
};

// Abaixo disso, percentual e enganoso (1 de 2 = 50%). Mesmo limiar/espirito do
// ConversionDashboard e do PagesDashboard.
const SMALL_SAMPLE_THRESHOLD = 20;

function reasonLabel(code: string | null): string {
  if (!code) return "Sem motivo informado";
  return REASON_LABELS[code] ?? code;
}

function fmtDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function CancellationReasonsDashboard() {
  const [data, setData] = useState<CancellationReasonsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminFetch("/cancellation-reasons")
      .then((json) => {
        if (cancelled) return;
        setData(json.data as CancellationReasonsData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar motivos.",
        );
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return <LoadingBlock />;

  if (data.total === 0) {
    return (
      <div className="rounded-2xl border-2 border-slate-900 bg-emerald-50 p-4">
        {/* TODO(Ana): copy do estado vazio (ninguem cancelou ainda). */}
        <p className="font-display text-lg font-black text-slate-950">
          Ninguém cancelou ainda
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Quando alguém cancelar, os motivos aparecem aqui. Por enquanto, é uma
          boa notícia: nenhum cancelamento registrado.
        </p>
      </div>
    );
  }

  const small = data.total < SMALL_SAMPLE_THRESHOLD;
  const ranked = data.byReason
    .filter((reason) => reason.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-black text-slate-700">
          {/* TODO(Ana): copy do total de cancelamentos. */}
          {data.total} cancelamento{data.total === 1 ? "" : "s"}
        </p>
        {small ? (
          // TODO(Ana): copy do selo de amostra pequena.
          <span
            className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[10px] font-black uppercase text-slate-500"
            title="Amostra pequena: percentual pouco confiável."
          >
            amostra pequena
          </span>
        ) : null}
      </div>

      {ranked.length ? (
        <div className="space-y-3">
          {ranked.map((reason) => (
            <div key={reason.code}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-slate-800">
                  {reasonLabel(reason.code)}
                </span>
                <span className="text-sm font-bold text-slate-600">
                  {reason.count}
                  <span
                    className={`ml-2 font-black ${small ? "text-slate-400" : "text-violet-700"}`}
                  >
                    {reason.percent}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full border-2 border-slate-900 bg-white">
                <div
                  className={`h-full ${small ? "bg-slate-300" : "bg-violet-600"}`}
                  style={{ width: `${Math.min(100, reason.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-500">
          {/* TODO(Ana): copy de cancelamentos sem motivo informado. */}
          Nenhum motivo informado nos cancelamentos registrados.
        </p>
      )}

      {data.comments.length ? (
        <div className="border-t-2 border-slate-200 pt-4">
          <p className="mb-2 font-display text-lg font-black text-slate-950">
            {/* TODO(Ana): titulo do bloco de comentarios livres. */}
            Comentários
          </p>
          <div className="space-y-3">
            {data.comments.map((comment, index) => (
              <div
                key={`${comment.canceledAt ?? ""}-${index}`}
                className="rounded-2xl border-2 border-slate-900 bg-white p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border-2 border-slate-900 bg-violet-50 px-2 py-0.5 text-[11px] font-black uppercase text-violet-700">
                    {reasonLabel(comment.reasonCode)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {fmtDate(comment.canceledAt)}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                  {comment.reasonText}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.revertedCount > 0 ? (
        <div className="border-t-2 border-slate-200 pt-4">
          {/* TODO(Ana): copy da linha auxiliar de revertidos. Nao prometer que
              ficaram: no cartao e reativacao real, no boleto e so desfazer o
              aviso (a pessoa ainda pode nao pagar o proximo boleto). */}
          <p className="text-xs font-bold text-slate-500">
            {data.revertedCount === 1
              ? "1 pessoa deu um motivo mas voltou atrás do aviso de cancelamento. Fora da distribuição acima."
              : `${data.revertedCount} pessoas deram um motivo mas voltaram atrás do aviso de cancelamento. Fora da distribuição acima.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
