import type { ReactNode } from "react";
import { ArrowRight, ListChecks, Lock, RefreshCw, ShieldCheck, Trophy } from "lucide-react";

import { useCountdown } from "@/hooks/useCountdown";
import {
  COOLDOWN_HOURS,
  DRAW_BY_LEVEL,
  PASS_SCORE,
  QUESTIONS_PER_ATTEMPT,
  RETAKE_LIMIT,
} from "@shared/roadmapQuiz/types";
import type {
  QuizAttemptSummary,
  RetakeGate,
} from "@/services/roadmapQuizService";

// Tela explicativa (briefing) antes da prova final: regras + historico + botao
// de comecar/retomar. Tom sobrio "modo estudo" (acento violet-800), distinto do
// card dourado de conquista (#FFB800 reservado pra celebracao). NADA aqui cria
// tentativa: o botao chama onStart, que so entao dispara o startOrResume no
// server (que retoma a ativa com o mesmo snapshot, se existir).

const violetBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-violet-800 px-5 py-3 text-sm font-black text-white shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] sm:w-auto";

function formatRetryAt(retryAt: string | null | undefined): string {
  if (!retryAt) return "mais tarde";
  const date = new Date(retryAt);
  if (Number.isNaN(date.getTime())) return "mais tarde";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Junta numeros em portugues: "4", "4 e 5", "4, 5 e 4".
function formatList(items: number[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function RuleRow({
  icon,
  children,
  emphasis = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-3 rounded-[11px] border-2 p-3 ${
        emphasis
          ? "border-violet-300 bg-violet-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 ${
          emphasis ? "text-violet-800" : "text-slate-700"
        }`}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold leading-snug text-slate-800">
        {children}
      </span>
    </li>
  );
}

type QuizBriefingProps = {
  attempts?: QuizAttemptSummary[];
  // Opcional: dado suplementar. Ausente = server desatualizado (restart
  // pendente). NAO assumimos "permitido" cegamente (ver abaixo): so liberamos
  // quando ha certeza (retakeGate presente OU zero reprovacoes).
  retakeGate?: RetakeGate;
  hasActive: boolean;
  onStart: () => void;
  // Revalidar quando o cooldown expira (o caller re-busca o historico).
  onExpire?: () => void;
};

export default function QuizBriefing({
  attempts,
  retakeGate,
  hasActive,
  onStart,
  onExpire,
}: QuizBriefingProps) {
  const reprovadas = (attempts ?? []).filter((a) => a.status === "reprovada");
  const notas = reprovadas
    .map((a) => a.score)
    .filter((s): s is number => s != null);

  // Sem retakeGate (server sem restart), NAO assumimos permitido cegamente: um
  // botao clicavel enganaria quem esta em cooldown. So liberamos com CERTEZA:
  // retakeGate presente (verdade do server) OU zero reprovacoes (impossivel ter
  // cooldown). Com reprovacoes e sem retakeGate, ficamos em "verificando".
  const known = retakeGate != null;
  const inCooldown = known && !retakeGate.allowed;
  const checking = !known && reprovadas.length > 0;
  const allowed = known ? retakeGate.allowed : reprovadas.length === 0;
  const countdown = useCountdown(
    inCooldown ? retakeGate.retryAt : null,
    onExpire,
  );

  return (
    <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[4px_4px_0_#5b21b6] sm:p-6">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-violet-800">
        Como funciona
      </span>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        Leia as regras antes de começar. A prova abre assim que você confirmar.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        <RuleRow icon={<ListChecks className="h-5 w-5" aria-hidden />}>
          {QUESTIONS_PER_ATTEMPT} questões: {DRAW_BY_LEVEL.iniciante} de nível
          iniciante, {DRAW_BY_LEVEL.intermediario} intermediário e{" "}
          {DRAW_BY_LEVEL.avancado} avançado.
        </RuleRow>
        <RuleRow icon={<Trophy className="h-5 w-5" aria-hidden />}>
          Você passa acertando {PASS_SCORE} de {QUESTIONS_PER_ATTEMPT}.
        </RuleRow>
        <RuleRow icon={<RefreshCw className="h-5 w-5" aria-hidden />}>
          Você tem {RETAKE_LIMIT} tentativas. Se reprovar nas {RETAKE_LIMIT},
          espera {COOLDOWN_HOURS} horas para tentar de novo.
        </RuleRow>
        <RuleRow icon={<Lock className="h-5 w-5" aria-hidden />} emphasis>
          Se você passar, a nota é final. Não dá para refazer a prova para
          melhorar a nota.
        </RuleRow>
        <RuleRow icon={<ShieldCheck className="h-5 w-5" aria-hidden />}>
          A correção é feita no servidor assim que você envia as respostas.
        </RuleRow>
      </ul>

      <div className="mt-5 border-t-2 border-slate-100 pt-4">
        {hasActive ? (
          <p className="text-sm font-bold text-slate-700">
            Você tem uma prova em andamento. Suas respostas parciais foram
            salvas, é só retomar de onde parou.
          </p>
        ) : reprovadas.length > 0 ? (
          <p className="text-sm font-bold text-slate-700">
            {notas.length > 0
              ? `Notas das tentativas anteriores: ${formatList(notas)} de ${QUESTIONS_PER_ATTEMPT}.`
              : `Você já fez ${reprovadas.length} ${
                  reprovadas.length === 1 ? "tentativa" : "tentativas"
                }.`}
            {retakeGate && retakeGate.allowed
              ? ` Restam ${retakeGate.remaining} de ${RETAKE_LIMIT} tentativas neste ciclo.`
              : ""}
          </p>
        ) : (
          <p className="text-sm font-bold text-slate-700">
            Esta é sua primeira tentativa.
          </p>
        )}
      </div>

      {allowed ? (
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onStart} className={violetBtn}>
            {hasActive ? "Retomar prova" : "Começar a prova"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : inCooldown ? (
        <div className="mt-5 rounded-[11px] border-2 border-slate-900 bg-violet-50 p-4 text-center">
          <p className="text-sm font-bold text-slate-900">
            Você usou as {RETAKE_LIMIT} tentativas deste ciclo.
          </p>
          {countdown ? (
            <p className="mt-2 font-mono text-3xl font-black tabular-nums text-slate-950">
              {countdown}
            </p>
          ) : null}
          <p className="mt-1 text-xs font-bold text-slate-600">
            Novas tentativas a partir de {formatRetryAt(retakeGate?.retryAt)}.
          </p>
        </div>
      ) : (
        // Sem retakeGate mas com reprovacoes: nao sabemos o cooldown. Botao
        // desabilitado em vez de enganar com um "Comecar" que cairia em 429.
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled
            className={`${violetBtn} opacity-50`}
          >
            Verificando disponibilidade...
          </button>
        </div>
      )}
    </div>
  );
}
