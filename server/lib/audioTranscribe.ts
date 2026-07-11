import { env } from "./env";
import { fetchWithTimeout } from "./http";
import { OPENAI_TRANSCRIPTION_URL, TRANSCRIPTION_MODEL } from "./openai";

/**
 * Transcricao de audio da entrevista simulada (molde server/lib/avatarUpload.ts):
 * audio chega em base64 no body JSON, vira Buffer com cap IMEDIATO de tamanho,
 * mimetype e detectado por magic bytes (o declarado pelo client e ignorado) e a
 * chamada a OpenAI usa multipart com FormData nativo do Node. NENHUM audio e
 * persistido: o buffer vive so no request.
 */

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

const TRANSCRIPTION_TIMEOUT_MS = 60_000;

// Erro tipado pra rota mapear pro createError correto, sem vazar detalhe sensivel.
export class AudioTranscribeError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function decodeAudioInput(input: string): Buffer {
  if (typeof input !== "string" || input.length === 0) {
    // TODO(Ana): mensagem de audio invalido.
    throw new AudioTranscribeError(400, "invalid_audio", "Audio invalido.");
  }

  let b64 = input;
  const dataUrl = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(input);
  if (dataUrl) {
    if (!dataUrl[2]) {
      // TODO(Ana): mensagem de audio invalido.
      throw new AudioTranscribeError(400, "invalid_audio", "Audio invalido.");
    }
    b64 = dataUrl[3];
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    // TODO(Ana): mensagem de audio invalido.
    throw new AudioTranscribeError(400, "invalid_audio", "Audio invalido.");
  }
  if (buf.length === 0) {
    // TODO(Ana): mensagem de audio invalido.
    throw new AudioTranscribeError(400, "invalid_audio", "Audio invalido.");
  }

  // DIFERENTE do avatar: o cap e checado AQUI, imediatamente apos o decode,
  // antes de qualquer outro trabalho com o buffer.
  if (buf.length > MAX_AUDIO_BYTES) {
    throw new AudioTranscribeError(
      413,
      "audio_too_large",
      // TODO(Ana): mensagem de audio grande demais.
      "A gravacao passa do limite de 5MB. Grave um audio mais curto.",
    );
  }

  return buf;
}

export interface DetectedAudio {
  mime: "audio/webm" | "audio/ogg" | "audio/mp4";
  filename: string;
}

// Deteccao por assinatura do arquivo (magic bytes), ignorando o content-type
// declarado, mesmo padrao do avatar.
export function detectAudioMime(buf: Buffer): DetectedAudio {
  // EBML (container do webm): 1A 45 DF A3.
  if (
    buf.length >= 4 &&
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  ) {
    return { mime: "audio/webm", filename: "audio.webm" };
  }
  // "OggS".
  if (
    buf.length >= 4 &&
    buf[0] === 0x4f &&
    buf[1] === 0x67 &&
    buf[2] === 0x67 &&
    buf[3] === 0x53
  ) {
    return { mime: "audio/ogg", filename: "audio.ogg" };
  }
  // ISO BMFF (mp4/m4a): "ftyp" nos bytes 4 a 7.
  if (
    buf.length >= 8 &&
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    return { mime: "audio/mp4", filename: "audio.mp4" };
  }

  throw new AudioTranscribeError(
    415,
    "unsupported_audio_format",
    // TODO(Ana): mensagem de formato de audio nao suportado.
    "Formato de audio nao suportado. Grave pelo botao de microfone.",
  );
}

export interface TranscribeAudioParams {
  buffer: Buffer;
  mime: DetectedAudio["mime"];
  filename: string;
  language?: string;
}

/**
 * Chama a transcricao da OpenAI em multipart. UMA tentativa, sem retry: o
 * payload e grande e o client retem o blob para reenvio manual. O header tem
 * APENAS Authorization: o Content-Type (com boundary) e definido pelo fetch a
 * partir do FormData; setar manualmente quebraria o multipart.
 */
export async function transcribeAudio({
  buffer,
  mime,
  filename,
  language,
}: TranscribeAudioParams): Promise<string> {
  if (!env.openaiApiKey) {
    throw new AudioTranscribeError(
      502,
      "transcription_failed",
      "Servico de IA nao configurado.",
    );
  }

  const form = new FormData();
  form.append("file", new File([new Uint8Array(buffer)], filename, { type: mime }));
  form.append("model", TRANSCRIPTION_MODEL);
  // So repassa idiomas que a sessao realmente usa ("pt" | "en"). Qualquer outro
  // valor e omitido de proposito: sem o parametro a API detecta o idioma
  // sozinha, o que e mais honesto do que inventar um mapeamento.
  if (language === "pt" || language === "en") {
    form.append("language", language);
  }
  form.append("response_format", "json");

  const response = await fetchWithTimeout(
    OPENAI_TRANSCRIPTION_URL,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.openaiApiKey}` },
      body: form,
    },
    { service: "openai", timeoutMs: TRANSCRIPTION_TIMEOUT_MS },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AudioTranscribeError(
      502,
      "transcription_failed",
      `OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    text?: unknown;
  } | null;
  if (!payload || typeof payload.text !== "string") {
    throw new AudioTranscribeError(
      502,
      "transcription_failed",
      "A transcricao nao retornou texto.",
    );
  }

  return payload.text;
}
