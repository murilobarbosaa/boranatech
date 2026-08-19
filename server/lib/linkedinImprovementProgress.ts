import { readQualitative } from "../../shared/linkedin/readQualitative";

/** Quantidade real de melhorias em um result atual, legado ou parcialmente corrompido. */
export function quantidadeDeMelhorias(rawResult: unknown): number {
  if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
    return 0;
  }
  const result = rawResult as Record<string, unknown>;
  const version =
    typeof result.qualitativeVersion === "number"
      ? result.qualitativeVersion
      : undefined;
  return readQualitative(result.qualitative, version).melhorias.length;
}

export function indiceDeMelhoriaExiste(
  rawResult: unknown,
  index: number,
): boolean {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < quantidadeDeMelhorias(rawResult)
  );
}

/** Degrada linhas antigas/corrompidas sem devolvê-las ao cliente. */
export function indicesDeMelhoriaValidos(
  valores: readonly unknown[],
  total: number,
): number[] {
  return Array.from(
    new Set(
      valores.filter(
        (valor): valor is number =>
          typeof valor === "number" &&
          Number.isInteger(valor) &&
          valor >= 0 &&
          valor < total,
      ),
    ),
  );
}

export interface LinkedinImprovementMutation {
  userId: string;
  analysisId: string;
  index: number;
  done: boolean;
  revision: number;
}

export type LinkedinImprovementAtomicResult =
  | { status: "saved" }
  | { status: "not_found" }
  | { status: "stale_progress_revision" }
  | { status: "invalid_improvement_index" }
  | { status: "save_failed"; error: unknown };

export type LinkedinProgressRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: unknown | null }>;

function firstRpcRow(data: unknown): Record<string, unknown> | null {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function beginLinkedinProgressSessionViaRpc(
  input: { userId: string; analysisId: string },
  rpc: LinkedinProgressRpcCall,
): Promise<BeginLinkedinProgressSessionResult> {
  const { data, error } = await rpc("linkedin_begin_progress_session", {
    p_user_id: input.userId,
    p_analysis_id: input.analysisId,
  });
  if (error) return { status: "start_failed", error };
  const row = firstRpcRow(data);
  if (row?.status === "not_found") return { status: "not_found" };
  if (row?.status === "started" && typeof row.revision === "number") {
    return { status: "started", revision: row.revision };
  }
  return {
    status: "start_failed",
    error: new Error("invalid_begin_progress_session_response"),
  };
}

export async function mutateLinkedinImprovementViaRpc(
  value: LinkedinImprovementMutation,
  rpc: LinkedinProgressRpcCall,
): Promise<LinkedinImprovementAtomicResult> {
  const { data, error } = await rpc("linkedin_set_improvement_progress", {
    p_user_id: value.userId,
    p_analysis_id: value.analysisId,
    p_improvement_index: value.index,
    p_done: value.done,
    p_revision: value.revision,
  });
  if (error) return { status: "save_failed", error };
  if (
    data === "saved" ||
    data === "not_found" ||
    data === "stale_progress_revision" ||
    data === "invalid_improvement_index"
  ) {
    return { status: data };
  }
  return {
    status: "save_failed",
    error: new Error("invalid_set_progress_response"),
  };
}

export type SaveLinkedinImprovementResult =
  | { status: "saved" }
  | { status: "invalid_request" }
  | { status: "not_found" }
  | { status: "stale_progress_revision" }
  | { status: "invalid_improvement_index" }
  | { status: "save_failed"; error: unknown };

export interface SaveLinkedinImprovementDependencies {
  /**
   * A implementação real é uma única RPC que bloqueia a análise, compara a
   * revisão e só então grava. Nunca decompor em SELECT + UPSERT no Node.
   */
  mutateAtomically: (
    value: LinkedinImprovementMutation,
  ) => Promise<LinkedinImprovementAtomicResult>;
}

/** Orquestra a mutação real; posse, revisão, índice e escrita ficam na RPC. */
export async function saveLinkedinImprovement(
  input: {
    userId: string;
    analysisId: string;
    index: number;
    done: unknown;
    revision: unknown;
  },
  dependencies: SaveLinkedinImprovementDependencies,
): Promise<SaveLinkedinImprovementResult> {
  if (
    !Number.isInteger(input.index) ||
    input.index < 0 ||
    typeof input.done !== "boolean" ||
    typeof input.revision !== "number" ||
    !Number.isSafeInteger(input.revision) ||
    input.revision < 1
  ) {
    return { status: "invalid_request" };
  }

  return dependencies.mutateAtomically({
    userId: input.userId,
    analysisId: input.analysisId,
    index: input.index,
    done: input.done,
    revision: input.revision,
  });
}

export type BeginLinkedinProgressSessionResult =
  | { status: "started"; revision: number }
  | { status: "not_found" }
  | { status: "start_failed"; error: unknown };

export interface BeginLinkedinProgressSessionDependencies {
  beginAtomically: () => Promise<BeginLinkedinProgressSessionResult>;
}

/** A revisão só é aceita quando a RPC devolve um inteiro positivo e seguro. */
export async function beginLinkedinProgressSession(
  dependencies: BeginLinkedinProgressSessionDependencies,
): Promise<BeginLinkedinProgressSessionResult> {
  const outcome = await dependencies.beginAtomically();
  if (
    outcome.status === "started" &&
    (!Number.isSafeInteger(outcome.revision) || outcome.revision < 1)
  ) {
    return {
      status: "start_failed",
      error: new Error("invalid_progress_revision"),
    };
  }
  return outcome;
}
