import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Award, RotateCcw, Trash2 } from "lucide-react";

import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  deleteSession,
  listSessions,
  InterviewApiError,
  type InterviewSessionSummary,
} from "@/services/interviewService";

const ac = getPageAccentUi("blue");

// Galeria de sessoes com placar visual e estados HONESTOS: skeleton so
// enquanto a promise vive, erro visivel com tentar de novo, vazio com CTA
// para o palco. O sumico silencioso da versao antiga morreu. Badge de
// Preparado e FAIL-CLOSED: so quando verdict.result === "prepared" veio
// explicito do server; nunca inferido de contadores.

type GalleryStatus = "loading" | "ready" | "error";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border-2 border-slate-200 bg-white p-4"
      aria-hidden
    >
      <div className="h-4 w-2/3 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
      <div className="mt-4 h-3 w-3/4 rounded bg-slate-100" />
      <div className="mt-4 flex justify-end">
        <div className="h-8 w-8 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export default function SessionGallery({
  onEmptyCta,
}: {
  onEmptyCta?: () => void;
}) {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<GalleryStatus>("loading");
  const [sessions, setSessions] = useState<InterviewSessionSummary[]>([]);
  // Exclusao em dois passos inline, padrao da galeria de curriculos.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    listSessions()
      .then((list) => {
        if (!alive) return;
        setSessions(list);
        setStatus("ready");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      if (err instanceof InterviewApiError && err.code === "not_found") {
        // Ja nao existia: some da lista do mesmo jeito.
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
      // Outras falhas: o botao volta ao estado normal e o item fica.
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      {/* TODO(Ana): titulo da secao de historico */}
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
        Suas entrevistas
      </p>

      {status === "loading" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-4 rounded-2xl border-2 border-red-400 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900">
            {/* TODO(Ana): erro ao carregar a galeria de sessoes. */}
            Não foi possível carregar suas entrevistas.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {/* TODO(Ana): acao de tentar carregar de novo. */}
            Tentar de novo
          </button>
        </div>
      ) : null}

      {status === "ready" && sessions.length === 0 ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-400 bg-white/70 p-6 text-center">
          <p className="text-sm font-bold text-slate-700">
            {/* TODO(Ana): estado vazio da galeria. */}
            Você ainda não fez nenhuma entrevista simulada.
          </p>
          {onEmptyCta ? (
            <button
              type="button"
              onClick={onEmptyCta}
              className={cn(
                "mt-3 inline-flex rounded-full border-2 border-slate-950 bg-white px-4 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px",
                ac.cardHover,
              )}
            >
              {/* TODO(Ana): CTA do estado vazio (leva ao palco). */}
              Começar a primeira agora
            </button>
          ) : null}
        </div>
      ) : null}

      {status === "ready" && sessions.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const title =
              s.kind === "job" ? "Preparação para vaga" : "Treino geral";
            const prepared = s.verdict?.result === "prepared";
            return (
              <div
                key={s.id}
                className="card-brutal rounded-2xl bg-white p-4 transition-transform hover:-translate-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/entrevistas/sessao/${s.id}`)}
                  className="block w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-black text-slate-950">
                      {title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border-2 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
                        s.status === "active"
                          ? "border-blue-400 bg-blue-100 text-blue-900"
                          : "border-emerald-400 bg-emerald-100 text-emerald-900",
                      )}
                    >
                      {s.status === "active" ? "Em andamento" : "Concluída"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-600">
                    {s.area ?? "Área não informada"} ·{" "}
                    {s.level ?? "nível não informado"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
                        ac.tag,
                      )}
                    >
                      {/* TODO(Ana): rotulos do badge de idioma. */}
                      {s.language === "en" ? "EN" : "PT"}
                    </span>
                    {prepared ? (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-500 bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-emerald-900">
                        <Award className="h-3 w-3" aria-hidden />
                        {/* TODO(Ana): badge de sessao preparada. */}
                        Preparado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {s.question_count > 0
                      ? `${s.good_count} boas de ${s.question_count} respostas · `
                      : ""}
                    {formatDate(s.created_at)}
                  </p>
                </button>
                <div className="mt-3 flex justify-end">
                  {confirmingId === s.id ? (
                    <button
                      type="button"
                      disabled={deletingId === s.id}
                      onClick={() => void handleDelete(s.id)}
                      /* TODO(Ana): label de acessibilidade da confirmacao. */
                      aria-label={`Confirmar exclusão de ${title}`}
                      className="rounded-full border-2 border-slate-950 bg-rose-600 px-4 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {/* TODO(Ana): rotulos da exclusao em dois passos. */}
                      {deletingId === s.id ? "Excluindo..." : "Confirmar exclusão"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(s.id)}
                      /* TODO(Ana): label de acessibilidade do botao excluir. */
                      aria-label={`Excluir ${title}`}
                      title="Excluir entrevista"
                      className="rounded-full border-2 border-slate-950 bg-white p-2 text-slate-600 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
