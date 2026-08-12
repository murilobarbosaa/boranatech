import type { Gender } from "@shared/gender";

export interface CareerQuizAnswer {
  questionId: string;
  area: string;
}

export interface CareerQuizResult {
  area: string;
  confidence: number;
  reason: string;
  nextSteps: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  handle: string;
}

export interface ProfileSnapshot {
  trails: string[];
  roadmaps: string[];
  savedCourses: string[];
  savedProjects: string[];
  favoriteJobs: string[];
  communities: string[];
}

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  handle: string | null;
  avatar_url: string | null;
  avatar_border: string | null;
  avatar_icon: string | null;
  avatar_bg: string | null;
  avatar_mode: "icon" | "photo";
  avatar_moderation_status: "clean" | "pending_review" | "removed";
  avatar_upload_disabled: boolean;
  avatar_storage_path: string | null;
  bio: string | null;
  area_interesse: string | null;
  nivel_atual: string | null;
  objetivo: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  preferences: Record<string, unknown>;
  gender: Gender | null;
  // Perfil expandido (colunas ja retornadas por /api/me; opcionais aqui
  // porque nem todo caller depende delas).
  career_goal?: string | null;
  // Consentimento de comunicacao promocional (carimbo gravado pelo server).
  marketing_opt_in?: boolean;
  marketing_opt_in_at?: string | null;
  // Identidade fiscal (Fase 2 da NFS-e). Todos opcionais: a coleta e posterior
  // ao cadastro e a maioria das contas nao tem nenhum deles preenchido.
  // full_name e cpf ja existiam no banco desde o certificado; entram aqui
  // porque a modal fiscal e o banner precisam le-los.
  full_name?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  razao_social?: string | null;
  fiscal_documento_preferencia?: "cpf" | "cnpj" | null;
  endereco_cep?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_codigo_municipio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentSourceStatus {
  source: string;
  status: "active" | "inactive" | "error" | "ready" | "connected";
  lastSyncLabel: string;
}
