import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Plus, Send, X } from "lucide-react";

import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import {
  streamAgentChat,
  type AgentChatMessage,
  type AgentStatusEvent,
} from "@/lib/agentClient";

// Rotulos amigaveis de status por tool. Default abaixo cobre tools novas.
// TODO(Ana): revisar os rotulos de status de busca.
const TOOL_STATUS_LABELS: Record<string, string> = {
  search_platform_content: "Buscando conteudo...",
  suggest_navigation: "Encontrando a pagina...",
};
// TODO(Ana): rotulo de status padrao.
const DEFAULT_STATUS_LABEL = "Buscando...";

// Caminho interno isolado (token que comeca com barra). Usado so para auto-link.
const INTERNAL_PATH_RE = /^\/[A-Za-z0-9/_-]+$/;

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  // TODO(Ana): revisar todas as mensagens de erro abaixo.
  if (msg === "LOGIN_REQUIRED") {
    return "Sua sessao expirou. Entre novamente para continuar.";
  }
  if (msg.startsWith("RATE_LIMITED")) {
    return "Voce atingiu o limite diario de mensagens. Tente novamente amanha.";
  }
  if (msg === "CONVERSATION_TOO_LONG") {
    return "Esta conversa ficou longa demais. Comece uma nova conversa.";
  }
  if (msg === "AGENT_UNAVAILABLE") {
    return "O assistente esta indisponivel agora. Tente de novo em instantes.";
  }
  return "Algo deu errado. Tente de novo.";
}

// Renderiza texto puro do assistente preservando quebras de linha e fazendo
// auto-link apenas de caminhos internos (que comecam com "/"). NUNCA usa
// dangerouslySetInnerHTML: nada de HTML do modelo e interpretado.
function AssistantText({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        INTERNAL_PATH_RE.test(part) ? (
          <Link
            key={i}
            href={part}
            className="font-semibold text-violet-800 underline underline-offset-2"
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function AgentWidget() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  // Mesmo gate de login do resto do app. Usado SO quando o launcher e clicado por
  // um usuario deslogado: abre o modal de login em vez do chat.
  const { requireAuth, modalProps } = useAuthGate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, statusLabel, errorMsg, open]);

  // Enquanto o estado de auth carrega, nao renderiza nada (evita piscar). Depois
  // disso o launcher aparece para todos; o comportamento do clique e que muda
  // conforme estar logado ou nao (ver handleLauncherClick).
  if (loading) return null;

  function handleLauncherClick() {
    // Deslogado: NAO abre o chat. Dispara o mesmo gate de login do resto do app.
    // requireAuth({}) persiste o destino atual (a pagina onde a pessoa esta) e
    // abre o modal; apos o login ela volta pra ca. Nenhuma conversa parte de um
    // usuario sem sessao.
    if (!user) {
      requireAuth({});
      return;
    }
    setOpen((v) => !v);
  }

  function startNewConversation() {
    if (streaming) return;
    setMessages([]);
    setErrorMsg(null);
    setStatusLabel(null);
  }

  function handleStatus(status: AgentStatusEvent) {
    if (status.event === "tool_start") {
      setStatusLabel(
        (status.tool && TOOL_STATUS_LABELS[status.tool]) || DEFAULT_STATUS_LABEL,
      );
    } else if (status.event === "tool_end") {
      setStatusLabel(null);
    }
  }

  async function send() {
    // Barreira de seguranca: deslogado nunca conversa. streamAgentChat exige
    // sessao (o backend devolve 401 sem token), entao nem chamamos sem user.
    if (!user) return;
    const text = input.trim();
    if (!text || streaming) return;

    const history: AgentChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    // Adiciona a bolha do user e uma bolha vazia do assistente para receber o
    // stream de tokens em tempo real.
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setErrorMsg(null);
    setStatusLabel(null);
    setStreaming(true);

    try {
      await streamAgentChat(history, location || undefined, {
        onToken: (delta) => {
          setMessages((prev) => {
            const copy = prev.slice();
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: last.content + delta };
            }
            return copy;
          });
        },
        onStatus: handleStatus,
        onError: (message) => setErrorMsg(message),
      });
    } catch (err) {
      setErrorMsg(friendlyError(err));
    } finally {
      setStreaming(false);
      setStatusLabel(null);
      // Remove a bolha do assistente se ela ficou vazia (ex.: erro antes de
      // qualquer token), para nao deixar um balao em branco na conversa.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.content.length === 0) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }

  return (
    <>
      {open && user && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#faf8f4] shadow-[6px_6px_0_#0f172a]">
          <div className="flex items-center justify-between border-b-2 border-slate-950 bg-violet-800 px-4 py-3 text-white">
            {/* TODO(Ana): titulo do assistente. */}
            <span className="font-display text-sm font-black uppercase tracking-[0.15em]">
              Assistente
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewConversation}
                disabled={streaming || messages.length === 0}
                className="rounded-md p-1.5 transition hover:bg-white/15 disabled:opacity-40"
                /* TODO(Ana): label de acessibilidade do botao nova conversa. */
                aria-label="Nova conversa"
                title="Nova conversa"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 transition hover:bg-white/15"
                /* TODO(Ana): label de acessibilidade do botao fechar. */
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              /* TODO(Ana): copy do estado inicial do chat. */
              <p className="text-sm text-slate-500">
                Posso ajudar voce a navegar pelo BoraNaTech e encontrar conteudo.
                Sobre o que voce quer saber?
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm border-2 border-slate-950 bg-violet-800 px-3 py-2 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border-2 border-slate-950 bg-white px-3 py-2 text-sm text-slate-900"
                  }
                >
                  {m.role === "assistant" ? (
                    <AssistantText text={m.content} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words">
                      {m.content}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {statusLabel && (
              <div className="flex justify-start">
                <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-500">
                  {statusLabel}
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="rounded-lg border-2 border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="border-t-2 border-slate-950 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                /* TODO(Ana): placeholder do campo de mensagem. */
                placeholder="Escreva sua mensagem..."
                className="max-h-28 flex-1 resize-none rounded-lg border-2 border-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-800"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={streaming || input.trim().length === 0}
                className="bnt-pressable rounded-lg border-2 border-slate-950 bg-violet-800 p-2 text-white shadow-[3px_3px_0_#0f172a] disabled:opacity-40"
                /* TODO(Ana): label de acessibilidade do botao enviar. */
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleLauncherClick}
        className="bnt-pressable fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-950 bg-violet-800 text-white shadow-[4px_4px_0_#0f172a]"
        /* TODO(Ana): label de acessibilidade do launcher. */
        aria-label="Abrir assistente"
      >
        {open && user ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Modal de login do gate, acionado pelo launcher quando deslogado. Para
          usuario logado fica inerte (open=false). */}
      <AuthGateModal {...modalProps} />
    </>
  );
}
