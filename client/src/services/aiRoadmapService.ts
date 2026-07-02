import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { RoadmapIntake } from "@shared/aiRoadmap";
import type { RoadmapV2 } from "@shared/roadmapV2/types";

// Cliente do Roadmap com IA (/api/roadmaps-ia): lista, detalhe e os streams
// SSE de geracao e retomada, no mesmo padrao de consumo do agentClient
// (frames data: JSON ate data: [DONE], JWT da sessao Supabase).

export type AiRoadmapStatus = "generating" | "partial" | "ready" | "failed";

export interface AiRoadmapListItem {
  id: string;
  slug: string;
  title: string;
  status: AiRoadmapStatus;
  created_at: string;
}

export interface AiRoadmapDetail extends AiRoadmapListItem {
  roadmap: RoadmapV2;
  updated_at: string;
}

export interface GenerationHandlers {
  onSkeleton: (info: { slug: string; title: string; total: number }) => void;
  onSection: (info: { index: number; total: number }) => void;
  onError: (info: { message: string; sectionIndex?: number }) => void;
  onDone: (info: { slug: string }) => void;
}

// Erro HTTP pre-SSE traduzido para a UI diferenciar quota (rate_limited),
// geracao em andamento (generation_in_progress/resume_in_progress), Pro
// (pro_required) e indisponibilidade (503). ok:true = o stream rodou (os
// frames ja foram despachados aos handlers, inclusive erro de geracao).
export type StreamResult = { ok: true } | { ok: false; blocked: string; message: string };

// Espelha o agentClient: o JWT vem da sessao do Supabase.
async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function readErrorBody(body: unknown): { code: string; message: string } {
  if (body && typeof body === "object") {
    const rec = body as { error?: { code?: unknown; message?: unknown } };
    return {
      code: typeof rec.error?.code === "string" ? rec.error.code : "unknown",
      // TODO(Ana): mensagem generica de erro do servico.
      message:
        typeof rec.error?.message === "string"
          ? rec.error.message
          : "Nao foi possivel completar agora. Tente novamente.",
    };
  }
  // TODO(Ana): mensagem generica de erro do servico.
  return { code: "unknown", message: "Nao foi possivel completar agora. Tente novamente." };
}

export async function listAiRoadmaps(): Promise<AiRoadmapListItem[]> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/roadmaps-ia"), {
    headers: authHeader,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorBody(body).message);
  }
  const payload = (await response.json()) as { roadmaps?: AiRoadmapListItem[] };
  return payload.roadmaps ?? [];
}

// 404 (inexistente ou de outro usuario) vira null, nao excecao: a pagina de
// visualizacao trata como redirect.
export async function getAiRoadmap(slug: string): Promise<AiRoadmapDetail | null> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(`/api/roadmaps-ia/${encodeURIComponent(slug)}`), {
    headers: authHeader,
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorBody(body).message);
  }
  return (await response.json()) as AiRoadmapDetail;
}

interface GenerationFrame {
  type?: unknown;
  slug?: unknown;
  title?: unknown;
  total?: unknown;
  index?: unknown;
  message?: unknown;
  sectionIndex?: unknown;
}

// Consome o corpo SSE despachando os frames de geracao (skeleton, section,
// error, done) ate o data: [DONE], no mesmo laco de parsing do agentClient.
async function consumeGenerationStream(
  body: ReadableStream<Uint8Array>,
  handlers: GenerationHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    pending += decoder.decode(value, { stream: true });
    const events = pending.split("\n\n");
    pending = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") return;

        let frame: GenerationFrame | null = null;
        try {
          frame = JSON.parse(payload) as GenerationFrame;
        } catch {
          // Linha nao-JSON (keep-alive ou parcial). Ignora.
          continue;
        }
        if (!frame || typeof frame.type !== "string") continue;

        if (frame.type === "skeleton") {
          handlers.onSkeleton({
            slug: typeof frame.slug === "string" ? frame.slug : "",
            title: typeof frame.title === "string" ? frame.title : "",
            total: typeof frame.total === "number" ? frame.total : 0,
          });
        } else if (frame.type === "section") {
          handlers.onSection({
            index: typeof frame.index === "number" ? frame.index : 0,
            total: typeof frame.total === "number" ? frame.total : 0,
          });
        } else if (frame.type === "error") {
          handlers.onError({
            // TODO(Ana): mensagem generica de erro de geracao.
            message:
              typeof frame.message === "string"
                ? frame.message
                : "Erro ao gerar. Tente novamente.",
            sectionIndex:
              typeof frame.sectionIndex === "number" ? frame.sectionIndex : undefined,
          });
        } else if (frame.type === "done") {
          handlers.onDone({
            slug: typeof frame.slug === "string" ? frame.slug : "",
          });
        }
      }
    }
  }
}

async function streamSse(
  path: string,
  requestBody: unknown,
  handlers: GenerationHandlers,
): Promise<StreamResult> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeader,
    },
    body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
  });

  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as unknown;
    const parsed = readErrorBody(body);
    return { ok: false, blocked: parsed.code, message: parsed.message };
  }

  await consumeGenerationStream(response.body, handlers);
  return { ok: true };
}

export function streamGeneration(
  intake: RoadmapIntake,
  handlers: GenerationHandlers,
): Promise<StreamResult> {
  return streamSse("/api/roadmaps-ia/generate", intake, handlers);
}

export function streamResume(
  slug: string,
  handlers: GenerationHandlers,
): Promise<StreamResult> {
  return streamSse(
    `/api/roadmaps-ia/${encodeURIComponent(slug)}/resume`,
    undefined,
    handlers,
  );
}
