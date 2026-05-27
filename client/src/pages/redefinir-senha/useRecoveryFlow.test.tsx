import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

// ── Mock controlável do supabase ─────────────────────────────────────────────
const supa = vi.hoisted(() => {
  type Cb = (event: string, session: unknown) => void;
  const state: {
    authCb: Cb | null;
    getSession: () => Promise<{ data: { session: unknown } }>;
  } = {
    authCb: null,
    getSession: async () => ({ data: { session: null } }),
  };
  const client = {
    auth: {
      getSession: () => state.getSession(),
      onAuthStateChange: (cb: Cb) => {
        state.authCb = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  };
  return {
    client,
    emit: (event: string, session: unknown) => state.authCb?.(event, session),
    setGetSession: (impl: () => Promise<{ data: { session: unknown } }>) => {
      state.getSession = impl;
    },
    reset: () => {
      state.authCb = null;
      state.getSession = async () => ({ data: { session: null } });
    },
  };
});

// ── Mock do recoverySnapshot (flag durável capturado no load) ────────────────
const recovery = vi.hoisted(() => ({ seen: false }));

vi.mock("@/lib/supabase", () => ({ supabase: supa.client }));
vi.mock("@/lib/recoverySnapshot", () => ({ wasRecoverySeen: () => recovery.seen }));
// @/lib/authCallback NÃO é mockado: lê window.location de verdade (setado via history).

import { useRecoveryFlow, type RecoveryFlowState } from "@/pages/redefinir-senha/useRecoveryFlow";

const session = { user: { id: "u1" } };

function Probe({ sink }: { sink: { state: RecoveryFlowState } }) {
  sink.state = useRecoveryFlow();
  return null;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useRecoveryFlow — detecção de recuperação (implicit + PKCE)", () => {
  beforeEach(() => {
    supa.reset();
    recovery.seen = false;
    vi.clearAllMocks();
    vi.useRealTimers();
    window.history.replaceState({}, "", "/redefinir-senha");
  });

  afterEach(() => cleanup());

  it("PKCE: ?code= e evento PASSWORD_RECOVERY -> ready", async () => {
    window.history.replaceState({}, "", "/redefinir-senha?code=abc");
    supa.setGetSession(async () => ({ data: { session: null } }));
    const sink = { state: "checking" as RecoveryFlowState };
    render(<Probe sink={sink} />);
    await flush();
    await act(async () => {
      supa.emit("PASSWORD_RECOVERY", session);
    });
    await flush();
    expect(sink.state).toBe("ready");
  });

  it("implicit: evento já capturado no load + sessão -> ready", async () => {
    recovery.seen = true;
    supa.setGetSession(async () => ({ data: { session } }));
    const sink = { state: "checking" as RecoveryFlowState };
    render(<Probe sink={sink} />);
    await flush();
    expect(sink.state).toBe("ready");
  });

  it("logado sem recovery -> redirect-change-password (vai pra /trocar-senha)", async () => {
    recovery.seen = false;
    supa.setGetSession(async () => ({ data: { session } }));
    const sink = { state: "checking" as RecoveryFlowState };
    render(<Probe sink={sink} />);
    await flush();
    expect(sink.state).toBe("redirect-change-password");
  });

  it("erro na URL (link expirado) -> expired", async () => {
    window.history.replaceState({}, "", "/redefinir-senha?error=access_denied&error_code=otp_expired");
    supa.setGetSession(async () => ({ data: { session: null } }));
    const sink = { state: "checking" as RecoveryFlowState };
    render(<Probe sink={sink} />);
    await flush();
    expect(sink.state).toBe("expired");
  });

  it("visita direta sem link -> no-link", async () => {
    supa.setGetSession(async () => ({ data: { session: null } }));
    const sink = { state: "checking" as RecoveryFlowState };
    render(<Probe sink={sink} />);
    await flush();
    expect(sink.state).toBe("no-link");
  });

  it("callback pendente sem evento em 5s -> expired", async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/redefinir-senha?code=abc");
    supa.setGetSession(async () => ({ data: { session: null } }));
    const sink = { state: "checking" as RecoveryFlowState };
    render(<Probe sink={sink} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(sink.state).toBe("checking"); // timer armado, aguardando
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(sink.state).toBe("expired");
    vi.useRealTimers();
  });
});
