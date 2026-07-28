import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supaSpy = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: supaSpy.getSession,
      refreshSession: supaSpy.refreshSession,
    },
  },
}));

vi.mock("@/lib/api", () => ({ apiUrl: (p: string) => `https://api.test${p}` }));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

import { recordConsent } from "./consentService";

function resposta(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  supaSpy.getSession.mockResolvedValue({
    data: { session: { access_token: "tok", expires_at: 9_999_999_999 } },
  });
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Resolve a promise deixando os timers do backoff correrem. */
async function correr<T>(p: Promise<T>): Promise<
  { ok: true; value: T } | { ok: false; error: unknown }
> {
  const settled = p.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  return settled;
}

describe("recordConsent so resolve com confirmacao do servidor (item 3.2)", () => {
  it("resolve quando o corpo confirma hasConsented", async () => {
    fetchSpy.mockResolvedValue(resposta(201, { hasConsented: true }));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("envia o method no corpo", async () => {
    fetchSpy.mockResolvedValue(resposta(201, { hasConsented: true }));

    await correr(recordConsent("consent_gate_checkbox"));

    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      acceptedTerms: true,
      acceptedPrivacy: true,
      method: "consent_gate_checkbox",
    });
  });

  it("2xx SEM confirmacao no corpo NAO conta como sucesso", async () => {
    fetchSpy.mockResolvedValue(resposta(201, { hasConsented: false }));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(false);
  });

  it("erro de rede e retentado ate o limite e so entao rejeita", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(false);
    // 3 tentativas: a primeira mais as duas do backoff.
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("erro de rede que passa numa retentativa resolve com sucesso", async () => {
    fetchSpy
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(resposta(201, { hasConsented: true }));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("5xx e retentado", async () => {
    fetchSpy
      .mockResolvedValueOnce(resposta(503, {}))
      .mockResolvedValue(resposta(201, { hasConsented: true }));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("400 NAO e retentado: recusa deliberada do servidor", async () => {
    fetchSpy.mockResolvedValue(resposta(400, {}));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("401 e resolvido pelo refresh de sessao, sem gastar retry", async () => {
    // consentFetch renova a sessao uma vez e repete o mesmo request.
    supaSpy.refreshSession.mockResolvedValue({
      data: { session: { access_token: "tok2" } },
    });
    fetchSpy
      .mockResolvedValueOnce(resposta(401, {}))
      .mockResolvedValue(resposta(201, { hasConsented: true }));

    const r = await correr(recordConsent("signup_form_checkbox"));

    expect(r.ok).toBe(true);
    expect(supaSpy.refreshSession).toHaveBeenCalledTimes(1);
  });
});
