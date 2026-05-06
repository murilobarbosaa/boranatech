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
  bio: string | null;
  area_interesse: string | null;
  nivel_atual: string | null;
  objetivo: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentSourceStatus {
  source: string;
  status: "active" | "inactive" | "error" | "ready" | "connected";
  lastSyncLabel: string;
}
