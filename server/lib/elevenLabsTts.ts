import { env } from "./env";
import { fetchWithTimeout } from "./http";

/**
 * Cliente de TTS da ElevenLabs (voz do Natechinho nas entrevistas), molde
 * estrutural de server/lib/asaas.ts: base URL constante, header proprio de
 * auth, fetchWithTimeout com service dedicado e erro tipado sem vazar
 * detalhe sensivel. A resposta e BINARIA (audio/mpeg), unico vendor do repo
 * que nao devolve JSON.
 */

const ELEVENLABS_TTS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// Teto por chamada. SEM retry de proposito (padrao asaas): TTS cobra por
// caractere e a retentativa natural e o proprio clique de play do usuario.
const ELEVENLABS_TIMEOUT_MS = 30_000;

// Erro tipado pra rota mapear pro createError correto.
export class ElevenLabsTtsError extends Error {
  status: number;
  code: "tts_unavailable" | "tts_failed";
  constructor(
    status: number,
    code: "tts_unavailable" | "tts_failed",
    message: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function synthesizeSpeech({
  text,
}: {
  text: string;
}): Promise<{ buffer: Buffer; mime: "audio/mpeg" }> {
  // Envs vazias desligam a feature (padrao currentsApiKey): 503 honesto.
  if (!env.elevenLabsApiKey || !env.elevenLabsVoiceId) {
    throw new ElevenLabsTtsError(
      503,
      "tts_unavailable",
      "Servico de voz nao configurado.",
    );
  }

  const response = await fetchWithTimeout(
    `${ELEVENLABS_TTS_BASE_URL}/${env.elevenLabsVoiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.elevenLabsApiKey,
      },
      body: JSON.stringify({ text, model_id: env.elevenLabsModelId }),
    },
    { service: "elevenlabs", timeoutMs: ELEVENLABS_TIMEOUT_MS },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // Voz ou modelo recusados pela ElevenLabs tambem caem aqui: 502 logado
    // pela rota; JAMAIS trocar voz/modelo por conta propria.
    throw new ElevenLabsTtsError(
      502,
      "tts_failed",
      `ElevenLabs respondeu ${response.status}: ${body.slice(0, 300)}`,
    );
  }

  const arrayBuf = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuf), mime: "audio/mpeg" };
}
