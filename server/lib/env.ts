import { config } from "dotenv";

import type { PlanId } from "../../shared/planPricing";

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

warnIfMissing("AI_DAILY_LIMIT_FREE");
warnIfMissing("AI_DAILY_LIMIT_PRO");
warnIfMissing("AGENT_DAILY_LIMIT_FREE");
warnIfMissing("AGENT_DAILY_LIMIT_PRO");
warnIfMissing("CRON_SECRET");

export const env = {
  port: parseInt(process.env.PORT || "3100", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  supabaseUrl: requireEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]),
  supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY", ["VITE_SUPABASE_ANON_KEY"]),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  appPublicUrl: requireEnvWithDefault(
    "APP_PUBLIC_URL",
    "http://localhost:3000",
  ),
  corsOrigin: requireEnvWithDefault("CORS_ORIGIN", "http://localhost:5173"),
  // Segredos Stripe: SO no backend (Railway), nunca com prefixo VITE_. Com
  // BILLING_ENABLED ligado, o boot aborta se faltar qualquer um deles (a
  // verificacao fail-closed roda abaixo do objeto env).
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  // Allowlist de price por plano. O cliente manda PlanId; o servidor resolve o
  // price_id daqui. NUNCA aceitar price_id arbitrario do cliente. price_ids de
  // sandbox e producao sao diferentes, por isso vem de env e nao do banco.
  stripePriceIds: {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    pro_semiannual: process.env.STRIPE_PRICE_PRO_SEMIANNUAL || "",
    pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  } as Record<PlanId, string>,
  // Kill-switch do pagamento. FAIL-CLOSED: so a string exata "true" liga; ausente,
  // vazia ou qualquer outro valor deixa o checkout desligado (default off). Com
  // ele ligado, o boot exige as credenciais Stripe (verificacao abaixo do objeto
  // env): a vitrine do Pro segue visivel, mas billing so liga com tudo pronto.
  billingEnabled: (() => {
    const raw = process.env.BILLING_ENABLED;
    if (!raw) return false; // ausente: billing off, esperado em dev, sem alarde.
    if (raw === "true") {
      console.log("[env] billing LIGADO (BILLING_ENABLED=true).");
      return true;
    }
    console.warn(
      `[env] AVISO: BILLING_ENABLED="${raw}" nao liga o billing. Apenas o literal exato "true" liga (sem aspas, sem espaco, case-sensitive); billing DESLIGADO.`,
    );
    return false;
  })(),
  aiDailyLimitFree: parseInt(process.env.AI_DAILY_LIMIT_FREE || "5", 10),
  aiDailyLimitPro: parseInt(process.env.AI_DAILY_LIMIT_PRO || "50", 10),
  // Teto diario do agente conversacional, separado das ferramentas de IA para o
  // chat nao consumir a quota das tools e vice-versa. Defaults ajustaveis.
  // TODO: calibrar AGENT_DAILY_LIMIT_FREE e AGENT_DAILY_LIMIT_PRO.
  agentDailyLimitFree: parseInt(process.env.AGENT_DAILY_LIMIT_FREE || "20", 10),
  agentDailyLimitPro: parseInt(process.env.AGENT_DAILY_LIMIT_PRO || "200", 10),
  // Teto diario de turnos da entrevista simulada. Sem variante free: a feature
  // e Pro-only e o gate barra antes de qualquer chamada.
  // TODO: calibrar INTERVIEW_DAILY_TURN_LIMIT_PRO.
  interviewDailyTurnLimitPro: parseInt(
    process.env.INTERVIEW_DAILY_TURN_LIMIT_PRO || "150",
    10,
  ),
  // Voz do Natechinho nas entrevistas (E5). Chave e voice id OPCIONAIS no
  // padrao currentsApiKey: vazios desligam a feature (a rota de fala responde
  // 503 tts_unavailable e nada mais quebra).
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || "",
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "",
  elevenLabsModelId:
    process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
  // Teto diario de geracoes de fala da entrevista.
  // TODO: calibrar INTERVIEW_TTS_DAILY_LIMIT_PRO.
  interviewTtsDailyLimitPro: parseInt(
    process.env.INTERVIEW_TTS_DAILY_LIMIT_PRO || "200",
    10,
  ),
  // Teto diario proprio do chat de intake do plano de carreira, separado da
  // quota global das ferramentas (padrao agent-chat/interview-turn). Pro-only:
  // o gate barra antes de qualquer chamada.
  // TODO: calibrar CAREER_PLAN_CHAT_DAILY_LIMIT_PRO.
  careerPlanChatDailyLimitPro: parseInt(
    process.env.CAREER_PLAN_CHAT_DAILY_LIMIT_PRO || "60",
    10,
  ),
  // Teto diario proprio do chat de intake do roadmap com IA, separado da quota
  // global das ferramentas (padrao career-plan-chat). Pro-only: o gate barra
  // antes de qualquer chamada. Conversar tem quota propria para nao consumir o
  // orcamento de geracao (roadmap-generator).
  // TODO: calibrar ROADMAP_INTAKE_CHAT_DAILY_LIMIT_PRO.
  roadmapIntakeChatDailyLimitPro: parseInt(
    process.env.ROADMAP_INTAKE_CHAT_DAILY_LIMIT_PRO || "60",
    10,
  ),
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
  // Vagas multi-fonte (fase 2). Opcionais no padrao currentsApiKey: vazias
  // desligam a fonte com warn no sync, nada mais quebra.
  adzunaAppId: process.env.ADZUNA_APP_ID || "",
  adzunaAppKey: process.env.ADZUNA_APP_KEY || "",
  // Token de leitura dos repos de vagas do GitHub. Precedencia: a env
  // dedicada GITHUB_VAGAS_TOKEN ganha; sem ela, reusa o GITHUB_TOKEN do
  // avaliador de GitHub (leitura publica, qualquer token serve); sem nenhum,
  // o adapter roda sem auth em modo reduzido (1 pagina) com warn.
  githubVagasToken:
    process.env.GITHUB_VAGAS_TOKEN || process.env.GITHUB_TOKEN || "",
  posthogApiKey: process.env.POSTHOG_API_KEY || "",
  posthogProjectId: process.env.POSTHOG_PROJECT_ID || "",
  // Host da API do PostHog (regiao). NUNCA hardcodar a regiao no codigo: projeto
  // na UE usa eu.posthog.com. Default US preserva o comportamento atual.
  posthogHost: process.env.POSTHOG_HOST || "https://us.posthog.com",
  resendApiKey: process.env.RESEND_API_KEY || "",
  redisUrl: process.env.REDIS_URL || "",
  // DSN do Sentry (server). Ausente: Sentry desativado, no-op total.
  sentryDsn: process.env.SENTRY_DSN || "",
  // API REST do Sentry (leitura de issues na aba Bugs & Erros do admin).
  // Qualquer uma das tres ausente desativa a integracao: o endpoint responde
  // 503 sentry_not_configured, nada mais quebra.
  sentryAuthToken: process.env.SENTRY_AUTH_TOKEN || "",
  sentryOrgSlug: process.env.SENTRY_ORG_SLUG || "",
  sentryProjectSlug: process.env.SENTRY_PROJECT_SLUG || "",
  // Destinos das notificacoes do bug tracker do admin. Vazios: o envio vira
  // no-op com log, no padrao resendApiKey.
  bugNotifyNewEmail: process.env.BUG_NOTIFY_NEW_EMAIL || "",
  bugNotifyDoneEmail: process.env.BUG_NOTIFY_DONE_EMAIL || "",
  // Teto do rate limit por IP por minuto. Existe SOMENTE para staging/teste
  // de carga (k6): producao NAO deve setar esta variavel (default 180).
  // Invalido (nao inteiro ou < 1) cai no default com warn no boot.
  rateLimitMaxRequests: (() => {
    const raw = process.env.RATE_LIMIT_MAX_REQUESTS;
    if (!raw) return 180;
    const parsed = parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed >= 1) return parsed;
    console.warn(
      `[env] AVISO: RATE_LIMIT_MAX_REQUESTS invalido ("${raw}"), usando 180`,
    );
    return 180;
  })(),
  cronSecret: process.env.CRON_SECRET || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  // Portao de lancamento. "gated" mantem o portao fechado; "open" libera geral.
  waitlistMode: (process.env.WAITLIST_MODE || "gated") as "open" | "gated",
  // DEPRECATED: codigo unico de acesso beta em env. Substituido por codigos por
  // pessoa em public.beta_access_codes (POST /api/beta/unlock consulta a tabela).
  // Mantido sem uso para nao quebrar ambientes que ainda setem a env; remover
  // depois que todos os deploys estiverem sem WAITLIST_ACCESS_CODE.
  waitlistAccessCode: process.env.WAITLIST_ACCESS_CODE || "",
  // Secret HMAC do token de beta. Ausente: o portao nao emite token, sem crashar.
  waitlistTokenSecret: process.env.WAITLIST_TOKEN_SECRET || "",
  // Captura de newsletter. "off" mantem a captura desligada; "on" libera.
  newsletterCaptureMode: (process.env.NEWSLETTER_CAPTURE_MODE || "off") as
    | "on"
    | "off",
  // Secret HMAC dos tokens de newsletter (confirmacao/descadastro). Ausente: deny.
  newsletterTokenSecret: process.env.NEWSLETTER_TOKEN_SECRET || "",
  // Secret HMAC do token de renovacao de boleto (link one-click no e-mail de
  // lembrete). Ausente: o endpoint de renovacao nega, sem crashar.
  renewalTokenSecret: process.env.RENEWAL_TOKEN_SECRET || "",
  // Base URL absoluta do BACKEND para montar os links de confirm/unsubscribe nos
  // e-mails (ex.: https://api.boranatech.com.br). Vazia = captura fechada (nao da
  // pra montar link valido). Nao reutiliza appPublicUrl, que aponta pro frontend.
  // Reutilizada tambem pelo link de descadastro das campanhas de e-mail.
  newsletterPublicBaseUrl: process.env.NEWSLETTER_PUBLIC_BASE_URL || "",
  // Intervalo minimo (ms) entre jobs da fila email-campaign (limiter do BullMQ):
  // o Resend limita a 2 req/s, entao o default de 1 envio por 1000ms fica com
  // folga. Invalido (nao inteiro ou < 100) cai no default com warn no boot.
  emailCampaignRateMs: (() => {
    const raw = process.env.EMAIL_CAMPAIGN_RATE_MS;
    if (!raw) return 1000;
    const parsed = parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed >= 100) return parsed;
    console.warn(
      `[env] AVISO: EMAIL_CAMPAIGN_RATE_MS invalido ("${raw}"), usando 1000`,
    );
    return 1000;
  })(),
  // Intervalo minimo (ms) entre jobs da fila emails (transacionais) no limiter do
  // BullMQ. O Resend limita a 2 req/s e a fila email-campaign ja reserva ~1 req/s
  // (EMAIL_CAMPAIGN_RATE_MS), entao o default de 1 envio por 1000ms mantem o total
  // dentro do teto. Invalido (nao inteiro ou < 100) cai no default com warn no boot.
  transactionalEmailRateMs: (() => {
    const raw = process.env.TRANSACTIONAL_EMAIL_RATE_MS;
    if (!raw) return 1000;
    const parsed = parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed >= 100) return parsed;
    console.warn(
      `[env] AVISO: TRANSACTIONAL_EMAIL_RATE_MS invalido ("${raw}"), usando 1000`,
    );
    return 1000;
  })(),
  // Allowlist dev-only de user ids que enxergam como Pro fora de producao.
  // Ignorada quando NODE_ENV === "production". Nunca prefixar com VITE_.
  devProUserIds: (process.env.DEV_PRO_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
};

// Fail-closed comercial: com o billing LIGADO, faltar qualquer credencial Stripe
// resulta num site que aparenta vender e nao consegue. Entao o processo NAO sobe:
// loga exatamente o que falta e aborta. Com billing desligado, nao ha o que exigir
// (o checkout ja responde 503 billing_disabled).
if (env.billingEnabled) {
  const missingStripe: string[] = [];
  if (!env.stripeSecretKey) missingStripe.push("STRIPE_SECRET_KEY");
  if (!env.stripeWebhookSecret) missingStripe.push("STRIPE_WEBHOOK_SECRET");
  if (!env.stripePriceIds.pro_monthly)
    missingStripe.push("STRIPE_PRICE_PRO_MONTHLY");
  if (!env.stripePriceIds.pro_semiannual)
    missingStripe.push("STRIPE_PRICE_PRO_SEMIANNUAL");
  if (!env.stripePriceIds.pro_annual)
    missingStripe.push("STRIPE_PRICE_PRO_ANNUAL");
  if (missingStripe.length > 0) {
    console.error(
      `[env] ERRO FATAL: BILLING_ENABLED=true mas faltam credenciais Stripe: ${missingStripe.join(", ")}. Configure todas ou desligue BILLING_ENABLED.`,
    );
    process.exit(1);
  }
  console.log("[env] Stripe: credenciais completas, billing pronto.");
}
