import express, { Router, type Response } from "express";

import { env } from "../lib/env";
import { enqueueEmail } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { issueSignedToken, verifySignedToken } from "../lib/signedToken";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

const PURPOSE_CONFIRM = "newsletter-confirm";
const PURPOSE_UNSUBSCRIBE = "newsletter-unsubscribe";
const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000; // 48h
const UNSUBSCRIBE_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 365d

const SIGNUP_WINDOW_SECONDS = 10 * 60;
const SIGNUP_MAX_ATTEMPTS = 20;
// Mesma validacao do POST /api/waitlist: presenca de local, arroba e dominio com
// ponto. A confirmacao real do endereco fica a cargo do double opt-in.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 64;

type TokenClaims = { email: string; purpose: string };

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

// Fechado por secret: sem secret nao da pra assinar/verificar token. Fail-closed:
// nunca chamamos issueSignedToken/verifySignedToken com secret vazio.
function secretReady() {
  return env.newsletterTokenSecret !== "";
}

// Sem base URL nao da pra montar o link absoluto do backend nos e-mails.
function baseUrlReady() {
  return env.newsletterPublicBaseUrl !== "";
}

function captureOn() {
  return env.newsletterCaptureMode === "on";
}

function backendBaseUrl() {
  return env.newsletterPublicBaseUrl.replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Pagina HTML minima auto-contida (estilo inline), independente do SPA. Prettificar
// ou mover pro SPA e tarefa futura, fora deste passo.
function renderPage(opts: {
  title: string;
  heading: string;
  message: string;
  form?: { action: string; token: string; button: string };
}) {
  const formHtml = opts.form
    ? `
      <form method="POST" action="${opts.form.action}" style="margin-top:24px;">
        <input type="hidden" name="token" value="${escapeHtml(opts.form.token)}">
        <button type="submit" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#1a1a1a;background:#FCC700;border:none;border-radius:999px;cursor:pointer;">${opts.form.button}</button>
      </form>`
    : "";
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${opts.title}</title>
  </head>
  <body style="margin:0;background:#f5f0e8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <div style="max-width:480px;margin:64px auto;padding:32px 28px;background:#ffffff;border-radius:16px;text-align:center;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;">${opts.heading}</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#444444;">${opts.message}</p>
      ${formHtml}
    </div>
  </body>
</html>`;
}

function sendPage(res: Response, status: number, html: string) {
  res.status(status).type("html").send(html);
}

// Pagina generica de erro (link invalido/expirado ou captura fechada).
// TODO(Ana): copy das paginas HTML de erro de confirm/unsubscribe.
function errorPage(res: Response, status: number) {
  sendPage(
    res,
    status,
    renderPage({
      title: "Bora na Tech",
      heading: "Link invalido ou expirado",
      message:
        "Esse link nao e mais valido. Se precisar, faca a inscricao de novo.",
    }),
  );
}

// GET /state: o footer so mostra o form se aqui devolver "on". Fail-closed: nao
// anuncia captura ligada se nao da pra assinar token nem montar link.
router.get("/state", (_req, res) => {
  const on = captureOn() && secretReady() && baseUrlReady();
  res.json({ status: on ? "on" : "off" });
});

// POST /signup: { email, source? }. Backstop server-side; o footer ja consulta /state.
router.post("/signup", async (req, res) => {
  try {
    if (!captureOn() || !secretReady() || !baseUrlReady()) {
      res.status(403).json({
        error: {
          code: "newsletter_closed",
          message: "Inscricoes na newsletter fechadas no momento.",
        },
      });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = normalizeEmail(
      typeof body.email === "string" ? body.email : "",
    );

    if (
      !email ||
      email.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(email)
    ) {
      res.status(400).json({
        error: { code: "invalid_email", message: "E-mail invalido." },
      });
      return;
    }

    const source =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim().slice(0, MAX_SOURCE_LENGTH)
        : "footer";

    // Throttle por IP, mesmo padrao do POST /api/waitlist (INCR + EXPIRE). Janela
    // generosa (CGNAT) e o dado dedupa por e-mail. FAIL-CLOSED: sem rate limiter
    // (Redis ausente ou fora) nao da pra conter email-bombing pelo form publico,
    // entao a rota nega com 503 em vez de seguir sem throttle. Mesmo padrao de
    // careerPlan/linkedin (503 quando o limite nao pode ser verificado).
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!cacheConnection) {
      res.status(503).json({
        error: {
          code: "rate_check_failed",
          // TODO(Ana): copy de indisponibilidade temporaria do cadastro (503).
          message:
            "Nao foi possivel concluir agora. Tente novamente em instantes.",
        },
      });
      return;
    }
    try {
      const key = `newsletter:signup:${ip}`;
      const attempts = await cacheConnection.incr(key);
      if (attempts === 1) {
        await cacheConnection.expire(key, SIGNUP_WINDOW_SECONDS);
      }
      if (attempts > SIGNUP_MAX_ATTEMPTS) {
        res.status(429).json({
          error: {
            code: "too_many_attempts",
            message: "Muitas tentativas. Tente novamente em instantes.",
          },
        });
        return;
      }
    } catch (err) {
      console.error(
        "[newsletter] Throttle Redis indisponivel, negando signup (fail-closed)",
        err,
      );
      res.status(503).json({
        error: {
          code: "rate_check_failed",
          // TODO(Ana): copy de indisponibilidade temporaria do cadastro (503).
          message:
            "Nao foi possivel concluir agora. Tente novamente em instantes.",
        },
      });
      return;
    }

    const { data: existing, error: selErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (selErr) {
      console.error("[newsletter] Falha ao buscar assinante", selErr);
      res.status(500).json({
        error: {
          code: "newsletter_error",
          message: "Nao foi possivel concluir a inscricao.",
        },
      });
      return;
    }

    const nowIso = new Date().toISOString();
    let shouldSendConfirm = false;

    if (!existing) {
      // (a) Nao existe: cria pending e dispara confirmacao.
      const { error: insErr } = await supabaseAdmin
        .from("newsletter_subscribers")
        .insert({
          email,
          source,
          status: "pending_confirmation",
          confirmation_sent_at: nowIso,
        });
      if (insErr) {
        // 23505 = corrida: outro request inseriu o mesmo e-mail entre o select e o
        // insert. Sucesso generico sem reenviar (anti-enumeracao).
        if (insErr.code === "23505") {
          res.json({ ok: true });
          return;
        }
        console.error("[newsletter] Falha ao inserir assinante", insErr);
        res.status(500).json({
          error: {
            code: "newsletter_error",
            message: "Nao foi possivel concluir a inscricao.",
          },
        });
        return;
      }
      shouldSendConfirm = true;
    } else if (existing.status === "pending_confirmation") {
      // (b) Pendente: usuario perdeu o e-mail, reenvia.
      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ confirmation_sent_at: nowIso })
        .eq("id", existing.id);
      shouldSendConfirm = true;
    } else if (existing.status === "unsubscribed") {
      // (d) Re-opt-in: volta pra pending e faz double opt-in de novo.
      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ status: "pending_confirmation", confirmation_sent_at: nowIso })
        .eq("id", existing.id);
      shouldSendConfirm = true;
    }
    // (c) status 'confirmed': nao reenvia nada, nao revela "ja inscrito". Cai no
    // sucesso generico abaixo (anti-enumeracao).

    if (shouldSendConfirm) {
      // E-mail best-effort (igual waitlist): falha no enqueue nao quebra a resposta.
      try {
        const token = issueSignedToken({
          claims: { email, purpose: PURPOSE_CONFIRM },
          secret: env.newsletterTokenSecret,
          ttlMs: CONFIRM_TTL_MS,
        });
        const confirmUrl = `${backendBaseUrl()}/api/newsletter/confirm?token=${token}`;
        await enqueueEmail({ type: "newsletter_confirm", to: email, confirmUrl });
      } catch (err) {
        console.error(
          "[newsletter] Falha ao enfileirar e-mail de confirmacao",
          err,
        );
      }
    }

    // Resposta generica e identica em a/b/c/d.
    res.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] Erro inesperado no signup", err);
    res.status(500).json({
      error: {
        code: "newsletter_error",
        message: "Nao foi possivel concluir a inscricao.",
      },
    });
  }
});

// GET /confirm?token=...: pagina com form-POST. O GET nao muda estado, defende
// contra prefetch de scanners de e-mail (que fazem GET mas nao submetem forms).
router.get("/confirm", (req, res) => {
  if (!secretReady()) {
    errorPage(res, 503);
    return;
  }
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const claims = verifySignedToken<TokenClaims>({
    token,
    secret: env.newsletterTokenSecret,
    expectedPurpose: PURPOSE_CONFIRM,
  });
  if (!claims) {
    errorPage(res, 400);
    return;
  }
  // TODO(Ana): copy da pagina de confirmacao (com botao de submit).
  sendPage(
    res,
    200,
    renderPage({
      title: "Bora na Tech",
      heading: "Confirme sua inscricao",
      message: "Falta um clique para confirmar sua inscricao na newsletter.",
      form: {
        action: "/api/newsletter/confirm",
        token,
        button: "Confirmar inscricao",
      },
    }),
  );
});

// POST /confirm: token via form-urlencoded. Parser dedicado so nesta rota, sem
// alterar os parsers globais do app.
router.post(
  "/confirm",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      if (!secretReady()) {
        errorPage(res, 503);
        return;
      }
      const body = (req.body ?? {}) as Record<string, unknown>;
      const token = typeof body.token === "string" ? body.token : "";
      const claims = verifySignedToken<TokenClaims>({
        token,
        secret: env.newsletterTokenSecret,
        expectedPurpose: PURPOSE_CONFIRM,
      });
      if (!claims) {
        errorPage(res, 400);
        return;
      }
      const email = claims.email;

      const { data: row, error: selErr } = await supabaseAdmin
        .from("newsletter_subscribers")
        .select("id, status")
        .eq("email", email)
        .maybeSingle();

      if (selErr) {
        console.error("[newsletter] Falha ao buscar assinante no confirm", selErr);
        errorPage(res, 500);
        return;
      }
      if (!row) {
        errorPage(res, 400);
        return;
      }

      if (row.status === "unsubscribed") {
        // Nao ressuscitar via link antigo de confirmacao. Pagina neutra.
        // TODO(Ana): copy da pagina "ja processado".
        sendPage(
          res,
          200,
          renderPage({
            title: "Bora na Tech",
            heading: "Tudo certo",
            message: "Esse pedido ja foi processado.",
          }),
        );
        return;
      }

      if (row.status === "pending_confirmation") {
        await supabaseAdmin
          .from("newsletter_subscribers")
          .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
          .eq("id", row.id);

        // Boas-vindas best-effort, com link de descadastro assinado de longa duracao.
        try {
          const unsubToken = issueSignedToken({
            claims: { email, purpose: PURPOSE_UNSUBSCRIBE },
            secret: env.newsletterTokenSecret,
            ttlMs: UNSUBSCRIBE_TTL_MS,
          });
          const unsubscribeUrl = `${backendBaseUrl()}/api/newsletter/unsubscribe?token=${unsubToken}`;
          await enqueueEmail({
            type: "newsletter_welcome",
            to: email,
            unsubscribeUrl,
          });
        } catch (err) {
          console.error(
            "[newsletter] Falha ao enfileirar e-mail de boas-vindas",
            err,
          );
        }
      }
      // status 'confirmed': idempotente, nao reenvia welcome.

      // TODO(Ana): copy da pagina de sucesso da confirmacao.
      sendPage(
        res,
        200,
        renderPage({
          title: "Bora na Tech",
          heading: "Inscricao confirmada",
          message: "Pronto. Voce vai receber as novidades da tech no seu inbox.",
        }),
      );
    } catch (err) {
      console.error("[newsletter] Erro inesperado no confirm", err);
      errorPage(res, 500);
    }
  },
);

// GET /unsubscribe?token=...: pagina com form-POST (mesma defesa de prefetch).
router.get("/unsubscribe", (req, res) => {
  if (!secretReady()) {
    errorPage(res, 503);
    return;
  }
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const claims = verifySignedToken<TokenClaims>({
    token,
    secret: env.newsletterTokenSecret,
    expectedPurpose: PURPOSE_UNSUBSCRIBE,
  });
  if (!claims) {
    errorPage(res, 400);
    return;
  }
  // TODO(Ana): copy da pagina de descadastro (com botao de submit).
  sendPage(
    res,
    200,
    renderPage({
      title: "Bora na Tech",
      heading: "Cancelar inscricao",
      message: "Quer parar de receber a newsletter? Confirme abaixo.",
      form: {
        action: "/api/newsletter/unsubscribe",
        token,
        button: "Confirmar descadastro",
      },
    }),
  );
});

// POST /unsubscribe: token via form-urlencoded. Idempotente, funciona em qualquer
// status atual, nenhum e-mail enviado.
router.post(
  "/unsubscribe",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      if (!secretReady()) {
        errorPage(res, 503);
        return;
      }
      const body = (req.body ?? {}) as Record<string, unknown>;
      const token = typeof body.token === "string" ? body.token : "";
      const claims = verifySignedToken<TokenClaims>({
        token,
        secret: env.newsletterTokenSecret,
        expectedPurpose: PURPOSE_UNSUBSCRIBE,
      });
      if (!claims) {
        errorPage(res, 400);
        return;
      }
      const email = claims.email;

      const { data: row, error: selErr } = await supabaseAdmin
        .from("newsletter_subscribers")
        .select("id, status")
        .eq("email", email)
        .maybeSingle();

      if (selErr) {
        console.error(
          "[newsletter] Falha ao buscar assinante no unsubscribe",
          selErr,
        );
        errorPage(res, 500);
        return;
      }

      // Idempotente: marca unsubscribed se ainda nao estava. Ja unsubscribed ou row
      // ausente (token valido) cai no mesmo sucesso, resultado final identico.
      if (row && row.status !== "unsubscribed") {
        await supabaseAdmin
          .from("newsletter_subscribers")
          .update({
            status: "unsubscribed",
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }

      // TODO(Ana): copy da pagina de descadastro concluido.
      sendPage(
        res,
        200,
        renderPage({
          title: "Bora na Tech",
          heading: "Descadastro concluido",
          message:
            "Voce nao vai mais receber a newsletter. Quando quiser, pode voltar.",
        }),
      );
    } catch (err) {
      console.error("[newsletter] Erro inesperado no unsubscribe", err);
      errorPage(res, 500);
    }
  },
);

export default router;
