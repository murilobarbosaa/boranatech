import { emptyBlockClass, secondaryButtonClass } from "./taskBoardStyles";
import { activityDotOf, activityLineOf } from "./taskActivityMeta";
import { relativeTime } from "./relativeTime";
import type { TaskActivity, TaskAssignee } from "./types";

// Histórico da tarefa. Uma linha por alteracao, do mais novo para o mais velho.
//
// Nada aqui resolve id contra o estado ATUAL do quadro: os rotulos saem do
// payload que o server denormalizou na hora da escrita (ver activityLineOf).
// A unica excecao e o NOME DO ATOR, que vem da lista de admins do snapshot com
// fallback, porque o ator e sempre uma pessoa da equipe e nao interessa
// congelar como ela se chamava.

type TaskActivityListProps = {
  activity: TaskActivity[];
  admins: TaskAssignee[];
  hasMore: boolean;
  loadingMore: boolean;
  /** Relogio injetado, para o teste nao depender de Date.now(). */
  nowMs: number;
  onLoadMore: () => void;
};

export function TaskActivityList({
  activity,
  admins,
  hasMore,
  loadingMore,
  nowMs,
  onLoadMore,
}: TaskActivityListProps) {
  if (activity.length === 0) {
    return (
      <p className={emptyBlockClass}>
        Nenhuma alteração registrada ainda.
      </p>
    );
  }

  const nameOf = (actorId: string | null) => {
    if (!actorId) return "Sistema";
    const admin = admins.find((item) => item.user_id === actorId);
    // Ator que nao e mais admin some da lista; o histórico continua legivel.
    return admin?.name ?? admin?.email ?? "Alguém";
  };

  return (
    <div>
      <ol className="space-y-2.5">
        {activity.map((entry) => {
          const line = activityLineOf(entry);
          return (
            <li key={entry.id} className="flex items-start gap-2.5">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full border border-slate-900 ${activityDotOf(line.kind)}`}
              />
              <p className="min-w-0 flex-1 text-[0.82rem] leading-relaxed text-slate-600">
                <span className="font-black text-slate-900">
                  {nameOf(entry.actor_id)}
                </span>{" "}
                {line.text}
                <span className="ml-1.5 whitespace-nowrap text-[11px] font-semibold text-slate-400">
                  {relativeTime(entry.created_at, nowMs)}
                </span>
              </p>
            </li>
          );
        })}
      </ol>

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className={`${secondaryButtonClass} mt-3 w-full text-xs`}
        >
          {loadingMore ? "Carregando…" : "Carregar mais"}
        </button>
      ) : null}
    </div>
  );
}
