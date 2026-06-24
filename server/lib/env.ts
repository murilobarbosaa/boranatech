import { config } from "dotenv";

config({ quiet: true });

function readEnv(key: string, fallbackKeys: string[] = []): string | undefined {
  for (const candidate of [key, ...fallbackKeys]) {
    const value = process.env[candidate];
    if (value) return value;
  }

  return undefined;
}

function requireEnv(key: string, fallbackKeys: string[] = []): string {
  const value = readEnv(key, fallbackKeys);

  if (!value) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[env] ERRO FATAL: variável ${key} não definida em produção`,
      );
      process.exit(1);
    }

    return "";
  }

  return value;
}

function requireEnvWithDefault(key: string, defaultValue: string): string {
  const value = process.env[key];

  if (!value && process.env.NODE_ENV === "production") {
    console.error(`[env] ERRO FATAL: variável ${key} não definida em produção`);
    process.exit(1);
  }

  return value || defaultValue;
}

function warnIfMissing(key: string, fallbackKeys: string[] = []) {
  if (process.env.NODE_ENV === "production" && !readEnv(key, fallbackKeys)) {
    console.warn(`[env] AVISO: variável ${key} não definida`);
  }
}

warnIfMissing("ASAAS_API_KEY");
warnIfMissing("ASAAS_WEBHOOK_TOKEN");
warnIfMissing("AI_DAILY_LIMIT_FREE");
warnIfMissing("AI_DAILY_LIMIT_PRO");
warnIfMissing("CRON_SECRET");

export const env = {
  port: parseInt(process.env.PORT || "3100", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  supabaseUrl: requireEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]),
  supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY", ["VITE_SUPABASE_ANON_KEY"]),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseJwtSecret: requireEnv("SUPABASE_JWT_SECRET"),
  appPublicUrl: requireEnvWithDefault(
    "APP_PUBLIC_URL",
    "http://localhost:3000",
  ),
  corsOrigin: requireEnvWithDefault("CORS_ORIGIN", "http://localhost:5173"),
  asaasApiKey: requireEnv("ASAAS_API_KEY"),
  asaasWebhookToken: requireEnv("ASAAS_WEBHOOK_TOKEN"),
  asaasEnv: (process.env.ASAAS_ENV || "sandbox") as "sandbox" | "production",
  aiDailyLimitFree: parseInt(process.env.AI_DAILY_LIMIT_FREE || "5", 10),
  aiDailyLimitPro: parseInt(process.env.AI_DAILY_LIMIT_PRO || "50", 10),
  avatarReportHideThreshold: (() => {
    const raw = parseInt(process.env.AVATAR_REPORT_HIDE_THRESHOLD || "", 10);
    return Number.isInteger(raw) && raw > 0 ? raw : 3;
  })(),
  avatarModerationScoreThreshold: (() => {
    const raw = parseFloat(process.env.AVATAR_MODERATION_SCORE_THRESHOLD || "");
    return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 0.5;
  })(),
  currentsApiKey: process.env.CURRENTS_API_KEY || "",
  joobleApiKey: process.env.JOOBLE_API_KEY || "",
  posthogApiKey: process.env.POSTHOG_API_KEY || "",
  posthogProjectId: process.env.POSTHOG_PROJECT_ID || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  redisUrl: process.env.REDIS_URL || "",
  cronSecret: process.env.CRON_SECRET || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  // Portao de lancamento. "gated" mantem o portao fechado; "open" libera geral.
  waitlistMode: (process.env.WAITLIST_MODE || "gated") as "open" | "gated",
  // Codigo de acesso beta. Ausente: unlock sempre 401 (fail-closed).
  waitlistAccessCode: process.env.WAITLIST_ACCESS_CODE || "",
  // Secret HMAC do token de beta. Ausente: o portao nao emite token, sem crashar.
  waitlistTokenSecret: process.env.WAITLIST_TOKEN_SECRET || "",
  // Allowlist dev-only de user ids que enxergam como Pro fora de producao.
  // Ignorada quando NODE_ENV === "production". Nunca prefixar com VITE_.
  devProUserIds: (process.env.DEV_PRO_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
};
