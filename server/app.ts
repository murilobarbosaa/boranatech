import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./lib/env";
import { redisConnection } from "./lib/queue";
import { supabaseAdmin } from "./lib/supabaseAdmin";
import { validateSupabaseJwt } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import adminRouter from "./routes/admin";
import agentRouter from "./routes/agent";
import agentHistoryRouter from "./routes/agentHistory";
import aiRouter from "./routes/ai";
import aiRoadmapRouter from "./routes/aiRoadmap";
import affiliatesRouter from "./routes/affiliates";
import avatarsRouter from "./routes/avatars";
import badgesRouter from "./routes/badges";
import billingRouter from "./routes/billing";
import bookmarksRouter from "./routes/bookmarks";
import contentRouter from "./routes/content";
import cronRouter from "./routes/cron";
import githubRouter from "./routes/github";
import linkedinRouter from "./routes/linkedin";
import meAvatarRouter from "./routes/meAvatar";
import meRouter from "./routes/me";
import newsletterRouter from "./routes/newsletter";
import profilesRouter from "./routes/profiles";
import progressRouter from "./routes/progress";
import quizRouter from "./routes/quiz";
import searchRouter from "./routes/search";
import statsRouter from "./routes/stats";
import studyRouter from "./routes/study";
import waitlistRouter from "./routes/waitlist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 180;
// Teto de seguranca pro numero de chaves vivas no store em memoria.
const RATE_LIMIT_MAX_ENTRIES = 50_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Remove entradas expiradas pra o store nao crescer indefinidamente: sem isso,
// uma chave por IP que nunca mais volta ficaria pra sempre (vazamento). Roda
// periodicamente (unref pra nao segurar o processo) e tambem sob demanda
// quando o store passa do teto.
function sweepRateLimitStore(now: number) {
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}

setInterval(() => sweepRateLimitStore(Date.now()), RATE_LIMIT_WINDOW_MS).unref();

function isRateLimitExempt(pathname: string) {
  return (
    pathname === "/api/health" || pathname.startsWith("/api/billing/webhook")
  );
}

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' https://us-assets.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https:",
  [
    "connect-src 'self'",
    "https://api.boranatech.com.br",
    "https://vlcvaanlkqyxemrxsxzn.supabase.co",
    "wss://vlcvaanlkqyxemrxsxzn.supabase.co",
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
  ].join(" "),
  // 'self' necessario pro iframe da landing de lancamento (client/public/lancamento.html).
  // Nao remover sem migrar a landing pra fora de iframe.
  "frame-src 'self' https://www.youtube-nocookie.com",
].join("; ");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.setHeader("Content-Security-Policy-Report-Only", CSP_REPORT_ONLY);
  next();
});

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(
      JSON.stringify({
        level:
          res.statusCode >= 500
            ? "error"
            : res.statusCode >= 400
              ? "warn"
              : "info",
        msg: "http_request",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration_ms: Date.now() - startedAt,
        ip: req.ip,
      }),
    );
  });
  next();
});

app.use((req, res, next) => {
  if (!req.path.startsWith("/api") || isRateLimitExempt(req.path)) {
    return next();
  }

  const now = Date.now();
  const key = req.ip || "unknown";
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
      sweepRateLimitStore(now);
    }
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader(
      "Retry-After",
      String(Math.ceil((current.resetAt - now) / 1000)),
    );
    return res.status(429).json({
      error: {
        code: "rate_limited",
        message: "Muitas requisições. Tente novamente em instantes.",
      },
    });
  }

  next();
});

const allowedOrigins = env.corsOrigin.split(",").map((origin) => origin.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use("/api/billing/webhook", express.raw({ type: "application/json" }));

app.use("/api/billing/webhook", (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as typeof req & { rawBody?: Buffer }).rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
  }

  next();
});

// Upload de avatar envia imagem base64 (pode passar de 2mb). Parser dedicado ANTES
// do json global; requisicoes ja parseadas (req._body) sao ignoradas pelo global.
app.use("/api/me/avatar", express.json({ limit: "10mb" }));

app.use(express.json({ limit: "2mb" }));

app.use("/api/affiliates", affiliatesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/newsletter", newsletterRouter);

app.use("/api", validateSupabaseJwt);

app.use("/api/ai", aiRouter);
app.use("/api/roadmaps-ia", aiRoadmapRouter);
// agentHistoryRouter ANTES de agentRouter (path mais especifico) para ter sua
// propria cadeia de middleware sem reexecutar a do agentRouter. Nao reordenar.
app.use("/api/agent/conversations", agentHistoryRouter);
app.use("/api/agent", agentRouter);
app.use("/api/github", githubRouter);
app.use("/api/linkedin", linkedinRouter);
app.use("/api/me/avatar", meAvatarRouter);
app.use("/api/me", meRouter);
app.use("/api/avatars", avatarsRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/billing", billingRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/progress", progressRouter);
app.use("/api/study", studyRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/search", searchRouter);
app.use("/api/admin", adminRouter);
app.use("/api/content", contentRouter);
app.use("/api/cron", cronRouter);

app.get("/api/health", async (_req, res) => {
  const checks: Record<string, "ok" | "error"> = {};
  const startTime = Date.now();

  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  checks.openai = env.openaiApiKey ? "ok" : "error";
  checks.currents = env.currentsApiKey ? "ok" : "error";
  checks.jooble = env.joobleApiKey ? "ok" : "error";
  if (redisConnection) {
    try {
      await redisConnection.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }
  } else {
    checks.redis = "error";
  }

  const status = checks.database === "ok" ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    env: env.nodeEnv,
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    checks,
    ts: new Date().toISOString(),
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({
    error: {
      code: "not_found",
      message: "Rota de API não encontrada.",
    },
  });
});

const staticPath = env.isProd
  ? path.resolve(__dirname, "public")
  : path.resolve(__dirname, "..", "dist", "public");

app.use(express.static(staticPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

app.use(errorHandler);

export default app;
