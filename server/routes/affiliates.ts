import { Router } from "express";

import { redisConnection } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();
const CLICK_WINDOW_SECONDS = 60 * 60;
const CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function isValidCode(code: string) {
  return CODE_PATTERN.test(code);
}

router.get("/:code", async (req, res) => {
  try {
    const code = normalizeCode(req.params.code);
    if (!isValidCode(code)) {
      res.json({ valid: false });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("affiliates")
      .select("code, discount_percent")
      .eq("code", code)
      .eq("status", "active")
      .maybeSingle();

    if (error || !data) {
      res.json({ valid: false });
      return;
    }

    res.json({
      valid: true,
      code: data.code,
      discount_percent: data.discount_percent,
    });
  } catch (err) {
    console.error("[affiliates] Erro ao validar cupom", err);
    res.json({ valid: false });
  }
});

router.post("/:code/click", async (req, res) => {
  // Resposta sempre identica (sucesso generico), sem distinguir codigo valido,
  // invalido ou throttled, pra nao virar oraculo de existencia de cupom.
  try {
    const code = normalizeCode(req.params.code);
    if (!isValidCode(code)) {
      res.json({ recorded: true });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Throttle por ip:code no Redis, TTL igual a janela. Fail-open: sem Redis
    // ou em erro, registra o clique mesmo assim, sem derrubar pelo cache.
    // SET NX EX e usado no lugar de SETEX puro porque precisamos detectar de
    // forma atomica o primeiro clique da janela (NX) alem de aplicar o TTL.
    let shouldCount = true;
    if (redisConnection) {
      try {
        const key = `affiliate:click:${ip}:${code}`;
        const result = await redisConnection.set(
          key,
          "1",
          "EX",
          CLICK_WINDOW_SECONDS,
          "NX",
        );
        shouldCount = result === "OK";
      } catch (err) {
        console.warn(
          "[affiliates] Throttle Redis indisponivel, seguindo sem throttle",
          err,
        );
      }
    }

    if (shouldCount) {
      // Incremento atomico via RPC evita lost update do read-then-write.
      // Erro ou codigo inexistente/inativo e ignorado de proposito (a RPC so
      // conta codigos ativos) pra manter a resposta generica.
      const { error } = await supabaseAdmin.rpc("increment_affiliate_clicks", {
        p_code: code,
      });
      if (error) {
        console.warn("[affiliates] Falha ao incrementar cliques", error);
      }
    }

    res.json({ recorded: true });
  } catch (err) {
    console.error("[affiliates] Erro ao registrar clique", err);
    res.json({ recorded: true });
  }
});

export default router;
