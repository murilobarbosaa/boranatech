import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Painel de chat de intake GENERICO: renderiza uma conversa turno a turno e
// emite o texto digitado, sem conhecer a feature (roadmap, plano de carreira,
// etc). O contrato do turno (mensagens, envio, erro, limite, progresso) vem por
// props; o caller e quem fala com o backend, guarda o historico e decide o que
// fazer com o intake. Estilo no vocabulario do produto (borda grossa, sombra
// flat). Reaproveita a camada visual do antigo shared/AiChatPanel (bolhas,
// typing dots, autoscroll, Enter envia), mas sem o acoplamento a callAiChat: o
// turno aqui e estruturado e vive fora do componente.

export interface IntakeChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Progresso leve da conversa (quantos campos essenciais ja foram capturados).
// O caller calcula a partir do missing[] que o backend devolve; o painel so
// desenha. Nao e um formulario: e um respiro de "estamos quase la".
export interface IntakeChatProgress {
  done: number;
  total: number;
}

interface IntakeChatPanelProps {
  messages: IntakeChatMessage[];
  sending: boolean;
  onSend: (text: string) => void;
  // Cabecalho opcional (a pagina ja pode ter o seu titulo; career plan pode usar).
  title?: string;
  subtitle?: string;
  // Erro do ultimo turno (mensagem amigavel ja pronta) e reenvio da ultima
  // mensagem do usuario sem duplicar o historico.
  error?: string | null;
  onRetry?: () => void;
  // Limite de turnos atingido: input travado, mensagem propria do caller.
  turnLimitReached?: boolean;
  turnLimitMessage?: string;
  progress?: IntakeChatProgress | null;
  placeholder?: string;
  // Trava o input mesmo sem estar enviando (ex: enquanto o caller processa o
  // envio final). Nao usado para o limite de turnos (esse tem prop propria).
  inputDisabled?: boolean;
}

// TODO(Ana): revisar as strings visiveis deste componente (dica de envio,
// rotulo de tentar de novo, texto de digitando e placeholder padrao).
const COPY = {
  typing: "Digitando",
  retry: "Tentar de novo",
  sendHint: "Enter envia, Shift+Enter quebra linha",
  placeholder: "Escreva sua resposta",
  progressLabel: (done: number, total: number) =>
    `Conversa: ${done} de ${total}`,
} as const;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="ai-chat-typing-dot h-2.5 w-2.5 rounded-full bg-violet-500"
        />
      ))}
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full border-2 border-slate-900 bg-violet-600 shadow-[1px_1px_0_#0f172a] sm:h-8 sm:w-8"
      aria-hidden
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-200 sm:h-4 sm:w-4" />
    </div>
  );
}

function ProgressStrip({ done, total }: IntakeChatProgress) {
  const safeTotal = Math.max(total, 1);
  const filled = Math.max(0, Math.min(done, safeTotal));
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1" aria-hidden>
        {Array.from({ length: safeTotal }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full border border-slate-900/70 transition-colors",
              i < filled ? "bg-violet-600" : "bg-white",
            )}
          />
        ))}
      </div>
      <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
        {COPY.progressLabel(filled, safeTotal)}
      </span>
    </div>
  );
}

export default function IntakeChatPanel({
  messages,
  sending,
  onSend,
  title,
  subtitle,
  error,
  onRetry,
  turnLimitReached = false,
  turnLimitMessage,
  progress,
  placeholder = COPY.placeholder,
  inputDisabled = false,
}: IntakeChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasSendingRef = useRef(false);

  const locked = sending || turnLimitReached || inputDisabled;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Foco volta ao input quando o turno termina (sending true -> false), para
  // navegacao so por teclado seguir fluida.
  useEffect(() => {
    if (wasSendingRef.current && !sending && !turnLimitReached && !inputDisabled) {
      textareaRef.current?.focus();
    }
    wasSendingRef.current = sending;
  }, [sending, turnLimitReached, inputDisabled]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || locked) return;
    onSend(trimmed);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="overflow-hidden rounded-[14px] border-[2.5px] border-slate-900 bg-white shadow-[4px_4px_0_#0f172a]">
      <div className="flex h-[min(70vh,620px)] min-h-[360px] flex-col">
        {title ? (
          <header className="flex shrink-0 items-center gap-3 border-b-[2.5px] border-slate-900 bg-violet-700 px-4 py-3 text-white sm:px-5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-600 shadow-[2px_2px_0_#0f172a]"
              aria-hidden
            >
              <Sparkles className="h-5 w-5 text-amber-200" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-lg font-black tracking-tight">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-0.5 truncate text-xs font-medium text-violet-100 sm:text-sm">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </header>
        ) : null}

        {progress && progress.total > 0 ? (
          <div className="shrink-0 border-b-2 border-slate-900 bg-[#faf8f4] px-4 py-2.5 sm:px-5">
            <ProgressStrip done={progress.done} total={progress.total} />
          </div>
        ) : null}

        <div
          className="flex min-h-0 flex-1 flex-col border-b-2 border-slate-900 bg-[#faf8f4]"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-5 sm:py-5">
            <div className="flex w-full flex-col gap-3">
              {messages.map((m, i) =>
                m.role === "assistant" ? (
                  <div key={i} className="flex items-end justify-start gap-2">
                    <AssistantAvatar />
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md border-2 border-slate-900 bg-white px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-900 shadow-[2px_2px_0_#0f172a] sm:max-w-[70%]">
                      <p className="whitespace-pre-wrap break-words font-body">
                        {m.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md border-2 border-slate-900 bg-[#FFB800] px-3.5 py-2.5 text-[15px] leading-relaxed text-slate-950 shadow-[2px_2px_0_#0f172a] sm:max-w-[70%]">
                      <p className="whitespace-pre-wrap break-words font-body">
                        {m.content}
                      </p>
                    </div>
                  </div>
                ),
              )}

              {sending ? (
                <div className="flex items-end justify-start gap-2">
                  <AssistantAvatar />
                  <div className="flex max-w-[85%] items-center rounded-2xl rounded-bl-md border-2 border-slate-900 bg-white px-3.5 py-2.5 shadow-[2px_2px_0_#0f172a]">
                    <span className="sr-only">{COPY.typing}</span>
                    <TypingDots />
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} className="h-0.5 w-full shrink-0" aria-hidden />
            </div>
          </div>
        </div>

        {error ? (
          <div className="shrink-0 border-b-2 border-slate-900 bg-rose-50 px-4 py-2.5 sm:px-5">
            <p className="text-sm font-bold text-rose-800">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {COPY.retry}
              </button>
            ) : null}
          </div>
        ) : null}

        {turnLimitReached ? (
          <div className="shrink-0 bg-amber-50 px-4 py-3 sm:px-5">
            <p className="text-center text-sm font-bold text-amber-800">
              {turnLimitMessage}
            </p>
          </div>
        ) : (
          <div className="shrink-0 bg-violet-50 px-3 pt-2.5 pb-2.5 sm:px-4 sm:pt-3 sm:pb-3">
            <div className="flex w-full items-end gap-2 sm:gap-3">
              <label className="sr-only" htmlFor="intake-chat-input">
                {placeholder}
              </label>
              <div className="flex min-h-[46px] flex-1 items-end rounded-3xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]">
                <textarea
                  id="intake-chat-input"
                  ref={textareaRef}
                  rows={1}
                  className="max-h-32 min-h-[46px] w-full resize-y rounded-3xl border-0 bg-transparent px-4 py-3 font-body text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60"
                  placeholder={placeholder}
                  value={input}
                  disabled={locked}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
              </div>
              <button
                type="button"
                className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-700 text-white shadow-[3px_3px_0_#0f172a] transition-transform hover:bg-violet-800 enabled:hover:-translate-y-px disabled:opacity-45"
                disabled={locked || !input.trim()}
                aria-label="Enviar"
                onClick={handleSend}
              >
                {sending ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" strokeWidth={2.25} />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs font-bold text-slate-600">
              {COPY.sendHint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
