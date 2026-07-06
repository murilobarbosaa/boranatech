import { beforeEach, describe, expect, it } from "vitest";

import {
  clearPendingGate,
  consumePendingGate,
  peekPendingGate,
  savePendingGate,
  type PendingGate,
} from "@/lib/authGate";

const STORAGE_KEY = "boranatech.pending_gate";
const LEGACY_KEY = "boranatech.pending_intent";
const TTL_MS = 5 * 60 * 1000;

beforeEach(() => {
  sessionStorage.clear();
});

describe("authGate store", () => {
  it("save -> peek retorna; consume retorna e remove", () => {
    savePendingGate({ destination: "/x" });

    const peeked = peekPendingGate();
    expect(peeked?.destination).toBe("/x");

    // peek nao remove
    expect(peekPendingGate()?.destination).toBe("/x");

    const consumed = consumePendingGate();
    expect(consumed?.destination).toBe("/x");

    // consume removeu
    expect(peekPendingGate()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("preserva a intent junto do destino", () => {
    savePendingGate({
      destination: "/p",
      intent: { kind: "domain", domain: "favorite", payload: { id: "abc" } },
    });

    const peeked = peekPendingGate();
    expect(peeked?.intent).toEqual({
      kind: "domain",
      domain: "favorite",
      payload: { id: "abc" },
    });
  });

  it("registro expirado -> consume retorna null e remove", () => {
    const stale: PendingGate = {
      destination: "/x",
      timestamp: Date.now() - (TTL_MS + 1_000),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stale));

    expect(consumePendingGate()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("registro expirado -> peek retorna null e remove o expirado", () => {
    const stale: PendingGate = {
      destination: "/x",
      timestamp: Date.now() - (TTL_MS + 1_000),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stale));

    expect(peekPendingGate()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saneamento: destino externo/invalido nao persiste e retorna null", () => {
    expect(savePendingGate({ destination: "http://x" })).toBeNull();
    expect(peekPendingGate()).toBeNull();

    expect(savePendingGate({ destination: "//x" })).toBeNull();
    expect(peekPendingGate()).toBeNull();

    expect(savePendingGate({ destination: "/\\x" })).toBeNull();
    expect(peekPendingGate()).toBeNull();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("destino valido -> retorna o gate saneado com destination", () => {
    const result = savePendingGate({ destination: "/x" });
    expect(result?.destination).toBe("/x");
  });

  it("saneamento: navigate.to invalido descarta so a intent, mantem o gate", () => {
    savePendingGate({
      destination: "/ok",
      intent: { kind: "navigate", to: "http://evil" },
    });

    const peeked = peekPendingGate();
    expect(peeked?.destination).toBe("/ok");
    expect(peeked?.intent).toBeUndefined();
  });

  it("usa a chave nova e nao toca na chave legada", () => {
    sessionStorage.setItem(LEGACY_KEY, "intacto");

    savePendingGate({ destination: "/x" });

    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(sessionStorage.getItem(LEGACY_KEY)).toBe("intacto");

    clearPendingGate();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    // clear do gate nao mexe na legada
    expect(sessionStorage.getItem(LEGACY_KEY)).toBe("intacto");
  });
});
