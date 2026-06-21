import { useEffect, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { AiChatMessage } from "@/lib/aiClient";
import { callAiStructured } from "@/lib/aiClient";
import { cn } from "@/lib/utils";
import type { PlanoEstudos, StudyPlanResponse } from "@shared/estudos/schema";
import EstudosChatPanel from "./EstudosChatPanel";
import PlanoEstudosCanvas from "./PlanoEstudosCanvas";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLarge = useMinWidth(LG_BREAKPOINT);

  async function handleSend(text: string) {
    if (loading) return;
    setError("");

    const afterUser: AiChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(afterUser);
    setLoading(true);

    try {
      const { data } = await callAiStructured<StudyPlanResponse>("study-plan", {
        messages: afterUser,
      });
      setMessages([
        ...afterUser,
        { role: "assistant", content: data.mensagem },
      ]);
      // Substitui o plano inteiro a cada turno; as keys cuidam da animação.
      setPlano(data.plano);
    } catch (err) {
      // Erro não apaga o último plano bom; aparece no chat.
      setError(getAiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const chat = (
    <EstudosChatPanel
      messages={messages}
      loading={loading}
      error={error}
      onSend={handleSend}
    />
  );
  const canvas = <PlanoEstudosCanvas plano={plano} loading={loading} />;

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
    <div className="flex flex-col gap-6">
      <div className={PANEL_HEIGHT}>{chat}</div>
      <div className={PANEL_HEIGHT}>{canvas}</div>
    </div>
  );
}
