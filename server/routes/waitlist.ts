import * as Sentry from "@sentry/node";
import { Router } from "express";

import { enqueueEmail } from "../lib/queue";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();

const SIGNUP_WINDOW_SECONDS = 10 * 60;
const SIGNUP_MAX_ATTEMPTS = 20;
// Validacao simples: presenca de local, arroba e dominio com ponto. A confirmacao
// real do endereco fica a cargo do envio do e-mail.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
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

export default router;
