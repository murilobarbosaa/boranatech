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
  updated_at: string;
  // Presentes (nao-null) apenas em roadmaps ready; base do badge Concluido.
  totalSteps?: number | null;
  completedSteps?: number | null;
}

export interface AiRoadmapDetail extends AiRoadmapListItem {
  roadmap: RoadmapV2;
}

// Resumo do contexto do usuario que a geracao vai usar (GET /context).
export interface AiRoadmapContext {
  quiz: { area: string | null; level: string | null } | null;
  skills: string[];
  trails: Array<{ title: string; pct: number | null }>;
  careerGoal: string | null;
  studyMinutes30d: number | null;
}

export interface GenerationHandlers {
  onSkeleton: (info: { slug: string; title: string; total: number }) => void;
  onSection: (info: { index: number; total: number }) => void;
  onError: (info: { message: string; sectionIndex?: number }) => void;
  onDone: (info: { slug: string }) => void;
  // Degradacao graciosa: uma secao falhou mas a geracao seguiu (opcionais para
  // nao quebrar chamadores que so tratam o caminho antigo).
  onSectionFailed?: (info: { index: number; total: number }) => void;
  onPartial?: (info: {
    slug: string;
    total: number;
    filled: number;
    failed: number[];
  }) => void;
}

// Erro HTTP pre-SSE traduzido para a UI diferenciar quota (rate_limited),
// geracao em andamento (generation_in_progress/resume_in_progress), Pro
// (pro_required) e indisponibilidade (503). ok:true = o stream rodou; terminal
// indica se chegou um frame de fechamento (done/error/partial): terminal:false
// significa conexao caiu no meio (evita o spinner infinito na UI).
export type StreamResult =
  | { ok: true; terminal: boolean }
  | { ok: false; blocked: string; message: string };

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

export async function getAiRoadmapContext(): Promise<AiRoadmapContext> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/roadmaps-ia/context"), {
    headers: authHeader,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorBody(body).message);
  }
  return (await response.json()) as AiRoadmapContext;
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
  filled?: unknown;
  failed?: unknown;
}

// Consome o corpo SSE despachando os frames de geracao (skeleton, section,
// section_failed, error, partial, done) ate o data: [DONE], no mesmo laco de
// parsing do agentClient. Retorna true se chegou um frame de fechamento
// (error/partial/done); false = o stream terminou sem fechamento (conexao caiu).
async function consumeGenerationStream(
  body: ReadableStream<Uint8Array>,
  handlers: GenerationHandlers,
): Promise<boolean> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let terminal = false;

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
        if (payload === "[DONE]") return terminal;

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
        } else if (frame.type === "section_failed") {
          handlers.onSectionFailed?.({
            index: typeof frame.index === "number" ? frame.index : 0,
            total: typeof frame.total === "number" ? frame.total : 0,
          });
        } else if (frame.type === "error") {
          terminal = true;
          handlers.onError({
            // TODO(Ana): mensagem generica de erro de geracao.
            message:
              typeof frame.message === "string"
                ? frame.message
                : "Erro ao gerar. Tente novamente.",
            sectionIndex:
              typeof frame.sectionIndex === "number" ? frame.sectionIndex : undefined,
          });
        } else if (frame.type === "partial") {
          terminal = true;
          handlers.onPartial?.({
            slug: typeof frame.slug === "string" ? frame.slug : "",
            total: typeof frame.total === "number" ? frame.total : 0,
            filled: typeof frame.filled === "number" ? frame.filled : 0,
            failed: Array.isArray(frame.failed)
              ? frame.failed.filter((n): n is number => typeof n === "number")
              : [],
          });
        } else if (frame.type === "done") {
          terminal = true;
          handlers.onDone({
            slug: typeof frame.slug === "string" ? frame.slug : "",
          });
        }
      }
    }
  }
  return terminal;
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

  const terminal = await consumeGenerationStream(response.body, handlers);
  return { ok: true, terminal };
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
