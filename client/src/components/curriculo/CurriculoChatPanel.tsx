import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Send, Wand2 } from "lucide-react";
import { Streamdown } from "streamdown";

import { Spinner } from "@/components/ui/spinner";
import type { AiChatMessage } from "@/lib/aiClient";
import { callAiChat, callAiStructured } from "@/lib/aiClient";
import { cn } from "@/lib/utils";
import type { Curriculo } from "@shared/curriculo/schema";

const MARKER = "[[CURRICULO_READY]]";

function getAiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Não foi possível enviar agora.";
  if (err.message === "LOGIN_REQUIRED") return "Faça login pra usar esta ferramenta.";
  if (err.message === "PRO_REQUIRED") return "Esta ferramenta requer o Plano Pro.";
  if (err.message.startsWith("RATE_LIMITED")) return err.message.replace("RATE_LIMITED: ", "");
  return err.message || "Não foi possível enviar agora.";
}

function stripMarker(text: string): string {
  return text.replace(/\[\[CURRICULO_READY\]\]/g, "").trimEnd();
}

interface CurriculoChatPanelProps {
  initialAssistantMessage: string;
  onCurriculoReady: (curriculo: Curriculo) => void;
  title?: string;
  description?: string;
  placeholder?: string;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="ai-chat-typing-dot h-2.5 w-2.5 rounded-full bg-amber-500" />
      ))}
    </div>
  );
}

export default function CurriculoChatPanel({
  initialAssistantMessage,
  onCurriculoReady,
  title = "Natechinho monta teu currículo",
  description = "Conversa de uns 10 minutinhos. No fim, sai o PDF.",
  placeholder = "Manda tua resposta",
}: CurriculoChatPanelProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: "assistant", content: initialAssistantMessage },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scrollar SÓ o container interno de mensagens (overflow-y-auto). Antes
  // estava usando scrollIntoView, que pode arrastar a viewport inteira se
  // o elemento alvo não estiver totalmente visível, fazendo a página descer.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading, generating]);

  async function handleSend() {
    if (chatLoading || generating) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    setError("");
    const afterUser: AiChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(afterUser);
    setInput("");
    setChatLoading(true);

    let reply: string;
    try {
      const response = await callAiChat("resume-builder", afterUser);
      reply = response.result;
    } catch (err) {
      setError(getAiErrorMessage(err));
      setChatLoading(false);
      return;
    }

    const afterAssistant: AiChatMessage[] = [
      ...afterUser,
      { role: "assistant", content: reply },
    ];
    setMessages(afterAssistant);
    setChatLoading(false);

    if (reply.includes(MARKER)) {
      setGenerating(true);
      try {
        const { data } = await callAiStructured<Curriculo>("resume-render", {
          messages: afterAssistant,
        });
        onCurriculoReady(data);
      } catch (err) {
        setError(`Erro ao montar o currículo. ${getAiErrorMessage(err)}`);
      } finally {
        setGenerating(false);
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const inputDisabled = chatLoading || generating;

  return (
    <div className="card-brutal w-full overflow-hidden rounded-2xl bg-white">
      <div className="flex h-[min(88vh,720px)] min-h-[420px] flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b-2 border-slate-950 bg-[#FFB800] px-4 py-3.5 text-slate-950 sm:px-5 sm:py-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-white shadow-[2px_2px_0_#0f172a] sm:h-12 sm:w-12"
            aria-hidden
          >
            <Wand2 className="h-5 w-5 text-slate-950 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-black tracking-tight sm:text-xl">{title}</h2>
            <p className="mt-0.5 truncate text-xs font-bold leading-snug text-slate-800 sm:text-sm">{description}</p>
          </div>
        </header>

        <div
          className="wa-chat-wallpaper flex min-h-0 flex-1 flex-col border-b-2 border-slate-950"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-4"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
              {messages.map((m, i) => {
                if (m.role === "assistant") {
                  const visible = stripMarker(m.content);
                  if (!visible) return null;
                  return (
                    <div key={i} className="flex justify-start">
                      <div
                        className={cn(
                          "max-w-[min(100%,86%)] rounded-[14px] rounded-tl-sm border-2 border-slate-950 bg-white px-3.5 py-3 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3.5",
                          "font-body text-[15px] leading-relaxed text-slate-900 sm:text-base",
                        )}
                      >
                        <Streamdown className="prose prose-sm max-w-none break-words text-slate-900 sm:prose-base">
                          {visible}
                        </Streamdown>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex justify-end">
                    <div
                      className={cn(
                        "max-w-[min(100%,86%)] rounded-[14px] rounded-tr-sm border-2 border-slate-950 bg-amber-200 px-3.5 py-3 shadow-[2px_2px_0_#0f172a] sm:max-w-[min(100%,82%)] sm:px-4 sm:py-3.5",
                        "font-body text-[15px] leading-relaxed text-slate-900 sm:text-base",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  </div>
                );
              })}

              {chatLoading ? (
                <div className="flex justify-start">
                  <div className="flex max-w-[min(100%,86%)] items-center rounded-[14px] rounded-tl-sm border-2 border-slate-950 bg-white px-3 py-2.5 shadow-[2px_2px_0_#0f172a] sm:px-4">
                    <span className="sr-only">Natechinho digitando</span>
                    <TypingDots />
                  </div>
                </div>
              ) : null}

              {generating ? (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-3 rounded-[14px] border-2 border-slate-950 bg-emerald-100 px-4 py-3 shadow-[3px_3px_0_#0f172a]"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-800" strokeWidth={2.5} aria-hidden />
                    <div>
                      <p className="font-display text-sm font-black uppercase tracking-[0.15em] text-emerald-900">
                        Montando teu currículo
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-emerald-900/80">Leva uns segundinhos, organizando tudo que tu me contou.</p>
                    </div>
                  </div>
                </div>
              ) : null}

            </div>
          </div>
        </div>

        {error ? (
          <div className="shrink-0 border-b-2 border-slate-950 bg-red-100 px-4 py-2.5 sm:px-5">
            <p className="text-center text-sm font-bold text-red-900 sm:text-base">{error}</p>
          </div>
        ) : null}

        <div className="shrink-0 bg-[#faf8f4] px-3 pt-2.5 pb-2.5 sm:px-4 sm:pt-3 sm:pb-3">
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2 sm:gap-3">
            <label className="sr-only" htmlFor="curriculo-chat-input">
              Mensagem
            </label>
            <div className="flex min-h-[48px] flex-1 items-end rounded-2xl border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]">
              <textarea
                id="curriculo-chat-input"
                rows={1}
                className="max-h-32 min-h-[48px] w-full resize-y rounded-2xl border-0 bg-transparent px-4 py-3 font-body text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60 sm:py-3.5 sm:text-base"
                placeholder={placeholder}
                value={input}
                disabled={inputDisabled}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>
            <button
              type="button"
              className="mb-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-[#FFB800] text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-45 disabled:hover:translate-y-0 sm:h-[52px] sm:w-[52px]"
              disabled={inputDisabled || !input.trim()}
              aria-label="Enviar"
              onClick={() => void handleSend()}
            >
              {chatLoading ? (
                <Spinner className="h-5 w-5 text-slate-950 sm:h-6 sm:w-6" />
              ) : generating ? (
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
              ) : (
                <Send className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
              )}
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
