import { AlertTriangle, Check, Lightbulb, Mic, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  InterviewEvaluation,
  InterviewRating,
} from "@/services/interviewService";

// Pele do chat da sessao de entrevista em BLUE, planta do CurriculoChatPanel
// reformado (que e ambar hardcoded e acoplado ao curriculo; precedente E3:
// duplicar o padrao, nao importar): papel pontilhado, bolhas com avatar so no
// inicio de sequencia, TypingDots com reduce e cartao de dica tracejado.
// Ratings mantem a SEMANTICA de cor (emerald/amber/red): e veredito, nao accent.

// Papel da arena: pontilhado azul sutil inline (nada de index.css nem da
// wa-chat-wallpaper, que pertence a outro contexto).
export const CHAT_PAPER_CLASS =
  "bg-[#f8fbff] [background-image:radial-gradient(rgba(37,99,235,0.06)_1.2px,transparent_1.2px)] [background-size:18px_18px]";

const RATING_UI: Record<
  InterviewRating,
  { label: string; icon: typeof Check; box: string; badge: string }
> = {
  // TODO(Ana): labels dos ratings de resposta
  boa: {
    label: "Boa resposta",
    icon: Check,
    box: "border-emerald-500 bg-emerald-50",
    badge: "border-emerald-500 bg-emerald-100 text-emerald-900",
  },
  mediana: {
    label: "Resposta mediana",
    icon: AlertTriangle,
    box: "border-amber-500 bg-amber-50",
    badge: "border-amber-500 bg-amber-100 text-amber-900",
  },
  fraca: {
    label: "Resposta fraca",
    icon: X,
    box: "border-red-500 bg-red-50",
    badge: "border-red-500 bg-red-100 text-red-900",
  },
};

// Avatares mini em caixinha brutal, familia do molde: entrevistador em blue
// solido, candidato em branco. Sempre aria-hidden (decoracao de sequencia).
function AssistantAvatar() {
  return (
    <span
      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-slate-950 bg-blue-600 shadow-[2px_2px_0_#0f172a]"
      aria-hidden
    >
      <Mic className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
    </span>
  );
}

function UserAvatar() {
  return (
    <span
      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-slate-950 bg-white shadow-[2px_2px_0_#0f172a]"
      aria-hidden
    >
      <User className="h-3.5 w-3.5 text-slate-950" strokeWidth={2.5} />
    </span>
  );
}

// Linhas de sequencia: avatar SO no inicio de sequencia do autor; nas demais,
// spacer preservando o alinhamento (mesma logica de groupStart do molde).
export function AssistantRow({
  groupStart,
  children,
}: {
  groupStart: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-start gap-2">
      {groupStart ? (
        <AssistantAvatar />
      ) : (
        <span className="w-7 shrink-0" aria-hidden />
      )}
      {children}
    </div>
  );
}

export function UserRow({
  groupStart,
  children,
}: {
  groupStart: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-end gap-2">
      {children}
      {groupStart ? (
        <UserAvatar />
      ) : (
        <span className="w-7 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function QuestionBubble({ content }: { content: string }) {
  return (
    <div className="max-w-[min(100%,86%)] rounded-[14px] rounded-tl-sm border-2 border-slate-950 bg-blue-50 px-3.5 py-3 font-body text-[15px] leading-relaxed text-slate-900 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3.5 sm:text-base">
      <p className="whitespace-pre-wrap break-words">{content}</p>
    </div>
  );
}

export function AnswerBubble({ content }: { content: string }) {
  return (
    <div className="max-w-[min(100%,86%)] rounded-[14px] rounded-tr-sm border-2 border-slate-950 bg-white px-3.5 py-3 font-body text-[15px] leading-relaxed text-slate-900 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3.5 sm:text-base">
      <p className="whitespace-pre-wrap break-words">{content}</p>
    </div>
  );
}

// Carimbo de avaliacao por resposta: mesma semantica e cores de sempre,
// enquadrado como peca da sequencia do entrevistador.
export function FeedbackCard({
  evaluation,
}: {
  evaluation: InterviewEvaluation;
}) {
  const ui = RATING_UI[evaluation.rating];
  const Icon = ui.icon;
  return (
    <div
      className={cn(
        "max-w-[min(100%,86%)] rounded-[14px] border-2 px-3.5 py-3 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4",
        ui.box,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border-2 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide",
          ui.badge,
        )}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {ui.label}
      </span>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
        {evaluation.feedback}
      </p>
    </div>
  );
}

// Dica pedida pelo candidato: essencia preservada (tracejado, Lightbulb,
// blue), re-encaixada na pele.
export function HintCard({ content }: { content: string }) {
  return (
    <div className="max-w-[min(100%,86%)] rounded-[14px] border-2 border-dashed border-blue-400 bg-blue-50 px-3.5 py-3 sm:max-w-[min(100%,82%)] sm:px-4">
      <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-wide text-blue-800">
        <Lightbulb className="h-3 w-3" aria-hidden />
        {/* TODO(Ana): rotulo do cartao de dica. */}
        Dica
      </span>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
        {content}
      </p>
    </div>
  );
}

// Pontinhos de digitacao no padrao do molde: pulso via classe global
// ai-chat-typing-dot SO sem reduce; com reduce ficam estaticos (o texto
// sr-only do chamador segue comunicando o estado).
export function TypingDots({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cn(
            "h-2.5 w-2.5 rounded-full bg-blue-500",
            !reduce && "ai-chat-typing-dot",
          )}
        />
      ))}
    </div>
  );
}
