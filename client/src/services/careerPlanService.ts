import { apiUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

// Cliente das rotas /api/career-plan. Molde do interviewService: Bearer do
// Supabase, status HTTP traduzido em erro tipado que a UI distingue.

export type CareerPlanBudget = "zero" | "ate_500" | "ate_2000" | "acima_2000";
export type CareerPlanStatus = "active" | "archived";

export interface CareerPlanIntake {
  goal: string;
  area: string;
  level: string;
  hoursPerWeek: number;
  horizonMonths: number;
  budget: CareerPlanBudget;
}

export interface CareerPlanStepItem {
  label: string;
  catalogId: string | null;
}

export interface CareerPlanStep {
  id: string;
  title: string;
  rationale: string;
  items: CareerPlanStepItem[];
  estimatedWeeks: number;
}

export interface CareerPlanCertification {
  catalogId: string;
  whenLabel: string;
  optional: boolean;
  rationale: string;
}

export interface CareerPlanScheduleBlock {
  monthsLabel: string;
  focus: string;
}

export interface CareerPlanOutOfScope {
  label: string;
  reason: string;
}

export interface CareerPlanChecklistItem {
  itemId: string;
  label: string;
  kind: "step_item" | "certification";
  stepId?: string;
}

export interface CareerPlanResult {
  objectiveLogic: string;
  steps: CareerPlanStep[];
  certifications: CareerPlanCertification[];
  schedule: CareerPlanScheduleBlock[];
  outOfScope: CareerPlanOutOfScope[];
  checklist: CareerPlanChecklistItem[];
}

export interface CareerPlanSummary {
  id: string;
  status: CareerPlanStatus;
  created_at: string;
  area: string | null;
  goal: string | null;
  checklistTotal: number;
}

export interface CareerPlanDetail {
  id: string;
  status: CareerPlanStatus;
  intake: CareerPlanIntake;
  result: CareerPlanResult;
  catalog_version: string;
  created_at: string;
  updated_at: string;
}

export interface CareerPlanContext {
  careerGoal: string | null;
  area: string | null;
  level: string | null;
  weeklyMinutes30d: number | null;
}

export interface FxRate {
  usdBrl: number;
  // Data da cotacao PTAX usada, AAAA-MM-DD.
  quoteDate: string;
}

export type CareerPlanErrorCode =
  | "login_required"
  | "not_pro"
  | "not_found"
  | "rate_limited"
  | "rate_check_failed"
  | "unavailable";

export class CareerPlanApiError extends Error {
  readonly code: CareerPlanErrorCode;

  constructor(code: CareerPlanErrorCode, message: string) {
    super(message);
    this.name = "CareerPlanApiError";
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function readBody(response: Response): Promise<ApiErrorBody> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return {};
  }
}

function toApiError(status: number, body: ApiErrorBody): CareerPlanApiError {
  const serverMessage = body.error?.message ?? "";
  if (status === 401) {
    return new CareerPlanApiError(
      "login_required",
      "Faca login pra continuar.",
    );
  }
  if (status === 403) {
    return new CareerPlanApiError(
      "not_pro",
      serverMessage || "Recurso do Plano Pro.",
    );
  }
  if (status === 404) {
    return new CareerPlanApiError(
      "not_found",
      serverMessage || "Plano nao encontrado.",
    );
  }
  if (status === 429) {
    return new CareerPlanApiError(
      "rate_limited",
      serverMessage || "Limite diario atingido. Tente novamente amanha.",
    );
  }
  if (status === 503) {
    return new CareerPlanApiError(
      "rate_check_failed",
      serverMessage ||
        "Nao foi possivel verificar seu limite agora. Tente de novo.",
    );
  }
  return new CareerPlanApiError(
    "unavailable",
    serverMessage || "Nao foi possivel completar agora. Tente de novo.",
  );
}

async function request(path: string, options?: RequestInit): Promise<Response> {
  const header = await authHeader();
  return fetch(apiUrl(`/api/career-plan${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...header,
      ...(options?.headers || {}),
    },
  });
}

export async function getContext(): Promise<CareerPlanContext> {
  const response = await request("/context");
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
  const body = (await response.json()) as { data?: CareerPlanContext };
  if (!body.data || typeof body.data !== "object") {
    throw new CareerPlanApiError(
      "unavailable",
      "Resposta inesperada ao carregar o contexto.",
    );
  }
  return body.data;
}

export async function generatePlan(intake: CareerPlanIntake): Promise<string> {
  const response = await request("/generate", {
    method: "POST",
    body: JSON.stringify(intake),
  });
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
  const body = (await response.json()) as { data?: { planId?: string } };
  if (!body.data?.planId) {
    throw new CareerPlanApiError(
      "unavailable",
      "Resposta inesperada ao gerar o plano.",
    );
  }
  return body.data.planId;
}

export async function listPlans(): Promise<CareerPlanSummary[]> {
  const response = await request("/plans");
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
  const body = (await response.json()) as { data?: unknown };
  return Array.isArray(body.data) ? (body.data as CareerPlanSummary[]) : [];
}

// Cotacao PTAX para o total em reais. 204 (cotacao indisponivel) e qualquer
// erro viram null: a UI trata a ausencia em silencio, nunca quebra por
// cambio. NAO entra no sessionStorage (o cache de verdade vive no server).
export async function getFxRate(): Promise<FxRate | null> {
  try {
    const response = await request("/fx");
    if (response.status !== 200) return null;
    const body = (await response.json()) as {
      usdBrl?: unknown;
      quoteDate?: unknown;
    };
    if (typeof body.usdBrl !== "number" || typeof body.quoteDate !== "string") {
      return null;
    }
    return { usdBrl: body.usdBrl, quoteDate: body.quoteDate };
  } catch {
    return null;
  }
}

export async function getPlan(planId: string): Promise<CareerPlanDetail> {
  const response = await request(`/plans/${encodeURIComponent(planId)}`);
  if (!response.ok) {
    throw toApiError(response.status, await readBody(response));
  }
  const body = (await response.json()) as { data?: CareerPlanDetail };
  if (!body.data || typeof body.data !== "object") {
    throw new CareerPlanApiError(
      "unavailable",
      "Resposta inesperada ao buscar o plano.",
    );
  }
  return body.data;
}
