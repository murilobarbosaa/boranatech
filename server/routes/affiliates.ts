import { createHash } from "node:crypto";
import { Router } from "express";

import { AFFILIATE_CODE_PATTERN } from "../../shared/affiliateCode";
import { recordCreatorEvent } from "../lib/creatorEvents";
import { env } from "../lib/env";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();
const CLICK_WINDOW_SECONDS = 60 * 60;
// Fonte unica em shared/: o formulario de criar codigo do admin valida com o
// mesmo padrao, e duas copias divergiriam na primeira mudanca.
const CODE_PATTERN = AFFILIATE_CODE_PATTERN;
// Teto dos campos de texto livre que vao para o metadata do evento de clique.
// Vem do navegador de quem clicou, entao nao pode ter tamanho arbitrario.
const TETO_CAMPO_EVENTO = 512;

function textoDoEvento(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  return valor.slice(0, TETO_CAMPO_EVENTO);
}

// Caminho da pagina do clique: SO caminho relativo ao site, comecando com "/"
// e sem espaco em branco. Qualquer outra coisa (URL absoluta, texto livre)
// vira null: o campo e da query string publica e nao pode virar deposito de
// URL arbitraria. Mesmo teto dos outros campos.
const CAMINHO_DO_EVENTO = /^\/\S*$/;

function caminhoDoEvento(valor: unknown): string | null {
  if (typeof valor !== "string" || !CAMINHO_DO_EVENTO.test(valor)) return null;
  return valor.slice(0, TETO_CAMPO_EVENTO);
}

// O IP NUNCA vai em claro para creator_events. Sem o sal configurado, o hash
// seria reversivel por forca bruta (o espaco de IPv4 e pequeno), entao a
// ausencia de CREATOR_EVENTS_SALT grava null em vez de um hash fraco.
function ipHashDe(ip: string): string | null {
  if (!env.creatorEventsSalt || ip === "unknown") return null;
  return createHash("sha256")
    .update(`${env.creatorEventsSalt}:${ip}`, "utf8")
    .digest("hex");
}

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
    // cacheConnection (fail-fast): com Redis fora o comando rejeita rapido e o
    // catch libera; a conexao de fila penduraria a rota na offline queue.
    let shouldCount = true;
    if (cacheConnection) {
      try {
        const key = `affiliate:click:${ip}:${code}`;
        const result = await cacheConnection.set(
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
      } else {
        // EVENTO ao lado do contador, e SO quando o clique contou: passou no
        // dedup acima e a RPC nao falhou. Sem essa amarracao a serie por dia
        // do painel divergiria de affiliates.clicks.
        //
        // A RPC so incrementa codigo ATIVO e nao diz se incrementou. A busca
        // do id usa o MESMO filtro, entao codigo inexistente ou pausado nao
        // gera evento, como nao gera clique.
        const { data: afiliado, error: lookupError } = await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("code", code)
          .eq("status", "active")
          .maybeSingle();
        if (lookupError) {
          console.warn(
            "[affiliates] Falha ao buscar afiliado para o evento de clique",
            lookupError,
          );
        } else if (afiliado) {
          await recordCreatorEvent({
            eventType: "click",
            affiliateId: afiliado.id,
            metadata: {
              ip_hash: ipHashDe(ip),
              user_agent: textoDoEvento(req.get("user-agent")),
              referer: textoDoEvento(req.get("referer")),
              // O client manda o caminho da pagina na query string, e nao no
              // corpo: um corpo JSON num POST entre origens dispararia
              // preflight de CORS. O Referer nao serve para isso, porque entre
              // origens o navegador so envia a origem.
              path: caminhoDoEvento(req.query.path),
            },
          });
        }
      }
    }

    res.json({ recorded: true });
  } catch (err) {
    console.error("[affiliates] Erro ao registrar clique", err);
    res.json({ recorded: true });
  }
});

export default router;
