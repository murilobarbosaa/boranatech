import { apiUrl } from "./api";
import { supabase } from "./supabase";
import type {
  LinkedinAnalysisRecord,
  LinkedinAnalysisResponse,
  LinkedinAnalysisSummary,
  LinkedinAnalyzeRequest,
} from "@shared/linkedin/schema";
import { type LinkedinHeadlineOrigem } from "@shared/linkedin/schema";
import { readLinkedinAnalysisResponse } from "@shared/linkedin/readAnalysis";
import { readLinkedinScoreState } from "@shared/linkedin/readScore";
import { textoHashValido } from "@shared/linkedin/textoHash";
import { TETO_CLIENT_MS } from "@shared/linkedin/prazos";

/**
 * Cliente do analisador de LinkedIn, no mesmo estilo de githubClient.ts.
 * Erros viram códigos tratados pela UI.
 */

async function getAuthHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Resultado do analyze: a resposta completa mais o id da analise persistida
 * (null quando a persistencia best-effort falhou no server; o checklist de
 * melhorias aplicadas fica indisponivel nesse caso), como no githubClient.
 */
export interface AnalyzeLinkedinResult {
  data: LinkedinAnalysisResponse;
  analysisId: string | null;
  textoHash: string | null;
}

// TETO IMPORTADO, NUNCA LITERAL LOCAL. O literal que morava aqui dizia ter
// "folga sobre o pior caso do server (~90s)" e contava so a IA: com os cinco
// round-trips de banco, o pior caso real passava do teto e o aborto disparava
// ANTES de o servidor terminar, gerando "tente de novo" para uma analise que ja
// estava a caminho e seria cobrada. `TETO_CLIENT_MS` e derivado das parcelas em
// `shared/linkedin/prazos.ts`, e um teste trava que este arquivo nao volte a
// escrever numero proprio.

export async function analyzeLinkedin(
  payload: LinkedinAnalyzeRequest,
): Promise<AnalyzeLinkedinResult> {
  const authHeader = await getAuthHeader();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TETO_CLIENT_MS);

  let response: Response;
  try {
    response = await fetch(apiUrl("/api/linkedin/analyze"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    // Abort (timeout) e falha de rede crua (o TypeError "Failed to fetch") viram
    // codigos proprios; a string do browser nunca chega na UI.
    if (
      err &&
      typeof err === "object" &&
      (err as { name?: string }).name === "AbortError"
    ) {
      throw new Error("TIMEOUT");
    }
    throw new Error("NETWORK");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) throw new Error("LOGIN_REQUIRED");
  if (response.status === 403) throw new Error("PRO_REQUIRED");
  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `RATE_LIMITED: ${body.error?.message || "Limite atingido"}`,
    );
  }
  // 409 SO POR STATUS, sem ler o corpo, e isto foi medido antes de escrito.
  //
  // A rota `/analyze` nao devolve 409 em nenhum outro ramo: o unico outro 409 do
  // analisador e `stale_progress_revision`, e ele vive no endpoint de progresso
  // de melhorias, que tem cliente proprio (`setLinkedinImprovement`, que le o
  // codigo do corpo). Aqui o status sozinho ja e distintivo, e ler o corpo
  // acrescentaria um `await response.json()` num caminho de erro sem ganhar
  // distincao nenhuma. Se um dia a rota ganhar um SEGUNDO 409, esta linha passa
  // a precisar do codigo do corpo.
  if (response.status === 409) throw new Error("ANALISE_EM_ANDAMENTO");
  if (response.status === 503) throw new Error("LINKEDIN_BUSY");
  if (response.status === 422) throw new Error("UNREADABLE");
  if (response.status === 400) throw new Error("INVALID_REQUEST");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error?.message || "ANALYSIS_FAILED");
  }

  const body = (await response.json()) as Partial<{
    data: unknown;
    analysisId: string | null;
    textoHash: string | null;
  }>;
  const data = readLinkedinAnalysisResponse(body.data);
  if (!data) throw new Error("ANALYSIS_FAILED");
  return {
    data,
    analysisId: typeof body.analysisId === "string" ? body.analysisId : null,
    textoHash: textoHashValido(body.textoHash) ? body.textoHash : null,
  };
}

// Progresso das melhorias aplicadas (checklist vivo do resultado), espelho do
// githubClient. Sem custo de IA: e so estado do proprio dado.

function readErrorCode(body: unknown): string | null {
  if (body && typeof body === "object") {
    const rec = body as { error?: { code?: unknown } };
    if (typeof rec.error?.code === "string") return rec.error.code;
  }
  return null;
}

function readErrorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const rec = body as { error?: { message?: unknown } };
    if (typeof rec.error?.message === "string") return rec.error.message;
  }
  // TODO(Ana): mensagem generica de erro do progresso.
  return "Não foi possível completar agora. Tente novamente.";
}

/**
 * Progresso carregado. progressAvailable false = a feature esta indisponivel
 * (tabela ausente no banco), o que NAO e erro: a UI esconde o checklist e
 * mostra o aviso ameno, sem banner vermelho.
 */
export interface LinkedinImprovementsState {
  applied: number[];
  progressAvailable: boolean;
  /** Revisão monotônica criada pelo servidor nesta abertura. */
  revision: number | null;
}

export function sanitizeLinkedinImprovementIndexes(
  value: unknown,
  total = Number.MAX_SAFE_INTEGER,
): number[] {
  if (!Array.isArray(value) || !Number.isInteger(total) || total < 0) return [];
  return Array.from(
    new Set(
      value.filter(
        (index): index is number =>
          typeof index === "number" &&
          Number.isInteger(index) &&
          index >= 0 &&
          index < total,
      ),
    ),
  );
}

// Erro de PUT quando a feature esta indisponivel, distinto de falha de salvar.
export const PROGRESS_UNAVAILABLE = "PROGRESS_UNAVAILABLE";
export const STALE_PROGRESS_REVISION = "STALE_PROGRESS_REVISION";

export async function getLinkedinImprovements(
  analysisId: string,
  signal?: AbortSignal,
): Promise<LinkedinImprovementsState> {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    apiUrl(
      `/api/linkedin/analyses/${encodeURIComponent(analysisId)}/improvements`,
    ),
    { headers: authHeader, signal },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorMessage(body));
  }
  const payload = (await response.json()) as {
    applied?: number[];
    progressAvailable?: boolean;
    revision?: unknown;
  };
  const revision =
    typeof payload.revision === "number" &&
    Number.isSafeInteger(payload.revision) &&
    payload.revision >= 1
      ? payload.revision
      : null;
  return {
    applied: sanitizeLinkedinImprovementIndexes(payload.applied),
    // Sem revisão (servidor antigo) o checklist fica somente leitura/oculto:
    // aceitar PUT sem geração reintroduziria a race que este contrato fecha.
    progressAvailable: payload.progressAvailable !== false && revision !== null,
    revision,
  };
}

export async function setLinkedinImprovement(
  analysisId: string,
  index: number,
  done: boolean,
  revision: number,
  signal?: AbortSignal,
): Promise<void> {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    apiUrl(
      `/api/linkedin/analyses/${encodeURIComponent(analysisId)}/improvements/${index}`,
    ),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ done, revision }),
      signal,
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    if (readErrorCode(body) === "progress_unavailable") {
      throw new Error(PROGRESS_UNAVAILABLE);
    }
    if (readErrorCode(body) === "stale_progress_revision") {
      throw new Error(STALE_PROGRESS_REVISION);
    }
    throw new Error(readErrorMessage(body));
  }
}

export async function listLinkedinAnalyses(
  signal?: AbortSignal,
): Promise<LinkedinAnalysisSummary[]> {
  const authHeader = await getAuthHeader();
  const response = await fetch(apiUrl("/api/linkedin/analyses"), {
    headers: { ...authHeader },
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    throw new Error(readErrorMessage(body));
  }
  const body = (await response.json()) as Partial<{
    data: unknown;
  }>;
  if (!Array.isArray(body.data)) throw new Error("Histórico inválido.");
  const summaries = body.data
    .map(readAnalysisSummary)
    .filter((item): item is LinkedinAnalysisSummary => item !== null);
  // Uma resposta não vazia inteiramente ilegível é erro de contrato, não
  // "nenhum histórico". Se houver ao menos uma linha válida, preserva o que
  // ainda pode ser mostrado e descarta somente as corrompidas.
  if (body.data.length > 0 && summaries.length === 0) {
    throw new Error("Histórico inválido.");
  }
  return summaries;
}

export async function getLinkedinAnalysis(
  id: string,
): Promise<LinkedinAnalysisRecord | null> {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    apiUrl(`/api/linkedin/analyses/${encodeURIComponent(id)}`),
    {
      headers: { ...authHeader },
    },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as Partial<{
    data: unknown;
  }>;
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return null;
  }
  const raw = body.data as Record<string, unknown>;
  const summary = readAnalysisSummary(raw);
  const result = readLinkedinAnalysisResponse(raw.result);
  return summary && result ? { ...summary, result } : null;
}

function inteiroPositivoOuNull(value: unknown): number | null {
  const numero =
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof numero === "number" && Number.isInteger(numero) && numero > 0
    ? numero
    : null;
}

function stringOuNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function readAnalysisSummary(
  raw: unknown,
): LinkedinAnalysisSummary | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const scoreState = readLinkedinScoreState({
    score: value.score,
    faixa: value.faixa,
    deterministicVersion: inteiroPositivoOuNull(value.deterministicVersion),
    notaIncompleta: value.notaIncompleta,
  });
  if (
    typeof value.id !== "string" ||
    typeof value.area !== "string" ||
    typeof value.level !== "string" ||
    !scoreState.valid ||
    scoreState.score === null ||
    scoreState.faixa === null ||
    typeof value.created_at !== "string"
  ) {
    return null;
  }

  const checks = Array.isArray(value.checks)
    ? value.checks.flatMap((rawCheck) => {
        if (
          !rawCheck ||
          typeof rawCheck !== "object" ||
          Array.isArray(rawCheck)
        ) {
          return [];
        }
        const check = rawCheck as Record<string, unknown>;
        return typeof check.id === "string" &&
          typeof check.category === "string" &&
          typeof check.aprovado === "boolean"
          ? [
              {
                id: check.id,
                category: check.category,
                aprovado: check.aprovado,
              },
            ]
          : [];
      })
    : null;

  return {
    id: value.id,
    area: value.area,
    level: value.level,
    score: scoreState.score,
    faixa: scoreState.faixa,
    created_at: value.created_at,
    deterministicVersion: scoreState.deterministicVersion,
    qualitativeVersion: inteiroPositivoOuNull(value.qualitativeVersion),
    comparacaoVersion: inteiroPositivoOuNull(value.comparacaoVersion),
    mercado: stringOuNull(value.mercado),
    headlineComparacao: stringOuNull(value.headlineComparacao),
    headlineOrigem:
      value.headlineOrigem === "parser" || value.headlineOrigem === "manual"
        ? (value.headlineOrigem as LinkedinHeadlineOrigem)
        : null,
    skillsComparacao:
      typeof value.skillsComparacao === "string"
        ? value.skillsComparacao.trim()
        : null,
    foto: stringOuNull(value.foto),
    banner: stringOuNull(value.banner),
    openToWork: stringOuNull(value.openToWork),
    conexoes: stringOuNull(value.conexoes),
    atividade: stringOuNull(value.atividade),
    notaIncompleta: scoreState.notaIncompleta,
    checks,
    textoHash: textoHashValido(value.textoHash) ? value.textoHash : null,
  };
}
