import { useCallback, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import type {
  GenerationHandlers,
  StreamResult,
} from "@/services/aiRoadmapService";

// Estado e UI compartilhados da geracao ao vivo do Roadmap com IA (usados pela
// pagina de intake e pela retomada na visualizacao). O hook consome os streams
// do aiRoadmapService e a card renderiza o progresso etapa a etapa.

// TODO(Ana): revisar todas as mensagens de status e erro da geracao abaixo.
const MESSAGES = {
  generic: "Nao consegui gerar agora. Tente novamente.",
  connectionLost:
    "A conexao caiu no meio da geracao. O que ja foi gerado ficou salvo e voce pode retomar.",
  quota: "Voce atingiu o limite diario de ferramentas de IA. Tente novamente amanha.",
  inProgress: "Ja existe uma geracao em andamento. Aguarde alguns minutos e tente de novo.",
  proRequired: "O Roadmap com IA e exclusivo do Plano Pro.",
  unavailable: "O servico de IA esta indisponivel agora. Tente novamente em instantes.",
  preparing: "Montando seu roadmap...",
  step: (done: number, total: number) => `Gerando etapa ${done} de ${total}`,
  resume: "Retomar de onde parou",
  retry: "Tentar de novo",
} as const;

// Traduz o codigo de bloqueio pre-SSE do backend (quota, geracao em andamento,
// Pro, indisponibilidade) para a mensagem da UI.
function blockedMessage(code: string, fallback: string): string {
  if (code === "rate_limited") return MESSAGES.quota;
  if (code === "generation_in_progress" || code === "resume_in_progress") {
    return MESSAGES.inProgress;
  }
  if (code === "pro_required") return MESSAGES.proRequired;
  if (
    code === "rate_check_failed" ||
    code === "upstream_error" ||
    code === "concurrency_check_failed" ||
    code === "resume_lock_failed" ||
    code === "load_failed"
  ) {
    return MESSAGES.unavailable;
  }
  return fallback;
}

export interface AiGenerationState {
  phase: "idle" | "running" | "done" | "error" | "blocked";
  // Preenchidos pelo evento skeleton; slug permite oferecer a retomada.
  slug: string | null;
  title: string | null;
  total: number;
  completed: number;
  message: string | null;
  // Presente quando o erro veio de uma secao especifica (parcial salvo).
  sectionIndex: number | null;
  blockedCode: string | null;
}

const INITIAL_STATE: AiGenerationState = {
  phase: "idle",
  slug: null,
  title: null,
  total: 0,
  completed: 0,
  message: null,
  sectionIndex: null,
  blockedCode: null,
};

export function useAiGeneration(onDone: (slug: string) => void) {
  const [state, setState] = useState<AiGenerationState>(INITIAL_STATE);

  const start = useCallback(
    async (
      runner: (handlers: GenerationHandlers) => Promise<StreamResult>,
    ): Promise<void> => {
      setState({ ...INITIAL_STATE, phase: "running" });
      let result: StreamResult;
      try {
        result = await runner({
          onSkeleton: ({ slug, title, total }) =>
            setState((s) => ({
              ...s,
              slug: slug || s.slug,
              title: title || s.title,
              total: total || s.total,
            })),
          onSection: ({ total }) =>
            setState((s) => ({
              ...s,
              total: total || s.total,
              completed: s.completed + 1,
            })),
          onError: ({ message, sectionIndex }) =>
            setState((s) => ({
              ...s,
              phase: "error",
              message,
              sectionIndex: sectionIndex ?? null,
            })),
          onDone: ({ slug }) => {
            setState((s) => ({ ...s, phase: "done", slug: slug || s.slug }));
            onDone(slug);
          },
        });
      } catch {
        // Queda de rede no meio do stream: o server persiste por secao, entao
        // o que chegou a ser gerado esta salvo (parcial) e da pra retomar.
        setState((s) => ({
          ...s,
          phase: "error",
          message: MESSAGES.connectionLost,
        }));
        return;
      }
      if (!result.ok) {
        setState((s) => ({
          ...s,
          phase: "blocked",
          blockedCode: result.blocked,
          message: blockedMessage(result.blocked, result.message),
        }));
      }
    },
    [onDone],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { state, start, reset };
}

interface AiGenerationProgressCardProps {
  state: AiGenerationState;
  // Oferecido no erro parcial quando o slug e conhecido.
  onResume?: (slug: string) => void;
  // Volta ao formulario/estado anterior apos erro ou bloqueio.
  onReset?: () => void;
}

export function AiGenerationProgressCard({
  state,
  onResume,
  onReset,
}: AiGenerationProgressCardProps) {
  if (state.phase === "idle") return null;

  const pct =
    state.total > 0
      ? Math.min(100, Math.round((state.completed / state.total) * 100))
      : 0;

  if (state.phase === "running" || state.phase === "done") {
    return (
      <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#0f172a]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-[2px] border-slate-900 bg-violet-600">
            <Sparkles className="h-5 w-5 text-white motion-safe:animate-pulse" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-black leading-tight text-slate-950">
              {state.title ?? MESSAGES.preparing}
            </p>
            <p className="text-sm font-bold text-slate-600">
              {state.total > 0
                ? MESSAGES.step(Math.min(state.completed + 1, state.total), state.total)
                : MESSAGES.preparing}
            </p>
          </div>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full border-[2px] border-slate-900 bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${Math.max(pct, 6)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#f43f5e]">
      <p className="font-bold text-slate-900">{state.message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {state.phase === "error" && state.slug && onResume ? (
          <button
            type="button"
            onClick={() => onResume(state.slug as string)}
            className="inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
          >
            <RotateCcw className="h-4 w-4" />
            {MESSAGES.resume}
          </button>
        ) : null}
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center rounded-[11px] border-[2.5px] border-slate-900 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a]"
          >
            {MESSAGES.retry}
          </button>
        ) : null}
      </div>
    </div>
  );
}
