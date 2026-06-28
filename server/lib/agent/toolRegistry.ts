import { searchPlatformContent } from "./tools/searchPlatformContent";
import { suggestNavigation } from "./tools/suggestNavigation";
import type { AgentTool } from "./types";

// Registro unico de tools do agente. Nesta fase so existem tools free; a Fase 2
// adiciona tools tier "pro" a esta lista, sem tocar no resto do framework.
const TOOLS: AgentTool[] = [searchPlatformContent, suggestNavigation];

// Selecao por tier verificado server-side. Free (!isPro) recebe apenas tools
// free; Pro recebe free + pro. Como ainda nao ha tools pro, ambos os tiers
// recebem o mesmo conjunto free, mas o caminho de gating ja esta correto.
export function getToolsForTier(isPro: boolean): AgentTool[] {
  if (isPro) {
    return TOOLS;
  }
  return TOOLS.filter((tool) => tool.tier === "free");
}

export function getToolByName(name: string): AgentTool | undefined {
  return TOOLS.find((tool) => tool.name === name);
}
