import { deleteProgress, upsertProgress } from "@/services/userProgressService";

// Conclusao AUTODECLARADA de projeto (Fase 5b), mesmo nivel de confianca dos
// checkboxes de trilha; a conclusao validada por leitor de GitHub e da fase
// 5c. Anonimo persiste aqui (JSON array de ids de projeto numa chave unica,
// espelhando o padrao de progressStorage); logado persiste no context
// project_progress de user_progress.
const KEY = "bora-na-tech:project-progress";

export const PROJECT_PROGRESS_CONTEXT = "project_progress" as const;

export function loadProjectProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((x): x is string => typeof x === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function saveProjectProgress(ids: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Storage indisponivel (modo privado etc.): progresso anonimo se perde,
    // mesmo comportamento do progresso de trilha.
  }
}

export function clearProjectProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}

// Espelho trilha -> projeto: quando o no de trilha com project e alternado,
// o project_progress do projeto referenciado acompanha. Fire-and-forget no
// caminho logado: o toggle do no ja tem otimismo e rollback proprios
// (useRoadmapProgress) e a pagina /projetos recarrega o estado no mount, entao
// falha aqui degrada pra consistencia eventual, nunca pra estado travado.
// Trilha estatica so aponta pra projeto gratuito, entao o gate Pro do server
// nunca barra este caminho.
export function mirrorProjectFromTrail(
  projectId: string,
  done: boolean,
  userId: string | null,
): void {
  if (!userId) {
    const local = loadProjectProgress();
    if (done) local.add(projectId);
    else local.delete(projectId);
    saveProjectProgress(local);
    return;
  }
  const op = done
    ? upsertProgress(PROJECT_PROGRESS_CONTEXT, projectId, { done: true })
    : deleteProgress(PROJECT_PROGRESS_CONTEXT, projectId);
  void op.catch((err) => {
    console.error("[projectProgress] espelho trilha->projeto falhou:", err);
  });
}
