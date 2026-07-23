import * as Sentry from "@sentry/node";
import express, { Router, type Response } from "express";

import { validateEmailForSending } from "../lib/emailValidation";
import { env } from "../lib/env";
import { enqueueEmail } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { verifySignedToken } from "../lib/signedToken";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  EMAIL_UNSUBSCRIBE_PURPOSE,
  WAITLIST_UNSUBSCRIBE_PURPOSE,
} from "../lib/waitlistUnsubscribe";

const router = Router();

const SIGNUP_WINDOW_SECONDS = 10 * 60;
const SIGNUP_MAX_ATTEMPTS = 20;
const MAX_SOURCE_LENGTH = 64;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

router.post("/", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const email = normalizeEmail(
      typeof body.email === "string" ? body.email : "",
    );

    // Mesma fonte de verdade do envio: sintaxe + dominio reservado (example.com,
    // .test etc). Sem isto, probe/teste entrava na waitlist e so falhava no envio.
    const emailCheck = validateEmailForSending(email);
    if (!emailCheck.ok) {
      res.status(400).json({
        error: {
          code: "invalid_email",
          message:
            emailCheck.reason === "reserved"
              ? "Use um e-mail de um domínio real. Não aceitamos domínios de teste (example.com, .test)."
              : "E-mail invalido.",
        },
      });
      return;
    }

    const source =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim().slice(0, MAX_SOURCE_LENGTH)
        : "landing-lancamento";

    // Throttle por IP no Redis, mesmo contador do POST /api/beta/unlock (INCR +
    // EXPIRE). Janela generosa porque CGNAT poe varios usuarios legitimos no mesmo
    // IP e o dado ja dedupa por e-mail: o throttle so barra flood, nao cadastro
    // legitimo repetido. Fail-open: sem Redis ou em erro, segue sem throttle.
    // cacheConnection (fail-fast): com Redis fora o comando rejeita rapido e o
    // catch libera; a conexao de fila penduraria a rota na offline queue.
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (cacheConnection) {
      try {
        const key = `waitlist:signup:${ip}`;
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
        console.warn(
          "[waitlist] Throttle Redis indisponivel, seguindo sem throttle",
          err,
        );
      }
    }

    const { error } = await supabaseAdmin
      .from("waitlist")
      .insert({ email, source });

    if (error) {
      // 23505 = unique_violation: e-mail ja esta na lista. Sucesso idempotente,
      // sem reenviar o e-mail de confirmacao.
      if (error.code === "23505") {
        res.json({ ok: true });
        return;
      }
      console.error("[waitlist] Falha ao inserir cadastro", error);
      res.status(500).json({
        error: {
          code: "waitlist_error",
          message: "Nao foi possivel concluir o cadastro.",
        },
      });
      return;
    }

    // Responde ANTES do e-mail: o enqueue (e o fallback de envio direto, que
    // pode levar segundos) sai do caminho critico da resposta. Fire-and-forget
    // best-effort: falha vira log + Sentry, nunca derruba o cadastro.
    res.json({ ok: true });

    void enqueueEmail({
      type: "waitlist_confirmation",
      to: email,
      name: "",
    }).catch((err) => {
      console.error(
        "[waitlist] Falha ao enfileirar e-mail de confirmacao",
        err,
      );
      Sentry.captureException(err);
    });
  } catch (err) {
    console.error("[waitlist] Erro inesperado", err);
    res.status(500).json({
      error: {
        code: "waitlist_error",
        message: "Nao foi possivel concluir o cadastro.",
      },
    });
  }
});

type UnsubscribeTokenClaims = { email: string; purpose: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Pagina HTML minima auto-contida (mesmo padrao do unsubscribe da newsletter),
// independente do SPA.
function renderUnsubscribePage(opts: {
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
    <title>Bora na Tech</title>
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

function sendUnsubscribePage(res: Response, status: number, html: string) {
  res.status(status).type("html").send(html);
}

// TODO(Ana): copy da pagina de descadastro concluido (neutra, vale pra qualquer origem).
// Resposta generica: token valido ou invalido caem na MESMA pagina, pra nao
// vazar se o token (e o e-mail por tras dele) existe.
function unsubscribeSuccessPage(res: Response) {
  sendUnsubscribePage(
    res,
    200,
    renderUnsubscribePage({
      heading: "Descadastro concluido",
      message: "Voce nao vai mais receber estes e-mails do Bora na Tech.",
    }),
  );
}

// GET /unsubscribe?token=...: pagina com form-POST (defesa de prefetch: cliente
// de e-mail que abre o link nao descadastra ninguem; so o clique no botao
// efetiva). Nao valida o token aqui de proposito: pagina generica, sem vazar
// existencia ou expiracao.
router.get("/unsubscribe", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  // TODO(Ana): copy da pagina de confirmacao de descadastro (neutra, qualquer origem).
  sendUnsubscribePage(
    res,
    200,
    renderUnsubscribePage({
      heading: "Cancelar estes e-mails",
      message:
        "Quer parar de receber estes e-mails do Bora na Tech? Confirme abaixo.",
      form: {
        action: "/api/waitlist/unsubscribe",
        token,
        button: "Confirmar descadastro",
      },
    }),
  );
});

// POST /unsubscribe: efetiva o descadastro. Idempotente. Token invalido ou
// expirado responde a MESMA pagina generica de sucesso (nao vazar se existe).
router.post(
  "/unsubscribe",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      // Token do form ou da query string: o header List-Unsubscribe-Post
      // (one-click dos provedores) faz POST direto na URL do e-mail, sem form.
      const formToken = typeof body.token === "string" ? body.token : "";
      const queryToken =
        typeof req.query.token === "string" ? req.query.token : "";
      const token = formToken || queryToken;

      // Aceita o purpose atual (email-unsubscribe) e o legado
      // (waitlist-unsubscribe): ha tokens de 60 dias emitidos antes da
      // generalizacao que precisam continuar funcionando.
      const claims = env.newsletterTokenSecret
        ? (verifySignedToken<UnsubscribeTokenClaims>({
            token,
            secret: env.newsletterTokenSecret,
            expectedPurpose: EMAIL_UNSUBSCRIBE_PURPOSE,
          }) ??
          verifySignedToken<UnsubscribeTokenClaims>({
            token,
            secret: env.newsletterTokenSecret,
            expectedPurpose: WAITLIST_UNSUBSCRIBE_PURPOSE,
          }))
        : null;

      if (claims) {
        const email = claims.email.toLowerCase();

        // Efeito principal: supressao GLOBAL. Vale pra qualquer origem,
        // inclusive lista avulsa cujo e-mail nao esta em tabela nenhuma.
        // Upsert idempotente; falha aqui e erro de verdade (sem supressao o
        // descadastro nao vale pra proxima campanha).
        const { error: suppressionError } = await supabaseAdmin
          .from("email_suppressions")
          .upsert(
            {
              email,
              reason: "unsubscribed",
              source: "campaign-unsubscribe",
            },
            { onConflict: "email", ignoreDuplicates: true },
          );
        if (suppressionError) {
          console.error(
            "[waitlist] Falha ao gravar supressao global",
            suppressionError,
          );
          // TODO(Ana): copy da pagina de erro do descadastro.
          sendUnsubscribePage(
            res,
            500,
            renderUnsubscribePage({
              heading: "Algo deu errado",
              message:
                "Nao foi possivel concluir o descadastro agora. Tente de novo em instantes.",
            }),
          );
          return;
        }

        // Adicionalmente marca as origens onde o e-mail existir. Best-effort
        // e idempotente: a supressao global acima ja garante que a pessoa nao
        // recebe mais campanha mesmo se um destes updates falhar.
        const { error: waitlistError } = await supabaseAdmin
          .from("waitlist")
          .update({
            status: "unsubscribed",
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("email", email)
          .neq("status", "unsubscribed");
        if (waitlistError) {
          console.error(
            "[waitlist] Falha ao marcar descadastro na waitlist",
            waitlistError,
          );
        }
        const { error: newsletterError } = await supabaseAdmin
          .from("newsletter_subscribers")
          .update({
            status: "unsubscribed",
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("email", email)
          .neq("status", "unsubscribed");
        if (newsletterError) {
          console.error(
            "[waitlist] Falha ao marcar descadastro na newsletter",
            newsletterError,
          );
        }
      }

      unsubscribeSuccessPage(res);
    } catch (err) {
      console.error("[waitlist] Erro inesperado no unsubscribe", err);
      sendUnsubscribePage(
        res,
        500,
        renderUnsubscribePage({
          heading: "Algo deu errado",
          message:
            "Nao foi possivel concluir o descadastro agora. Tente de novo em instantes.",
        }),
      );
    }
  },
);

export default router;
