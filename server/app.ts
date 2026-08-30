import * as Sentry from "@sentry/node";
import compression from "compression";
import crypto from "crypto";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { commitShaAtual } from "./lib/commitSha";
import { env } from "./lib/env";
import { falhaOpenAiNaCadeia } from "./lib/openaiFailure";
import { isRateLimitExempt } from "./lib/rateLimitExempt";
import {
  alvoAnonimo,
  chaveDeIp,
  FATOR_TETO_IP,
  identidadeDeCota,
} from "./lib/rateLimitKey";
import { avisarRateLimitSemRedis } from "./lib/rateLimitSemRedis";
import { cacheConnection } from "./lib/redis";
import { supabaseAdmin } from "./lib/supabaseAdmin";
import { validateSupabaseJwt } from "./middleware/auth";
import { bodyParseContext, errorHandler } from "./middleware/error";
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
import careerPlanRouter from "./routes/careerPlan";
import certificatesRouter, {
  publicCertificatesRouter,
} from "./routes/certificates";
import consentRouter from "./routes/consent";
import contentRouter from "./routes/content";
import couponsRouter from "./routes/coupons";
import cronRouter from "./routes/cron";
import faculdadesRouter from "./routes/faculdades";
import githubRouter from "./routes/github";
import interviewRouter from "./routes/interview";
import launchStateRouter, { betaRouter } from "./routes/launchState";
import linkedinRouter from "./routes/linkedin";
import meAvatarRouter from "./routes/meAvatar";
import meRouter from "./routes/me";
import newsletterRouter from "./routes/newsletter";
import notificationsRouter, { superRouter } from "./routes/notifications";
import profilesRouter from "./routes/profiles";
import progressRouter from "./routes/progress";
import projectValidationsRouter from "./routes/projectValidations";
import quizRouter from "./routes/quiz";
import roadmapCompletionsRouter from "./routes/roadmapCompletions";
import roadmapQuizRouter from "./routes/roadmapQuiz";
import resendWebhookRouter from "./routes/resendWebhook";
import resumeAnalysisRouter from "./routes/resumeAnalysis";
import resumesRouter from "./routes/resumes";
import statsRouter from "./routes/stats";
import studyRouter from "./routes/study";
import vagasRouter from "./routes/vagas";
import waitlistRouter from "./routes/waitlist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
// trust proxy = 2: MEDIDO em producao (campo de debug xff/remote, commit 2837eaa),
// nao chutado. Cadeia real a partir do socket:
//   [100.64.x LB interno do Railway] -> [152.233.x edge do Railway] -> [cliente real]
// (o cliente real e o IP mais a esquerda do X-Forwarded-For). Sao 2 hops de infra
// confiavel (LB interno no socket + edge), entao descascar 2 faz req.ip resolver o
// cliente real (ex.: 216.28.246.67) em vez do IP constante do edge (152.233.x), que
// colapsava todos os clientes num unico bucket de rate limit. NAO usar "true": com o
// numero exato (2), um XFF forjado pelo cliente cai a ESQUERDA do IP que o edge
// carimba, FORA da janela confiavel, entao req.ip nunca vira spoofavel (protege
// tambem o throttle de brute-force do beta-unlock, que tambem chaveia em req.ip).
app.set("trust proxy", 2);

// Request id unificado, gerado na borda. NAO confiamos em X-Request-Id de
// entrada (cliente pode forjar; somos a borda). Correlaciona log estruturado,
// resposta e evento do Sentry.
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});

// CORS ANTES de tudo (rate limit, compressao, auth): garante que TODA resposta,
// inclusive o 429 do rate limit e qualquer 4xx/5xx, carregue os headers
// Access-Control-*. Com o CORS DEPOIS do rate limit, um 429 saia sem
// Access-Control-Allow-Origin e o navegador reportava como erro de CORS,
// mascarando o 429 (e derrubava ate o launch-state, jogando o app na landing de
// waitlist). Alem disso, o preflight OPTIONS responde 204 e retorna aqui, ANTES
// do rate limiter, entao nao consome cota de rate limit. NAO reordenar pra baixo.
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
    "Content-Type,Authorization,x-beta-token",
  );
  // Preflight cacheado por 10 minutos: sem isso o navegador refaz o OPTIONS a
  // cada POST cross-origin (landing -> api.), pagando um round-trip extra.
  res.setHeader("Access-Control-Max-Age", "600");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

// Compressao de transporte (gzip/brotli). NUNCA comprimir SSE: compression
// bufferiza e quebraria os streams do agente, do ai/stream e do roadmap IA.
// Dupla guarda: request que aceita event-stream OU resposta ja marcada como
// event-stream ficam de fora; o resto segue o filtro padrao da lib.
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      const accept = String(req.headers.accept || "");
      if (accept.includes("text/event-stream")) return false;
      const contentType = String(res.getHeader("Content-Type") || "");
      if (contentType.includes("text/event-stream")) return false;
      return compression.filter(req, res);
    },
  }),
);

const RATE_LIMIT_WINDOW_MS = 60_000;
// Configuravel por env SOMENTE para staging/teste de carga (k6); producao
// nao seta RATE_LIMIT_MAX_REQUESTS e fica no default 180 (validacao e warn
// em env.ts).
const RATE_LIMIT_MAX_REQUESTS = env.rateLimitMaxRequests;
// TTL da chave no Redis maior que a janela: a chave ja carrega o inicio da
// janela no nome, o TTL so garbage-colleta.
const RATE_LIMIT_REDIS_TTL_SECONDS = 120;
// Teto de seguranca pro numero de chaves vivas no store de FALLBACK em memoria.
const RATE_LIMIT_MAX_ENTRIES = 50_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Loga a transicao (Redis caiu / voltou) uma unica vez, nao a cada request.
let rateLimitUsingFallback = false;

// Remove entradas expiradas pra o store de fallback nao crescer indefinidamente:
// sem isso, uma chave por IP que nunca mais volta ficaria pra sempre (vazamento).
// Roda periodicamente (unref pra nao segurar o processo) e tambem sob demanda
// quando o store passa do teto.
function sweepRateLimitStore(now: number) {
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  });
}

setInterval(
  () => sweepRateLimitStore(Date.now()),
  RATE_LIMIT_WINDOW_MS,
).unref();

// Janela fixa compartilhada entre replicas: INCR + EXPIRE atomicos via multi na
// cacheConnection (fail-fast). Retorna a contagem da janela, ou null se o Redis
// falhou/ausente (o chamador cai pro fallback local). Rate limit e protecao de
// abuso, nao entitlement: fail-open aqui e decisao consciente (disponibilidade
// acima de limitacao estrita); entitlements Pro seguem fail-closed.
async function redisRateLimitCount(
  ip: string,
  windowStart: number,
): Promise<number | null> {
  if (!cacheConnection) {
    return null;
  }
  const key = `ratelimit:${ip}:${windowStart}`;
  try {
    const results = await cacheConnection
      .multi()
      .incr(key)
      .expire(key, RATE_LIMIT_REDIS_TTL_SECONDS)
      .exec();
    const incr = results?.[0];
    if (!incr || incr[0]) {
      return null;
    }
    return Number(incr[1]);
  } catch {
    return null;
  }
}

const CSP_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' https://us-assets.i.posthog.com 'sha256-iOO7XE5wh/beZwhnFVoPRIUGMX82tyr3j9g5EokGcdE='",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https:",
  // blob: para o player de audio das entrevistas (E5): o client monta Blob do
  // audio e toca via URL blob:, que nao e coberta por 'self'.
  "media-src 'self' blob:",
  [
    "connect-src 'self'",
    "https://api.boranatech.com.br",
    "https://vlcvaanlkqyxemrxsxzn.supabase.co",
    "wss://vlcvaanlkqyxemrxsxzn.supabase.co",
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
    // Sentry do browser (VITE_SENTRY_DSN): sem este host o CSP bloqueia o envio
    // dos eventos (mais um silencio). Wildcard cobre o subdominio de ingest de
    // qualquer regiao (o<org>.ingest[.us|.de].sentry.io).
    "https://*.sentry.io",
  ].join(" "),
  // 'self' necessario pro iframe da landing de lancamento (client/public/lancamento.html).
  // Nao remover sem migrar a landing pra fora de iframe.
  "frame-src 'self' https://www.youtube-nocookie.com",
].join("; ");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    // microphone=(self): a resposta por voz da entrevista (E2) grava audio
    // via getUserMedia na propria origem. Video segue bloqueado (camera=()).
    "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
  );
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.setHeader("Content-Security-Policy", CSP_POLICY);
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
        request_id: res.locals.requestId,
      }),
    );
  });
  next();
});

app.use(async (req, res, next) => {
  if (!req.path.startsWith("/api") || isRateLimitExempt(req.path)) {
    return next();
  }

  const now = Date.now();
  // Conta por QUEM CHAMA, nao por de onde. IP nao e identidade: em NAT de
  // operadora/escola dezenas de pessoas dividiam o mesmo balde de 180/min e
  // levavam 429 juntas (28 dos 29 `profile_fetch_exhausted` do Sentry eram isso,
  // espalhados por 6 cidades). Requisicao com token conta no balde do usuario.
  const identidade = identidadeDeCota(req.headers.authorization, req.ip);
  const key = identidade.chave;
  // Requisicao autenticada leva TAMBEM um teto por IP, mais alto. Sem ele, um
  // `sub` forjado a cada requisicao geraria um balde novo por chamada e escaparia
  // da cota (o `sub` e lido sem verificar assinatura de proposito: ele nao
  // autoriza nada, so escolhe balde). Requisicao sem token nao precisa do
  // segundo teto, porque o IP ja e a chave principal e checar de novo contaria o
  // mesmo balde duas vezes.
  const tetoIp = identidade.porUsuario
    ? {
        chave: chaveDeIp(req.ip),
        limite: RATE_LIMIT_MAX_REQUESTS * FATOR_TETO_IP,
      }
    : null;
  const windowStart = now - (now % RATE_LIMIT_WINDOW_MS);

  // Escopo no log: sem ele, "429" nao diz se quem estourou foi a pessoa ou o IP
  // inteiro, que sao problemas diferentes com correcoes diferentes. A CONTAGEM
  // vem junto porque ela e de graca (ja esta em maos na hora da decisao) e
  // transforma "estourou" em "estourou por quanto": 1081 contra 1080 e um NAT
  // grande demais para o fator; 9000 contra 1080 e abuso. Sem o numero, as duas
  // saem como a mesma linha.
  // O rotulo do balde, calculado UMA vez e usado pelas duas linhas. Antes o
  // calculo vivia inline na amostra e a linha de 429 nao tinha `alvo` nenhum,
  // e docs/denominador-rate-limit.md mandava "investigar o alvo" no caso de
  // abuso: a acao prescrita nao era executavel, porque o campo nao existia.
  // Como funcao unica, as duas linhas ficam correlacionaveis por construcao, e
  // nao por alguem lembrar de repetir a mesma expressao nos dois lugares.
  const alvoDoEscopo = (escopo: "usuario" | "ip") =>
    alvoAnonimo(escopo === "ip" ? chaveDeIp(req.ip) : key);

  const recusar = (
    escopo: "usuario" | "ip",
    resetAt: number,
    contagem: number,
    limite: number,
  ) => {
    res.setHeader("Retry-After", String(Math.ceil((resetAt - now) / 1000)));
    console.warn(
      `[ratelimit] 429 escopo=${escopo} alvo=${alvoDoEscopo(escopo)} contagem=${contagem} limite=${limite}`,
    );
    return res.status(429).json({
      error: {
        code: "rate_limited",
        message: "Muitas requisições. Tente novamente em instantes.",
      },
    });
  };

  // Amostra do DENOMINADOR: emite a contagem da JANELA (nao a requisicao) a cada
  // N chamadas da mesma chave. Desligada por padrao. Ver docs/denominador-rate-limit.md.
  const amostrar = (escopo: "usuario" | "ip", contagem: number, limite: number) => {
    const n = env.rateLimitSampleN;
    if (n <= 0 || contagem % n !== 0) return;
    console.log(
      `[ratelimit] amostra escopo=${escopo} alvo=${alvoDoEscopo(escopo)} contagem=${contagem} limite=${limite}`,
    );
  };

  const redisCount = await redisRateLimitCount(key, windowStart);
  if (redisCount !== null) {
    if (rateLimitUsingFallback) {
      rateLimitUsingFallback = false;
      console.log(
        "[ratelimit] Redis voltou. Contagem compartilhada reativada.",
      );
    }
    if (redisCount > RATE_LIMIT_MAX_REQUESTS) {
      return recusar("usuario", windowStart + RATE_LIMIT_WINDOW_MS, redisCount, RATE_LIMIT_MAX_REQUESTS);
    }
    amostrar("usuario", redisCount, RATE_LIMIT_MAX_REQUESTS);
    if (tetoIp) {
      const contagemIp = await redisRateLimitCount(tetoIp.chave, windowStart);
      if (contagemIp !== null && contagemIp > tetoIp.limite) {
        return recusar("ip", windowStart + RATE_LIMIT_WINDOW_MS, contagemIp, tetoIp.limite);
      }
      if (contagemIp !== null) amostrar("ip", contagemIp, tetoIp.limite);
    }
    return next();
  }

  // DOIS ESTADOS DIFERENTES, e antes os dois eram o mesmo silêncio. A guarda
  // aqui era `cacheConnection && !rateLimitUsingFallback`, e o `cacheConnection
  // &&` fazia o aviso nunca sair quando o Redis nem estava configurado: em
  // produção, "esqueceram a REDIS_URL" ficava indistinguível de "está tudo
  // bem". O comportamento NÃO muda (segue contando local e deixando passar),
  // só o rastro. Detalhe em server/lib/rateLimitSemRedis.ts.
  if (cacheConnection) {
    // Configurado e caiu: transição, avisada uma vez, e desfeita quando volta.
    if (!rateLimitUsingFallback) {
      rateLimitUsingFallback = true;
      console.warn(
        "[ratelimit] Redis indisponível. Contagem local por instância (fail-open).",
      );
    }
  } else {
    // Nunca configurado: não há transição para observar, porque não vai voltar.
    avisarRateLimitSemRedis(env.isProd);
  }

  // Fallback local: mesma decisao em duas chaves, entao vira funcao para os dois
  // tetos usarem a MESMA contagem. Guarda dentro da funcao, nao repetida no call
  // site: era assim que a supressao por autodeclaracao sumiu de um dos dois
  // call sites de `setScoreDelta`.
  const contarLocal = (chave: string): { count: number; resetAt: number } => {
    const atual = rateLimitStore.get(chave);
    if (!atual || atual.resetAt <= now) {
      if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
        sweepRateLimitStore(now);
      }
      const novo = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
      rateLimitStore.set(chave, novo);
      return novo;
    }
    atual.count += 1;
    return atual;
  };

  const doUsuario = contarLocal(key);
  if (doUsuario.count > RATE_LIMIT_MAX_REQUESTS) {
    return recusar("usuario", doUsuario.resetAt, doUsuario.count, RATE_LIMIT_MAX_REQUESTS);
  }
  amostrar("usuario", doUsuario.count, RATE_LIMIT_MAX_REQUESTS);
  if (tetoIp) {
    const doIp = contarLocal(tetoIp.chave);
    if (doIp.count > tetoIp.limite) {
      return recusar("ip", doIp.resetAt, doIp.count, tetoIp.limite);
    }
    amostrar("ip", doIp.count, tetoIp.limite);
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

// Webhook do Resend: a verificacao Svix precisa do corpo cru exato, entao so
// guardamos rawBody (sem JSON.parse; o handler usa o payload verificado pela
// Svix, nao req.body). Antes do json global, mesmo padrao do billing acima.
app.use("/api/resend/webhook", express.raw({ type: "application/json" }));

app.use("/api/resend/webhook", (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as typeof req & { rawBody?: Buffer }).rawBody = req.body;
  }

  next();
});

// Upload de avatar envia imagem base64 (pode passar de 2mb). Parser dedicado ANTES
// do json global; requisicoes ja parseadas (req._body) sao ignoradas pelo global.
app.use("/api/me/avatar", express.json({ limit: "10mb" }));

// Transcricao de audio da entrevista tambem envia base64 (pode passar de 2mb).
// Mesmo padrao do avatar: parser dedicado ANTES do json global.
app.use(
  "/api/interview/sessions/:id/transcribe",
  express.json({ limit: "10mb" }),
);

// Import de lista de contatos: preview recebe arquivo em base64 (teto de 5mb no
// arquivo, ~6.7mb em base64). Parser dedicado ANTES do json global (mesmo padrao
// do avatar). So o /preview precisa do limite maior; o confirm (POST /) e leve.
app.use(
  "/api/admin/contact-lists/preview",
  express.json({ limit: "10mb" }),
);

app.use(express.json({ limit: "2mb" }));

app.use("/api/affiliates", affiliatesRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/launch-state", launchStateRouter);
app.use("/api/beta", betaRouter);
app.use("/api/faculdades", faculdadesRouter);
app.use("/api/public/certificates", publicCertificatesRouter);

// Webhook do Resend: publico (a autenticacao e a assinatura Svix), montado antes
// do gate de JWT. O rawBody ja foi capturado pelo middleware acima.
app.use("/api/resend/webhook", resendWebhookRouter);

app.use("/api", validateSupabaseJwt);

app.use("/api/ai", aiRouter);
app.use("/api/roadmaps-ia", aiRoadmapRouter);
// agentHistoryRouter ANTES de agentRouter (path mais especifico) para ter sua
// propria cadeia de middleware sem reexecutar a do agentRouter. Nao reordenar.
app.use("/api/agent/conversations", agentHistoryRouter);
app.use("/api/agent", agentRouter);
app.use("/api/github", githubRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/linkedin", linkedinRouter);
app.use("/api/resume", resumeAnalysisRouter);
app.use("/api/resumes", resumesRouter);
app.use("/api/me/avatar", meAvatarRouter);
app.use("/api/me/notifications", notificationsRouter);
app.use("/api/me/super", superRouter);
app.use("/api/me", meRouter);
app.use("/api/avatars", avatarsRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/billing", billingRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/consent", consentRouter);
app.use("/api/career-plan", careerPlanRouter);
app.use("/api/progress", progressRouter);
app.use("/api/project-validations", projectValidationsRouter);
app.use("/api/roadmap-completions", roadmapCompletionsRouter);
app.use("/api/roadmap-quiz", roadmapQuizRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/study", studyRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/vagas", vagasRouter);
app.use("/api/admin", adminRouter);
app.use("/api/content", contentRouter);
app.use("/api/cron", cronRouter);

// Liveness pura pro healthcheck do Railway: nao toca banco nem Redis, so prova
// que o processo aceita conexoes. O /api/health completo fica pra monitoramento.
app.get("/api/health/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Guarda redundante do ping: a cacheConnection ja falha rapido (commandTimeout
// 1000, offline queue desligada), o race garante que o health NUNCA pendura.
const HEALTH_REDIS_PING_TIMEOUT_MS = 1500;
const HEALTH_PING_TIMEOUT = Symbol("health-redis-ping-timeout");

app.get("/api/health", async (_req, res) => {
  const checks: Record<string, string> = {};
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
  if (cacheConnection) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const pong = await Promise.race([
        cacheConnection.ping(),
        new Promise<typeof HEALTH_PING_TIMEOUT>((resolve) => {
          timer = setTimeout(
            () => resolve(HEALTH_PING_TIMEOUT),
            HEALTH_REDIS_PING_TIMEOUT_MS,
          );
        }),
      ]);
      checks.redis = pong === "PONG" ? "ok" : "degraded";
    } catch {
      checks.redis = "degraded";
    } finally {
      clearTimeout(timer);
    }
  } else {
    checks.redis = "not_configured";
  }

  // Redis e componente opcional (cache/fila tem fallback): o status HTTP
  // reflete APENAS o banco, pra um outage de Redis nao derrubar a replica
  // no healthcheck.
  const status = checks.database === "ok" ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    env: env.nodeEnv,
    // QUAL BUILD E ESTE. Null fora do Railway; ver server/lib/commitSha.ts.
    commit: commitShaAtual(),
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

// Assets com hash no nome podem ser imutaveis; index.html e demais arquivos
// sem hash precisam revalidar a cada deploy (immutable neles quebraria deploy).
const assetsDir = path.join(staticPath, "assets") + path.sep;

app.use(
  express.static(staticPath, {
    setHeaders: (res, filePath) => {
      if (filePath.startsWith(assetsDir)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"), {
    headers: { "Cache-Control": "no-cache" },
  });
});

// Captura pro Sentry ANTES do errorHandler, que segue dono da resposta ao
// cliente. Equivalente ao setupExpressErrorHandler da lib, feito a mao porque
// precisamos da tag requestId por request: no bundle esbuild a isolacao de
// escopo por request do SDK (via instrumentacao http) nao e confiavel, entao
// withScope + captura explicita e o caminho deterministico. So 5xx: erro de
// createError com statusCode < 500 e negocio esperado (o beforeSend do
// sentry.ts descarta esses tambem, dupla protecao).
app.use(
  (
    err: Error & { statusCode?: number; context?: Record<string, unknown> },
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const statusCode =
      typeof err.statusCode === "number" ? err.statusCode : 500;
    if (statusCode >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag("requestId", String(res.locals.requestId ?? ""));
        scope.setTag("route", req.path);
        // Sem isto todo evento vinha com 0 usuarios: a request ja passou pelo
        // requireAuth, entao req.user existe para rota autenticada.
        if (req.user?.id) scope.setUser({ id: req.user.id });
        // Contexto estruturado que o handler anexou via createError(..., {context}).
        if (err.context) scope.setContext("handler", err.context);
        // Falha da OpenAI classificada, achada na cadeia de `cause`. Sem estas
        // tags o evento de `502 upstream_error` e identico para saldo esgotado
        // e para rate limit, e o diagnostico recomeca do zero (foi o que custou
        // o incidente de 2026-08-05). Fica aqui, num lugar so, em vez de em
        // cada rota: quem embrulha o erro so precisa passar `cause`.
        const falhaOpenAi = falhaOpenAiNaCadeia(err);
        if (falhaOpenAi) {
          scope.setTag("openai_classificacao", falhaOpenAi.classificacao);
          scope.setTag("openai_code", falhaOpenAi.openaiCode ?? "ausente");
          scope.setTag("openai_type", falhaOpenAi.openaiType ?? "ausente");
          scope.setTag("openai_status", String(falhaOpenAi.httpStatus));
        }
        // Headers de transporte do 500 do body parser. So MEDE: nada no
        // `express.json` nem na ordem dos middlewares muda. Ver o comentario de
        // `bodyParseContext` em middleware/error.ts.
        const bodyParse = bodyParseContext(err, req);
        if (bodyParse) scope.setContext("body_parse", bodyParse);
        Sentry.captureException(err);
      });
    }
    next(err);
  },
);

app.use(errorHandler);

export default app;
