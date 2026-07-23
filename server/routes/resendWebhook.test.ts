import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Svix mockado: Webhook.verify controlavel. vi.hoisted pra ser referenciado na
// factory do vi.mock (que sobe antes dos imports).
const svixState = vi.hoisted(() => ({
  verify: (..._args: unknown[]): unknown => ({}),
}));
vi.mock("svix", () => ({
  Webhook: class {
    verify(...args: unknown[]) {
      return svixState.verify(...args);
    }
  },
}));

// env com o secret presente por padrao; getter dinamico pra flipar pro caso 503.
const envState = vi.hoisted(() => ({ secret: "whsec_test" }));
vi.mock("../lib/env", () => ({
  env: {
    get resendWebhookSecret() {
      return envState.secret;
    },
  },
}));

// supabaseAdmin mockado: from(table).upsert(...) e rpc(...) controlaveis e
// espionaveis. Registram os argumentos pra asserir o que o handler envia.
const dbState = vi.hoisted(() => ({
  upsert: vi.fn((..._args: unknown[]) => Promise.resolve({ error: null })),
  rpc: vi.fn((..._args: unknown[]) => Promise.resolve({ error: null })),
}));
vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (_table: string) => ({
      upsert: (...args: unknown[]) => dbState.upsert(...args),
    }),
    rpc: (...args: unknown[]) => dbState.rpc(...args),
  },
}));

import { handleResendWebhook, parseResendEvent } from "./resendWebhook";

function makeReq(overrides?: {
  headers?: Record<string, string | string[] | undefined>;
  rawBody?: Buffer | undefined;
}): Request {
  return {
    headers: {
      "svix-id": "evt_1",
      "svix-timestamp": "1700000000",
      "svix-signature": "v1,sig",
      ...(overrides?.headers ?? {}),
    },
    rawBody:
      overrides && "rawBody" in overrides
        ? overrides.rawBody
        : Buffer.from("{}"),
  } as unknown as Request;
}

function makeRes(): Response & { json: ReturnType<typeof vi.fn> } {
  return { json: vi.fn() } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
  };
}

const BOUNCE_PAYLOAD = {
  type: "email.bounced",
  data: {
    email_id: "em_123",
    to: "dead@invalid-domain.com",
    bounce: { type: "Permanent" },
  },
};

describe("parseResendEvent", () => {
  it("le email_id, to (string) em lower e bounce.type", () => {
    expect(parseResendEvent(BOUNCE_PAYLOAD)).toEqual({
      eventType: "email.bounced",
      messageId: "em_123",
      email: "dead@invalid-domain.com",
      bounceType: "Permanent",
    });
  });

  it("normaliza to em array pegando o primeiro em lower", () => {
    const parsed = parseResendEvent({
      type: "email.complained",
      data: { email_id: "em_9", to: ["Spam@Report.COM", "outro@x.com"] },
    });
    expect(parsed.email).toBe("spam@report.com");
    expect(parsed.bounceType).toBeNull();
  });

  it("cai pra data.id quando email_id ausente; message_id null quando faltam os dois", () => {
    expect(parseResendEvent({ data: { id: "em_fb", to: "a@b.com" } }).messageId).toBe(
      "em_fb",
    );
    expect(parseResendEvent({ data: { to: "a@b.com" } }).messageId).toBeNull();
  });
});

describe("handleResendWebhook", () => {
  beforeEach(() => {
    envState.secret = "whsec_test";
    svixState.verify = () => BOUNCE_PAYLOAD;
    dbState.upsert.mockClear();
    dbState.rpc.mockClear();
    dbState.upsert.mockImplementation(() => Promise.resolve({ error: null }));
    dbState.rpc.mockImplementation(() => Promise.resolve({ error: null }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("assinatura valida: persiste o evento e delega o apply, respondendo 2xx", async () => {
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handleResendWebhook(makeReq(), res, next);

    // Persistiu o evento com os campos extraidos e idempotencia por svix-id.
    expect(dbState.upsert).toHaveBeenCalledTimes(1);
    const [row, options] = dbState.upsert.mock.calls[0];
    expect(row).toMatchObject({
      id: "evt_1",
      event_type: "email.bounced",
      message_id: "em_123",
      email: "dead@invalid-domain.com",
      bounce_type: "Permanent",
    });
    expect(options).toEqual({ onConflict: "id", ignoreDuplicates: true });

    // Delegou o apply para a RPC idempotente (nao reimplementa em TS).
    expect(dbState.rpc).toHaveBeenCalledWith("resend_apply_event", {
      p_event_id: "evt_1",
    });

    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("assinatura invalida: 400 e nao toca no banco", async () => {
    svixState.verify = () => {
      throw new Error("No matching signature found");
    };
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handleResendWebhook(makeReq(), res, next);

    const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(dbState.upsert).not.toHaveBeenCalled();
    expect(dbState.rpc).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("secret ausente: 503 antes de qualquer processamento", async () => {
    envState.secret = "";
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handleResendWebhook(makeReq(), res, next);

    const err = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err.statusCode).toBe(503);
    expect(dbState.upsert).not.toHaveBeenCalled();
    expect(dbState.rpc).not.toHaveBeenCalled();
  });

  it("evento duplicado: upsert ignoreDuplicates + apply idempotente evitam dupla contagem", async () => {
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    // Duas entregas do MESMO svix-id (reentrega do Svix). O insert usa
    // ignoreDuplicates (segunda e no-op no banco) e o apply e guardado pela flag
    // applied na RPC: a contagem real de bounce acontece uma vez so (no SQL).
    await handleResendWebhook(makeReq(), res, next);
    await handleResendWebhook(makeReq(), res, next);

    expect(dbState.upsert).toHaveBeenCalledTimes(2);
    for (const call of dbState.upsert.mock.calls) {
      expect(call[0]).toMatchObject({ id: "evt_1" });
      expect(call[1]).toEqual({ onConflict: "id", ignoreDuplicates: true });
    }
    expect(next).not.toHaveBeenCalled();
  });

  it("recipient inexistente: ainda delega o apply (supressao por e-mail no SQL)", async () => {
    // O handler nao consulta recipient: sempre chama resend_apply_event, que
    // suprime pelo e-mail mesmo sem linha de recipient (bounce de transacional).
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handleResendWebhook(makeReq(), res, next);

    expect(dbState.rpc).toHaveBeenCalledWith("resend_apply_event", {
      p_event_id: "evt_1",
    });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
