import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

// ── Mocks controlaveis de useAuth e do useLocation do wouter ─────────────────
const authState = vi.hoisted(() => ({
  value: { user: null as { id: string } | null, loading: false },
}));
const nav = vi.hoisted(() => ({ setLocation: vi.fn(), path: "/atual" }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState.value,
}));
vi.mock("wouter", () => ({
  useLocation: () => [nav.path, nav.setLocation],
}));

import AuthGateModal from "@/components/gate/AuthGateModal";
import { useAuthGate, type UseAuthGateResult } from "@/hooks/useAuthGate";
import { peekPendingGate } from "@/lib/authGate";

function Harness({ sink }: { sink: { gate: UseAuthGateResult } }) {
  const gate = useAuthGate();
  sink.gate = gate;
  return <AuthGateModal {...gate.modalProps} />;
}

function setup() {
  const sink = { gate: null as unknown as UseAuthGateResult };
  render(<Harness sink={sink} />);
  return sink;
}

const DEMO_INTENT = {
  kind: "domain" as const,
  domain: "favorite",
  payload: { id: "abc" },
};

beforeEach(() => {
  sessionStorage.clear();
  nav.setLocation.mockClear();
  nav.path = "/atual";
  authState.value = { user: null, loading: false };
});

afterEach(() => {
  cleanup();
});

describe("useAuthGate", () => {
  it("1. status reflete loading/authenticated/anonymous", () => {
    authState.value = { user: null, loading: true };
    expect(setup().gate.status).toBe("loading");
    cleanup();

    authState.value = { user: { id: "u1" }, loading: false };
    const authed = setup();
    expect(authed.gate.status).toBe("authenticated");
    expect(authed.gate.isAuthenticated).toBe(true);
    cleanup();

    authState.value = { user: null, loading: false };
    expect(setup().gate.status).toBe("anonymous");
  });

  it("2. FAIL-OPEN: loading -> gateNavigate/gateAction sao NO-OP", () => {
    authState.value = { user: null, loading: true };
    const sink = setup();

    act(() => sink.gate.gateNavigate("/x"));
    act(() => sink.gate.gateAction({ intent: DEMO_INTENT, run: vi.fn() }));

    expect(nav.setLocation).not.toHaveBeenCalled();
    expect(sink.gate.modalProps.open).toBe(false);
    expect(peekPendingGate()).toBeNull();
  });

  it("3. authenticated + gateNavigate -> navega, sem modal, sem persistir", () => {
    authState.value = { user: { id: "u1" }, loading: false };
    const sink = setup();

    act(() => sink.gate.gateNavigate("/x"));

    expect(nav.setLocation).toHaveBeenCalledWith("/x");
    expect(sink.gate.modalProps.open).toBe(false);
    expect(peekPendingGate()).toBeNull();
  });

  it("4. authenticated + gateAction -> roda run, sem modal, sem persistir", () => {
    authState.value = { user: { id: "u1" }, loading: false };
    const sink = setup();
    const run = vi.fn();

    act(() => sink.gate.gateAction({ intent: DEMO_INTENT, run }));

    expect(run).toHaveBeenCalledTimes(1);
    expect(nav.setLocation).not.toHaveBeenCalled();
    expect(sink.gate.modalProps.open).toBe(false);
    expect(peekPendingGate()).toBeNull();
  });

  it("5. anonymous + gateNavigate -> abre modal, nao navega, persiste destino", () => {
    const sink = setup();

    act(() => sink.gate.gateNavigate("/x"));

    expect(sink.gate.modalProps.open).toBe(true);
    expect(nav.setLocation).not.toHaveBeenCalled();
    expect(peekPendingGate()?.destination).toBe("/x");
  });

  it("6. anonymous + gateAction(destination) -> abre modal, nao roda run, persiste intent", () => {
    const sink = setup();
    const run = vi.fn();

    act(() =>
      sink.gate.gateAction({
        intent: DEMO_INTENT,
        run,
        destination: "/p",
      }),
    );

    expect(sink.gate.modalProps.open).toBe(true);
    expect(run).not.toHaveBeenCalled();
    const pending = peekPendingGate();
    expect(pending?.destination).toBe("/p");
    expect(pending?.intent).toEqual(DEMO_INTENT);
  });

  it("7. anonymous -> Entrar -> /login?returnTo, sem limpar, fecha modal", () => {
    const sink = setup();
    act(() => sink.gate.gateNavigate("/x"));

    act(() => {
      screen.getByRole("button", { name: "Entrar" }).click();
    });

    expect(nav.setLocation).toHaveBeenCalledWith("/login?returnTo=%2Fx");
    expect(peekPendingGate()?.destination).toBe("/x");
    expect(sink.gate.modalProps.open).toBe(false);
  });

  it("8. anonymous -> Criar conta -> /cadastro?returnTo, sem limpar, fecha modal", () => {
    const sink = setup();
    act(() => sink.gate.gateNavigate("/x"));

    act(() => {
      screen.getByRole("button", { name: "Criar conta" }).click();
    });

    expect(nav.setLocation).toHaveBeenCalledWith("/cadastro?returnTo=%2Fx");
    expect(peekPendingGate()?.destination).toBe("/x");
    expect(sink.gate.modalProps.open).toBe(false);
  });

  it("9. anonymous -> dismiss -> limpa pending, nao navega, fecha", () => {
    const sink = setup();
    act(() => sink.gate.gateNavigate("/x"));
    expect(peekPendingGate()).not.toBeNull();

    act(() => sink.gate.modalProps.onOpenChange(false));

    expect(peekPendingGate()).toBeNull();
    expect(nav.setLocation).not.toHaveBeenCalled();
    expect(sink.gate.modalProps.open).toBe(false);
  });

  it("10. BUG 2 GUARD: pending-gate ja presente NAO auto-abre o modal", () => {
    sessionStorage.setItem(
      "boranatech.pending_gate",
      JSON.stringify({ destination: "/x", timestamp: Date.now() }),
    );

    const sink = setup();

    expect(sink.gate.modalProps.open).toBe(false);
  });

  it("12. reset entre ciclos: dismiss apos um Entrar anterior ainda limpa", () => {
    // So passa por causa do reset `proceedingRef.current = false` na abertura
    // anonima do requireAuth. Guarda contra uma "limpeza" futura que remova esse
    // reset: sem ele, o proceedingRef ficaria preso em true vindo do passo 2 e o
    // dismiss do passo 4 nao limparia o pending-gate.
    const sink = setup();

    // 1. abre
    act(() => sink.gate.gateNavigate("/a"));
    expect(sink.gate.modalProps.open).toBe(true);

    // 2. Entrar (proceedingRef vira true, modal fecha, navega)
    act(() => sink.gate.modalProps.onEntrar());
    expect(nav.setLocation).toHaveBeenCalledWith("/login?returnTo=%2Fa");
    expect(sink.gate.modalProps.open).toBe(false);

    // 3. abre de novo (requireAuth reseta proceedingRef)
    act(() => sink.gate.gateNavigate("/b"));
    expect(sink.gate.modalProps.open).toBe(true);

    // 4. dismiss -> pending-gate DEVE ser limpo
    act(() => sink.gate.modalProps.onOpenChange(false));
    expect(peekPendingGate()).toBeNull();
    expect(sessionStorage.getItem("boranatech.pending_gate")).toBeNull();
    expect(sink.gate.modalProps.open).toBe(false);
  });

  it("11. BUG 1 GUARD: abrir o modal de uma instancia nao abre o da outra", () => {
    const sinkA = { gate: null as unknown as UseAuthGateResult };
    const sinkB = { gate: null as unknown as UseAuthGateResult };
    render(
      <>
        <Harness sink={sinkA} />
        <Harness sink={sinkB} />
      </>,
    );

    act(() => sinkA.gate.gateNavigate("/x"));

    expect(sinkA.gate.modalProps.open).toBe(true);
    expect(sinkB.gate.modalProps.open).toBe(false);
  });
});
