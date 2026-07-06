import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Send, Wand2 } from "lucide-react";
import { Streamdown } from "streamdown";

import { Spinner } from "@/components/ui/spinner";
import type { AiChatMessage } from "@/lib/aiClient";
import { callAiChatStream, callAiStructured } from "@/lib/aiClient";
import { cn } from "@/lib/utils";
import type { Curriculo } from "@shared/curriculo/schema";

const MARKER = "[[CURRICULO_READY]]";
const PARTIAL_MARKER_HEAD = "[[";

// ────────────────────────────────────────────────────────────────────────────
// Velocidade do typewriter. Vale tanto pra saudação inicial (typewriter local)
// quanto pra resposta streamada do Natechinho (chars revelados em ritmo
// constante mesmo se a OpenAI manda em rajadas). Mexer aqui pra calibrar.
// Referência: ChatGPT roda em torno de 40 a 60. Subir = mais rápido, descer
// = mais lento. O resto do código deriva o tick em ms a partir daqui.
// ────────────────────────────────────────────────────────────────────────────
const TYPING_CHARS_PER_SECOND = 45;
const TYPING_TICK_MS = Math.max(8, Math.round(1000 / TYPING_CHARS_PER_SECOND));

function getAiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Não foi possível enviar agora.";
  if (err.message === "LOGIN_REQUIRED")
    return "Faça login pra usar esta ferramenta.";
  if (err.message === "PRO_REQUIRED")
    return "Esta ferramenta requer o Plano Pro.";
  if (err.message.startsWith("RATE_LIMITED"))
    return err.message.replace("RATE_LIMITED: ", "");
  return err.message || "Não foi possível enviar agora.";
}

function stripMarker(text: string): string {
  return text.replace(/\[\[CURRICULO_READY\]\]/g, "").trimEnd();
}

/**
 * Recorta o buffer pra exibição durante o stream. Se o marcador completo
 * apareceu, corta tudo dele em diante. Enquanto o stream está rodando e
 * apareceu só o início "[[" (marcador parcial), espera o marcador fechar
 * antes de revelar esses chars, pra não vazar "[[CURRIC..." na tela.
 *
 * Quando o stream termina sem o marcador completo, devolve o buffer inteiro
 * (assume que o "[[" era falso alarme e libera pro reveal).
 */
function clipForReveal(buf: string, streamDone: boolean): string {
  const markerIdx = buf.indexOf(MARKER);
  if (markerIdx >= 0) return buf.slice(0, markerIdx).trimEnd();
  if (!streamDone) {
    const partialIdx = buf.indexOf(PARTIAL_MARKER_HEAD);
    if (partialIdx >= 0) return buf.slice(0, partialIdx);
  }
  return buf;
}

interface CurriculoChatPanelProps {
  initialAssistantMessage: string;
  onCurriculoReady: (curriculo: Curriculo) => void;
  // Primeira mensagem do usuario enviada AUTOMATICAMENTE (e visivel, como
  // qualquer mensagem) assim que a saudacao terminar. Usada pela ponte
  // analise -> reescrita (?rewrite=): o curriculo analisado ja entra na
  // conversa sem a pessoa colar de novo. Enviada UMA vez por montagem.
  initialUserMessage?: string;
}

// Textos fixos do painel (as antigas props title/description/placeholder
// nunca eram passadas pelo caller; viraram constantes).
// TODO(Ana): revisar estes textos do painel do chat.
const PANEL_TITLE = "Natechinho monta teu currículo";
const PANEL_DESCRIPTION =
  "Conversa de uns 10 minutinhos. No fim, teu currículo sai pronto e salvo.";
const INPUT_PLACEHOLDER = "Manda tua resposta";
// TODO(Ana): revisar copy do botao de gerar sem o sinal do Natechinho.
const FALLBACK_BUTTON_LABEL = "Gerar currículo com o que já conversamos";

// A partir de quantas respostas reais do Natechinho (sem contar a saudacao)
// o fallback de geracao aparece, caso o marcador nunca venha. // TODO: calibrar.
const FALLBACK_AFTER_REPLIES = 4;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="ai-chat-typing-dot h-2.5 w-2.5 rounded-full bg-amber-500"
        />
      ))}
    </div>
  );
}

export default function CurriculoChatPanel({
  initialAssistantMessage,
  onCurriculoReady,
  initialUserMessage,
}: CurriculoChatPanelProps) {
  // A saudação começa vazia e é preenchida pelo efeito de typewriter abaixo
  // pra dar a mesma sensação visual do streaming das respostas reais.
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: "assistant", content: "" },
  ]);
  const [greetingDone, setGreetingDone] = useState(false);
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

  // Auto-envio da primeira mensagem (ponte de reescrita): dispara UMA vez por
  // montagem, so depois da saudacao terminar. O guard interno de sendMessage
  // protege contra corrida com um envio manual.
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (!initialUserMessage || autoSentRef.current || !greetingDone) return;
    autoSentRef.current = true;
    void sendMessage(initialUserMessage);
    // sendMessage muda a cada render (closure de messages); disparar so na
    // transicao de greetingDone e o comportamento correto aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetingDone, initialUserMessage]);

  // Typewriter local pra saudação inicial. Sem chamada de API: o texto é
  // fixo. Mesma cadência do reveal das respostas reais (TYPING_TICK_MS).
  useEffect(() => {
    setGreetingDone(false);
    setMessages([{ role: "assistant", content: "" }]);
    const target = initialAssistantMessage;
    let cursor = 0;
    const timer = window.setInterval(() => {
      if (cursor >= target.length) {
        window.clearInterval(timer);
        setGreetingDone(true);
        return;
      }
      cursor += 1;
      setMessages([{ role: "assistant", content: target.slice(0, cursor) }]);
    }, TYPING_TICK_MS);
    return () => window.clearInterval(timer);
  }, [initialAssistantMessage]);

  async function handleSend() {
    if (chatLoading || generating || !greetingDone) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await sendMessage(trimmed);
  }

  // Caminho unico de envio: usado pelo input e pelo auto-envio da ponte de
  // reescrita (initialUserMessage).
  async function sendMessage(trimmed: string) {
    if (chatLoading || generating || !greetingDone) return;

    setError("");
    const afterUser: AiChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages([...afterUser, { role: "assistant", content: "" }]);
    setChatLoading(true);

    // Pipeline de revelação controlada:
    // - onToken só acumula no buffer (não atualiza UI direto).
    // - Um setInterval separado revela 1 char por tick num ritmo fixo.
    // - Marcador só é processado depois que o reveal esvazia o buffer E
    //   o stream fechou, garantindo que a UI não pula chunks.
    const fullBufferRef = { current: "" };
    const streamDoneRef = { current: false };
    let revealedLength = 0;

    const revealDone = new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        const target = clipForReveal(
          fullBufferRef.current,
          streamDoneRef.current,
        );
        if (revealedLength < target.length) {
          revealedLength = Math.min(target.length, revealedLength + 1);
          const slice = target.slice(0, revealedLength);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { role: "assistant", content: slice };
            }
            return next;
          });
        } else if (streamDoneRef.current) {
          window.clearInterval(timer);
          resolve();
        }
      }, TYPING_TICK_MS);
    });

    let streamError: unknown = null;
    try {
      await callAiChatStream("resume-builder", afterUser, {
        onToken: (delta) => {
          fullBufferRef.current += delta;
        },
        onError: (msg) => {
          console.warn("[CurriculoChatPanel] stream error:", msg);
        },
      });
    } catch (err) {
      streamError = err;
    }

    streamDoneRef.current = true;
    await revealDone;
    setChatLoading(false);

    if (streamError) {
      setError(getAiErrorMessage(streamError));
      // Remove o placeholder se nada foi revelado (token nunca chegou).
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      return;
    }

    // Marcador só é checado agora (stream fechou E reveal esvaziou o buffer).
    if (fullBufferRef.current.includes(MARKER)) {
      const historyForRender: AiChatMessage[] = [
        ...afterUser,
        { role: "assistant", content: fullBufferRef.current },
      ];
      await generateFromHistory(historyForRender);
    }
  }

  // Caminho unico de geracao: usado pelo marcador do Natechinho e pelo botao
  // de fallback (mesmo endpoint resume-render, mesmo tratamento de erro).
  async function generateFromHistory(history: AiChatMessage[]) {
    setGenerating(true);
    try {
      const { data } = await callAiStructured<Curriculo>("resume-render", {
        messages: history,
      });
      onCurriculoReady(data);
    } catch (err) {
      setError(`Erro ao montar o currículo. ${getAiErrorMessage(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  // Fallback do handshake: se o Natechinho nunca emitir o marcador, depois de
  // FALLBACK_AFTER_REPLIES respostas reais (a saudacao nao conta) aparece um
  // botao discreto que gera com o historico atual.
  const assistantReplies = Math.max(
    0,
    messages.filter((m) => m.role === "assistant" && m.content.length > 0)
      .length - 1,
  );
  const showFallbackGenerate =
    assistantReplies >= FALLBACK_AFTER_REPLIES &&
    greetingDone &&
    !chatLoading &&
    !generating;

  function handleFallbackGenerate() {
    if (chatLoading || generating) return;
    setError("");
    void generateFromHistory(
      messages.filter((m) => m.content.trim().length > 0),
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const inputDisabled = chatLoading || generating || !greetingDone;
  const lastMessage = messages[messages.length - 1];
  const showTypingDots =
    chatLoading &&
    lastMessage?.role === "assistant" &&
    lastMessage.content === "";

  return (
    <div className="card-brutal w-full overflow-hidden rounded-2xl bg-white">
      <div className="flex h-[min(88vh,720px)] min-h-[420px] flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b-2 border-slate-950 bg-[#FFB800] px-4 py-3.5 text-slate-950 sm:px-5 sm:py-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-white shadow-[2px_2px_0_#0f172a] sm:h-12 sm:w-12"
            aria-hidden
          >
            <Wand2
              className="h-5 w-5 text-slate-950 sm:h-6 sm:w-6"
              strokeWidth={2.5}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-black tracking-tight sm:text-xl">
              {PANEL_TITLE}
            </h2>
            <p className="mt-0.5 truncate text-xs font-bold leading-snug text-slate-800 sm:text-sm">
              {PANEL_DESCRIPTION}
            </p>
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
                        <Streamdown
                          className={cn(
                            "prose prose-sm max-w-none break-words text-slate-900 sm:prose-base",
                            // Garante padding/indentação nas listas markdown,
                            // pra os marcadores não colarem na borda do balão.
                            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-slate-400",
                            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-slate-400",
                            "[&_li]:my-0.5 [&_li]:pl-1",
                          )}
                        >
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
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {showTypingDots ? (
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
                    <Loader2
                      className="h-5 w-5 animate-spin text-emerald-800"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <div>
                      <p className="font-display text-sm font-black uppercase tracking-[0.15em] text-emerald-900">
                        Montando teu currículo
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-emerald-900/80">
                        Leva uns segundinhos, organizando tudo que tu me contou.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="shrink-0 border-b-2 border-slate-950 bg-red-100 px-4 py-2.5 sm:px-5">
            <p className="text-center text-sm font-bold text-red-900 sm:text-base">
              {error}
            </p>
          </div>
        ) : null}

        <div className="shrink-0 bg-[#faf8f4] px-3 pt-2.5 pb-2.5 sm:px-4 sm:pt-3 sm:pb-3">
          {showFallbackGenerate ? (
            <div className="mx-auto mb-2 flex w-full max-w-3xl justify-center">
              <button
                type="button"
                onClick={handleFallbackGenerate}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-slate-950"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                {FALLBACK_BUTTON_LABEL}
              </button>
            </div>
          ) : null}
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2 sm:gap-3">
            <label className="sr-only" htmlFor="curriculo-chat-input">
              Mensagem
            </label>
            <div className="flex min-h-[48px] flex-1 items-end rounded-2xl border-2 border-slate-950 bg-white shadow-[3px_3px_0_#0f172a]">
              <textarea
                id="curriculo-chat-input"
                rows={1}
                className="max-h-32 min-h-[48px] w-full resize-y rounded-2xl border-0 bg-transparent px-4 py-3 font-body text-[15px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60 sm:py-3.5 sm:text-base"
                placeholder={INPUT_PLACEHOLDER}
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
                <FileText
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  strokeWidth={2.25}
                />
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
