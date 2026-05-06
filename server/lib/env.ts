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
      console.error(`[env] ERRO FATAL: variável ${key} não definida em produção`);
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
warnIfMissing("ASAAS_WEBHOOK_SECRET");
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
  appPublicUrl: requireEnvWithDefault("APP_PUBLIC_URL", "http://localhost:3000"),
  corsOrigin: requireEnvWithDefault("CORS_ORIGIN", "http://localhost:5173"),
  asaasApiKey: requireEnv("ASAAS_API_KEY"),
  asaasWebhookSecret: requireEnv("ASAAS_WEBHOOK_SECRET"),
  asaasEnv: (process.env.ASAAS_ENV || "sandbox") as "sandbox" | "production",
  aiDailyLimitFree: parseInt(process.env.AI_DAILY_LIMIT_FREE || "5", 10),
  aiDailyLimitPro: parseInt(process.env.AI_DAILY_LIMIT_PRO || "50", 10),
  currentsApiKey: process.env.CURRENTS_API_KEY || "",
  joobleApiKey: process.env.JOOBLE_API_KEY || "",
  symplaApiKey: process.env.SYMPLA_API_KEY || "",
  posthogApiKey: process.env.POSTHOG_API_KEY || "",
  posthogProjectId: process.env.POSTHOG_PROJECT_ID || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  redisUrl: process.env.REDIS_URL || "",
  cronSecret: process.env.CRON_SECRET || "",
};
