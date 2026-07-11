import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { History, MessageCircle, Plus, Send, Trash2, X } from "lucide-react";

import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cn } from "@/lib/utils";
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

// Gancho minimo para abrir o widget programaticamente com o input
// PRE-PREENCHIDO (sem enviar nada): CustomEvent tipado disparado por paginas
// (ex.: a ponte do Analisador de GitHub). Fora este listener o widget nao
// muda em nada.
export const AGENT_OPEN_EVENT = "bnt:agent:open";

export interface AgentOpenEventDetail {
  prefill?: string;
}

export function openAgentWidget(prefill?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AgentOpenEventDetail>(AGENT_OPEN_EVENT, {
      detail: { prefill },
    }),
  );
}

// Rotulos amigaveis de status por tool. Default abaixo cobre tools novas.
// TODO(Ana): revisar os rotulos de status de busca.
const TOOL_STATUS_LABELS: Record<string, string> = {
  search_platform_content: "Buscando conteudo...",
  suggest_navigation: "Encontrando a pagina...",
};
// TODO(Ana): rotulo de status padrao.
const DEFAULT_STATUS_LABEL = "Buscando...";

// Chips de partida do estado vazio: APENAS preenchem o input (nao enviam).
// Somem na primeira mensagem e nao aparecem quando ha prefill da ponte.
// TODO(Ana): revisar os textos dos chips de partida.
const STARTER_CHIPS_FREE = [
  "Onde comeco na plataforma?",
  "Me indica um proximo passo",
  "Como funciona o Pro?",
];
const STARTER_CHIPS_PRO = [
  "Onde comeco na plataforma?",
  "Como esta meu progresso?",
  "Como funciona o Pro?",
];

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

// Datas da gaveta: derivadas SOMENTE do updated_at que a lista ja traz.
function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function relativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  // TODO(Ana): revisar os rotulos de data relativa da gaveta.
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `ha ${days} dias`;
  return date.toLocaleDateString("pt-BR");
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

// Avatar mini do agente, na primeira bolha de cada sequencia do assistente
// (caixinha brutal violeta, familia do avatar do Natechinho no atelie).
function AgentAvatar() {
  return (
    <span
      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-slate-950 bg-violet-600 shadow-[2px_2px_0_#0f172a]"
      aria-hidden
    >
      <MessageCircle className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
    </span>
  );
}

// Gaveta de historico: desce do cabecalho POR CIMA do miolo, com backdrop
// clicavel e Escape fechando (listener no widget). Le SOMENTE dados que a
// lista ja carregou (title/updated_at do ConversationSummary); titulo derivado
// da primeira mensagem exigiria endpoint novo, fica como melhoria futura.
// Exclusao em dois passos inline, mesmo padrao da galeria do curriculo.
function HistoryDrawer({
  conversations,
  activeId,
  reduce,
  onSelect,
  onDelete,
  onClose,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  reduce: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteClick(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="absolute inset-0 z-20">
      <div className="absolute inset-0 bg-slate-950/25" onClick={onClose} aria-hidden />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="absolute inset-x-0 top-0 max-h-[75%] overflow-y-auto border-b-2 border-slate-950 bg-white"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
          {/* TODO(Ana): titulo do painel de conversas. */}
          <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">
            Conversas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-slate-950 bg-white text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
            /* TODO(Ana): label de acessibilidade do botao fechar conversas. */
            aria-label="Fechar conversas"
            title="Fechar conversas"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {conversations.length === 0 ? (
          /* TODO(Ana): copy de lista de conversas vazia. */
          <p className="px-4 py-4 text-xs text-slate-400">
            Nenhuma conversa salva ainda.
          </p>
        ) : (
          <ul className="flex flex-col">
            {conversations.map((c) => {
              const title =
                c.title && c.title.trim().length > 0
                  ? c.title.trim()
                  : /* TODO(Ana): titulo padrao quando a conversa nao tem titulo. */
                    `Conversa de ${shortDate(c.updated_at)}`;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "flex items-center gap-2 border-b border-slate-200 px-3 py-2 last:border-b-0",
                    activeId === c.id && "bg-violet-50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-label={`Abrir conversa: ${title}`}
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg px-1.5 py-1 text-left hover:bg-violet-50"
                  >
                    <span className="w-full truncate text-sm font-bold text-slate-900">
                      {title}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {relativeDate(c.updated_at)}
                    </span>
                  </button>
                  {confirmingId === c.id ? (
                    <button
                      type="button"
                      disabled={deletingId === c.id}
                      onClick={() => void handleDeleteClick(c.id)}
                      className="shrink-0 rounded-full border-2 border-slate-950 bg-rose-600 px-3 py-1 text-[11px] font-black text-white shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {/* TODO(Ana): rotulos da exclusao em dois passos. */}
                      {deletingId === c.id ? "Excluindo..." : "Confirmar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(c.id)}
                      /* TODO(Ana): label de acessibilidade do botao apagar conversa. */
                      aria-label={`Apagar conversa: ${title}`}
                      title="Apagar conversa"
                      className="shrink-0 rounded-lg border-2 border-slate-950 bg-white p-1.5 text-slate-500 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

// Indicador "digitando": tres bolinhas, classe global ai-chat-typing-dot
// (index.css), a mesma do CurriculoChatPanel, com acento violet do widget.
// Sob reduced-motion as bolinhas ficam estaticas (a bolha ja comunica).
function TypingDots({ reduce }: { reduce: boolean }) {
  return (
    <span className="flex items-center gap-1 py-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cn(
            "h-2 w-2 rounded-full bg-violet-700",
            !reduce && "ai-chat-typing-dot",
          )}
        />
      ))}
    </span>
  );
}

export default function AgentWidget() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const reduce = useReducedMotion() ?? false;
  // Mesmo gate de login do resto do app. Usado SO quando o launcher e clicado por
  // um usuario deslogado: abre o modal de login em vez do chat.
  const { requireAuth, modalProps } = useAuthGate();
  // isPro vem do contexto de assinatura. Aqui ele decide APENAS O QUE MOSTRAR
  // (a gaveta de historico); o gating de acesso real e server-side (403 nos
  // endpoints, persistencia so para Pro no stream). A UI nao e a barreira.
  const { isPro } = useSubscription();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Prefill da ponte esconde os chips de partida (o input ja chega ocupado).
  const [hadPrefill, setHadPrefill] = useState(false);

  // Estado do historico (so usado quando Pro).
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false); // gaveta de historico

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, statusLabel, errorMsg, open]);

  // Abertura programatica (ver AGENT_OPEN_EVENT no topo): abre o painel e
  // pre-preenche o input SEM enviar. Deslogado cai no mesmo gate de login do
  // launcher.
  useEffect(() => {
    function onOpenEvent(event: Event) {
      const detail = (event as CustomEvent<AgentOpenEventDetail>).detail;
      if (!user) {
        requireAuth({});
        return;
      }
      setOpen(true);
      if (typeof detail?.prefill === "string" && detail.prefill.length > 0) {
        setInput(detail.prefill);
        setHadPrefill(true);
      }
    }
    window.addEventListener(AGENT_OPEN_EVENT, onOpenEvent);
    return () => window.removeEventListener(AGENT_OPEN_EVENT, onOpenEvent);
  }, [user, requireAuth]);

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

  // Escape fecha a gaveta de historico (backdrop cobre o clique fora).
  useEffect(() => {
    if (!historyOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setHistoryOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen]);

  // Enquanto o estado de auth carrega, nao renderiza nada (evita piscar). Depois
  // disso o launcher aparece para todos; o comportamento do clique e que muda
  // conforme estar logado ou nao (ver handleLauncherClick).
  if (loading) return null;

  // So mostra o historico (botao + gaveta) para Pro com historico disponivel.
  // Free e estado degradado ficam no chat puro, identico ao de hoje.
  const showHistory = isPro && historyAvailable;
  const starterChips = isPro ? STARTER_CHIPS_PRO : STARTER_CHIPS_FREE;

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
    setHadPrefill(false);
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
    setHistoryOpen(false); // fecha a gaveta apos escolher
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

  // A confirmacao agora e em dois passos inline na gaveta (sem window.confirm).
  async function handleDelete(id: string) {
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
        <div className="fixed bottom-24 right-5 z-40 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-[#faf8f4] shadow-[6px_6px_0_#0f172a]">
          {/* Cabecalho no padrao da casa: fundo branco, borda inferior, mascote
              em caixinha brutal violeta e acoes compactas a direita. */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-slate-950 bg-white px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-600 shadow-[2px_2px_0_#0f172a]"
                aria-hidden
              >
                <MessageCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                {/* TODO(Ana): titulo do assistente. */}
                <p className="font-display text-sm font-black uppercase tracking-[0.15em] text-slate-950">
                  Assistente
                </p>
                {/* TODO(Ana): status curto sob o titulo (free vs Pro). */}
                <p className="truncate text-[11px] font-semibold text-slate-500">
                  {isPro ? "Seu copiloto Pro" : "Guia do BoraNaTech"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {showHistory && conversations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-950 bg-white text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
                  /* TODO(Ana): label de acessibilidade do botao de historico. */
                  aria-label={`Historico de conversas (${conversations.length})`}
                  title="Historico de conversas"
                >
                  <History className="h-4 w-4" />
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950 bg-violet-600 px-1 text-[9px] font-black text-white"
                    aria-hidden
                  >
                    {conversations.length}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={startNewConversation}
                disabled={streaming}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-950 bg-white text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
                /* TODO(Ana): label de acessibilidade do botao nova conversa. */
                aria-label="Nova conversa"
                title="Nova conversa"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-950 bg-white text-slate-700 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px"
                /* TODO(Ana): label de acessibilidade do botao fechar. */
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Miolo: papel do agente (micro-pontilhado violeta sutil). */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#fdfcff] px-4 py-4 [background-image:radial-gradient(rgba(109,40,217,0.06)_1.2px,transparent_1.2px)] [background-size:18px_18px]"
            >
              {messages.length === 0 && (
                <div className="relative flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
                  {/* Marca-dagua central: decoracao estatica. */}
                  <MessageCircle
                    className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 -rotate-12 text-violet-800 opacity-5"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {/* TODO(Ana): copy do estado inicial do chat. */}
                  <p className="text-sm text-slate-500">
                    Posso ajudar voce a navegar pelo BoraNaTech e encontrar
                    conteudo. Sobre o que voce quer saber?
                  </p>
                  {!hadPrefill && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {starterChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setInput(chip)}
                          className="rounded-full border-2 border-slate-950 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-[2px_2px_0_#0f172a] transition-transform hover:-translate-y-px hover:bg-violet-50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {messages.map((m, i) => {
                // Avatar so na primeira bolha de cada sequencia do assistente;
                // as demais recebem um spacer para manter o alinhamento.
                const groupStart = i === 0 || messages[i - 1].role !== m.role;
                if (m.role === "assistant") {
                  return (
                    <motion.div
                      key={i}
                      initial={reduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex items-start justify-start gap-2"
                    >
                      {groupStart ? (
                        <AgentAvatar />
                      ) : (
                        <span className="w-7 shrink-0" aria-hidden />
                      )}
                      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border-2 border-slate-950 bg-violet-50 px-3 py-2 text-sm text-slate-900 shadow-[2px_2px_0_#0f172a]">
                        {m.content.length === 0 ? (
                          <>
                            {/* TODO(Ana): texto sr-only do indicador digitando. */}
                            <span className="sr-only">Assistente digitando</span>
                            <TypingDots reduce={reduce} />
                          </>
                        ) : (
                          <AssistantText text={m.content} />
                        )}
                      </div>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm border-2 border-slate-950 bg-white px-3 py-2 text-sm text-slate-900 shadow-[2px_2px_0_#0f172a]">
                      <span className="whitespace-pre-wrap break-words">
                        {m.content}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
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

            {/* Barra de input: anatomia brutal (tokens violeta em focus-within,
                enviar em circulo solido). */}
            <div className="border-t-2 border-slate-950 bg-white p-3">
              <div className="flex items-end gap-2">
                <div className="flex min-h-[40px] flex-1 items-end rounded-xl border-2 border-violet-200 bg-white shadow-[2px_2px_0_#0f172a] focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-200">
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
                    className="max-h-28 w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={streaming || input.trim().length === 0}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-violet-600 text-white shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
                  /* TODO(Ana): label de acessibilidade do botao enviar. */
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Gaveta de historico POR CIMA do miolo (Pro). */}
            {showHistory && historyOpen && (
              <HistoryDrawer
                conversations={conversations}
                activeId={activeConversationId}
                reduce={reduce}
                onSelect={loadConversation}
                onDelete={handleDelete}
                onClose={() => setHistoryOpen(false)}
              />
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleLauncherClick}
        className="bnt-pressable fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-950 bg-violet-600 text-white shadow-[4px_4px_0_#0f172a]"
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
