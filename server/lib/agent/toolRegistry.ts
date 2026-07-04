import { getActivitySummary } from "./tools/getActivitySummary";
import { getFavorites } from "./tools/getFavorites";
import { getGithubAnalysis } from "./tools/getGithubAnalysis";
import { getLinkedinAnalysis } from "./tools/getLinkedinAnalysis";
import { getProfileSkills } from "./tools/getProfileSkills";
import { getQuizResult } from "./tools/getQuizResult";
import { getResumeAnalysis } from "./tools/getResumeAnalysis";
import { searchPlatformContent } from "./tools/searchPlatformContent";
import { suggestNavigation } from "./tools/suggestNavigation";
import type { AgentTool } from "./types";

// Registro unico de tools do agente.
// Free: searchPlatformContent, suggestNavigation.
// Pro (tier "pro"): getQuizResult, getFavorites, getProfileSkills,
// getActivitySummary, getLinkedinAnalysis, getGithubAnalysis,
// getResumeAnalysis. O gating por tier abaixo garante que usuario free NUNCA
// recebe uma tool tier "pro".
const TOOLS: AgentTool[] = [
  searchPlatformContent,
  suggestNavigation,
  getQuizResult,
  getFavorites,
  getProfileSkills,
  getActivitySummary,
  getLinkedinAnalysis,
  getGithubAnalysis,
  getResumeAnalysis,
];

// Selecao por tier verificado server-side. Free (!isPro) recebe APENAS tools com
// tier "free" (filtro explicito abaixo); Pro recebe free + pro. Uma tool tier
// "pro" como getQuizResult so e entregue quando isPro === true.
export function getToolsForTier(isPro: boolean): AgentTool[] {
  if (isPro) {
    return TOOLS;
  }
  return TOOLS.filter((tool) => tool.tier === "free");
}

export function getToolByName(name: string): AgentTool | undefined {
  return TOOLS.find((tool) => tool.name === name);
}
