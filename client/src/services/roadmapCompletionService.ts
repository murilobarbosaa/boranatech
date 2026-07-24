import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export interface RoadmapCompletion {
  roadmapSlug: string;
  completedAt: string;
  // Required leaves da trilha no momento da conclusao (congelado no server).
  // Comparado com o count atual do catalogo pra detectar conteudo novo.
  requiredCount: number;
  // Quando a celebracao (confete do card dourado) foi exibida. null = ainda
  // nao celebrada (dispara na primeira visualizacao do card already_issued).
  celebratedAt: string | null;
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request(path: string, options?: RequestInit) {
  const header = await authHeader();

  return fetch(apiUrl(`/api/roadmap-completions${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...header,
      ...(options?.headers || {}),
    },
  });
}

// Cache simples em memoria por usuario: a lista de conclusoes muda raramente
// (so quando um roadmap inteiro e concluido) e a pagina da trilha consulta a
// cada mount. registerCompletion atualiza o cache no lugar de invalida-lo.
let cachedUserId: string | null = null;
let cachedCompletions: RoadmapCompletion[] | null = null;

export async function listCompletions(
  userId: string,
): Promise<RoadmapCompletion[] | null> {
  if (cachedUserId === userId && cachedCompletions !== null) {
    return cachedCompletions;
  }
  try {
    const res = await request("/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: RoadmapCompletion[] };
    cachedUserId = userId;
    cachedCompletions = json.data ?? [];
    return cachedCompletions;
  } catch (err) {
    console.error("[roadmapCompletion] listCompletions error:", err);
    return null;
  }
}

export async function registerCompletion(
  userId: string,
  slug: string,
): Promise<RoadmapCompletion | null> {
  try {
    const res = await request(`/${encodeURIComponent(slug)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      data?: {
        completedAt: string;
        requiredCount: number;
        celebratedAt: string | null;
      };
    };
    if (!json.data) return null;
    const completion: RoadmapCompletion = {
      roadmapSlug: slug,
      completedAt: json.data.completedAt,
      requiredCount: json.data.requiredCount,
      celebratedAt: json.data.celebratedAt ?? null,
    };
    if (cachedUserId === userId && cachedCompletions !== null) {
      const rest = cachedCompletions.filter((c) => c.roadmapSlug !== slug);
      cachedCompletions = [completion, ...rest];
    }
    return completion;
  } catch (err) {
    // Falha de rede nao interrompe a celebracao; a reconciliacao na proxima
    // visita tenta de novo.
    console.error("[roadmapCompletion] registerCompletion error:", err);
    return null;
  }
}

// Marca a celebracao como exibida (Etapa 2 do card de conclusao). Otimista no
// cache em memoria PRIMEIRO (a proxima leitura ja ve celebrada, mesmo antes ou
// apesar da resposta do server) e so entao dispara o POST. Fire-and-forget:
// falha nao e visivel e, no pior caso, rende um disparo extra numa sessao
// futura (cache perdido, marcacao nao persistida) — nunca erro pro usuario.
export async function markCelebrated(
  userId: string,
  slug: string,
): Promise<void> {
  if (cachedUserId === userId && cachedCompletions !== null) {
    cachedCompletions = cachedCompletions.map((c) =>
      c.roadmapSlug === slug && c.celebratedAt === null
        ? { ...c, celebratedAt: new Date().toISOString() }
        : c,
    );
  }
  try {
    const res = await request(`/${encodeURIComponent(slug)}/celebrated`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error("[roadmapCompletion] markCelebrated error:", err);
  }
}
