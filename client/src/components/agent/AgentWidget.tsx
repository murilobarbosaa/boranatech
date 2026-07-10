import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  History,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  streamAgentChat,
  type AgentChatMessage,
  type AgentStatusEvent,
} from "@/lib/agentClient";
import {
  deleteConversation as requestDeleteConversation,
  getConversation as fetchConversation,
  listConversations as fetchConversations,
  type ConversationSummary,
} from "@/lib/agentHistoryClient";

// Rotulos amigaveis de status por tool. Default abaixo cobre tools novas.
// TODO(Ana): revisar os rotulos de status de busca.
const TOOL_STATUS_LABELS: Record<string, string> = {
  search_platform_content: "Buscando conteudo...",
  suggest_navigation: "Encontrando a pagina...",
};
// TODO(Ana): rotulo de status padrao.
const DEFAULT_STATUS_LABEL = "Buscando...";

// Velocidade do typewriter, mesmo padrao do CurriculoChatPanel: os tokens vao
// para um buffer e um timer revela 1 caractere por tick em ritmo fixo. O texto
// final e identico ao recebido; so a velocidade de revelacao muda.
const TYPING_CHARS_PER_SECOND = 45;
const TYPING_TICK_MS = Math.max(8, Math.round(1000 / TYPING_CHARS_PER_SECOND));

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

// Lista de conversas (icone NEUTRO para todas neste marco; titulo no hover via
// title/aria-label). A classificacao por categoria/icone e o segundo marco.
function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (conversations.length === 0) {
    // TODO(Ana): copy de lista de conversas vazia.
    return (
      <p className="px-2 py-3 text-xs text-slate-400">
        Nenhuma conversa salva ainda.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {conversations.map((c) => {
        // TODO(Ana): titulo padrao quando a conversa nao tem titulo.
        const label = c.title && c.title.trim().length > 0 ? c.title : "Conversa";
        return (
          <div
            key={c.id}
            className={`flex items-center gap-1 rounded-lg ${
              activeId === c.id ? "bg-violet-100" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              title={label}
              aria-label={label}
              className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 hover:bg-violet-50"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-violet-800" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(c.id)}
              /* TODO(Ana): label de acessibilidade do botao apagar conversa. */
              aria-label="Apagar conversa"
              title="Apagar conversa"
              className="rounded-md p-1.5 text-slate-400 transition hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Indicador "digitando": tres bolinhas animadas. Reusa a classe global
// ai-chat-typing-dot (index.css), a mesma do CurriculoChatPanel, com acento
// violet do widget. Aparece na bolha do assistente enquanto nada foi revelado.
function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="ai-chat-typing-dot h-2 w-2 rounded-full bg-violet-700"
        />
      ))}
    </span>
  );
}

export default function AgentWidget() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  // Mesmo gate de login do resto do app. Usado SO quando o launcher e clicado por
  // um usuario deslogado: abre o modal de login em vez do chat.
  const { requireAuth, modalProps } = useAuthGate();
  // isPro vem do contexto de assinatura. Aqui ele decide APENAS O QUE MOSTRAR
  // (a coluna de historico); o gating de acesso real e server-side (403 nos
  // endpoints, persistencia so para Pro no stream). A UI nao e a barreira.
  const { isPro } = useSubscription();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado do historico (so usado quando Pro).
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false); // drawer mobile

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, statusLabel, errorMsg, open]);

  // Carrega a lista de conversas ao abrir o painel, SO para Pro logado. Falha
  // NAO quebra o widget: apenas marca o historico como indisponivel e o chat
  // segue normal. Free nunca chama os endpoints Pro.
  useEffect(() => {
    if (!open || !isPro || !user) return;
    let cancelled = false;
    fetchConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
        setHistoryAvailable(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHistoryAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isPro, user]);

  // Enquanto o estado de auth carrega, nao renderiza nada (evita piscar). Depois
  // disso o launcher aparece para todos; o comportamento do clique e que muda
  // conforme estar logado ou nao (ver handleLauncherClick).
  if (loading) return null;

  // So mostra a coluna de historico para Pro com historico disponivel. Free e
  // estado degradado caem no chat de coluna unica, identico ao de hoje.
  const showHistory = isPro && historyAvailable;

  function handleLauncherClick() {
    // Deslogado: NAO abre o chat. Dispara o mesmo gate de login do resto do app.
    if (!user) {
      requireAuth({});
      return;
    }
    setOpen((v) => !v);
  }

  async function refreshConversations() {
    if (!isPro || !user) return;
    try {
      const list = await fetchConversations();
      setConversations(list);
      setHistoryAvailable(true);
    } catch {
      setHistoryAvailable(false);
    }
  }

  function startNewConversation() {
    if (streaming) return;
    // CRITICO: zera mensagens E o conversationId ativo, para o proximo envio criar
    // uma conversa NOVA em vez de gravar na antiga.
    setMessages([]);
    setActiveConversationId(null);
    setErrorMsg(null);
    setStatusLabel(null);
    setHistoryOpen(false);
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

  async function loadConversation(id: string) {
    if (streaming) return;
    setHistoryOpen(false); // fecha o drawer no mobile apos escolher
    try {
      const detail = await fetchConversation(id);
      setMessages(
        detail.messages.map((m) => ({ role: m.role, content: m.content })),
      );
      setActiveConversationId(detail.id);
      setErrorMsg(null);
      setStatusLabel(null);
    } catch (err) {
      setErrorMsg(friendlyError(err));
    }
  }

  async function handleDelete(id: string) {
    // TODO(Ana): texto de confirmacao de apagar conversa.
    if (!window.confirm("Apagar esta conversa? Esta acao nao pode ser desfeita.")) {
      return;
    }
    try {
      await requestDeleteConversation(id);
      removeFromList(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "NOT_FOUND") {
        // Ja nao existia: so remove da lista.
        removeFromList(id);
      } else {
        setErrorMsg(friendlyError(err));
      }
    }
  }

  function removeFromList(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    // Se a conversa apagada era a ativa, equivale a iniciar uma nova.
    if (activeConversationId === id) {
      startNewConversation();
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
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setErrorMsg(null);
    setStatusLabel(null);
    setStreaming(true);

    // Pipeline de revelacao controlada (mesmo padrao do CurriculoChatPanel):
    // onToken so acumula no buffer (nao atualiza a UI direto); um setInterval
    // revela 1 caractere por tick em ritmo fixo. Enquanto nada foi revelado, a
    // bolha vazia mostra o TypingDots. Ao terminar, todo o buffer e exibido.
    const bufferRef = { current: "" };
    const streamDoneRef = { current: false };
    let revealedLength = 0;

    const revealDone = new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        const target = bufferRef.current;
        if (revealedLength < target.length) {
          revealedLength = Math.min(target.length, revealedLength + 1);
          const slice = target.slice(0, revealedLength);
          setMessages((prev) => {
            const next = prev.slice();
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
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

    try {
      await streamAgentChat(
        history,
        location || undefined,
        {
          onToken: (delta) => {
            // So acumula; o reveal acima revela char a char.
            bufferRef.current += delta;
          },
          onStatus: handleStatus,
          onError: (message) => setErrorMsg(message),
          // Backend criou (ou confirmou) a conversa: guarda o id para os proximos
          // envios irem para a MESMA conversa. So dispara para Pro.
          onConversationId: (id) => setActiveConversationId(id),
        },
        activeConversationId ?? undefined,
      );
      // Garante que todo o buffer seja revelado (sem cortar o final).
      streamDoneRef.current = true;
      await revealDone;
      // Apos um envio bem-sucedido, atualiza a lista (nova conversa aparece, ou a
      // existente sobe pela ordem de updated_at). Best-effort.
      await refreshConversations();
    } catch (err) {
      // Deixa o reveal esvaziar o buffer (parcial) e encerra o timer antes de sair.
      streamDoneRef.current = true;
      await revealDone;
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
        <div
          className={`fixed bottom-24 right-5 z-40 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#faf8f4] shadow-[6px_6px_0_#0f172a] ${
            showHistory ? "md:w-[min(92vw,640px)]" : ""
          }`}
        >
          <div className="flex items-center justify-between border-b-2 border-slate-950 bg-violet-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {showHistory && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  className="rounded-md p-1.5 transition hover:bg-white/15 md:hidden"
                  /* TODO(Ana): label de acessibilidade do botao de conversas. */
                  aria-label="Ver conversas"
                  title="Ver conversas"
                >
                  <History className="h-4 w-4" />
                </button>
              )}
              {/* TODO(Ana): titulo do assistente. */}
              <span className="font-display text-sm font-black uppercase tracking-[0.15em]">
                Assistente
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewConversation}
                disabled={streaming}
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

          <div className="relative flex min-h-0 flex-1">
            {/* Desktop: coluna lateral de historico. */}
            {showHistory && (
              <aside className="hidden w-44 shrink-0 flex-col overflow-y-auto border-r-2 border-slate-950 bg-white p-2 md:flex">
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={loadConversation}
                  onDelete={handleDelete}
                />
              </aside>
            )}

            {/* Coluna do chat. */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  /* TODO(Ana): copy do estado inicial do chat. */
                  <p className="text-sm text-slate-500">
                    Posso ajudar voce a navegar pelo BoraNaTech e encontrar
                    conteudo. Sobre o que voce quer saber?
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
                        m.content.length === 0 ? (
                          <TypingDots />
                        ) : (
                          <AssistantText text={m.content} />
                        )
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

            {/* Mobile: historico como overlay POR CIMA do chat (nao coluna fixa).
                Contido no painel (absolute inset-0), com botao de fechar. */}
            {showHistory && historyOpen && (
              <div className="absolute inset-0 z-10 flex flex-col bg-[#faf8f4] md:hidden">
                <div className="flex items-center justify-between border-b-2 border-slate-950 bg-white px-3 py-2">
                  {/* TODO(Ana): titulo do painel de conversas. */}
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">
                    Conversas
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100"
                    /* TODO(Ana): label de acessibilidade do botao fechar conversas. */
                    aria-label="Fechar conversas"
                    title="Fechar conversas"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <ConversationList
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={loadConversation}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            )}
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
