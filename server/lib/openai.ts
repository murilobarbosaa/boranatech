export const OPENAI_BASE_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";
export const OPENAI_TRANSCRIPTION_URL =
  "https://api.openai.com/v1/audio/transcriptions";
export const DEFAULT_MODEL = "gpt-4o-mini";
export const MODERATION_MODEL = "omni-moderation-latest";
export const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

export function buildOpenAIHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}
