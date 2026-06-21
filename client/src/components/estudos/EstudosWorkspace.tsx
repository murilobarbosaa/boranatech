import { useEffect, useRef, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AiChatMessage } from "@/lib/aiClient";
import { callAiChatStream, callAiStructured } from "@/lib/aiClient";
import { cn } from "@/lib/utils";
import type { PlanoEstudos } from "@shared/estudos/schema";
import EstudosChatPanel from "./EstudosChatPanel";
import PlanoEstudosCanvas from "./PlanoEstudosCanvas";

// Mesma cadência de reveal do CurriculoChatPanel: os tokens entram num buffer e
// são revelados a ritmo fixo no content da última msg assistant.
const TYPING_CHARS_PER_SECOND = 45;
const TYPING_TICK_MS = Math.max(8, Math.round(1000 / TYPING_CHARS_PER_SECOND));

// COPY pendente de sign-off da Ana. Aqui só os rótulos das abas (mobile).
// TODO(Ana): pendente de sign-off
const COPY = {
  tabConversa: "Conversa",
  tabPlano: "Meu plano",
} as const;

type EstudosTab = "conversa" | "plano";

// Mensagem inicial do Natechinho, já aprovada (mesmo texto da tela atual).
const INITIAL_GREETING =
  "Oi! Eu sou o Natechinho, seu mentor de estudos aqui no BoraNaTech. Fico feliz que você veio.\n\nMe conta com calma: qual área da tech está te puxando mais agora (tipo front, back, dados, mobile…) e, em poucas palavras, o que você quer conquistar com esse estudo? Pode mandar do seu jeito, sem pressa.";

// Split lado a lado a partir de lg (1024px). Abaixo disso, empilha.
const LG_BREAKPOINT = 1024;
const PANEL_HEIGHT = "h-[min(74vh,640px)]";

function getAiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Não foi possível enviar agora.";
  if (err.message === "LOGIN_REQUIRED")
    return "Faça login para usar esta ferramenta.";
  if (err.message === "PRO_REQUIRED")
    return "Esta ferramenta requer o Plano Pro.";
  if (err.message.startsWith("RATE_LIMITED"))
    return err.message.replace("RATE_LIMITED: ", "");
  return err.message || "Não foi possível enviar agora.";
}

function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(`(min-width: ${px}px)`).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(`(min-width: ${px}px)`);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [px]);

  return matches;
}

export default function EstudosWorkspace() {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [plano, setPlano] = useState<PlanoEstudos | null>(null);
  // Loadings SEPARADOS: chatStreaming controla a bolha/typing do chat;
  // planLoading controla o canvas (shimmer/pill do PLANO, não da conversa).
  const [chatStreaming, setChatStreaming] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [activeTab, setActiveTab] = useState<EstudosTab>("conversa");
  const [hasPlanoUpdate, setHasPlanoUpdate] = useState(false);

  const isLarge = useMinWidth(LG_BREAKPOINT);

  // Ref pra ler a aba ativa no momento da RESPOSTA (o usuário pode ter trocado
  // de aba durante o loading), não no momento do envio.
  const activeTabRef = useRef<EstudosTab>(activeTab);

  function handleTabChange(value: string) {
    const tab: EstudosTab = value === "plano" ? "plano" : "conversa";
    activeTabRef.current = tab;
    setActiveTab(tab);
    if (tab === "plano") setHasPlanoUpdate(false);
  }

  // a) Conversa em streaming. Mesma mecânica do CurriculoChatPanel: buffer +
  // typewriter revelando no content da última msg assistant.
  async function runChatStream(afterUser: AiChatMessage[]) {
    const fullBufferRef = { current: "" };
    const streamDoneRef = { current: false };
    let revealedLength = 0;

    const revealDone = new Promise<void>((resolve) => {
      const timer = window.setInterval(() => {
        const target = fullBufferRef.current;
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
      await callAiChatStream("study-plan", afterUser, {
        onToken: (delta) => {
          fullBufferRef.current += delta;
        },
        onError: (msg) => {
          console.warn("[EstudosWorkspace] stream error:", msg);
        },
      });
    } catch (err) {
      streamError = err;
    }

    streamDoneRef.current = true;
    await revealDone;
    setChatStreaming(false);

    if (streamError) {
      setChatError(getAiErrorMessage(streamError));
      // Remove a bolha vazia se nenhum token chegou.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }

  // b) Plano estruturado em paralelo. Erro NÃO apaga o último plano bom.
  async function runPlanBuild(afterUser: AiChatMessage[]) {
    try {
      const { data } = await callAiStructured<PlanoEstudos>(
        "study-plan-build",
        { messages: afterUser },
      );
      // Substitui o plano inteiro a cada turno; as keys cuidam da animação.
      setPlano(data);

      // Pulsa "Meu plano" só com conteúdo visível E aba ativa = conversa.
      const planoTemConteudo = data.area != null || data.semanas.length > 0;
      if (planoTemConteudo && activeTabRef.current === "conversa") {
        setHasPlanoUpdate(true);
      }
    } catch (err) {
      // Mantém o plano atual; o próximo turno reconstrói. Sem UI alarmante.
      console.warn("[EstudosWorkspace] plano build error:", err);
    } finally {
      setPlanLoading(false);
    }
  }

  function handleSend(text: string) {
    if (chatStreaming) return;
    setChatError("");

    const afterUser: AiChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    // user + bolha assistant vazia (alvo do streaming).
    setMessages([...afterUser, { role: "assistant", content: "" }]);
    setChatStreaming(true);
    setPlanLoading(true);

    // As DUAS chamadas disparam em paralelo (sem await sequencial).
    void runChatStream(afterUser);
    void runPlanBuild(afterUser);
  }

  const chat = (
    <EstudosChatPanel
      messages={messages}
      streaming={chatStreaming}
      error={chatError}
      onSend={handleSend}
    />
  );
  const canvas = <PlanoEstudosCanvas plano={plano} loading={planLoading} />;

  if (isLarge) {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className={cn(PANEL_HEIGHT, "rounded-2xl")}
      >
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full pr-3">{chat}</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={28}>
          <div className="h-full pl-3">{canvas}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-3">
      <TabsList className="grid w-full grid-cols-2 border-2 border-slate-900 bg-violet-50 p-1">
        <TabsTrigger
          value="conversa"
          className="font-display font-black data-[state=active]:bg-violet-700 data-[state=active]:text-white"
        >
          {COPY.tabConversa}
        </TabsTrigger>
        <TabsTrigger
          value="plano"
          className="relative font-display font-black data-[state=active]:bg-violet-700 data-[state=active]:text-white"
        >
          {COPY.tabPlano}
          {hasPlanoUpdate ? (
            <span
              className="absolute right-1.5 top-1 flex h-2.5 w-2.5"
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-600" />
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="conversa" className={PANEL_HEIGHT}>
        {chat}
      </TabsContent>
      <TabsContent value="plano" className={PANEL_HEIGHT}>
        {canvas}
      </TabsContent>
    </Tabs>
  );
}
