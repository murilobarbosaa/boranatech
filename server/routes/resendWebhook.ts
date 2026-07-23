import { Router, type NextFunction, type Request, type Response } from "express";
import { Webhook } from "svix";

import type { Json } from "../../shared/database.types";
import { env } from "../lib/env";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

// Webhook do Resend (eventos de entrega: email.bounced, email.complained). A
// assinatura e Svix (headers svix-*). O apply real (supressao, delivery_status,
// contadores) vive na RPC resend_apply_event (Etapa 2); aqui so verificamos,
// persistimos o evento (idempotente) e delegamos.

// Payload defensivo: ainda nao temos evento real, entao lemos com fallback e
// persistimos o payload cru inteiro em resend_events.payload para validar os
// nomes de campo no primeiro evento que chegar.
type ResendEventData = {
  email_id?: unknown;
  id?: unknown;
  to?: unknown;
  bounce?: { type?: unknown } | null;
};
type ResendEvent = {
  type?: unknown;
  data?: ResendEventData | null;
};

export type ParsedResendEvent = {
  eventType: string;
  messageId: string | null;
  email: string | null;
  bounceType: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

// Extracao defensiva. message_id: data.email_id com fallback para data.id.
// Destinatario: data.to string OU array, primeiro endereco em lower. bounce_type:
// data.bounce.type quando existir (ausencia tratada como permanente no apply).
export function parseResendEvent(payload: unknown): ParsedResendEvent {
  const event = (payload ?? {}) as ResendEvent;
  const data = (event.data ?? {}) as ResendEventData;

  const eventType = asString(event.type) ?? "unknown";
  const messageId = asString(data.email_id) ?? asString(data.id);

  const toRaw = Array.isArray(data.to) ? data.to[0] : data.to;
  const emailStr = asString(toRaw);
  const email = emailStr ? emailStr.trim().toLowerCase() : null;

  const bounceType = asString(data.bounce?.type);

  return { eventType, messageId, email, bounceType };
}

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export async function handleResendWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Secret ausente: 503, nada mais quebra (padrao resendApiKey).
  if (!env.resendWebhookSecret) {
    console.error(
      "[webhook/resend] RESEND_WEBHOOK_SECRET ausente, respondendo 503.",
    );
    return next(createError(503, "webhook_disabled", "Webhook desabilitado."));
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    return next(createError(400, "bad_request", "Corpo do webhook ausente."));
  }

  // Verificacao Svix: assinatura invalida -> 400, sem processar. A lib exige os
  // tres headers svix-*; sem eles, verify() lanca e caimos no 400.
  let payload: unknown;
  try {
    const wh = new Webhook(env.resendWebhookSecret);
    payload = wh.verify(rawBody.toString("utf8"), {
      "svix-id": headerValue(req.headers["svix-id"]),
      "svix-timestamp": headerValue(req.headers["svix-timestamp"]),
      "svix-signature": headerValue(req.headers["svix-signature"]),
    });
  } catch (err) {
    console.error(
      "[webhook/resend] Assinatura invalida:",
      err instanceof Error ? err.message : String(err),
    );
    return next(
      createError(400, "invalid_signature", "Assinatura do webhook inválida."),
    );
  }

  // svix-id: id unico da entrega do evento, chave de idempotencia (pk de
  // resend_events). Presente porque a verificacao acima exige os headers svix-*.
  const svixId = headerValue(req.headers["svix-id"]);

  const { eventType, messageId, email, bounceType } = parseResendEvent(payload);
  if (!messageId) {
    console.warn(
      `[webhook/resend] evento ${svixId} (${eventType}) sem email_id/id; segue so com supressao por e-mail se aplicavel.`,
    );
  }

  // Idempotencia: insert com pk = svix-id; conflito = no-op (ignoreDuplicates).
  const { error: insertError } = await supabaseAdmin.from("resend_events").upsert(
    {
      id: svixId,
      event_type: eventType,
      message_id: messageId,
      email,
      bounce_type: bounceType,
      payload: payload as Json,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (insertError) {
    // Falha de banco NAO e "evento ignorado": propaga 500 pro Svix re-tentar (a
    // idempotencia por svix-id evita dupla contagem no retry).
    console.error("[webhook/resend] Falha ao gravar evento:", insertError);
    return next(
      createError(500, "db_error", "Falha ao registrar o evento do webhook."),
    );
  }

  // Apply na fonte unica (Etapa 2): suprime o e-mail (mesmo sem recipient,
  // cobrindo bounce de transacional), estampa delivery_status e conta bounce/
  // complaint. Chamar sempre e seguro: a flag applied guarda contra dupla
  // aplicacao do evento repetido.
  const { error: applyError } = await supabaseAdmin.rpc("resend_apply_event", {
    p_event_id: svixId,
  });
  if (applyError) {
    console.error("[webhook/resend] Falha ao aplicar evento:", applyError);
    return next(
      createError(500, "apply_error", "Falha ao aplicar o evento do webhook."),
    );
  }

  // 2xx para todo evento valido, inclusive tipos nao reconhecidos (o apply os
  // trata como no-op), pra nao gerar retry desnecessario do Svix.
  res.json({ ok: true });
}

const router = Router();
router.post("/", handleResendWebhook);
export default router;
