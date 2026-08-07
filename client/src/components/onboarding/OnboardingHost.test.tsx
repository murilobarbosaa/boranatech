import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OnboardingCoordinatorProvider,
  useOnboardingCoordinator,
} from "@/lib/onboarding/coordinator";
import type { Profile } from "@/services/contracts";
import OnboardingHost from "./OnboardingHost";

// Host + coordenacao. O ponto do arquivo e o invariante que a tarefa pediu para
// ser EXPLICITO e testavel: se o onboarding da rota abrir nesta carga, o
// SuperInterstitial nao abre, e enquanto o host nao decidiu, ninguem abre.

const updateMyProfile = vi.fn();
vi.mock("@/services/profileService", () => ({
  updateMyProfile: (updates: Record<string, unknown>) =>
    updateMyProfile(updates),
}));

type AuthState = {
  user: { id: string } | null;
  profile: Profile | null;
  profileStatus: "idle" | "loading" | "ready" | "error";
  loading: boolean;
};

let auth: AuthState;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

/** Sonda: expoe a decisao do coordenador como texto. */
function Sonda() {
  const { decision, superInterstitialAllowed } = useOnboardingCoordinator();
  return (
    <p data-testid="sonda">
      {decision}:{superInterstitialAllowed ? "super-ok" : "super-bloqueado"}
    </p>
  );
}

function montar(path: string) {
  const { hook, navigate } = memoryLocation({ path });
  return {
    ...render(
      <Router hook={hook}>
        <OnboardingCoordinatorProvider>
          <OnboardingHost />
          <Sonda />
        </OnboardingCoordinatorProvider>
      </Router>,
    ),
    navigate,
  };
}

const sonda = () => screen.getByTestId("sonda").textContent;
const overlay = () => document.querySelector(".bnt-onb");

beforeEach(() => {
  window.localStorage.clear();
  updateMyProfile.mockReset();
  updateMyProfile.mockResolvedValue({});
  auth = { user: null, profile: null, profileStatus: "idle", loading: false };
});

afterEach(() => {
  cleanup();
});

describe("OnboardingHost: abertura", () => {
  it("abre na home para anonimo que nunca viu", async () => {
    montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());
    expect(screen.getByText("Essa é a sua bússola pra tech")).toBeInstanceOf(
      HTMLElement,
    );
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });

  it("nao abre em rota classificada como sem-onboarding", async () => {
    montar("/login");
    await waitFor(() => expect(sonda()).toBe("free:super-ok"));
    expect(overlay()).toBeNull();
  });

  it("nao abre em rota pendente", async () => {
    montar("/cursos");
    await waitFor(() => expect(sonda()).toBe("free:super-ok"));
    expect(overlay()).toBeNull();
  });

  it("nao abre para quem ja viu (localStorage)", async () => {
    window.localStorage.setItem(
      "bnt_onb:/",
      JSON.stringify({ seen: true, how: "pulado", at: "2026-08-01T00:00:00Z" }),
    );
    montar("/");
    await waitFor(() => expect(sonda()).toBe("free:super-ok"));
    expect(overlay()).toBeNull();
  });

  it("nao abre para quem ja viu (preferences do perfil)", async () => {
    auth = {
      user: { id: "u1" },
      profile: {
        id: "u1",
        preferences: {
          onboardings: {
            "/": { seen: true, how: "concluido", at: "2026-08-01T00:00:00Z" },
          },
        },
      } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    montar("/");
    await waitFor(() => expect(sonda()).toBe("free:super-ok"));
    expect(overlay()).toBeNull();
  });

  it("nunca abre sob automacao (navigator.webdriver)", async () => {
    const original = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      "webdriver",
    );
    Object.defineProperty(navigator, "webdriver", {
      value: true,
      configurable: true,
    });
    try {
      montar("/");
      await waitFor(() => expect(sonda()).toBe("free:super-ok"));
      expect(overlay()).toBeNull();
    } finally {
      if (original)
        Object.defineProperty(Navigator.prototype, "webdriver", original);
      else
        Object.defineProperty(navigator, "webdriver", {
          value: false,
          configurable: true,
        });
    }
  });
});

describe("OnboardingHost: navegacao com o overlay aberto", () => {
  it("sair no meio fecha SEM marcar como visto, e voltar reabre", async () => {
    const { navigate } = montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());

    const { act } = await import("@testing-library/react");
    act(() => navigate("/cursos"));

    await waitFor(() => expect(overlay()).toBeNull());
    // Nada foi persistido: sair da pagina nao e uma decisao.
    expect(window.localStorage.getItem("bnt_onb:/")).toBeNull();
    expect(updateMyProfile).not.toHaveBeenCalled();

    act(() => navigate("/"));
    await waitFor(() => expect(overlay()).not.toBeNull());
  });

  it("depois de ENCERRAR, voltar para a rota nao reabre", async () => {
    const { navigate } = montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());

    const { act, fireEvent } = await import("@testing-library/react");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(overlay()).toBeNull());
    expect(window.localStorage.getItem("bnt_onb:/")).not.toBeNull();

    act(() => navigate("/cursos"));
    act(() => navigate("/"));
    await waitFor(() => expect(sonda()).toBe("onboarding:super-bloqueado"));
    expect(overlay()).toBeNull();
  });
});

describe("OnboardingHost: espera o AuthContext resolver", () => {
  it("fica em 'deciding' enquanto o perfil do logado nao chegou", async () => {
    auth = {
      user: { id: "u1" },
      profile: null,
      profileStatus: "loading",
      loading: false,
    };
    const { rerender } = montar("/");

    // Ninguem abre nesta janela: nem o onboarding (nao sabe se a pessoa ja
    // viu), nem o SuperInterstitial (o coordenador ainda nao liberou).
    await waitFor(() => expect(sonda()).toBe("deciding:super-bloqueado"));
    expect(overlay()).toBeNull();

    auth = {
      user: { id: "u1" },
      profile: { id: "u1", preferences: {} } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    const { hook } = memoryLocation({ path: "/" });
    rerender(
      <Router hook={hook}>
        <OnboardingCoordinatorProvider>
          <OnboardingHost />
          <Sonda />
        </OnboardingCoordinatorProvider>
      </Router>,
    );

    await waitFor(() => expect(overlay()).not.toBeNull());
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });

  it("perfil em erro tambem resolve: o overlay nao fica preso", async () => {
    auth = {
      user: { id: "u1" },
      profile: null,
      profileStatus: "error",
      loading: false,
    };
    montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());
  });
});

describe("OnboardingHost: persistencia", () => {
  it("concluir grava o registro (anonimo -> localStorage) e fecha", async () => {
    montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());

    const { fireEvent } = await import("@testing-library/react");
    const next = () =>
      document.querySelector<HTMLButtonElement>(".next") as HTMLButtonElement;
    for (let i = 0; i < 5; i += 1) fireEvent.click(next());
    fireEvent.click(next());

    await waitFor(() => expect(overlay()).toBeNull());

    const raw = window.localStorage.getItem("bnt_onb:/");
    expect(raw).not.toBeNull();
    const record = JSON.parse(raw as string) as Record<string, unknown>;
    expect(record.seen).toBe(true);
    expect(record.how).toBe("concluido");
    expect(typeof record.at).toBe("string");
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it("pular no logado grava em preferences via read-modify-write", async () => {
    auth = {
      user: { id: "u1" },
      profile: {
        id: "u1",
        preferences: { tema: "escuro" },
      } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(
      document.querySelectorAll<HTMLButtonElement>(".side .ghost")[1],
    );

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1));
    const payload = updateMyProfile.mock.calls[0][0] as {
      preferences: Record<string, unknown>;
    };
    // O `tema` sobrevive: o PATCH sobrescreve `preferences` inteiro.
    expect(payload.preferences.tema).toBe("escuro");
    expect(payload.preferences.onboardings).toMatchObject({
      "/": { seen: true, how: "pulado" },
    });
  });
});

describe("coordenacao com o SuperInterstitial", () => {
  it("o default sem provider e permissivo", () => {
    render(<Sonda />);
    expect(sonda()).toBe("free:super-ok");
  });

  it("reivindicado na home, o super continua bloqueado depois de fechar", async () => {
    montar("/");
    await waitFor(() => expect(overlay()).not.toBeNull());

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(overlay()).toBeNull());

    // A reivindicacao vale para a CARGA inteira: fechar o onboarding nao
    // devolve a vez ao SuperInterstitial nesta mesma sessao de pagina.
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });
});
