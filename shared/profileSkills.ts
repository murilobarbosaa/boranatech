export const SKILL_KINDS = ["tecnologia", "area"] as const;
export type SkillKind = (typeof SKILL_KINDS)[number];

export const SKILL_LEVELS = ["aprendendo", "uso", "domino"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const MAX_PROFILE_SKILLS = 50;

export interface ProfileSkill {
  kind: SkillKind;
  slug: string;
  label: string;
  level: SkillLevel;
}

export interface SkillsUpdatePayload {
  skills: ProfileSkill[];
}

export interface ExpandedProfileFields {
  headline: string | null;
  bio: string | null;
  city: string | null;
  uf: string | null;
  career_goal: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}
