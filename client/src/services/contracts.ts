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
  created_at: string;
  updated_at: string;
}

export interface ContentSourceStatus {
  source: string;
  status: "active" | "inactive" | "error" | "ready" | "connected";
  lastSyncLabel: string;
}
