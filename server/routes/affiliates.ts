import { createHash } from "node:crypto";
import { Router } from "express";

import { AFFILIATE_CODE_PATTERN } from "../../shared/affiliateCode";
import { JANELA_DE_CADASTRO_HORAS } from "../../shared/creatorRanking";
import { recordCreatorEvent } from "../lib/creatorEvents";
import { env } from "../lib/env";
import { cacheConnection } from "../lib/redis";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth, validateSupabaseJwt } from "../middleware/auth";
import { createError } from "../middleware/error";

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

// CADASTRO PELO LINK (lote 11i). A conta nova, no primeiro acesso autenticado,
// manda o codigo que estava guardado no navegador (o mesmo `useAffiliate` que
// atribui a venda), e isso vira UM evento `signup` por conta, para sempre: o
// indice unico parcial (migration 20260922100000) e quem garante, e o 23505
// dele e lido como "ja existia", nao como erro. Regras, todas do servidor:
// codigo ativo (inexistente ou pausado e 404 generico, anti-oraculo como a
// rota publica); a conta nao pode ser a do dono do codigo; e a conta precisa
// ser NOVA, `profiles.created_at` ha no maximo JANELA_DE_CADASTRO_HORAS (o
// perfil nasce no cadastro pelo trigger de novo usuario, a milissegundos do
// auth.users.created_at, e e uma leitura indexada em vez de uma chamada a API
// de admin). O router e montado ANTES do validateSupabaseJwt global, entao a
// rota valida o JWT por conta propria. Throttle por usuario no Redis, um por
// minuto, fail-open como o do clique: o indice unico ja segura a duplicata.
const SIGNUP_WINDOW_SECONDS = 60;

router.post(
  "/signup",
  validateSupabaseJwt,
  requireAuth,
  async (req, res, next) => {
    const userId = req.user!.id;
    const corpo = (req.body ?? {}) as { code?: unknown };
    const code =
      typeof corpo.code === "string" ? normalizeCode(corpo.code) : "";
    if (!isValidCode(code)) {
      return next(
        // TODO(Ana)
        createError(404, "affiliate_not_found", "Código não encontrado."),
      );
    }
    try {
      if (cacheConnection) {
        try {
          const result = await cacheConnection.set(
            `affiliate:signup:${userId}`,
            "1",
            "EX",
            SIGNUP_WINDOW_SECONDS,
            "NX",
          );
          if (result !== "OK") {
            return next(
              // TODO(Ana)
              createError(
                429,
                "too_many_attempts",
                "Tente de novo em instantes.",
              ),
            );
          }
        } catch (err) {
          console.warn(
            "[affiliates] Throttle Redis indisponivel no signup, seguindo",
            err,
          );
        }
      }

      const { data: afiliado, error: erroAfiliado } = await supabaseAdmin
        .from("affiliates")
        .select("id, user_id")
        .eq("code", code)
        .eq("status", "active")
        .maybeSingle();
      if (erroAfiliado) throw erroAfiliado;
      const linhaAfiliado = afiliado as {
        id: string;
        user_id: string | null;
      } | null;
      if (!linhaAfiliado) {
        return next(
          // TODO(Ana)
          createError(404, "affiliate_not_found", "Código não encontrado."),
        );
      }
      if (linhaAfiliado.user_id === userId) {
        return next(
          // TODO(Ana)
          createError(
            403,
            "own_code",
            "O seu próprio código não conta como cadastro.",
          ),
        );
      }

      const { data: perfil, error: erroPerfil } = await supabaseAdmin
        .from("profiles")
        .select("created_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (erroPerfil) throw erroPerfil;
      const criadaEm = (perfil as { created_at: string } | null)?.created_at;
      const idadeMs = criadaEm ? Date.now() - Date.parse(criadaEm) : Infinity;
      if (!criadaEm || idadeMs > JANELA_DE_CADASTRO_HORAS * 60 * 60 * 1000) {
        return next(
          createError(
            409,
            "account_too_old",
            // TODO(Ana)
            "Essa conta não é nova: o cadastro pelo link só conta nas primeiras horas.",
          ),
        );
      }

      const { error: erroInsercao } = await supabaseAdmin
        .from("creator_events")
        .insert({
          affiliate_id: linhaAfiliado.id,
          event_type: "signup",
          user_id: userId,
          metadata: { origem: "cadastro" },
        });
      if (erroInsercao) {
        // 23505 no indice parcial: esta conta ja tem o seu cadastro registrado
        // (por este ou por outro codigo). Idempotente por construcao.
        if ((erroInsercao as { code?: string }).code === "23505") {
          res.status(200).json({ registrado: false });
          return;
        }
        throw erroInsercao;
      }
      res.status(201).json({ registrado: true });
    } catch (err) {
      console.error("[affiliates] Erro ao registrar cadastro pelo link", err);
      return next(
        // TODO(Ana)
        createError(500, "db_error", "Erro ao registrar o cadastro."),
      );
    }
  },
);

export default router;
