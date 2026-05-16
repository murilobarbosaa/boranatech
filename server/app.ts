import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./lib/env";
import { redisConnection } from "./lib/queue";
import { supabaseAdmin } from "./lib/supabaseAdmin";
import { validateSupabaseJwt } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import adminRouter from "./routes/admin";
import aiRouter from "./routes/ai";
import affiliatesRouter from "./routes/affiliates";
import badgesRouter from "./routes/badges";
import billingRouter from "./routes/billing";
import bookmarksRouter from "./routes/bookmarks";
import contentRouter from "./routes/content";
import cronRouter from "./routes/cron";
import meRouter from "./routes/me";
import quizRouter from "./routes/quiz";
import searchRouter from "./routes/search";
import sitemapRouter from "./routes/sitemap";
import studyRouter from "./routes/study";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 180;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimitExempt(pathname: string) {
  return pathname === "/api/health" || pathname.startsWith("/api/billing/webhook");
}

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(
      JSON.stringify({
        level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
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
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

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

app.use(express.json({ limit: "2mb" }));

app.use(sitemapRouter);
app.use("/api/affiliates", affiliatesRouter);

app.use("/api", validateSupabaseJwt);

app.use("/api/ai", aiRouter);
app.use("/api/me", meRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/billing", billingRouter);
app.use("/api/bookmarks", bookmarksRouter);
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
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  checks.openai = env.openaiApiKey ? "ok" : "error";
  checks.currents = env.currentsApiKey ? "ok" : "error";
  checks.jooble = env.joobleApiKey ? "ok" : "error";
  checks.sympla = env.symplaApiKey ? "ok" : "error";
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

const staticPath = env.isProd ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");

app.use(express.static(staticPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

app.use(errorHandler);

export default app;
