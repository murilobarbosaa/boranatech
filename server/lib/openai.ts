export const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";
export const DEFAULT_MODEL = "gpt-4o-mini";

export function buildOpenAIHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}
