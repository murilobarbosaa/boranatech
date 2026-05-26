import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { AiChatMessage } from "@/lib/aiClient";
import { callAiChat } from "@/lib/aiClient";
import { cn } from "@/lib/utils";

function getAiErrorMessage(err: unknown) {
  if (!(err instanceof Error)) return "Não foi possível enviar agora.";
  if (err.message === "LOGIN_REQUIRED") return "Faça login para usar esta ferramenta.";
  if (err.message === "PRO_REQUIRED") return "Esta ferramenta requer o Plano Pro.";
  if (err.message.startsWith("RATE_LIMITED")) return err.message.replace("RATE_LIMITED: ", "");
  return err.message || "Não foi possível enviar agora.";
}

interface AiChatPanelProps {
  endpoint: string;
  title: string;
  description: string;
  initialAssistantMessage: string;
  placeholder?: string;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="ai-chat-typing-dot h-2.5 w-2.5 rounded-full bg-violet-500" />
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

export default function AiChatPanel({
  endpoint,
  title,
  description,
  initialAssistantMessage,
  placeholder = "Mensagem",
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError("");
    const nextMessages: AiChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { result } = await callAiChat(endpoint, nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    } catch (err) {
      setError(getAiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="card-brutal w-full overflow-hidden rounded-2xl bg-white">
      <div className="flex h-[min(70vh,560px)] min-h-[320px] flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b-2 border-slate-900 bg-violet-700 px-4 py-3 text-white sm:px-5 sm:py-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-600 shadow-[2px_2px_0_#0f172a] sm:h-12 sm:w-12"
            aria-hidden
          >
            <Sparkles className="h-5 w-5 text-amber-200 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-black tracking-tight sm:text-xl">{title}</h2>
            <p className="mt-0.5 truncate text-xs font-medium leading-snug text-violet-100 sm:text-sm">{description}</p>
          </div>
        </header>

        <div
          className="wa-chat-wallpaper flex min-h-0 flex-1 flex-col border-b-2 border-slate-900"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              {messages.map((m, i) =>
                m.role === "assistant" ? (
                  <div key={i} className="flex items-end justify-start gap-2">
                    <AssistantAvatar />
                    <div
                      className={cn(
                        "max-w-[min(100%,85%)] rounded-[12px] rounded-tl-sm border border-slate-200/90 bg-white px-3 py-2.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.1)] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3",
                        "text-[15px] leading-relaxed text-slate-900 sm:text-base",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words font-body">{m.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div
                      className={cn(
                        "max-w-[min(100%,85%)] rounded-[12px] rounded-tr-sm border border-amber-300/80 bg-amber-200 px-3 py-2.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.1)] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3",
                        "text-[15px] leading-relaxed text-slate-900 sm:text-base",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words font-body">{m.content}</p>
                    </div>
                  </div>
                ),
              )}

              {loading ? (
                <div className="flex items-end justify-start gap-2">
                  <AssistantAvatar />
                  <div className="flex max-w-[min(100%,85%)] items-center rounded-[12px] rounded-tl-sm border border-slate-200/90 bg-white px-3 py-2.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.1)] sm:px-4">
                    <span className="sr-only">Digitando</span>
                    <TypingDots />
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} className="h-0.5 w-full shrink-0" aria-hidden />
            </div>
          </div>
        </div>

        {error ? (
          <div className="shrink-0 border-b-2 border-slate-900 bg-red-50 px-4 py-2.5 sm:px-5">
            <p className="text-center text-sm font-bold text-red-800 sm:text-base">{error}</p>
          </div>
        ) : null}

        <div className="shrink-0 bg-violet-50 px-3 pt-2.5 pb-2.5 sm:px-4 sm:pt-3 sm:pb-3">
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2 sm:gap-3">
            <label className="sr-only" htmlFor="ai-chat-input">
              Mensagem
            </label>
            <div className="flex min-h-[46px] flex-1 items-end rounded-3xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]">
              <textarea
                id="ai-chat-input"
                rows={1}
                className="max-h-32 min-h-[46px] w-full resize-y rounded-3xl border-0 bg-transparent px-4 py-3 font-body text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60 sm:px-4 sm:py-3.5 sm:text-base"
                placeholder={placeholder}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <button
              type="button"
              className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-violet-700 text-white shadow-[3px_3px_0_#0f172a] transition-transform hover:bg-violet-800 enabled:hover:-translate-y-px disabled:opacity-45 sm:h-[52px] sm:w-[52px]"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              onClick={() => void handleSend()}
            >
              {loading ? <Spinner className="h-5 w-5 sm:h-6 sm:w-6" /> : <Send className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />}
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs font-bold text-slate-600 sm:text-sm">
            Enter envia · Shift+Enter nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
