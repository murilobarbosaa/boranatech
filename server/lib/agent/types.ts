// Tipos publicos do framework de agente. Mantidos minimos e estaveis: a Fase 2
// adiciona tools tier "pro" sem mexer nestas interfaces.

export type AgentTier = "free" | "pro";

// Contexto resolvido SO no servidor a partir do request autenticado. O userId
// vem sempre de req.user.id (JWT verificado), nunca do corpo da requisicao.
// Nesta fase free nenhuma tool usa userId para ler dado pessoal; ele existe
// para o gating e para a Fase 2.
export interface AgentContext {
  userId: string;
  isPro: boolean;
  currentRoute?: string;
}

// parameters segue o formato JSON Schema que a OpenAI espera em tools[].function.
// Tipado como objeto generico (sem any) porque a forma e validada pela OpenAI.
export interface AgentTool {
  name: string;
  description: string;
  tier: AgentTier;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, ctx: AgentContext): Promise<string>;
}
